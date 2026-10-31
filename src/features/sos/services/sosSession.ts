import { listMyActiveRides } from '@/features/offer-ride/api';
import { trackingSocket } from '@/services/realtime';
import { authSession } from '@/store';
import { showAppAlert } from '@/shared/utils';

import { getRideSos, triggerRideSos } from '../api/sos.api';
import { unwrapSosEvent } from '../api/sos.unwrap';
import type { SosRecord } from '../api/sos.types';
import { SOS_COPY } from '../constants/sos.constants';
import { sosStore } from '../store/sos.store';
import { sosAlertSound } from '../sound/sosAlertSound';
import {
  clearSosIdempotencyKey,
  getOrCreateSosIdempotencyKey,
} from '../utils/sos.idempotency';
import {
  isSosAlreadyActiveError,
  mapSosTriggerError,
  SOS_ERROR_MESSAGES,
} from '../utils/sos.errors';
import { readSosCoordinate } from '../utils/sos.location';
import {
  shouldNotifyCoPassenger,
  shouldPlayEmergencySound,
  shouldPresentDriverAlert,
  isTerminalSosStatus,
} from '../utils/sos.policy';
import { sosLocationPublisher } from './sosLocationPublisher';

const SOS_EVENTS = [
  'sos:driver-alert',
  'sos:passenger-alert',
  'sos:triggered',
  'sos:additional-trigger',
  'sos:acknowledged',
  'sos:responding',
  'sos:resolved',
  'sos:false-alarm',
  'sos:location-updated',
] as const;

let started = false;
let unsubSos: (() => void) | null = null;
let unsubReconnect: (() => void) | null = null;
let joinedRideIds = new Set<string>();
let recoverTimer: ReturnType<typeof setTimeout> | null = null;
let triggerInFlight = new Set<string>();

const currentUserId = (): string | null => authSession.getUser()?.id?.trim() || null;

const syncLocationPublisher = async (): Promise<void> => {
  const snapshot = sosStore.get();
  if (snapshot.sosId && snapshot.rideId && !isTerminalSosStatus(snapshot.status)) {
    await sosLocationPublisher.start(snapshot.rideId);
    return;
  }
  await sosLocationPublisher.stop();
};

const applyActiveRecord = async (
  record: SosRecord,
  options?: { currentUserTriggered?: boolean },
): Promise<void> => {
  sosStore.applyRecord(record, options);
  if (record.rideId) {
    trackingSocket.joinRideRoom(record.rideId);
    joinedRideIds.add(record.rideId);
  }
  await syncLocationPublisher();
};

const recoverRide = async (rideId: string): Promise<SosRecord | null> => {
  try {
    const record = await getRideSos(rideId);
    if (!record || isTerminalSosStatus(record.status)) {
      const snapshot = sosStore.get();
      if (snapshot.rideId === rideId) {
        sosStore.reset();
        await sosLocationPublisher.stop();
      }
      return record;
    }
    await applyActiveRecord(record);
    return record;
  } catch {
    return null;
  }
};

const recoverActiveRides = async (): Promise<void> => {
  if (!authSession.isAuthenticated()) {
    return;
  }
  trackingSocket.ensureConnected();
  try {
    const { items } = await listMyActiveRides();
    const rideIds = items.map((item) => item.rideId.trim()).filter(Boolean);
    const nextJoined = new Set<string>();
    let found: SosRecord | null = null;
    for (const rideId of rideIds) {
      trackingSocket.joinRideRoom(rideId);
      nextJoined.add(rideId);
      try {
        const record = await getRideSos(rideId);
        if (record && !isTerminalSosStatus(record.status)) {
          found = record;
        }
      } catch {
        // Keep looking; a single ride failure should not drop an SOS on another ride.
      }
    }
    joinedRideIds.forEach((rideId) => {
      if (!nextJoined.has(rideId)) {
        trackingSocket.leaveRideRoom(rideId);
      }
    });
    joinedRideIds = nextJoined;
    if (found) {
      await applyActiveRecord(found);
      return;
    }
    const snapshot = sosStore.get();
    if (snapshot.rideId && !nextJoined.has(snapshot.rideId)) {
      sosStore.reset();
      await sosLocationPublisher.stop();
    } else if (snapshot.rideId) {
      await recoverRide(snapshot.rideId);
    }
  } catch {
    const snapshot = sosStore.get();
    if (snapshot.rideId) {
      await recoverRide(snapshot.rideId);
    }
  }
};

const scheduleRecover = (): void => {
  if (recoverTimer) {
    clearTimeout(recoverTimer);
  }
  recoverTimer = setTimeout(() => {
    recoverTimer = null;
    void recoverActiveRides();
  }, 400);
};

const presentDriverAlertIfNeeded = async (
  record: SosRecord,
  source: 'socket' | 'rest' | 'push',
): Promise<void> => {
  const snapshot = sosStore.get();
  if (
    !shouldPresentDriverAlert({
      sosId: record.id,
      source,
      seenAlertSosIds: snapshot.seenAlertSosIds,
    })
  ) {
    return;
  }
  sosStore.presentDriverAlert(record.id);
  if (
    shouldPlayEmergencySound({
      sosId: record.id,
      source,
      seenSoundSosIds: snapshot.seenSoundSosIds,
    })
  ) {
    sosStore.markSoundPlayed(record.id);
    await sosAlertSound.start(record.id);
  }
};

const presentPassengerAlertIfNeeded = (record: SosRecord): void => {
  const snapshot = sosStore.get();
  if (
    !shouldNotifyCoPassenger({
      sosId: record.id,
      currentUserTriggered: snapshot.currentUserTriggered,
      currentUserId: currentUserId(),
      triggererUserId: record.triggerer?.userId ?? snapshot.triggererUserId,
      seenPassengerAlertSosIds: snapshot.seenPassengerAlertSosIds,
    })
  ) {
    return;
  }
  sosStore.markPassengerAlerted(record.id);
  showAppAlert(SOS_COPY.passengerAlertTitle, SOS_COPY.passengerAlertMessage);
};

const handleSocketEvent = async (eventName: string, payload: unknown): Promise<void> => {
  if (eventName === 'sos:location-updated') {
    return;
  }
  const record = unwrapSosEvent(eventName, payload);
  if (!record) {
    return;
  }

  if (isTerminalSosStatus(record.status) || eventName === 'sos:resolved' || eventName === 'sos:false-alarm') {
    const snapshot = sosStore.get();
    if (snapshot.sosId && snapshot.sosId !== record.id) {
      return;
    }
    await sosAlertSound.stop();
    sosStore.dismissDriverAlert(record.id);
    sosStore.applyRecord({ ...record, status: eventName === 'sos:false-alarm' ? 'FALSE_ALARM' : 'RESOLVED' });
    await sosLocationPublisher.stop();
    return;
  }

  await applyActiveRecord(record);

  if (eventName === 'sos:driver-alert') {
    await presentDriverAlertIfNeeded(record, 'socket');
    return;
  }
  if (eventName === 'sos:passenger-alert') {
    presentPassengerAlertIfNeeded(record);
  }
};

const showTriggerResult = (record: SosRecord): void => {
  if (record.attachedToExisting) {
    showAppAlert(SOS_COPY.attachedTitle, SOS_COPY.attachedMessage);
    return;
  }
  showAppAlert(SOS_COPY.successTitle, SOS_COPY.successMessage, undefined, 'success');
};

export const sosSession = {
  start: (): void => {
    if (started) {
      return;
    }
    started = true;
    trackingSocket.ensureConnected();
    unsubSos = trackingSocket.subscribeSos((eventName, payload) => {
      void handleSocketEvent(eventName, payload);
    });
    unsubReconnect = trackingSocket.subscribeReconnect(() => {
      scheduleRecover();
    });
    void recoverActiveRides();
  },

  stop: async (): Promise<void> => {
    started = false;
    if (recoverTimer) {
      clearTimeout(recoverTimer);
      recoverTimer = null;
    }
    unsubSos?.();
    unsubSos = null;
    unsubReconnect?.();
    unsubReconnect = null;
    joinedRideIds.forEach((rideId) => trackingSocket.leaveRideRoom(rideId));
    joinedRideIds = new Set();
    await sosAlertSound.stop();
    await sosLocationPublisher.stop();
    sosStore.reset();
  },

  recover: (): void => {
    scheduleRecover();
  },

  recoverRide: recoverRide,

  dismissDriverAlert: async (sosId?: string): Promise<void> => {
    await sosAlertSound.stop();
    sosStore.dismissDriverAlert(sosId);
    sosStore.stopSound();
  },

  confirmTrigger: (rideId: string): void => {
    const id = rideId.trim();
    if (!id) {
      showAppAlert(SOS_COPY.notEligibleTitle, SOS_ERROR_MESSAGES.NOT_ELIGIBLE);
      return;
    }
    showAppAlert(SOS_COPY.confirmTitle, SOS_COPY.confirmMessage, [
      { text: SOS_COPY.confirmCancel, style: 'cancel' },
      {
        text: SOS_COPY.confirmTrigger,
        style: 'destructive',
        onPress: () => {
          void sosSession.trigger(id);
        },
      },
    ]);
  },

  trigger: async (rideId: string): Promise<void> => {
    const id = rideId.trim();
    if (!id) {
      showAppAlert(SOS_COPY.notEligibleTitle, SOS_ERROR_MESSAGES.NOT_ELIGIBLE);
      return;
    }
    if (triggerInFlight.has(id)) {
      return;
    }
    triggerInFlight.add(id);
    const idempotencyKey = getOrCreateSosIdempotencyKey(id);
    try {
      const coordinate = await readSosCoordinate();
      const record = await triggerRideSos(id, {
        idempotencyKey,
        category: 'EMERGENCY',
        ...(coordinate
          ? {
              latitude: coordinate.latitude,
              longitude: coordinate.longitude,
              ...(coordinate.accuracy != null ? { accuracy: coordinate.accuracy } : {}),
            }
          : {}),
      });
      clearSosIdempotencyKey(id);
      sosStore.markCurrentUserTriggered();
      await applyActiveRecord(record, { currentUserTriggered: true });
      showTriggerResult(record);
    } catch (error) {
      if (isSosAlreadyActiveError(error)) {
        const recovered = await recoverRide(id);
        if (recovered && !isTerminalSosStatus(recovered.status)) {
          clearSosIdempotencyKey(id);
          sosStore.markCurrentUserTriggered();
          showAppAlert(SOS_COPY.attachedTitle, SOS_COPY.attachedMessage);
          return;
        }
      }
      const mapped = mapSosTriggerError(error);
      if (mapped === SOS_ERROR_MESSAGES.TIMEOUT || mapped === SOS_ERROR_MESSAGES.NETWORK) {
        const recovered = await recoverRide(id);
        if (recovered && !isTerminalSosStatus(recovered.status)) {
          clearSosIdempotencyKey(id);
          sosStore.markCurrentUserTriggered();
          showTriggerResult(recovered);
          return;
        }
        showAppAlert('SOS not confirmed', SOS_ERROR_MESSAGES.UNCONFIRMED);
        return;
      }
      sosStore.setLastError(mapped);
      showAppAlert('Unable to trigger SOS', mapped);
    } finally {
      triggerInFlight.delete(id);
    }
  },
};

export const SOS_SOCKET_EVENT_NAMES = SOS_EVENTS;

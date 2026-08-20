import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { listVehicles } from '@/features/profile/api';
import {
  formatBhaiWayCoins,
  getErrorMessage,
  showAppAlert,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils';
import { authSession } from '@/store';
import { createRide } from '../api';
import {
  RIDE_PREFERENCE_OPTIONS,
  RIDE_PREFERENCES_SCREEN,
} from '../constants';
import { publishRideDraft, publishedRideStore } from '../store';
import type {
  PublishRideDraft,
  PublishRideVehicleOption,
  RidePreferenceId,
} from '../types';
import {
  mapCreateRideError,
  mapDraftToCreateRideDto,
  mapRideResponseToPublishedSummary,
  mapVehicleResponseToPublishOption,
} from '../utils';

export interface UseRidePreferencesResult {
  draft: PublishRideDraft;
  isAssured: boolean;
  preferenceOptions: typeof RIDE_PREFERENCE_OPTIONS;
  vehicles: readonly PublishRideVehicleOption[];
  notesLength: number;
  canPublish: boolean;
  publishing: boolean;
  refundableAmountLabel: string;
  totalToPayLabel: string;
  primaryCtaLabel: string;
  togglePreference: (id: RidePreferenceId) => void;
  setNotes: (notes: string) => void;
  selectVehicle: (vehicleId: string) => void;
  setPromoCode: (code: string) => void;
  applyPromo: () => void;
  addVehicle: () => void;
  publish: () => void;
  goBack: () => void;
}

const isApiError = (
  value: unknown,
): value is { status: number; code: string; message: string } =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  'code' in value &&
  'message' in value;

export const useRidePreferences = (): UseRidePreferencesResult => {
  const router = useRouter();
  const [draft, setDraft] = useState<PublishRideDraft>(() => publishRideDraft.get());
  const [vehicles, setVehicles] = useState<PublishRideVehicleOption[]>([]);
  const [publishing, setPublishing] = useState(false);
  const publishingRef = useRef(false);

  useEffect(() => publishRideDraft.subscribe(setDraft), []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void (async () => {
        if (!authSession.getToken()) {
          return;
        }

        try {
          const rows = await listVehicles();
          if (!active) {
            return;
          }
          const options = rows
            .filter((row) => row.isActive)
            .map(mapVehicleResponseToPublishOption);
          setVehicles(options);
          const current = publishRideDraft.get();
          const stillValid = options.some((item) => item.id === current.selectedVehicleId);
          if (!stillValid) {
            publishRideDraft.update({
              selectedVehicleId: options[0]?.id ?? null,
            });
          }
        } catch (error) {
          console.log('[Publish Ride] GET /vehicles failed', getErrorMessage(error));
          if (isApiError(error) && error.status === 401) {
            authSession.clear();
            showAppAlert('Session expired', 'Please sign in again to publish a ride.');
            router.replace(ROUTES.welcome);
          }
        }
      })();

      return () => {
        active = false;
      };
    }, [router]),
  );

  const isAssured = draft.rideType === 'assured';

  const refundableAmountLabel = useMemo(
    () =>
      formatBhaiWayCoins(Number(RIDE_PREFERENCES_SCREEN.assuredRefundableAmount), {
        spaced: false,
        minimumFractionDigits: 2,
      }),
    [],
  );

  const totalToPayLabel = useMemo(() => {
    if (!isAssured) {
      return formatBhaiWayCoins(0, { spaced: false, minimumFractionDigits: 2 });
    }
    return formatBhaiWayCoins(Number(RIDE_PREFERENCES_SCREEN.assuredRefundableAmount), {
      spaced: false,
      minimumFractionDigits: 2,
    });
  }, [isAssured]);

  const primaryCtaLabel = isAssured
    ? RIDE_PREFERENCES_SCREEN.confirmPayLabel
    : RIDE_PREFERENCES_SCREEN.publishLabel;

  const togglePreference = useCallback((id: RidePreferenceId) => {
    triggerLightHaptic();
    const current = publishRideDraft.get();
    publishRideDraft.update({
      preferences: {
        ...current.preferences,
        [id]: !current.preferences[id],
      },
    });
  }, []);

  const setNotes = useCallback((notes: string) => {
    const trimmed = notes.slice(0, RIDE_PREFERENCES_SCREEN.notesMaxLength);
    publishRideDraft.update({ notes: trimmed });
  }, []);

  const selectVehicle = useCallback((vehicleId: string) => {
    triggerLightHaptic();
    publishRideDraft.update({ selectedVehicleId: vehicleId });
  }, []);

  const setPromoCode = useCallback((code: string) => {
    publishRideDraft.update({
      promoCode: code,
      promoApplied: false,
    });
  }, []);

  const applyPromo = useCallback(() => {
    triggerLightHaptic();
    const current = publishRideDraft.get();
    const code = current.promoCode.trim();
    if (!code) {
      showAppAlert('Promo code', RIDE_PREFERENCES_SCREEN.promoInvalidMessage);
      return;
    }
    publishRideDraft.update({ promoApplied: true });
    showAppAlert('Promo code', RIDE_PREFERENCES_SCREEN.promoAppliedMessage);
  }, []);

  const addVehicle = useCallback(() => {
    triggerLightHaptic();
    router.push({
      pathname: ROUTES.addVehicle,
      params: { returnTo: 'offer-ride-preferences' },
    });
  }, [router]);

  const publish = useCallback(() => {
    const current = publishRideDraft.get();
    if (!current.selectedVehicleId) {
      showAppAlert(
        RIDE_PREFERENCES_SCREEN.missingVehicleTitle,
        RIDE_PREFERENCES_SCREEN.missingVehicleMessage,
      );
      return;
    }

    if (current.rideType === 'assured') {
      triggerLightHaptic();
      router.push(ROUTES.offerRidePayment);
      return;
    }

    if (publishingRef.current) {
      return;
    }

    const mapped = mapDraftToCreateRideDto(current);
    if (!mapped.ok) {
      showAppAlert('Check ride details', mapped.message);
      return;
    }

    publishingRef.current = true;
    setPublishing(true);
    triggerLightHaptic();

    void (async () => {
      try {
        if (!authSession.getToken()) {
          showAppAlert('Session expired', 'Please sign in again to publish a ride.');
          return;
        }

        const created = await createRide(mapped.payload);
        console.log('[Publish Ride] POST /rides response', created);
        const vehicle =
          vehicles.find((item) => item.id === created.vehicleId) ??
          vehicles.find((item) => item.id === current.selectedVehicleId) ??
          null;

        publishedRideStore.set(
          mapRideResponseToPublishedSummary(created, vehicle, {
            music: current.preferences.music,
            notes: current.notes,
          }),
        );
        publishRideDraft.reset(current.rideType);
        triggerSuccessHaptic();
        router.replace(ROUTES.offerRidePublished);
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          authSession.clear();
          showAppAlert('Session expired', mapCreateRideError(error));
          router.replace(ROUTES.welcome);
          return;
        }

        const title = isApiError(error) && error.status === 403
          ? 'Unable to publish'
          : 'Unable to publish ride';
        showAppAlert(title, mapCreateRideError(error));
      } finally {
        publishingRef.current = false;
        setPublishing(false);
      }
    })();
  }, [router, vehicles]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.offerRidePublish);
  }, [router]);

  return {
    draft,
    isAssured,
    preferenceOptions: RIDE_PREFERENCE_OPTIONS,
    vehicles,
    notesLength: draft.notes.length,
    canPublish: Boolean(draft.selectedVehicleId) && vehicles.length > 0 && !publishing,
    publishing,
    refundableAmountLabel,
    totalToPayLabel,
    primaryCtaLabel,
    togglePreference,
    setNotes,
    selectVehicle,
    setPromoCode,
    applyPromo,
    addVehicle,
    publish,
    goBack,
  };
};

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { listInboxNotifications } from '@/features/notifications/api/notificationsInbox.api';
import { getErrorMessage, showAppAlert, triggerLightHaptic } from '@/shared/utils';
import { useSessionUser } from '@/shared/hooks';

import {
  approveNoShowClaim,
  getNoShowClaim,
  rejectNoShowClaim,
  reportDriverNoShow,
  reportPassengerNoShow,
} from '../api/noShow.api';
import type { NoShowClaimDto } from '../api/noShow.types';
import { NO_SHOW_COPY } from '../constants/no-show.constants';
import { noShowClaimStore } from '../store/noShowClaimStore';
import {
  acquireNoShowActionLock,
  releaseNoShowActionLock,
} from '../utils/noShow.actions';
import {
  extractNoShowErrorSupport,
  isNoShowAlreadyRejectedError,
  remainingRespondMs,
} from '../utils/noShow.mapper';
import {
  canDriverReportPassengerNoShow,
  canPassengerReportDriverNoShow,
  canRespondToNoShowClaim,
} from '../utils/noShow.visibility';

export type NoShowViewerRole = 'passenger' | 'driver';

export interface UseNoShowClaimParams {
  role: NoShowViewerRole;
  rideId?: string | null;
  bookingId?: string | null;
  claimId?: string | null;
  rideStatus?: string | null;
  bookingStatus?: string | null;
  pickupStatus?: string | null;
  isRideOwner?: boolean;
  enabled?: boolean;
}

export interface UseNoShowClaimResult {
  claim: NoShowClaimDto | null;
  loading: boolean;
  submitting: boolean;
  responding: boolean;
  canReport: boolean;
  canRespond: boolean;
  isClaimant: boolean;
  reportLabel: string;
  pendingBody: string;
  remainingMs: number | null;
  report: () => void;
  approve: () => void;
  reject: () => void;
  openSupport: () => void;
  refresh: () => Promise<void>;
}

const NO_SHOW_INBOX_TYPES = new Set([
  'NO_SHOW_CLAIM_OPENED',
  'NO_SHOW_CLAIM_APPROVED',
  'NO_SHOW_CLAIM_REJECTED',
  'NO_SHOW_CLAIM_TIMEOUT',
]);

const readInboxClaim = (data: Record<string, unknown> | undefined): {
  claimId: string;
  rideId: string;
  bookingId: string | null;
  kind: string;
} | null => {
  if (!data) {
    return null;
  }
  const type = String(data.type ?? '')
    .trim()
    .toUpperCase();
  if (!NO_SHOW_INBOX_TYPES.has(type)) {
    return null;
  }
  const claimId = String(data.claimId ?? '').trim();
  const rideId = String(data.rideId ?? '').trim();
  if (!claimId || !rideId) {
    return null;
  }
  return {
    claimId,
    rideId,
    bookingId: String(data.bookingId ?? '').trim() || null,
    kind: String(data.kind ?? '').trim(),
  };
};

export const useNoShowClaim = (params: UseNoShowClaimParams): UseNoShowClaimResult => {
  const router = useRouter();
  const user = useSessionUser();
  const enabled = params.enabled !== false;
  const rideId = params.rideId?.trim() || '';
  const bookingId = params.bookingId?.trim() || '';
  const routeClaimId = params.claimId?.trim() || '';

  const [claim, setClaim] = useState<NoShowClaimDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const submitLockRef = useRef(false);
  const respondLockRef = useRef(false);
  const requestIdRef = useRef(0);

  const canReport = useMemo(() => {
    if (!enabled || submitting) {
      return false;
    }
    if (params.role === 'passenger') {
      return canPassengerReportDriverNoShow({
        hasOwnBooking: Boolean(bookingId),
        isRideOwner: Boolean(params.isRideOwner),
        bookingStatus: params.bookingStatus,
        rideStatus: params.rideStatus,
        pickupStatus: params.pickupStatus,
      });
    }
    return canDriverReportPassengerNoShow({
      isRideOwner: params.isRideOwner !== false,
      bookingId,
      bookingStatus: params.bookingStatus,
      rideStatus: params.rideStatus,
      pickupStatus: params.pickupStatus,
    });
  }, [
    bookingId,
    enabled,
    params.bookingStatus,
    params.isRideOwner,
    params.pickupStatus,
    params.rideStatus,
    params.role,
    submitting,
  ]);

  const currentUserId = user?.id?.trim() || '';
  const isClaimant = Boolean(
    claim && currentUserId && claim.claimantUserId === currentUserId,
  );
  const canRespond = canRespondToNoShowClaim({
    claimStatus: claim?.status,
    currentUserId,
    respondentUserId: claim?.respondentUserId,
    claimantUserId: claim?.claimantUserId,
  });

  const remainingMs = remainingRespondMs(claim?.respondBy, nowMs);

  const resolveClaimId = useCallback((): string => {
    if (routeClaimId) {
      return routeClaimId;
    }
    const remembered = noShowClaimStore.findForContext({ rideId, bookingId });
    return remembered?.claimId ?? claim?.id ?? '';
  }, [bookingId, claim?.id, rideId, routeClaimId]);

  const applyClaim = useCallback((next: NoShowClaimDto) => {
    setClaim(next);
    noShowClaimStore.remember({
      claimId: next.id,
      rideId: next.rideId,
      bookingId: next.bookingId,
      kind: next.kind,
    });
  }, []);

  const discoverClaimId = useCallback(async (): Promise<string> => {
    const direct = resolveClaimId();
    if (direct) {
      return direct;
    }
    if (!rideId && !bookingId) {
      return '';
    }
    try {
      const page = await listInboxNotifications({ page: 1, limit: 20 });
      for (const item of page.items) {
        const found = readInboxClaim(item.data as Record<string, unknown>);
        if (!found) {
          continue;
        }
        const rideMatch = rideId && found.rideId === rideId;
        const bookingMatch = bookingId && found.bookingId === bookingId;
        if (rideMatch || bookingMatch) {
          noShowClaimStore.remember(found);
          return found.claimId;
        }
      }
    } catch {
      // Inbox discovery is best-effort; GET by id remains the source of truth.
    }
    return '';
  }, [bookingId, resolveClaimId, rideId]);

  const loadClaim = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!enabled) {
        return;
      }
      const requestId = ++requestIdRef.current;
      if (!opts?.silent) {
        setLoading(true);
      }
      try {
        const claimId = await discoverClaimId();
        if (!claimId) {
          if (requestId === requestIdRef.current && !opts?.silent) {
            setClaim(null);
          }
          return;
        }
        const next = await getNoShowClaim(claimId);
        if (requestId !== requestIdRef.current) {
          return;
        }
        applyClaim(next);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        if (!opts?.silent) {
          showAppAlert(NO_SHOW_COPY.loadFailedTitle, getErrorMessage(error));
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [applyClaim, discoverClaimId, enabled],
  );

  useFocusEffect(
    useCallback(() => {
      void loadClaim({ silent: true });
    }, [loadClaim]),
  );

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void loadClaim({ silent: true });
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [loadClaim]);

  useEffect(() => {
    if (!claim || String(claim.status).toUpperCase() !== 'PENDING') {
      return;
    }
    if (remainingRespondMs(claim.respondBy) == null) {
      return;
    }
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [claim]);

  useEffect(() => {
    if (!claim || String(claim.status).toUpperCase() !== 'PENDING') {
      return;
    }
    const remaining = remainingRespondMs(claim.respondBy);
    if (remaining !== 0) {
      return;
    }
    void loadClaim({ silent: true });
  }, [claim, loadClaim, nowMs]);

  const report = useCallback(() => {
    if (!canReport || claim || submitLockRef.current) {
      return;
    }
    const isPassenger = params.role === 'passenger';
    showAppAlert(
      isPassenger ? NO_SHOW_COPY.passengerConfirmTitle : NO_SHOW_COPY.driverConfirmTitle,
      isPassenger ? NO_SHOW_COPY.passengerConfirmMessage : NO_SHOW_COPY.driverConfirmMessage,
      [
        { text: NO_SHOW_COPY.cancelCta, style: 'cancel' },
        {
          text: NO_SHOW_COPY.confirmCta,
          onPress: () => {
            if (!acquireNoShowActionLock(submitLockRef)) {
              return;
            }
            setSubmitting(true);
            triggerLightHaptic();
            void (async () => {
              try {
                const next = isPassenger
                  ? await reportDriverNoShow(rideId)
                  : await reportPassengerNoShow(bookingId);
                applyClaim(next);
                showAppAlert(
                  next.alreadyOpen
                    ? NO_SHOW_COPY.alreadyOpenTitle
                    : NO_SHOW_COPY.submittedTitle,
                  next.alreadyOpen
                    ? NO_SHOW_COPY.alreadyOpenMessage
                    : isPassenger
                      ? NO_SHOW_COPY.passengerPendingBody
                      : NO_SHOW_COPY.driverPendingBody,
                );
              } catch (error) {
                const support = extractNoShowErrorSupport(error);
                const message = isNoShowAlreadyRejectedError(error)
                  ? support?.message || getErrorMessage(error)
                  : getErrorMessage(error);
                showAppAlert(NO_SHOW_COPY.submitFailedTitle, message, support?.message
                  ? [
                      { text: NO_SHOW_COPY.cancelCta, style: 'cancel' },
                      {
                        text: NO_SHOW_COPY.supportCta,
                        onPress: () => {
                          if (support.ticketId) {
                            router.push({
                              pathname: ROUTES.supportTicketDetail,
                              params: { ticketId: support.ticketId },
                            });
                            return;
                          }
                          router.push(ROUTES.helpSupport);
                        },
                      },
                    ]
                  : undefined);
              } finally {
                releaseNoShowActionLock(submitLockRef);
                setSubmitting(false);
              }
            })();
          },
        },
      ],
    );
  }, [applyClaim, bookingId, canReport, claim, params.role, rideId, router]);

  const respond = useCallback(
    (action: 'approve' | 'reject') => {
      if (!claim || !canRespond || respondLockRef.current) {
        return;
      }
      showAppAlert(
        action === 'approve'
          ? NO_SHOW_COPY.approveConfirmTitle
          : NO_SHOW_COPY.rejectConfirmTitle,
        action === 'approve'
          ? NO_SHOW_COPY.approveConfirmMessage
          : NO_SHOW_COPY.rejectConfirmMessage,
        [
          { text: NO_SHOW_COPY.cancelCta, style: 'cancel' },
          {
            text: action === 'approve' ? NO_SHOW_COPY.approveCta : NO_SHOW_COPY.rejectCta,
            style: action === 'reject' ? 'destructive' : 'default',
            onPress: () => {
              if (!acquireNoShowActionLock(respondLockRef)) {
                return;
              }
              setResponding(true);
              triggerLightHaptic();
              void (async () => {
                try {
                  const next =
                    action === 'approve'
                      ? await approveNoShowClaim(claim.id)
                      : await rejectNoShowClaim(claim.id);
                  applyClaim(next);
                } catch (error) {
                  showAppAlert(NO_SHOW_COPY.respondFailedTitle, getErrorMessage(error));
                } finally {
                  releaseNoShowActionLock(respondLockRef);
                  setResponding(false);
                }
              })();
            },
          },
        ],
      );
    },
    [applyClaim, canRespond, claim],
  );

  const openSupport = useCallback(() => {
    triggerLightHaptic();
    const ticketId = claim?.support?.ticketId || claim?.supportTicketId;
    if (ticketId) {
      router.push({
        pathname: ROUTES.supportTicketDetail,
        params: { ticketId },
      });
      return;
    }
    router.push(ROUTES.helpSupport);
  }, [claim, router]);

  return {
    claim,
    loading,
    submitting,
    responding,
    canReport: canReport && !claim,
    canRespond,
    isClaimant,
    reportLabel:
      params.role === 'passenger'
        ? NO_SHOW_COPY.passengerReportLabel
        : NO_SHOW_COPY.driverReportLabel,
    pendingBody:
      String(claim?.kind ?? '').toUpperCase() === 'PASSENGER_NO_SHOW' ||
      (params.role === 'driver' && !claim)
        ? NO_SHOW_COPY.driverPendingBody
        : NO_SHOW_COPY.passengerPendingBody,
    remainingMs,
    report,
    approve: () => respond('approve'),
    reject: () => respond('reject'),
    openSupport,
    refresh: () => loadClaim({ silent: true }),
  };
};

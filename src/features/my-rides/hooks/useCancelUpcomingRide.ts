import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  cancelRideById,
  listMyRides,
  type ApiSeriesScope,
  type CancelRideResultDto,
} from '@/features/offer-ride/api';
import { COMMUTE_SERIES_COPY } from '@/features/office-commute/constants/commute-series.constants';
import {
  isCommuteSeriesOccurrenceInProgressError,
  summarizeCommuteSeriesCancel,
} from '@/features/office-commute/utils/commuteSeries.utils';
import {
  isRideCancelAlreadyApplied,
  mapCancelRideError,
} from '@/features/offer-ride/utils';
import { getWalletBalance } from '@/features/profile/api/wallet.api';
import { walletStore } from '@/features/profile/store/walletStore';
import { hydrateAuthenticatedUserFromServer } from '@/features/auth/services/sessionHydration';
import { refreshAfterCommutePassengerCancel } from '@/features/office-commute/utils/commuteCancelRefresh';
import {
  cancelBookingById,
  isCancelAlreadyApplied,
  listDriverBookings,
  listMyBookings,
  mapCancelBookingError,
  type CancelBookingResultDto,
} from '@/features/ride-search/api';
import type { AppMode } from '@/store';
import { authSession } from '@/store';
import { logger, showAppAlert, triggerLightHaptic } from '@/shared/utils';
import {
  CANCEL_UPCOMING_RIDE_SCREEN,
  getCancelRideReasons,
  type CancelRideReasonId,
  type CancelRideReasonOption,
} from '../constants';
import { driverRidesRefreshStore } from '../store/driverRidesRefreshStore';
import { assuredPassengerCancelStore } from '../store/assuredPassengerCancelStore';
import { upcomingRideCancelledStore } from '../store';

export interface CancelUpcomingRideParams {
  rideId?: string;
  dateLabel?: string;
  title?: string;
  pickupLabel?: string;
  dropoffLabel?: string;
  mode?: string;
  assured?: string;
  commute?: string | boolean;
  seriesId?: string;
}

export interface UseCancelUpcomingRideResult {
  summary: {
    rideId: string;
    dateLabel: string;
    title: string;
    pickupLabel: string;
    dropoffLabel: string;
    assured: boolean;
    commute: boolean;
  };
  isDriving: boolean;
  heading: string;
  subtitle: string;
  policyText: string;
  showAssuredDriverWarning: boolean;
  confirmLabel: string;
  reasons: readonly CancelRideReasonOption[];
  selectedReasonId: CancelRideReasonId | null;
  otherNote: string;
  showOtherNote: boolean;
  confirming: boolean;
  selectReason: (id: CancelRideReasonId) => void;
  setOtherNote: (value: string) => void;
  keepRide: () => void;
  confirmCancel: () => void;
  goBack: () => void;
}

const isApiError = (error: unknown): error is { status: number } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as { status?: unknown }).status === 'number';

const logAssuredDriverCancelResult = (
  rideId: string,
  result: CancelRideResultDto,
  uiReasonId: CancelRideReasonId | null,
): void => {
  logger.info('Assured ride cancelled by driver', {
    rideId,
    status: result.status,
    cancellationReason: result.cancellationReason,
    cancelledBookingCount: result.cancelledBookingCount,
    driverDepositForfeited: result.driverDepositForfeited,
    riderCompensationTotal: result.riderCompensationTotal,
    platformForfeiture: result.platformForfeiture,
    fareRefundedTotal: result.fareRefundedTotal,
    couponsIssuedCount: result.couponsIssuedCount,
    alreadyApplied: result.alreadyApplied,
    uiReasonId,
    sendsReasonToApi: false,
  });
};

const refreshWalletAfterAssuredMutation = async (): Promise<void> => {
  try {
    const balance = await getWalletBalance();
    walletStore.setBalance(balance);
    walletStore.bumpTransactionsRefresh();
  } catch (error) {
    console.log('[Cancel Ride] wallet refresh after Assured cancel failed', error);
  }
};

const logAssuredPassengerCancelResult = (
  bookingId: string,
  result: CancelBookingResultDto,
  uiReasonId: CancelRideReasonId | null,
): void => {
  logger.info('Assured booking cancelled by passenger', {
    bookingId,
    rideId: result.rideId,
    status: result.status,
    cancellationReason: result.cancellationReason,
    farePayment: result.farePayment,
    securityDepositForfeited: result.securityDepositForfeited,
    fareRefunded: result.fareRefunded,
    driverCompensation: result.driverCompensation,
    platformAmount: result.platformAmount,
    nextAssuredDepositPercentage: result.nextAssuredDepositPercentage,
    alreadyApplied: result.alreadyApplied,
    uiReasonId,
    sendsReasonToApi: false,
  });
};

const handleAssuredPassengerCancelSuccess = async (
  result: CancelBookingResultDto,
): Promise<void> => {
  assuredPassengerCancelStore.setResult(result);

  await Promise.all([
    listMyBookings().catch((error) => {
      console.log('[Cancel Ride] GET /bookings/my refresh failed', error);
    }),
    refreshWalletAfterAssuredMutation(),
    hydrateAuthenticatedUserFromServer().catch((error) => {
      console.log('[Cancel Ride] GET /users/me refresh failed', error);
    }),
  ]);

  upcomingRideCancelledStore.setCancelled(false);
};

export const useCancelUpcomingRide = (
  params: CancelUpcomingRideParams,
): UseCancelUpcomingRideResult => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [selectedReasonId, setSelectedReasonId] = useState<CancelRideReasonId | null>(null);
  const [otherNote, setOtherNote] = useState('');
  const inFlightRef = useRef(false);
  const mode: AppMode = params.mode === 'driving' ? 'driving' : 'riding';
  const isDriving = mode === 'driving';
  const assured = params.assured === '1' || params.assured === 'true';
  const isCommute =
    params.commute === '1' ||
    params.commute === 'true' ||
    params.commute === true;
  const seriesId = typeof params.seriesId === 'string' ? params.seriesId.trim() : '';
  const isSeriesRide = isCommute && seriesId.length > 0;
  const showAssuredDriverWarning = isDriving && assured && !isCommute;

  const summary = useMemo(
    () => ({
      rideId: params.rideId || 'upcoming-ride',
      dateLabel: params.dateLabel || 'Today, 08:30 AM',
      title: params.title || 'Upcoming Ride',
      pickupLabel: params.pickupLabel || 'Delhi Center',
      dropoffLabel: params.dropoffLabel || 'Altus Office',
      assured,
      commute: isCommute,
    }),
    [
      assured,
      isCommute,
      params.dateLabel,
      params.dropoffLabel,
      params.pickupLabel,
      params.rideId,
      params.title,
    ],
  );

  const heading = useMemo(() => {
    if (showAssuredDriverWarning) {
      return CANCEL_UPCOMING_RIDE_SCREEN.headingDrivingAssured;
    }
    return CANCEL_UPCOMING_RIDE_SCREEN.heading;
  }, [showAssuredDriverWarning]);

  const subtitle = useMemo(() => {
    if (showAssuredDriverWarning) {
      return CANCEL_UPCOMING_RIDE_SCREEN.subtitleDrivingAssured;
    }
    return isDriving
      ? CANCEL_UPCOMING_RIDE_SCREEN.subtitleDriving
      : CANCEL_UPCOMING_RIDE_SCREEN.subtitleRiding;
  }, [isDriving, showAssuredDriverWarning]);

  const policyText = useMemo(() => {
    if (isCommute) {
      return isDriving
        ? CANCEL_UPCOMING_RIDE_SCREEN.policyDrivingCommute
        : CANCEL_UPCOMING_RIDE_SCREEN.policyCommutePassenger;
    }
    if (showAssuredDriverWarning) {
      return CANCEL_UPCOMING_RIDE_SCREEN.policyDrivingAssured;
    }
    if (isDriving) {
      return CANCEL_UPCOMING_RIDE_SCREEN.policyDriving;
    }
    return assured
      ? `${CANCEL_UPCOMING_RIDE_SCREEN.policyAssured} ${CANCEL_UPCOMING_RIDE_SCREEN.policyAssuredPassengerDetail}`
      : CANCEL_UPCOMING_RIDE_SCREEN.policyRegular;
  }, [assured, isCommute, isDriving, showAssuredDriverWarning]);

  const confirmLabel = useMemo(() => {
    if (showAssuredDriverWarning) {
      return CANCEL_UPCOMING_RIDE_SCREEN.confirmLabelCancelRide;
    }
    return CANCEL_UPCOMING_RIDE_SCREEN.confirmLabel;
  }, [showAssuredDriverWarning]);

  const selectReason = useCallback((id: CancelRideReasonId) => {
    triggerLightHaptic();
    setSelectedReasonId(id);
    if (id !== 'other') {
      setOtherNote('');
    }
  }, []);

  const keepRide = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  const goBack = keepRide;

  const navigateToCancelledConfirmed = useCallback(() => {
    router.replace(ROUTES.myRidesCancelConfirmed);
  }, [router]);

  const cancelCommutePassengerBooking = useCallback(async () => {
    const bookingId = summary.rideId.trim();
    if (!bookingId || bookingId === 'upcoming-ride') {
      showAppAlert('Unable to cancel', 'Missing booking id. Please reopen My Rides and try again.');
      return;
    }

    if (!authSession.getToken()) {
      showAppAlert('Session expired', 'Please sign in again.');
      router.replace(ROUTES.welcome);
      return;
    }

    try {
      const result = await cancelBookingById(bookingId);
      logger.info('Commute booking cancelled by passenger', {
        bookingId,
        status: result.status,
        seatsRestored: result.seatsRestored,
        fareRefunded: result.fareRefunded,
        alreadyApplied: result.alreadyApplied,
      });
      await refreshAfterCommutePassengerCancel();
      upcomingRideCancelledStore.setCancelled(false);
      assuredPassengerCancelStore.clear();
      navigateToCancelledConfirmed();
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        authSession.clear();
        showAppAlert('Session expired', mapCancelBookingError(error));
        router.replace(ROUTES.welcome);
        return;
      }
      showAppAlert('Unable to cancel', mapCancelBookingError(error));
    }
  }, [navigateToCancelledConfirmed, router, summary.rideId]);

  /**
   * Regular passenger cancel: POST /bookings/:id/cancel with empty body.
   * UI reason is local-only and never sent. Assured path is left unchanged.
   */
  const cancelRegularPassengerBooking = useCallback(async () => {
    const bookingId = summary.rideId.trim();
    if (!bookingId || bookingId === 'upcoming-ride') {
      showAppAlert('Unable to cancel', 'Missing booking id. Please reopen My Rides and try again.');
      return;
    }

    if (!authSession.getToken()) {
      showAppAlert('Session expired', 'Please sign in again.');
      router.replace(ROUTES.welcome);
      return;
    }

    try {
      const result = await cancelBookingById(bookingId);
      logger.info('Regular booking cancelled', {
        bookingId,
        status: result.status,
        cancellationReason: result.cancellationReason,
        alreadyApplied: result.alreadyApplied,
        seatsRestored: result.seatsRestored,
        uiReasonId: selectedReasonId,
      });

      await Promise.all([
        listMyBookings().catch((error) => {
          console.log('[Cancel Ride] GET /bookings/my refresh failed', error);
        }),
        refreshWalletAfterAssuredMutation(),
        hydrateAuthenticatedUserFromServer().catch((error) => {
          console.log('[Cancel Ride] GET /users/me refresh failed', error);
        }),
      ]);

      upcomingRideCancelledStore.setCancelled(false);
      assuredPassengerCancelStore.clear();
      navigateToCancelledConfirmed();
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        authSession.clear();
        showAppAlert('Session expired', mapCancelBookingError(error));
        router.replace(ROUTES.welcome);
        return;
      }

      const details =
        error && typeof error === 'object' && 'details' in error
          ? (error as { details?: unknown }).details
          : undefined;
      if (
        details &&
        typeof details === 'object' &&
        isCancelAlreadyApplied(details as { alreadyApplied?: boolean; status?: string })
      ) {
        await Promise.all([
          listMyBookings().catch(() => undefined),
          refreshWalletAfterAssuredMutation(),
        ]);
        upcomingRideCancelledStore.setCancelled(false);
        navigateToCancelledConfirmed();
        return;
      }

      showAppAlert('Unable to cancel', mapCancelBookingError(error));
    }
  }, [navigateToCancelledConfirmed, router, selectedReasonId, summary.rideId]);

  /**
   * Assured passenger cancel: POST /bookings/:id/cancel — backend returns forfeiture fields.
   */
  const cancelAssuredPassengerBooking = useCallback(async () => {
    const bookingId = summary.rideId.trim();
    if (!bookingId || bookingId === 'upcoming-ride') {
      showAppAlert('Unable to cancel', 'Missing booking id. Please reopen My Rides and try again.');
      return;
    }

    if (!authSession.getToken()) {
      showAppAlert('Session expired', 'Please sign in again.');
      router.replace(ROUTES.welcome);
      return;
    }

    try {
      const result = await cancelBookingById(bookingId);
      logAssuredPassengerCancelResult(bookingId, result, selectedReasonId);

      if (isCancelAlreadyApplied(result) || result.alreadyApplied === true) {
        await handleAssuredPassengerCancelSuccess(result);
        navigateToCancelledConfirmed();
        return;
      }

      await handleAssuredPassengerCancelSuccess(result);
      navigateToCancelledConfirmed();
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        authSession.clear();
        showAppAlert('Session expired', mapCancelBookingError(error));
        router.replace(ROUTES.welcome);
        return;
      }

      const details =
        error && typeof error === 'object' && 'details' in error
          ? (error as { details?: unknown }).details
          : undefined;
      if (
        details &&
        typeof details === 'object' &&
        isCancelAlreadyApplied(details as CancelBookingResultDto)
      ) {
        await handleAssuredPassengerCancelSuccess(details as CancelBookingResultDto);
        navigateToCancelledConfirmed();
        return;
      }

      showAppAlert('Unable to cancel', mapCancelBookingError(error));
    }
  }, [
    navigateToCancelledConfirmed,
    router,
    selectedReasonId,
    summary.rideId,
  ]);

  const refreshDriverRideLists = useCallback(async (): Promise<void> => {
    await Promise.all([
      listMyRides().catch((error) => {
        console.log('[Cancel Ride] GET /rides/my refresh failed', error);
      }),
      listDriverBookings({ page: 1, limit: 50 }).catch((error) => {
        console.log('[Cancel Ride] GET /bookings/driver/my-rides refresh failed', error);
      }),
    ]);
  }, []);

  const handleDriverCancelSuccess = useCallback(
    async (
      assuredCancel: boolean,
      commuteCancel = false,
      cancelResult?: CancelRideResultDto | null,
    ): Promise<void> => {
      await refreshDriverRideLists();
      driverRidesRefreshStore.bump();

      if (assuredCancel) {
        await refreshWalletAfterAssuredMutation();
      } else if (commuteCancel) {
        await refreshAfterCommutePassengerCancel();
      }

      upcomingRideCancelledStore.setCancelled(false);
      assuredPassengerCancelStore.clear();

      const seriesSummary = commuteCancel
        ? summarizeCommuteSeriesCancel(cancelResult ?? {})
        : null;
      if (seriesSummary?.showSkipAlert) {
        showAppAlert(seriesSummary.title, seriesSummary.message, [
          {
            text: 'OK',
            onPress: navigateToCancelledConfirmed,
          },
        ]);
        return;
      }

      navigateToCancelledConfirmed();
    },
    [navigateToCancelledConfirmed, refreshDriverRideLists],
  );

  const handleDriverCancelError = useCallback(
    async (
      error: unknown,
      rideId: string,
      assuredCancel: boolean,
    ): Promise<boolean> => {
      console.log('[Cancel Ride] POST /rides/:id/cancel failed', {
        path: `/rides/${rideId}/cancel`,
        rideId,
        assured: assuredCancel,
        mode: 'driving',
        error,
      });

      if (isApiError(error) && error.status === 401) {
        authSession.clear();
        showAppAlert('Session expired', mapCancelRideError(error));
        router.replace(ROUTES.welcome);
        return true;
      }

      const details =
        error && typeof error === 'object' && 'details' in error
          ? (error as { details?: unknown }).details
          : undefined;
      if (
        details &&
        typeof details === 'object' &&
        isRideCancelAlreadyApplied(details as { alreadyApplied?: boolean; status?: string })
      ) {
        await handleDriverCancelSuccess(assuredCancel, summary.commute);
        return true;
      }

      if (isCommuteSeriesOccurrenceInProgressError(error)) {
        showAppAlert(COMMUTE_SERIES_COPY.inProgressTitle, mapCancelRideError(error));
        return true;
      }

      showAppAlert('Unable to cancel', mapCancelRideError(error));
      return true;
    },
    [handleDriverCancelSuccess, router, summary.commute],
  );

  /**
   * Driver cancel: POST /rides/:id/cancel with empty body.
   * Regular and Assured share the same endpoint; Assured adds wallet + list refresh.
   */
  const cancelDriverRide = useCallback(
    async (assuredCancel: boolean, seriesScope?: ApiSeriesScope) => {
      const rideId = summary.rideId.trim();
      if (!rideId || rideId === 'upcoming-ride') {
        showAppAlert('Unable to cancel', 'Missing ride id. Please reopen My Rides and try again.');
        return;
      }

      if (!authSession.getToken()) {
        showAppAlert('Session expired', 'Please sign in again.');
        router.replace(ROUTES.welcome);
        return;
      }

      try {
        const result = await cancelRideById(
          rideId,
          seriesScope ? { seriesScope } : undefined,
        );

        if (assuredCancel) {
          logAssuredDriverCancelResult(rideId, result, selectedReasonId);
        } else {
          logger.info('Regular ride cancelled by driver', {
            rideId,
            status: result.status,
            alreadyApplied: result.alreadyApplied,
            seriesScope,
            cancelledRideIds: result.cancelledRideIds,
            skippedBookedRideIds: result.skippedBookedRideIds,
            skippedIneligibleRideIds: result.skippedIneligibleRideIds,
            uiReasonId: selectedReasonId,
            sendsReasonToApi: false,
          });
        }

        await handleDriverCancelSuccess(assuredCancel, summary.commute, result);
      } catch (error) {
        await handleDriverCancelError(error, rideId, assuredCancel);
      }
    },
    [
      handleDriverCancelError,
      handleDriverCancelSuccess,
      router,
      selectedReasonId,
      summary.commute,
      summary.rideId,
    ],
  );

  const confirmCancel = useCallback(() => {
    if (confirming || inFlightRef.current) {
      return;
    }

    if (!selectedReasonId) {
      showAppAlert(
        CANCEL_UPCOMING_RIDE_SCREEN.reasonRequiredTitle,
        CANCEL_UPCOMING_RIDE_SCREEN.reasonRequiredMessage,
      );
      return;
    }

    logger.info('Upcoming ride cancellation confirmed', {
      rideId: summary.rideId,
      reasonId: selectedReasonId,
      otherNote: selectedReasonId === 'other' ? otherNote.trim() : undefined,
      assured: summary.assured,
      mode,
      sendsReasonToApi: false,
    });

    if (isDriving) {
      const runDriverCancel = (seriesScope?: ApiSeriesScope) => {
        setConfirming(true);
        inFlightRef.current = true;
        void (async () => {
          try {
            await cancelDriverRide(summary.assured && !summary.commute, seriesScope);
          } finally {
            inFlightRef.current = false;
            setConfirming(false);
          }
        })();
      };

      if (isSeriesRide) {
        showAppAlert(
          COMMUTE_SERIES_COPY.cancelScopeTitle,
          COMMUTE_SERIES_COPY.cancelScopeMessage,
          [
            { text: COMMUTE_SERIES_COPY.keepRide, style: 'cancel' },
            {
              text: COMMUTE_SERIES_COPY.cancelThisOnly,
              onPress: () => runDriverCancel('THIS_OCCURRENCE'),
            },
            {
              text: COMMUTE_SERIES_COPY.cancelThisAndFuture,
              style: 'destructive',
              onPress: () => runDriverCancel('THIS_AND_FUTURE'),
            },
          ],
        );
        return;
      }

      runDriverCancel();
      return;
    }

    if (summary.commute) {
      setConfirming(true);
      inFlightRef.current = true;
      void (async () => {
        try {
          await cancelCommutePassengerBooking();
        } finally {
          inFlightRef.current = false;
          setConfirming(false);
        }
      })();
      return;
    }

    // Assured passenger — POST /bookings/:id/cancel with Assured result UI.
    if (summary.assured) {
      setConfirming(true);
      inFlightRef.current = true;
      void (async () => {
        try {
          await cancelAssuredPassengerBooking();
        } finally {
          inFlightRef.current = false;
          setConfirming(false);
        }
      })();
      return;
    }

    // Regular passenger booking cancel.
    setConfirming(true);
    inFlightRef.current = true;
    void (async () => {
      try {
        await cancelRegularPassengerBooking();
      } finally {
        inFlightRef.current = false;
        setConfirming(false);
      }
    })();
  }, [
    cancelAssuredPassengerBooking,
    cancelCommutePassengerBooking,
    cancelDriverRide,
    cancelRegularPassengerBooking,
    confirming,
    isDriving,
    isSeriesRide,
    mode,
    navigateToCancelledConfirmed,
    otherNote,
    router,
    selectedReasonId,
    summary.assured,
    summary.commute,
    summary.rideId,
  ]);

  return {
    summary,
    isDriving,
    heading,
    subtitle,
    policyText,
    showAssuredDriverWarning,
    confirmLabel,
    reasons: getCancelRideReasons(isDriving),
    selectedReasonId,
    otherNote,
    showOtherNote: selectedReasonId === 'other',
    confirming,
    selectReason,
    setOtherNote,
    keepRide,
    confirmCancel,
    goBack,
  };
};

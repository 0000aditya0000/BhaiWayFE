import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  cancelBookingById,
  isCancelAlreadyApplied,
  mapCancelBookingError,
} from '@/features/ride-search/api';
import { authSession } from '@/store';
import { resetTo, showAppAlert, triggerLightHaptic } from '@/shared/utils';
import { refreshAfterCommutePassengerCancel } from '../utils/commuteCancelRefresh';
import { getCommuteCancelConfirmedPath } from '../constants/commute-cancel-confirmed.constants';
import {
  COMMUTE_CANCEL_REASONS,
  COMMUTE_CANCEL_RIDE_SCREEN,
  shortCommutePlaceName,
  type CommuteCancelReasonId,
} from '../constants/commute-cancel-ride.constants';

export interface UseCommuteCancelRideParams {
  bookingId: string;
  rideId: string;
  origin?: string;
  destination?: string;
  dateLabel?: string;
  timeLabel?: string;
}

export interface UseCommuteCancelRideResult {
  summary: {
    bookingId: string;
    rideId: string;
    pickupLabel: string;
    dropoffLabel: string;
    dateLabel: string;
    timeLabel: string;
  };
  reasons: typeof COMMUTE_CANCEL_REASONS;
  selectedReason: CommuteCancelReasonId | null;
  otherNote: string;
  showOtherNote: boolean;
  submitting: boolean;
  selectReason: (id: CommuteCancelReasonId) => void;
  setOtherNote: (value: string) => void;
  confirmCancellation: () => void;
  goBack: () => void;
}

export const useCommuteCancelRide = (
  params: UseCommuteCancelRideParams,
): UseCommuteCancelRideResult => {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState<CommuteCancelReasonId | null>(null);
  const [otherNote, setOtherNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const summary = useMemo(
    () => ({
      bookingId: params.bookingId,
      rideId: params.rideId,
      pickupLabel: shortCommutePlaceName(params.origin) || 'Pickup',
      dropoffLabel: shortCommutePlaceName(params.destination) || 'Office',
      dateLabel: params.dateLabel?.trim() || 'Today',
      timeLabel: params.timeLabel?.trim() || '',
    }),
    [params.bookingId, params.dateLabel, params.destination, params.origin, params.rideId, params.timeLabel],
  );

  const selectReason = useCallback((id: CommuteCancelReasonId) => {
    triggerLightHaptic();
    setSelectedReason(id);
    if (id !== 'other') {
      setOtherNote('');
    }
  }, []);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.officeCommuteBooked);
  }, [router]);

  const confirmCancellation = useCallback(() => {
    if (!selectedReason) {
      showAppAlert(
        COMMUTE_CANCEL_RIDE_SCREEN.reasonRequiredTitle,
        COMMUTE_CANCEL_RIDE_SCREEN.reasonRequiredMessage,
      );
      return;
    }

    const bookingId = summary.bookingId.trim();
    if (!bookingId) {
      showAppAlert('Unable to cancel', 'Missing booking id. Please reopen your booking and try again.');
      return;
    }

    if (!authSession.getToken()) {
      showAppAlert('Session expired', 'Please sign in again.');
      router.replace(ROUTES.welcome);
      return;
    }

    setSubmitting(true);
    void (async () => {
      try {
        const result = await cancelBookingById(bookingId);
        if (!isCancelAlreadyApplied(result) && result.alreadyApplied !== true) {
          await refreshAfterCommutePassengerCancel();
        } else {
          await refreshAfterCommutePassengerCancel();
        }
        resetTo(router, getCommuteCancelConfirmedPath());
      } catch (error) {
        showAppAlert('Unable to cancel', mapCancelBookingError(error));
      } finally {
        setSubmitting(false);
      }
    })();
  }, [router, selectedReason, summary.bookingId]);

  return {
    summary,
    reasons: COMMUTE_CANCEL_REASONS,
    selectedReason,
    otherNote,
    showOtherNote: selectedReason === 'other',
    submitting,
    selectReason,
    setOtherNote,
    confirmCancellation,
    goBack,
  };
};

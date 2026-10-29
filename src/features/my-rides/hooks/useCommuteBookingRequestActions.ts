import { useCallback, useRef, useState } from 'react';

import { acceptBookingById, rejectBookingById } from '@/features/ride-search/api';
import type { AcceptBookingResultDto } from '@/features/ride-search/api';
import { showAppAlert, triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';

import { COMMUTE_BOOKING_REQUESTS_SCREEN } from '../constants/commute-booking-requests.constants';
import type { DriverTrackPendingRequest } from '../types';
import {
  mapCommuteBookingAcceptError,
  mapCommuteBookingRejectError,
} from '../utils/commuteBookingRequest.errors';

const countAutoCancelled = (result: AcceptBookingResultDto): number => {
  if (Array.isArray(result.autoCancelledBookings)) {
    return result.autoCancelledBookings.length;
  }
  if (Array.isArray(result.autoCancelledBookingIds)) {
    return result.autoCancelledBookingIds.length;
  }
  return 0;
};

const formatAcceptSuccessMessage = (
  name: string,
  result: AcceptBookingResultDto,
): string => {
  const base = COMMUTE_BOOKING_REQUESTS_SCREEN.acceptSuccessMessage(name);
  const autoCancelled = countAutoCancelled(result);
  if (autoCancelled <= 0) {
    return base;
  }
  return `${base} ${COMMUTE_BOOKING_REQUESTS_SCREEN.autoCancelledMessage(autoCancelled)}`;
};

export type CommuteBookingRequestAction = 'accept' | 'reject';

export interface UseCommuteBookingRequestActionsParams {
  onAfterMutation?: () => Promise<void> | void;
}

export interface UseCommuteBookingRequestActionsResult {
  actionBookingId: string | null;
  actionType: CommuteBookingRequestAction | null;
  isRequestBusy: (bookingId: string) => boolean;
  isAccepting: (bookingId: string) => boolean;
  isRejecting: (bookingId: string) => boolean;
  acceptRequest: (request: DriverTrackPendingRequest) => void;
  declineRequest: (request: DriverTrackPendingRequest) => void;
}

export const useCommuteBookingRequestActions = (
  params: UseCommuteBookingRequestActionsParams = {},
): UseCommuteBookingRequestActionsResult => {
  const [actionBookingId, setActionBookingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<CommuteBookingRequestAction | null>(null);
  const inFlightIdsRef = useRef<Set<string>>(new Set());

  const runMutation = useCallback(
    async (
      request: DriverTrackPendingRequest,
      type: CommuteBookingRequestAction,
      mutate: (bookingId: string) => Promise<unknown>,
      successTitle: string,
      successMessage: string | ((result: unknown) => string),
      errorTitle: string,
      mapError: (error: unknown) => string,
    ) => {
      const bookingId = request.bookingId?.trim() || request.id?.trim();
      if (!bookingId || inFlightIdsRef.current.has(bookingId)) {
        return;
      }

      inFlightIdsRef.current.add(bookingId);
      setActionBookingId(bookingId);
      setActionType(type);
      triggerLightHaptic();

      try {
        const result = await mutate(bookingId);
        triggerSuccessHaptic();
        await params.onAfterMutation?.();
        const message =
          typeof successMessage === 'function' ? successMessage(result) : successMessage;
        showAppAlert(successTitle, message);
      } catch (error) {
        await params.onAfterMutation?.();
        showAppAlert(errorTitle, mapError(error));
      } finally {
        inFlightIdsRef.current.delete(bookingId);
        setActionBookingId(null);
        setActionType(null);
      }
    },
    [params],
  );

  const acceptRequest = useCallback(
    (request: DriverTrackPendingRequest) => {
      void runMutation(
        request,
        'accept',
        acceptBookingById,
        COMMUTE_BOOKING_REQUESTS_SCREEN.acceptSuccessTitle,
        (result) =>
          formatAcceptSuccessMessage(
            request.name,
            result as AcceptBookingResultDto,
          ),
        COMMUTE_BOOKING_REQUESTS_SCREEN.acceptFailedTitle,
        mapCommuteBookingAcceptError,
      );
    },
    [runMutation],
  );

  const declineRequest = useCallback(
    (request: DriverTrackPendingRequest) => {
      const bookingId = request.bookingId?.trim() || request.id?.trim();
      if (!bookingId || inFlightIdsRef.current.has(bookingId)) {
        return;
      }

      showAppAlert(
        COMMUTE_BOOKING_REQUESTS_SCREEN.rejectConfirmTitle,
        COMMUTE_BOOKING_REQUESTS_SCREEN.rejectConfirmMessage(
          request.name,
          request.seatsBooked,
        ),
        [
          { text: COMMUTE_BOOKING_REQUESTS_SCREEN.rejectConfirmCancel, style: 'cancel' },
          {
            text: COMMUTE_BOOKING_REQUESTS_SCREEN.rejectConfirmAction,
            style: 'destructive',
            onPress: () => {
              void runMutation(
                request,
                'reject',
                rejectBookingById,
                COMMUTE_BOOKING_REQUESTS_SCREEN.rejectSuccessTitle,
                COMMUTE_BOOKING_REQUESTS_SCREEN.rejectSuccessMessage,
                COMMUTE_BOOKING_REQUESTS_SCREEN.rejectFailedTitle,
                mapCommuteBookingRejectError,
              );
            },
          },
        ],
      );
    },
    [runMutation],
  );

  const isRequestBusy = useCallback(
    (bookingId: string) => actionBookingId === bookingId,
    [actionBookingId],
  );

  const isAccepting = useCallback(
    (bookingId: string) => actionBookingId === bookingId && actionType === 'accept',
    [actionBookingId, actionType],
  );

  const isRejecting = useCallback(
    (bookingId: string) => actionBookingId === bookingId && actionType === 'reject',
    [actionBookingId, actionType],
  );

  return {
    actionBookingId,
    actionType,
    isRequestBusy,
    isAccepting,
    isRejecting,
    acceptRequest,
    declineRequest,
  };
};

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  resetTo,
  showAppAlert,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils';
import {
  DRIVER_TRIP_COMPLETED_SCREEN,
  getDriverTripCompletedMock,
  getRiderProfilePath,
  getTripDetailsPath,
} from '../constants';
import type {
  DriverPassengerReviewDraft,
  DriverRideKind,
  DriverTripCompletedPassenger,
  DriverTripCompletedSummary,
  PassengerRatingValue,
} from '../types';
import { useDriverRideKind } from './useDriverRideKind';

export interface UseDriverTripCompletedParams {
  destination?: string;
  /** Prefer reading from route via useDriverRideKind when omitted. */
  rideType?: DriverRideKind;
}

export interface UseDriverTripCompletedResult {
  trip: DriverTripCompletedSummary;
  reviews: Record<string, DriverPassengerReviewDraft>;
  canSubmit: boolean;
  setRating: (passengerId: string, value: PassengerRatingValue) => void;
  toggleCompliment: (passengerId: string, compliment: string) => void;
  setReviewNote: (passengerId: string, note: string) => void;
  submitReviews: () => void;
  openRiderProfile: (passenger: DriverTripCompletedPassenger) => void;
  viewTripDetails: () => void;
  goBack: () => void;
}

const emptyDraft = (): DriverPassengerReviewDraft => ({
  rating: 0,
  compliments: [],
  note: '',
});

export const useDriverTripCompleted = (
  params: UseDriverTripCompletedParams = {},
): UseDriverTripCompletedResult => {
  const router = useRouter();
  const routeRideType = useDriverRideKind();
  const rideType = params.rideType ?? routeRideType;

  const trip = useMemo(
    () =>
      getDriverTripCompletedMock({
        destination: params.destination,
        rideType,
      }),
    [params.destination, rideType],
  );

  const [reviews, setReviews] = useState<Record<string, DriverPassengerReviewDraft>>(() =>
    Object.fromEntries(trip.passengers.map((passenger) => [passenger.id, emptyDraft()])),
  );

  const canSubmit = useMemo(
    () => trip.passengers.every((passenger) => (reviews[passenger.id]?.rating ?? 0) > 0),
    [reviews, trip.passengers],
  );

  const setRating = useCallback((passengerId: string, value: PassengerRatingValue) => {
    triggerLightHaptic();
    setReviews((prev) => ({
      ...prev,
      [passengerId]: {
        ...(prev[passengerId] ?? emptyDraft()),
        rating: value,
      },
    }));
  }, []);

  const toggleCompliment = useCallback((passengerId: string, compliment: string) => {
    triggerLightHaptic();
    setReviews((prev) => {
      const current = prev[passengerId] ?? emptyDraft();
      const selected = current.compliments.includes(compliment)
        ? current.compliments.filter((item) => item !== compliment)
        : [...current.compliments, compliment];
      return {
        ...prev,
        [passengerId]: {
          ...current,
          compliments: selected,
        },
      };
    });
  }, []);

  const setReviewNote = useCallback((passengerId: string, note: string) => {
    setReviews((prev) => ({
      ...prev,
      [passengerId]: {
        ...(prev[passengerId] ?? emptyDraft()),
        note,
      },
    }));
  }, []);

  const submitReviews = useCallback(() => {
    if (!canSubmit) {
      showAppAlert(
        DRIVER_TRIP_COMPLETED_SCREEN.incompleteTitle,
        DRIVER_TRIP_COMPLETED_SCREEN.incompleteMessage,
      );
      return;
    }

    triggerSuccessHaptic();
    resetTo(router, ROUTES.home);
  }, [canSubmit, router]);

  const openRiderProfile = useCallback(
    (passenger: DriverTripCompletedPassenger) => {
      triggerLightHaptic();
      router.push(
        getRiderProfilePath({
          rideId: trip.rideId,
          riderId: passenger.id,
          name: passenger.name,
          avatarUri: passenger.avatarUri,
          verified: true,
        }),
      );
    },
    [router, trip.rideId],
  );

  const viewTripDetails = useCallback(() => {
    triggerLightHaptic();
    router.push(
      getTripDetailsPath({
        rideId: trip.rideId,
        origin: trip.pickupTitle,
        destination: trip.dropoffTitle,
        rideType: trip.rideType,
      }),
    );
  }, [router, trip.dropoffTitle, trip.pickupTitle, trip.rideId, trip.rideType]);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  return {
    trip,
    reviews,
    canSubmit,
    setRating,
    toggleCompliment,
    setReviewNote,
    submitReviews,
    openRiderProfile,
    viewTripDetails,
    goBack,
  };
};

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getRideById } from '@/features/offer-ride/api';
import {
  filterDriverPassengerRatingTasks,
  getDriverRatePassengersPath,
  getPendingRatings,
} from '@/features/ratings';
import { listDriverBookings, parseMoneySnapshot } from '@/features/ride-search/api';
import { fetchDrivingRoute } from '@/features/ride-search/services';
import { formatApiDepartureTime } from '@/features/ride-search/utils';
import {
  ensureRideCoords,
  formatDistanceKmLabel,
  formatEtaLabel,
  isValidMapCoordinate,
} from '@/shared/maps';
import {
  formatBhaiWayCoins,
  formatDisplayDate,
  resetTo,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils';
import {
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
  rideId?: string;
  /** Prefer reading from route via useDriverRideKind when omitted. */
  rideType?: DriverRideKind;
}

export interface UseDriverTripCompletedResult {
  trip: DriverTripCompletedSummary;
  reviews: Record<string, DriverPassengerReviewDraft>;
  canSubmit: boolean;
  continuing: boolean;
  setRating: (passengerId: string, value: PassengerRatingValue) => void;
  toggleCompliment: (passengerId: string, compliment: string) => void;
  setReviewNote: (passengerId: string, note: string) => void;
  submitReviews: () => void;
  openRiderProfile: (passenger: DriverTripCompletedPassenger) => void;
  viewTripDetails: () => void;
  goBack: () => void;
}


const formatTripCompletedDateLabel = (
  departureDate?: string | null,
  departureTime?: string | null,
): string => {
  const dateRaw = departureDate?.trim() ?? '';
  const timeRaw = departureTime?.trim() ?? '';
  const civil = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateRaw);
  const dateLabel = civil
    ? formatDisplayDate(new Date(Number(civil[1]), Number(civil[2]) - 1, Number(civil[3])))
    : dateRaw;
  const timeLabel = timeRaw ? formatApiDepartureTime(timeRaw) : '';
  return [dateLabel, timeLabel].filter(Boolean).join(' · ') || '—';
};


export const useDriverTripCompleted = (
  params: UseDriverTripCompletedParams = {},
): UseDriverTripCompletedResult => {
  const router = useRouter();
  const routeRideType = useDriverRideKind();
  const rideType = params.rideType ?? routeRideType;

  const [trip, setTrip] = useState<DriverTripCompletedSummary>(() =>
    getDriverTripCompletedMock({
      destination: params.destination,
      rideType,
    }),
  );

  useEffect(() => {
    const rideId = params.rideId?.trim() ?? '';
    if (!rideId) {
      setTrip(
        getDriverTripCompletedMock({
          destination: params.destination,
          rideType,
        }),
      );
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [ride, bookings] = await Promise.all([
          getRideById(rideId),
          listDriverBookings({ rideId, page: 1, limit: 50 }),
        ]);
        if (cancelled) {
          return;
        }

        const activePassengers = bookings.filter((booking) => {
          const status = String(booking.status ?? '').toUpperCase();
          return status !== 'CANCELLED';
        });

        const base = getDriverTripCompletedMock({
          destination: params.destination || ride.destination,
          rideType,
        });

        const pickupTitle =
          ride.source?.split(',')[0]?.trim() || ride.source || base.pickupTitle;
        const dropoffSource = params.destination || ride.destination || '';
        const dropoffTitle =
          dropoffSource.split(',')[0]?.trim() || dropoffSource || base.dropoffTitle;

        const coords = await ensureRideCoords({
          rideId: ride.id,
          originAddress: ride.source,
          destinationAddress: ride.destination,
        });

        let distanceKm: number | null = null;
        let durationMinutes: number | null = null;
        let pickupCoord = base.pickup;
        let dropoffCoord = base.dropoff;

        if (
          isValidMapCoordinate(coords.origin) &&
          isValidMapCoordinate(coords.destination)
        ) {
          pickupCoord = coords.origin;
          dropoffCoord = coords.destination;
          try {
            const route = await fetchDrivingRoute(coords.origin, coords.destination);
            if (Number.isFinite(route.distanceKm) && route.distanceKm > 0) {
              distanceKm = route.distanceKm;
            }
            if (Number.isFinite(route.durationMinutes) && route.durationMinutes > 0) {
              durationMinutes = Math.round(route.durationMinutes);
            }
          } catch {
            // Prefer empty stats over invented numbers.
          }
        }

        const earningsAmount = activePassengers.reduce(
          (sum, booking) => sum + parseMoneySnapshot(booking.totalAmount),
          0,
        );
        const earningsLabel =
          earningsAmount > 0
            ? formatBhaiWayCoins(Math.round(earningsAmount), { spaced: true })
            : '—';
        const distanceValueLabel =
          distanceKm != null && distanceKm > 0
            ? distanceKm < 10
              ? distanceKm.toFixed(1)
              : String(Math.round(distanceKm))
            : '—';
        const durationValueLabel =
          durationMinutes != null && durationMinutes > 0
            ? formatEtaLabel(durationMinutes)
            : '—';

        setTrip({
          ...base,
          rideId: ride.id,
          pickupTitle,
          pickupAddress: ride.source || base.pickupAddress,
          dropoffTitle,
          dropoffAddress: dropoffSource || base.dropoffAddress,
          dateLabel: formatTripCompletedDateLabel(
            ride.departureDate,
            ride.departureTime,
          ),
          statusLabel: 'COMPLETED',
          distanceLabel:
            distanceKm != null && distanceKm > 0
              ? formatDistanceKmLabel(distanceKm)
              : '—',
          distanceValueLabel,
          distanceUnitLabel: distanceKm != null && distanceKm > 0 ? 'km' : '',
          durationValueLabel,
          durationUnitLabel: '',
          hasAssuredBonus: false,
          assuredBonusLabel: '',
          fareLines:
            earningsAmount > 0
              ? [{ label: 'Ride fare', amountLabel: earningsLabel }]
              : [],
          earningsAmount,
          earningsLabel,
          rideFareLabel: earningsAmount > 0 ? earningsLabel : '',
          pickup: pickupCoord,
          dropoff: dropoffCoord,
          passengers: [],
        });
      } catch (error) {
        console.log('[DriverTripCompleted] failed to load ride', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.destination, params.rideId, rideType]);

  const [reviews] = useState<Record<string, DriverPassengerReviewDraft>>({});
  const [continuing, setContinuing] = useState(false);
  const ratingNavLockRef = useRef(false);

  const canSubmit = true;

  const setRating = useCallback((_passengerId: string, _value: PassengerRatingValue) => {
    triggerLightHaptic();
  }, []);

  const toggleCompliment = useCallback((_passengerId: string, _compliment: string) => {
    triggerLightHaptic();
  }, []);

  const setReviewNote = useCallback((_passengerId: string, _note: string) => {}, []);

  const submitReviews = useCallback(() => {
    if (continuing || ratingNavLockRef.current) {
      return;
    }

    const finish = () => {
      triggerSuccessHaptic();
      resetTo(router, ROUTES.home);
    };

    const rideId = params.rideId?.trim() ?? '';
    if (!rideId) {
      finish();
      return;
    }

    ratingNavLockRef.current = true;
    setContinuing(true);
    void (async () => {
      try {
        const pending = await getPendingRatings();
        const tasks = filterDriverPassengerRatingTasks(pending, rideId);
        if (tasks.length > 0) {
          // Replace so Trip Completed is not under Rate Passengers (avoids reopen via Back).
          router.replace(
            getDriverRatePassengersPath({
              rideId,
              destination: trip.dropoffTitle,
            }),
          );
          return;
        }
        finish();
      } catch (error) {
        console.log('[DriverTripCompleted] pending ratings failed', error);
        ratingNavLockRef.current = false;
        finish();
      } finally {
        setContinuing(false);
      }
    })();
  }, [continuing, params.rideId, router, trip.dropoffTitle]);

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
    continuing,
    setRating,
    toggleCompliment,
    setReviewNote,
    submitReviews,
    openRiderProfile,
    viewTripDetails,
    goBack,
  };
};

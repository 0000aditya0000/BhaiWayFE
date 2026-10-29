import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getBookingById, getPublicRideById, listMyBookings } from '@/features/ride-search/api';
import type { RideSearchItemDto } from '@/features/ride-search/api/ridesSearch.types';
import { getDriverChatPath } from '@/features/ride-search/constants';
import {
  ensureRideCoords,
  isValidMapCoordinate,
} from '@/shared/maps';
import {
  getErrorMessage,
  getSearchParam,
  showAppAlert,
  triggerLightHaptic,
} from '@/shared/utils';

import {
  DRIVER_TRACK_RIDE_SCREEN,
  getCancelUpcomingRidePath,
  RIDER_BOOKED_RIDE_SCREEN,
} from '../constants';
import type { DriverTrackConfirmedPassenger } from '../types';
import type { RiderBookedRideSummary } from '../types/rider-booked-ride.types';
import type { RiderCoPassenger } from '../types/rider-co-passenger.types';
import { filterUpcomingApiBookings } from '../utils/mapApiBooking';
import {
  mapBookingToRiderBookedDriverCard,
  mapBookingToRiderBookedRideSummary,
  mapCoPassengersFromBookingAndRide,
} from '../utils/mapRiderBookedRide';

export interface UseRiderBookedRideResult {
  ride: RiderBookedRideSummary | null;
  driver: DriverTrackConfirmedPassenger | null;
  coPassengers: readonly RiderCoPassenger[];
  loading: boolean;
  refreshing: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  goBack: () => void;
  callDriver: () => void;
  chatDriver: () => void;
  openCancelRide: () => void;
}

export const useRiderBookedRide = (): UseRiderBookedRideResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId?: string; rideId?: string }>();
  const bookingId = getSearchParam(params.bookingId)?.trim() || '';
  const rideIdParam = getSearchParam(params.rideId)?.trim() || '';

  const [ride, setRide] = useState<RiderBookedRideSummary | null>(null);
  const [driver, setDriver] = useState<DriverTrackConfirmedPassenger | null>(null);
  const [coPassengers, setCoPassengers] = useState<readonly RiderCoPassenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const applyCoords = useCallback(async (summary: RiderBookedRideSummary) => {
    try {
      const resolved = await ensureRideCoords({
        rideId: summary.rideId,
        originAddress: summary.source,
        destinationAddress: summary.destination,
      });
      const pickup = isValidMapCoordinate(resolved.origin) ? resolved.origin : null;
      const dropoff = isValidMapCoordinate(resolved.destination) ? resolved.destination : null;
      setRide({
        ...summary,
        pickup,
        dropoff,
      });
    } catch {
      setRide({
        ...summary,
        pickup: null,
        dropoff: null,
      });
    }
  }, []);

  const loadBooking = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!bookingId && !rideIdParam) {
        setErrorMessage(RIDER_BOOKED_RIDE_SCREEN.missingBookingMessage);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!opts?.silent) {
        setLoading(true);
      }
      setErrorMessage(null);

      try {
        let booking;
        if (bookingId) {
          booking = await getBookingById(bookingId);
        } else {
          const rows = await listMyBookings();
          booking = filterUpcomingApiBookings(rows).find(
            (row) => row.rideId?.trim() === rideIdParam,
          );
          if (!booking) {
            throw new Error('No upcoming booking found for this ride.');
          }
        }

        let publicRide: RideSearchItemDto | null = null;
        try {
          publicRide = await getPublicRideById(booking.rideId);
        } catch {
          publicRide = null;
        }

        const summary = mapBookingToRiderBookedRideSummary(booking, publicRide);
        setDriver(mapBookingToRiderBookedDriverCard(booking));
        setCoPassengers(mapCoPassengersFromBookingAndRide(booking, publicRide));
        await applyCoords(summary);
      } catch (error) {
        console.log('[Rider booked ride] load failed', getErrorMessage(error));
        setErrorMessage(getErrorMessage(error) || RIDER_BOOKED_RIDE_SCREEN.errorTitle);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyCoords, bookingId, rideIdParam],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        await loadBooking();
        if (!active) {
          return;
        }
      })();
      return () => {
        active = false;
      };
    },     [loadBooking]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadBooking({ silent: true });
  }, [loadBooking]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  const callDriver = useCallback(() => {
    triggerLightHaptic();
    if (!driver?.callAvailable || !driver.phone) {
      showAppAlert(
        DRIVER_TRACK_RIDE_SCREEN.callAlertTitle,
        DRIVER_TRACK_RIDE_SCREEN.contactUnavailableMessage,
      );
      return;
    }
    void Linking.openURL(`tel:${driver.phone}`);
  }, [driver]);

  const chatDriver = useCallback(() => {
    triggerLightHaptic();
    if (!driver) {
      return;
    }
    router.push(
      getDriverChatPath({
        driverName: driver.name,
        carModel: driver.subtitle || ride?.vehicleLabel || 'Your driver',
        bookingId: ride?.bookingId,
        conversationId: undefined,
        threadId: ride?.bookingId,
        perspective: 'rider',
        routeLabel: ride?.routeTitle,
        tripTimeLabel: ride?.dateLabel,
        avatarUri: driver.avatarUri,
      }),
    );
  }, [driver, ride, router]);

  const openCancelRide = useCallback(() => {
    if (!ride) {
      return;
    }
    triggerLightHaptic();
    router.push(
      getCancelUpcomingRidePath({
        rideId: ride.bookingId,
        dateLabel: ride.dateLabel,
        title: ride.rideType === 'assured' ? 'Assured Ride Confirmed' : 'Ride Confirmed',
        pickupLabel: ride.source,
        dropoffLabel: ride.destination,
        mode: 'riding',
        assured: ride.rideType === 'assured',
      }),
    );
  }, [ride, router]);

  return {
    ride,
    driver,
    coPassengers,
    loading,
    refreshing,
    errorMessage,
    refresh,
    goBack,
    callDriver,
    chatDriver,
    openCancelRide,
  };
};

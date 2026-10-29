import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { listMyRides, type RideResponseDto } from '@/features/offer-ride/api';
import { listVehicles, type VehicleResponse } from '@/features/profile/api';
import { listDriverBookings } from '@/features/ride-search/api';
import { getDriverChatPath } from '@/features/ride-search/constants';
import {
  ensureRideCoords,
  isValidMapCoordinate,
  type MapLatLng,
} from '@/shared/maps';
import {
  getErrorMessage,
  getSearchParam,
  showAppAlert,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils';
import {
  DEFAULT_DRIVER_TRACK_RIDE,
  DEFAULT_PENDING_REQUESTS,
  DRIVER_TRACK_RIDE_SCREEN,
  getCancelUpcomingRidePath,
  getDeclineRiderPath,
  getRiderProfilePath,
  getRiderRequestAcceptedPath,
} from '../constants';
import { regularRideRidersStore } from '../store';
import type {
  DriverTrackConfirmedPassenger,
  DriverTrackPendingRequest,
  DriverTrackRideSummary,
  UpcomingRideRider,
} from '../types';
import {
  filterConfirmedDriverBookings,
  filterPendingCommuteBookings,
  mapDriverBookingToConfirmedPassenger,
  mapDriverBookingToPendingRequest,
  mapDriverBookingToRider,
  mapDriverBookingVehicleLabel,
} from '../utils';
import { formatDriverRideSecurityDepositLabel } from '../utils/assuredDepositLabel';
import { useCommuteBookingRequestActions } from './useCommuteBookingRequestActions';

export interface UseDriverTrackRideResult {
  ride: DriverTrackRideSummary;
  confirmed: readonly DriverTrackConfirmedPassenger[];
  pending: readonly DriverTrackPendingRequest[];
  fillPercent: number;
  isDemoRide: boolean;
  loading: boolean;
  refreshing: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  goBack: () => void;
  callPassenger: (passenger: DriverTrackConfirmedPassenger) => void;
  chatPassenger: (passenger: DriverTrackConfirmedPassenger) => void;
  openRiderProfile: (passenger: DriverTrackConfirmedPassenger) => void;
  acceptRequest: (id: string) => void;
  declineRequest: (id: string) => void;
  openCancelRide: () => void;
  isAccepting: (bookingId: string) => boolean;
  isRejecting: (bookingId: string) => boolean;
}

const toDemoConfirmed = (rider: UpcomingRideRider): DriverTrackConfirmedPassenger => ({
  id: rider.id,
  name: rider.name,
  subtitle: rider.subtitle ?? '',
  verified: rider.verified,
  avatarUri: rider.avatarUri,
  seatsBooked: rider.seatsBooked,
  callAvailable: true,
  chatAvailable: true,
});

const formatTrackDatePart = (date: string): string => {
  const civil = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim());
  if (!civil) {
    return date.trim();
  }
  return `${civil[3]}/${civil[2]}/${civil[1]}`;
};

const formatVehicleFromGarage = (vehicle: VehicleResponse | undefined): string => {
  if (!vehicle) {
    return '';
  }
  const make = vehicle.make?.trim() ?? '';
  const model = vehicle.model?.trim() ?? '';
  return [make, model].filter(Boolean).join(' ');
};

const isApiError = (error: unknown): error is { status: number; message?: string } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as { status?: unknown }).status === 'number';

export const useDriverTrackRide = (): UseDriverTrackRideResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const rideId = getSearchParam(params.rideId) || DEFAULT_DRIVER_TRACK_RIDE.rideId;
  const isDemoRide = rideId === DEFAULT_DRIVER_TRACK_RIDE.rideId;

  const [rideRow, setRideRow] = useState<RideResponseDto | null>(null);
  const [vehicleLabel, setVehicleLabel] = useState('');
  const [apiConfirmed, setApiConfirmed] = useState<readonly DriverTrackConfirmedPassenger[]>(
    [],
  );
  const [demoConfirmed, setDemoConfirmed] = useState<readonly UpcomingRideRider[]>(() =>
    isDemoRide ? regularRideRidersStore.getForRide(rideId) : [],
  );
  const [pending, setPending] = useState<DriverTrackPendingRequest[]>(() =>
    isDemoRide ? [...DEFAULT_PENDING_REQUESTS] : [],
  );
  const [loading, setLoading] = useState(!isDemoRide);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pickupCoord, setPickupCoord] = useState<MapLatLng | null>(null);
  const [dropoffCoord, setDropoffCoord] = useState<MapLatLng | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCoords = async () => {
      try {
        const resolved = await ensureRideCoords({
          rideId,
          originAddress: rideRow?.source,
          destinationAddress: rideRow?.destination,
        });
        if (cancelled) {
          return;
        }
        setPickupCoord(isValidMapCoordinate(resolved.origin) ? resolved.origin : null);
        setDropoffCoord(
          isValidMapCoordinate(resolved.destination) ? resolved.destination : null,
        );
      } catch {
        if (!cancelled) {
          setPickupCoord(null);
          setDropoffCoord(null);
        }
      }
    };

    void loadCoords();
    return () => {
      cancelled = true;
    };
  }, [rideId, rideRow?.destination, rideRow?.source]);

  const loadDriverRideBookings = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (isDemoRide || !rideId.trim()) {
        return;
      }
      if (!opts?.silent) {
        setLoading(true);
      }
      setErrorMessage(null);
      try {
        const [rides, bookings, pendingBookings, vehicles] = await Promise.all([
          listMyRides(),
          listDriverBookings({ rideId, page: 1, limit: 50 }),
          listDriverBookings({ rideId, status: 'PENDING', page: 1, limit: 50 }),
          listVehicles().catch(() => [] as VehicleResponse[]),
        ]);
        const matched = rides.find((row) => row.id === rideId) ?? null;
        setRideRow(matched);
        const confirmedRows = filterConfirmedDriverBookings(bookings);
        const pendingRows = filterPendingCommuteBookings(pendingBookings);
        console.log('[Ride Details] GET /bookings/driver/my-rides', {
          rideId,
          count: bookings.length,
          confirmedCount: confirmedRows.length,
          pendingCommuteCount: pendingRows.length,
        });
        setApiConfirmed(confirmedRows.map(mapDriverBookingToConfirmedPassenger));
        setPending(pendingRows.map(mapDriverBookingToPendingRequest));
        const fromBooking = mapDriverBookingVehicleLabel(bookings);
        const fromGarage = matched
          ? formatVehicleFromGarage(vehicles.find((item) => item.id === matched.vehicleId))
          : '';
        setVehicleLabel(fromBooking || fromGarage);
      } catch (error) {
        console.log('[Ride Details] driver bookings refresh failed', getErrorMessage(error));
        setErrorMessage(getErrorMessage(error) || DRIVER_TRACK_RIDE_SCREEN.errorTitle);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isDemoRide, rideId],
  );

  const {
    acceptRequest: acceptCommuteRequest,
    declineRequest: declineCommuteRequest,
    isAccepting,
    isRejecting,
  } = useCommuteBookingRequestActions({
    onAfterMutation: () => loadDriverRideBookings({ silent: true }),
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        if (isDemoRide) {
          setDemoConfirmed(regularRideRidersStore.getForRide(rideId));
          const acceptedIds = new Set(
            regularRideRidersStore.getForRide(rideId).map((r) => r.id),
          );
          const declinedIds = regularRideRidersStore.getDeclinedIds(rideId);
          setPending(
            DEFAULT_PENDING_REQUESTS.filter(
              (item) => !acceptedIds.has(item.id) && !declinedIds.has(item.id),
            ),
          );
          setLoading(false);
          setErrorMessage(null);
          return;
        }
        await loadDriverRideBookings();
        if (!active) {
          return;
        }
      })();
      return () => {
        active = false;
      };
    }, [isDemoRide, loadDriverRideBookings, rideId]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!isDemoRide) {
        return undefined;
      }
      return regularRideRidersStore.subscribe(() => {
        setDemoConfirmed(regularRideRidersStore.getForRide(rideId));
        const acceptedIds = new Set(
          regularRideRidersStore.getForRide(rideId).map((r) => r.id),
        );
        const declinedIds = regularRideRidersStore.getDeclinedIds(rideId);
        setPending(
          DEFAULT_PENDING_REQUESTS.filter(
            (item) => !acceptedIds.has(item.id) && !declinedIds.has(item.id),
          ),
        );
      });
    }, [isDemoRide, rideId]),
  );

  const refresh = useCallback(async () => {
    if (isDemoRide) {
      setDemoConfirmed(regularRideRidersStore.getForRide(rideId));
      return;
    }
    setRefreshing(true);
    await loadDriverRideBookings({ silent: true });
  }, [isDemoRide, loadDriverRideBookings, rideId]);

  const confirmed = useMemo(
    () => (isDemoRide ? demoConfirmed.map(toDemoConfirmed) : apiConfirmed),
    [apiConfirmed, demoConfirmed, isDemoRide],
  );

  const seatsTotal = useMemo(() => {
    if (rideRow && Number.isFinite(rideRow.totalSeats)) {
      return rideRow.totalSeats;
    }
    return isDemoRide ? DEFAULT_DRIVER_TRACK_RIDE.seatsTotal : Math.max(1, confirmed.length);
  }, [confirmed.length, isDemoRide, rideRow]);

  const seatsAvailable = useMemo(() => {
    if (rideRow && Number.isFinite(rideRow.availableSeats)) {
      return rideRow.availableSeats;
    }
    return Math.max(0, seatsTotal - confirmed.reduce((sum, item) => sum + item.seatsBooked, 0));
  }, [confirmed, rideRow, seatsTotal]);

  const seatsConfirmed = useMemo(() => {
    if (rideRow && Number.isFinite(rideRow.totalSeats) && Number.isFinite(rideRow.availableSeats)) {
      return Math.max(0, rideRow.totalSeats - rideRow.availableSeats);
    }
    return confirmed.reduce((sum, item) => sum + item.seatsBooked, 0);
  }, [confirmed, rideRow]);

  const fillPercent = useMemo(() => {
    if (seatsTotal <= 0) {
      return 0;
    }
    return Math.round((seatsConfirmed / seatsTotal) * 100);
  }, [seatsConfirmed, seatsTotal]);

  const source = rideRow?.source?.trim() || DEFAULT_DRIVER_TRACK_RIDE.source;
  const destination = rideRow?.destination?.trim() || DEFAULT_DRIVER_TRACK_RIDE.destination;
  const departureTimeLabel =
    rideRow?.departureTime?.trim() || DEFAULT_DRIVER_TRACK_RIDE.departureTimeLabel;
  const dateOnly = rideRow
    ? formatTrackDatePart(rideRow.departureDate)
    : DEFAULT_DRIVER_TRACK_RIDE.dateLabel;

  const ride: DriverTrackRideSummary = {
    rideId,
    listingId: rideRow?.id?.slice(0, 8).toUpperCase() ?? DEFAULT_DRIVER_TRACK_RIDE.listingId,
    rideType:
      rideRow?.rideType === 'ASSURED'
        ? 'assured'
        : rideRow?.rideType === 'COMMUTE'
          ? 'commute'
          : 'regular',
    routeTitle: rideRow
      ? `${rideRow.source} → ${rideRow.destination}`
      : DEFAULT_DRIVER_TRACK_RIDE.routeTitle,
    source,
    destination,
    dateLabel: rideRow
      ? [dateOnly, departureTimeLabel].filter(Boolean).join(', ')
      : DEFAULT_DRIVER_TRACK_RIDE.dateLabel,
    departureTimeLabel,
    vehicleLabel,
    seatsConfirmed,
    seatsAvailable,
    seatsTotal,
    bookingCount: confirmed.length,
    securityDepositLabel: formatDriverRideSecurityDepositLabel(rideRow),
    pickup: pickupCoord,
    dropoff: dropoffCoord,
    confirmed,
    pending,
  };

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  const callPassenger = useCallback((passenger: DriverTrackConfirmedPassenger) => {
    triggerLightHaptic();
    if (!passenger.callAvailable || !passenger.phone) {
      showAppAlert(
        DRIVER_TRACK_RIDE_SCREEN.callAlertTitle,
        DRIVER_TRACK_RIDE_SCREEN.contactUnavailableMessage,
      );
      return;
    }
    void Linking.openURL(`tel:${passenger.phone}`);
  }, []);

  const chatPassenger = useCallback(
    (passenger: DriverTrackConfirmedPassenger) => {
      triggerLightHaptic();
      if (!passenger.chatAvailable) {
        showAppAlert(
          DRIVER_TRACK_RIDE_SCREEN.chatAlertTitle,
          DRIVER_TRACK_RIDE_SCREEN.contactUnavailableMessage,
        );
        return;
      }
      router.push(
        getDriverChatPath({
          driverName: passenger.name,
          carModel: 'Confirmed rider',
          conversationId: passenger.conversationId,
          bookingId: passenger.id,
          threadId: passenger.conversationId || passenger.id,
          perspective: 'driver',
          routeLabel: ride.routeTitle,
          tripTimeLabel: ride.dateLabel,
          avatarUri: passenger.avatarUri,
        }),
      );
    },
    [ride.dateLabel, ride.routeTitle, rideId, router],
  );

  const openRiderProfile = useCallback(
    (passenger: DriverTrackConfirmedPassenger) => {
      triggerLightHaptic();
      router.push(
        getRiderProfilePath({
          rideId,
          riderId: passenger.id,
          name: passenger.name,
          subtitle: passenger.subtitle,
          avatarUri: passenger.avatarUri,
          seatsBooked: passenger.seatsBooked,
          verified: passenger.verified,
        }),
      );
    },
    [rideId, router],
  );

  const acceptRequest = useCallback(
    (id: string) => {
      const request = pending.find((item) => item.id === id);
      if (!request) {
        return;
      }

      if (isDemoRide) {
        triggerSuccessHaptic();
        regularRideRidersStore.accept(rideId, {
          id: request.id,
          name: request.name,
          subtitle: request.subtitle,
          seatsBooked: request.seatsBooked,
          verified: request.idVerified,
          avatarUri: request.avatarUri,
        });
        setPending((prev) => prev.filter((item) => item.id !== id));
        router.push(
          getRiderRequestAcceptedPath({
            rideId,
            riderId: request.id,
            name: request.name,
            subtitle: request.subtitle,
            avatarUri: request.avatarUri,
            rating: request.rating ?? 0,
            ridesCount: request.ridesCount ?? 0,
            seatsBooked: request.seatsBooked,
          }),
        );
        return;
      }

      if (ride.rideType !== 'commute') {
        return;
      }

      acceptCommuteRequest(request);
    },
    [acceptCommuteRequest, isDemoRide, pending, ride.rideType, rideId, router],
  );

  const declineRequest = useCallback(
    (id: string) => {
      const request = pending.find((item) => item.id === id);
      if (!request) {
        return;
      }

      if (isDemoRide) {
        triggerLightHaptic();
        router.push(
          getDeclineRiderPath({
            rideId,
            riderId: request.id,
            name: request.name,
          }),
        );
        return;
      }

      if (ride.rideType !== 'commute') {
        return;
      }

      declineCommuteRequest(request);
    },
    [declineCommuteRequest, isDemoRide, pending, ride.rideType, rideId, router],
  );

  /** Opens the shared Cancel Ride screen (same as passenger) with mode=driving. */
  const openCancelRide = useCallback(() => {
    triggerLightHaptic();
    const [source = 'Pickup', destination = 'Drop-off'] = ride.routeTitle
      .split('→')
      .map((part) => part.trim());
    router.push(
      getCancelUpcomingRidePath({
        rideId,
        dateLabel: ride.dateLabel,
        title: 'Ride Published',
        pickupLabel: ride.source || source,
        dropoffLabel: ride.destination || destination,
        mode: 'driving',
        assured: rideRow?.rideType === 'ASSURED',
        commute: ride.rideType === 'commute',
        seriesId: rideRow?.seriesId,
      }),
    );
  }, [
    ride.dateLabel,
    ride.destination,
    ride.rideType,
    ride.routeTitle,
    ride.source,
    rideId,
    rideRow?.rideType,
    rideRow?.seriesId,
    router,
  ]);

  return {
    ride,
    confirmed,
    pending,
    fillPercent,
    isDemoRide,
    loading,
    refreshing,
    errorMessage,
    refresh,
    goBack,
    callPassenger,
    chatPassenger,
    openRiderProfile,
    acceptRequest,
    declineRequest,
    openCancelRide,
    isAccepting,
    isRejecting,
  };
};

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { authSession, showAppAlert } from '@/store';

import { ROUTES } from '@/config';
import { useSessionUser } from '@/shared/hooks';
import {
  canBookWomenOnlyRide,
  resolveWomenOnly,
  WOMEN_ONLY_RIDE_MESSAGE,
} from '@/shared/utils/womenOnlyRide';
import { getPublicRideById } from '../api';
import {
  getCancelRidePath,
  getDriverChatPath,
  getReviewBookingPath,
  getRideDetailsMock,
} from '../constants';
import type { DriverRecentRideStatusItem } from '../constants/driver-recent-rides.constants';
import { fetchDrivingRoute } from '../services';
import type {
  MapCoordinate,
  RideDetailsData,
  RideDetailsDriver,
  RideDetailsMode,
  RideRule,
  RideType,
} from '../types';
import {
  formatApiDepartureTime,
  mapRideSearchItemToResult,
  parsePricePerSeat,
} from '../utils';
import { mapRideSourceToPreferenceRules } from '../utils/mapRidePreferences';
import { computeAssuredDepositFromRide } from '../utils/assuredDeposit.utils';

export interface UseRideDetailsParams {
  rideId: string;
  rideType: RideType;
  mode?: RideDetailsMode;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  price?: number;
  distanceLabel?: string;
  durationLabel?: string;
  dateLabel?: string;
  departureTime?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

export interface UseRideDetailsResult {
  details: RideDetailsData;
  mode: RideDetailsMode;
  isPreview: boolean;
  routeCoordinates: MapCoordinate[];
  /** Assured security deposit from GET /rides/public/:id (integer coin string). */
  assuredDepositCoins: string | null;
  /** Women Only — booking UX helper only; backend remains authoritative. */
  womenOnlyBookingBlocked: boolean;
  bookRide: () => void;
  contactDriver: () => void;
  cancelRide: () => void;
  chatPassenger: (name: string) => void;
  goHome: () => void;
  openMore: () => void;
}

const emptyDriver = (overrides?: Partial<RideDetailsDriver>): RideDetailsDriver => ({
  id: '',
  name: '',
  company: '',
  rating: 0,
  totalRatings: 0,
  verified: false,
  vehicleColor: '',
  vehicleModel: '',
  vehicleType: '',
  seatingCapacity: 0,
  recentRides: [],
  ...overrides,
});

export const useRideDetails = (params: UseRideDetailsParams): UseRideDetailsResult => {
  const router = useRouter();
  const sessionUser = useSessionUser();
  const mode: RideDetailsMode = params.mode === 'booked' ? 'booked' : 'preview';
  const isAssured = params.rideType === 'assured';

  const [liveDriver, setLiveDriver] = useState<RideDetailsDriver>(() =>
    emptyDriver({
      name: params.driverName ?? '',
      vehicleModel: params.carModel ?? '',
    }),
  );
  const [liveOrigin, setLiveOrigin] = useState(params.origin ?? '');
  const [liveDestination, setLiveDestination] = useState(params.destination ?? '');
  const [livePricePerSeat, setLivePricePerSeat] = useState(
    params.price != null && params.price > 0 ? params.price : 0,
  );
  const [liveSeatsLeft, setLiveSeatsLeft] = useState<number | null>(null);
  const [liveMaxPassengers, setLiveMaxPassengers] = useState(0);
  const [liveDepartureLabel, setLiveDepartureLabel] = useState('');
  const [liveWomenOnly, setLiveWomenOnly] = useState(false);
  const [liveRules, setLiveRules] = useState<RideRule[]>([]);
  const [liveRecentRides, setLiveRecentRides] = useState<
    readonly DriverRecentRideStatusItem[]
  >([]);
  const [assuredDepositCoins, setAssuredDepositCoins] = useState<string | null>(null);

  useEffect(() => {
    if (!params.rideId || mode !== 'preview') {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const ride = await getPublicRideById(params.rideId);
        if (cancelled) {
          return;
        }
        const mapped = mapRideSearchItemToResult(ride);
        setLiveDriver({
          id: mapped.driver.id,
          name: mapped.driver.name,
          company:
            ride.driver.company?.trim() ||
            ride.driver.organization?.trim() ||
            ride.organization?.trim() ||
            ride.company?.trim() ||
            '',
          rating: mapped.driver.rating,
          totalRatings: mapped.driver.totalRatings,
          verified: mapped.driver.verified,
          vehicleColor: mapped.vehicle.color,
          vehicleModel: mapped.vehicle.label,
          vehicleType: mapped.vehicle.vehicleType,
          seatingCapacity: mapped.vehicle.seatingCapacity,
          avatarUri: mapped.driver.avatarUri,
          recentRides: mapped.driver.recentRides,
        });
        setLiveRecentRides(mapped.driver.recentRides);
        setLiveOrigin(ride.source);
        setLiveDestination(ride.destination);
        setLivePricePerSeat(parsePricePerSeat(String(ride.pricePerSeat)));
        setLiveSeatsLeft(Math.max(0, ride.availableSeats));
        setLiveMaxPassengers(Math.max(0, Math.floor(Number(ride.totalSeats) || 0)));
        setLiveWomenOnly(resolveWomenOnly(ride));
        setLiveRules(mapRideSourceToPreferenceRules(ride));
        setLiveDepartureLabel(
          [params.dateLabel, formatApiDepartureTime(ride.departureTime)]
            .map((part) => (part ?? '').trim())
            .filter(Boolean)
            .join(' · '),
        );
        if (isAssured) {
          setAssuredDepositCoins(computeAssuredDepositFromRide(ride, 1));
        }
      } catch {
        // Keep navigation-param fallbacks when public ride fetch fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAssured, mode, params.dateLabel, params.rideId]);

  const details = useMemo(() => {
    const base = getRideDetailsMock({
      rideId: params.rideId,
      rideType: params.rideType,
      origin: liveOrigin || params.origin,
      destination: liveDestination || params.destination,
      driverName: liveDriver.name || params.driverName,
      carModel: liveDriver.vehicleModel || params.carModel,
      price: livePricePerSeat > 0 ? livePricePerSeat : params.price,
      distanceLabel: params.distanceLabel,
      durationLabel: params.durationLabel,
      originLat: params.originLat,
      originLng: params.originLng,
      destinationLat: params.destinationLat,
      destinationLng: params.destinationLng,
    });

    return {
      ...base,
      dateTimeLabel: liveDepartureLabel || base.dateTimeLabel,
      womenOnly: liveWomenOnly,
      rules: liveRules,
      driver: {
        ...liveDriver,
        recentRides: liveRecentRides,
      },
      seatsLeft: liveSeatsLeft ?? base.seatsLeft,
      maxPassengers: liveMaxPassengers || liveDriver.seatingCapacity || base.maxPassengers,
      pickup: {
        ...base.pickup,
        address: liveOrigin || base.pickup.address,
        title: shortName(liveOrigin || base.pickup.title),
      },
      dropoff: {
        ...base.dropoff,
        address: liveDestination || base.dropoff.address,
        title: shortName(liveDestination || base.dropoff.title),
      },
    };
  }, [
    liveDepartureLabel,
    liveDestination,
    liveDriver,
    liveMaxPassengers,
    liveOrigin,
    livePricePerSeat,
    liveRecentRides,
    liveRules,
    liveSeatsLeft,
    liveWomenOnly,
    params,
  ]);

  const womenOnlyBookingBlocked = useMemo(
    () =>
      Boolean(details.womenOnly) &&
      !canBookWomenOnlyRide(sessionUser?.gender ?? authSession.getUser()?.gender),
    [details.womenOnly, sessionUser?.gender],
  );

  const [routeCoordinates, setRouteCoordinates] = useState<MapCoordinate[]>([
    { latitude: details.pickup.latitude, longitude: details.pickup.longitude },
    { latitude: details.dropoff.latitude, longitude: details.dropoff.longitude },
  ]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const route = await fetchDrivingRoute(
        { latitude: details.pickup.latitude, longitude: details.pickup.longitude },
        { latitude: details.dropoff.latitude, longitude: details.dropoff.longitude },
      );
      if (!cancelled) {
        setRouteCoordinates(route.coordinates);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    details.dropoff.latitude,
    details.dropoff.longitude,
    details.pickup.latitude,
    details.pickup.longitude,
  ]);

  const bookRide = useCallback(() => {
    if (womenOnlyBookingBlocked) {
      showAppAlert('Women Only Ride', WOMEN_ONLY_RIDE_MESSAGE);
      return;
    }

    if (isAssured) {
      const pricePerSeat =
        livePricePerSeat > 0
          ? livePricePerSeat
          : params.price != null && params.price > 0
            ? params.price
            : details.fare.total;

      router.push(
        getReviewBookingPath({
          rideId: details.rideId,
          rideType: details.rideType,
          origin: params.origin || details.pickup.address || details.pickup.title,
          destination: params.destination || details.dropoff.address || details.dropoff.title,
          driverName: details.driver.name,
          carModel: details.driver.vehicleModel,
          price: pricePerSeat,
          seats: 1,
          availableSeats: liveSeatsLeft ?? undefined,
          dateLabel: params.dateLabel,
          departureTime: params.departureTime,
          originLat: params.originLat ?? details.pickup.latitude,
          originLng: params.originLng ?? details.pickup.longitude,
          destinationLat: params.destinationLat ?? details.dropoff.latitude,
          destinationLng: params.destinationLng ?? details.dropoff.longitude,
        }),
      );
      return;
    }

    router.push(
      getReviewBookingPath({
        rideId: details.rideId,
        rideType: details.rideType,
        origin: params.origin || details.pickup.address || details.pickup.title,
        destination: params.destination || details.dropoff.address || details.dropoff.title,
        driverName: details.driver.name,
        carModel: details.driver.vehicleModel,
        price: details.fare.total,
        dateLabel: params.dateLabel,
        departureTime: params.departureTime,
        originLat: params.originLat ?? details.pickup.latitude,
        originLng: params.originLng ?? details.pickup.longitude,
        destinationLat: params.destinationLat ?? details.dropoff.latitude,
        destinationLng: params.destinationLng ?? details.dropoff.longitude,
      }),
    );
  }, [details, isAssured, livePricePerSeat, liveSeatsLeft, params, router, womenOnlyBookingBlocked]);

  const contactDriver = useCallback(() => {
    if (mode === 'preview') {
      showAppAlert(
        'Chat with Driver',
        'Chat becomes available after you book this ride.',
      );
      return;
    }
    router.push(
      getDriverChatPath({
        driverName: details.driver.name,
        carModel: details.driver.vehicleModel,
        perspective: 'rider',
      }),
    );
  }, [details.driver.name, details.driver.vehicleModel, mode, router]);

  const cancelRide = useCallback(() => {
    router.push(
      getCancelRidePath({
        rideId: details.rideId,
        rideType: details.rideType,
        origin: details.pickup.address || details.pickup.title,
        destination: details.dropoff.address || details.dropoff.title,
      }),
    );
  }, [details, router]);

  const chatPassenger = useCallback((name: string) => {
    showAppAlert('Chat', `Chat with ${name} will be available soon.`);
  }, []);

  const goHome = useCallback(() => {
    router.replace(ROUTES.home);
  }, [router]);

  const openMore = useCallback(() => {
    showAppAlert('More', 'More ride actions will be available soon.');
  }, []);

  return {
    details,
    mode,
    isPreview: mode === 'preview',
    routeCoordinates,
    assuredDepositCoins,
    womenOnlyBookingBlocked,
    bookRide,
    contactDriver,
    cancelRide,
    chatPassenger,
    goHome,
    openMore,
  };
};

const shortName = (value?: string): string => {
  const segment = value?.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value?.trim() || '';
};

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { showAppAlert } from '@/store';

import { ROUTES } from '@/config';
import { hydrateAuthenticatedUserFromServer } from '@/features/auth/services/sessionHydration';
import {
  applyCouponDiscountToFare,
  buildCouponContextKey,
  couponApplyBridgeStore,
  filterCouponsForContext,
  listMyCoupons,
  listPublicCoupons,
  previewCouponForBooking,
  type CouponDto,
} from '@/features/coupons';
import { assuredDepositPenaltyStore } from '@/features/profile/store/assuredDepositPenaltyStore';

import {
  buildRegularFareEstimate,
  getPublicRideById,
  resolvePersonPhotoUrl,
  type RideSearchItemDto,
} from '../api';
import {
  getPaymentPath,
  getReviewBookingMock,
  REVIEW_BOOKING_SCREEN,
} from '../constants';
import { fetchDrivingRoute, type RouteGeometry } from '../services';
import type { MapCoordinate, ReviewBookingData, RideType } from '../types';
import {
  formatApiDepartureTime,
  mapRideSearchItemToResult,
  parsePricePerSeat,
} from '../utils';
import {
  computeAssuredDepositFromRide,
  isAssuredPublicRideBookable,
  resolveAssuredDepositPenaltyNotice,
  resolveAssuredDepositPercentageFromRide,
} from '../utils/assuredDeposit.utils';
import { resolveBookingVehicleLabel } from '../utils/bookingVehicle';
import { rideVehicleCache } from '../utils/rideVehicleCache';
import { getErrorMessage, triggerLightHaptic } from '@/shared/utils';

interface AppliedPromoState {
  code: string;
  chargeScope: 'RIDE_FARE' | 'ASSURED_SECURITY_DEPOSIT';
  discountAmount: number;
  title: string | null;
  benefitType?: string | null;
  pointsCredit?: number | null;
}

export interface UseReviewBookingParams {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  /** Driver pricePerSeat from search */
  price?: number;
  seats?: number;
  availableSeats?: number;
  dateLabel?: string;
  departureTime?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

export type AssuredReviewLoadState = 'idle' | 'loading' | 'ready' | 'error' | 'unavailable';

export interface UseReviewBookingResult {
  booking: ReviewBookingData;
  routeCoordinates: MapCoordinate[];
  promoInput: string;
  promoApplied: boolean;
  promoApplying: boolean;
  promoError: string | null;
  availableCoupons: CouponDto[];
  selectedSeats: number;
  maxSeats: number;
  isRegular: boolean;
  isAssured: boolean;
  /** Assured-only: public ride fetch lifecycle. Regular stays idle/ready via mock shell. */
  assuredLoadState: AssuredReviewLoadState;
  assuredErrorMessage: string | null;
  canConfirmAssured: boolean;
  /** Assured deposit % from public ride when amount is percentage-based. */
  assuredDepositPercentage: number | null;
  assuredDepositPenaltyNotice: ReturnType<typeof resolveAssuredDepositPenaltyNotice>;
  retryAssuredLoad: () => void;
  setSelectedSeats: (value: number) => void;
  setPromoInput: (value: string) => void;
  applyPromo: () => void;
  clearPromo: () => void;
  selectAvailableCoupon: (code: string) => void;
  openAvailableCoupons: () => void;
  confirmBooking: () => void;
}

const parseCoordinate = (
  latitude?: number,
  longitude?: number,
): MapCoordinate | null => {
  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }
  if (latitude === 0 && longitude === 0) {
    return null;
  }
  return { latitude, longitude };
};

const EMPTY_ASSURED_BOOKING = (rideId: string): ReviewBookingData => ({
  rideId,
  rideType: 'assured',
  pickup: {
    label: REVIEW_BOOKING_SCREEN.pickupLabel,
    address: '',
    latitude: 0,
    longitude: 0,
  },
  dropoff: {
    label: REVIEW_BOOKING_SCREEN.dropoffLabel,
    address: '',
    latitude: 0,
    longitude: 0,
  },
  distanceLabel: '',
  durationLabel: '',
  driver: {
    id: 'driver',
    name: '',
    subtitle: '',
    rating: 0,
    totalRides: 0,
  },
  coPassengers: [],
  maxPassengers: 1,
  promoCode: '',
  fare: {
    rideFare: 0,
    platformFee: 0,
    promoDiscount: 0,
    assuredFee: 0,
    total: 0,
  },
});

export const useReviewBooking = (params: UseReviewBookingParams): UseReviewBookingResult => {
  const router = useRouter();
  const isRegular = params.rideType === 'regular';
  const isAssured = params.rideType === 'assured';

  const pickupCoord = useMemo(
    () => parseCoordinate(params.originLat, params.originLng),
    [params.originLat, params.originLng],
  );
  const dropoffCoord = useMemo(
    () => parseCoordinate(params.destinationLat, params.destinationLng),
    [params.destinationLat, params.destinationLng],
  );

  const initialMaxSeats = Math.max(
    1,
    Number.isFinite(params.availableSeats) && (params.availableSeats ?? 0) > 0
      ? Math.floor(params.availableSeats as number)
      : isAssured
        ? 1
        : 8,
  );
  const initialSeats = Math.min(
    Math.max(
      1,
      Number.isFinite(params.seats) && (params.seats ?? 0) > 0
        ? Math.floor(params.seats as number)
        : 1,
    ),
    initialMaxSeats,
  );

  const [selectedSeats, setSelectedSeatsState] = useState(initialSeats);
  const [maxSeats, setMaxSeats] = useState(initialMaxSeats);
  const [pricePerSeat, setPricePerSeat] = useState(
    params.price != null && params.price > 0 ? params.price : 0,
  );
  const [liveDriverName, setLiveDriverName] = useState(params.driverName ?? '');
  const [liveCarModel, setLiveCarModel] = useState(params.carModel ?? '');
  const [liveOrigin, setLiveOrigin] = useState(params.origin ?? '');
  const [liveDestination, setLiveDestination] = useState(params.destination ?? '');
  const [liveDepartureTime, setLiveDepartureTime] = useState(params.departureTime ?? '');
  const [assuredDepositCoins, setAssuredDepositCoins] = useState<string | null>(null);
  const [publicRide, setPublicRide] = useState<RideSearchItemDto | null>(null);
  const [assuredLoadState, setAssuredLoadState] = useState<AssuredReviewLoadState>(
    isAssured ? 'loading' : 'idle',
  );
  const [assuredErrorMessage, setAssuredErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const userDepositPenalty = useSyncExternalStore(
    assuredDepositPenaltyStore.subscribe,
    assuredDepositPenaltyStore.get,
    assuredDepositPenaltyStore.get,
  );

  useEffect(() => {
    if (!isAssured) {
      return;
    }
    void hydrateAuthenticatedUserFromServer().catch(() => undefined);
  }, [isAssured, reloadToken]);

  useEffect(() => {
    setSelectedSeatsState(initialSeats);
    setMaxSeats(initialMaxSeats);
    if (params.price != null && params.price > 0) {
      setPricePerSeat(params.price);
    }
    if (isAssured) {
      setAssuredDepositCoins(null);
      setPublicRide(null);
    }
  }, [initialMaxSeats, initialSeats, isAssured, params.price, params.rideId]);

  /** Regular: soft-enrich from public ride (existing behavior). Assured: hard source of truth. */
  useEffect(() => {
    if (!params.rideId || params.rideId === 'ride-default') {
      if (isAssured) {
        setAssuredLoadState('error');
        setAssuredErrorMessage('Missing ride details. Please search again.');
      }
      return;
    }

    if (isAssured) {
      setAssuredLoadState('loading');
      setAssuredErrorMessage(null);
    }

    let cancelled = false;
    void (async () => {
      try {
        const ride = await getPublicRideById(params.rideId);
        if (cancelled) {
          return;
        }

        if (isAssured) {
          if (!isAssuredPublicRideBookable(ride)) {
            setPublicRide(ride);
            setAssuredLoadState('unavailable');
            setAssuredErrorMessage(REVIEW_BOOKING_SCREEN.unavailableBody);
            return;
          }

          const mapped = mapRideSearchItemToResult(ride);
          const unit = parsePricePerSeat(String(ride.pricePerSeat));
          const seatsCap = Math.max(1, ride.availableSeats);
          setPublicRide(ride);
          setPricePerSeat(unit);
          setMaxSeats(seatsCap);
          setSelectedSeatsState((prev) => Math.min(Math.max(1, prev), seatsCap));
          setLiveDriverName(mapped.driver.name);
          setLiveCarModel(mapped.carModel);
          setLiveOrigin(ride.source);
          setLiveDestination(ride.destination);
          setLiveDepartureTime(formatApiDepartureTime(ride.departureTime));
          setAssuredDepositCoins(
            computeAssuredDepositFromRide(ride, Math.min(initialSeats, seatsCap)),
          );
          setAssuredLoadState('ready');
          setAssuredErrorMessage(null);

          await rideVehicleCache.save({
            rideId: params.rideId,
            vehicleLabel: resolveBookingVehicleLabel(ride.vehicle, mapped.carModel),
            make: ride.vehicle.make,
            model: ride.vehicle.model,
            color: ride.vehicle.color ?? undefined,
          });
          return;
        }

        // Regular soft enrich — unchanged.
        const mapped = mapRideSearchItemToResult(ride);
        setPublicRide(ride);
        setPricePerSeat(parsePricePerSeat(String(ride.pricePerSeat)));
        setMaxSeats(Math.max(1, ride.availableSeats));
        setSelectedSeatsState((prev) =>
          Math.min(Math.max(1, prev), Math.max(1, ride.availableSeats)),
        );
        setLiveDriverName(mapped.driver.name);
        setLiveCarModel(mapped.carModel);
        setLiveOrigin(ride.source);
        setLiveDestination(ride.destination);
        setLiveDepartureTime(formatApiDepartureTime(ride.departureTime));
        await rideVehicleCache.save({
          rideId: params.rideId,
          vehicleLabel: resolveBookingVehicleLabel(ride.vehicle, mapped.carModel),
          make: ride.vehicle.make,
          model: ride.vehicle.model,
          color: ride.vehicle.color ?? undefined,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (isAssured) {
          setPublicRide(null);
          setAssuredLoadState('error');
          setAssuredErrorMessage(
            getErrorMessage(error) || 'Could not load this Assured ride. Please try again.',
          );
          return;
        }
        // Regular: keep navigation-param / mock fallbacks when public ride fetch fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialSeats, isAssured, params.rideId, reloadToken]);

  /** Assured: recompute deposit from cached public ride when seats change (no extra GET). */
  useEffect(() => {
    if (!isAssured || !publicRide || assuredLoadState !== 'ready') {
      return;
    }
    setAssuredDepositCoins(computeAssuredDepositFromRide(publicRide, selectedSeats));
  }, [assuredLoadState, isAssured, publicRide, selectedSeats]);

  const bookingBase = useMemo(() => {
    if (isAssured) {
      const unit = pricePerSeat > 0 ? pricePerSeat : 0;
      const rideFare = unit * Math.max(1, selectedSeats);
      const assuredFee = assuredDepositCoins
        ? parsePricePerSeat(assuredDepositCoins)
        : 0;
      const pickupAddress = liveOrigin || params.origin || '';
      const dropoffAddress = liveDestination || params.destination || '';

      return {
        ...EMPTY_ASSURED_BOOKING(params.rideId),
        maxPassengers: maxSeats,
        coPassengers: [],
        pickup: {
          label: REVIEW_BOOKING_SCREEN.pickupLabel,
          address: pickupAddress,
          latitude: pickupCoord?.latitude ?? 0,
          longitude: pickupCoord?.longitude ?? 0,
        },
        dropoff: {
          label: REVIEW_BOOKING_SCREEN.dropoffLabel,
          address: dropoffAddress,
          latitude: dropoffCoord?.latitude ?? 0,
          longitude: dropoffCoord?.longitude ?? 0,
        },
        driver: {
          id: publicRide?.driver.id ?? 'driver',
          name: liveDriverName || params.driverName || '',
          subtitle: liveCarModel || params.carModel || '',
          rating: 0,
          totalRides: 0,
          avatarUri: resolvePersonPhotoUrl(publicRide?.driver) || undefined,
        },
        fare: {
          rideFare,
          platformFee: 0,
          promoDiscount: 0,
          assuredFee,
          total: rideFare + assuredFee,
        },
      } satisfies ReviewBookingData;
    }

    const data = getReviewBookingMock(params.rideId, params.rideType);
    const pickupAddress = liveOrigin || params.origin || data.pickup.address;
    const dropoffAddress = liveDestination || params.destination || data.dropoff.address;
    const driverName = liveDriverName || params.driverName || data.driver.name;
    const driverSubtitle = liveCarModel || params.carModel || data.driver.subtitle;
    const unit = pricePerSeat > 0 ? pricePerSeat : data.fare.rideFare;
    const fare = buildRegularFareEstimate(unit, selectedSeats);

    return {
      ...data,
      coPassengers: [],
      maxPassengers: maxSeats,
      pickup: {
        ...data.pickup,
        address: pickupAddress,
        latitude: pickupCoord?.latitude ?? data.pickup.latitude,
        longitude: pickupCoord?.longitude ?? data.pickup.longitude,
      },
      dropoff: {
        ...data.dropoff,
        address: dropoffAddress,
        latitude: dropoffCoord?.latitude ?? data.dropoff.latitude,
        longitude: dropoffCoord?.longitude ?? data.dropoff.longitude,
      },
      driver: {
        ...data.driver,
        name: driverName,
        subtitle: driverSubtitle,
        avatarUri: resolvePersonPhotoUrl(publicRide?.driver) || undefined,
      },
      fare,
    };
  }, [
    assuredDepositCoins,
    dropoffCoord,
    isAssured,
    liveCarModel,
    liveDestination,
    liveDriverName,
    liveOrigin,
    maxSeats,
    params.carModel,
    params.destination,
    params.driverName,
    params.origin,
    params.rideId,
    params.rideType,
    pickupCoord,
    pricePerSeat,
    publicRide?.driver,
    selectedSeats,
  ]);

  const [route, setRoute] = useState<RouteGeometry | null>(null);
  const [promoInput, setPromoInputState] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromoState | null>(null);
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<CouponDto[]>([]);
  const promoApplyInFlightRef = useRef(false);
  const promoRequestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const loadCoupons = async () => {
      try {
        const [publicPage, minePage] = await Promise.all([
          listPublicCoupons({ page: 1, limit: 20 }),
          listMyCoupons({ page: 1, limit: 20 }).catch(() => ({ items: [] as CouponDto[] })),
        ]);
        if (cancelled) {
          return;
        }
        const byCode = new Map<string, CouponDto>();
        for (const item of filterCouponsForContext(
          [...minePage.items, ...publicPage.items],
          'RIDER',
        )) {
          if (!byCode.has(item.code)) {
            byCode.set(item.code, item);
          }
        }
        setAvailableCoupons(Array.from(byCode.values()));
      } catch {
        if (!cancelled) {
          setAvailableCoupons([]);
        }
      }
    };
    void loadCoupons();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isAssured && assuredLoadState !== 'ready') {
      setRoute(null);
      return;
    }

    let cancelled = false;
    const loadRoute = async () => {
      const origin = {
        latitude: bookingBase.pickup.latitude,
        longitude: bookingBase.pickup.longitude,
      };
      const destination = {
        latitude: bookingBase.dropoff.latitude,
        longitude: bookingBase.dropoff.longitude,
      };
      if (
        !Number.isFinite(origin.latitude) ||
        !Number.isFinite(origin.longitude) ||
        (origin.latitude === 0 && origin.longitude === 0)
      ) {
        return;
      }
      const next = await fetchDrivingRoute(origin, destination);
      if (!cancelled) {
        setRoute(next);
      }
    };
    void loadRoute();
    return () => {
      cancelled = true;
    };
  }, [
    assuredLoadState,
    bookingBase.dropoff.latitude,
    bookingBase.dropoff.longitude,
    bookingBase.pickup.latitude,
    bookingBase.pickup.longitude,
    isAssured,
  ]);

  const fare = useMemo(() => {
    if (!appliedPromo) {
      return {
        ...bookingBase.fare,
        promoDiscount: 0,
        total:
          bookingBase.fare.rideFare +
          bookingBase.fare.platformFee +
          bookingBase.fare.assuredFee,
      };
    }
    return applyCouponDiscountToFare({
      rideFare: bookingBase.fare.rideFare,
      platformFee: bookingBase.fare.platformFee,
      assuredFee: bookingBase.fare.assuredFee,
      discountAmount: appliedPromo.discountAmount,
      chargeScope: appliedPromo.chargeScope,
    });
  }, [appliedPromo, bookingBase.fare]);

  const booking = useMemo(
    () => ({
      ...bookingBase,
      promoCode: appliedPromo?.code ?? promoInput,
      fare,
      distanceLabel: route?.distanceLabel ?? bookingBase.distanceLabel,
      durationLabel: route?.durationLabel ?? bookingBase.durationLabel,
    }),
    [appliedPromo?.code, bookingBase, fare, promoInput, route],
  );

  // Seat/fare changes invalidate a previously previewed coupon amount.
  useEffect(() => {
    setAppliedPromo(null);
    setPromoError(null);
  }, [bookingBase.fare.rideFare, bookingBase.fare.assuredFee, selectedSeats]);

  const routeCoordinates = useMemo(
    () =>
      route?.coordinates ?? [
        { latitude: booking.pickup.latitude, longitude: booking.pickup.longitude },
        { latitude: booking.dropoff.latitude, longitude: booking.dropoff.longitude },
      ],
    [
      booking.dropoff.latitude,
      booking.dropoff.longitude,
      booking.pickup.latitude,
      booking.pickup.longitude,
      route,
    ],
  );

  const setSelectedSeats = useCallback(
    (value: number) => {
      if (!Number.isInteger(value)) {
        return;
      }
      setSelectedSeatsState(Math.min(Math.max(1, value), maxSeats));
    },
    [maxSeats],
  );

  const setPromoInput = useCallback((value: string) => {
    setPromoInputState(value);
    setPromoError(null);
    setAppliedPromo(null);
  }, []);

  const clearPromo = useCallback(() => {
    promoRequestIdRef.current += 1;
    setAppliedPromo(null);
    setPromoError(null);
    setPromoInputState('');
  }, []);

  const runCouponPreview = useCallback(
    async (rawCode: string) => {
      if (promoApplyInFlightRef.current) {
        return;
      }
      const code = rawCode.trim().toUpperCase();
      if (!code) {
        showAppAlert('Promo required', 'Please enter a promo code.');
        return;
      }

      const requestId = ++promoRequestIdRef.current;
      const listed = availableCoupons.find((item) => item.code === code) ?? null;
      promoApplyInFlightRef.current = true;
      setPromoApplying(true);
      setPromoError(null);

      try {
        const result = await previewCouponForBooking({
          code,
          rideType: params.rideType,
          rideFare: bookingBase.fare.rideFare,
          assuredFee: bookingBase.fare.assuredFee,
          listedCoupon: listed,
          requestId,
          isCurrent: (id) => id === promoRequestIdRef.current,
        });

        if (requestId !== promoRequestIdRef.current) {
          return;
        }

        if (!result.ok) {
          if (result.message === 'Cancelled') {
            return;
          }
          setAppliedPromo(null);
          setPromoError(result.message);
          showAppAlert('Invalid promo', result.message);
          return;
        }

        const { applied } = result;
        setAppliedPromo({
          code: applied.code,
          chargeScope: applied.chargeScope,
          discountAmount: applied.discountAmount,
          title: applied.title,
          benefitType: applied.benefitType,
          pointsCredit: applied.pointsCredit,
        });
        setPromoInputState(applied.code);

        if (
          String(applied.benefitType ?? '').toUpperCase() === 'POINTS_CREDIT' &&
          applied.discountAmount <= 0
        ) {
          showAppAlert(
            'Coupon applied',
            applied.pointsCredit
              ? `This offer credits ${applied.pointsCredit} Coins to your wallet. Ride fare is unchanged.`
              : 'This offer credits Coins to your wallet. Ride fare is unchanged.',
          );
        }
      } catch (error) {
        if (requestId !== promoRequestIdRef.current) {
          return;
        }
        setAppliedPromo(null);
        const message = getErrorMessage(error, 'Could not validate this coupon.');
        setPromoError(message);
        showAppAlert('Unable to apply promo', message);
      } finally {
        if (requestId === promoRequestIdRef.current) {
          promoApplyInFlightRef.current = false;
          setPromoApplying(false);
        }
      }
    },
    [
      availableCoupons,
      bookingBase.fare.assuredFee,
      bookingBase.fare.rideFare,
      params.rideType,
    ],
  );

  const applyPromo = useCallback(() => {
    void runCouponPreview(promoInput);
  }, [promoInput, runCouponPreview]);

  const selectAvailableCoupon = useCallback(
    (code: string) => {
      setPromoInputState(code);
      setPromoError(null);
      setAppliedPromo(null);
      void runCouponPreview(code);
    },
    [runCouponPreview],
  );

  const openAvailableCoupons = useCallback(() => {
    triggerLightHaptic();
    const rideId = booking.rideId || params.rideId;
    router.push({
      pathname: ROUTES.availableCoupons,
      params: {
        rideId,
        rideType: params.rideType,
        rideFare: String(bookingBase.fare.rideFare),
        assuredFee: String(bookingBase.fare.assuredFee),
        seats: String(selectedSeats),
        appliedCode: appliedPromo?.code ?? '',
        couponContext: 'rider',
      },
    });
  }, [
    appliedPromo?.code,
    booking.rideId,
    bookingBase.fare.assuredFee,
    bookingBase.fare.rideFare,
    params.rideId,
    params.rideType,
    router,
    selectedSeats,
  ]);

  useFocusEffect(
    useCallback(() => {
      const contextKey = buildCouponContextKey({
        actorContext: 'RIDER',
        rideId: booking.rideId || params.rideId,
        rideType: params.rideType,
        seats: selectedSeats,
        rideFare: bookingBase.fare.rideFare,
        assuredFee: bookingBase.fare.assuredFee,
      });
      const bridged = couponApplyBridgeStore.consume(contextKey);
      if (!bridged) {
        return;
      }
      setAppliedPromo({
        code: bridged.code,
        chargeScope: bridged.chargeScope,
        discountAmount: bridged.discountAmount,
        title: bridged.title,
        benefitType: bridged.benefitType,
        pointsCredit: bridged.pointsCredit,
      });
      setPromoInputState(bridged.code);
      setPromoError(null);
    }, [
      booking.rideId,
      bookingBase.fare.assuredFee,
      bookingBase.fare.rideFare,
      params.rideId,
      params.rideType,
      selectedSeats,
    ]),
  );

  const canConfirmAssured =
    isAssured &&
    assuredLoadState === 'ready' &&
    Boolean(publicRide) &&
    pricePerSeat > 0 &&
    selectedSeats >= 1;

  const retryAssuredLoad = useCallback(() => {
    if (!isAssured) {
      return;
    }
    setReloadToken((value) => value + 1);
  }, [isAssured]);

  const assuredDepositPercentage =
    isAssured && publicRide
      ? resolveAssuredDepositPercentageFromRide(publicRide)
      : null;

  const assuredDepositPenaltyNotice = useMemo(
    () =>
      isAssured && publicRide
        ? resolveAssuredDepositPenaltyNotice({
            ride: publicRide,
            userPenalty: userDepositPenalty,
            depositPercentage: assuredDepositPercentage,
          })
        : { showPreviousCancellationNotice: false, percentage: null },
    [assuredDepositPercentage, isAssured, publicRide, userDepositPenalty],
  );

  const confirmBooking = useCallback(() => {
    if (isAssured) {
      if (!canConfirmAssured || !publicRide) {
        showAppAlert(
          REVIEW_BOOKING_SCREEN.loadErrorTitle,
          assuredErrorMessage || 'Ride details are not ready yet. Please wait or retry.',
        );
        return;
      }
      if (!isAssuredPublicRideBookable(publicRide)) {
        showAppAlert(
          REVIEW_BOOKING_SCREEN.unavailableTitle,
          REVIEW_BOOKING_SCREEN.unavailableBody,
        );
        return;
      }
    }

    const depositCoinsForPayment =
      appliedPromo?.chargeScope === 'ASSURED_SECURITY_DEPOSIT'
        ? String(Math.max(0, Math.round(fare.assuredFee)))
        : assuredDepositCoins ?? undefined;

    router.push(
      getPaymentPath({
        rideId: isAssured ? publicRide!.id : booking.rideId,
        rideType: booking.rideType,
        origin: booking.pickup.address,
        destination: booking.dropoff.address,
        driverName: booking.driver.name,
        carModel: booking.driver.subtitle,
        price: isRegular
          ? pricePerSeat || fare.rideFare / selectedSeats
          : fare.rideFare,
        seats: selectedSeats,
        assuredFee: fare.assuredFee,
        assuredDepositCoins: depositCoinsForPayment,
        assuredDepositPercentage: assuredDepositPercentage ?? undefined,
        assuredDepositPenaltyNotice: assuredDepositPenaltyNotice.showPreviousCancellationNotice,
        couponCode: appliedPromo?.code,
        couponChargeScope: appliedPromo?.chargeScope,
        couponDiscount: appliedPromo ? String(appliedPromo.discountAmount) : undefined,
        dateLabel: params.dateLabel,
        departureTime: liveDepartureTime || params.departureTime,
        originLat: booking.pickup.latitude,
        originLng: booking.pickup.longitude,
        destinationLat: booking.dropoff.latitude,
        destinationLng: booking.dropoff.longitude,
      }),
    );
  }, [
    appliedPromo,
    assuredDepositCoins,
    assuredDepositPercentage,
    assuredDepositPenaltyNotice,
    assuredErrorMessage,
    booking,
    canConfirmAssured,
    fare.assuredFee,
    fare.rideFare,
    isAssured,
    isRegular,
    liveDepartureTime,
    params.dateLabel,
    params.departureTime,
    pricePerSeat,
    publicRide,
    router,
    selectedSeats,
  ]);

  return {
    booking,
    routeCoordinates,
    promoInput,
    promoApplied: appliedPromo != null,
    promoApplying,
    promoError,
    availableCoupons,
    selectedSeats,
    maxSeats,
    isRegular,
    isAssured,
    assuredLoadState,
    assuredErrorMessage,
    canConfirmAssured,
    assuredDepositPercentage,
    assuredDepositPenaltyNotice,
    retryAssuredLoad,
    setSelectedSeats,
    setPromoInput,
    applyPromo,
    clearPromo,
    selectAvailableCoupon,
    openAvailableCoupons,
    confirmBooking,
  };
};

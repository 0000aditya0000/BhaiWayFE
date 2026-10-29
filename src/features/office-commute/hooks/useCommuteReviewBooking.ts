import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  applyCouponDiscountToFare,
  buildCouponContextKey,
  couponApplyBridgeStore,
  previewCouponForBooking,
} from '@/features/coupons';
import { getPublicRideById } from '@/features/ride-search/api';
import { fetchDrivingRoute, type RouteGeometry } from '@/features/ride-search/services';
import type { MapCoordinate } from '@/features/ride-search/types';
import { formatApiDepartureTime } from '@/features/ride-search/utils/rideSearch.mapper';
import { getErrorMessage, showAppAlert, triggerLightHaptic } from '@/shared/utils';

import { getCommutePaymentPath } from '../constants/commute-payment.constants';
import { COMMUTE_REVIEW_BOOKING_SCREEN } from '../constants/commute-review-booking.constants';
import type { CommuteReviewBookingData } from '../types/commute-review-booking.types';
import {
  computeCommuteTotalFareAmount,
  isCommuteApiRideType,
  parseCommuteMapCoordinate,
  resolveCommuteRiderPricePerSeat,
  resolveCommuteRideEndpoints,
  resolveRouteMatchPercentFromApi,
} from '../utils/commuteBooking.utils';

interface AppliedCommutePromo {
  code: string;
  chargeScope: 'RIDE_FARE' | 'ASSURED_SECURITY_DEPOSIT';
  discountAmount: number;
  benefitType?: string | null;
  pointsCredit?: number | null;
}

export interface UseCommuteReviewBookingParams {
  rideId: string;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  price?: number;
  dateLabel?: string;
  departureTime?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  matchPercent?: number;
}

export interface UseCommuteReviewBookingResult {
  booking: CommuteReviewBookingData | null;
  selectedSeats: number;
  maxSeats: number;
  loadState: 'loading' | 'ready' | 'error';
  errorMessage: string | null;
  routeCoordinates: Array<{ latitude: number; longitude: number }>;
  confirming: boolean;
  promoInput: string;
  promoApplied: boolean;
  promoApplying: boolean;
  promoDiscount: number;
  promoError: string | null;
  /** Fare after authoritative coupon preview (display). */
  displayFareTotal: number;
  setPromoInput: (value: string) => void;
  applyPromo: () => void;
  clearPromo: () => void;
  openAvailableCoupons: () => void;
  setSelectedSeats: (value: number) => void;
  confirmBooking: () => void;
  retryLoad: () => void;
  goBack: () => void;
  openNotifications: () => void;
}

const mapVehicleLabel = (make?: string | null, model?: string | null): string =>
  [make?.trim(), model?.trim()].filter(Boolean).join(' ') || 'Car';

export const useCommuteReviewBooking = (
  params: UseCommuteReviewBookingParams,
): UseCommuteReviewBookingResult => {
  const router = useRouter();
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [booking, setBooking] = useState<CommuteReviewBookingData | null>(null);
  const [selectedSeats, setSelectedSeatsState] = useState(1);
  const [maxSeats, setMaxSeats] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [route, setRoute] = useState<RouteGeometry | null>(null);
  const [promoInput, setPromoInputState] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedCommutePromo | null>(null);
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const promoInFlightRef = useRef(false);
  const promoRequestIdRef = useRef(0);

  const rideId = params.rideId?.trim() ?? '';

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!rideId) {
        setLoadState('error');
        setErrorMessage('Missing ride details.');
        return;
      }

      setLoadState('loading');
      setErrorMessage(null);

      try {
        const ride = await getPublicRideById(rideId);
        if (cancelled) {
          return;
        }

        if (!isCommuteApiRideType(ride.rideType)) {
          setLoadState('error');
          setErrorMessage('This ride is not available for Commute booking.');
          return;
        }

        const riderPrice = resolveCommuteRiderPricePerSeat(ride);
        const available = Math.max(0, Math.floor(Number(ride.availableSeats) || 0));
        const seatLimit = Math.max(1, available);

        const pickupLabel = params.origin?.trim() || ride.source;
        const dropoffLabel = params.destination?.trim() || ride.destination;
        const endpoints = resolveCommuteRideEndpoints(ride, params);
        const pickupCoord = endpoints?.pickup ?? { latitude: 0, longitude: 0 };
        const dropoffCoord = endpoints?.dropoff ?? { latitude: 0, longitude: 0 };

        setMaxSeats(seatLimit);
        setSelectedSeatsState((prev) => Math.min(Math.max(1, prev), seatLimit));
        setRoute(null);

        setBooking({
          rideId: ride.id,
          driverName:
            params.driverName?.trim() ||
            ride.driver.displayName?.trim() ||
            'BhaiWay Driver',
          carModel:
            params.carModel?.trim() ||
            mapVehicleLabel(ride.vehicle.make, ride.vehicle.model),
          distanceLabel: '—',
          durationLabel: params.departureTime || formatApiDepartureTime(ride.departureTime),
          matchPercent:
            resolveRouteMatchPercentFromApi(ride) ??
            (params.matchPercent != null && Number.isFinite(params.matchPercent)
              ? params.matchPercent
              : null),
          matchCaption: COMMUTE_REVIEW_BOOKING_SCREEN.matchCaption,
          pickup: {
            label: pickupLabel,
            address: ride.source,
            latitude: pickupCoord.latitude,
            longitude: pickupCoord.longitude,
          },
          dropoff: {
            label: dropoffLabel,
            address: ride.destination,
            latitude: dropoffCoord.latitude,
            longitude: dropoffCoord.longitude,
          },
          rideAlongs: [],
          riderPricePerSeat: riderPrice,
          availableSeats: available,
          fare: {
            riderPricePerSeat: riderPrice,
            seats: 1,
            total: riderPrice,
          },
        });
        setLoadState('ready');
      } catch {
        if (!cancelled) {
          setLoadState('error');
          setErrorMessage('Unable to load ride details. Please try again.');
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    params.carModel,
    params.departureTime,
    params.destination,
    params.destinationLat,
    params.destinationLng,
    params.driverName,
    params.matchPercent,
    params.origin,
    params.originLat,
    params.originLng,
    reloadToken,
    rideId,
  ]);

  const setSelectedSeats = useCallback(
    (value: number) => {
      const next = Math.max(1, Math.min(maxSeats, Math.floor(value)));
      setSelectedSeatsState(next);
      setBooking((prev) => {
        if (!prev) {
          return prev;
        }
        const total = computeCommuteTotalFareAmount(prev.riderPricePerSeat, next);
        return {
          ...prev,
          fare: {
            riderPricePerSeat: prev.riderPricePerSeat,
            seats: next,
            total,
          },
        };
      });
    },
    [maxSeats],
  );

  useEffect(() => {
    if (booking && selectedSeats !== booking.fare.seats) {
      setSelectedSeats(selectedSeats);
    }
  }, [booking, selectedSeats, setSelectedSeats]);

  useEffect(() => {
    if (!booking || loadState !== 'ready') {
      return;
    }

    const pickup = parseCommuteMapCoordinate(
      booking.pickup.latitude,
      booking.pickup.longitude,
    );
    const dropoff = parseCommuteMapCoordinate(
      booking.dropoff.latitude,
      booking.dropoff.longitude,
    );
    if (!pickup || !dropoff) {
      return;
    }

    let cancelled = false;

    const loadRoute = async () => {
      try {
        const next = await fetchDrivingRoute(pickup, dropoff);
        if (cancelled) {
          return;
        }
        setRoute(next);
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                distanceLabel: next.distanceLabel,
              }
            : prev,
        );
      } catch {
        if (!cancelled) {
          setRoute(null);
        }
      }
    };

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [
    booking?.dropoff.latitude,
    booking?.dropoff.longitude,
    booking?.pickup.latitude,
    booking?.pickup.longitude,
    loadState,
  ]);

  const routeCoordinates = useMemo<MapCoordinate[]>(
    () =>
      route?.coordinates ??
      (booking
        ? [
            { latitude: booking.pickup.latitude, longitude: booking.pickup.longitude },
            { latitude: booking.dropoff.latitude, longitude: booking.dropoff.longitude },
          ]
        : []),
    [booking, route],
  );

  const retryLoad = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

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
      if (promoInFlightRef.current || !booking) {
        return;
      }
      const code = rawCode.trim().toUpperCase();
      if (!code) {
        showAppAlert('Promo required', 'Please enter a promo code.');
        return;
      }
      const rideFare = computeCommuteTotalFareAmount(booking.riderPricePerSeat, selectedSeats);
      const requestId = ++promoRequestIdRef.current;
      promoInFlightRef.current = true;
      setPromoApplying(true);
      setPromoError(null);

      try {
        const result = await previewCouponForBooking({
          code,
          rideType: 'commute',
          rideFare,
          assuredFee: 0,
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
          promoInFlightRef.current = false;
          setPromoApplying(false);
        }
      }
    },
    [booking, selectedSeats],
  );

  const applyPromo = useCallback(() => {
    void runCouponPreview(promoInput);
  }, [promoInput, runCouponPreview]);

  const openAvailableCoupons = useCallback(() => {
    if (!booking) {
      return;
    }
    triggerLightHaptic();
    const rideFare = computeCommuteTotalFareAmount(booking.riderPricePerSeat, selectedSeats);
    router.push({
      pathname: ROUTES.availableCoupons,
      params: {
        rideId: booking.rideId,
        rideType: 'commute',
        rideFare: String(rideFare),
        assuredFee: '0',
        seats: String(selectedSeats),
        appliedCode: appliedPromo?.code ?? '',
      },
    });
  }, [appliedPromo?.code, booking, router, selectedSeats]);

  useEffect(() => {
    setAppliedPromo(null);
    setPromoError(null);
  }, [selectedSeats]);

  useFocusEffect(
    useCallback(() => {
      if (!booking) {
        return;
      }
      const rideFare = computeCommuteTotalFareAmount(booking.riderPricePerSeat, selectedSeats);
      const contextKey = buildCouponContextKey({
        rideId: booking.rideId,
        rideType: 'commute',
        seats: selectedSeats,
        rideFare,
        assuredFee: 0,
      });
      const bridged = couponApplyBridgeStore.consume(contextKey);
      if (!bridged) {
        return;
      }
      setAppliedPromo({
        code: bridged.code,
        chargeScope: bridged.chargeScope,
        discountAmount: bridged.discountAmount,
        benefitType: bridged.benefitType,
        pointsCredit: bridged.pointsCredit,
      });
      setPromoInputState(bridged.code);
      setPromoError(null);
    }, [booking, selectedSeats]),
  );

  const promoDiscount = appliedPromo?.discountAmount ?? 0;

  const displayFareTotal = useMemo(() => {
    if (!booking) {
      return 0;
    }
    const rideFare = computeCommuteTotalFareAmount(booking.riderPricePerSeat, selectedSeats);
    if (!appliedPromo || appliedPromo.discountAmount <= 0) {
      return rideFare;
    }
    return applyCouponDiscountToFare({
      rideFare,
      platformFee: 0,
      assuredFee: 0,
      discountAmount: appliedPromo.discountAmount,
      chargeScope: appliedPromo.chargeScope,
    }).total;
  }, [appliedPromo, booking, selectedSeats]);

  const confirmBooking = useCallback(() => {
    if (!booking || confirming || loadState !== 'ready') {
      return;
    }
    if (booking.availableSeats < 1) {
      showAppAlert('No seats', 'This ride has no available seats.');
      return;
    }

    triggerLightHaptic();
    setConfirming(true);
    router.push(
      getCommutePaymentPath({
        rideId: booking.rideId,
        seats: selectedSeats,
        riderPricePerSeat: booking.riderPricePerSeat,
        origin: booking.pickup.label,
        destination: booking.dropoff.label,
        driverName: booking.driverName,
        carModel: booking.carModel,
        couponCode: appliedPromo?.code,
        couponChargeScope: appliedPromo?.chargeScope,
        couponDiscount: appliedPromo ? String(appliedPromo.discountAmount) : undefined,
        originLat: booking.pickup.latitude || params.originLat,
        originLng: booking.pickup.longitude || params.originLng,
        destinationLat: booking.dropoff.latitude || params.destinationLat,
        destinationLng: booking.dropoff.longitude || params.destinationLng,
      }),
    );
    setConfirming(false);
  }, [appliedPromo, booking, confirming, loadState, params, router, selectedSeats]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.officeCommuteResult);
  }, [router]);

  const openNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  return {
    booking,
    selectedSeats,
    maxSeats,
    loadState,
    errorMessage,
    routeCoordinates,
    confirming,
    promoInput,
    promoApplied: appliedPromo != null,
    promoApplying,
    promoDiscount,
    promoError,
    displayFareTotal,
    setPromoInput,
    applyPromo,
    clearPromo,
    openAvailableCoupons,
    setSelectedSeats,
    confirmBooking,
    retryLoad,
    goBack,
    openNotifications,
  };
};

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { useWalletBalance } from '@/features/profile/hooks/useWalletBalance';
import { walletTopUpReturnStore } from '@/features/profile/store/walletTopUpReturnStore';
import { formatBhaiWayCoins } from '@/shared/utils';
import { resetTo } from '@/shared/utils';
import {
  getBookingById,
  payBookingWithCash,
  payBookingWithWallet,
  resolveBookingRideId,
  type PayLaterPaymentResponse,
} from '../api';
import {
  buildTripCompletedPaymentOptions,
  getTripCompletedMock,
  getTripCompletedPath,
  getTripReviewPath,
  TRIP_COMPLETED_SCREEN,
} from '../constants';
import { fetchDrivingRoute } from '../services';
import { formatApiDepartureTime } from '../utils';
import {
  bookingDtoToPayLaterSnapshot,
  buildPayLaterPayButtonLabel,
  buildPayLaterSettlementView,
  isPayLaterPaymentSuccessful,
  mapPayLaterPaymentError,
  normalizePayLaterPaymentResponse,
  parsePayLaterInsufficientWalletError,
  type PayLaterSettlementView,
} from '../utils/payLaterSettlement.utils';
import { formatDistanceKmLabel, isValidMapCoordinate } from '@/shared/maps';
import { formatDisplayDate } from '@/shared/utils';
import type {
  MapCoordinate,
  RideType,
  TripCompletedData,
  TripCompletedInsufficientBalance,
  TripCompletedPaymentId,
  TripCompletedPaymentOption,
  TripCompletedPaymentPhase,
} from '../types';

export interface UseTripCompletedParams {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  price?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  bookingId?: string;
}

export interface UseTripCompletedResult {
  trip: TripCompletedData;
  routeCoordinates: MapCoordinate[];
  bookingLoading: boolean;
  settlement: PayLaterSettlementView | null;
  showPaymentUi: boolean;
  paymentOptions: readonly TripCompletedPaymentOption[];
  selectedPaymentId: TripCompletedPaymentId | null;
  selectPayment: (id: TripCompletedPaymentId) => void;
  paymentPhase: TripCompletedPaymentPhase;
  paymentError: string | null;
  insufficientBalance: TripCompletedInsufficientBalance | null;
  payButtonLabel: string;
  payDisabled: boolean;
  paymentResult: PayLaterPaymentResponse | null;
  submitPayment: () => void;
  dismissInsufficientBalance: () => void;
  openAddMoney: () => void;
  chooseCashAfterInsufficient: () => void;
  continueAfterPayment: () => void;
  openNotifications: () => void;
  goHome: () => void;
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

const buildTripFromBooking = (
  params: UseTripCompletedParams,
  settlement: PayLaterSettlementView | null,
  ride?: {
    id?: string;
    source?: string | null;
    destination?: string | null;
    departureDate?: string | null;
    departureTime?: string | null;
  } | null,
  driverName?: string,
  carModel?: string,
  bookingRideId?: string,
): TripCompletedData => {
  const total = settlement
    ? Number(settlement.fareCoins)
    : params.price != null && Number.isFinite(params.price)
      ? params.price
      : 240;
  const pickupTitle = shortName(ride?.source ?? params.origin) || 'Pickup';
  const dropoffTitle = shortName(ride?.destination ?? params.destination) || 'Drop-off';
  const fareLines = settlement?.isAssured
    ? [
        {
          label: TRIP_COMPLETED_SCREEN.rideFareLabel,
          amountLabel: settlement.fareLabel,
        },
        ...(settlement.securityDepositLabel
          ? [
              {
                label: TRIP_COMPLETED_SCREEN.assuredDepositLabel,
                amountLabel: settlement.securityDepositLabel,
              },
            ]
          : []),
      ]
    : [
        {
          label: TRIP_COMPLETED_SCREEN.rideFareLabel,
          amountLabel: formatBhaiWayCoins(Math.round(total), { spaced: false }),
        },
      ];

  return getTripCompletedMock({
    rideId: bookingRideId?.trim() || ride?.id?.trim() || params.rideId,
    rideType: settlement?.rideType ?? params.rideType,
    origin: ride?.source ?? params.origin,
    destination: ride?.destination ?? params.destination,
    driverName: driverName || params.driverName,
    carModel: carModel || params.carModel,
    price: total,
    originLat: params.originLat,
    originLng: params.originLng,
    destinationLat: params.destinationLat,
    destinationLng: params.destinationLng,
    dateLabel: formatTripCompletedDateLabel(ride?.departureDate, ride?.departureTime),
    fareLines,
  });
};

const shortName = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  return value.split(',')[0]?.trim() || value;
};

export const useTripCompleted = (params: UseTripCompletedParams): UseTripCompletedResult => {
  const router = useRouter();
  const { summary: walletSummary, refresh: refreshWalletBalance } = useWalletBalance();
  const paymentInFlightRef = useRef(false);
  const ratingNavigatedRef = useRef(false);

  const [selectedPaymentId, setSelectedPaymentId] = useState<TripCompletedPaymentId | null>('wallet');
  const [routeCoordinates, setRouteCoordinates] = useState<MapCoordinate[]>([]);
  const [bookingLoading, setBookingLoading] = useState(Boolean(params.bookingId?.trim()));
  const [settlement, setSettlement] = useState<PayLaterSettlementView | null>(null);
  const [paymentPhase, setPaymentPhase] = useState<TripCompletedPaymentPhase>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [insufficientBalance, setInsufficientBalance] =
    useState<TripCompletedInsufficientBalance | null>(null);
  const [paymentResult, setPaymentResult] = useState<PayLaterPaymentResponse | null>(null);

  const [trip, setTrip] = useState(() =>
    getTripCompletedMock({
      rideId: params.rideId,
      rideType: params.rideType,
      origin: params.origin,
      destination: params.destination,
      driverName: params.driverName,
      carModel: params.carModel,
      price: params.price,
      originLat: params.originLat,
      originLng: params.originLng,
      destinationLat: params.destinationLat,
      destinationLng: params.destinationLng,
    }),
  );

  useFocusEffect(
    useCallback(() => {
      void refreshWalletBalance();
    }, [refreshWalletBalance]),
  );

  useEffect(() => {
    const bookingId = params.bookingId?.trim() ?? '';
    if (!bookingId) {
      setBookingLoading(false);
      setSettlement(null);
      return;
    }

    let cancelled = false;
    setBookingLoading(true);

    void (async () => {
      try {
        const booking = await getBookingById(bookingId);
        if (cancelled) {
          return;
        }
        const snapshot = bookingDtoToPayLaterSnapshot(booking);
        const nextSettlement = buildPayLaterSettlementView(snapshot);
        setSettlement(nextSettlement);

        const driver = booking.driver as
          | { displayName?: string | null; firstName?: string | null; name?: string | null }
          | null
          | undefined;
        const driverName =
          driver?.displayName?.trim() ||
          driver?.name?.trim() ||
          driver?.firstName?.trim() ||
          params.driverName;
        const vehicle = booking.vehicle as
          | { make?: string | null; model?: string | null }
          | null
          | undefined;
        const carModel =
          [vehicle?.make, vehicle?.model].filter(Boolean).join(' ') || params.carModel;

        setTrip(
          buildTripFromBooking(
            params,
            nextSettlement,
            booking.ride,
            driverName,
            carModel,
            resolveBookingRideId(booking),
          ),
        );
      } catch (error) {
        console.log('[TripCompleted] getBookingById failed', error);
      } finally {
        if (!cancelled) {
          setBookingLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    params.bookingId,
    params.carModel,
    params.destination,
    params.destinationLat,
    params.destinationLng,
    params.driverName,
    params.origin,
    params.originLat,
    params.originLng,
    params.price,
    params.rideId,
    params.rideType,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      if (!isValidMapCoordinate(trip.pickup) || !isValidMapCoordinate(trip.dropoff)) {
        setRouteCoordinates([]);
        return;
      }
      try {
        const route = await fetchDrivingRoute(trip.pickup, trip.dropoff);
        if (cancelled) {
          return;
        }
        if (route.coordinates.length >= 2) {
          setRouteCoordinates(route.coordinates);
        }
        if (Number.isFinite(route.distanceKm) && route.distanceKm > 0) {
          const distanceLabel = `${formatDistanceKmLabel(route.distanceKm)} total distance`;
          setTrip((prev) =>
            prev.distanceLabel === distanceLabel ? prev : { ...prev, distanceLabel },
          );
        }
      } catch {
        if (!cancelled) {
          setRouteCoordinates([trip.pickup, trip.dropoff]);
        }
      }
    };

    void loadRoute();
    return () => {
      cancelled = true;
    };
  }, [trip.dropoff, trip.pickup]);

  const walletAvailableLabel = useMemo(() => {
    const coins = walletSummary?.availableCoins;
    if (!coins) {
      return null;
    }
    return formatBhaiWayCoins(Number(coins), { spaced: false });
  }, [walletSummary?.availableCoins]);

  const paymentOptions = useMemo(
    () => buildTripCompletedPaymentOptions(walletAvailableLabel),
    [walletAvailableLabel],
  );

  const showPaymentUi = Boolean(
    settlement?.eligible && paymentPhase !== 'success',
  );

  const payButtonLabel = useMemo(() => {
    if (paymentPhase === 'processing') {
      return TRIP_COMPLETED_SCREEN.processingLabel;
    }
    if (!settlement?.eligible) {
      return TRIP_COMPLETED_SCREEN.continueToRatingCta;
    }
    if (!selectedPaymentId) {
      return TRIP_COMPLETED_SCREEN.payCta;
    }
    return buildPayLaterPayButtonLabel(selectedPaymentId, settlement.fareLabel);
  }, [paymentPhase, selectedPaymentId, settlement]);

  const payDisabled = useMemo(() => {
    if (paymentPhase === 'processing' || bookingLoading) {
      return true;
    }
    if (showPaymentUi) {
      return !selectedPaymentId;
    }
    return false;
  }, [bookingLoading, paymentPhase, selectedPaymentId, showPaymentUi]);

  const navigateToRating = useCallback(() => {
    if (ratingNavigatedRef.current) {
      return;
    }
    const rideId = trip.rideId?.trim() || params.rideId?.trim();
    if (!rideId || rideId === 'ride-default') {
      return;
    }
    ratingNavigatedRef.current = true;
    router.replace(
      getTripReviewPath({
        rideId,
        driverName: params.driverName || trip.driverName,
      }),
    );
  }, [params.driverName, params.rideId, router, trip.driverName, trip.rideId]);

  useEffect(() => {
    if (bookingLoading || ratingNavigatedRef.current) {
      return;
    }

    if (paymentPhase === 'success' && paymentResult) {
      navigateToRating();
      return;
    }

    if (settlement && !settlement.eligible && !showPaymentUi) {
      navigateToRating();
    }
  }, [
    bookingLoading,
    navigateToRating,
    paymentPhase,
    paymentResult,
    settlement,
    showPaymentUi,
  ]);

  const selectPayment = useCallback((id: TripCompletedPaymentId) => {
    if (paymentInFlightRef.current) {
      return;
    }
    setSelectedPaymentId(id);
    setPaymentError(null);
    setInsufficientBalance(null);
  }, []);

  const applyPaymentSuccess = useCallback(
    (response: PayLaterPaymentResponse) => {
      const normalized = normalizePayLaterPaymentResponse(response);
      setPaymentResult(normalized);
      setPaymentPhase('success');
      setPaymentError(null);
      setInsufficientBalance(null);
      setSettlement((prev) =>
        prev
          ? {
              ...prev,
              eligible: false,
              paymentStatus: 'PAID',
            }
          : prev,
      );
      if (normalized.paymentChannel.toUpperCase() === 'WALLET') {
        void refreshWalletBalance();
      }
    },
    [refreshWalletBalance],
  );

  const submitPayment = useCallback(() => {
    if (paymentInFlightRef.current || payDisabled) {
      return;
    }

    if (!showPaymentUi || !settlement?.eligible) {
      navigateToRating();
      return;
    }

    const bookingId = settlement.bookingId || params.bookingId?.trim() || '';
    if (!bookingId || !selectedPaymentId) {
      return;
    }

    paymentInFlightRef.current = true;
    setPaymentPhase('processing');
    setPaymentError(null);
    setInsufficientBalance(null);

    void (async () => {
      try {
        const response =
          selectedPaymentId === 'wallet'
            ? await payBookingWithWallet(bookingId)
            : await payBookingWithCash(bookingId);

        if (!isPayLaterPaymentSuccessful(response)) {
          throw {
            status: 422,
            code: 'PAYMENT_INCOMPLETE',
            message: TRIP_COMPLETED_SCREEN.retryPaymentMessage,
          };
        }

        applyPaymentSuccess(response);
      } catch (error) {
        const insufficient = parsePayLaterInsufficientWalletError(error);
        if (insufficient && selectedPaymentId === 'wallet') {
          const availableFromWallet = walletSummary?.availableCoins;
          const availableBalance =
            insufficient.availableBalance ?? availableFromWallet ?? undefined;
          setInsufficientBalance({
            requiredAmount: insufficient.requiredAmount ?? settlement.fareCoins,
            requiredLabel:
              insufficient.requiredAmount != null
                ? formatBhaiWayCoins(Number(insufficient.requiredAmount), { spaced: false })
                : settlement.fareLabel,
            availableBalance,
            availableLabel:
              availableBalance != null
                ? formatBhaiWayCoins(Number(availableBalance), { spaced: false })
                : undefined,
            message: insufficient.message,
          });
          setPaymentPhase('insufficient');
        } else {
          setPaymentError(mapPayLaterPaymentError(error));
          setPaymentPhase('idle');
        }
      } finally {
        paymentInFlightRef.current = false;
      }
    })();
  }, [
    applyPaymentSuccess,
    params.bookingId,
    params.driverName,
    navigateToRating,
    payDisabled,
    router,
    selectedPaymentId,
    settlement,
    showPaymentUi,
    trip.driverName,
    walletSummary?.availableCoins,
  ]);

  const dismissInsufficientBalance = useCallback(() => {
    setInsufficientBalance(null);
    setPaymentPhase('idle');
  }, []);

  const openAddMoney = useCallback(() => {
    const returnPath = getTripCompletedPath({
      rideId: trip.rideId || params.rideId,
      rideType: settlement?.rideType ?? params.rideType,
      origin: params.origin,
      destination: params.destination,
      driverName: params.driverName || trip.driverName,
      carModel: params.carModel,
      price: params.price,
      originLat: params.originLat,
      originLng: params.originLng,
      destinationLat: params.destinationLat,
      destinationLng: params.destinationLng,
      bookingId: settlement?.bookingId || params.bookingId,
    });
    walletTopUpReturnStore.set({
      pathname: returnPath.pathname,
      params: Object.fromEntries(
        Object.entries(returnPath.params).map(([key, value]) => [key, String(value ?? '')]),
      ),
    });
    router.push(ROUTES.addMoney);
  }, [
    params.bookingId,
    params.carModel,
    params.destination,
    params.destinationLat,
    params.destinationLng,
    params.driverName,
    params.origin,
    params.originLat,
    params.originLng,
    params.price,
    params.rideId,
    params.rideType,
    router,
    settlement?.bookingId,
    settlement?.rideType,
    trip.driverName,
    trip.rideId,
  ]);

  const chooseCashAfterInsufficient = useCallback(() => {
    setInsufficientBalance(null);
    setSelectedPaymentId('cash');
    setPaymentPhase('idle');
  }, []);

  const continueAfterPayment = useCallback(() => {
    navigateToRating();
  }, [navigateToRating]);

  const openNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const goHome = useCallback(() => {
    resetTo(router, ROUTES.home);
  }, [router]);

  return {
    trip,
    routeCoordinates,
    bookingLoading,
    settlement,
    showPaymentUi,
    paymentOptions,
    selectedPaymentId,
    selectPayment,
    paymentPhase,
    paymentError,
    insufficientBalance,
    payButtonLabel,
    payDisabled,
    paymentResult,
    submitPayment,
    dismissInsufficientBalance,
    openAddMoney,
    chooseCashAfterInsufficient,
    continueAfterPayment,
    openNotifications,
    goHome,
  };
};

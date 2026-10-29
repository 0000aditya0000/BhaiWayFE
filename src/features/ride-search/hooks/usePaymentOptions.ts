import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { hydrateAuthenticatedUserFromServer } from '@/features/auth/services/sessionHydration';
import { useWalletBalance } from '@/features/profile/hooks/useWalletBalance';
import { walletTopUpReturnStore } from '@/features/profile/store/walletTopUpReturnStore';
import {
  formatCoinsLabel,
  parseIntegerCoinString,
} from '@/features/profile/utils/walletCoin';
import {
  buildAppliedCouponParams,
  withCouponOnCreateBooking,
} from '@/features/coupons';
import {
  createBooking,
  mapBookingToBookedRideDetails,
  mapCreateBookingError,
  type ApiAssuredFarePayment,
  type CreateBookingDto,
} from '../api';
import { showAppAlert, triggerLightHaptic, isWomenOnlyRideError } from '@/shared/utils';
import { parseMapCoordinate, rideCoordsCache } from '@/shared/maps';
import { rideVehicleCache } from '../utils/rideVehicleCache';
import { authSession } from '@/store';
import {
  getBookedPath,
  getPaymentPath,
  PAYMENT_SCREEN,
} from '../constants';
import { bookedRideStore } from '../store';
import type { PaymentMethodId, RideType } from '../types';
import {
  generateAssuredBookingIdempotencyKey,
  isInsufficientWalletForAssuredDeposit,
  resolveAssuredRequiredCoins,
  type AssuredFarePaymentChoice,
} from '../utils/assuredDeposit.utils';

export interface UsePaymentOptionsParams {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  /** Regular: pricePerSeat. Assured: ride fare total (not including deposit). */
  price?: number;
  seats?: number;
  /** Assured security deposit in Coins (integer) from backend ride details. */
  assuredFee?: number;
  /** Integer coin string deposit from GET /rides/public/:id — preferred for pre-check. */
  assuredDepositCoins?: string | null;
  couponCode?: string | null;
  couponChargeScope?: 'RIDE_FARE' | 'ASSURED_SECURITY_DEPOSIT' | null;
  /** Preview discount points — display only; booking revalidates server-side. */
  couponDiscount?: string | null;
  dateLabel?: string;
  departureTime?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  /** When set, Continue navigates here instead of /ride-search/booked. */
  successPath?: '/ride-search/booked' | '/office-commute/booked';
}

export interface UsePaymentOptionsResult {
  selectedId: PaymentMethodId;
  setSelectedId: (id: PaymentMethodId) => void;
  /** Assured fare timing — PAY_LATER by default. Unused for Regular. */
  assuredFarePayment: AssuredFarePaymentChoice;
  setAssuredFarePayment: (value: AssuredFarePaymentChoice) => void;
  continueLabel: string;
  submitting: boolean;
  continuePayment: () => void;
  onAddCoins: () => void;
  walletAvailableCoins: string | null;
  assuredDepositCoins: string | null;
  /** Assured ride fare as integer coin string. */
  assuredFareCoins: string | null;
  /** Coins required now for the selected Assured option. */
  assuredRequiredCoins: string | null;
  isAssured: boolean;
  couponCode: string | null;
  couponDiscountCoins: number;
  couponChargeScope: string | null;
}

const isApiError = (error: unknown): error is { status: number; message?: string } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as { status?: unknown }).status === 'number';

const toFareCoins = (price?: number): string | null => {
  if (price == null || !Number.isFinite(price) || price <= 0) {
    return null;
  }
  return String(Math.floor(price));
};

export const usePaymentOptions = (
  params: UsePaymentOptionsParams,
): UsePaymentOptionsResult => {
  const router = useRouter();
  const { summary: walletSummary, refresh: refreshWallet } = useWalletBalance();
  const isRegular = params.rideType === 'regular';
  const isAssured = params.rideType === 'assured';
  const [selectedId, setSelectedId] = useState<PaymentMethodId>(
    isRegular ? 'pay-after-ride' : 'wallet',
  );
  const [assuredFarePayment, setAssuredFarePaymentState] =
    useState<AssuredFarePaymentChoice>('PAY_LATER');
  const [submitting, setSubmitting] = useState(false);
  const idempotencyRef = useRef<{
    key: string;
    rideId: string;
    seats: number;
    farePayment: AssuredFarePaymentChoice;
  } | null>(null);

  const assuredDepositCoins =
    params.assuredDepositCoins?.trim() ||
    (params.assuredFee != null && params.assuredFee > 0
      ? String(Math.floor(params.assuredFee))
      : null);

  const assuredFareCoins = toFareCoins(params.price);
  const seats = Math.max(1, Math.floor(params.seats ?? 1));

  const appliedCoupon = useMemo(
    () =>
      buildAppliedCouponParams({
        code: params.couponCode,
        chargeScope: params.couponChargeScope,
        rideType: params.rideType,
      }),
    [params.couponChargeScope, params.couponCode, params.rideType],
  );

  const buildCreatePayload = useCallback(
    (base: CreateBookingDto): CreateBookingDto =>
      withCouponOnCreateBooking(base, appliedCoupon),
    [appliedCoupon],
  );

  const assuredRequiredCoins = useMemo(() => {
    if (!isAssured) {
      return null;
    }
    return resolveAssuredRequiredCoins({
      depositCoins: assuredDepositCoins,
      fareCoins: assuredFareCoins,
      farePayment: assuredFarePayment,
    });
  }, [assuredDepositCoins, assuredFareCoins, assuredFarePayment, isAssured]);

  const continueLabel = isAssured
    ? PAYMENT_SCREEN.continueAssuredDepositLabel
    : PAYMENT_SCREEN.continueLabel;

  useEffect(() => {
    if (isRegular) {
      setSelectedId('pay-after-ride');
    } else {
      setSelectedId('wallet');
      // Assured ride-fare coupons require farePayment=PAY_NOW on the backend.
      const scope = String(params.couponChargeScope ?? '')
        .trim()
        .toUpperCase();
      setAssuredFarePaymentState(scope === 'RIDE_FARE' ? 'PAY_NOW' : 'PAY_LATER');
    }
  }, [isAssured, isRegular, params.couponChargeScope, params.rideId]);

  const setAssuredFarePayment = useCallback((value: AssuredFarePaymentChoice) => {
    setAssuredFarePaymentState(value);
  }, []);

  /** Persist vehicle from search/review flow — backend booking responses omit vehicle. */
  useEffect(() => {
    const rideId = params.rideId?.trim();
    const carModel = params.carModel?.trim();
    if (!rideId || rideId === 'ride-default' || !carModel) {
      return;
    }
    void rideVehicleCache.save({ rideId, vehicleLabel: carModel });
  }, [params.carModel, params.rideId]);

  const resolveAssuredIdempotencyKey = useCallback(
    (farePayment: AssuredFarePaymentChoice): string => {
      const rideId = params.rideId?.trim() ?? '';
      const current = idempotencyRef.current;
      if (
        current &&
        current.rideId === rideId &&
        current.seats === seats &&
        current.farePayment === farePayment
      ) {
        return current.key;
      }
      const key = generateAssuredBookingIdempotencyKey();
      idempotencyRef.current = { key, rideId, seats, farePayment };
      return key;
    },
    [params.rideId, seats],
  );

  const clearAssuredIdempotencyKey = useCallback(() => {
    idempotencyRef.current = null;
  }, []);

  const cacheRideMapCoords = useCallback(async () => {
    const rideId = params.rideId?.trim();
    if (!rideId || rideId === 'ride-default') {
      return;
    }
    try {
      await rideCoordsCache.save({
        rideId,
        origin: parseMapCoordinate(params.originLat, params.originLng),
        destination: parseMapCoordinate(params.destinationLat, params.destinationLng),
        originAddress: params.origin,
        destinationAddress: params.destination,
      });
    } catch {
      // Map cache is best-effort; booking must still succeed.
    }
  }, [params]);

  const navigateToBooked = useCallback(
    (bookingId?: string, total?: number) => {
      if (params.successPath) {
        router.push({
          pathname: params.successPath,
          params: {
            rideId: params.rideId,
            rideType: params.rideType,
            bookingId: bookingId ?? '',
            origin: params.origin ?? '',
            destination: params.destination ?? '',
            driverName: params.driverName ?? '',
            carModel: params.carModel ?? '',
            price: total != null ? String(total) : params.price != null ? String(params.price) : '',
            seats: String(seats),
            originLat: params.originLat != null ? String(params.originLat) : '',
            originLng: params.originLng != null ? String(params.originLng) : '',
            destinationLat: params.destinationLat != null ? String(params.destinationLat) : '',
            destinationLng: params.destinationLng != null ? String(params.destinationLng) : '',
          },
        });
        return;
      }

      router.replace(
        getBookedPath({
          rideId: params.rideId,
          rideType: params.rideType,
          bookingId,
          origin: params.origin,
          destination: params.destination,
          driverName: params.driverName,
          carModel: params.carModel,
          price: total ?? params.price,
          seats,
          originLat: params.originLat,
          originLng: params.originLng,
          destinationLat: params.destinationLat,
          destinationLng: params.destinationLng,
        }),
      );
    },
    [params, router, seats],
  );

  const continueRegularPayLater = useCallback(() => {
    if (!authSession.getToken()) {
      showAppAlert('Session expired', 'Please sign in again to book a ride.');
      router.replace(ROUTES.welcome);
      return;
    }

    if (!params.rideId || params.rideId === 'ride-default') {
      showAppAlert('Unable to book', 'Missing ride details. Please search again.');
      return;
    }

    setSubmitting(true);
    void (async () => {
      try {
        const created = await createBooking(
          buildCreatePayload({
            rideId: params.rideId,
            seats,
            paymentMethod: 'PAY_LATER',
          }),
        );
        console.log('[Book Ride] POST /bookings response', created);

        const details = mapBookingToBookedRideDetails(created, {
          origin: params.origin,
          destination: params.destination,
          driverName: params.driverName,
          carModel: params.carModel,
        });
        bookedRideStore.set({ booking: created, details });
        await cacheRideMapCoords();
        if (params.carModel?.trim()) {
          await rideVehicleCache.save({
            rideId: params.rideId,
            vehicleLabel: params.carModel.trim(),
          });
        }
        navigateToBooked(created.id, details.fareTotal);
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          authSession.clear();
          showAppAlert('Session expired', mapCreateBookingError(error));
          router.replace(ROUTES.welcome);
          return;
        }
        showAppAlert(
          isWomenOnlyRideError(error) ? 'Women Only Ride' : 'Unable to book',
          mapCreateBookingError(error),
        );
      } finally {
        setSubmitting(false);
      }
    })();
  }, [buildCreatePayload, cacheRideMapCoords, navigateToBooked, params, router, seats]);

  const openAddCoins = useCallback(() => {
    const paymentPath = getPaymentPath({
      rideId: params.rideId,
      rideType: params.rideType,
      origin: params.origin,
      destination: params.destination,
      driverName: params.driverName,
      carModel: params.carModel,
      price: params.price,
      seats: params.seats,
      assuredFee: params.assuredFee,
      assuredDepositCoins: params.assuredDepositCoins,
      couponCode: params.couponCode,
      couponChargeScope: params.couponChargeScope,
      couponDiscount: params.couponDiscount,
      dateLabel: params.dateLabel,
      departureTime: params.departureTime,
      originLat: params.originLat,
      originLng: params.originLng,
      destinationLat: params.destinationLat,
      destinationLng: params.destinationLng,
    });
    walletTopUpReturnStore.set({
      pathname: paymentPath.pathname,
      params: paymentPath.params,
    });
    router.push(ROUTES.addMoney);
  }, [params, router]);

  const continueAssuredDeposit = useCallback(() => {
    if (!authSession.getToken()) {
      showAppAlert('Session expired', 'Please sign in again to book a ride.');
      router.replace(ROUTES.welcome);
      return;
    }

    if (!params.rideId || params.rideId === 'ride-default') {
      showAppAlert('Unable to book', 'Missing ride details. Please search again.');
      return;
    }

    const farePayment: ApiAssuredFarePayment = assuredFarePayment;
    const availableCoins = walletSummary?.availableCoins ?? null;
    const requiredCoins = resolveAssuredRequiredCoins({
      depositCoins: assuredDepositCoins,
      fareCoins: assuredFareCoins,
      farePayment,
    });

    if (
      requiredCoins &&
      isInsufficientWalletForAssuredDeposit(availableCoins, requiredCoins)
    ) {
      const depositLabel = formatCoinsLabel(assuredDepositCoins);
      const message =
        farePayment === 'PAY_NOW'
          ? `You need ${formatCoinsLabel(requiredCoins)} available (security deposit ${depositLabel} + fare ${formatCoinsLabel(assuredFareCoins)}). Add coins and try again.`
          : `You need ${depositLabel} available for the Assured security deposit. Add coins to your wallet and try again.`;
      showAppAlert('Insufficient BhaiWay Coins', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Coins', onPress: openAddCoins },
      ]);
      return;
    }

    setSubmitting(true);
    const idempotencyKey = resolveAssuredIdempotencyKey(farePayment);

    void (async () => {
      try {
        const created = await createBooking(
          buildCreatePayload({
            rideId: params.rideId,
            seats,
            paymentMethod: 'ASSURED_DEPOSIT',
            farePayment,
          }),
          { idempotencyKey },
        );
        console.log('[Assured Book] POST /bookings response', created);

        const details = mapBookingToBookedRideDetails(created, {
          origin: params.origin,
          destination: params.destination,
          driverName: params.driverName,
          carModel: params.carModel,
        });
        bookedRideStore.set({ booking: created, details });
        await cacheRideMapCoords();
        if (params.carModel?.trim()) {
          await rideVehicleCache.save({
            rideId: params.rideId,
            vehicleLabel: params.carModel.trim(),
          });
        }
        clearAssuredIdempotencyKey();
        await Promise.all([
          refreshWallet(),
          hydrateAuthenticatedUserFromServer().catch(() => undefined),
        ]);
        navigateToBooked(created.id, details.fareTotal);
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          authSession.clear();
          showAppAlert('Session expired', mapCreateBookingError(error));
          router.replace(ROUTES.welcome);
          return;
        }
        if (isApiError(error) && error.status === 409) {
          clearAssuredIdempotencyKey();
        }
        const message = mapCreateBookingError(error);
        if (isApiError(error) && error.status === 422) {
          showAppAlert('Insufficient BhaiWay Coins', message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Coins', onPress: openAddCoins },
          ]);
          return;
        }
        showAppAlert(isWomenOnlyRideError(error) ? 'Women Only Ride' : 'Unable to book', message);
      } finally {
        setSubmitting(false);
      }
    })();
  }, [
    assuredDepositCoins,
    assuredFareCoins,
    assuredFarePayment,
    buildCreatePayload,
    cacheRideMapCoords,
    clearAssuredIdempotencyKey,
    navigateToBooked,
    openAddCoins,
    params,
    refreshWallet,
    resolveAssuredIdempotencyKey,
    router,
    seats,
    walletSummary?.availableCoins,
  ]);

  const continuePayment = useCallback(() => {
    if (submitting) {
      return;
    }

    triggerLightHaptic();

    if (isRegular) {
      if (selectedId !== 'pay-after-ride') {
        showAppAlert(
          'Pay After Ride',
          'For Regular rides in this version, please select Pay After Ride.',
        );
        setSelectedId('pay-after-ride');
        return;
      }
      continueRegularPayLater();
      return;
    }

    if (isAssured) {
      continueAssuredDeposit();
    }
  }, [
    continueAssuredDeposit,
    continueRegularPayLater,
    isAssured,
    isRegular,
    selectedId,
    submitting,
  ]);

  const onAddCoins = useCallback(() => {
    triggerLightHaptic();
    openAddCoins();
  }, [openAddCoins]);

  const couponDiscountCoins = useMemo(() => {
    const raw = params.couponDiscount?.trim();
    if (!raw) {
      return 0;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  }, [params.couponDiscount]);

  const couponCode = params.couponCode?.trim().toUpperCase() || null;

  return {
    selectedId,
    setSelectedId,
    assuredFarePayment,
    setAssuredFarePayment,
    continueLabel,
    submitting,
    continuePayment,
    onAddCoins,
    walletAvailableCoins: walletSummary?.availableCoins ?? null,
    assuredDepositCoins,
    assuredFareCoins,
    assuredRequiredCoins,
    isAssured,
    couponCode,
    couponDiscountCoins,
    couponChargeScope: params.couponChargeScope?.trim().toUpperCase() || null,
  };
};

/** Exported for tests — builds Assured create payload without side effects. */
export const buildAssuredCreateBookingPayload = (params: {
  rideId: string;
  seats: number;
  farePayment: AssuredFarePaymentChoice;
}) => ({
  rideId: params.rideId,
  seats: Math.max(1, Math.floor(params.seats)),
  paymentMethod: 'ASSURED_DEPOSIT' as const,
  farePayment: params.farePayment,
});

export const __assuredPaymentTestUtils = {
  parseIntegerCoinString,
  toFareCoins,
};

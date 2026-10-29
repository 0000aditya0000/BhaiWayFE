import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { hydrateAuthenticatedUserFromServer } from '@/features/auth/services/sessionHydration';
import { useWalletBalance } from '@/features/profile/hooks/useWalletBalance';
import { walletTopUpReturnStore } from '@/features/profile/store/walletTopUpReturnStore';
import {
  compareCoinStrings,
  formatCoinsLabel,
  parseIntegerCoinString,
} from '@/features/profile/utils/walletCoin';
import {
  createBooking,
  mapCreateBookingError,
} from '@/features/ride-search/api';
import { parseMapCoordinate, rideCoordsCache } from '@/shared/maps';
import { showAppAlert, triggerLightHaptic } from '@/shared/utils';
import { authSession } from '@/store';

import { getCommutePaymentPath } from '../constants/commute-payment.constants';
import { getCommuteRideBookedPath } from '../constants/commute-ride-booked.constants';
import { commuteBookedStore } from '../store/commuteBookedStore';
import {
  buildCommuteCreateBookingPayload,
  computeCommuteTotalFareCoins,
  generateCommuteBookingIdempotencyKey,
} from '../utils/commuteBooking.utils';

export interface UseCommutePaymentParams {
  rideId: string;
  seats: number;
  /** Rider fare per seat (display + pre-check). */
  riderPricePerSeat: number;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  couponCode?: string | null;
  couponChargeScope?: 'RIDE_FARE' | 'ASSURED_SECURITY_DEPOSIT' | null;
  couponDiscount?: string | null;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

export interface UseCommutePaymentResult {
  totalFareCoins: string;
  totalFareLabel: string;
  walletAvailableCoins: string | null;
  submitting: boolean;
  confirmPayment: () => void;
  onAddCoins: () => void;
}

const isApiError = (error: unknown): error is { status: number; message?: string } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as { status?: unknown }).status === 'number';

export const useCommutePayment = (
  params: UseCommutePaymentParams,
): UseCommutePaymentResult => {
  const router = useRouter();
  const { summary: walletSummary, refresh: refreshWallet } = useWalletBalance();
  const [submitting, setSubmitting] = useState(false);
  const idempotencyRef = useRef<{
    key: string;
    rideId: string;
    seats: number;
  } | null>(null);

  const seats = Math.max(1, Math.floor(params.seats));
  const baseFareCoins = computeCommuteTotalFareCoins(params.riderPricePerSeat, seats);
  const previewDiscount = Math.max(
    0,
    Math.round(Number(params.couponDiscount ?? 0) || 0),
  );
  // Preview-only display adjustment; server applies the authoritative discount on create.
  const totalFareCoins =
    params.couponCode?.trim() && previewDiscount > 0
      ? String(Math.max(0, Number(baseFareCoins) - previewDiscount))
      : baseFareCoins;
  const totalFareLabel = formatCoinsLabel(totalFareCoins);

  const resolveIdempotencyKey = useCallback((): string => {
    const rideId = params.rideId.trim();
    const current = idempotencyRef.current;
    if (current && current.rideId === rideId && current.seats === seats) {
      return current.key;
    }
    const key = generateCommuteBookingIdempotencyKey();
    idempotencyRef.current = { key, rideId, seats };
    return key;
  }, [params.rideId, seats]);

  const clearIdempotencyKey = useCallback(() => {
    idempotencyRef.current = null;
  }, []);

  const onAddCoins = useCallback(() => {
    triggerLightHaptic();
    const paymentPath = getCommutePaymentPath({
      rideId: params.rideId,
      seats: params.seats,
      riderPricePerSeat: params.riderPricePerSeat,
      origin: params.origin,
      destination: params.destination,
      driverName: params.driverName,
      carModel: params.carModel,
      couponCode: params.couponCode,
      couponChargeScope: params.couponChargeScope,
      couponDiscount: params.couponDiscount,
      originLat: params.originLat,
      originLng: params.originLng,
      destinationLat: params.destinationLat,
      destinationLng: params.destinationLng,
    });
    walletTopUpReturnStore.set({
      pathname: paymentPath.pathname,
      params: Object.fromEntries(
        Object.entries(paymentPath.params).map(([key, value]) => [key, String(value ?? '')]),
      ),
    });
    router.push(ROUTES.addMoney);
  }, [params, router]);

  const confirmPayment = useCallback(() => {
    if (submitting) {
      return;
    }

    if (!authSession.getToken()) {
      showAppAlert('Session expired', 'Please sign in again to request this ride.');
      router.replace(ROUTES.welcome);
      return;
    }

    const rideId = params.rideId.trim();
    if (!rideId || rideId === 'ride-default') {
      showAppAlert('Unable to book', 'Missing ride details. Please search again.');
      return;
    }

    const available = parseIntegerCoinString(walletSummary?.availableCoins ?? null) ?? '0';
    if (compareCoinStrings(available, totalFareCoins) < 0) {
      showAppAlert(
        'Insufficient BhaiWay Coins',
        `You need ${totalFareLabel} to request this Commute ride. Add coins and try again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Coins', onPress: onAddCoins },
        ],
      );
      return;
    }

    triggerLightHaptic();
    setSubmitting(true);
    const idempotencyKey = resolveIdempotencyKey();

    void (async () => {
      try {
        const created = await createBooking(
          buildCommuteCreateBookingPayload({
            rideId,
            seats,
            couponCode: params.couponCode,
            couponChargeScope: params.couponChargeScope,
          }),
          { idempotencyKey },
        );
        console.log('[Commute Book] POST /bookings response', created);

        commuteBookedStore.set({ booking: created, rideId });
        clearIdempotencyKey();

        try {
          await rideCoordsCache.save({
            rideId,
            origin: parseMapCoordinate(params.originLat, params.originLng),
            destination: parseMapCoordinate(params.destinationLat, params.destinationLng),
            originAddress: params.origin,
            destinationAddress: params.destination,
          });
        } catch {
          // best-effort
        }

        await Promise.all([
          refreshWallet(),
          hydrateAuthenticatedUserFromServer().catch(() => undefined),
        ]);

        router.replace(
          getCommuteRideBookedPath({
            rideId,
            bookingId: created.id,
            origin: params.origin,
            destination: params.destination,
            driverName: params.driverName,
            carModel: params.carModel,
            price: Number(totalFareCoins),
            seats,
            status: String(created.status ?? 'PENDING'),
            originLat: params.originLat,
            originLng: params.originLng,
            destinationLat: params.destinationLat,
            destinationLng: params.destinationLng,
          }),
        );
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          authSession.clear();
          showAppAlert('Session expired', mapCreateBookingError(error));
          router.replace(ROUTES.welcome);
          return;
        }
        if (isApiError(error) && error.status === 409) {
          clearIdempotencyKey();
        }
        const message = mapCreateBookingError(error);
        if (isApiError(error) && error.status === 422) {
          showAppAlert('Insufficient BhaiWay Coins', message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Coins', onPress: onAddCoins },
          ]);
          return;
        }
        showAppAlert('Unable to request ride', message);
      } finally {
        setSubmitting(false);
      }
    })();
  }, [
    clearIdempotencyKey,
    onAddCoins,
    params,
    refreshWallet,
    resolveIdempotencyKey,
    router,
    seats,
    submitting,
    totalFareCoins,
    totalFareLabel,
    walletSummary?.availableCoins,
  ]);

  return {
    totalFareCoins,
    totalFareLabel,
    walletAvailableCoins: walletSummary?.availableCoins ?? null,
    submitting,
    confirmPayment,
    onAddCoins,
  };
};

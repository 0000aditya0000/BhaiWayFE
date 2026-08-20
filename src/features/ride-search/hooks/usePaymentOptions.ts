import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  demoBookingsStore,
  getBhaiWayWalletBalance,
  parseRideIdToNumber,
  recordWalletTransaction,
  resolveDemoOwnerId,
  rideBookingsSheetSync,
  updateBhaiWayWalletBalance,
} from '@/DemoData';
import { formatBhaiWayCoins, showAppAlert, triggerLightHaptic } from '@/shared/utils';
import {
  ASSURED_BOOKING_FEE,
  getAddCardPath,
  getAddUpiPath,
  getBookedPath,
  getSeeAllBanksPath,
  PAYMENT_SCREEN,
} from '../constants';
import { savedCardStore } from '../store/savedCardStore';
import { savedUpiStore } from '../store/savedUpiStore';
import { selectedBankStore } from '../store/selectedBankStore';
import type { PaymentMethodId, RideType } from '../types';

export interface UsePaymentOptionsParams {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  price?: number;
  /** Assured booking fee due before the ride (0 for regular). */
  assuredFee?: number;
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
  continueLabel: string;
  continuePayment: () => void;
  onAddCoins: () => void;
  onAddUpi: () => void;
  onAddCard: () => void;
  onSeeAllBanks: () => void;
}

export const usePaymentOptions = (
  params: UsePaymentOptionsParams,
): UsePaymentOptionsResult => {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<PaymentMethodId>('wallet');
  const [submitting, setSubmitting] = useState(false);

  const isAssured = params.rideType === 'assured';
  const assuredFee =
    params.assuredFee != null && params.assuredFee > 0
      ? params.assuredFee
      : isAssured
        ? ASSURED_BOOKING_FEE
        : 0;
  const isPayAfter = selectedId === 'pay-after-ride';
  const continueLabel =
    isAssured && isPayAfter
      ? PAYMENT_SCREEN.continueAssuredFeeLabel
      : PAYMENT_SCREEN.continueLabel;

  useEffect(() => {
    const unsubUpi = savedUpiStore.subscribe(() => {
      const lastAddedId = savedUpiStore.getLastAddedId();
      if (!lastAddedId) {
        return;
      }
      setSelectedId(lastAddedId);
      savedUpiStore.clearLastAddedId();
    });

    const unsubCard = savedCardStore.subscribe(() => {
      const lastAddedId = savedCardStore.getLastAddedId();
      if (!lastAddedId) {
        return;
      }
      setSelectedId(lastAddedId);
      savedCardStore.clearLastAddedId();
    });

    const unsubBank = selectedBankStore.subscribe(() => {
      const lastSelectedId = selectedBankStore.getLastSelectedId();
      if (!lastSelectedId) {
        return;
      }
      setSelectedId(lastSelectedId);
      selectedBankStore.clearLastSelectedId();
    });

    return () => {
      unsubUpi();
      unsubCard();
      unsubBank();
    };
  }, []);

  const navigateToBooked = useCallback(() => {
    if (params.successPath) {
      router.push({
        pathname: params.successPath,
        params: {
          rideId: params.rideId,
          rideType: params.rideType,
          origin: params.origin ?? '',
          destination: params.destination ?? '',
          driverName: params.driverName ?? '',
          carModel: params.carModel ?? '',
          price: params.price != null ? String(params.price) : '',
          originLat: params.originLat != null ? String(params.originLat) : '',
          originLng: params.originLng != null ? String(params.originLng) : '',
          destinationLat: params.destinationLat != null ? String(params.destinationLat) : '',
          destinationLng: params.destinationLng != null ? String(params.destinationLng) : '',
        },
      });
      return;
    }

    router.push(
      getBookedPath({
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
  }, [params, router]);

  const continuePayment = useCallback(() => {
    if (submitting) {
      return;
    }

    const payAfterRide = selectedId === 'pay-after-ride';
    const paymentStatus = payAfterRide ? 'pending' : 'paid';
    const departureLabel = [params.dateLabel, params.departureTime]
      .map((part) => (part ?? '').trim())
      .filter(Boolean)
      .join(' · ');

    const persistBooking = () => {
      void demoBookingsStore.add({
        ride_id: parseRideIdToNumber(params.rideId),
        passenger_id: resolveDemoOwnerId(),
        seats_booked: 1,
        amount: params.price ?? 0,
        booking_status: 'confirmed',
        payment_status: paymentStatus,
      });

      void rideBookingsSheetSync
        .upsertAndSync({
          rideId: params.rideId,
          origin: params.origin || 'Pickup',
          destination: params.destination || 'Drop-off',
          departureLabel,
          driverName: params.driverName,
          vehicleLabel: params.carModel,
          seatsBooked: 1,
          amount: params.price ?? 0,
          status: 'confirmed',
          paymentStatus,
          originLat: params.originLat,
          originLng: params.originLng,
          destLat: params.destinationLat,
          destLng: params.destinationLng,
          bookedAt: new Date().toISOString(),
        })
        .catch(() => {
          // ignore sheet booking sync errors
        });

      navigateToBooked();
    };

    // Assured + pay after ride: charge assured fee now from wallet, ride fare later.
    if (isAssured && payAfterRide && assuredFee > 0) {
      const balance = getBhaiWayWalletBalance();
      if (balance < assuredFee) {
        showAppAlert(
          'Assured fee required',
          `Assured booking fee of ${formatBhaiWayCoins(assuredFee)} must be paid before the ride. Add coins to your wallet or choose another payment method to pay now.`,
        );
        return;
      }

      setSubmitting(true);
      void (async () => {
        try {
          await updateBhaiWayWalletBalance(balance - assuredFee, { mode: 'set' });
          await recordWalletTransaction({
            title: 'Assured booking fee',
            amount: assuredFee,
            type: 'debit',
            icon: 'star',
            reference: params.rideId,
          });
          persistBooking();
        } catch (error) {
                    showAppAlert(
            'Payment failed',
            'Could not charge the assured booking fee. Please try again.',
          );
        } finally {
          setSubmitting(false);
        }
      })();
      return;
    }

    persistBooking();
  }, [
    assuredFee,
    isAssured,
    navigateToBooked,
    params,
    selectedId,
    submitting,
  ]);

  const onAddCoins = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.addMoney);
  }, [router]);

  const onAddUpi = useCallback(() => {
    router.push(getAddUpiPath());
  }, [router]);

  const onAddCard = useCallback(() => {
    router.push(getAddCardPath());
  }, [router]);

  const onSeeAllBanks = useCallback(() => {
    router.push(getSeeAllBanksPath());
  }, [router]);

  return {
    selectedId,
    setSelectedId,
    continueLabel,
    continuePayment,
    onAddCoins,
    onAddUpi,
    onAddCard,
    onSeeAllBanks,
  };
};

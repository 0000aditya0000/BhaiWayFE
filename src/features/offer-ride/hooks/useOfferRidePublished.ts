import { useCallback, useEffect, useMemo, useState } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { formatBhaiWayCoins, triggerLightHaptic } from '@/shared/utils';
import { RIDE_PREFERENCE_OPTIONS } from '../constants';
import { RIDE_PUBLISHED_SCREEN } from '../constants/ride-published.constants';
import {
  publishedRideStore,
  type PublishedRideSummary,
} from '../store/publishedRideStore';
import type { RidePreferenceId } from '../types';
import { mapRideStatusLabel } from '../utils/mapRideStatusLabel';

export interface PublishedPreferenceChip {
  id: RidePreferenceId;
  label: string;
  icon: (typeof RIDE_PREFERENCE_OPTIONS)[number]['icon'];
}

export interface UseOfferRidePublishedResult {
  summary: PublishedRideSummary;
  isAssured: boolean;
  successTitle: string;
  successSubtitle: string;
  statusLabel: string | null;
  pickupLabel: string;
  dropoffLabel: string;
  departureLabel: string;
  seatsLabel: string;
  priceLabel: string;
  vehicleName: string;
  vehiclePlate: string;
  preferenceChips: PublishedPreferenceChip[];
  refundableAmount: string;
  openNotifications: () => void;
  manageMyRides: () => void;
  shareRide: () => void;
}

const FALLBACK_SUMMARY: PublishedRideSummary = {
  pickupLabel: RIDE_PUBLISHED_SCREEN.fallbackPickup,
  dropoffLabel: RIDE_PUBLISHED_SCREEN.fallbackDrop,
  departureLabel: 'Today · 09:00 AM',
  seats: 3,
  pricePerSeat: '250.00',
  rideType: 'regular',
  vehicle: null,
  preferences: {
    noSmoking: true,
    noPets: false,
    luggage: true,
    music: true,
  },
  notes: '',
  refundableAmount: null,
};

export const useOfferRidePublished = (): UseOfferRidePublishedResult => {
  const router = useRouter();
  const [summary, setSummary] = useState<PublishedRideSummary>(
    () => publishedRideStore.get() ?? FALLBACK_SUMMARY,
  );

  useEffect(
    () =>
      publishedRideStore.subscribe((next) => {
        if (next) {
          setSummary(next);
        }
      }),
    [],
  );

  const isAssured = summary.rideType === 'assured';

  const successCopy = useMemo(
    () =>
      isAssured
        ? {
            title: RIDE_PUBLISHED_SCREEN.assuredTitle,
            subtitle: RIDE_PUBLISHED_SCREEN.assuredSubtitle,
          }
        : {
            title: RIDE_PUBLISHED_SCREEN.title,
            subtitle: RIDE_PUBLISHED_SCREEN.subtitle,
          },
    [isAssured],
  );

  const statusLabel = useMemo(() => {
    if (!isAssured) {
      return null;
    }
    return (
      summary.statusLabel ??
      mapRideStatusLabel(summary.backendStatus, 'ASSURED')
    );
  }, [isAssured, summary.backendStatus, summary.statusLabel]);

  const preferenceChips = useMemo(
    () =>
      RIDE_PREFERENCE_OPTIONS.filter((option) => summary.preferences[option.id]).map(
        (option) => ({
          id: option.id,
          label: option.label,
          icon: option.icon,
        }),
      ),
    [summary.preferences],
  );

  const openNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const manageMyRides = useCallback(() => {
    triggerLightHaptic();
    router.replace(ROUTES.myRides);
  }, [router]);

  const shareRide = useCallback(() => {
    triggerLightHaptic();
    const pickup = summary.pickupLabel || RIDE_PUBLISHED_SCREEN.fallbackPickup;
    const dropoff = summary.dropoffLabel || RIDE_PUBLISHED_SCREEN.fallbackDrop;
    void Share.share({
      message: RIDE_PUBLISHED_SCREEN.shareMessage(
        pickup,
        dropoff,
        summary.departureLabel,
        summary.pricePerSeat || '0',
      ),
    });
  }, [summary]);

  const price = summary.pricePerSeat || '0';
  const priceLabel = formatBhaiWayCoins(Number(price), { spaced: false });

  return {
    summary,
    isAssured,
    successTitle: successCopy.title,
    successSubtitle: successCopy.subtitle,
    statusLabel,
    pickupLabel: summary.pickupLabel || RIDE_PUBLISHED_SCREEN.fallbackPickup,
    dropoffLabel: summary.dropoffLabel || RIDE_PUBLISHED_SCREEN.fallbackDrop,
    departureLabel: summary.departureLabel,
    seatsLabel: `${summary.seats} ${RIDE_PUBLISHED_SCREEN.seatsAvailableSuffix}`,
    priceLabel,
    vehicleName: summary.vehicle?.name ?? 'Vehicle',
    vehiclePlate: summary.vehicle?.plateNumber ?? '',
    preferenceChips,
    refundableAmount:
      summary.refundableAmount ?? RIDE_PUBLISHED_SCREEN.defaultRefundableAmount,
    openNotifications,
    manageMyRides,
    shareRide,
  };
};

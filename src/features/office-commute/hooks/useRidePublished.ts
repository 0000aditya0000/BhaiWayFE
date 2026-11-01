import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { formatBhaiWayCoins } from '@/shared/utils';
import { myRidesSurfaceStore } from '@/features/my-rides/store';
import { driverRidesRefreshStore } from '@/features/my-rides/store/driverRidesRefreshStore';
import { WEEKDAY_OPTIONS } from '../constants/publish-commute.constants';
import { RIDE_PUBLISHED_SCREEN } from '../constants/ride-published.constants';
import { publishedCommuteStore, type PublishedCommuteSummary } from '../store/publishedCommuteStore';

export interface UseRidePublishedResult {
  summary: PublishedCommuteSummary;
  pickupLabel: string;
  dropoffLabel: string;
  departureLabel: string;
  seatsLabel: string;
  priceLabel: string;
  dayChips: Array<{ id: string; label: string }>;
  isOneTime: boolean;
  occurrenceSummary: string;
  openNotifications: () => void;
  viewMyRides: () => void;
  modifyRide: () => void;
}

const FALLBACK_SUMMARY: PublishedCommuteSummary = {
  pickupLabel: RIDE_PUBLISHED_SCREEN.fallbackPickup,
  dropoffLabel: RIDE_PUBLISHED_SCREEN.fallbackDrop,
  departureLabel: '09:00 AM',
  seats: 3,
  pricePerSeat: '150',
  recurringDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
};

export const useRidePublished = (): UseRidePublishedResult => {
  const router = useRouter();
  const [summary, setSummary] = useState<PublishedCommuteSummary>(
    () => publishedCommuteStore.get() ?? FALLBACK_SUMMARY,
  );

  useEffect(() => publishedCommuteStore.subscribe((next) => {
    if (next) {
      setSummary(next);
    }
  }), []);

  const dayChips = useMemo(() => {
    const days = summary?.recurringDays ?? [];
    if (days.length === 0) {
      return [];
    }
    return WEEKDAY_OPTIONS.filter((day) => days.includes(day.id)).map((day) => ({
      id: day.id,
      label: day.label,
    }));
  }, [summary?.recurringDays]);

  const openNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const viewMyRides = useCallback(() => {
    myRidesSurfaceStore.setOfficeCommute();
    driverRidesRefreshStore.bump();
    router.replace(ROUTES.myRides);
  }, [router]);

  const modifyRide = useCallback(() => {
    router.replace(ROUTES.officeCommutePublish);
  }, [router]);

  const priceNum = Number(summary?.pricePerSeat ?? 0);
  const priceLabel = formatBhaiWayCoins(Number.isFinite(priceNum) ? priceNum : 0);

  return {
    summary,
    pickupLabel: summary?.pickupLabel || RIDE_PUBLISHED_SCREEN.fallbackPickup,
    dropoffLabel: summary?.dropoffLabel || RIDE_PUBLISHED_SCREEN.fallbackDrop,
    departureLabel: summary?.departureLabel ?? '',
    seatsLabel: `${summary?.seats ?? 1} ${RIDE_PUBLISHED_SCREEN.seatsSuffix}`,
    priceLabel,
    dayChips,
    isOneTime: (summary?.recurringDays?.length ?? 0) === 0,
    occurrenceSummary: summary?.occurrenceSummary ?? RIDE_PUBLISHED_SCREEN.subtitle,
    openNotifications,
    viewMyRides,
    modifyRide,
  };
};

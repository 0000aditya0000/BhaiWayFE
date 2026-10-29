import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { authSession } from '@/store';
import { getErrorMessage, showAppAlert } from '@/shared/utils';

import type { RideTypeTabId } from '../components/ResultFilterChips';
import { searchRides, isValidSearchCoordinate } from '../api';
import { departureTimeToMinutes, getPassengerLabel } from '../constants';
import type { RideResultItem, RideResultSortId, RideSearchSummary } from '../types';
import {
  mapRideSearchItemsToResults,
  mapSearchRidesError,
  resolveSearchDateParam,
  toCivilDateFromDate,
} from '../utils';
import { mapRideTypeTabToApiRideType } from '../utils/assuredDeposit.utils';

const shortPlaceName = (value: string): string => {
  const segment = value.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value;
};

const sortRides = (rides: RideResultItem[], sortId: RideResultSortId): RideResultItem[] => {
  const next = [...rides];
  switch (sortId) {
    case 'price-asc':
      return next.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return next.sort((a, b) => b.price - a.price);
    case 'departure':
      return next.sort(
        (a, b) => departureTimeToMinutes(a.departureTime) - departureTimeToMinutes(b.departureTime),
      );
    case 'rating':
      return next.sort((a, b) => b.driver.rating - a.driver.rating);
    case 'duration':
      return next.sort((a, b) => a.durationMinutes - b.durationMinutes);
    default:
      return next;
  }
};

const isApiError = (error: unknown): error is { status: number; message?: string } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as { status?: unknown }).status === 'number';

export interface UseRideResultParams {
  origin?: string;
  destination?: string;
  date?: string;
  dateLabel?: string;
  passengers?: string | number;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
}

export interface UseRideResultResult {
  summary: RideSearchSummary;
  rides: RideResultItem[];
  totalCount: number;
  loading: boolean;
  refreshing: boolean;
  activeFilter: RideTypeTabId;
  setActiveFilter: (id: RideTypeTabId) => void;
  sortId: RideResultSortId;
  setSortId: (id: RideResultSortId) => void;
  refresh: () => void;
}

export const useRideResult = (params: UseRideResultParams): UseRideResultResult => {
  const router = useRouter();
  const passengers = Math.max(1, Number(params.passengers) || 1);
  const searchDate =
    resolveSearchDateParam(params.date) ?? toCivilDateFromDate(new Date());

  const summary = useMemo<RideSearchSummary>(
    () => ({
      originCity: shortPlaceName(params.origin || 'Origin'),
      destinationCity: shortPlaceName(params.destination || 'Destination'),
      dateLabel: params.dateLabel || 'Today',
      passengers,
      passengerLabel: getPassengerLabel(passengers),
    }),
    [params.dateLabel, params.destination, params.origin, passengers],
  );

  const [sourceRides, setSourceRides] = useState<RideResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<RideTypeTabId>('regular');
  const [sortId, setSortId] = useState<RideResultSortId>('price-asc');
  const searchGenerationRef = useRef(0);
  const searchingRef = useRef(false);

  const loadRides = useCallback(
    async (mode: 'initial' | 'refresh', filter: RideTypeTabId) => {
      const source = params.origin?.trim() ?? '';
      const destination = params.destination?.trim() ?? '';

      if (!source || !destination) {
        setSourceRides([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (searchingRef.current) {
        return;
      }

      if (!authSession.getToken()) {
        setSourceRides([]);
        setLoading(false);
        setRefreshing(false);
        showAppAlert('Session expired', 'Please sign in again to search rides.');
        router.replace(ROUTES.welcome);
        return;
      }

      const generation = ++searchGenerationRef.current;
      searchingRef.current = true;

      if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const pickupOk = isValidSearchCoordinate(
          params.pickupLatitude,
          params.pickupLongitude,
        );
        const dropoffOk = isValidSearchCoordinate(
          params.dropoffLatitude,
          params.dropoffLongitude,
        );

        const response = await searchRides({
          source,
          destination,
          date: searchDate,
          seats: passengers,
          rideType: mapRideTypeTabToApiRideType(filter),
          page: 1,
          limit: 20,
          ...(pickupOk && dropoffOk
            ? {
                pickupLatitude: params.pickupLatitude,
                pickupLongitude: params.pickupLongitude,
                dropoffLatitude: params.dropoffLatitude,
                dropoffLongitude: params.dropoffLongitude,
              }
            : {}),
        });

        if (generation !== searchGenerationRef.current) {
          return;
        }

        setSourceRides(mapRideSearchItemsToResults(response.items ?? []));
      } catch (error) {
        if (generation !== searchGenerationRef.current) {
          return;
        }

        console.log('[Ride search] GET /rides/search failed', getErrorMessage(error));

        if (isApiError(error) && error.status === 401) {
          authSession.clear();
          showAppAlert('Session expired', mapSearchRidesError(error));
          router.replace(ROUTES.welcome);
          setSourceRides([]);
          return;
        }

        showAppAlert('Unable to search rides', mapSearchRidesError(error));
        setSourceRides([]);
      } finally {
        if (generation === searchGenerationRef.current) {
          searchingRef.current = false;
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      params.destination,
      params.dropoffLatitude,
      params.dropoffLongitude,
      params.origin,
      params.pickupLatitude,
      params.pickupLongitude,
      passengers,
      router,
      searchDate,
    ],
  );

  useEffect(() => {
    void loadRides('initial', activeFilter);
  }, [activeFilter, loadRides]);

  const rides = useMemo(() => sortRides(sourceRides, sortId), [sortId, sourceRides]);

  const refresh = useCallback(() => {
    void loadRides('refresh', activeFilter);
  }, [activeFilter, loadRides]);

  return {
    summary,
    rides,
    totalCount: rides.length,
    loading,
    refreshing,
    activeFilter,
    setActiveFilter,
    sortId,
    setSortId,
    refresh,
  };
};

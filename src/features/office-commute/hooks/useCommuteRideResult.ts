import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { searchRides } from '@/features/ride-search/api';
import {
  mapSearchRidesError,
  resolveSearchDateParam,
  toCivilDateFromDate,
} from '@/features/ride-search/utils/rideSearch.mapper';
import { showAppAlert, triggerLightHaptic } from '@/shared/utils';

import { getCommuteReviewBookingPath } from '../constants/commute-review-booking.constants';
import type {
  CommuteMatchFilterId,
  CommuteRideResultItem,
  CommuteResultSortId,
  CommuteSearchSummary,
} from '../types/commute-ride-result.types';
import { mapCommuteSearchItemsToResults } from '../utils/mapCommuteRideSearch';
import {
  filterCommuteRideResults,
  sortCommuteRideResults,
} from '../utils/commuteRideResultFilters';
import type { CommuteRequestState } from '../components/CommuteRideResultCard';

export interface UseCommuteRideResultParams {
  origin?: string;
  destination?: string;
  /** Civil date YYYY-MM-DD for GET /rides/search */
  searchDate?: string;
  dateLabel?: string;
  timeLabel?: string;
  sameOrganizationOnly?: boolean;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

export interface UseCommuteRideResultResult {
  summary: CommuteSearchSummary;
  rides: readonly CommuteRideResultItem[];
  totalCount: number;
  matchFilterId: CommuteMatchFilterId;
  sortId: CommuteResultSortId;
  setMatchFilterId: (id: CommuteMatchFilterId) => void;
  setSortId: (id: CommuteResultSortId) => void;
  loading: boolean;
  refreshing: boolean;
  errorMessage: string | null;
  requestStates: Record<string, CommuteRequestState>;
  refresh: () => void;
  editSearch: () => void;
  requestToJoin: (ride: CommuteRideResultItem) => void;
  goBack: () => void;
  openProfile: () => void;
}

export const useCommuteRideResult = (
  params: UseCommuteRideResultParams,
): UseCommuteRideResultResult => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rides, setRides] = useState<CommuteRideResultItem[]>([]);
  const [matchFilterId, setMatchFilterId] = useState<CommuteMatchFilterId>('all');
  const [sortId, setSortId] = useState<CommuteResultSortId>('match-desc');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestStates, setRequestStates] = useState<Record<string, CommuteRequestState>>({});
  const loadVersionRef = useRef(0);

  const summary = useMemo<CommuteSearchSummary>(
    () => ({
      origin: params.origin?.trim() || '',
      destination: params.destination?.trim() || '',
      dateLabel: params.dateLabel?.trim() || 'Today',
      timeLabel: params.timeLabel?.trim() || '',
      sameOrganizationOnly: params.sameOrganizationOnly === true,
    }),
    [
      params.dateLabel,
      params.destination,
      params.origin,
      params.sameOrganizationOnly,
      params.timeLabel,
    ],
  );

  const searchDate = useMemo(() => {
    const resolved = resolveSearchDateParam(params.searchDate);
    if (resolved) {
      return resolved;
    }
    return toCivilDateFromDate(new Date());
  }, [params.searchDate]);

  const loadRides = useCallback(
    async (isRefresh = false) => {
      const version = loadVersionRef.current + 1;
      loadVersionRef.current = version;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      const source = summary.origin;
      const destination = summary.destination;
      if (!source || !destination) {
        setRides([]);
        setLoading(false);
        setRefreshing(false);
        setErrorMessage('Please enter pickup and drop-off to search.');
        return;
      }

      try {
        const response = await searchRides({
          source,
          destination,
          date: searchDate,
          rideType: 'COMMUTE',
          seats: 1,
          pickupLatitude: params.originLat,
          pickupLongitude: params.originLng,
          dropoffLatitude: params.destinationLat,
          dropoffLongitude: params.destinationLng,
        });

        if (loadVersionRef.current !== version) {
          return;
        }

        setRides(
          mapCommuteSearchItemsToResults(response.items ?? [], {
            routeMatchByRideId: response.routeMatchByRideId,
            matchPercentByRideId: response.matchPercentByRideId,
          }),
        );
      } catch (error) {
        if (loadVersionRef.current !== version) {
          return;
        }
        const message = mapSearchRidesError(error);
        setErrorMessage(message);
        setRides([]);
        if (!isRefresh) {
          showAppAlert('Search failed', message);
        }
      } finally {
        if (loadVersionRef.current === version) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      params.destinationLat,
      params.destinationLng,
      params.originLat,
      params.originLng,
      searchDate,
      summary.destination,
      summary.origin,
    ],
  );

  useEffect(() => {
    void loadRides(false);
  }, [loadRides]);

  const filteredRides = useMemo(
    () => sortCommuteRideResults(filterCommuteRideResults(rides, matchFilterId), sortId),
    [matchFilterId, rides, sortId],
  );

  const refresh = useCallback(() => {
    void loadRides(true);
  }, [loadRides]);

  const editSearch = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.officeCommuteSearch);
  }, [router]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.officeCommuteSearch);
  }, [router]);

  const openProfile = useCallback(() => {
    router.push(ROUTES.profile);
  }, [router]);

  const requestToJoin = useCallback(
    (ride: CommuteRideResultItem) => {
      triggerLightHaptic();
      setRequestStates((prev) => ({ ...prev, [ride.id]: 'requesting' }));
      setRequestStates((prev) => ({ ...prev, [ride.id]: 'idle' }));
      router.push(
        getCommuteReviewBookingPath({
          rideId: ride.id,
          origin: summary.origin || ride.source,
          destination: summary.destination || ride.destination,
          driverName: ride.driver.name,
          carModel: ride.carModel,
          price: ride.riderPricePerSeat,
          dateLabel: summary.dateLabel,
          departureTime: ride.departureTime,
          matchPercent: ride.matchPercent ?? undefined,
          originLat: params.originLat,
          originLng: params.originLng,
          destinationLat: params.destinationLat,
          destinationLng: params.destinationLng,
        }),
      );
    },
    [
      params.destinationLat,
      params.destinationLng,
      params.originLat,
      params.originLng,
      router,
      summary.dateLabel,
      summary.destination,
      summary.origin,
    ],
  );

  return {
    summary,
    rides: filteredRides,
    totalCount: rides.length,
    matchFilterId,
    sortId,
    setMatchFilterId,
    setSortId,
    loading,
    refreshing,
    errorMessage,
    requestStates,
    refresh,
    editSearch,
    requestToJoin,
    goBack,
    openProfile,
  };
};

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSessionUser } from '@/shared/hooks';
import { getErrorMessage, logger } from '@/shared/utils';
import { DEFAULT_HOME_LOCATION, HOME_GREETING } from '../constants';
import { homeService } from '../services';
import type { HomeLocation, ServiceCardData } from '../types';
import { getFirstName, mapDashboardToViewData, resolveUserHomeLocation } from '../utils';

export interface UseHomeResult {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  firstName: string;
  greetingSubtitle: string;
  user: ReturnType<typeof useSessionUser>;
  location: HomeLocation;
  serviceCards: ServiceCardData[];
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
}

export const useHome = (): UseHomeResult => {
  const user = useSessionUser();
  const [location, setLocation] = useState<HomeLocation>(DEFAULT_HOME_LOCATION);
  const [serviceCards, setServiceCards] = useState<ServiceCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserLocation = useCallback(async () => {
    try {
      const userLocation = await resolveUserHomeLocation();
      if (userLocation) {
        setLocation(userLocation);
        return;
      }
      setLocation({ label: 'Location unavailable', city: '' });
    } catch (locationError) {
      logger.error('Failed to resolve home location', locationError);
      setLocation({ label: 'Location unavailable', city: '' });
    }
  }, []);

  const loadDashboard = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const dashboard = await homeService.fetchDashboard();
        const viewData = mapDashboardToViewData(dashboard);
        setServiceCards(viewData.serviceCards);
      } catch (loadError) {
        logger.error('Failed to load home dashboard', loadError);
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }

      // Location is best-effort and must not block Home from rendering.
      void loadUserLocation();
    },
    [loadUserLocation],
  );

  useEffect(() => {
    void loadDashboard('initial');
  }, [loadDashboard]);

  const refresh = useCallback(() => loadDashboard('refresh'), [loadDashboard]);
  const retry = useCallback(() => loadDashboard('initial'), [loadDashboard]);

  const firstName = useMemo(
    () => user?.firstName?.trim() || getFirstName(user?.fullName),
    [user?.firstName, user?.fullName],
  );

  return {
    loading,
    refreshing,
    error,
    firstName,
    greetingSubtitle: HOME_GREETING.subtitle,
    user,
    location,
    serviceCards,
    refresh,
    retry,
  };
};

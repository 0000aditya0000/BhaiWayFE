import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSessionUser } from '@/shared/hooks';
import { logger } from '@/shared/utils';
import { DEFAULT_HOME_LOCATION, HOME_CATEGORIES } from '../constants';
import type { HomeCategory, HomeLocation } from '../types';
import { getFirstName, resolveUserHomeLocation } from '../utils';

const loadLocalCategories = (): HomeCategory[] =>
  HOME_CATEGORIES.filter((category) => category.enabled);

export interface UseHomeResult {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  firstName: string;
  user: ReturnType<typeof useSessionUser>;
  location: HomeLocation;
  categories: HomeCategory[];
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
}

export const useHome = (): UseHomeResult => {
  const user = useSessionUser();
  const [location, setLocation] = useState<HomeLocation>(DEFAULT_HOME_LOCATION);
  const [categories, setCategories] = useState<HomeCategory[]>([]);
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
        setCategories(loadLocalCategories());
      } catch (loadError) {
        logger.error('Failed to load home dashboard', loadError);
        setCategories(loadLocalCategories());
        setError(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }

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
    user,
    location,
    categories,
    refresh,
    retry,
  };
};

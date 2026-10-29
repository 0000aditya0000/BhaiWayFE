import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import { authSession } from '@/store';

import { getInboxUnreadCount } from '../api/notificationsInbox.api';
import { formatUnreadBadgeCount } from '../utils/notificationsInbox.mapper';
import { unreadNotificationEvents } from '../store/unreadNotificationEvents';

export interface UseUnreadNotificationCountResult {
  count: number;
  badgeLabel: string | null;
  refreshing: boolean;
  refresh: (force?: boolean) => Promise<void>;
}

export const useUnreadNotificationCount = (): UseUnreadNotificationCountResult => {
  const [count, setCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async (force = false) => {
    if (!authSession.isAuthenticated()) {
      if (mountedRef.current) {
        setCount(0);
      }
      return;
    }
    if (mountedRef.current) {
      setRefreshing(true);
    }
    try {
      const result = await resourceCache.query({
        key: cacheKeys.notifications.unreadCount(),
        staleTime: CACHE_STALE_TIMES.NOTIFICATIONS,
        force,
        fetcher: getInboxUnreadCount,
      });
      if (mountedRef.current) {
        setCount(result.data.count);
      }
    } catch {
      // Keep last known count; do not crash badge UI.
      const peeked = resourceCache.peek<{ count: number }>(
        cacheKeys.notifications.unreadCount(),
      );
      if (peeked && mountedRef.current) {
        setCount(peeked.count);
      }
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refresh(false);
    const unsubscribe = unreadNotificationEvents.subscribe(() => {
      void refresh(true);
    });
    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh(false);
    }, [refresh]),
  );

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void refresh(true);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [refresh]);

  return {
    count,
    badgeLabel: formatUnreadBadgeCount(count),
    refreshing,
    refresh,
  };
};

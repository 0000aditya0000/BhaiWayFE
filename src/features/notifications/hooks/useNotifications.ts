import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import { getErrorMessage, showAppAlert, triggerLightHaptic } from '@/shared/utils';
import { authSession } from '@/store';

import {
  getInboxUnreadCount,
  listInboxNotifications,
  markAllInboxNotificationsRead,
  markInboxNotificationRead,
} from '../api/notificationsInbox.api';
import type { InboxNotificationPageDto } from '../api/notificationsInbox.types';
import { NOTIFICATIONS_SCREEN } from '../constants';
import {
  getNotificationPermissionStatus,
  openAppNotificationSettings,
  requestNotificationPermission,
} from '../services';
import { unreadNotificationEvents } from '../store/unreadNotificationEvents';
import type { AppNotification, NotificationPermissionStatus } from '../types';
import {
  inboxDataToPushData,
  mapInboxToAppNotification,
  mergeInboxPagesWithoutDuplicates,
} from '../utils/notificationsInbox.mapper';
import { resolvePushNavigationTarget } from '../utils/resolvePushNavigation';

const PAGE_SIZE = 20;

export interface UseNotificationsResult {
  items: AppNotification[];
  todayItems: AppNotification[];
  earlierItems: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  markingAll: boolean;
  permissionStatus: NotificationPermissionStatus;
  requestPermission: () => Promise<void>;
  openNotificationSettings: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  openNotification: (notification: AppNotification) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => void;
  retry: () => void;
  goBack: () => void;
}

export const useNotifications = (): UseNotificationsResult => {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('undetermined');
  const inflightRef = useRef(false);
  const markingIdsRef = useRef<Set<string>>(new Set());

  const applyPage = useCallback((pageResult: InboxNotificationPageDto, mode: 'replace' | 'append') => {
    const mapped = pageResult.items.map((item) => mapInboxToAppNotification(item));
    setPage(pageResult.page);
    setTotal(pageResult.total);
    setItems((prev) =>
      mode === 'append' ? mergeInboxPagesWithoutDuplicates(prev, mapped) : mapped,
    );
  }, []);

  const fetchPage = useCallback(
    async (mode: 'initial' | 'refresh' | 'append', nextPage: number) => {
      if (!authSession.isAuthenticated()) {
        setItems([]);
        setTotal(0);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setError(null);
        return;
      }
      if (inflightRef.current) {
        return;
      }
      inflightRef.current = true;
      if (mode === 'append') {
        setLoadingMore(true);
      } else if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const listParams = { page: nextPage, limit: PAGE_SIZE };
        const pageResult = await resourceCache.query<InboxNotificationPageDto>({
          key: cacheKeys.notifications.list(listParams),
          staleTime: CACHE_STALE_TIMES.NOTIFICATIONS,
          force: mode !== 'initial',
          fetcher: () => listInboxNotifications(listParams),
        });
        applyPage(pageResult.data, mode === 'append' ? 'append' : 'replace');
        setError(null);

        // Warm unread-count cache for badge consumers (no event emit — avoids refresh loops).
        if (mode !== 'append') {
          void resourceCache
            .query({
              key: cacheKeys.notifications.unreadCount(),
              staleTime: CACHE_STALE_TIMES.NOTIFICATIONS,
              force: mode === 'refresh',
              fetcher: getInboxUnreadCount,
            })
            .catch(() => undefined);
        }
      } catch (err) {
        if (mode === 'append') {
          setError(getErrorMessage(err, NOTIFICATIONS_SCREEN.loadErrorBody));
        } else {
          const kept = resourceCache.peek<InboxNotificationPageDto>(
            cacheKeys.notifications.list({ page: 1, limit: PAGE_SIZE }),
          );
          if (kept) {
            applyPage(kept, 'replace');
            setError(null);
          } else {
            setItems([]);
            setError(getErrorMessage(err, NOTIFICATIONS_SCREEN.loadErrorBody));
          }
        }
      } finally {
        inflightRef.current = false;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [applyPage],
  );

  useFocusEffect(
    useCallback(() => {
      void fetchPage('initial', 1);
    }, [fetchPage]),
  );

  useEffect(() => {
    const unsub = unreadNotificationEvents.subscribe(() => {
      void fetchPage('refresh', 1);
    });
    return unsub;
  }, [fetchPage]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void fetchPage('refresh', 1);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [fetchPage]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const status = await getNotificationPermissionStatus();
        if (active) {
          setPermissionStatus(status);
        }
      } catch {
        if (active) {
          setPermissionStatus('undetermined');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const todayItems = useMemo(
    () => items.filter((item) => item.section === 'today'),
    [items],
  );
  const earlierItems = useMemo(
    () => items.filter((item) => item.section === 'earlier'),
    [items],
  );
  const unreadCount = useMemo(
    () => items.reduce((count, item) => count + (item.unread ? 1 : 0), 0),
    [items],
  );

  const requestPermission = useCallback(async () => {
    triggerLightHaptic();
    try {
      const status = await requestNotificationPermission();
      setPermissionStatus(status);
    } catch {
      setPermissionStatus('denied');
    }
  }, []);

  const openNotificationSettings = useCallback(() => {
    triggerLightHaptic();
    openAppNotificationSettings();
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed || markingIdsRef.current.has(trimmed)) {
      return;
    }
    const current = items.find((item) => item.id === trimmed);
    if (current && !current.unread) {
      return;
    }

    markingIdsRef.current.add(trimmed);
    // Optimistic UI
    setItems((prev) =>
      prev.map((item) =>
        item.id === trimmed
          ? {
              ...item,
              unread: false,
              isRead: true,
              readAt: item.readAt ?? new Date().toISOString(),
            }
          : item,
      ),
    );

    try {
      const updated = await markInboxNotificationRead(trimmed);
      const mapped = mapInboxToAppNotification(updated);
      setItems((prev) => prev.map((item) => (item.id === trimmed ? mapped : item)));
      resourceCache.invalidate(cacheKeys.notifications.unreadCount());
      resourceCache.invalidate(['notifications', 'list']);
      unreadNotificationEvents.emitRefresh();
    } catch (err) {
      // Revert optimistic update
      if (current) {
        setItems((prev) => prev.map((item) => (item.id === trimmed ? current : item)));
      }
      showAppAlert(
        NOTIFICATIONS_SCREEN.markReadErrorTitle,
        getErrorMessage(err, NOTIFICATIONS_SCREEN.markReadErrorBody),
      );
    } finally {
      markingIdsRef.current.delete(trimmed);
    }
  }, [items]);

  const markAllAsRead = useCallback(async () => {
    if (markingAll || unreadCount === 0) {
      return;
    }
    triggerLightHaptic();
    setMarkingAll(true);
    try {
      await markAllInboxNotificationsRead();
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          unread: false,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
      resourceCache.invalidate(cacheKeys.notifications.unreadCount());
      resourceCache.invalidate(['notifications', 'list']);
      unreadNotificationEvents.emitRefresh();
      showAppAlert(
        NOTIFICATIONS_SCREEN.markAllSuccessTitle,
        NOTIFICATIONS_SCREEN.markAllSuccessBody,
      );
    } catch (err) {
      showAppAlert(
        NOTIFICATIONS_SCREEN.markAllErrorTitle,
        getErrorMessage(err, NOTIFICATIONS_SCREEN.markAllErrorBody),
      );
    } finally {
      setMarkingAll(false);
    }
  }, [markingAll, unreadCount]);

  const openNotification = useCallback(
    async (notification: AppNotification) => {
      triggerLightHaptic();
      await markAsRead(notification.id);
      try {
        const target = resolvePushNavigationTarget(inboxDataToPushData(notification.data));
        if (target.params) {
          router.push({
            pathname: target.pathname as never,
            params: target.params,
          });
          return;
        }
        router.push(target.pathname as never);
      } catch {
        // Stay on notifications if navigation fails
      }
    },
    [markAsRead, router],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.home);
  }, [router]);

  return {
    items,
    todayItems,
    earlierItems,
    unreadCount,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore: items.length < total,
    markingAll,
    permissionStatus,
    requestPermission,
    openNotificationSettings,
    markAsRead,
    markAllAsRead,
    openNotification,
    refresh: () => fetchPage('refresh', 1),
    loadMore: () => {
      if (items.length < total) {
        void fetchPage('append', page + 1);
      }
    },
    retry: () => {
      void fetchPage('initial', 1);
    },
    goBack,
  };
};

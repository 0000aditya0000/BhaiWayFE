import { useCallback, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { APP_CONFIG, ROUTES } from '@/config';
import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import { getErrorMessage, showAppAlert, triggerLightHaptic } from '@/shared/utils';
import { authSession } from '@/store';

import { listSupportTickets } from '../api/support.api';
import type { SupportTicketCategory, SupportTicketListItemDto } from '../api/support.types';
import {
  HELP_SUPPORT_SCREEN,
  SUPPORT_HOME_CATEGORIES,
  type SupportHomeCategory,
} from '../constants/support.constants';

export interface UseHelpSupportHomeResult {
  query: string;
  setQuery: (value: string) => void;
  categories: readonly SupportHomeCategory[];
  recentTickets: SupportTicketListItemDto[];
  loadingRecent: boolean;
  recentError: string | null;
  goBack: () => void;
  openCategory: (id: SupportTicketCategory) => void;
  openTicket: (ticketId: string) => void;
  viewAllTickets: () => void;
  raiseTicket: () => void;
  emailSupport: () => void;
  retryRecent: () => void;
}

export const useHelpSupportHome = (): UseHelpSupportHomeResult => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recentTickets, setRecentTickets] = useState<SupportTicketListItemDto[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return SUPPORT_HOME_CATEGORIES;
    }
    return SUPPORT_HOME_CATEGORIES.filter(
      (item) =>
        item.title.toLowerCase().includes(normalized) ||
        item.subtitle.toLowerCase().includes(normalized),
    );
  }, [query]);

  const loadRecent = useCallback(async () => {
    if (!authSession.isAuthenticated()) {
      setRecentTickets([]);
      setLoadingRecent(false);
      setRecentError(null);
      return;
    }
    setLoadingRecent(true);
    try {
      const page = await resourceCache.query({
        key: cacheKeys.support.tickets({ page: 1, limit: 5 }),
        staleTime: CACHE_STALE_TIMES.SUPPORT_TICKETS,
        force: true,
        fetcher: () => listSupportTickets({ page: 1, limit: 5 }),
      });
      setRecentTickets(page.data.items);
      setRecentError(null);
    } catch (err) {
      setRecentError(getErrorMessage(err));
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRecent();
    }, [loadRecent]),
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [router]);

  const openCategory = useCallback(
    (id: SupportTicketCategory) => {
      triggerLightHaptic();
      router.push({
        pathname: ROUTES.createSupportTicket,
        params: { category: id },
      });
    },
    [router],
  );

  const openTicket = useCallback(
    (ticketId: string) => {
      triggerLightHaptic();
      router.push({
        pathname: ROUTES.supportTicketDetail,
        params: { ticketId },
      });
    },
    [router],
  );

  const viewAllTickets = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.supportTickets);
  }, [router]);

  const raiseTicket = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.createSupportTicket);
  }, [router]);

  const emailSupport = useCallback(() => {
    triggerLightHaptic();
    const url = `mailto:${APP_CONFIG.supportEmail}`;
    Linking.openURL(url).catch(() => {
      showAppAlert(HELP_SUPPORT_SCREEN.emailErrorTitle, HELP_SUPPORT_SCREEN.emailErrorMessage);
    });
  }, []);

  return {
    query,
    setQuery,
    categories,
    recentTickets,
    loadingRecent,
    recentError,
    goBack,
    openCategory,
    openTicket,
    viewAllTickets,
    raiseTicket,
    emailSupport,
    retryRecent: loadRecent,
  };
};

import { useCallback, useRef, useState } from 'react';
import { Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import {
  copyTextToClipboard,
  isClipboardCancelled,
} from '@/shared/utils/clipboard';
import { triggerLightHaptic, triggerSuccessHaptic, showAppAlert } from '@/shared/utils';
import { getReferralSummary, listReferrals } from '../api/referrals.api';
import type { ReferralPageDto, ReferralSummaryDto } from '../api/referrals.types';
import { REFER_EARN_SCREEN, REFERRAL_PERKS } from '../constants';
import type { ReferralPerk } from '../types';
import {
  mapReferralError,
  mapReferralListItem,
  mapReferralSummary,
  type ReferralListItemUi,
  type ReferralSummaryUi,
} from '../utils/referrals.mapper';

export interface UseReferEarnResult {
  title: string;
  heroTitle: string;
  heroSubtitle: string;
  code: string;
  perks: readonly ReferralPerk[];
  summary: ReferralSummaryUi | null;
  items: readonly ReferralListItemUi[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  copied: boolean;
  emptyTitle: string;
  emptySubtitle: string;
  inviteLabel: string;
  goBack: () => void;
  openHelp: () => void;
  copyCode: () => void;
  shareCode: () => void;
  refresh: () => Promise<void>;
  loadMore: () => void;
  retry: () => void;
}

const PAGE_SIZE = 20;

export const useReferEarn = (): UseReferEarnResult => {
  const router = useRouter();
  const [summary, setSummary] = useState<ReferralSummaryUi | null>(null);
  const [items, setItems] = useState<ReferralListItemUi[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inflightRef = useRef(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async (mode: 'initial' | 'refresh' | 'append', nextPage: number) => {
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
      if (mode === 'append') {
        const listParams = { page: nextPage, limit: PAGE_SIZE };
        const pageResult = await resourceCache.query<ReferralPageDto>({
          key: cacheKeys.referrals.list(listParams),
          staleTime: CACHE_STALE_TIMES.REFERRALS_LIST,
          force: true,
          fetcher: () => listReferrals(listParams),
        });
        setItems((prev) => [
          ...prev,
          ...pageResult.data.items.map(mapReferralListItem),
        ]);
        setPage(pageResult.data.page);
        setTotal(pageResult.data.total);
      } else {
        const force = mode === 'refresh';
        const listParams = { page: 1, limit: PAGE_SIZE };
        const [summaryResult, pageResult] = await Promise.all([
          resourceCache.query<ReferralSummaryDto>({
            key: cacheKeys.referrals.summary(),
            staleTime: CACHE_STALE_TIMES.REFERRALS_SUMMARY,
            force,
            fetcher: getReferralSummary,
          }),
          resourceCache.query<ReferralPageDto>({
            key: cacheKeys.referrals.list(listParams),
            staleTime: CACHE_STALE_TIMES.REFERRALS_LIST,
            force,
            fetcher: () => listReferrals(listParams),
          }),
        ]);
        setSummary(mapReferralSummary(summaryResult.data));
        setItems(pageResult.data.items.map(mapReferralListItem));
        setPage(pageResult.data.page);
        setTotal(pageResult.data.total);
      }
      setError(null);
    } catch (err) {
      const keptSummary = resourceCache.peek<ReferralSummaryDto>(cacheKeys.referrals.summary());
      const keptList = resourceCache.peek<ReferralPageDto>(
        cacheKeys.referrals.list({ page: 1, limit: PAGE_SIZE }),
      );
      if (mode !== 'append' && keptSummary && keptList) {
        setSummary(mapReferralSummary(keptSummary));
        setItems(keptList.items.map(mapReferralListItem));
        setPage(keptList.page);
        setTotal(keptList.total);
        setError(null);
      } else {
        setError(mapReferralError(err));
        if (mode !== 'append') {
          setItems([]);
        }
      }
    } finally {
      inflightRef.current = false;
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchAll('initial', 1);
      return () => {
        if (copiedTimerRef.current) {
          clearTimeout(copiedTimerRef.current);
        }
      };
    }, [fetchAll]),
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [router]);

  const openHelp = useCallback(() => {
    triggerLightHaptic();
    showAppAlert(REFER_EARN_SCREEN.helpTitle, REFER_EARN_SCREEN.helpMessage);
  }, []);

  const markCopied = useCallback(() => {
    setCopied(true);
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  const code = summary?.referralCode ?? '';

  const copyCode = useCallback(() => {
    if (!code) {
      return;
    }
    triggerLightHaptic();
    void (async () => {
      try {
        await copyTextToClipboard(code);
        triggerSuccessHaptic();
        markCopied();
        showAppAlert(
          REFER_EARN_SCREEN.copySuccessTitle,
          REFER_EARN_SCREEN.copySuccessMessage,
        );
      } catch (err) {
        if (isClipboardCancelled(err)) {
          return;
        }
        showAppAlert(REFER_EARN_SCREEN.copyLabel, code);
        markCopied();
      }
    })();
  }, [code, markCopied]);

  const shareCode = useCallback(() => {
    if (!code) {
      return;
    }
    triggerLightHaptic();
    void Share.share({
      message: REFER_EARN_SCREEN.shareMessage(code),
    })
      .then((result) => {
        if (result.action === Share.dismissedAction) {
          return;
        }
        triggerSuccessHaptic();
      })
      .catch(() => {
        showAppAlert(
          REFER_EARN_SCREEN.shareFailedTitle,
          REFER_EARN_SCREEN.shareFailedMessage,
        );
      });
  }, [code]);

  return {
    title: REFER_EARN_SCREEN.title,
    heroTitle: REFER_EARN_SCREEN.heroTitle,
    heroSubtitle: REFER_EARN_SCREEN.heroSubtitle,
    code,
    perks: REFERRAL_PERKS,
    summary,
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore: items.length < total,
    copied,
    emptyTitle: REFER_EARN_SCREEN.emptyTitle,
    emptySubtitle: REFER_EARN_SCREEN.emptySubtitle,
    inviteLabel: REFER_EARN_SCREEN.inviteLabel,
    goBack,
    openHelp,
    copyCode,
    shareCode,
    refresh: () => fetchAll('refresh', 1),
    loadMore: () => {
      if (items.length < total) {
        void fetchAll('append', page + 1);
      }
    },
    retry: () => {
      void fetchAll('initial', 1);
    },
  };
};

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  copyTextToClipboard,
  getErrorMessage,
  isClipboardCancelled,
  showAppAlert,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils';

import { listMyCoupons, listPublicCoupons } from '../api/coupons.api';
import type { CouponActorContext, CouponDto } from '../api/coupons.types';
import { PROMOTIONS_COUPONS_SCREEN } from '../constants/promotions-coupons.constants';
import { couponCatalogCache } from '../store/couponCatalogCache';
import { filterCouponsForContext } from '../utils/couponAudience';

export interface UsePromotionsCouponsParams {
  actorContext?: CouponActorContext;
}

export interface UsePromotionsCouponsResult {
  items: CouponDto[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  copiedCode: string | null;
  actorContext: CouponActorContext;
  refresh: () => Promise<void>;
  retry: () => void;
  copyCode: (code: string) => void;
  goBack: () => void;
}

const mergeCoupons = (items: CouponDto[]): CouponDto[] => {
  const byCode = new Map<string, CouponDto>();
  for (const coupon of items) {
    const key = coupon.code.trim().toUpperCase() || coupon.id;
    if (!key) {
      continue;
    }
    const existing = byCode.get(key);
    if (!existing || (coupon.isActive && !existing.isActive)) {
      byCode.set(key, coupon);
    }
  }
  return Array.from(byCode.values()).sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    return a.title.localeCompare(b.title);
  });
};

export const usePromotionsCoupons = (
  params: UsePromotionsCouponsParams = {},
): UsePromotionsCouponsResult => {
  const router = useRouter();
  const actorContext: CouponActorContext = params.actorContext ?? 'RIDER';
  const [items, setItems] = useState<CouponDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      const requestId = ++requestIdRef.current;
      if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
        const cached = couponCatalogCache.get(actorContext);
        setItems(cached ? mergeCoupons(cached) : []);
      }
      try {
        const [publicPage, minePage] = await Promise.all([
          listPublicCoupons({ page: 1, limit: 50 }),
          listMyCoupons({ page: 1, limit: 50 }).catch(() => ({
            items: [] as CouponDto[],
          })),
        ]);
        if (requestId !== requestIdRef.current) {
          return;
        }
        const scoped = filterCouponsForContext(
          [...minePage.items, ...publicPage.items],
          actorContext,
        );
        couponCatalogCache.set(actorContext, scoped);
        setItems(mergeCoupons(scoped));
        setError(null);
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setError(getErrorMessage(err, 'Could not load promotions.'));
        if (mode === 'initial') {
          setItems([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [actorContext],
  );

  useEffect(() => {
    setItems([]);
    void load('initial');
    return () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, [load]);

  const refresh = useCallback(async () => {
    await load('refresh');
  }, [load]);

  const retry = useCallback(() => {
    void load('initial');
  }, [load]);

  const copyCode = useCallback(
    (code: string) => {
      const value = code.trim();
      if (!value) {
        return;
      }
      triggerLightHaptic();
      void (async () => {
        try {
          await copyTextToClipboard(value);
          triggerSuccessHaptic();
          setCopiedCode(value.toUpperCase());
          if (copiedTimerRef.current) {
            clearTimeout(copiedTimerRef.current);
          }
          copiedTimerRef.current = setTimeout(() => {
            setCopiedCode(null);
          }, 2000);
          showAppAlert(
            PROMOTIONS_COUPONS_SCREEN.copySuccessTitle,
            actorContext === 'DRIVER'
              ? PROMOTIONS_COUPONS_SCREEN.driverCopySuccessMessage(value.toUpperCase())
              : PROMOTIONS_COUPONS_SCREEN.copySuccessMessage(value.toUpperCase()),
          );
        } catch (err) {
          if (isClipboardCancelled(err)) {
            return;
          }
          showAppAlert(PROMOTIONS_COUPONS_SCREEN.copyLabel, value.toUpperCase());
          setCopiedCode(value.toUpperCase());
        }
      })();
    },
    [actorContext],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [router]);

  return {
    items,
    loading,
    refreshing,
    error,
    copiedCode,
    actorContext,
    refresh,
    retry,
    copyCode,
    goBack,
  };
};

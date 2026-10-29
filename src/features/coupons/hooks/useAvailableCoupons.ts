import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { getErrorMessage, showAppAlert, triggerLightHaptic } from '@/shared/utils';

import { listMyCoupons, listPublicCoupons } from '../api/coupons.api';
import type { CouponDto } from '../api/coupons.types';
import { AVAILABLE_COUPONS_SCREEN } from '../constants/available-coupons.constants';
import {
  buildCouponContextKey,
  couponApplyBridgeStore,
} from '../store/couponApplyBridgeStore';
import {
  couponChargeCompatibleWithRide,
  couponMatchesRideType,
  type BookingRideType,
} from '../utils/previewCouponApply.helpers';
import { previewCouponForBooking } from '../utils/previewCouponApply';

export interface UseAvailableCouponsParams {
  rideId: string;
  rideType: BookingRideType | string;
  rideFare: number;
  assuredFee: number;
  seats: number;
  appliedCode?: string;
}

export interface UseAvailableCouponsResult {
  items: CouponDto[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  applyingCode: string | null;
  appliedCode: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
  applyCoupon: (coupon: CouponDto) => Promise<void>;
  goBack: () => void;
}

export const useAvailableCoupons = (
  params: UseAvailableCouponsParams,
): UseAvailableCouponsResult => {
  const router = useRouter();
  const [items, setItems] = useState<CouponDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const applyingRef = useRef(false);

  const contextKey = useMemo(
    () =>
      buildCouponContextKey({
        rideId: params.rideId,
        rideType: params.rideType,
        seats: params.seats,
        rideFare: params.rideFare,
        assuredFee: params.assuredFee,
      }),
    [
      params.assuredFee,
      params.rideFare,
      params.rideId,
      params.rideType,
      params.seats,
    ],
  );

  const filterEligible = useCallback(
    (coupons: CouponDto[]): CouponDto[] => {
      const byCode = new Map<string, CouponDto>();
      for (const coupon of coupons) {
        if (!coupon.isActive) {
          continue;
        }
        if (!couponMatchesRideType(coupon, params.rideType)) {
          continue;
        }
        if (!couponChargeCompatibleWithRide(coupon, params.rideType)) {
          continue;
        }
        if (coupon.expiresAt) {
          const expires = new Date(coupon.expiresAt).getTime();
          if (Number.isFinite(expires) && expires < Date.now()) {
            continue;
          }
        }
        if (!byCode.has(coupon.code)) {
          byCode.set(coupon.code, coupon);
        }
      }
      return Array.from(byCode.values());
    },
    [params.rideType],
  );

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }
      try {
        const [publicPage, minePage] = await Promise.all([
          listPublicCoupons({ page: 1, limit: 50 }),
          listMyCoupons({ page: 1, limit: 50 }).catch(() => ({
            items: [] as CouponDto[],
          })),
        ]);
        setItems(filterEligible([...minePage.items, ...publicPage.items]));
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load coupons.'));
        if (mode === 'initial') {
          setItems([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filterEligible],
  );

  useEffect(() => {
    void load('initial');
  }, [load]);

  const refresh = useCallback(async () => {
    await load('refresh');
  }, [load]);

  const retry = useCallback(() => {
    void load('initial');
  }, [load]);

  const applyCoupon = useCallback(
    async (coupon: CouponDto) => {
      if (applyingRef.current) {
        return;
      }
      applyingRef.current = true;
      const requestId = ++requestIdRef.current;
      setApplyingCode(coupon.code);
      triggerLightHaptic();

      try {
        const result = await previewCouponForBooking({
          code: coupon.code,
          rideType: params.rideType,
          rideFare: params.rideFare,
          assuredFee: params.assuredFee,
          listedCoupon: coupon,
          requestId,
          isCurrent: (id) => id === requestIdRef.current,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!result.ok) {
          if (result.message !== 'Cancelled') {
            showAppAlert('Unable to apply', result.message);
          }
          return;
        }

        const { applied } = result;
        couponApplyBridgeStore.set({
          code: applied.code,
          chargeScope: applied.chargeScope,
          discountAmount: applied.discountAmount,
          title: applied.title ?? coupon.title,
          benefitType: applied.benefitType,
          pointsCredit: applied.pointsCredit,
          contextKey,
        });

        if (router.canGoBack()) {
          router.back();
        }
      } catch (err) {
        showAppAlert(
          'Unable to apply',
          getErrorMessage(err, AVAILABLE_COUPONS_SCREEN.emptyMessage),
        );
      } finally {
        if (requestId === requestIdRef.current) {
          applyingRef.current = false;
          setApplyingCode(null);
        }
      }
    },
    [contextKey, params.assuredFee, params.rideFare, params.rideType, router],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
  }, [router]);

  return {
    items,
    loading,
    refreshing,
    error,
    applyingCode,
    appliedCode: params.appliedCode?.trim().toUpperCase() || null,
    refresh,
    retry,
    applyCoupon,
    goBack,
  };
};

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';

import { ROUTES } from '@/config';
import { getUserRatings } from '@/features/ratings/api';
import type { UserRatingItem } from '@/features/ratings/api';
import { computeUserRatingsSummary } from '@/features/ratings/utils/userRatingsSummary';
import { useSessionUser } from '@/shared/hooks';
import { triggerLightHaptic } from '@/shared/utils';
import { authSession } from '@/store';
import { MY_RATINGS_SCREEN } from '../constants';
import type { MyRatingReview, MyRatingsDirection } from '../types';

const formatReviewDate = (value?: string): string => {
  if (!value?.trim()) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const mapRoleLabel = (role?: 'DRIVER' | 'PASSENGER'): string | null => {
  if (role === 'DRIVER') {
    return MY_RATINGS_SCREEN.driverRoleLabel;
  }
  if (role === 'PASSENGER') {
    return MY_RATINGS_SCREEN.passengerRoleLabel;
  }
  return null;
};

const mapReview = (
  item: UserRatingItem,
  direction: MyRatingsDirection,
): MyRatingReview => {
  const isGiven = direction === 'given';
  const person = isGiven ? item.toUser : item.fromUser;

  return {
    id: item.id,
    rating: item.rating,
    comment: item.comment ?? null,
    createdAtLabel: formatReviewDate(item.createdAt),
    reviewerName:
      (isGiven
        ? item.toUser?.userName?.trim()
        : item.reviewerName?.trim() || item.fromUser?.userName?.trim()) ||
      MY_RATINGS_SCREEN.anonymousReviewer,
    reviewerPhoto:
      (isGiven
        ? item.toUser?.userPhoto?.trim()
        : item.reviewerPhoto?.trim() || item.fromUser?.userPhoto?.trim()) || null,
    rideLabel: item.rideLabel?.trim() || null,
    roleLabel: mapRoleLabel(item.role),
    contextLabel: isGiven
      ? MY_RATINGS_SCREEN.youRatedLabel
      : MY_RATINGS_SCREEN.ratedByLabel,
  };
};

export interface UseMyRatingsResult {
  activeDirection: MyRatingsDirection;
  heroSubtitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  summaryLabel: string;
  reviewCountLabel: string;
  reviews: readonly MyRatingReview[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  setDirection: (direction: MyRatingsDirection) => void;
  goBack: () => void;
  refresh: () => Promise<void>;
  retry: () => void;
}

export const useMyRatings = (): UseMyRatingsResult => {
  const router = useRouter();
  const user = useSessionUser();
  const [activeDirection, setActiveDirection] = useState<MyRatingsDirection>('received');
  const [reviews, setReviews] = useState<readonly MyRatingReview[]>([]);
  const [summaryLabel, setSummaryLabel] = useState('—');
  const [reviewCountLabel, setReviewCountLabel] = useState('0');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRatings = useCallback(
    async (direction: MyRatingsDirection, isRefresh = false) => {
      const userId = user?.id?.trim() || authSession.getUser()?.id?.trim();
      if (!userId) {
        // eslint-disable-next-line no-console
        console.warn('[BhaiWay Ratings API] skipped — no session user id', {
          sessionUserId: user?.id ?? null,
          authSessionUserId: authSession.getUser()?.id ?? null,
          direction,
        });
        setReviews([]);
        setSummaryLabel('—');
        setReviewCountLabel('0');
        setError(null);
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const page = await getUserRatings(userId, { direction });
        const mapped = page.items.map((item) => mapReview(item, direction));
        const summary = computeUserRatingsSummary(page.items);
        const averageLabel =
          page.averageRating != null && Number.isFinite(page.averageRating)
            ? page.averageRating.toFixed(1)
            : summary.averageLabel;
        const countLabel = String(page.totalRatings ?? page.total ?? summary.count);

        setReviews(mapped);
        setSummaryLabel(averageLabel);
        setReviewCountLabel(countLabel);
        setError(null);
      } catch (loadError) {
        // eslint-disable-next-line no-console
        console.error('[BhaiWay Ratings API] profile screen load failed', {
          userId,
          direction,
          error: loadError,
        });
        setError(MY_RATINGS_SCREEN.loadErrorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    void loadRatings(activeDirection);
  }, [activeDirection, loadRatings]);

  useFocusEffect(
    useCallback(() => {
      void loadRatings(activeDirection, true);
    }, [activeDirection, loadRatings]),
  );

  const setDirection = useCallback((direction: MyRatingsDirection) => {
    triggerLightHaptic();
    setActiveDirection(direction);
  }, []);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [router]);

  const refresh = useCallback(async () => {
    await loadRatings(activeDirection, true);
  }, [activeDirection, loadRatings]);

  const retry = useCallback(() => {
    triggerLightHaptic();
    void loadRatings(activeDirection);
  }, [activeDirection, loadRatings]);

  const heroSubtitle =
    activeDirection === 'given'
      ? MY_RATINGS_SCREEN.givenHeroSubtitle
      : MY_RATINGS_SCREEN.receivedHeroSubtitle;
  const emptyTitle =
    activeDirection === 'given'
      ? MY_RATINGS_SCREEN.givenEmptyTitle
      : MY_RATINGS_SCREEN.receivedEmptyTitle;
  const emptySubtitle =
    activeDirection === 'given'
      ? MY_RATINGS_SCREEN.givenEmptySubtitle
      : MY_RATINGS_SCREEN.receivedEmptySubtitle;

  return {
    activeDirection,
    heroSubtitle,
    emptyTitle,
    emptySubtitle,
    summaryLabel,
    reviewCountLabel,
    reviews,
    loading,
    error,
    refreshing,
    setDirection,
    goBack,
    refresh,
    retry,
  };
};

import { useCallback, useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '@/shared/utils';

import { getPendingRatings, type PendingRatingTask } from '../api';

export interface UsePendingRatingsResult {
  items: PendingRatingTask[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<PendingRatingTask[]>;
}

export const usePendingRatings = (enabled = true): UsePendingRatingsResult => {
  const [items, setItems] = useState<PendingRatingTask[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async (): Promise<PendingRatingTask[]> => {
    if (inFlightRef.current) {
      return items;
    }
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const next = await getPendingRatings();
      setItems(next);
      return next;
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load pending ratings.'));
      return [];
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / enabled only
  }, [enabled]);

  return {
    items,
    loading,
    error,
    refresh,
  };
};

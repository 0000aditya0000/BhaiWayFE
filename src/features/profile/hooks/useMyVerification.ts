import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { authSession } from '@/store';
import { getErrorMessage } from '@/shared/utils';
import { getMyVerifications, type MyVerificationsResponse } from '../api';
import { verificationStore } from '../store/verificationStore';

export interface UseMyVerificationResult {
  verifications: MyVerificationsResponse | null;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Loads GET /verification/me for the logged-in user (Bearer JWT).
 * Docs: BhaiWay_Backend_API_Documentation.md §4
 */
export const useMyVerification = (): UseMyVerificationResult => {
  const [verifications, setVerifications] = useState<MyVerificationsResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authSession.getToken()) {
      setVerifications(null);
      setError(null);
      return;
    }

    setRefreshing(true);
    try {
      const rows = await getMyVerifications();
      verificationStore.set(rows);
      setVerifications(rows);
      setError(null);
    } catch (err) {
      const message = getErrorMessage(err);
      console.log('[Verification] GET /verification/me failed', message);
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return {
    verifications,
    refreshing,
    error,
    refresh,
  };
};

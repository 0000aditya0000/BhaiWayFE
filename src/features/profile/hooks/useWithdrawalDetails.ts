import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getWithdrawal, type WithdrawalDto } from '../api/withdrawals.api';
import { WITHDRAWAL_DETAILS_SCREEN } from '../constants/withdrawal-details.constants';
import { mapWithdrawalError } from '../utils/withdrawals.mapper';
import { triggerLightHaptic } from '@/shared/utils';

export interface UseWithdrawalDetailsResult {
  title: string;
  withdrawal: WithdrawalDto | null;
  loading: boolean;
  error: string | null;
  goBack: () => void;
  openHistory: () => void;
  goWallet: () => void;
  retry: () => void;
  refresh: () => Promise<void>;
}

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export const useWithdrawalDetails = (): UseWithdrawalDetailsResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = getParam(params.id);
  const [withdrawal, setWithdrawal] = useState<WithdrawalDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Withdrawal not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await getWithdrawal(id);
      setWithdrawal(next);
      setError(null);
    } catch (err) {
      setError(mapWithdrawalError(err));
      setWithdrawal(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.withdrawalHistory);
  }, [router]);

  return {
    title: WITHDRAWAL_DETAILS_SCREEN.title,
    withdrawal,
    loading,
    error,
    goBack,
    openHistory: () => {
      triggerLightHaptic();
      router.push(ROUTES.withdrawalHistory);
    },
    goWallet: () => {
      triggerLightHaptic();
      router.replace(ROUTES.wallet);
    },
    retry: () => {
      void load();
    },
    refresh: load,
  };
};

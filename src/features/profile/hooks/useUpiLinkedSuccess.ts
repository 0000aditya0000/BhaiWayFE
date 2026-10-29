import { useCallback, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import {
  UPI_LINKED_SUCCESS_SCREEN,
} from '../constants/upi-linked-success.constants';

export interface UseUpiLinkedSuccessResult {
  headerTitle: string;
  title: string;
  subtitle: string;
  linkedLabel: string;
  verifiedBadge: string;
  continueWalletLabel: string;
  backPaymentLabel: string;
  upiId: string;
  goBack: () => void;
  continueToWallet: () => void;
  backToPaymentMethods: () => void;
}

export const useUpiLinkedSuccess = (): UseUpiLinkedSuccessResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ upiId?: string }>();

  const upiId = useMemo(() => {
    const fromParam = getSearchParam(params.upiId);
    return fromParam || UPI_LINKED_SUCCESS_SCREEN.defaultUpiId;
  }, [params.upiId]);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.addMoney);
  }, [router]);

  const continueToWallet = useCallback(() => {
    triggerLightHaptic();
    router.replace(ROUTES.wallet);
  }, [router]);

  const backToPaymentMethods = useCallback(() => {
    triggerLightHaptic();
    router.replace(ROUTES.paymentMethods);
  }, [router]);

  return {
    headerTitle: UPI_LINKED_SUCCESS_SCREEN.headerTitle,
    title: UPI_LINKED_SUCCESS_SCREEN.title,
    subtitle: UPI_LINKED_SUCCESS_SCREEN.subtitle,
    linkedLabel: UPI_LINKED_SUCCESS_SCREEN.linkedLabel,
    verifiedBadge: UPI_LINKED_SUCCESS_SCREEN.verifiedBadge,
    continueWalletLabel: UPI_LINKED_SUCCESS_SCREEN.continueWalletLabel,
    backPaymentLabel: UPI_LINKED_SUCCESS_SCREEN.backPaymentLabel,
    upiId,
    goBack,
    continueToWallet,
    backToPaymentMethods,
  };
};

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { createTopUpOrder, mapWalletApiError } from '../api/wallet.api';
import { useSessionUser } from '@/shared/hooks';
import {
  triggerLightHaptic,
  triggerSuccessHaptic,
  showAppAlert,
} from '@/shared/utils';
import { DEFAULT_PROFILE_AVATAR } from '../constants/profile.constants';
import {
  ADD_MONEY_QUICK_AMOUNTS,
  ADD_MONEY_SCREEN,
  DEFAULT_ADD_MONEY_AMOUNT,
} from '../constants/add-money.constants';
import { getTopUpPaymentPath } from '../constants/top-up-payment.constants';
import { pendingTopUpOrderStore } from '../store/pendingTopUpOrderStore';
import type { AddMoneyQuickAmount } from '../types';
import {
  formatCoinString,
  formatCoinsLabel,
  formatRupeeFromCoins,
  generateIdempotencyKey,
  sanitizeCoinInput,
  validateTopUpAmount,
} from '../utils/walletCoin';

export interface UseAddMoneyResult {
  amount: string;
  quickAmounts: readonly AddMoneyQuickAmount[];
  coinsPreview: string;
  rupeePreview: string;
  submitting: boolean;
  avatarUri: string;
  setAmount: (value: string) => void;
  setQuickAmount: (amount: string) => void;
  submit: () => void;
  goBack: () => void;
}

export const useAddMoney = (): UseAddMoneyResult => {
  const router = useRouter();
  const user = useSessionUser();
  const [amount, setAmountState] = useState(DEFAULT_ADD_MONEY_AMOUNT);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyRef = useRef<{ key: string; amount: string } | null>(null);

  const avatarUri = useMemo(
    () => user?.avatarUri ?? DEFAULT_PROFILE_AVATAR,
    [user?.avatarUri],
  );

  const sanitizedAmount = useMemo(() => sanitizeCoinInput(amount), [amount]);

  const coinsPreview = useMemo(
    () => (sanitizedAmount ? formatCoinString(sanitizedAmount) : '0'),
    [sanitizedAmount],
  );

  const rupeePreview = useMemo(
    () => formatRupeeFromCoins(sanitizedAmount || '0'),
    [sanitizedAmount],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.wallet);
  }, [router]);

  const setAmount = useCallback((value: string) => {
    setAmountState(sanitizeCoinInput(value));
    idempotencyRef.current = null;
  }, []);

  const setQuickAmount = useCallback((value: string) => {
    triggerLightHaptic();
    setAmountState(value);
    idempotencyRef.current = null;
  }, []);

  const resolveIdempotencyKey = useCallback((validatedAmount: string): string => {
    const current = idempotencyRef.current;
    if (current && current.amount === validatedAmount) {
      return current.key;
    }
    const key = generateIdempotencyKey();
    idempotencyRef.current = { key, amount: validatedAmount };
    return key;
  }, []);

  const submit = useCallback(() => {
    triggerLightHaptic();
    const validation = validateTopUpAmount(amount);
    if (!validation.ok) {
      showAppAlert(ADD_MONEY_SCREEN.invalidAmountTitle, validation.message);
      return;
    }

    setSubmitting(true);
    const idempotencyKey = resolveIdempotencyKey(validation.amount);

    void (async () => {
      try {
        const order = await createTopUpOrder({ amount: validation.amount }, idempotencyKey);
        idempotencyRef.current = null; // clear after successful order so any subsequent attempt generates a fresh key
        pendingTopUpOrderStore.set(order);
        triggerSuccessHaptic();
        router.push(
          getTopUpPaymentPath({
            orderId: order.orderId,
            gatewayOrderId: order.gatewayOrderId,
            amount: order.amount,
            currency: order.currency,
            keyId: order.keyId,
            signatureHeader: order.mockInstructions?.signatureHeader,
            amountLabel: formatCoinsLabel(validation.amount),
            rupeeLabel: formatRupeeFromCoins(validation.amount),
          }),
        );
      } catch (error) {
        const message = mapWalletApiError(error);
        if (message.toLowerCase().includes('idempotency') || message.toLowerCase().includes('conflict')) {
          idempotencyRef.current = null;
          showAppAlert(
            ADD_MONEY_SCREEN.topUpConflictTitle,
            ADD_MONEY_SCREEN.topUpConflictMessage,
          );
          return;
        }
        showAppAlert(ADD_MONEY_SCREEN.topUpFailedTitle, message);
      } finally {
        setSubmitting(false);
      }
    })();
  }, [amount, resolveIdempotencyKey, router]);

  return {
    amount,
    quickAmounts: ADD_MONEY_QUICK_AMOUNTS,
    coinsPreview,
    rupeePreview,
    submitting,
    avatarUri,
    setAmount,
    setQuickAmount,
    submit,
    goBack,
  };
};

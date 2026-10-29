import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { listPaymentMethods, type PaymentMethodDto } from '../api/paymentMethods.api';
import { createWithdrawal } from '../api/withdrawals.api';
import { getAddPaymentMethodPath } from '../constants/payment-methods.constants';
import {
  DEFAULT_WITHDRAW_AMOUNT,
  WITHDRAW_QUICK_AMOUNTS,
  WITHDRAW_SCREEN,
} from '../constants/withdraw.constants';
import type { WithdrawQuickAmount } from '../types';
import {
  filterActivePaymentMethods,
  mapPaymentMethodError,
  paymentMethodSubtitle,
  paymentMethodTitle,
} from '../utils/paymentMethods.mapper';
import {
  generateWithdrawIdempotencyKey,
  mapWithdrawalError,
  validateWithdrawAmount,
  WITHDRAWAL_ERROR_MESSAGES,
} from '../utils/withdrawals.mapper';
import {
  formatCoinString,
  sanitizeCoinInput,
} from '../utils/walletCoin';
import { triggerLightHaptic, triggerSuccessHaptic, showAppAlert } from '@/shared/utils';
import { useWalletBalance } from './useWalletBalance';

export interface UseWithdrawResult {
  title: string;
  balanceLabel: string;
  balanceValueLabel: string;
  availableCoins: string;
  amount: string;
  selectedPaymentMethodId: string;
  methods: PaymentMethodDto[];
  methodsLoading: boolean;
  methodsError: string | null;
  quickAmounts: readonly WithdrawQuickAmount[];
  submitting: boolean;
  submitError: string | null;
  canSubmit: boolean;
  setAmount: (value: string) => void;
  addQuickAmount: (amount: number) => void;
  setMaxAmount: () => void;
  selectPaymentMethod: (id: string) => void;
  addPaymentMethod: () => void;
  proceed: () => void;
  retrySameAttempt: () => void;
  checkStatus: () => void;
  goBack: () => void;
  openHistory: () => void;
  methodTitle: (method: PaymentMethodDto) => string;
  methodSubtitle: (method: PaymentMethodDto) => string;
  refresh: () => Promise<void>;
}

export const useWithdraw = (): UseWithdrawResult => {
  const router = useRouter();
  const { summary, refresh: refreshBalance } = useWalletBalance();
  const [methods, setMethods] = useState<PaymentMethodDto[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [methodsError, setMethodsError] = useState<string | null>(null);
  const [amount, setAmountState] = useState(String(DEFAULT_WITHDRAW_AMOUNT));
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const idempotencyRef = useRef<{ key: string; amount: string; paymentMethodId: string } | null>(
    null,
  );
  const lastWithdrawalIdRef = useRef<string | null>(null);

  const availableCoins = summary?.withdrawableCoins ?? '0';

  const loadMethods = useCallback(async () => {
    setMethodsLoading(true);
    try {
      const rows = filterActivePaymentMethods(await listPaymentMethods());
      setMethods(rows);
      setMethodsError(null);
      setSelectedPaymentMethodId((prev) => {
        if (rows.some((row) => row.id === prev)) {
          return prev;
        }
        return rows[0]?.id ?? '';
      });
    } catch (err) {
      setMethodsError(mapPaymentMethodError(err));
      setMethods([]);
    } finally {
      setMethodsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([refreshBalance(), loadMethods()]);
  }, [loadMethods, refreshBalance]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.wallet);
  }, [router]);

  const openHistory = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.withdrawalHistory);
  }, [router]);

  const setAmount = useCallback((value: string) => {
    setSubmitError(null);
    idempotencyRef.current = null;
    setAmountState(sanitizeCoinInput(value));
  }, []);

  const addQuickAmount = useCallback(
    (increment: number) => {
      triggerLightHaptic();
      setSubmitError(null);
      idempotencyRef.current = null;
      setAmountState((prev) => {
        const current = Number.parseInt(prev || '0', 10) || 0;
        return String(current + increment);
      });
    },
    [],
  );

  const setMaxAmount = useCallback(() => {
    triggerLightHaptic();
    setSubmitError(null);
    idempotencyRef.current = null;
    setAmountState(sanitizeCoinInput(availableCoins));
  }, [availableCoins]);

  const selectPaymentMethod = useCallback((id: string) => {
    triggerLightHaptic();
    setSubmitError(null);
    idempotencyRef.current = null;
    setSelectedPaymentMethodId(id);
  }, []);

  const addPaymentMethod = useCallback(() => {
    triggerLightHaptic();
    router.push(getAddPaymentMethodPath({ returnTo: 'withdraw' }));
  }, [router]);

  const submitWithdrawal = useCallback(
    async (reuseKey: boolean) => {
      if (submitting) {
        return;
      }

      const validated = validateWithdrawAmount(amount, availableCoins);
      if (!validated.ok) {
        setSubmitError(validated.message);
        showAppAlert(WITHDRAW_SCREEN.invalidAmountTitle, validated.message);
        return;
      }

      if (!selectedPaymentMethodId) {
        showAppAlert(
          WITHDRAW_SCREEN.selectAccountTitle,
          WITHDRAW_SCREEN.selectAccountMessage,
        );
        return;
      }

      let key = idempotencyRef.current?.key;
      if (
        !reuseKey ||
        !key ||
        idempotencyRef.current?.amount !== validated.amount ||
        idempotencyRef.current?.paymentMethodId !== selectedPaymentMethodId
      ) {
        key = generateWithdrawIdempotencyKey();
        idempotencyRef.current = {
          key,
          amount: validated.amount,
          paymentMethodId: selectedPaymentMethodId,
        };
      }

      setSubmitting(true);
      setSubmitError(null);
      triggerLightHaptic();

      try {
        const withdrawal = await createWithdrawal(
          {
            amount: validated.amount,
            paymentMethodId: selectedPaymentMethodId,
          },
          key,
        );
        const { invalidateWalletCache, invalidateWithdrawalsCache } = await import(
          '@/network/resourceCache'
        );
        invalidateWalletCache();
        invalidateWithdrawalsCache();
        lastWithdrawalIdRef.current = withdrawal.id;
        idempotencyRef.current = null;
        triggerSuccessHaptic();
        showAppAlert(
          WITHDRAW_SCREEN.successTitle,
          WITHDRAW_SCREEN.successMessage,
        );
        router.replace({
          pathname: ROUTES.withdrawalDetails,
          params: { id: withdrawal.id },
        });
      } catch (err) {
        const message = mapWithdrawalError(err);
        setSubmitError(message);
        if (message === WITHDRAWAL_ERROR_MESSAGES.TIMEOUT) {
          showAppAlert(WITHDRAW_SCREEN.timeoutTitle, message, [
            {
              text: WITHDRAW_SCREEN.checkStatusLabel,
              onPress: () => {
                const id = lastWithdrawalIdRef.current;
                if (id) {
                  router.push({ pathname: ROUTES.withdrawalDetails, params: { id } });
                  return;
                }
                router.push(ROUTES.withdrawalHistory);
              },
            },
            {
              text: WITHDRAW_SCREEN.retryLabel,
              onPress: () => {
                void submitWithdrawal(true);
              },
            },
          ]);
          return;
        }
        showAppAlert(WITHDRAW_SCREEN.failedTitle, message);
      } finally {
        setSubmitting(false);
      }
    },
    [amount, availableCoins, router, selectedPaymentMethodId, submitting],
  );

  const amountValid = validateWithdrawAmount(amount, availableCoins);
  const canSubmit =
    amountValid.ok &&
    Boolean(selectedPaymentMethodId) &&
    !submitting &&
    !methodsLoading;

  return {
    title: WITHDRAW_SCREEN.title,
    balanceLabel: WITHDRAW_SCREEN.balanceLabel,
    balanceValueLabel: `${formatCoinString(availableCoins)} Coins`,
    availableCoins,
    amount,
    selectedPaymentMethodId,
    methods,
    methodsLoading,
    methodsError,
    quickAmounts: WITHDRAW_QUICK_AMOUNTS,
    submitting,
    submitError,
    canSubmit,
    setAmount,
    addQuickAmount,
    setMaxAmount,
    selectPaymentMethod,
    addPaymentMethod,
    proceed: () => {
      void submitWithdrawal(false);
    },
    retrySameAttempt: () => {
      void submitWithdrawal(true);
    },
    checkStatus: () => {
      const id = lastWithdrawalIdRef.current;
      if (id) {
        router.push({ pathname: ROUTES.withdrawalDetails, params: { id } });
        return;
      }
      router.push(ROUTES.withdrawalHistory);
    },
    goBack,
    openHistory,
    methodTitle: paymentMethodTitle,
    methodSubtitle: paymentMethodSubtitle,
    refresh,
  };
};

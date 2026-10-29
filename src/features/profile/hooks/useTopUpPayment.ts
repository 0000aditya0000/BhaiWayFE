import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  mapWalletApiError,
  verifyTopUpPayment,
  type TopUpOrderDto,
} from '../api/wallet.api';
import {
  isRazorpayCancellation,
  razorpayPaymentGateway,
} from '../services/paymentGateway';
import { pollTopUpOrderStatus } from '../services/topUpPolling';
import { pendingTopUpOrderStore } from '../store/pendingTopUpOrderStore';
import { walletStore } from '../store/walletStore';
import {
  getErrorMessage,
  getSearchParam,
  showAppAlert,
  triggerErrorHaptic,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils';
import { getFundsAddedPath } from '../constants/funds-added.constants';
import { TOP_UP_PAYMENT_SCREEN } from '../constants/top-up-payment.constants';
import { useWalletBalance } from './useWalletBalance';
import { formatCoinString, formatCoinsLabel } from '../utils/walletCoin';

export type TopUpPaymentPhase =
  | 'idle'
  | 'opening_checkout'
  | 'verifying'
  | 'polling'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface UseTopUpPaymentResult {
  orderId: string;
  amountLabel: string;
  rupeeLabel: string;
  phase: TopUpPaymentPhase;
  processing: boolean;
  errorMessage: string | null;
  startPayment: () => void;
  retryPayment: () => void;
  cancelPayment: () => void;
  goBack: () => void;
  /** Preserved for backward compatibility */
  showMockControls: boolean;
  simulatePayment: (outcome: unknown) => void;
}

const resolvePendingOrder = (
  paymentOrderId: string,
  params: {
    gatewayOrderId: string;
    amount: string;
    currency: string;
    keyId: string;
    signatureHeader: string;
  },
): TopUpOrderDto | null => {
  const stored = pendingTopUpOrderStore.getByPaymentOrderId(paymentOrderId);
  if (stored) {
    return {
      ...stored,
      keyId: stored.keyId || params.keyId || undefined,
    };
  }

  if (!paymentOrderId || !params.gatewayOrderId || !params.amount) {
    return null;
  }

  return {
    orderId: paymentOrderId,
    paymentOrderId,
    gatewayOrderId: params.gatewayOrderId,
    amount: params.amount,
    currency: params.currency,
    keyId: params.keyId || undefined,
    status: 'PENDING',
    mockInstructions: {
      callbackPath: '/wallet/top-up/callback',
      signatureHeader: params.signatureHeader,
    },
  };
};

export const useTopUpPayment = (): UseTopUpPaymentResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string;
    gatewayOrderId?: string;
    amount?: string;
    currency?: string;
    keyId?: string;
    signatureHeader?: string;
    amountLabel?: string;
    rupeeLabel?: string;
  }>();
  const { refresh } = useWalletBalance();

  const orderId = getSearchParam(params.orderId)?.trim() ?? '';
  const gatewayOrderId = getSearchParam(params.gatewayOrderId)?.trim() ?? orderId;
  const amount = getSearchParam(params.amount)?.trim() ?? '';
  const currency = getSearchParam(params.currency)?.trim() || 'INR';
  const keyId = getSearchParam(params.keyId)?.trim() || '';
  const signatureHeader = getSearchParam(params.signatureHeader)?.trim() || 'x-payment-signature';
  const amountLabel = getSearchParam(params.amountLabel)?.trim() || formatCoinsLabel(amount);
  const rupeeLabel = getSearchParam(params.rupeeLabel)?.trim() || `₹${amount}`;

  const [phase, setPhase] = useState<TopUpPaymentPhase>('idle');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const flowLockRef = useRef(false);
  const hasAutoLaunchedRef = useRef(false);

  const pendingOrder = useMemo(
    () =>
      resolvePendingOrder(orderId, {
        gatewayOrderId,
        amount,
        currency,
        keyId,
        signatureHeader,
      }),
    [amount, currency, gatewayOrderId, keyId, orderId, signatureHeader],
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const goBack = useCallback(() => {
    pendingTopUpOrderStore.clear();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.wallet);
  }, [router]);

  const handleSuccessfulCompletion = useCallback(async () => {
    setPhase('success');
    triggerSuccessHaptic();
    const { invalidateWalletCache } = await import('@/network/resourceCache');
    invalidateWalletCache();
    const updated = await refresh();
    walletStore.bumpTransactionsRefresh();
    pendingTopUpOrderStore.clear();
    router.replace(
      getFundsAddedPath({
        amountLabel: formatCoinString(amount),
        balanceLabel: updated ? formatCoinString(updated.balanceCoins) : '',
        amountCoins: amount,
      }),
    );
    showAppAlert(
      TOP_UP_PAYMENT_SCREEN.successTitle,
      TOP_UP_PAYMENT_SCREEN.successMessage.replace('{amount}', amountLabel),
    );
  }, [amount, amountLabel, refresh, router]);

  const handlePollResult = useCallback(
    async (result: Awaited<ReturnType<typeof pollTopUpOrderStatus>>) => {
      if (result.status === 'SUCCESS') {
        await handleSuccessfulCompletion();
        return;
      }
      if (result.status === 'FAILED') {
        setPhase('failed');
        triggerErrorHaptic();
        showAppAlert(TOP_UP_PAYMENT_SCREEN.failedTitle, TOP_UP_PAYMENT_SCREEN.failedMessage);
        return;
      }
      if (result.status === 'CANCELLED') {
        setPhase('cancelled');
        triggerLightHaptic();
        showAppAlert(TOP_UP_PAYMENT_SCREEN.cancelledTitle, TOP_UP_PAYMENT_SCREEN.cancelledMessage);
        return;
      }
      setPhase('timeout');
      showAppAlert(TOP_UP_PAYMENT_SCREEN.timeoutTitle, TOP_UP_PAYMENT_SCREEN.timeoutMessage);
    },
    [handleSuccessfulCompletion],
  );

  const runPaymentFlow = useCallback(async () => {
    if (flowLockRef.current || processing) {
      return;
    }

    const order = pendingOrder;
    if (!order?.orderId || !order.gatewayOrderId || !order.amount) {
      showAppAlert(TOP_UP_PAYMENT_SCREEN.invalidOrderTitle, TOP_UP_PAYMENT_SCREEN.invalidOrderMessage);
      goBack();
      return;
    }

    if (!order.keyId) {
      showAppAlert(
        TOP_UP_PAYMENT_SCREEN.gatewayUnavailableTitle,
        TOP_UP_PAYMENT_SCREEN.gatewayUnavailableMessage,
      );
      return;
    }

    flowLockRef.current = true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setProcessing(true);
    setErrorMessage(null);
    setPhase('opening_checkout');

    try {
      // 1. Open native Razorpay Checkout
      const checkoutResult = await razorpayPaymentGateway.openCheckout(order);

      // 2. Razorpay returned success payload — immediately verify with backend
      setPhase('verifying');

      try {
        const verifyResult = await verifyTopUpPayment({
          razorpay_order_id: checkoutResult.razorpay_order_id,
          razorpay_payment_id: checkoutResult.razorpay_payment_id,
          razorpay_signature: checkoutResult.razorpay_signature,
        });

        if (String(verifyResult.status).toUpperCase() === 'SUCCESS') {
          await handleSuccessfulCompletion();
          return;
        }

        // If backend verification returned a non-terminal status, poll for completion
        setPhase('polling');
        const pollResult = await pollTopUpOrderStatus({
          orderId: order.orderId,
          signal: controller.signal,
        });
        await handlePollResult(pollResult);
      } catch (verifyError) {
        console.log('[TopUpPayment] verify failed, checking order status', getErrorMessage(verifyError));
        // Verification call experienced an error / timeout.
        // Fall back to polling order status so we don't declare failure if the backend captured it.
        setPhase('polling');
        const pollResult = await pollTopUpOrderStatus({
          orderId: order.orderId,
          signal: controller.signal,
        });
        await handlePollResult(pollResult);
      }
    } catch (checkoutError) {
      console.log('[TopUpPayment] checkout error', getErrorMessage(checkoutError));

      if (isRazorpayCancellation(checkoutError)) {
        setPhase('cancelled');
        triggerLightHaptic();
        showAppAlert(
          TOP_UP_PAYMENT_SCREEN.cancelledTitle,
          TOP_UP_PAYMENT_SCREEN.cancelledMessage,
        );
      } else {
        setPhase('failed');
        triggerErrorHaptic();
        const friendlyMsg =
          mapWalletApiError(checkoutError) || TOP_UP_PAYMENT_SCREEN.failedMessage;
        setErrorMessage(friendlyMsg);
        showAppAlert(TOP_UP_PAYMENT_SCREEN.failedTitle, friendlyMsg);
      }
    } finally {
      setProcessing(false);
      flowLockRef.current = false;
    }
  }, [goBack, handlePollResult, handleSuccessfulCompletion, pendingOrder, processing]);

  // Auto-launch checkout once upon arriving on screen if valid order exists
  useEffect(() => {
    if (
      !hasAutoLaunchedRef.current &&
      pendingOrder?.orderId &&
      pendingOrder?.gatewayOrderId &&
      pendingOrder?.keyId
    ) {
      hasAutoLaunchedRef.current = true;
      const timer = setTimeout(() => {
        void runPaymentFlow();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pendingOrder, runPaymentFlow]);

  const startPayment = useCallback(() => {
    triggerLightHaptic();
    void runPaymentFlow();
  }, [runPaymentFlow]);

  const retryPayment = useCallback(() => {
    triggerLightHaptic();
    void runPaymentFlow();
  }, [runPaymentFlow]);

  const cancelPayment = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const simulatePayment = useCallback(() => {
    // No-op in production / real Razorpay flow
    console.warn('[TopUpPayment] simulatePayment called in real Razorpay mode');
  }, []);

  return {
    orderId,
    amountLabel,
    rupeeLabel,
    phase,
    processing,
    errorMessage,
    startPayment,
    retryPayment,
    cancelPayment,
    goBack,
    showMockControls: false,
    simulatePayment,
  };
};

import RazorpayCheckout, {
  type RazorpayCheckoutOptions,
  type RazorpayErrorResponse,
  type RazorpaySuccessResponse,
} from 'react-native-razorpay';

import { colors } from '@/shared/theme';
import { authSession } from '@/store';
import type { TopUpOrderDto } from '../api/wallet.api';

export interface PaymentGatewayResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentGatewayPort {
  /** Opens native Razorpay Checkout for a pending top-up order. */
  openCheckout: (order: TopUpOrderDto) => Promise<PaymentGatewayResult>;
}

import {
  convertRupeesToPaise,
  isRazorpayCancellation,
} from '../utils/razorpay.utils';

export {
  convertRupeesToPaise,
  isRazorpayCancellation,
} from '../utils/razorpay.utils';

/**
 * Razorpay Payment Gateway implementation.
 * Uses public keyId returned dynamically by backend in POST /wallet/top-up.
 * Never stores or uses any Razorpay secrets on client.
 */
export const razorpayPaymentGateway: PaymentGatewayPort = {
  openCheckout: async (order: TopUpOrderDto): Promise<PaymentGatewayResult> => {
    const key = order.keyId?.trim();
    if (!key) {
      throw new Error(
        'Razorpay Key ID was not provided in the top-up order response.',
      );
    }

    const gatewayOrderId = order.gatewayOrderId?.trim();
    if (!gatewayOrderId) {
      throw new Error(
        'Razorpay Gateway Order ID (order_...) was not provided in the top-up order response.',
      );
    }

    const amountInPaise = convertRupeesToPaise(order.amount);
    const user = authSession.getUser();

    const options: RazorpayCheckoutOptions = {
      key,
      amount: amountInPaise,
      currency: order.currency || 'INR',
      name: 'BhaiWay',
      description: 'Wallet Top Up',
      order_id: gatewayOrderId,
      prefill: {
        ...(user?.fullName ? { name: user.fullName } : {}),
        ...(user?.phone ? { contact: user.phone } : {}),
        ...(user?.email ? { email: user.email } : {}),
      },
      theme: {
        color: colors.primary,
      },
      retry: {
        enabled: true,
        max_count: 3,
      },
    };

    const response: RazorpaySuccessResponse = await RazorpayCheckout.open(options);

    if (
      !response?.razorpay_payment_id ||
      !response?.razorpay_order_id ||
      !response?.razorpay_signature
    ) {
      throw new Error('Razorpay Checkout returned an incomplete payment response.');
    }

    return {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    };
  },
};

/** Active payment gateway */
export const paymentGateway: PaymentGatewayPort = razorpayPaymentGateway;

/** Legacy mock checks — always false in real integration */
export const isMockPaymentGateway = (): boolean => false;
export const shouldShowMockPaymentControls = (): boolean => false;

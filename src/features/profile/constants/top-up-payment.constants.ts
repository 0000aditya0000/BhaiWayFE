export const TOP_UP_PAYMENT_SCREEN = {
  title: 'Complete Payment',
  amountLabel: 'Amount',
  coinsLabel: 'Coins',
  processingLabel: 'Opening Razorpay…',
  verifyingLabel: 'Verifying payment with bank…',
  pollingLabel: 'Confirming payment…',
  payCtaLabel: 'Pay with Razorpay',
  retryPayLabel: 'Retry Payment',
  cancelLabel: 'Cancel',
  successTitle: 'Coins added',
  successMessage: '{amount} added successfully.',
  failedTitle: 'Payment Failed',
  failedMessage: 'Your wallet was not credited. Please try again.',
  cancelledTitle: 'Payment Cancelled',
  cancelledMessage: 'Your wallet was not charged.',
  timeoutTitle: 'Payment Pending',
  timeoutMessage:
    'Payment is being processed by the bank. You can check your Wallet shortly.',
  invalidOrderTitle: 'Invalid payment',
  invalidOrderMessage: 'Payment order not found. Please try again.',
  gatewayUnavailableTitle: 'Gateway Unavailable',
  gatewayUnavailableMessage:
    'Payment gateway could not be loaded. Please try again.',
  productionGatewayNote:
    'Complete payment via UPI, card, or netbanking. Your wallet updates immediately upon confirmation.',
} as const;

export const getTopUpPaymentPath = (params: {
  orderId: string;
  gatewayOrderId: string;
  amount: string;
  currency?: string;
  keyId?: string;
  signatureHeader?: string;
  amountLabel?: string;
  rupeeLabel?: string;
}) => ({
  pathname: '/top-up-payment' as const,
  params: {
    orderId: params.orderId,
    gatewayOrderId: params.gatewayOrderId,
    amount: params.amount,
    currency: params.currency ?? 'INR',
    keyId: params.keyId ?? '',
    signatureHeader: params.signatureHeader ?? 'x-payment-signature',
    amountLabel: params.amountLabel ?? '',
    rupeeLabel: params.rupeeLabel ?? '',
  },
});

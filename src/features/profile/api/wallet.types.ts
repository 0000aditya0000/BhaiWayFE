/** Wallet V1 — all coin amounts are integer strings (1 Coin = ₹1). */

export type WalletPointSource = 'PURCHASED' | 'PROMOTIONAL' | 'DRIVER_EARNED' | string;

export type WalletTransactionDirection = 'CREDIT' | 'DEBIT' | string;

export type WalletTransactionStatus = 'POSTED' | 'PENDING' | 'FAILED' | string;

export type WalletDisplayCategory =
  | 'TOP_UP'
  | 'BOOKING'
  | 'EARNING'
  | 'REFUND'
  | 'DEPOSIT'
  | 'BONUS'
  | 'CANCELLATION'
  | 'COMPENSATION'
  | 'WITHDRAWAL'
  | 'PENALTY'
  | 'ADJUSTMENT'
  | 'OTHER'
  | string;

export type TopUpOrderStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | string;

export type PaymentOrderProvider = 'MOCK' | string;

export interface MockTopUpInstructionsDto {
  callbackPath: string;
  signatureHeader: string;
  note?: string;
}

export interface WalletBucketDto {
  availableCoins: string;
  heldCoins: string;
}

export interface WalletBucketsDto {
  purchased: WalletBucketDto;
  promotional: WalletBucketDto;
  driverEarned: WalletBucketDto;
}

/** GET /wallet */
export interface WalletBalanceDto {
  balanceCoins: string;
  availableCoins: string;
  heldCoins: string;
  withdrawableCoins: string;
  nonWithdrawableCoins: string;
  buckets: WalletBucketsDto;
}

export interface WalletTransactionDto {
  transactionId: string;
  transactionType: string;
  direction: WalletTransactionDirection;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  pointSource: WalletPointSource | null;
  status: WalletTransactionStatus;
  /** User-facing label from GET /wallet/transactions. */
  displayTitle?: string | null;
  /** Icon / color grouping from GET /wallet/transactions. */
  displayCategory?: WalletDisplayCategory | null;
  referenceType: string | null;
  referenceId: string | null;
  /**
   * GET /wallet/transactions — present only when resolvable from Booking/Ride.
   * BOOKING: resolved via referenceId → bookings.id → rides.id.
   * RIDE: referenceId is the ride id (or sent explicitly here).
   */
  rideId?: string | null;
  /** REGULAR | ASSURED | COMMUTE — paired with rideId; omitted when not resolvable. */
  rideType?: string | null;
  createdAt: string;
}

export interface ListWalletTransactionsQuery {
  page?: number;
  limit?: number;
  transactionType?: string;
  from?: string;
  to?: string;
}

export interface WalletTransactionsPageDto {
  items: WalletTransactionDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** POST /wallet/top-up request — body contains only amount.
 * Idempotency key must be sent as the Idempotency-Key HTTP header. */
export interface CreateTopUpDto {
  amount: string;
}

/** POST /wallet/top-up/verify request */
export interface VerifyTopUpDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** POST /wallet/top-up and GET /wallet/top-up/:orderId — backend TopUpOrderResponseDto */
export interface TopUpOrderResponseDto {
  paymentOrderId: string;
  amount: string;
  currency: string;
  status: TopUpOrderStatus;
  provider?: PaymentOrderProvider;
  gatewayOrderId: string;
  keyId?: string;
  paymentReference?: string | null;
  mockInstructions?: MockTopUpInstructionsDto;
  walletTransactionId?: string | null;
  callbackReference?: string | null;
}

/**
 * Normalized top-up order for app flows.
 * `orderId` mirrors `paymentOrderId` for route params and polling paths.
 */
export interface TopUpOrderDto {
  orderId: string;
  paymentOrderId: string;
  status: TopUpOrderStatus;
  amount: string;
  currency: string;
  gatewayOrderId: string;
  keyId?: string;
  provider?: PaymentOrderProvider;
  paymentReference?: string | null;
  mockInstructions?: MockTopUpInstructionsDto;
}

/** POST /wallet/top-up/callback (mock gateway) — TopUpCallbackDto */
export interface TopUpCallbackDto {
  gatewayOrderId: string;
  amount: string;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  reference?: string;
}

/** GET /wallet/top-up/:orderId — normalized status */
export interface TopUpOrderStatusDto {
  orderId: string;
  paymentOrderId: string;
  status: TopUpOrderStatus;
  amount: string;
  currency: string;
  gatewayOrderId: string;
}

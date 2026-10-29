/**
 * Centralized stale times for shared GET resource cache.
 * Adjust here — do not scatter TTL numbers in hooks.
 */
export const CACHE_STALE_TIMES = {
  /** GET /users/me */
  USER_PROFILE: 10 * 60_000,
  /** GET /vehicles */
  VEHICLES: 10 * 60_000,
  /** GET /verification/me */
  VERIFICATION: 10 * 60_000,
  /** GET /corporate-identity/status */
  CORPORATE_IDENTITY: 10 * 60_000,
  /** GET /safety/trusted-contacts */
  TRUSTED_CONTACTS: 10 * 60_000,
  /** GET /referrals/summary */
  REFERRALS_SUMMARY: 10 * 60_000,
  /** GET /wallet/payment-methods */
  PAYMENT_METHODS: 10 * 60_000,
  /** GET /wallet */
  WALLET: 60_000,
  /** GET /wallet/transactions */
  WALLET_TRANSACTIONS: 60_000,
  /** GET /wallet/withdrawals */
  WITHDRAWALS: 60_000,
  /** GET /referrals (list pages) */
  REFERRALS_LIST: 2 * 60_000,
  /** GET /notifications — short */
  NOTIFICATIONS: 30_000,
  /** GET /support/tickets — short */
  SUPPORT_TICKETS: 30_000,
  /** GET /support/eligible-rides — short */
  SUPPORT_ELIGIBLE_RIDES: 30_000,
  /** GET /rides/my — medium */
  RIDES_MY: 60_000,
  /** Intentionally tiny / unused for booking-sensitive reads */
  ALWAYS_FRESH: 0,
} as const;

export type CacheStaleTimeKey = keyof typeof CACHE_STALE_TIMES;

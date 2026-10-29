import { cacheKeys } from './cacheKeys';
import { resourceCache } from './resourceCache';

/** Profile / GET /users/me related. */
export const invalidateUserProfileCache = (): void => {
  resourceCache.invalidate(cacheKeys.user.me());
};

/** Wallet balance + transactions (financial mutations). */
export const invalidateWalletCache = (): void => {
  resourceCache.invalidate(['wallet']);
};

export const invalidateVehiclesCache = (): void => {
  resourceCache.invalidate(cacheKeys.vehicles.list());
  resourceCache.invalidate(['vehicles']);
};

export const invalidateVerificationCache = (): void => {
  resourceCache.invalidate(cacheKeys.verification.me());
};

export const invalidateCorporateIdentityCache = (): void => {
  resourceCache.invalidate(cacheKeys.corporateIdentity.status());
};

export const invalidateTrustedContactsCache = (): void => {
  resourceCache.invalidate(['safety', 'trusted-contacts']);
};

export const invalidateReferralsCache = (): void => {
  resourceCache.invalidate(['referrals']);
};

export const invalidatePaymentMethodsCache = (): void => {
  resourceCache.invalidate(cacheKeys.paymentMethods.list());
  resourceCache.invalidate(['wallet', 'payment-methods']);
};

export const invalidateWithdrawalsCache = (): void => {
  resourceCache.invalidate(['wallet', 'withdrawals']);
};

export const invalidateRidesMyCache = (): void => {
  resourceCache.invalidate(cacheKeys.rides.my());
};

/** Aadhaar completion: verification + profile + wallet reward. */
export const invalidateAfterAadhaarVerification = (): void => {
  invalidateVerificationCache();
  invalidateUserProfileCache();
  invalidateWalletCache();
};

/** Vehicle RC verify: vehicles + verification. */
export const invalidateAfterVehicleRc = (): void => {
  invalidateVehiclesCache();
  invalidateVerificationCache();
};

import { cacheKeys } from './cacheKeys';
import { resourceCache } from './resourceCache';

/** Profile / GET /users/me related. */
export const invalidateUserProfileCache = (): void => {
  resourceCache.invalidate(cacheKeys.user.me());
  resourceCache.invalidate(cacheKeys.emailVerification.status());
};

/** Wallet balance + transactions (financial mutations). */
export const invalidateWalletCache = (): void => {
  resourceCache.invalidate(['wallet']);
};

export const invalidateVehiclesCache = (): void => {
  resourceCache.invalidate(cacheKeys.vehicles.list());
  resourceCache.invalidate(['vehicles']);
};

/** Merge a created/updated vehicle into GET /vehicles cache without dropping other rows. */
export const mergeVehicleIntoListCache = <T extends { id: string }>(vehicle: T): void => {
  const id = vehicle?.id?.trim();
  if (!id) {
    return;
  }
  const current = resourceCache.peek<T[]>(cacheKeys.vehicles.list());
  if (!current) {
    return;
  }
  const index = current.findIndex((row) => row.id === id);
  const next =
    index >= 0
      ? current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...vehicle } : row))
      : [...current, vehicle];
  resourceCache.setData(cacheKeys.vehicles.list(), next);
};

export const patchVehicleInListCache = <T extends { id: string }>(
  vehicleId: string,
  patch: Partial<T>,
): void => {
  const id = vehicleId.trim();
  if (!id) {
    return;
  }
  const current = resourceCache.peek<T[]>(cacheKeys.vehicles.list());
  if (!current) {
    return;
  }
  resourceCache.setData(
    cacheKeys.vehicles.list(),
    current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
  );
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

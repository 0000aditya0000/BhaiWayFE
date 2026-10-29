import type {
  MyVerificationsResponse,
  VerificationStatus,
} from '../api/verification.types';

type Listener = (state: MyVerificationsResponse | null) => void;

let verifications: MyVerificationsResponse | null = null;
const listeners = new Set<Listener>();

const notify = (): void => {
  const snapshot = verifications ? { ...verifications } : null;
  listeners.forEach((listener) => listener(snapshot));
};

export const verificationStore = {
  get: (): MyVerificationsResponse | null =>
    verifications ? { ...verifications } : null,

  getIdentityStatus: (): VerificationStatus | null => verifications?.identity.status ?? null,

  isIdentityVerified: (): boolean => verifications?.identity.status === 'VERIFIED',

  isVehicleVerified: (): boolean => verifications?.vehicle.status === 'VERIFIED',

  /** Driving license is optional for publishing — helper for display only. */
  isDrivingLicenseVerified: (): boolean =>
    verifications?.drivingLicense.status === 'VERIFIED',

  set: (next: MyVerificationsResponse): void => {
    verifications = { ...next };
    notify();
  },

  clear: (): void => {
    verifications = null;
    notify();
  },

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    listener(verifications ? { ...verifications } : null);
    return () => {
      listeners.delete(listener);
    };
  },
};

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  getAadhaarVerificationStatus,
  refreshAadhaarVerification,
  startAadhaarVerification,
} from '@/api/kyc.api';
import { authService } from '@/features/auth/services';
import { getMyVerifications } from '@/features/profile/api/verification.api';
import { verificationStore } from '@/features/profile/store/verificationStore';
import {
  AadhaarVerificationController,
  CASHFREE_DIGILOCKER_DEFAULT_REDIRECT_URL,
  type DigiLockerSdkPort,
} from '@/services/digilocker';
import type {
  AadhaarVerificationState,
  VerificationStatus,
} from '@/types/kyc';

export interface UseAadhaarVerificationOptions {
  sdk?: DigiLockerSdkPort;
  onVerified?: (data: { verifiedName?: string; verifiedGender?: string | null }) => void;
  redirectUrl?: string;
  pollingDelaysMs?: readonly number[];
}

export interface UseAadhaarVerificationResult {
  status: VerificationStatus;
  isStarting: boolean;
  isRefreshing: boolean;
  isPolling: boolean;
  verifiedName: string | null;
  verifiedGender: string | null;
  verificationId: string | null;
  error: string | null;
  userMessage: string | null;
  startVerification: () => Promise<void>;
  checkStatus: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  resetError: () => void;
}

/**
 * Safely resolves useDigiLocker from @cashfreepayments/react-native-digilocker.
 * Provides fallback in headless/test environments where native context is mocked.
 */
const resolveDigiLockerHook = (): (() => DigiLockerSdkPort) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('@cashfreepayments/react-native-digilocker');
    if (typeof pkg?.useDigiLocker === 'function') {
      return pkg.useDigiLocker;
    }
  } catch {
    // Non-native / headless environment fallback
  }
  return () => ({
    verify: () => {
      console.warn(
        '[useAadhaarVerification] Cashfree DigiLocker SDK is not available in the current environment.',
      );
    },
  });
};

const nativeUseDigiLocker = resolveDigiLockerHook();

export const useAadhaarVerification = (
  options?: UseAadhaarVerificationOptions,
): UseAadhaarVerificationResult => {
  const sdkFromHook = nativeUseDigiLocker();
  const sdk = options?.sdk ?? sdkFromHook;
  const redirectUrl = options?.redirectUrl ?? CASHFREE_DIGILOCKER_DEFAULT_REDIRECT_URL;

  const initialStatus: VerificationStatus = verificationStore.isIdentityVerified()
    ? 'VERIFIED'
    : 'NOT_VERIFIED';

  const [state, setState] = useState<AadhaarVerificationState>({
    status: initialStatus,
    verificationId: null,
    verifiedName: null,
    verifiedGender: null,
    verifiedAt: null,
    isStarting: false,
    isRefreshing: false,
    error: null,
    userMessage: null,
  });

  const syncProfile = useCallback(async (): Promise<void> => {
    try {
      const { invalidateAfterAadhaarVerification } = await import('@/network/resourceCache');
      invalidateAfterAadhaarVerification();
      await authService.hydrateAuthenticatedUser({ force: true }).catch(() => undefined);
      const rows = await getMyVerifications().catch(() => null);
      if (rows) {
        verificationStore.set(rows);
      }
    } catch {
      // Background sync errors are non-fatal
    }
  }, []);

  const controllerRef = useRef<AadhaarVerificationController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new AadhaarVerificationController({
      api: {
        start: startAadhaarVerification,
        getStatus: getAadhaarVerificationStatus,
        refresh: refreshAadhaarVerification,
      },
      sdk,
      initialStatus,
      syncProfile,
      redirectUrl,
      pollingDelaysMs: options?.pollingDelaysMs,
      onVerified: options?.onVerified,
      onStateChange: (nextState) => {
        setState(nextState);
      },
    });
  }

  // Handle AppState changes (e.g. app resumes after user returns from DigiLocker / browser)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void controllerRef.current?.onAppResume();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
    };
  }, []);

  const startVerification = useCallback(async () => {
    await controllerRef.current?.startVerification();
  }, []);

  const refreshStatus = useCallback(async () => {
    await controllerRef.current?.refreshStatus();
  }, []);

  const checkStatus = useCallback(async () => {
    await controllerRef.current?.checkStatus();
  }, []);

  const resetError = useCallback(() => {
    controllerRef.current?.resetError();
  }, []);

  return {
    status: state.status,
    isStarting: state.isStarting,
    isRefreshing: state.isRefreshing,
    isPolling: state.status === 'VERIFICATION_IN_PROGRESS' && !state.isStarting && !state.isRefreshing,
    verifiedName: state.verifiedName,
    verifiedGender: state.verifiedGender,
    verificationId: state.verificationId,
    error: state.error,
    userMessage: state.userMessage,
    startVerification,
    checkStatus,
    refreshStatus,
    resetError,
  };
};

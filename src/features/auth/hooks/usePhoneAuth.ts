import { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';

import { useRouter } from 'expo-router';

import { APP_CONFIG, ROUTES } from '@/config';
import { applySheetProfileToSession, hydrateSessionFromSheet } from '@/DemoData';
import { getErrorMessage, showAppAlert, triggerSuccessHaptic } from '@/shared/utils';
import { AUTH_CONSTANTS } from '../constants';
import { authService } from '../services';
import type { AuthFlow } from '../types';
import { getPostAuthRoute } from '../utils';

export interface UsePhoneAuthResult {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  isValid: boolean;
  loading: boolean;
  submit: () => Promise<void>;
}

const applySessionAndNavigate = async (
  router: ReturnType<typeof useRouter>,
  phoneNumber: string,
  verificationId: string,
  code = '',
): Promise<void> => {
  const session = await authService.verifyOtp({ verificationId, code, phoneNumber });
  triggerSuccessHaptic();
  await authService.establishAuthSession(session, phoneNumber, {
    hydrateFromSheet: async () => {
      await hydrateSessionFromSheet();
      applySheetProfileToSession();
    },
  });

  if (getPostAuthRoute(Boolean(session.profileCompleted)) === 'home') {
    router.replace(ROUTES.home);
    return;
  }
  router.push(ROUTES.completeProfile);
};

export const usePhoneAuth = (flow: AuthFlow): UsePhoneAuthResult => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = phoneNumber.length === AUTH_CONSTANTS.phoneLength;

  const submit = useCallback(async () => {
    if (!isValid || loading) {
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      const result = await authService.requestOtp({
        phoneNumber,
        dialCode: APP_CONFIG.defaultDialCode,
      });

      // Invisible / already-verified path — skip OTP entry screen.
      if (result.verificationId.startsWith('verified:')) {
        await applySessionAndNavigate(router, phoneNumber, result.verificationId);
        return;
      }

      router.push({
        pathname: ROUTES.otp,
        params: { phone: phoneNumber, flow, verificationId: result.verificationId },
      });
    } catch (error) {
      showAppAlert('Unable to continue', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [flow, isValid, loading, phoneNumber, router]);

  return { phoneNumber, setPhoneNumber, isValid, loading, submit };
};

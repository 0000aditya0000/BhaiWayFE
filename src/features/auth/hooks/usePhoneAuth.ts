import { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';

import { useRouter } from 'expo-router';

import { APP_CONFIG, ROUTES } from '@/config';
import { applySheetProfileToSession, hydrateSessionFromSheet } from '@/DemoData';
import { REFERRAL_CODE_FIELD } from '@/features/profile/constants/refer-earn.constants';
import {
  isPlausibleReferralCode,
  normalizeOptionalReferralCode,
} from '@/features/profile/utils/referrals.mapper';
import { getErrorMessage, showAppAlert, triggerSuccessHaptic } from '@/shared/utils';
import { AUTH_CONSTANTS } from '../constants';
import { authService } from '../services';
import type { AuthFlow } from '../types';
import { getPostAuthRoute } from '../utils';

export interface UsePhoneAuthResult {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  referralCode: string;
  setReferralCode: (value: string) => void;
  showReferralField: boolean;
  referralFieldLabel: string;
  referralFieldPlaceholder: string;
  referralFieldHint: string;
  isValid: boolean;
  loading: boolean;
  submit: () => Promise<void>;
}

const applySessionAndNavigate = async (
  router: ReturnType<typeof useRouter>,
  phoneNumber: string,
  verificationId: string,
  code = '',
  referralCode?: string,
): Promise<void> => {
  const session = await authService.verifyOtp({
    verificationId,
    code,
    phoneNumber,
    referralCode,
  });
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
  const [referralCode, setReferralCodeState] = useState('');
  const [loading, setLoading] = useState(false);
  const showReferralField = flow === 'signup';

  const isValid = phoneNumber.length === AUTH_CONSTANTS.phoneLength;

  const setReferralCode = useCallback((value: string) => {
    setReferralCodeState(value.toUpperCase());
  }, []);

  const submit = useCallback(async () => {
    if (!isValid || loading) {
      return;
    }

    const normalizedReferral = showReferralField
      ? normalizeOptionalReferralCode(referralCode)
      : undefined;

    if (normalizedReferral && !isPlausibleReferralCode(normalizedReferral)) {
      showAppAlert('Referral code', REFERRAL_CODE_FIELD.invalid);
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
        await applySessionAndNavigate(
          router,
          phoneNumber,
          result.verificationId,
          '',
          normalizedReferral,
        );
        return;
      }

      router.push({
        pathname: ROUTES.otp,
        params: {
          phone: phoneNumber,
          flow,
          verificationId: result.verificationId,
          referralCode: normalizedReferral ?? '',
        },
      });
    } catch (error) {
      showAppAlert('Unable to continue', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [flow, isValid, loading, phoneNumber, referralCode, router, showReferralField]);

  return {
    phoneNumber,
    setPhoneNumber,
    referralCode,
    setReferralCode,
    showReferralField,
    referralFieldLabel: REFERRAL_CODE_FIELD.label,
    referralFieldPlaceholder: REFERRAL_CODE_FIELD.placeholder,
    referralFieldHint: REFERRAL_CODE_FIELD.hint,
    isValid,
    loading,
    submit,
  };
};

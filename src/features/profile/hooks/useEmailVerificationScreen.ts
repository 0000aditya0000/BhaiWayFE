import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useFocusEffect, useLocalSearchParams, usePathname, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { EMAIL_VERIFICATION_SCREEN } from '@/features/profile/constants/email-verification.constants';
import {
  EMAIL_OTP_LENGTH,
  isValidEmailOtp,
  normalizeEmailOtp,
} from '@/features/profile/utils/emailVerification.mapper';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { showAppAlert } from '@/store';

export interface UseEmailVerificationScreenResult {
  title: string;
  description: string;
  email: string | null;
  otp: string;
  setOtp: (value: string) => void;
  error: string | null;
  isSending: boolean;
  isVerifying: boolean;
  isLoading: boolean;
  verified: boolean;
  canVerify: boolean;
  canResend: boolean;
  resendLabel: string;
  verifyLabel: string;
  goBack: () => void;
  verify: () => void;
  resend: () => void;
}

export const useEmailVerificationScreen = (): UseEmailVerificationScreenResult => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ context?: string | string[] }>();
  const contextParam = Array.isArray(params.context) ? params.context[0] : params.context;
  const isCorporate = contextParam === 'corporate';
  const isAuthFlow = pathname.includes('/login');

  const {
    sendOtp,
    verifyOtp,
    refreshStatus,
    isSending,
    isVerifying,
    isLoading,
    error,
    cooldownSeconds,
    email,
    verified,
    clearError,
  } = useEmailVerification();

  const [otp, setOtpState] = useState('');
  const initialSendDoneRef = useRef(false);

  const setOtp = useCallback(
    (value: string) => {
      clearError();
      setOtpState(normalizeEmailOtp(value));
    },
    [clearError],
  );

  useFocusEffect(
    useCallback(() => {
      void refreshStatus();
    }, [refreshStatus]),
  );

  useEffect(() => {
    if (initialSendDoneRef.current || isLoading) {
      return;
    }
    if (verified) {
      initialSendDoneRef.current = true;
      return;
    }
    if (!email) {
      return;
    }
    initialSendDoneRef.current = true;
    void sendOtp(email);
  }, [email, isLoading, sendOtp, verified]);

  const successRoute = useMemo(() => {
    if (isCorporate) {
      return isAuthFlow ? ROUTES.authIdentityVerification : ROUTES.identityVerification;
    }
    return isAuthFlow ? ROUTES.completeProfile : ROUTES.profile;
  }, [isAuthFlow, isCorporate]);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(successRoute);
  }, [router, successRoute]);

  const verify = useCallback(() => {
    if (!isValidEmailOtp(otp) || isVerifying || isSending) {
      return;
    }
    Keyboard.dismiss();
    triggerLightHaptic();

    void (async () => {
      const ok = await verifyOtp(otp);
      // Clear OTP from memory after attempt — never persist.
      setOtpState('');
      if (!ok) {
        return;
      }
      triggerSuccessHaptic();
      showAppAlert(
        isCorporate
          ? EMAIL_VERIFICATION_SCREEN.corporateSuccessTitle
          : EMAIL_VERIFICATION_SCREEN.successTitle,
        isCorporate
          ? EMAIL_VERIFICATION_SCREEN.corporateSuccessMessage
          : EMAIL_VERIFICATION_SCREEN.successMessage,
      );
      router.replace(successRoute);
    })();
  }, [isCorporate, isSending, isVerifying, otp, router, successRoute, verifyOtp]);

  const resend = useCallback(() => {
    if (cooldownSeconds > 0 || isSending || isVerifying) {
      return;
    }
    if (!email) {
      showAppAlert(
        EMAIL_VERIFICATION_SCREEN.missingEmailTitle,
        EMAIL_VERIFICATION_SCREEN.missingEmailMessage,
      );
      return;
    }
    triggerLightHaptic();
    setOtpState('');
    clearError();
    void sendOtp(email);
  }, [clearError, cooldownSeconds, email, isSending, isVerifying, sendOtp]);

  const description = email
    ? EMAIL_VERIFICATION_SCREEN.description(email)
    : EMAIL_VERIFICATION_SCREEN.descriptionPending;

  return {
    title: isCorporate
      ? EMAIL_VERIFICATION_SCREEN.corporateTitle
      : EMAIL_VERIFICATION_SCREEN.title,
    description,
    email,
    otp,
    setOtp,
    error,
    isSending,
    isVerifying,
    isLoading,
    verified,
    canVerify: isValidEmailOtp(otp) && !isVerifying && !isSending,
    canResend: cooldownSeconds <= 0 && !isSending && !isVerifying && Boolean(email),
    resendLabel:
      cooldownSeconds > 0
        ? EMAIL_VERIFICATION_SCREEN.resendCountdown(cooldownSeconds)
        : EMAIL_VERIFICATION_SCREEN.resendLabel,
    verifyLabel: isVerifying
      ? EMAIL_VERIFICATION_SCREEN.verifyingLabel
      : EMAIL_VERIFICATION_SCREEN.verifyLabel,
    goBack,
    verify,
    resend,
  };
};

export { EMAIL_OTP_LENGTH };

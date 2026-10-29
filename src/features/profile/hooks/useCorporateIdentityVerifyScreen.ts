import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { useCorporateIdentity } from '@/hooks/useCorporateIdentity';
import { triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { showAppAlert } from '@/store';
import { CORPORATE_IDENTITY_VERIFY_SCREEN } from '../constants/corporate-identity.constants';
import {
  CORPORATE_OTP_LENGTH,
  isValidCorporateEmailSyntax,
  isValidCorporateOtp,
  normalizeCorporateEmail,
  normalizeCorporateOtp,
} from '../utils/corporateIdentity.mapper';

export type CorporateIdentityVerifyStep = 'email' | 'otp';

export interface UseCorporateIdentityVerifyScreenResult {
  step: CorporateIdentityVerifyStep;
  title: string;
  subtitle: string;
  email: string;
  setEmail: (value: string) => void;
  otp: string;
  setOtp: (value: string) => void;
  error: string | null;
  isSending: boolean;
  isVerifying: boolean;
  canContinue: boolean;
  canVerify: boolean;
  canResend: boolean;
  resendLabel: string;
  continueLabel: string;
  verifyLabel: string;
  goBack: () => void;
  continueWithEmail: () => void;
  verify: () => void;
  resend: () => void;
  changeEmail: () => void;
}

export const useCorporateIdentityVerifyScreen = (): UseCorporateIdentityVerifyScreenResult => {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthFlow = pathname.includes('/login');
  const params = useLocalSearchParams<{
    step?: string | string[];
    email?: string | string[];
  }>();

  const paramStep = Array.isArray(params.step) ? params.step[0] : params.step;
  const paramEmail = Array.isArray(params.email) ? params.email[0] : params.email;

  const {
    isSending,
    isVerifying,
    error,
    cooldownSeconds,
    fetchStatus,
    sendOtp,
    verifyOtp,
    clearError,
    resetTransient,
  } = useCorporateIdentity();

  const [step, setStep] = useState<CorporateIdentityVerifyStep>(
    paramStep === 'otp' ? 'otp' : 'email',
  );
  const [email, setEmailState] = useState(() =>
    normalizeCorporateEmail(paramEmail || ''),
  );
  const [otp, setOtpState] = useState('');
  const emailRef = useRef(email);
  emailRef.current = email;

  // Fetch once on focus only — never depend on typed email (that caused request storms).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void fetchStatus({ silent: true }).then((status) => {
        if (!active || !status) {
          return;
        }
        if (status.email && !emailRef.current.trim()) {
          setEmailState(normalizeCorporateEmail(status.email));
        }
        if (status.status === 'OTP_PENDING' && paramStep !== 'email') {
          setStep('otp');
        }
      });
      return () => {
        active = false;
      };
    }, [fetchStatus, paramStep]),
  );

  useEffect(() => () => resetTransient(), [resetTransient]);

  const setEmail = useCallback(
    (value: string) => {
      clearError();
      setEmailState(value);
    },
    [clearError],
  );

  const setOtp = useCallback(
    (value: string) => {
      clearError();
      setOtpState(normalizeCorporateOtp(value));
    },
    [clearError],
  );

  const successRoute = useMemo(
    () => (isAuthFlow ? ROUTES.authCorporateIdentity : ROUTES.corporateIdentity),
    [isAuthFlow],
  );

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (step === 'otp') {
      setOtpState('');
      setStep('email');
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(successRoute);
  }, [router, step, successRoute]);

  const continueWithEmail = useCallback(() => {
    if (isSending || isVerifying) {
      return;
    }
    const target = normalizeCorporateEmail(email);
    if (!isValidCorporateEmailSyntax(target)) {
      return;
    }
    Keyboard.dismiss();
    triggerLightHaptic();

    void (async () => {
      const result = await sendOtp(target);
      if (result === 'failed') {
        return;
      }
      if (result === 'already_verified') {
        triggerSuccessHaptic();
        showAppAlert(
          CORPORATE_IDENTITY_VERIFY_SCREEN.successTitle,
          CORPORATE_IDENTITY_VERIFY_SCREEN.successMessage,
        );
        router.replace(successRoute);
        return;
      }
      setOtpState('');
      setStep('otp');
    })();
  }, [email, isSending, isVerifying, router, sendOtp, successRoute]);

  const verify = useCallback(() => {
    if (!isValidCorporateOtp(otp) || isVerifying || isSending) {
      return;
    }
    Keyboard.dismiss();
    triggerLightHaptic();

    void (async () => {
      const ok = await verifyOtp(email, otp);
      // Clear OTP from memory after attempt — never persist.
      setOtpState('');
      if (!ok) {
        return;
      }
      triggerSuccessHaptic();
      showAppAlert(
        CORPORATE_IDENTITY_VERIFY_SCREEN.successTitle,
        CORPORATE_IDENTITY_VERIFY_SCREEN.successMessage,
      );
      router.replace(successRoute);
    })();
  }, [email, isSending, isVerifying, otp, router, successRoute, verifyOtp]);

  const resend = useCallback(() => {
    if (cooldownSeconds > 0 || isSending || isVerifying) {
      return;
    }
    triggerLightHaptic();
    setOtpState('');
    clearError();
    void sendOtp(email);
  }, [clearError, cooldownSeconds, email, isSending, isVerifying, sendOtp]);

  const changeEmail = useCallback(() => {
    triggerLightHaptic();
    setOtpState('');
    clearError();
    setStep('email');
  }, [clearError]);

  const title =
    step === 'otp'
      ? CORPORATE_IDENTITY_VERIFY_SCREEN.otpTitle
      : CORPORATE_IDENTITY_VERIFY_SCREEN.emailTitle;

  const subtitle =
    step === 'otp'
      ? CORPORATE_IDENTITY_VERIFY_SCREEN.otpDescription(email)
      : CORPORATE_IDENTITY_VERIFY_SCREEN.emailSubtitle;

  return {
    step,
    title,
    subtitle,
    email,
    setEmail,
    otp,
    setOtp,
    error,
    isSending,
    isVerifying,
    canContinue: isValidCorporateEmailSyntax(email) && !isSending && !isVerifying,
    canVerify: isValidCorporateOtp(otp) && !isVerifying && !isSending,
    canResend: cooldownSeconds <= 0 && !isSending && !isVerifying && Boolean(email),
    resendLabel:
      cooldownSeconds > 0
        ? CORPORATE_IDENTITY_VERIFY_SCREEN.resendCountdown(cooldownSeconds)
        : CORPORATE_IDENTITY_VERIFY_SCREEN.resendLabel,
    continueLabel: isSending
      ? CORPORATE_IDENTITY_VERIFY_SCREEN.sendingLabel
      : CORPORATE_IDENTITY_VERIFY_SCREEN.continueLabel,
    verifyLabel: isVerifying
      ? CORPORATE_IDENTITY_VERIFY_SCREEN.verifyingLabel
      : CORPORATE_IDENTITY_VERIFY_SCREEN.verifyLabel,
    goBack,
    continueWithEmail,
    verify,
    resend,
    changeEmail,
  };
};

export { CORPORATE_OTP_LENGTH };

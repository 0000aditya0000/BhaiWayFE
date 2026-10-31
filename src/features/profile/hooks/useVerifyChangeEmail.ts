import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { authService } from '@/features/auth/services';
import { cacheKeys, invalidateUserProfileCache, resourceCache } from '@/network/resourceCache';
import { triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { authSession, showAppAlert } from '@/store';
import { requestEmailChangeOtp, verifyEmailChangeOtp } from '../api/emailChange.api';
import { CHANGE_EMAIL_VERIFY_SCREEN } from '../constants/change-email.constants';
import {
  EMAIL_CHANGE_COOLDOWN_SECONDS,
  EMAIL_CHANGE_OTP_LENGTH,
  isValidChangeEmailOtp,
  maskEmail,
  normalizeChangeEmailOtp,
  normalizeNewEmail,
  parseEmailChangeError,
} from '../utils/emailChange.mapper';

export interface UseVerifyChangeEmailResult {
  email: string;
  maskedEmail: string;
  otp: string;
  setOtp: (val: string) => void;
  error: string | null;
  isVerifying: boolean;
  isResending: boolean;
  cooldownSeconds: number;
  rateLimited: boolean;
  attemptsExceeded: boolean;
  canVerify: boolean;
  canResend: boolean;
  verifyLabel: string;
  resendLabel: string;
  clearError: () => void;
  goBack: () => void;
  handleChangeEmail: () => void;
  verifyOtp: () => Promise<void>;
  resendOtp: () => Promise<void>;
}

export const useVerifyChangeEmail = (): UseVerifyChangeEmailResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const rawEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const email = normalizeNewEmail(rawEmail || '');

  const [otp, setOtpState] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(EMAIL_CHANGE_COOLDOWN_SECONDS);
  const [rateLimited, setRateLimited] = useState(false);
  const [attemptsExceeded, setAttemptsExceeded] = useState(false);

  const verifyInFlightRef = useRef(false);
  const resendInFlightRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCooldownTimer = useCallback(() => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }, []);

  const startCooldown = useCallback(
    (seconds: number = EMAIL_CHANGE_COOLDOWN_SECONDS) => {
      clearCooldownTimer();
      setCooldownSeconds(seconds);
      cooldownTimerRef.current = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearCooldownTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearCooldownTimer],
  );

  // Initial cooldown countdown starts when screen mounts (since OTP was just requested in Step B)
  useEffect(() => {
    startCooldown(EMAIL_CHANGE_COOLDOWN_SECONDS);
    return () => clearCooldownTimer();
  }, [clearCooldownTimer, startCooldown]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setOtp = useCallback(
    (value: string) => {
      clearError();
      setOtpState(normalizeChangeEmailOtp(value));
    },
    [clearError],
  );

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.profile);
    }
  }, [router]);

  const handleChangeEmail = useCallback(() => {
    triggerLightHaptic();
    router.replace(ROUTES.changeEmail);
  }, [router]);

  const resendOtp = useCallback(async () => {
    if (
      resendInFlightRef.current ||
      verifyInFlightRef.current ||
      cooldownSeconds > 0 ||
      rateLimited ||
      !email
    ) {
      return;
    }

    triggerLightHaptic();
    resendInFlightRef.current = true;
    setIsResending(true);
    clearError();

    try {
      await requestEmailChangeOtp(email);
      // Reset OTP input after a successful resend as required
      setOtpState('');
      setAttemptsExceeded(false);
      startCooldown(EMAIL_CHANGE_COOLDOWN_SECONDS);
    } catch (err) {
      const parsed = parseEmailChangeError(err);
      setError(parsed.message);

      if (parsed.cooldownSeconds && parsed.cooldownSeconds > 0) {
        startCooldown(parsed.cooldownSeconds);
      }
      if (parsed.rateLimited) {
        setRateLimited(true);
      }
      if (parsed.sessionMismatch) {
        showAppAlert(
          CHANGE_EMAIL_VERIFY_SCREEN.sessionExpiredTitle,
          parsed.message,
        );
      }
    } finally {
      resendInFlightRef.current = false;
      setIsResending(false);
    }
  }, [clearError, cooldownSeconds, email, rateLimited, startCooldown]);

  const verifyOtp = useCallback(async () => {
    if (
      verifyInFlightRef.current ||
      isVerifying ||
      attemptsExceeded ||
      !isValidChangeEmailOtp(otp) ||
      !email
    ) {
      return;
    }

    Keyboard.dismiss();
    triggerLightHaptic();
    verifyInFlightRef.current = true;
    setIsVerifying(true);
    clearError();

    try {
      const response = await verifyEmailChangeOtp({
        newEmail: email,
        otp,
      });

      const updatedEmail = response.user?.email?.trim() || email;
      const isVerified = Boolean(response.user?.emailVerified ?? true);

      // Clear OTP from memory immediately
      setOtpState('');

      // Update shared user/profile state in authSession
      const current = authSession.getUser();
      if (current) {
        authSession.applyServerUser(
          {
            ...current,
            email: updatedEmail,
          },
          authSession.getProfileCompleted(),
        );
      }

      // Immediately set the fresh email status into in-memory resource cache
      resourceCache.setData(cacheKeys.emailVerification.status(), {
        email: updatedEmail,
        verified: isVerified,
      });

      // Patch cached GET /users/me in resourceCache if present
      const cachedMe = resourceCache.peek<{ user?: { email?: string | null; emailVerified?: boolean } }>(
        cacheKeys.user.me(),
      );
      if (cachedMe?.user) {
        resourceCache.setData(cacheKeys.user.me(), {
          ...cachedMe,
          user: {
            ...cachedMe.user,
            email: updatedEmail,
            emailVerified: isVerified,
          },
        });
      }

      // Invalidate profile cache and trigger backend rehydration
      invalidateUserProfileCache();
      await authService.hydrateAuthenticatedUser({ force: true }).catch(() => undefined);

      triggerSuccessHaptic();
      showAppAlert(
        CHANGE_EMAIL_VERIFY_SCREEN.successTitle,
        response.message || CHANGE_EMAIL_VERIFY_SCREEN.successMessage,
      );

      // Navigate back to Profile
      router.replace(ROUTES.profile);
    } catch (err) {
      const parsed = parseEmailChangeError(err);
      setError(parsed.message);

      if (parsed.attemptsExceeded) {
        setAttemptsExceeded(true);
        showAppAlert(
          CHANGE_EMAIL_VERIFY_SCREEN.attemptsExceededTitle,
          parsed.message,
        );
      } else if (parsed.sessionMismatch) {
        showAppAlert(
          CHANGE_EMAIL_VERIFY_SCREEN.sessionExpiredTitle,
          parsed.message,
        );
      }
    } finally {
      verifyInFlightRef.current = false;
      setIsVerifying(false);
    }
  }, [attemptsExceeded, clearError, email, isVerifying, otp, router]);

  const canVerify =
    isValidChangeEmailOtp(otp) &&
    !isVerifying &&
    !isResending &&
    !attemptsExceeded &&
    Boolean(email);

  const canResend =
    cooldownSeconds <= 0 &&
    !isResending &&
    !isVerifying &&
    !rateLimited &&
    Boolean(email);

  const verifyLabel = isVerifying
    ? CHANGE_EMAIL_VERIFY_SCREEN.verifyingButtonLabel
    : CHANGE_EMAIL_VERIFY_SCREEN.verifyButtonLabel;

  const resendLabel = isResending
    ? CHANGE_EMAIL_VERIFY_SCREEN.resendingLabel
    : cooldownSeconds > 0
      ? CHANGE_EMAIL_VERIFY_SCREEN.resendCountdown(cooldownSeconds)
      : CHANGE_EMAIL_VERIFY_SCREEN.resendLabel;

  const maskedEmail = maskEmail(email);

  return {
    email,
    maskedEmail,
    otp,
    setOtp,
    error,
    isVerifying,
    isResending,
    cooldownSeconds,
    rateLimited,
    attemptsExceeded,
    canVerify,
    canResend,
    verifyLabel,
    resendLabel,
    clearError,
    goBack,
    handleChangeEmail,
    verifyOtp,
    resendOtp,
  };
};

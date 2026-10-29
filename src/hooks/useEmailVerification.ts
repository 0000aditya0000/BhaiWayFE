import { useCallback, useEffect, useRef, useState } from 'react';

import { authService } from '@/features/auth/services';
import {
  getEmailVerificationStatus,
  sendEmailVerification,
  verifyEmail,
} from '@/features/profile/api/emailVerification.api';
import {
  EMAIL_OTP_LENGTH,
  EMAIL_RESEND_COOLDOWN_SECONDS,
  EMAIL_VERIFICATION_ERROR_MESSAGES,
  isValidEmailOtp,
  mapEmailVerificationError,
  normalizeEmailOtp,
} from '@/features/profile/utils/emailVerification.mapper';
import { useSessionUser } from '@/shared/hooks';
import { authSession } from '@/store';

export interface UseEmailVerificationResult {
  sendOtp: (emailOverride?: string) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  isSending: boolean;
  isVerifying: boolean;
  isLoading: boolean;
  error: string | null;
  cooldownSeconds: number;
  email: string | null;
  verified: boolean;
  clearError: () => void;
  setLocalEmail: (email: string | null) => void;
}

/**
 * Email verification via BhaiWay backend only.
 * OTP exists in caller React state — never persisted by this hook.
 */
export const useEmailVerification = (): UseEmailVerificationResult => {
  const sessionUser = useSessionUser();
  const [email, setEmail] = useState<string | null>(
    () => sessionUser?.email?.trim() || null,
  );
  const [verified, setVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const sendInFlightRef = useRef(false);
  const verifyInFlightRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCooldownTimer = useCallback(() => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }, []);

  const startCooldown = useCallback(
    (seconds: number = EMAIL_RESEND_COOLDOWN_SECONDS) => {
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

  useEffect(() => () => clearCooldownTimer(), [clearCooldownTimer]);

  useEffect(() => {
    const next = sessionUser?.email?.trim() || null;
    if (next) {
      setEmail(next);
    }
  }, [sessionUser?.email]);

  const refreshStatus = useCallback(async () => {
    if (!authSession.getToken()) {
      setVerified(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const status = await getEmailVerificationStatus();
      setEmail(status.email?.trim() || email);
      setVerified(Boolean(status.verified));
      setError(null);
    } catch (err) {
      // Fall back to /users/me emailVerified when status endpoint fails.
      try {
        const me = await authService.getMe();
        setEmail(me.user.email?.trim() || email);
        setVerified(Boolean(me.user.emailVerified));
      } catch {
        setError(mapEmailVerificationError(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  const sendOtp = useCallback(
    async (emailOverride?: string): Promise<boolean> => {
      if (sendInFlightRef.current || cooldownSeconds > 0) {
        return false;
      }

      const target = (emailOverride ?? email ?? '').trim();
      if (!target) {
        setError('Add an email to your profile before verifying.');
        return false;
      }

      sendInFlightRef.current = true;
      setIsSending(true);
      setError(null);

      try {
        await sendEmailVerification(target);
        setEmail(target);
        startCooldown(EMAIL_RESEND_COOLDOWN_SECONDS);
        return true;
      } catch (err) {
        const message = mapEmailVerificationError(err);
        setError(message);
        if (message === EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_COOLDOWN) {
          startCooldown(EMAIL_RESEND_COOLDOWN_SECONDS);
        }
        return false;
      } finally {
        sendInFlightRef.current = false;
        setIsSending(false);
      }
    },
    [cooldownSeconds, email, startCooldown],
  );

  const verifyOtp = useCallback(async (otp: string): Promise<boolean> => {
    if (verifyInFlightRef.current) {
      return false;
    }

    const normalized = normalizeEmailOtp(otp);
    if (!isValidEmailOtp(normalized)) {
      setError(`Enter the ${EMAIL_OTP_LENGTH}-digit verification code.`);
      return false;
    }

    verifyInFlightRef.current = true;
    setIsVerifying(true);
    setError(null);

    try {
      await verifyEmail(normalized);
      setVerified(true);
      await authService.hydrateAuthenticatedUser().catch(() => undefined);
      await getEmailVerificationStatus()
        .then((status) => {
          setEmail(status.email?.trim() || email);
          setVerified(Boolean(status.verified));
        })
        .catch(() => undefined);
      return true;
    } catch (err) {
      setError(mapEmailVerificationError(err));
      setVerified(false);
      return false;
    } finally {
      verifyInFlightRef.current = false;
      setIsVerifying(false);
    }
  }, [email]);

  const clearError = useCallback(() => setError(null), []);

  const setLocalEmail = useCallback((next: string | null) => {
    setEmail(next?.trim() || null);
    setVerified(false);
  }, []);

  return {
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
    setLocalEmail,
  };
};

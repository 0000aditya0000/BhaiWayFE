import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getCorporateIdentityStatus,
  sendCorporateIdentityOtp,
  verifyCorporateIdentityOtp,
  type CorporateIdentityStatus,
  type CorporateIdentityStatusResponse,
} from '@/features/profile/api/corporateIdentity.api';
import {
  CORPORATE_IDENTITY_ERROR_MESSAGES,
  CORPORATE_OTP_LENGTH,
  CORPORATE_RESEND_COOLDOWN_SECONDS,
  isCorporateVerifiedStatus,
  isValidCorporateEmailSyntax,
  isValidCorporateOtp,
  mapCorporateIdentityError,
  normalizeCorporateEmail,
  normalizeCorporateOtp,
} from '@/features/profile/utils/corporateIdentity.mapper';
import { authSession } from '@/store';

export type CorporateIdentityUiPhase =
  | 'INITIAL_LOADING'
  | 'NOT_VERIFIED'
  | 'SENDING_OTP'
  | 'OTP_PENDING'
  | 'VERIFYING_OTP'
  | 'VERIFIED'
  | 'ERROR';

export interface FetchCorporateIdentityStatusOptions {
  /** When true, do not surface errors in form UI and skip loading flash if status is known. */
  silent?: boolean;
}

export interface UseCorporateIdentityResult {
  status: CorporateIdentityStatus | null;
  email: string | null;
  verifiedAt: string | null;
  verified: boolean;
  otpPending: boolean;
  phase: CorporateIdentityUiPhase;
  isLoading: boolean;
  isSending: boolean;
  isVerifying: boolean;
  error: string | null;
  cooldownSeconds: number;
  fetchStatus: (
    options?: FetchCorporateIdentityStatusOptions,
  ) => Promise<CorporateIdentityStatusResponse | null>;
  sendOtp: (email: string) => Promise<'otp_sent' | 'already_verified' | 'failed'>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  clearError: () => void;
  resetTransient: () => void;
}

const toPhase = (
  status: CorporateIdentityStatus | null,
  isLoading: boolean,
  isSending: boolean,
  isVerifying: boolean,
  error: string | null,
): CorporateIdentityUiPhase => {
  if (isLoading && !status) {
    return 'INITIAL_LOADING';
  }
  if (isSending) {
    return 'SENDING_OTP';
  }
  if (isVerifying) {
    return 'VERIFYING_OTP';
  }
  if (status === 'VERIFIED') {
    return 'VERIFIED';
  }
  if (status === 'OTP_PENDING') {
    return 'OTP_PENDING';
  }
  if (error && !status) {
    return 'ERROR';
  }
  return 'NOT_VERIFIED';
};

/**
 * Corporate identity via BhaiWay backend only.
 * OTP exists only in caller React state — never persisted by this hook.
 */
export const useCorporateIdentity = (): UseCorporateIdentityResult => {
  const [status, setStatus] = useState<CorporateIdentityStatus | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const sendInFlightRef = useRef(false);
  const verifyInFlightRef = useRef(false);
  const statusInFlightRef = useRef(false);
  const statusRef = useRef<CorporateIdentityStatus | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCooldownTimer = useCallback(() => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }, []);

  const startCooldown = useCallback(
    (seconds: number = CORPORATE_RESEND_COOLDOWN_SECONDS) => {
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
    return authSession.subscribe((session) => {
      if (!session.token) {
        setStatus(null);
        statusRef.current = null;
        setEmail(null);
        setVerifiedAt(null);
        setError(null);
        setIsLoading(false);
        setCooldownSeconds(0);
        clearCooldownTimer();
      }
    });
  }, [clearCooldownTimer]);

  const applyStatus = useCallback((next: CorporateIdentityStatusResponse) => {
    statusRef.current = next.status;
    setStatus(next.status);
    setEmail(next.email?.trim() || null);
    setVerifiedAt(next.verifiedAt ?? null);
  }, []);

  const fetchStatus = useCallback(
    async (
      options?: FetchCorporateIdentityStatusOptions,
    ): Promise<CorporateIdentityStatusResponse | null> => {
      if (!authSession.getToken()) {
        statusRef.current = null;
        setStatus(null);
        setEmail(null);
        setVerifiedAt(null);
        setIsLoading(false);
        return null;
      }

      if (statusInFlightRef.current) {
        return null;
      }

      const silent = Boolean(options?.silent);
      statusInFlightRef.current = true;
      if (!silent || !statusRef.current) {
        setIsLoading(true);
      }

      try {
        const next = await getCorporateIdentityStatus();
        applyStatus(next);
        if (!silent) {
          setError(null);
        }
        return next;
      } catch (err) {
        if (!silent) {
          setError(mapCorporateIdentityError(err));
        }
        return null;
      } finally {
        statusInFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [applyStatus],
  );

  const sendOtp = useCallback(
    async (rawEmail: string): Promise<'otp_sent' | 'already_verified' | 'failed'> => {
      if (sendInFlightRef.current) {
        return 'failed';
      }

      const target = normalizeCorporateEmail(rawEmail);
      if (!isValidCorporateEmailSyntax(target)) {
        setError(CORPORATE_IDENTITY_ERROR_MESSAGES.INVALID_EMAIL);
        return 'failed';
      }

      if (cooldownSeconds > 0) {
        setError(CORPORATE_IDENTITY_ERROR_MESSAGES.COOLDOWN);
        return 'failed';
      }

      sendInFlightRef.current = true;
      setIsSending(true);
      setError(null);

      try {
        const response = await sendCorporateIdentityOtp(target);
        setEmail(target);

        if (
          response.status === 'VERIFIED' ||
          isCorporateVerifiedStatus(response.status)
        ) {
          const refreshed = await getCorporateIdentityStatus().catch(() => null);
          if (refreshed) {
            applyStatus(refreshed);
          } else {
            statusRef.current = 'VERIFIED';
            setStatus('VERIFIED');
            setEmail(response.email?.trim() || target);
            setVerifiedAt(response.verifiedAt ?? null);
          }
          return 'already_verified';
        }

        startCooldown(CORPORATE_RESEND_COOLDOWN_SECONDS);

        const refreshed = await getCorporateIdentityStatus().catch(() => null);
        if (refreshed) {
          applyStatus(refreshed);
        } else {
          statusRef.current = 'OTP_PENDING';
          setStatus('OTP_PENDING');
        }

        return 'otp_sent';
      } catch (err) {
        const message = mapCorporateIdentityError(err);
        setError(message);
        if (message === CORPORATE_IDENTITY_ERROR_MESSAGES.COOLDOWN) {
          startCooldown(CORPORATE_RESEND_COOLDOWN_SECONDS);
        }
        return 'failed';
      } finally {
        sendInFlightRef.current = false;
        setIsSending(false);
      }
    },
    [applyStatus, cooldownSeconds, startCooldown],
  );

  const verifyOtp = useCallback(
    async (rawEmail: string, otp: string): Promise<boolean> => {
      if (verifyInFlightRef.current) {
        return false;
      }

      const target = normalizeCorporateEmail(rawEmail || email || '');
      const normalized = normalizeCorporateOtp(otp);

      if (!isValidCorporateEmailSyntax(target)) {
        setError(CORPORATE_IDENTITY_ERROR_MESSAGES.INVALID_EMAIL);
        return false;
      }

      if (!isValidCorporateOtp(normalized)) {
        setError(`Enter the ${CORPORATE_OTP_LENGTH}-digit verification code.`);
        return false;
      }

      verifyInFlightRef.current = true;
      setIsVerifying(true);
      setError(null);

      try {
        await verifyCorporateIdentityOtp(target, normalized);
        const refreshed = await getCorporateIdentityStatus();
        applyStatus(refreshed);
        return isCorporateVerifiedStatus(refreshed.status);
      } catch (err) {
        setError(mapCorporateIdentityError(err));
        return false;
      } finally {
        verifyInFlightRef.current = false;
        setIsVerifying(false);
      }
    },
    [applyStatus, email],
  );

  const clearError = useCallback(() => setError(null), []);

  const resetTransient = useCallback(() => {
    setError(null);
    setCooldownSeconds(0);
    clearCooldownTimer();
  }, [clearCooldownTimer]);

  return {
    status,
    email,
    verifiedAt,
    verified: isCorporateVerifiedStatus(status),
    otpPending: status === 'OTP_PENDING',
    phase: toPhase(status, isLoading, isSending, isVerifying, error),
    isLoading,
    isSending,
    isVerifying,
    error,
    cooldownSeconds,
    fetchStatus,
    sendOtp,
    verifyOtp,
    clearError,
    resetTransient,
  };
};

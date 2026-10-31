import { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { useSessionUser } from '@/shared/hooks';
import { triggerLightHaptic } from '@/shared/utils';
import { requestEmailChangeOtp } from '../api/emailChange.api';
import {
  EMAIL_CHANGE_ERROR_MESSAGES,
  isValidNewEmail,
  normalizeNewEmail,
  parseEmailChangeError,
} from '../utils/emailChange.mapper';

export interface UseChangeEmailResult {
  newEmail: string;
  setNewEmail: (email: string) => void;
  currentEmail: string | null;
  error: string | null;
  isSubmitting: boolean;
  canSubmit: boolean;
  clearError: () => void;
  goBack: () => void;
  submitRequest: () => Promise<void>;
}

export const useChangeEmail = (): UseChangeEmailResult => {
  const router = useRouter();
  const sessionUser = useSessionUser();
  const currentEmail = sessionUser?.email?.trim() || null;

  const [newEmail, setNewEmailState] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setNewEmail = useCallback(
    (value: string) => {
      setError(null);
      setNewEmailState(value);
    },
    [],
  );

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.profile);
    }
  }, [router]);

  const submitRequest = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    const trimmed = newEmail.trim();
    if (!trimmed) {
      setError(EMAIL_CHANGE_ERROR_MESSAGES.EMPTY_EMAIL);
      return;
    }

    const normalized = normalizeNewEmail(trimmed);
    if (!isValidNewEmail(normalized)) {
      setError(EMAIL_CHANGE_ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
      return;
    }

    if (currentEmail && normalized.toLowerCase() === currentEmail.toLowerCase()) {
      setError(EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_SAME_AS_CURRENT);
      return;
    }

    Keyboard.dismiss();
    triggerLightHaptic();
    setIsSubmitting(true);
    setError(null);

    try {
      await requestEmailChangeOtp(normalized);
      // Navigate to OTP verification screen with the pending new email
      router.push({
        pathname: ROUTES.changeEmailVerify,
        params: { email: normalized },
      });
    } catch (err) {
      const parsed = parseEmailChangeError(err);
      setError(parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentEmail, isSubmitting, newEmail, router]);

  const canSubmit = Boolean(newEmail.trim()) && !isSubmitting;

  return {
    newEmail,
    setNewEmail,
    currentEmail,
    error,
    isSubmitting,
    canSubmit,
    clearError,
    goBack,
    submitRequest,
  };
};

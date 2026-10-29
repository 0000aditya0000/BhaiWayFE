import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { usePathname, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { useCorporateIdentity } from '@/hooks/useCorporateIdentity';
import { triggerLightHaptic } from '@/shared/utils';
import { CORPORATE_IDENTITY_SCREEN } from '../constants/corporate-identity.constants';

export interface UseCorporateIdentityScreenResult {
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: 'neutral' | 'warning' | 'success';
  email: string | null;
  verifiedAt: string | null;
  isLoading: boolean;
  verified: boolean;
  otpPending: boolean;
  error: string | null;
  primaryCta: string | null;
  goBack: () => void;
  onPrimaryAction: () => void;
}

export const useCorporateIdentityScreen = (): UseCorporateIdentityScreenResult => {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthFlow = pathname.includes('/login');
  const {
    email,
    verifiedAt,
    verified,
    otpPending,
    isLoading,
    error,
    fetchStatus,
  } = useCorporateIdentity();

  useFocusEffect(
    useCallback(() => {
      void fetchStatus();
    }, [fetchStatus]),
  );

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(isAuthFlow ? ROUTES.authIdentityVerification : ROUTES.identityVerification);
  }, [isAuthFlow, router]);

  const onPrimaryAction = useCallback(() => {
    triggerLightHaptic();
    router.push({
      pathname: isAuthFlow ? ROUTES.authCorporateIdentityVerify : ROUTES.corporateIdentityVerify,
      params: {
        step: otpPending ? 'otp' : 'email',
        email: email ?? '',
      },
    });
  }, [email, isAuthFlow, otpPending, router]);

  const statusLabel = verified
    ? CORPORATE_IDENTITY_SCREEN.verifiedLabel
    : otpPending
      ? CORPORATE_IDENTITY_SCREEN.otpPendingLabel
      : CORPORATE_IDENTITY_SCREEN.notVerifiedLabel;

  const statusTone = verified ? 'success' : otpPending ? 'warning' : 'neutral';

  const primaryCta = verified
    ? CORPORATE_IDENTITY_SCREEN.changeEmailCta
    : otpPending
      ? CORPORATE_IDENTITY_SCREEN.continuePendingCta
      : CORPORATE_IDENTITY_SCREEN.verifyCta;

  return {
    title: CORPORATE_IDENTITY_SCREEN.title,
    subtitle: CORPORATE_IDENTITY_SCREEN.subtitle,
    statusLabel,
    statusTone,
    email,
    verifiedAt,
    isLoading,
    verified,
    otpPending,
    error,
    primaryCta,
    goBack,
    onPrimaryAction,
  };
};

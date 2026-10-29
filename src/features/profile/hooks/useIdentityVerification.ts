import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { usePathname, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { useCorporateIdentity } from '@/hooks/useCorporateIdentity';
import { triggerLightHaptic } from '@/shared/utils';
import type { CorporateIdentityStatus } from '../api/corporateIdentity.api';
import { IDENTITY_VERIFICATION_SCREEN } from '../constants/identity-verification.constants';
import { isIdentityVerifiedStatus } from '../utils/verification.mapper';
import { useMyVerification } from './useMyVerification';

export interface UseIdentityVerificationResult {
  title: string;
  subtitle: string;
  aadhaarVerified: boolean;
  corporateStatus: CorporateIdentityStatus | null;
  corporateVerified: boolean;
  corporateOtpPending: boolean;
  corporateEmail: string | null;
  corporateLoading: boolean;
  refreshing: boolean;
  goBack: () => void;
  openAadhaar: () => void;
  openCorporateIdentity: () => void;
}

export const useIdentityVerification = (): UseIdentityVerificationResult => {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthFlow = pathname.includes('/login');
  const { verifications, refreshing } = useMyVerification();
  const {
    status: corporateStatus,
    email: corporateEmail,
    verified: corporateVerified,
    otpPending: corporateOtpPending,
    isLoading: corporateLoading,
    fetchStatus: fetchCorporateStatus,
  } = useCorporateIdentity();

  const aadhaarVerified = isIdentityVerifiedStatus(verifications?.identity?.status);

  useFocusEffect(
    useCallback(() => {
      void fetchCorporateStatus({ silent: true });
    }, [fetchCorporateStatus]),
  );

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(isAuthFlow ? ROUTES.completeProfile : ROUTES.profile);
  }, [isAuthFlow, router]);

  const openAadhaar = useCallback(() => {
    triggerLightHaptic();
    router.push(isAuthFlow ? ROUTES.authVerifyAadhaar : ROUTES.verifyAadhaar);
  }, [isAuthFlow, router]);

  const openCorporateIdentity = useCallback(() => {
    triggerLightHaptic();
    router.push(isAuthFlow ? ROUTES.authCorporateIdentity : ROUTES.corporateIdentity);
  }, [isAuthFlow, router]);

  return {
    title: IDENTITY_VERIFICATION_SCREEN.title,
    subtitle: IDENTITY_VERIFICATION_SCREEN.subtitle,
    aadhaarVerified,
    corporateStatus,
    corporateVerified,
    corporateOtpPending,
    corporateEmail,
    corporateLoading,
    refreshing,
    goBack,
    openAadhaar,
    openCorporateIdentity,
  };
};

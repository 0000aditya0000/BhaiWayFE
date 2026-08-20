import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { authService } from '@/features/auth/services';
import {
  isProfileSetupDraftComplete,
  profileSetupDraft,
} from '@/features/auth/store';
import { mapCompleteProfileError } from '@/features/auth/utils';
import { triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { authSession, showAppAlert } from '@/store';
import { IDENTITY_VERIFIED_SUCCESS_SCREEN } from '../constants';

export interface UseIdentityVerifiedSuccessResult {
  isAuthFlow: boolean;
  profileReady: boolean;
  ctaLabel: string;
  continuing: boolean;
  continueAfterVerification: () => Promise<void>;
  goBack: () => void;
}

export const useIdentityVerifiedSuccess = (): UseIdentityVerifiedSuccessResult => {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthFlow = pathname.includes('/login');
  const [continuing, setContinuing] = useState(false);

  const profileReady = useMemo(
    () => (isAuthFlow ? isProfileSetupDraftComplete() : true),
    [isAuthFlow],
  );

  const ctaLabel = useMemo(() => {
    if (!isAuthFlow) {
      return IDENTITY_VERIFIED_SUCCESS_SCREEN.ctaLabel;
    }
    return profileReady
      ? IDENTITY_VERIFIED_SUCCESS_SCREEN.ctaLabel
      : IDENTITY_VERIFIED_SUCCESS_SCREEN.ctaCompleteProfileLabel;
  }, [isAuthFlow, profileReady]);

  const continueAfterVerification = useCallback(async () => {
    triggerLightHaptic();

    if (!isAuthFlow) {
      router.replace(ROUTES.home);
      return;
    }

    if (!isProfileSetupDraftComplete()) {
      profileSetupDraft.setPromptFillDetails(true);
      router.replace(ROUTES.completeProfile);
      return;
    }

    const draft = profileSetupDraft.get();
    if (!draft.gender) {
      profileSetupDraft.setPromptFillDetails(true);
      router.replace(ROUTES.completeProfile);
      return;
    }

    setContinuing(true);
    try {
      const profile = await authService.completeProfile({
        fullName: draft.fullName,
        email: draft.email,
        gender: draft.gender,
        avatarUri: draft.avatarUri,
      });
      triggerSuccessHaptic();
      authSession.setUserFromProfile(profile);
      profileSetupDraft.clear();
      router.replace(ROUTES.home);
    } catch (error) {
      showAppAlert('Unable to save profile', mapCompleteProfileError(error));
      router.replace(ROUTES.completeProfile);
    } finally {
      setContinuing(false);
    }
  }, [isAuthFlow, router]);

  const goBack = useCallback(() => {
    triggerLightHaptic();

    if (isAuthFlow) {
      if (!isProfileSetupDraftComplete()) {
        profileSetupDraft.setPromptFillDetails(true);
      }
      router.replace(ROUTES.completeProfile);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [isAuthFlow, router]);

  return {
    isAuthFlow,
    profileReady,
    ctaLabel,
    continuing,
    continueAfterVerification,
    goBack,
  };
};

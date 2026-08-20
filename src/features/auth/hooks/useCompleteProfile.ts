import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import { useRouter } from 'expo-router';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ROUTES } from '@/config';
import { triggerSuccessHaptic } from '@/shared/utils';
import { authSession, showAppAlert } from '@/store';
import { verificationStore } from '@/features/profile/store';
import { getMyVerifications } from '@/features/profile/api';
import { authService } from '../services';
import { profileSetupDraft } from '../store';
import { mapCompleteProfileError, isDuplicateEmailError } from '../utils';
import { profileValidationSchema, type ProfileFormValues } from '../validation';

export interface UseCompleteProfileResult {
  form: UseFormReturn<ProfileFormValues>;
  avatarUri: string | null;
  setAvatarUri: (uri: string) => void;
  loading: boolean;
  isIdentityVerified: boolean;
  saveDraft: () => void;
  submit: () => void;
}

export const useCompleteProfile = (): UseCompleteProfileResult => {
  const router = useRouter();
  const initialDraft = profileSetupDraft.get();
  const [avatarUri, setAvatarUriState] = useState<string | null>(initialDraft.avatarUri);
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(
    () => verificationStore.isIdentityVerified(),
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileValidationSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: initialDraft.fullName,
      email: initialDraft.email,
      gender: initialDraft.gender,
    },
  });

  const setAvatarUri = useCallback((uri: string) => {
    setAvatarUriState(uri);
    profileSetupDraft.set({ avatarUri: uri });
  }, []);

  const saveDraft = useCallback(() => {
    const values = form.getValues();
    profileSetupDraft.set({
      fullName: values.fullName ?? '',
      email: values.email ?? '',
      gender: values.gender,
      avatarUri,
    });
  }, [avatarUri, form]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      profileSetupDraft.set({
        fullName: values.fullName ?? '',
        email: values.email ?? '',
        gender: values.gender,
        avatarUri,
      });
    });
    return () => subscription.unsubscribe();
  }, [avatarUri, form]);

  useEffect(() => verificationStore.subscribe((state) => {
    setIsIdentityVerified(state?.identity.status === 'VERIFIED');
  }), []);

  useEffect(() => {
    if (!authSession.getToken()) {
      return;
    }

    void getMyVerifications()
      .then((rows) => {
        verificationStore.set(rows);
      })
      .catch(() => {
        // Profile badge falls back to store snapshot; avoid blocking setup.
      });
  }, []);

  useEffect(() => {
    if (!initialDraft.promptFillDetails) {
      return;
    }

    profileSetupDraft.setPromptFillDetails(false);
    showAppAlert(
      'Complete your profile',
      'Identity verified. Please fill in your required details to continue.',
    );
  }, [initialDraft.promptFillDetails]);

  const submit = useCallback(() => {
    if (submittingRef.current) {
      return;
    }

    void form.handleSubmit(async (values) => {
      if (submittingRef.current) {
        return;
      }

      Keyboard.dismiss();
      submittingRef.current = true;
      setLoading(true);

      const cloudinaryAvatar =
        avatarUri && /^https?:\/\//i.test(avatarUri) ? avatarUri : undefined;

      try {
        const profile = await authService.completeProfile({
          ...values,
          avatarUri: cloudinaryAvatar ?? avatarUri,
        });
        triggerSuccessHaptic();
        authSession.setUserFromProfile(profile);
        profileSetupDraft.clear();
        router.replace(ROUTES.home);
      } catch (error) {
        const alreadyHasProfile =
          error &&
          typeof error === 'object' &&
          'status' in error &&
          (error as { status?: number }).status === 409 &&
          !isDuplicateEmailError(error);

        if (alreadyHasProfile) {
          authSession.setUserFromProfile({
            id: authSession.getUser()?.id ?? '',
            fullName: values.fullName.trim(),
            email: values.email.trim(),
            gender: values.gender,
            avatarUri: cloudinaryAvatar ?? avatarUri ?? null,
          });
          profileSetupDraft.clear();
          router.replace(ROUTES.home);
          return;
        }

        showAppAlert('Unable to save profile', mapCompleteProfileError(error));
      } finally {
        submittingRef.current = false;
        setLoading(false);
      }
    })();
  }, [avatarUri, form, router]);

  return {
    form,
    avatarUri,
    setAvatarUri,
    loading,
    isIdentityVerified,
    saveDraft,
    submit,
  };
};

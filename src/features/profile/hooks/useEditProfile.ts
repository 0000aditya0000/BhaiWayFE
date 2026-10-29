import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import { useRouter } from 'expo-router';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ROUTES } from '@/config';
import { saveProfilePhotoUrl } from '@/features/media';
import { authService } from '@/features/auth/services';
import {
  mapCompleteProfileError,
  mapGenderFromApi,
  resolveProfileFullName,
} from '@/features/auth/utils';
import { profileValidationSchema, type ProfileFormValues } from '@/features/auth/validation';
import { useUpload } from '@/hooks/useUpload';
import { useSessionUser } from '@/shared/hooks';
import { formatPhoneNumber, triggerSuccessHaptic } from '@/shared/utils';
import { formatApiGenderLabel } from '@/shared/utils/womenOnlyRide';
import { authSession, showAppAlert } from '@/store';
import type { ApiGender } from '@/features/auth/types';
import { EDIT_PROFILE_SCREEN } from '../constants';

const formatPhoneLabel = (phone?: string | null): string => {
  const digits = (phone ?? '').replace(/\D/g, '').slice(-10);
  if (digits.length === 10) {
    return `+91 ${formatPhoneNumber(digits)}`;
  }
  return phone?.trim() || '—';
};

export interface UseEditProfileResult {
  form: UseFormReturn<ProfileFormValues>;
  avatarUri: string | null;
  phoneLabel: string;
  genderLabel: string;
  loadingProfile: boolean;
  saving: boolean;
  avatarUploading: boolean;
  setAvatarUri: (uri: string) => void;
  submit: () => void;
  goBack: () => void;
}

export const useEditProfile = (): UseEditProfileResult => {
  const router = useRouter();
  const sessionUser = useSessionUser();
  const [avatarUri, setAvatarUriState] = useState<string | null>(sessionUser?.avatarUri ?? null);
  const [phoneLabel, setPhoneLabel] = useState(() => formatPhoneLabel(sessionUser?.phone));
  const [genderLabel, setGenderLabel] = useState(() =>
    formatApiGenderLabel(sessionUser?.gender ?? null),
  );
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);
  const uploadGenerationRef = useRef(0);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileValidationSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: sessionUser?.fullName ?? '',
      email: sessionUser?.email ?? '',
    },
  });

  const { uploadLocalFile, isUploading: avatarUploading } = useUpload({
    kind: 'profile',
    onUploaded: saveProfilePhotoUrl,
    showAlerts: true,
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await authService.getMe();
        if (cancelled) {
          return;
        }

        const fullName = resolveProfileFullName(response.profile) || sessionUser?.fullName || '';
        const email = response.user.email?.trim() || sessionUser?.email || '';
        const apiGender = (response.profile?.gender ?? null) as ApiGender | null;
        const photo = response.profile?.profilePhoto?.trim() || sessionUser?.avatarUri || null;

        form.reset({
          fullName,
          email,
          gender: mapGenderFromApi(apiGender),
        });
        setAvatarUriState(photo);
        setPhoneLabel(formatPhoneLabel(response.user.phone));
        setGenderLabel(formatApiGenderLabel(apiGender));
      } catch {
        if (!cancelled) {
          showAppAlert(
            EDIT_PROFILE_SCREEN.loadErrorTitle,
            EDIT_PROFILE_SCREEN.loadErrorMessage,
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form, sessionUser?.avatarUri, sessionUser?.email, sessionUser?.fullName]);

  const setAvatarUri = useCallback((uri: string) => {
    setAvatarUriState(uri);
  }, []);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [router]);

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
      setSaving(true);

      try {
        let resolvedAvatar = avatarUri;
        const generation = ++uploadGenerationRef.current;

        if (resolvedAvatar && !/^https?:\/\//i.test(resolvedAvatar)) {
          const uploaded = await uploadLocalFile({
            uri: resolvedAvatar,
            fileName: `profile_${Date.now()}.jpg`,
            mimeType: 'image/jpeg',
          });

          if (generation !== uploadGenerationRef.current) {
            return;
          }

          if (!uploaded) {
            return;
          }

          resolvedAvatar = uploaded.secureUrl;
          setAvatarUriState(uploaded.secureUrl);
        }

        const previousEmail = (sessionUser?.email ?? '').trim().toLowerCase();
        const nextEmail = (values.email ?? '').trim().toLowerCase();
        const emailChanged = Boolean(nextEmail) && nextEmail !== previousEmail;

        const profile = await authService.updateProfile({
          ...values,
          avatarUri: resolvedAvatar,
        });

        authSession.setUserFromProfile(profile);
        const { invalidateUserProfileCache } = await import('@/network/resourceCache');
        invalidateUserProfileCache();
        await authService.hydrateAuthenticatedUser({ force: true }).catch(() => undefined);

        triggerSuccessHaptic();
        showAppAlert(
          EDIT_PROFILE_SCREEN.saveSuccessTitle,
          emailChanged
            ? EDIT_PROFILE_SCREEN.saveSuccessUnverifiedEmailMessage
            : EDIT_PROFILE_SCREEN.saveSuccessMessage,
        );
        goBack();
      } catch (error) {
        showAppAlert(
          EDIT_PROFILE_SCREEN.saveErrorTitle,
          mapCompleteProfileError(error),
        );
      } finally {
        submittingRef.current = false;
        setSaving(false);
      }
    })();
  }, [avatarUri, form, goBack, sessionUser?.email, uploadLocalFile]);

  return {
    form,
    avatarUri,
    phoneLabel,
    genderLabel,
    loadingProfile,
    saving,
    avatarUploading,
    setAvatarUri,
    submit,
    goBack,
  };
};

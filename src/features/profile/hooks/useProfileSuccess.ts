import { useCallback, useMemo, useState } from 'react';
import { Share } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { useSessionUser } from '@/shared/hooks';
import { getSearchParam, triggerLightHaptic, triggerSuccessHaptic, showAppAlert } from '@/shared/utils';
import { DEFAULT_PROFILE_AVATAR } from '../constants/profile.constants';
import { PROFILE_SUCCESS_SCREEN } from '../constants/profile-success.constants';
import type { ProfileSuccessKind } from '../types';

export interface UseProfileSuccessResult {
  kind: ProfileSuccessKind;
  brandTitle: string;
  title: string;
  subtitle: string | null;
  amountLabel: string | null;
  bankName: string;
  bankLabel: string | null;
  maskedNumber: string;
  referenceNumber: string | null;
  primaryLabel: string;
  secondaryLabel: string | null;
  avatarUri: string;
  copied: boolean;
  onPrimary: () => void;
  onSecondary: (() => void) | null;
  copyReference: (() => void) | null;
  openProfile: () => void;
  goBack: () => void;
}

const resolveKind = (raw: string): ProfileSuccessKind => {
  if (raw === 'withdrawal-initiated') {
    return 'withdrawal-initiated';
  }
  return 'bank-account-added';
};

export const useProfileSuccess = (
  defaultKind: ProfileSuccessKind = 'bank-account-added',
): UseProfileSuccessResult => {
  const router = useRouter();
  const user = useSessionUser();
  const params = useLocalSearchParams<{
    kind?: string;
    amountLabel?: string;
    bankName?: string;
    maskedNumber?: string;
    referenceNumber?: string;
  }>();
  const [copied, setCopied] = useState(false);

  const kind = resolveKind(getSearchParam(params.kind) || defaultKind);

  const avatarUri = useMemo(
    () => user?.avatarUri ?? DEFAULT_PROFILE_AVATAR,
    [user?.avatarUri],
  );

  const bankConfig = PROFILE_SUCCESS_SCREEN.bankAdded;
  const withdrawConfig = PROFILE_SUCCESS_SCREEN.withdrawal;

  const bankName =
    getSearchParam(params.bankName) ||
    (kind === 'withdrawal-initiated'
      ? withdrawConfig.defaultBankName
      : bankConfig.defaultBankName);

  const maskedNumber =
    getSearchParam(params.maskedNumber) ||
    (kind === 'withdrawal-initiated'
      ? withdrawConfig.defaultMaskedNumber
      : bankConfig.defaultMaskedNumber);

  const amountLabel =
    kind === 'withdrawal-initiated'
      ? getSearchParam(params.amountLabel) || withdrawConfig.defaultAmountLabel
      : null;

  const referenceNumber =
    kind === 'withdrawal-initiated'
      ? getSearchParam(params.referenceNumber) || withdrawConfig.defaultReferenceNumber
      : null;

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.wallet);
  }, [router]);

  const openProfile = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.profile);
  }, [router]);

  const goToWallet = useCallback(() => {
    triggerLightHaptic();
    router.replace(ROUTES.wallet);
  }, [router]);

  const goToPaymentMethods = useCallback(() => {
    triggerLightHaptic();
    router.replace(ROUTES.paymentMethods);
  }, [router]);

  const goToWithdraw = useCallback(() => {
    triggerLightHaptic();
    router.replace(ROUTES.withdraw);
  }, [router]);

  const copyReference = useCallback(() => {
    if (!referenceNumber) {
      return;
    }
    triggerLightHaptic();
    Share.share({ message: referenceNumber })
      .then((result) => {
        if (result.action !== Share.dismissedAction) {
          triggerSuccessHaptic();
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      })
      .catch(() => {
        showAppAlert('Reference Number', referenceNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  }, [referenceNumber]);

  if (kind === 'withdrawal-initiated') {
    return {
      kind,
      brandTitle: PROFILE_SUCCESS_SCREEN.brandTitle,
      title: withdrawConfig.title,
      subtitle: null,
      amountLabel,
      bankName,
      bankLabel: null,
      maskedNumber,
      referenceNumber,
      primaryLabel: withdrawConfig.primaryLabel,
      secondaryLabel: null,
      avatarUri,
      copied,
      onPrimary: goToWallet,
      onSecondary: null,
      copyReference,
      openProfile,
      goBack,
    };
  }

  return {
    kind,
    brandTitle: PROFILE_SUCCESS_SCREEN.brandTitle,
    title: bankConfig.title,
    subtitle: bankConfig.subtitle,
    amountLabel: null,
    bankName,
    bankLabel: bankConfig.bankLabel,
    maskedNumber,
    referenceNumber: null,
    primaryLabel: bankConfig.primaryLabel,
    secondaryLabel: bankConfig.secondaryLabel,
    avatarUri,
    copied,
    onPrimary: goToWithdraw,
    onSecondary: goToPaymentMethods,
    copyReference: null,
    openProfile,
    goBack,
  };
};

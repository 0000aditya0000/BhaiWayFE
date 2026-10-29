import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { savedUpiStore } from '@/features/ride-search/store';
import { useSessionUser } from '@/shared/hooks';
import {
  getSearchParam,
  isValidUpiId,
  delay,
  triggerLightHaptic,
  triggerSuccessHaptic,
  showAppAlert,
} from '@/shared/utils';
import { DEFAULT_PROFILE_AVATAR } from '../constants/profile.constants';
import { LINK_UPI_SCREEN } from '../constants/link-upi.constants';
import { getUpiLinkedSuccessPath } from '../constants/upi-linked-success.constants';

const displayNameFromUpi = (upiId: string): string => {
  const local = upiId.split('@')[0]?.trim() || '';
  if (!local) {
    return LINK_UPI_SCREEN.verifiedFallbackName;
  }
  return local
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

export interface UseLinkUpiResult {
  upiId: string;
  verified: boolean;
  verifiedName: string | null;
  verifying: boolean;
  saving: boolean;
  canSave: boolean;
  avatarUri: string;
  isEditMode: boolean;
  screenTitle: string;
  settingsSubtitle: string;
  saveLabel: string;
  setUpiId: (value: string) => void;
  verifyUpi: () => void;
  saveUpi: () => void;
  goBack: () => void;
  openProfile: () => void;
}

export const useLinkUpi = (): UseLinkUpiResult => {
  const router = useRouter();
  const user = useSessionUser();
  const params = useLocalSearchParams<{
    mode?: string;
    savedUpiId?: string;
    returnTo?: string;
  }>();
  const [upiId, setUpiIdState] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const isEditMode = getSearchParam(params.mode) === 'edit';
  const savedUpiId = getSearchParam(params.savedUpiId);
  const returnToPaymentMethods = getSearchParam(params.returnTo) === 'payment-methods';

  const avatarUri = useMemo(
    () => user?.avatarUri ?? DEFAULT_PROFILE_AVATAR,
    [user?.avatarUri],
  );

  const screenTitle = isEditMode ? LINK_UPI_SCREEN.editTitle : LINK_UPI_SCREEN.title;
  const settingsSubtitle = isEditMode
    ? LINK_UPI_SCREEN.editSettingsSubtitle
    : LINK_UPI_SCREEN.settingsSubtitle;
  const saveLabel = isEditMode ? LINK_UPI_SCREEN.editSaveLabel : LINK_UPI_SCREEN.saveLabel;

  useEffect(() => {
    if (!isEditMode || !savedUpiId || prefilled) {
      return;
    }

    const existing = savedUpiStore.getById(savedUpiId);
    if (!existing) {
      return;
    }

    setUpiIdState(existing.upiId);
    setVerified(true);
    setVerifiedName(existing.label);
    setPrefilled(true);
  }, [isEditMode, prefilled, savedUpiId]);

  const canSave = useMemo(
    () => verified && isValidUpiId(upiId) && !saving && !verifying,
    [saving, upiId, verified, verifying],
  );

  const setUpiId = useCallback((value: string) => {
    setUpiIdState(value.replace(/\s+/g, ''));
    setVerified(false);
    setVerifiedName(null);
  }, []);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (returnToPaymentMethods) {
      router.replace(ROUTES.paymentMethods);
      return;
    }
    router.replace(ROUTES.addMoney);
  }, [returnToPaymentMethods, router]);

  const openProfile = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.profile);
  }, [router]);

  const verifyUpi = useCallback(() => {
    triggerLightHaptic();
    const trimmed = upiId.trim();
    if (!isValidUpiId(trimmed)) {
      showAppAlert(LINK_UPI_SCREEN.invalidTitle, LINK_UPI_SCREEN.invalidMessage);
      return;
    }

    setVerifying(true);
    void delay(900).then(() => {
      const name = displayNameFromUpi(trimmed);
      setVerified(true);
      setVerifiedName(name);
      setVerifying(false);
      triggerSuccessHaptic();
    });
  }, [upiId]);

  const saveUpi = useCallback(() => {
    triggerLightHaptic();
    const trimmed = upiId.trim().toLowerCase();

    if (!isValidUpiId(trimmed)) {
      showAppAlert(LINK_UPI_SCREEN.invalidTitle, LINK_UPI_SCREEN.invalidMessage);
      return;
    }

    if (!verified) {
      showAppAlert(LINK_UPI_SCREEN.verifyFirstTitle, LINK_UPI_SCREEN.verifyFirstMessage);
      return;
    }

    setSaving(true);
    void delay(700).then(() => {
      const saved = isEditMode && savedUpiId
        ? savedUpiStore.update(savedUpiId, trimmed, verifiedName || undefined)
        : savedUpiStore.add(trimmed, verifiedName || undefined);
      setSaving(false);

      if (!saved) {
        showAppAlert(LINK_UPI_SCREEN.invalidTitle, LINK_UPI_SCREEN.invalidMessage);
        return;
      }

      triggerSuccessHaptic();

      if (isEditMode || returnToPaymentMethods) {
        router.replace(ROUTES.paymentMethods);
        return;
      }

      router.replace(getUpiLinkedSuccessPath({ upiId: saved.upiId }));
    });
  }, [
    isEditMode,
    returnToPaymentMethods,
    router,
    savedUpiId,
    upiId,
    verified,
    verifiedName,
  ]);

  return {
    upiId,
    verified,
    verifiedName,
    verifying,
    saving,
    canSave,
    avatarUri,
    isEditMode,
    screenTitle,
    settingsSubtitle,
    saveLabel,
    setUpiId,
    verifyUpi,
    saveUpi,
    goBack,
    openProfile,
  };
};

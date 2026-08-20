import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  findCurrentUserSheetRow,
  formatBhaiWayWalletLabel,
  getBhaiWayWalletBalance,
  subscribeBhaiWayWallet,
} from '@/DemoData';
import { saveProfilePhotoUrl } from '@/features/media';
import { useUpload } from '@/hooks/useUpload';
import type { UploadedDocument } from '@/shared/components';
import { useSessionUser } from '@/shared/hooks';
import { formatPhoneNumber, triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { authSession, showAppAlert } from '@/store';
import {
  DEFAULT_MASTER_PROFILE,
  DEFAULT_PROFILE_AVATAR,
  PROFILE_MENU_ITEMS,
  PROFILE_SCREEN,
} from '../constants';
import { corporateVerificationStore } from '@/features/office-commute/store';
import type {
  MasterProfileData,
  ProfileMenuActionId,
  ProfileMenuItem,
} from '../types';
import { useMyVerification } from './useMyVerification';
/** Snapshot so profile name/phone refresh when the sheet row changes. */
const getSheetProfileIdentity = (): string => {
  const row = findCurrentUserSheetRow();
  return [
    row?.userName ?? '',
    row?.mobile ?? '',
    row?.profilePicture ?? '',
    String(row?.bhaiWayWallet ?? 0),
    String(getBhaiWayWalletBalance()),
  ].join('|');
};

const formatProfilePhoneLabel = (mobile?: string | null, fallback?: string | null): string => {
  const digits = (mobile ?? fallback ?? '').replace(/\D/g, '').slice(-10);
  if (digits.length === 10) {
    return `+91 ${formatPhoneNumber(digits)}`;
  }
  const trimmed = (mobile ?? fallback ?? '').trim();
  return trimmed || DEFAULT_MASTER_PROFILE.phoneLabel;
};

export interface UseMasterProfileResult {
  profile: MasterProfileData;
  menuItems: readonly ProfileMenuItem[];
  uploadSheetVisible: boolean;
  avatarUploading: boolean;
  logoutVisible: boolean;
  openCameraSheet: () => void;
  closeCameraSheet: () => void;
  applyAvatar: (document: UploadedDocument) => void;
  goBack: () => void;
  openAddRedeem: () => void;
  openPaymentMethods: () => void;
  onMenuPress: (id: ProfileMenuActionId) => void;
  openLogout: () => void;
  closeLogout: () => void;
  confirmLogout: () => void;
}

export const useMasterProfile = (): UseMasterProfileResult => {
  const router = useRouter();
  const user = useSessionUser();
  const sheetIdentity = useSyncExternalStore(subscribeBhaiWayWallet, getSheetProfileIdentity);
  const sheetRow = useMemo(() => findCurrentUserSheetRow(), [sheetIdentity]);
  const walletBalanceLabel = formatBhaiWayWalletLabel(getBhaiWayWalletBalance());
  const { verifications } = useMyVerification();
  const identityVerified = verifications?.identity?.status === 'VERIFIED';
  const menuItems = useMemo((): readonly ProfileMenuItem[] => {
    return PROFILE_MENU_ITEMS.map((item) => {
      if (item.id !== 'verify') {
        return item;
      }
      if (!verifications) {
        return item;
      }
      const status = verifications.identity.status;
      if (status === 'VERIFIED') {
        return {
          ...item,
          subtitle: 'Identity verified',
        };
      }
      if (status === 'IN_REVIEW') {
        return {
          ...item,
          subtitle: 'Identity verification in review',
        };
      }
      if (status === 'REJECTED') {
        return {
          ...item,
          subtitle: verifications.identity.rejectionReason?.trim() || 'Identity verification rejected',
        };
      }
      return {
        ...item,
        subtitle: 'Verify Aadhaar to unlock trust & features',
      };
    });
  }, [verifications]);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [isCorporateVerified, setIsCorporateVerified] = useState(() =>
    corporateVerificationStore.isVerified(),
  );
  const uploadGenerationRef = useRef(0);

  const { uploadLocalFile, isUploading: avatarUploading, cancelUpload } = useUpload({
    kind: 'profile',
    onUploaded: saveProfilePhotoUrl,
    showAlerts: true,
  });

  useEffect(
    () =>
      corporateVerificationStore.subscribe((record) => {
        setIsCorporateVerified(record != null);
      }),
    [],
  );

  useEffect(
    () => () => {
      cancelUpload();
    },
    [cancelUpload],
  );

  const profile = useMemo((): MasterProfileData => {
    const fullName =
      user?.fullName?.trim() ||
      sheetRow?.userName?.trim() ||
      DEFAULT_MASTER_PROFILE.fullName;
    const phoneLabel = formatProfilePhoneLabel(user?.phone, sheetRow?.mobile);
    const avatarUri =
      localAvatarUri ??
      (user?.avatarUri?.trim() ||
        sheetRow?.profilePicture?.trim() ||
        DEFAULT_MASTER_PROFILE.avatarUri ||
        DEFAULT_PROFILE_AVATAR);
    const ratingLabel = '0';

    const badges = [
      isCorporateVerified
        ? {
            id: 'corporate',
            label: 'Corporate ID',
            icon: 'verified' as const,
            tone: 'success' as const,
          }
        : {
            id: 'corporate',
            label: 'Corporate ID',
            icon: 'close-circle' as const,
            tone: 'danger' as const,
          },
      { id: 'rating', label: ratingLabel, icon: 'star' as const, tone: 'neutral' as const },
      identityVerified
        ? {
            id: 'trust',
            label: 'Verified',
            icon: 'shield-checkmark' as const,
            tone: 'success' as const,
          }
        : {
            id: 'trust',
            label: DEFAULT_MASTER_PROFILE.trustLabel,
            icon: 'shield-checkmark' as const,
            tone: 'primary' as const,
          },
    ];

    return {
      ...DEFAULT_MASTER_PROFILE,
      fullName,
      phoneLabel,
      avatarUri,
      walletBalanceLabel,
      ratingLabel,
      badges,
      trustLabel: identityVerified ? 'Verified' : DEFAULT_MASTER_PROFILE.trustLabel,
    };
  }, [
    identityVerified,
    isCorporateVerified,
    localAvatarUri,
    sheetRow?.mobile,
    sheetRow?.profilePicture,
    sheetRow?.userName,
    user?.avatarUri,
    user?.fullName,
    user?.phone,
    walletBalanceLabel,
  ]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.home);
  }, [router]);

  const openCameraSheet = useCallback(() => {
    triggerLightHaptic();
    // Allow reopening even if a previous upload is in flight.
    setUploadSheetVisible(true);
  }, []);

  const closeCameraSheet = useCallback(() => {
    setUploadSheetVisible(false);
  }, []);

  const applyAvatar = useCallback(
    (document: UploadedDocument) => {
      const generation = ++uploadGenerationRef.current;
      setLocalAvatarUri(document.uri);

      void (async () => {
        const uploaded = await uploadLocalFile({
          uri: document.uri,
          fileName: document.fileName ?? `profile_${Date.now()}.jpg`,
          mimeType: document.mimeType ?? 'image/jpeg',
        });

        if (generation !== uploadGenerationRef.current) {
          return;
        }

        if (!uploaded) {
          // Revert optimistic preview if Cloudinary failed / cancelled.
          setLocalAvatarUri(null);
          return;
        }

        setLocalAvatarUri(uploaded.secureUrl);
        const current = authSession.getUser();
        if (current) {
          authSession.setSession(authSession.getToken() ?? '', {
            ...current,
            avatarUri: uploaded.secureUrl,
          });
        }

        // UserDetails sheet sync happens in saveProfilePhotoUrl (onUploaded).
        triggerSuccessHaptic();
      })();
    },
    [uploadLocalFile],
  );

  const openAddRedeem = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.wallet);
  }, [router]);

  const openPaymentMethods = useCallback(() => {
    triggerLightHaptic();
    showAppAlert(PROFILE_SCREEN.comingSoonTitle, PROFILE_SCREEN.comingSoonMessage);
  }, []);

  const onMenuPress = useCallback(
    (id: ProfileMenuActionId) => {
      triggerLightHaptic();

      if (id === 'verify') {
        router.push(ROUTES.verifyAadhaar);
        return;
      }

      if (id === 'legal') {
        router.push(ROUTES.legalPolicies);
        return;
      }

      if (id === 'support') {
        router.push(ROUTES.helpSupport);
        return;
      }

      if (id === 'refer') {
        router.push(ROUTES.referEarn);
        return;
      }

      if (id === 'garage') {
        router.push(ROUTES.myGarage);
        return;
      }

      if (id === 'safety') {
        router.push(ROUTES.safetyHub);
        return;
      }

      showAppAlert(PROFILE_SCREEN.comingSoonTitle, PROFILE_SCREEN.comingSoonMessage);
    },
    [router],
  );

  const openLogout = useCallback(() => {
    triggerLightHaptic();
    setLogoutVisible(true);
  }, []);

  const closeLogout = useCallback(() => {
    setLogoutVisible(false);
  }, []);

  const confirmLogout = useCallback(() => {
    triggerLightHaptic();
    setLogoutVisible(false);
    authSession.clear();
    router.replace(ROUTES.welcome);
  }, [router]);

  return {
    profile,
    menuItems,
    uploadSheetVisible,
    avatarUploading,
    logoutVisible,
    openCameraSheet,
    closeCameraSheet,
    applyAvatar,
    goBack,
    openAddRedeem,
    openPaymentMethods,
    onMenuPress,
    openLogout,
    closeLogout,
    confirmLogout,
  };
};

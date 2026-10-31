import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';

import { ROUTES } from '@/config';
import { bankAccountsSheetStore } from '@/DemoData';
import { authService } from '@/features/auth/services';
import { clearGetMeHydration } from '@/features/auth/services/getMeHydration';
import { unregisterCurrentPushDevice } from '@/features/notifications/push/pushRegistration';
import { saveProfilePhotoUrl } from '@/features/media';
import { savedUpiStore } from '@/features/ride-search/store';
import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import { getCorporateIdentityStatus } from '../api/corporateIdentity.api';
import { getEmailVerificationStatus } from '../api/emailVerification.api';
import { isCorporateVerifiedStatus } from '../utils/corporateIdentity.mapper';
import { useUpload } from '@/hooks/useUpload';
import type { UploadedDocument } from '@/shared/components';
import { useSessionUser } from '@/shared/hooks';
import { formatPhoneNumber, triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { appModeStore, authSession, showAppAlert } from '@/store';
import { couponActorContextFromAppMode } from '@/features/coupons/utils/couponAudience';
import {
  DEFAULT_MASTER_PROFILE,
  DEFAULT_PROFILE_AVATAR,
  PROFILE_MENU_ITEMS,
  PROFILE_SCREEN,
} from '../constants';
import { userMeSummaryStore } from '../store/userMeSummaryStore';
import type {
  MasterProfileData,
  ProfileMenuActionId,
  ProfileMenuItem,
} from '../types';
import {
  formatOverallRatingLabel,
  mapDriverEarningsToProfile,
} from '../utils/mapGetMeProfile';
import { formatCoinsLabel } from '../utils/walletCoin';
import { formatPaymentMethodsSubtitle } from '../utils/paymentMethodsSummary';
import { useMyVerification } from './useMyVerification';
import { useWalletBalance } from './useWalletBalance';

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
  openEditProfile: () => void;
  openVerifyEmail: () => void;
  openRatings: () => void;
  onMenuPress: (id: ProfileMenuActionId) => void;
  openLogout: () => void;
  closeLogout: () => void;
  confirmLogout: () => void;
}

export const useMasterProfile = (): UseMasterProfileResult => {
  const router = useRouter();
  const user = useSessionUser();
  const { summary: walletSummary } = useWalletBalance();
  const { verifications } = useMyVerification();
  const identityVerified = verifications?.identity?.status === 'VERIFIED';
  const [email, setEmail] = useState<string | null>(() => user?.email?.trim() || null);
  const [emailVerified, setEmailVerified] = useState(false);

  const menuItems = useMemo((): readonly ProfileMenuItem[] => PROFILE_MENU_ITEMS, []);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [isCorporateVerified, setIsCorporateVerified] = useState(false);
  const meSummary = useSyncExternalStore(
    userMeSummaryStore.subscribe,
    userMeSummaryStore.getSnapshot,
    userMeSummaryStore.getSnapshot,
  );
  const savedUpis = useSyncExternalStore(savedUpiStore.subscribe, savedUpiStore.get);
  const bankAccounts = useSyncExternalStore(
    bankAccountsSheetStore.subscribe,
    bankAccountsSheetStore.getForCurrentUserSnapshot,
  );
  const uploadGenerationRef = useRef(0);

  const { uploadLocalFile, isUploading: avatarUploading, cancelUpload } = useUpload({
    kind: 'profile',
    onUploaded: saveProfilePhotoUrl,
    showAlerts: true,
  });

  useEffect(
    () => () => {
      cancelUpload();
    },
    [cancelUpload],
  );

  useFocusEffect(
    useCallback(() => {
      if (!authSession.getToken()) {
        return;
      }
      void (async () => {
        // Soft hydrate — uses shared GET /users/me cache when fresh.
        await authService.hydrateAuthenticatedUser().catch(() => undefined);
        try {
          const emailResult = await resourceCache.query({
            key: cacheKeys.emailVerification.status(),
            staleTime: CACHE_STALE_TIMES.USER_PROFILE,
            fetcher: getEmailVerificationStatus,
          });
          setEmail(
            emailResult.data.email?.trim() || authSession.getUser()?.email?.trim() || null,
          );
          setEmailVerified(Boolean(emailResult.data.verified));
        } catch {
          setEmail(authSession.getUser()?.email?.trim() || null);
          setEmailVerified(false);
        }

        try {
          const corporate = await resourceCache.query({
            key: cacheKeys.corporateIdentity.status(),
            staleTime: CACHE_STALE_TIMES.CORPORATE_IDENTITY,
            fetcher: getCorporateIdentityStatus,
          });
          setIsCorporateVerified(isCorporateVerifiedStatus(corporate.data.status));
        } catch {
          setIsCorporateVerified(false);
        }
      })();
    }, []),
  );

  const ratingLabel = useMemo(
    () => formatOverallRatingLabel(meSummary.ratings),
    [meSummary.ratings],
  );

  const walletBalanceLabel = useMemo(() => {
    if (walletSummary) {
      return formatCoinsLabel(walletSummary.balanceCoins);
    }
    return DEFAULT_MASTER_PROFILE.walletBalanceLabel;
  }, [walletSummary]);

  const earningsView = useMemo(
    () => mapDriverEarningsToProfile(meSummary.driverEarnings),
    [meSummary.driverEarnings],
  );

  const paymentMethodsSubtitle = useMemo(
    () => formatPaymentMethodsSubtitle(savedUpis[0], bankAccounts[0]),
    [bankAccounts, savedUpis],
  );

  const profile = useMemo((): MasterProfileData => {
    const fullName =
      user?.fullName?.trim() ||
      DEFAULT_MASTER_PROFILE.fullName;
    const phoneLabel = formatProfilePhoneLabel(user?.phone, null);
    const avatarUri =
      localAvatarUri ??
      (user?.avatarUri?.trim() ||
        DEFAULT_MASTER_PROFILE.avatarUri ||
        DEFAULT_PROFILE_AVATAR);

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
      { id: 'rating', label: ratingLabel, icon: 'star' as const, tone: 'neutral' as const, pressable: true },
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
      email: email?.trim() || user?.email?.trim() || null,
      emailVerified,
      avatarUri,
      walletBalanceLabel,
      paymentMethodsSubtitle,
      ratingLabel,
      driverEarningsLabel:
        earningsView?.driverEarningsLabel ?? DEFAULT_MASTER_PROFILE.driverEarningsLabel,
      earningBreakdown:
        earningsView?.earningBreakdown ?? DEFAULT_MASTER_PROFILE.earningBreakdown,
      earningInsight: earningsView?.earningInsight || DEFAULT_MASTER_PROFILE.earningInsight,
      badges,
      trustLabel: identityVerified ? 'Verified' : DEFAULT_MASTER_PROFILE.trustLabel,
    };
  }, [
    email,
    emailVerified,
    earningsView,
    identityVerified,
    isCorporateVerified,
    localAvatarUri,
    user?.avatarUri,
    user?.email,
    user?.fullName,
    user?.phone,
    walletBalanceLabel,
    paymentMethodsSubtitle,
    ratingLabel,
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

        // Profile API + UserDetails sheet sync happen in saveProfilePhotoUrl (onUploaded).
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
    router.push(ROUTES.paymentMethods);
  }, [router]);

  const openEditProfile = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.editProfile);
  }, [router]);

  const openVerifyEmail = useCallback(() => {
    triggerLightHaptic();
    if (!email?.trim() && !user?.email?.trim()) {
      showAppAlert(
        'Email required',
        'Add an email on Edit Profile before verifying.',
      );
      return;
    }
    router.push(ROUTES.verifyEmail);
  }, [email, router, user?.email]);

  const openRatings = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.myRatings);
  }, [router]);

  const onMenuPress = useCallback(
    (id: ProfileMenuActionId) => {
      triggerLightHaptic();

      if (id === 'editProfile') {
        openEditProfile();
        return;
      }

      if (id === 'ratings') {
        openRatings();
        return;
      }

      if (id === 'verify') {
        router.push(ROUTES.identityVerification);
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

      if (id === 'promotions') {
        const couponContext =
          couponActorContextFromAppMode(appModeStore.get()) === 'DRIVER'
            ? 'driver'
            : 'rider';
        router.push({
          pathname: ROUTES.promotionsCoupons,
          params: { couponContext },
        });
        return;
      }

      if (id === 'safety') {
        router.push(ROUTES.safetyHub);
        return;
      }

      showAppAlert(PROFILE_SCREEN.comingSoonTitle, PROFILE_SCREEN.comingSoonMessage);
    },
    [openEditProfile, openRatings, router],
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
    void (async () => {
      await unregisterCurrentPushDevice();
      clearGetMeHydration();
      authSession.clear();
      router.replace(ROUTES.welcome);
    })();
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
    openEditProfile,
    openVerifyEmail,
    openRatings,
    onMenuPress,
    openLogout,
    closeLogout,
    confirmLogout,
  };
};

import React, { Fragment, useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  UploadDocumentSheet,
  BhaiWayCoinIcon,
  AppText as Text,
} from '@/shared/components';
import { LogoutConfirmationModal, ProfilePhotoPreviewModal } from '@/features/profile/components';
import { PROFILE_SCREEN } from '@/features/profile/constants';
import { useMasterProfile } from '@/features/profile/hooks';
import type { ProfileBadge, ProfileMenuItem } from '@/features/profile/types';
import { triggerLightHaptic } from '@/shared/utils';
import { profileTokens, styles } from './MasterProfileScreen.styles';
import { useProfileHeroLayout } from './useProfileHeroLayout';

const PROFILE_PICKER_OPTIONS = {
  allowsEditing: true,
  aspect: [1, 1] as [number, number],
  quality: 0.8,
};

const badgeIconName = (icon: ProfileBadge['icon']): keyof typeof Ionicons.glyphMap => {
  if (icon === 'verified') return 'checkmark-circle';
  if (icon === 'close-circle') return 'close-circle';
  if (icon === 'star') return 'star';
  return 'shield-checkmark';
};

const badgeColor = (tone: ProfileBadge['tone']): string => {
  if (tone === 'success') return profileTokens.SUCCESS;
  if (tone === 'danger') return profileTokens.DANGER;
  if (tone === 'primary') return profileTokens.PRIMARY;
  return profileTokens.ON_SURFACE_VARIANT;
};

const badgeLabelStyle = (tone: ProfileBadge['tone']) => {
  if (tone === 'success') return styles.badgeSuccess;
  if (tone === 'danger') return styles.badgeDanger;
  if (tone === 'primary') return styles.badgePrimary;
  return styles.badgeNeutral;
};

type MenuVisual = { iconColor: string; bgColor: string };

const MENU_VISUALS: Record<ProfileMenuItem['id'], MenuVisual> = {
  editProfile: { iconColor: '#374BB1', bgColor: '#E8EBFA' },
  ratings: { iconColor: '#D97706', bgColor: '#FFFBEB' },
  verify: { iconColor: '#0E7490', bgColor: '#E6F6FA' },
  garage: { iconColor: '#7C3AED', bgColor: '#F0EBFF' },
  promotions: { iconColor: '#C2410C', bgColor: '#FFF7ED' },
  refer: { iconColor: '#16A34A', bgColor: '#DCFCE7' },
  safety: { iconColor: '#DC2626', bgColor: '#FEE2E2' },
  support: { iconColor: '#4B61C4', bgColor: '#E8EBFA' },
  legal: { iconColor: '#64748B', bgColor: '#F1F5F9' },
};

export const MasterProfileScreen = () => {
  const {
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
    openChangeEmail,
    openRatings,
    onMenuPress,
    openLogout,
    closeLogout,
    confirmLogout,
  } = useMasterProfile();

  const [photoPreviewVisible, setPhotoPreviewVisible] = useState(false);
  const heroLayout = useProfileHeroLayout();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleEditProfile = useCallback(() => {
    triggerLightHaptic();
    openEditProfile();
  }, [openEditProfile]);

  const handleVerifyEmail = useCallback(() => {
    triggerLightHaptic();
    openVerifyEmail();
  }, [openVerifyEmail]);

  const handleChangeEmail = useCallback(() => {
    triggerLightHaptic();
    openChangeEmail();
  }, [openChangeEmail]);

  const handleWallet = useCallback(() => {
    triggerLightHaptic();
    openAddRedeem();
  }, [openAddRedeem]);

  const handlePaymentMethods = useCallback(() => {
    triggerLightHaptic();
    openPaymentMethods();
  }, [openPaymentMethods]);

  const handleCamera = useCallback(() => {
    triggerLightHaptic();
    openCameraSheet();
  }, [openCameraSheet]);

  const handleAvatarPress = useCallback(() => {
    triggerLightHaptic();
    if (profile.avatarUri) {
      setPhotoPreviewVisible(true);
      return;
    }
    openCameraSheet();
  }, [openCameraSheet, profile.avatarUri]);

  const closePhotoPreview = useCallback(() => {
    setPhotoPreviewVisible(false);
  }, []);

  const handleLogout = useCallback(() => {
    triggerLightHaptic();
    openLogout();
  }, [openLogout]);

  const visibleMenuItems = menuItems;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={['#4B61C4', '#374BB1', '#2B3A8C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroGradient,
              {
                paddingTop: heroLayout.headerPaddingTop,
                minHeight: heroLayout.gradientMinHeight,
              },
            ]}
          >
            <View style={styles.heroGlowOne} pointerEvents="none" />
            <View style={styles.heroGlowTwo} pointerEvents="none" />

            <View
              style={styles.heroTopBar}
              onLayout={(event) => heroLayout.onHeaderLayout(event.nativeEvent.layout.height)}
            >
              <Pressable
                style={({ pressed }) => [styles.heroBackBtn, pressed && { opacity: 0.8 }]}
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={22} color={profileTokens.ON_PRIMARY} />
              </Pressable>
              <Text style={styles.heroTitle} accessibilityRole="header" numberOfLines={1}>
                {PROFILE_SCREEN.title}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.heroEditBtn, pressed && { opacity: 0.8 }]}
                onPress={handleEditProfile}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="create-outline" size={16} color={profileTokens.ON_PRIMARY} />
                <Text style={styles.heroEditLabel}>Edit</Text>
              </Pressable>
            </View>

            <View
              style={[styles.heroTailSpacer, { minHeight: heroLayout.heroTailSpacer }]}
              pointerEvents="none"
            />
          </LinearGradient>

          <View
            style={[
              styles.profileCard,
              {
                marginTop: -heroLayout.cardOverlap,
                paddingTop: heroLayout.cardPaddingTop,
              },
            ]}
          >
            <View
              style={[
                styles.avatarOuter,
                {
                  top: -heroLayout.avatarRise,
                  width: heroLayout.avatarOuterSize,
                  height: heroLayout.avatarOuterSize,
                },
              ]}
            >
              <Pressable
                onPress={handleAvatarPress}
                accessibilityRole="button"
                accessibilityLabel={
                  profile.avatarUri
                    ? `View ${profile.fullName} profile photo`
                    : 'Add profile photo'
                }
              >
                <View
                  style={[
                    styles.avatarRing,
                    {
                      width: heroLayout.avatarOuterSize,
                      height: heroLayout.avatarOuterSize,
                      borderRadius: heroLayout.avatarRingRadius,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.avatarInner,
                      { borderRadius: heroLayout.avatarInnerRadius },
                    ]}
                  >
                    {profile.avatarUri ? (
                      <Image
                        source={{ uri: profile.avatarUri }}
                        style={styles.avatarImage}
                        accessibilityIgnoresInvertColors
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons
                          name="person"
                          size={Math.round(heroLayout.avatarOuterSize * 0.46)}
                          color={profileTokens.PRIMARY}
                        />
                      </View>
                    )}
                    {avatarUploading ? (
                      <View
                        style={[
                          styles.avatarUploadOverlay,
                          { borderRadius: heroLayout.avatarInnerRadius },
                        ]}
                      >
                        <ActivityIndicator color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.cameraFab, pressed && { transform: [{ scale: 0.92 }] }]}
                onPress={handleCamera}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
              >
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.phone}>{profile.phoneLabel}</Text>

            <View style={styles.emailCard}>
              <View style={styles.emailCardTop}>
                <View style={styles.emailIconWrap}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={profileTokens.PRIMARY}
                  />
                </View>
                <View style={styles.emailTextBlock}>
                  <Text style={styles.emailLabel}>{PROFILE_SCREEN.emailLabel}</Text>
                  <Text
                    style={[
                      styles.emailValue,
                      !profile.email?.trim() && styles.emailValueMissing,
                    ]}
                    numberOfLines={1}
                  >
                    {profile.email?.trim() || PROFILE_SCREEN.emailMissingLabel}
                  </Text>
                </View>
                {profile.email?.trim() ? (
                  <View
                    style={[
                      styles.emailStatusPill,
                      profile.emailVerified
                        ? styles.emailStatusPillVerified
                        : styles.emailStatusPillUnverified,
                    ]}
                    accessibilityLiveRegion="polite"
                  >
                    <Ionicons
                      name={
                        profile.emailVerified
                          ? 'checkmark-circle'
                          : 'alert-circle'
                      }
                      size={12}
                      color={
                        profile.emailVerified
                          ? profileTokens.SUCCESS
                          : profileTokens.WARNING
                      }
                    />
                    <Text
                      style={[
                        styles.emailStatusText,
                        profile.emailVerified
                          ? styles.emailStatusTextVerified
                          : styles.emailStatusTextUnverified,
                      ]}
                    >
                      {profile.emailVerified
                        ? PROFILE_SCREEN.emailVerifiedLabel
                        : PROFILE_SCREEN.emailUnverifiedLabel}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[styles.emailStatusPill, styles.emailStatusPillMissing]}
                    accessibilityLiveRegion="polite"
                  >
                    <Ionicons
                      name="close-circle"
                      size={12}
                      color={profileTokens.DANGER}
                    />
                    <Text
                      style={[
                        styles.emailStatusText,
                        styles.emailStatusTextMissing,
                      ]}
                    >
                      Missing
                    </Text>
                  </View>
                )}
              </View>

              {!profile.email?.trim() ? (
                <View style={styles.emailActionRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.verifyEmailButton,
                      pressed && { opacity: 0.88 },
                    ]}
                    onPress={handleEditProfile}
                    accessibilityRole="button"
                    accessibilityLabel={PROFILE_SCREEN.addEmailLabel}
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                    <Text style={styles.verifyEmailButtonLabel}>
                      {PROFILE_SCREEN.addEmailLabel}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emailActionRow}>
                  {!profile.emailVerified ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.verifyEmailButton,
                        pressed && { opacity: 0.88 },
                      ]}
                      onPress={handleVerifyEmail}
                      accessibilityRole="button"
                      accessibilityLabel={PROFILE_SCREEN.verifyEmailLabel}
                    >
                      <Ionicons name="shield-checkmark-outline" size={14} color="#FFFFFF" />
                      <Text style={styles.verifyEmailButtonLabel}>
                        {PROFILE_SCREEN.verifyEmailLabel}
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={({ pressed }) => [
                      styles.changeEmailButton,
                      pressed && { opacity: 0.88 },
                    ]}
                    onPress={handleChangeEmail}
                    accessibilityRole="button"
                    accessibilityLabel={PROFILE_SCREEN.changeEmailLabel}
                  >
                    <Ionicons name="mail-outline" size={14} color={profileTokens.PRIMARY} />
                    <Text style={styles.changeEmailButtonLabel}>
                      {PROFILE_SCREEN.changeEmailLabel}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View style={styles.badgeRow}>
              {profile.badges.map((badge) => {
                const content = (
                  <View style={styles.badgePill}>
                    <Ionicons
                      name={badgeIconName(badge.icon)}
                      size={14}
                      color={badgeColor(badge.tone)}
                    />
                    <Text style={[styles.badgeLabel, badgeLabelStyle(badge.tone)]}>
                      {badge.label}
                    </Text>
                  </View>
                );

                if (badge.pressable) {
                  return (
                    <Pressable
                      key={badge.id}
                      onPress={() => {
                        triggerLightHaptic();
                        openRatings();
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Rating ${badge.label}`}
                    >
                      {content}
                    </Pressable>
                  );
                }

                return <View key={badge.id}>{content}</View>;
              })}
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.quickActionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.quickActionCard,
                styles.quickActionWallet,
                pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleWallet}
              accessibilityRole="button"
              accessibilityLabel={`${PROFILE_SCREEN.walletTitle}. ${PROFILE_SCREEN.addRedeemLabel}`}
            >
              <View style={[styles.quickActionIconWrap, styles.quickActionWalletIcon]}>
                <BhaiWayCoinIcon size={22} />
              </View>
              <View>
                <Text style={styles.quickActionLabel}>Wallet</Text>
                <View style={styles.quickActionValueRow}>
                  <Text style={styles.quickActionValue}>{profile.walletBalanceLabel}</Text>
                </View>
                <Text style={styles.quickActionHint}>{PROFILE_SCREEN.addRedeemLabel}</Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickActionCard,
                styles.quickActionPayment,
                pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handlePaymentMethods}
              accessibilityRole="button"
              accessibilityLabel={PROFILE_SCREEN.paymentMethodsTitle}
            >
              <View style={[styles.quickActionIconWrap, styles.quickActionPaymentIcon]}>
                <Ionicons name="card-outline" size={22} color="#6C4CE8" />
              </View>
              <View>
                <Text style={styles.quickActionLabel}>Payments</Text>
                <Text style={styles.quickActionValue} numberOfLines={2}>
                  {PROFILE_SCREEN.paymentMethodsTitle}
                </Text>
                <Text style={styles.quickActionHint} numberOfLines={1}>
                  {profile.paymentMethodsSubtitle}
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.earningsCard}>
            <LinearGradient
              colors={['#3D52B8', '#2B3A8C', '#1E2A6E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.earningsGradient}
            >
              <View style={styles.earningsHeader}>
                <View style={styles.earningsTitleRow}>
                  <Ionicons name="trending-up" size={18} color={profileTokens.GOLD} />
                  <Text style={styles.earningsTitle}>{PROFILE_SCREEN.driverEarningsTitle}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.earningsTotal}>{profile.driverEarningsLabel}</Text>
                  <Text style={styles.earningsTotalSuffix}>Coins earned</Text>
                </View>
              </View>

              <View style={styles.earningsStatsRow}>
                {profile.earningBreakdown.map((row, index) => (
                  <Fragment key={row.label}>
                    {index > 0 ? <View style={styles.earningsStatDivider} /> : null}
                    <View style={styles.earningsStat}>
                      <Text style={styles.earningsStatLabel} numberOfLines={2}>
                        {row.label}
                      </Text>
                      <Text style={styles.earningsStatValue}>{row.amountLabel}</Text>
                    </View>
                  </Fragment>
                ))}
              </View>

              {profile.earningInsight ? (
                <View style={styles.insightCard}>
                  <Ionicons name="bulb" size={18} color={profileTokens.GOLD} />
                  <Text style={styles.insightText}>
                    <Text style={styles.insightBold}>{PROFILE_SCREEN.earningInsightPrefix} </Text>
                    {profile.earningInsight}
                  </Text>
                </View>
              ) : null}
            </LinearGradient>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Account & Settings</Text>
            <View style={styles.menuCard}>
              {visibleMenuItems.map((item, index) => {
                const visual = MENU_VISUALS[item.id];
                return (
                  <Fragment key={item.id}>
                    {index > 0 ? <View style={styles.menuDivider} /> : null}
                    <Pressable
                      style={({ pressed }) => [
                        styles.menuRow,
                        pressed && styles.menuRowPressed,
                      ]}
                      onPress={() => {
                        triggerLightHaptic();
                        onMenuPress(item.id);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.title}. ${item.subtitle}`}
                    >
                      <View style={[styles.menuIcon, { backgroundColor: visual.bgColor }]}>
                        <Ionicons name={item.icon} size={22} color={visual.iconColor} />
                      </View>
                      <View style={styles.menuMeta}>
                        <Text style={styles.menuTitle}>{item.title}</Text>
                        <Text style={styles.menuSubtitle} numberOfLines={2}>
                          {item.subtitle}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={profileTokens.MUTED}
                        style={styles.menuChevron}
                      />
                    </Pressable>
                  </Fragment>
                );
              })}
            </View>
          </View>

          <View style={styles.bottomActions}>
            <Pressable
              style={({ pressed }) => [styles.logOutButton, pressed && { opacity: 0.88 }]}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel={PROFILE_SCREEN.logOutLabel}
            >
              <Ionicons name="log-out-outline" size={20} color={profileTokens.DANGER} />
              <Text style={styles.logOutLabel}>{PROFILE_SCREEN.logOutLabel}</Text>
            </Pressable>
            <Text style={styles.versionLabel}>{PROFILE_SCREEN.versionLabel}</Text>
          </View>
        </View>
      </ScrollView>

      <AppFooter activeTab="profile" />

      <UploadDocumentSheet
        visible={uploadSheetVisible}
        onClose={closeCameraSheet}
        onPicked={applyAvatar}
        title={PROFILE_SCREEN.changePhotoTitle}
        subtitle={PROFILE_SCREEN.changePhotoSubtitle}
        imagePickerOptions={PROFILE_PICKER_OPTIONS}
      />

      <LogoutConfirmationModal
        visible={logoutVisible}
        onConfirm={confirmLogout}
        onCancel={closeLogout}
      />

      <ProfilePhotoPreviewModal
        visible={photoPreviewVisible}
        imageUri={profile.avatarUri}
        name={profile.fullName}
        onClose={closePhotoPreview}
      />
    </SafeAreaView>
  );
};

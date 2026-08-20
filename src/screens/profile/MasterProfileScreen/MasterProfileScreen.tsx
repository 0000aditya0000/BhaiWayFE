import React, { Fragment } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, UploadDocumentSheet, BhaiWayCoinIcon, AppText as Text } from '@/shared/components';
import { LogoutConfirmationModal } from '@/features/profile/components';
import { PROFILE_SCREEN } from '@/features/profile/constants';
import { useMasterProfile } from '@/features/profile/hooks';
import type { ProfileBadge } from '@/features/profile/types';
import { profileTokens, styles } from './MasterProfileScreen.styles';

const PROFILE_PICKER_OPTIONS = {
  allowsEditing: true,
  aspect: [1, 1] as [number, number],
  quality: 0.8,
};

const badgeIconName = (icon: ProfileBadge['icon']): keyof typeof Ionicons.glyphMap => {
  if (icon === 'verified') {
    return 'checkmark-circle';
  }
  if (icon === 'close-circle') {
    return 'close-circle';
  }
  if (icon === 'star') {
    return 'star';
  }
  return 'shield-checkmark';
};

const badgeColor = (tone: ProfileBadge['tone']): string => {
  if (tone === 'success') {
    return profileTokens.SUCCESS;
  }
  if (tone === 'danger') {
    return profileTokens.DANGER;
  }
  if (tone === 'primary') {
    return profileTokens.PRIMARY;
  }
  return profileTokens.ON_SURFACE_VARIANT;
};

const badgeLabelStyle = (tone: ProfileBadge['tone']) => {
  if (tone === 'success') {
    return styles.badgeSuccess;
  }
  if (tone === 'danger') {
    return styles.badgeDanger;
  }
  if (tone === 'primary') {
    return styles.badgePrimary;
  }
  return styles.badgeNeutral;
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
    onMenuPress,
    openLogout,
    closeLogout,
    confirmLogout,
  } = useMasterProfile();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={profileTokens.PRIMARY} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {PROFILE_SCREEN.title}
        </Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identitySection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              {profile.avatarUri ? (
                <Image
                  source={{ uri: profile.avatarUri }}
                  style={styles.avatarImage}
                  accessibilityIgnoresInvertColors
                  accessibilityLabel={`${profile.fullName} profile photo`}
                />
              ) : (
                <View style={[styles.avatarImage, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="person" size={56} color={profileTokens.PRIMARY} />
                </View>
              )}
              {avatarUploading ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    borderRadius: 999,
                    backgroundColor: 'rgba(55, 75, 177, 0.45)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : null}
            </View>
            <Pressable
              style={({ pressed }) => [styles.cameraButton, pressed && { transform: [{ scale: 0.95 }] }]}
              onPress={openCameraSheet}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.nameBlock}>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.phone}>{profile.phoneLabel}</Text>
          </View>

          <View style={styles.badgeRow}>
            {profile.badges.map((badge, index) => (
              <Fragment key={badge.id}>
                {index > 0 ? <View style={styles.badgeDivider} /> : null}
                <View style={styles.badgeItem}>
                  <Ionicons
                    name={badgeIconName(badge.icon)}
                    size={16}
                    color={badgeColor(badge.tone)}
                  />
                  <Text style={[styles.badgeLabel, badgeLabelStyle(badge.tone)]}>{badge.label}</Text>
                </View>
              </Fragment>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Pressable
            style={styles.cardHeaderRow}
            onPress={openAddRedeem}
            accessibilityRole="button"
            accessibilityLabel={`${PROFILE_SCREEN.walletTitle}. ${PROFILE_SCREEN.addRedeemLabel}`}
          >
            <View>
              <Text style={styles.cardLabel}>{PROFILE_SCREEN.walletTitle}</Text>
              <View style={styles.walletBalanceRow}>
                <BhaiWayCoinIcon size={22} />
                <Text style={styles.cardValue}>{profile.walletBalanceLabel}</Text>
              </View>
            </View>
            <Text style={styles.linkButton}>{PROFILE_SCREEN.addRedeemLabel}</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.paymentRow, pressed && { opacity: 0.85 }]}
            onPress={openPaymentMethods}
            accessibilityRole="button"
            accessibilityLabel={PROFILE_SCREEN.paymentMethodsTitle}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIcon}>
                <Ionicons name="wallet-outline" size={22} color={profileTokens.PRIMARY} />
              </View>
              <View>
                <Text style={styles.paymentTitle}>{PROFILE_SCREEN.paymentMethodsTitle}</Text>
                <Text style={styles.paymentSubtitle}>{profile.paymentMethodsSubtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#747686" />
          </Pressable>
        </View>

        <View style={styles.card}>
          <View>
            <Text style={styles.cardLabelMuted}>{PROFILE_SCREEN.driverEarningsTitle}</Text>
            <Text style={styles.cardValue}>{profile.driverEarningsLabel}</Text>
          </View>

          <View style={styles.softDivider} />

          <View style={styles.breakdownList}>
            {profile.earningBreakdown.map((row) => (
              <View key={row.label} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{row.label}</Text>
                <Text style={styles.breakdownValue}>{row.amountLabel}</Text>
              </View>
            ))}
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightRow}>
              <Ionicons name="bulb-outline" size={20} color={profileTokens.SUCCESS} />
              <Text style={styles.insightText}>
                <Text style={styles.insightBold}>{PROFILE_SCREEN.earningInsightPrefix} </Text>
                {profile.earningInsight}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 ? <View style={styles.menuDivider} /> : null}
              <Pressable
                style={({ pressed }) => [
                  styles.menuRow,
                  pressed && { backgroundColor: profileTokens.SURFACE_LOW },
                ]}
                onPress={() => onMenuPress(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.subtitle}`}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={22} color={profileTokens.SECONDARY} />
                </View>
                <View style={styles.menuMeta}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#747686" />
              </Pressable>
            </Fragment>
          ))}
        </View>

        <View style={styles.bottomActions}>
          <Pressable
            style={({ pressed }) => [
              styles.logOutButton,
              pressed && { backgroundColor: 'rgba(220, 38, 38, 0.08)' },
            ]}
            onPress={openLogout}
            accessibilityRole="button"
            accessibilityLabel={PROFILE_SCREEN.logOutLabel}
          >
            <Text style={styles.logOutLabel}>{PROFILE_SCREEN.logOutLabel}</Text>
          </Pressable>
          <Text style={styles.versionLabel}>{PROFILE_SCREEN.versionLabel}</Text>
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
    </SafeAreaView>
  );
};

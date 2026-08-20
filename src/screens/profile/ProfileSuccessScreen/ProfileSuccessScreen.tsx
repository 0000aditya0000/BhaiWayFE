import React, { useCallback, useEffect } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ROUTES } from '@/config';
import { AppFooter, IconButton, BhaiWayCoinIcon, AppText as Text } from '@/shared/components';
import { triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { PROFILE_SUCCESS_SCREEN } from '@/features/profile/constants';
import { useProfileSuccess } from '@/features/profile/hooks';
import type { ProfileSuccessKind } from '@/features/profile/types';
import { styles, successTokens } from './ProfileSuccessScreen.styles';

interface ProfileSuccessScreenProps {
  defaultKind?: ProfileSuccessKind;
}

export const ProfileSuccessScreen = ({
  defaultKind = 'bank-account-added',
}: ProfileSuccessScreenProps) => {
  const router = useRouter();
  const {
    kind,
    brandTitle,
    title,
    subtitle,
    amountLabel,
    bankName,
    bankLabel,
    maskedNumber,
    referenceNumber,
    primaryLabel,
    secondaryLabel,
    avatarUri,
    copied,
    onPrimary,
    onSecondary,
    copyReference,
    openProfile,
    goBack,
  } = useProfileSuccess(defaultKind);

  const isWithdrawal = kind === 'withdrawal-initiated';
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const pulse = useSharedValue(1);
  const floatA = useSharedValue(0);
  const floatB = useSharedValue(0);

  useEffect(() => {
    triggerSuccessHaptic();
    scale.value = withSpring(1, { damping: 12, stiffness: 140 });
    opacity.value = withTiming(1, { duration: 280 });
    pulse.value = withRepeat(withTiming(1.35, { duration: 900 }), -1, true);
    floatA.value = withRepeat(
      withSequence(withTiming(-10, { duration: 1500 }), withTiming(0, { duration: 1500 })),
      -1,
      false,
    );
    floatB.value = withDelay(
      750,
      withRepeat(
        withSequence(withTiming(-10, { duration: 1500 }), withTiming(0, { duration: 1500 })),
        -1,
        false,
      ),
    );
  }, [floatA, floatB, opacity, pulse, scale]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));

  const floatAStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatA.value }, { rotate: `${floatA.value * -0.3}deg` }],
  }));

  const floatBStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatB.value }, { rotate: `${floatB.value * 0.3}deg` }],
  }));

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleMenu = useCallback(() => {
    triggerLightHaptic();
    router.replace(ROUTES.home);
  }, [router]);

  const handleNotifications = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.notifications);
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {isWithdrawal ? (
          <>
            <View style={styles.headerLeft}>
              <IconButton
                icon="arrow-back"
                onPress={handleBack}
                color={successTokens.PRIMARY}
                accessibilityLabel="Go back"
              />
            </View>
            <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
              {brandTitle}
            </Text>
            <IconButton
              icon="notifications-outline"
              onPress={handleNotifications}
              color={successTokens.PRIMARY}
              accessibilityLabel="Notifications"
            />
          </>
        ) : (
          <>
            <View style={styles.headerLeft}>
              <IconButton
                icon="menu"
                onPress={handleMenu}
                color={successTokens.PRIMARY}
                accessibilityLabel="Open home"
              />
            </View>
            <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
              {brandTitle}
            </Text>
            <Pressable
              style={styles.avatarButton}
              onPress={openProfile}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                accessibilityIgnoresInvertColors
              />
            </Pressable>
          </>
        )}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.glow} pointerEvents="none" />
        <Animated.View style={[styles.card, cardStyle]}>
          {isWithdrawal ? (
            <View style={styles.illustrationWrap}>
              <View style={styles.illustrationStage}>
                <View style={styles.bankBlock}>
                  <Ionicons name="business" size={48} color={successTokens.PRIMARY} />
                </View>
                <Animated.View style={[styles.moneyNodeLarge, floatAStyle]}>
                  <Ionicons name="cash-outline" size={28} color={successTokens.PRIMARY} />
                </Animated.View>
                <Animated.View style={[styles.moneyNodeSmall, floatBStyle]}>
                  <BhaiWayCoinIcon size={22} />
                </Animated.View>
              </View>
            </View>
          ) : (
            <View style={styles.iconWrap}>
              <Animated.View style={[styles.pulseRing, pulseStyle]} />
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={48} color={successTokens.ON_PRIMARY} />
              </View>
            </View>
          )}

          <Text style={[styles.title, !isWithdrawal && styles.bankTitle]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {isWithdrawal && amountLabel ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>
                <Text style={styles.amountHighlight}>{amountLabel}</Text>
                {' will be credited to your '}
                <Text style={styles.bankHighlight}>
                  {bankName} account {maskedNumber}
                </Text>
                {' within 24 hours.'}
              </Text>
            </View>
          ) : null}

          {!isWithdrawal ? (
            <View style={styles.bankCard}>
              <View style={styles.bankLeft}>
                <View style={styles.bankIcon}>
                  <Ionicons
                    name="business"
                    size={22}
                    color={successTokens.ON_SECONDARY_CONTAINER}
                  />
                </View>
                <View style={styles.bankText}>
                  <Text style={styles.bankLabel}>{bankLabel}</Text>
                  <Text style={styles.bankNumber} numberOfLines={1}>
                    {maskedNumber}
                  </Text>
                </View>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={successTokens.PRIMARY} />
            </View>
          ) : null}

          {isWithdrawal && referenceNumber && copyReference ? (
            <View style={styles.referenceBlock}>
              <Text style={styles.referenceLabel}>
                {PROFILE_SUCCESS_SCREEN.withdrawal.referenceLabel}
              </Text>
              <View style={styles.referenceRow}>
                <Text style={styles.referenceValue}>{referenceNumber}</Text>
                <Pressable
                  onPress={copyReference}
                  accessibilityRole="button"
                  accessibilityLabel="Copy reference number"
                  hitSlop={8}
                >
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={18}
                    color={
                      copied ? successTokens.PRIMARY : successTokens.PRIMARY_FIXED_DIM
                    }
                  />
                </Pressable>
              </View>
              {copied ? (
                <Text style={styles.copiedHint}>
                  {PROFILE_SUCCESS_SCREEN.withdrawal.copiedMessage}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
            ]}
            onPress={onPrimary}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
          >
            <Text style={styles.primaryLabel}>{primaryLabel}</Text>
          </Pressable>

          {secondaryLabel && onSecondary ? (
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { backgroundColor: 'rgba(55, 75, 177, 0.05)' },
              ]}
              onPress={onSecondary}
              accessibilityRole="button"
              accessibilityLabel={secondaryLabel}
            >
              <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </ScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

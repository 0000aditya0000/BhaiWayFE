import React, { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { BrandTopBar, AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { appModeStore } from '@/store';
import { HOME_CATEGORY_THEMES } from '@/features/home/constants';
import { myRidesSurfaceStore } from '@/features/my-rides/store';
import { VerificationBanner } from '@/features/office-commute/components';
import {
  OFFICE_COMMUTE_INTRO,
  OFFICE_COMMUTE_OPTIONS,
  VERIFICATION_BANNER,
  VERIFIED_BANNER,
} from '@/features/office-commute/constants';
import { useCorporateVerified } from '@/features/office-commute/hooks';
import type { CommuteOption } from '@/features/office-commute/types';
import { styles } from './DailyOfficeCommuteScreen.styles';

const theme = HOME_CATEGORY_THEMES.office;

export const DailyOfficeCommuteScreen = () => {
  const router = useRouter();
  const { verified: isCorporateVerified, ready: corporateStatusReady } =
    useCorporateVerified();

  useEffect(() => {
    myRidesSurfaceStore.setOfficeCommute();
    appModeStore.setRiding();
  }, []);

  const handleMenuPress = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.home);
  }, [router]);

  const handleNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const handleOptionPress = useCallback(
    (option: CommuteOption) => {
      triggerLightHaptic();
      if (option.id === 'publish') {
        appModeStore.setDriving();
      } else {
        appModeStore.setRiding();
      }
      router.push(option.route);
    },
    [router],
  );

  const handleVerification = useCallback(() => {
    router.push(ROUTES.officeCommuteVerify);
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#EEF1FA', '#F5F6FA', '#F8F9FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backdrop}
        pointerEvents="none"
      />

      <BrandTopBar
        onMenuPress={handleMenuPress}
        right={
          <IconButton
            icon="notifications-outline"
            onPress={handleNotifications}
            accessibilityLabel="Notifications"
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(420)} style={styles.heroOuter}>
          <LinearGradient
            colors={[...theme.gradient] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCanvas}
          >
            <View style={[styles.orbOne, { backgroundColor: theme.orb }]} pointerEvents="none" />
            <View style={[styles.orbTwo, { backgroundColor: theme.orb }]} pointerEvents="none" />

            <View style={styles.heroCopy}>
              <View style={styles.heroBadge}>
                <Ionicons name="briefcase-outline" size={13} color={colors.textInverse} />
                <Text style={styles.heroBadgeText}>Daily</Text>
              </View>
              <Text style={styles.heroTitle}>{OFFICE_COMMUTE_INTRO.title}</Text>
              <Text style={styles.heroSubtitle}>{OFFICE_COMMUTE_INTRO.subtitle}</Text>
            </View>

            <View style={styles.actionsRow}>
              {OFFICE_COMMUTE_OPTIONS.map((option) => {
                const isPublish = option.id === 'publish';
                const tint = isPublish ? theme.publishTint : theme.bookTint;
                const accent = isPublish ? theme.publishAccent : theme.bookAccent;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => handleOptionPress(option)}
                    style={({ pressed }) => [
                      styles.actionCard,
                      pressed && styles.actionCardPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.title}. ${option.actionLabel}`}
                  >
                    <View style={[styles.actionIconWrap, { backgroundColor: tint }]}>
                      <Ionicons name={option.icon as never} size={20} color={accent} />
                    </View>
                    <View>
                      <Text style={styles.actionTitle}>
                        {isPublish ? 'Publish Ride' : 'Book Ride'}
                      </Text>
                      <Text style={styles.actionSubtitle} numberOfLines={2}>
                        {isPublish ? 'Share office seats' : 'Ride with coworkers'}
                      </Text>
                    </View>
                    <View style={styles.actionFooter}>
                      <Text style={[styles.actionCta, { color: accent }]}>
                        {isPublish ? 'Start' : 'Explore'}
                      </Text>
                      <View style={[styles.actionArrow, { backgroundColor: tint }]}>
                        <Ionicons name="arrow-forward" size={13} color={accent} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </LinearGradient>
        </Animated.View>

        {corporateStatusReady ? (
          isCorporateVerified ? (
            <VerificationBanner
              title={VERIFIED_BANNER.title}
              description={VERIFIED_BANNER.description}
            />
          ) : (
            <VerificationBanner
              title={VERIFICATION_BANNER.title}
              description={VERIFICATION_BANNER.description}
              actionLabel={VERIFICATION_BANNER.actionLabel}
              onPress={handleVerification}
            />
          )
        ) : null}
      </ScrollView>

      <AppFooter />
    </SafeAreaView>
  );
};

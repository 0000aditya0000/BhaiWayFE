import React, { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  Avatar,
  ScreenHeader,
  SuccessHero,
  AppText as Text,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { MY_RIDES_SCREEN, RIDER_REQUEST_ACCEPTED_SCREEN } from '@/features/my-rides/constants';
import { useRiderRequestAccepted } from '@/features/my-rides/hooks';
import { styles } from './RiderRequestAcceptedScreen.styles';

export const RiderRequestAcceptedScreen = () => {
  const { rider, goToDashboard, messageRider, openRiderProfile, goBack } =
    useRiderRequestAccepted();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const firstName = rider.name.split(' ')[0] ?? rider.name;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title={RIDER_REQUEST_ACCEPTED_SCREEN.brandName}
          onBack={handleBack}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SuccessHero
          title={RIDER_REQUEST_ACCEPTED_SCREEN.title}
          subtitle={RIDER_REQUEST_ACCEPTED_SCREEN.subtitle(rider.name)}
        />

        <View style={styles.card}>
          <Pressable
            style={styles.riderRow}
            onPress={openRiderProfile}
            accessibilityRole="button"
            accessibilityLabel={`View ${rider.name} profile`}
          >
            <Avatar
              size={64}
              uri={rider.avatarUri || null}
              accessibilityLabel={`${rider.name} photo`}
              style={styles.avatar}
            />
            <View style={styles.riderMeta}>
              <Text style={styles.riderName}>{rider.name}</Text>
              <Text style={styles.riderSubtitle}>{rider.subtitle}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={colors.primary} />
                <Text style={styles.ratingValue}>
                  {RIDER_REQUEST_ACCEPTED_SCREEN.ratingLabel(rider.rating, rider.ridesCount)}
                </Text>
                <Text style={styles.ridesCount}>
                  {RIDER_REQUEST_ACCEPTED_SCREEN.ridesCountLabel(rider.ridesCount)}
                </Text>
                <View style={styles.seatsBadge}>
                  <Text style={styles.seatsBadgeText}>
                    {MY_RIDES_SCREEN.seatsBookedLabel(rider.seatsBooked)}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
            <Text style={styles.infoText}>{RIDER_REQUEST_ACCEPTED_SCREEN.infoNote}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
            onPress={goToDashboard}
            accessibilityRole="button"
            accessibilityLabel={RIDER_REQUEST_ACCEPTED_SCREEN.dashboardLabel}
          >
            <Ionicons name="grid-outline" size={20} color={colors.textInverse} />
            <Text style={styles.primaryLabel}>
              {RIDER_REQUEST_ACCEPTED_SCREEN.dashboardLabel}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.92 }]}
            onPress={messageRider}
            accessibilityRole="button"
            accessibilityLabel={RIDER_REQUEST_ACCEPTED_SCREEN.messageLabel(firstName)}
          >
            <Ionicons name="chatbubble" size={20} color={colors.primary} />
            <Text style={styles.secondaryLabel}>
              {RIDER_REQUEST_ACCEPTED_SCREEN.messageLabel(firstName)}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

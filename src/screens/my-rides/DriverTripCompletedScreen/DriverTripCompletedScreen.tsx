import React, { useCallback } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  IconButton,
  AppText as Text,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { DRIVER_TRIP_COMPLETED_SCREEN } from '@/features/my-rides/constants';
import { useDriverTripCompleted } from '@/features/my-rides/hooks';
import { styles } from './DriverTripCompletedScreen.styles';

export const DriverTripCompletedScreen = () => {
  const params = useLocalSearchParams<{ destination?: string; rideId?: string; rideType?: string }>();
  const destination = getSearchParam(params.destination);
  const rideId = getSearchParam(params.rideId);

  const {
    trip,
    continuing,
    submitReviews,
    goBack,
  } = useDriverTripCompleted({
    destination: destination || undefined,
    rideId: rideId || undefined,
  });

  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleSubmit = useCallback(() => {
    triggerLightHaptic();
    submitReviews();
  }, [submitReviews]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={colors.primary}
            accessibilityLabel="Go back"
          />
          <Ionicons name="checkmark-circle" size={28} color="#374BB1" />
          <Text style={styles.brandName}>{DRIVER_TRIP_COMPLETED_SCREEN.brandName}</Text>
        </View>
        <View style={styles.headerAvatar}>
          <Image
            source={{ uri: trip.driverAvatarUri }}
            style={styles.headerAvatarImage}
            accessibilityLabel="Driver profile photo"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.celebrationCircle}>
            <Ionicons name="sparkles" size={32} color="#374BB1" />
          </View>
          <Text style={styles.heading} accessibilityRole="header">
            {DRIVER_TRIP_COMPLETED_SCREEN.heading}
          </Text>
          <Text style={styles.subtitle}>{DRIVER_TRIP_COMPLETED_SCREEN.subtitle}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{DRIVER_TRIP_COMPLETED_SCREEN.distanceStatLabel}</Text>
            <Text style={styles.statValue}>{trip.distanceValueLabel}</Text>
            <Text style={styles.statUnit}>{trip.distanceUnitLabel}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{DRIVER_TRIP_COMPLETED_SCREEN.timeStatLabel}</Text>
            <Text style={styles.statValue}>{trip.durationValueLabel}</Text>
            <Text style={styles.statUnit}>{trip.durationUnitLabel}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{DRIVER_TRIP_COMPLETED_SCREEN.earningsStatLabel}</Text>
            <Text style={styles.statValue}>{trip.earningsLabel}</Text>
            <Text style={styles.statUnit}>{DRIVER_TRIP_COMPLETED_SCREEN.earningsStatHint}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{DRIVER_TRIP_COMPLETED_SCREEN.reviewSectionTitle}</Text>
        <Text style={styles.communityMessage}>
          {DRIVER_TRIP_COMPLETED_SCREEN.communityMessage}
        </Text>

        <View style={styles.submitWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              continuing && styles.submitBtnDisabled,
              pressed && !continuing && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleSubmit}
            disabled={continuing}
            accessibilityRole="button"
            accessibilityLabel={DRIVER_TRIP_COMPLETED_SCREEN.continueLabel}
          >
            <Text style={styles.submitLabel}>
              {continuing ? 'Loading...' : DRIVER_TRIP_COMPLETED_SCREEN.continueLabel}
            </Text>
            <Ionicons name="arrow-forward" size={22} color="#EAEBFF" />
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

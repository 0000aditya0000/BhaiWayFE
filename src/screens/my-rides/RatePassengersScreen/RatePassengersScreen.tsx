import React, { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_CONFIG } from '@/config';
import {
  AppFooter,
  Avatar,
  IconButton,
  AppText as Text,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { RATE_PASSENGERS_SCREEN } from '@/features/my-rides/constants';
import { useRatePassengers } from '@/features/my-rides/hooks';
import type { PassengerRatingValue } from '@/features/my-rides/types';
import { styles } from './RatePassengersScreen.styles';

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

const PassengerStars = ({
  value,
  onChange,
  name,
}: {
  value: PassengerRatingValue;
  onChange: (next: PassengerRatingValue) => void;
  name: string;
}) => (
  <View style={styles.starsRow} accessibilityLabel={`Rate ${name}`}>
    {STAR_VALUES.map((star) => {
      const filled = star <= value;
      return (
        <Pressable
          key={star}
          style={({ pressed }) => [
            styles.starButton,
            pressed && { transform: [{ scale: 1.2 }] },
          ]}
          onPress={() => onChange(star)}
          accessibilityRole="button"
          accessibilityLabel={`${star} star${star === 1 ? '' : 's'} for ${name}`}
        >
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={28}
            color={filled ? '#FFB800' : '#E1E3E4'}
          />
        </Pressable>
      );
    })}
  </View>
);

export const RatePassengersScreen = () => {
  const {
    passengers,
    ratings,
    canSubmit,
    setRating,
    submitRatings,
    openNotifications,
    goBack,
  } = useRatePassengers();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleNotifications = useCallback(() => {
    triggerLightHaptic();
    openNotifications();
  }, [openNotifications]);

  const handleSubmit = useCallback(() => {
    triggerLightHaptic();
    submitRatings();
  }, [submitRatings]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={colors.primary}
          accessibilityLabel="Go back"
        />
        <Text style={styles.brandName}>{APP_CONFIG.name}</Text>
        <View style={{ flex: 1 }} />
        <IconButton
          icon="notifications-outline"
          onPress={handleNotifications}
          color={colors.textMuted}
          accessibilityLabel="Open notifications"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.title} accessibilityRole="header">
            {RATE_PASSENGERS_SCREEN.title}
          </Text>
          <Text style={styles.subtitle}>{RATE_PASSENGERS_SCREEN.subtitle}</Text>
        </View>

        <View style={styles.list}>
          {passengers.map((passenger) => (
            <View key={passenger.id} style={styles.card}>
              <View style={styles.passengerRow}>
                <Avatar
                  size={64}
                  uri={passenger.avatarUri}
                  accessibilityLabel={`${passenger.name} photo`}
                  style={styles.avatar}
                />
                <View style={styles.passengerMeta}>
                  <Text style={styles.passengerName} numberOfLines={1}>
                    {passenger.name}
                  </Text>
                  <Text style={styles.passengerRole} numberOfLines={1}>
                    {passenger.roleLabel}
                  </Text>
                </View>
              </View>

              <PassengerStars
                name={passenger.name}
                value={ratings[passenger.id] ?? 0}
                onChange={(value) => setRating(passenger.id, value)}
              />
            </View>
          ))}
        </View>

        <View style={styles.footerBlock}>
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              !canSubmit && styles.submitBtnDisabled,
              pressed && canSubmit && { opacity: 0.92 },
            ]}
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityLabel={RATE_PASSENGERS_SCREEN.submitLabel}
            accessibilityState={{ disabled: !canSubmit }}
          >
            <Text style={styles.submitLabel}>{RATE_PASSENGERS_SCREEN.submitLabel}</Text>
          </Pressable>
          <Text style={styles.hint}>{RATE_PASSENGERS_SCREEN.submitHint}</Text>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

import React, { useCallback } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  IconButton,
  AppText as Text,
  AppTextInput as TextInput,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { DRIVER_TRIP_COMPLETED_SCREEN } from '@/features/my-rides/constants';
import { useDriverTripCompleted } from '@/features/my-rides/hooks';
import type {
  DriverPassengerReviewDraft,
  DriverTripCompletedPassenger,
  PassengerRatingValue,
} from '@/features/my-rides/types';
import { STAR_COLOR, styles } from './DriverTripCompletedScreen.styles';

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

const PassengerStars = ({
  name,
  value,
  onChange,
}: {
  name: string;
  value: PassengerRatingValue;
  onChange: (next: PassengerRatingValue) => void;
}) => (
  <View style={styles.starsRow} accessibilityLabel={`Rate ${name}`}>
    {STAR_VALUES.map((star) => {
      const filled = star <= value;
      return (
        <Pressable
          key={star}
          style={({ pressed }) => [
            styles.starButton,
            pressed && { transform: [{ scale: 1.15 }] },
          ]}
          onPress={() => onChange(star)}
          accessibilityRole="button"
          accessibilityLabel={`${star} star${star === 1 ? '' : 's'} for ${name}`}
        >
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={18}
            color={filled ? STAR_COLOR : '#C4C5D7'}
          />
        </Pressable>
      );
    })}
  </View>
);

const PassengerReviewCard = ({
  passenger,
  draft,
  onRate,
  onToggleCompliment,
  onChangeNote,
  onPressAvatar,
}: {
  passenger: DriverTripCompletedPassenger;
  draft: DriverPassengerReviewDraft;
  onRate: (value: PassengerRatingValue) => void;
  onToggleCompliment: (compliment: string) => void;
  onChangeNote: (note: string) => void;
  onPressAvatar: () => void;
}) => (
  <View style={styles.reviewCard}>
    <View style={styles.passengerRow}>
      <Pressable
        onPress={onPressAvatar}
        accessibilityRole="button"
        accessibilityLabel={`View ${passenger.name} profile`}
      >
        <View style={styles.avatar}>
          {passenger.avatarUri ? (
            <Image
              source={{ uri: passenger.avatarUri }}
              style={styles.avatarImage}
              accessibilityLabel={`${passenger.name} photo`}
            />
          ) : (
            <Text style={styles.initials}>{passenger.initials || passenger.name.slice(0, 2)}</Text>
          )}
        </View>
      </Pressable>
      <View style={styles.passengerMeta}>
        <Text style={styles.passengerName}>{passenger.name}</Text>
        <PassengerStars name={passenger.name} value={draft.rating} onChange={onRate} />
      </View>
    </View>

    <View style={styles.chipsRow}>
      {passenger.complimentOptions.map((compliment) => {
        const selected = draft.compliments.includes(compliment);
        return (
          <Pressable
            key={compliment}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => onToggleCompliment(compliment)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${compliment} for ${passenger.name}`}
          >
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
              {compliment}
            </Text>
          </Pressable>
        );
      })}
    </View>

    <TextInput
      style={styles.reviewInput}
      value={draft.note}
      onChangeText={onChangeNote}
      placeholder={DRIVER_TRIP_COMPLETED_SCREEN.reviewPlaceholder}
      placeholderTextColor="rgba(67, 70, 85, 0.5)"
      multiline
      numberOfLines={2}
      accessibilityLabel={`Written review for ${passenger.name}`}
    />
  </View>
);

export const DriverTripCompletedScreen = () => {
  const params = useLocalSearchParams<{ destination?: string }>();
  const destination = getSearchParam(params.destination);

  const {
    trip,
    reviews,
    canSubmit,
    setRating,
    toggleCompliment,
    setReviewNote,
    submitReviews,
    openRiderProfile,
    goBack,
  } = useDriverTripCompleted({
    destination: destination || undefined,
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

        <View style={styles.reviewList}>
          {trip.passengers.map((passenger) => (
            <PassengerReviewCard
              key={passenger.id}
              passenger={passenger}
              draft={reviews[passenger.id] ?? { rating: 0, compliments: [], note: '' }}
              onRate={(value) => setRating(passenger.id, value)}
              onToggleCompliment={(compliment) => toggleCompliment(passenger.id, compliment)}
              onChangeNote={(note) => setReviewNote(passenger.id, note)}
              onPressAvatar={() => openRiderProfile(passenger)}
            />
          ))}
        </View>

        <View style={styles.submitWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              !canSubmit && styles.submitBtnDisabled,
              pressed && canSubmit && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityLabel={DRIVER_TRIP_COMPLETED_SCREEN.submitLabel}
            accessibilityState={{ disabled: !canSubmit }}
          >
            <Text style={styles.submitLabel}>{DRIVER_TRIP_COMPLETED_SCREEN.submitLabel}</Text>
            <Ionicons name="arrow-forward" size={22} color="#EAEBFF" />
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

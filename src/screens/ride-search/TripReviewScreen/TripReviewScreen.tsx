import React, { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_CONFIG } from '@/config';
import { AppFooter, Avatar, IconButton, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { colors } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { TRIP_REVIEW_SCREEN } from '@/features/ride-search/constants';
import { useTripReview } from '@/features/ride-search/hooks';
import type { RatingValue } from '@/features/ride-search/types';
import { styles } from './TripReviewScreen.styles';

const StarRow = ({
  value,
  onChange,
  accessibilityLabel,
}: {
  value: RatingValue;
  onChange: (next: RatingValue) => void;
  accessibilityLabel: string;
}) => (
  <View style={styles.starsRow} accessibilityLabel={accessibilityLabel}>
    {([1, 2, 3, 4, 5] as const).map((star) => {
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
          accessibilityLabel={`${star} star`}
          accessibilityState={{ selected: filled }}
        >
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={36}
            color={filled ? '#374BB1' : '#C4C5D7'}
          />
        </Pressable>
      );
    })}
  </View>
);

export const TripReviewScreen = () => {
  const params = useLocalSearchParams<{
    rideId?: string;
    driverName?: string;
  }>();

  const {
    review,
    driverTags,
    vehicleTags,
    driverRating,
    vehicleRating,
    selectedDriverTags,
    selectedVehicleTags,
    comments,
    submitting,
    setDriverRating,
    setVehicleRating,
    toggleDriverTag,
    toggleVehicleTag,
    setComments,
    submitFeedback,
    close,
  } = useTripReview({
    rideId: getSearchParam(params.rideId) || 'ride-default',
    driverName: getSearchParam(params.driverName),
  });

  const handleClose = useCallback(() => {
    triggerLightHaptic();
    close();
  }, [close]);

  const handleSubmit = useCallback(() => {
    triggerLightHaptic();
    submitFeedback();
  }, [submitFeedback]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="car" size={28} color={colors.primary} />
          <Text style={styles.brandName}>{APP_CONFIG.name}</Text>
        </View>
        <IconButton
          icon="close"
          onPress={handleClose}
          color="#434655"
          accessibilityLabel="Close review"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heading}>{TRIP_REVIEW_SCREEN.heading}</Text>
            <Text style={styles.subtitle}>{TRIP_REVIEW_SCREEN.subtitle}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.avatarWrap}>
              <Avatar
                size={96}
                uri={review.driverAvatarUri}
                accessibilityLabel={`${review.driverName} photo`}
              />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={14} color={colors.white} />
              </View>
            </View>
            <View>
              <Text style={styles.driverName}>{review.driverName}</Text>
              <Text style={styles.sectionLabel}>{TRIP_REVIEW_SCREEN.driverBehaviorLabel}</Text>
            </View>

            <StarRow
              value={driverRating}
              onChange={setDriverRating}
              accessibilityLabel="Driver rating"
            />

            <View style={styles.tagsBlock}>
              <Text style={styles.sectionLabel}>{TRIP_REVIEW_SCREEN.whatWentWellLabel}</Text>
              <View style={styles.tagsWrap}>
                {driverTags.map((tag) => {
                  const selected = selectedDriverTags.includes(tag.id);
                  return (
                    <Pressable
                      key={tag.id}
                      style={[styles.tagChip, selected && styles.tagChipSelected]}
                      onPress={() => toggleDriverTag(tag.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={tag.label}
                    >
                      <Text style={[styles.tagLabel, selected && styles.tagLabelSelected]}>
                        {tag.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.vehicleIconWrap}>
              <Ionicons name="car" size={40} color="#374BB1" />
            </View>
            <Text style={styles.sectionLabel}>{TRIP_REVIEW_SCREEN.vehicleConditionLabel}</Text>

            <StarRow
              value={vehicleRating}
              onChange={setVehicleRating}
              accessibilityLabel="Vehicle rating"
            />

            <View style={styles.tagsBlock}>
              <View style={styles.tagsWrap}>
                {vehicleTags.map((tag) => {
                  const selected = selectedVehicleTags.includes(tag.id);
                  return (
                    <Pressable
                      key={tag.id}
                      style={[styles.tagChip, selected && styles.tagChipSelected]}
                      onPress={() => toggleVehicleTag(tag.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={tag.label}
                    >
                      <Text style={[styles.tagLabel, selected && styles.tagLabelSelected]}>
                        {tag.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>{TRIP_REVIEW_SCREEN.reviewLabel}</Text>
            <TextInput
              style={styles.reviewInput}
              value={comments}
              onChangeText={setComments}
              placeholder={TRIP_REVIEW_SCREEN.reviewPlaceholder}
              placeholderTextColor="#747686"
              multiline
              textAlignVertical="top"
              accessibilityLabel="Write a review"
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              submitting && styles.submitButtonBusy,
              pressed && !submitting && { transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Submit feedback"
          >
            <Text style={styles.submitLabel}>
              {submitting
                ? TRIP_REVIEW_SCREEN.submittingLabel
                : TRIP_REVIEW_SCREEN.submitLabel}
            </Text>
            {!submitting ? (
              <Ionicons name="send" size={20} color={colors.white} />
            ) : null}
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

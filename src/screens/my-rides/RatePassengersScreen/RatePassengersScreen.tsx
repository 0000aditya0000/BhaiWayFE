import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_CONFIG } from '@/config';
import {
  RatingCommentInput,
  RatingStars,
  RATING_TASK_COPY,
} from '@/features/ratings';
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
import { styles } from './RatePassengersScreen.styles';

export const RatePassengersScreen = () => {
  const {
    loading,
    error,
    currentTaskName,
    currentTaskPhoto,
    routeLabel,
    progressLabel,
    rating,
    comment,
    submitting,
    skipping,
    canSubmit,
    isComplete,
    setRating,
    setComment,
    submitCurrent,
    skipCurrent,
    refresh,
    goBack,
  } = useRatePassengers();

  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleSubmit = useCallback(() => {
    submitCurrent();
  }, [submitCurrent]);

  const handleSkip = useCallback(() => {
    skipCurrent();
  }, [skipCurrent]);

  const busy = submitting || skipping;

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
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <Text style={styles.title} accessibilityRole="header">
            {RATING_TASK_COPY.driverHeading}
          </Text>
          <Text style={styles.subtitle}>{RATING_TASK_COPY.driverSubtitle}</Text>
          {progressLabel ? (
            <Text style={styles.progress}>{progressLabel}</Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryBtn}
              onPress={() => {
                triggerLightHaptic();
                refresh();
              }}
            >
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : isComplete ? (
          <View style={styles.centerState}>
            <Text style={styles.title}>{RATING_TASK_COPY.doneTitle}</Text>
            <Text style={styles.subtitle}>{RATING_TASK_COPY.doneMessage}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.passengerRow}>
              <Avatar
                size={72}
                uri={currentTaskPhoto || undefined}
                accessibilityLabel={`${currentTaskName} photo`}
                style={styles.avatar}
              />
              <View style={styles.passengerMeta}>
                <Text style={styles.passengerName} numberOfLines={1}>
                  {currentTaskName}
                </Text>
                {routeLabel ? (
                  <Text style={styles.passengerRole} numberOfLines={2}>
                    {routeLabel}
                  </Text>
                ) : null}
              </View>
            </View>

            <RatingStars
              value={rating}
              onChange={setRating}
              size={34}
              disabled={busy}
              accessibilityLabel={`Rate ${currentTaskName}`}
            />

            <RatingCommentInput
              value={comment}
              onChange={setComment}
              disabled={busy}
            />
          </View>
        )}

        {!loading && !error && !isComplete ? (
          <View style={styles.footerBlock}>
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                (!canSubmit || busy) && styles.submitBtnDisabled,
                pressed && canSubmit && !busy && { opacity: 0.92 },
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || busy}
              accessibilityRole="button"
              accessibilityLabel={RATING_TASK_COPY.submitLabel}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.submitLabel}>{RATING_TASK_COPY.submitLabel}</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.white} />
                </>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.skipBtn,
                busy && styles.submitBtnDisabled,
                pressed && !busy && { opacity: 0.85 },
              ]}
              onPress={handleSkip}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={RATING_TASK_COPY.skipLabel}
            >
              <Text style={styles.skipLabel}>
                {skipping ? RATING_TASK_COPY.skippingLabel : RATING_TASK_COPY.skipLabel}
              </Text>
            </Pressable>

            <Text style={styles.hint}>{RATE_PASSENGERS_SCREEN.submitHint}</Text>
          </View>
        ) : null}
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

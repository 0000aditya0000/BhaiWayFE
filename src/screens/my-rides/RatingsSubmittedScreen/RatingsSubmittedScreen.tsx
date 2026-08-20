import React, { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  Avatar,
  IconButton,
  AppText as Text,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { RATINGS_SUBMITTED_SCREEN } from '@/features/my-rides/constants';
import { useRatingsSubmitted } from '@/features/my-rides/hooks';
import { styles } from './RatingsSubmittedScreen.styles';

const PreviewStars = ({ rating }: { rating: number }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? 'star' : 'star-outline'}
        size={14}
        color={colors.primary}
      />
    ))}
  </View>
);

export const RatingsSubmittedScreen = () => {
  const { summary, goToDashboard, contactSupport, close } = useRatingsSubmitted();

  const handleClose = useCallback(() => {
    triggerLightHaptic();
    close();
  }, [close]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleClose}
          color={colors.primary}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle}>{RATINGS_SUBMITTED_SCREEN.headerTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {RATINGS_SUBMITTED_SCREEN.titleLine1}
            {'\n'}
            {RATINGS_SUBMITTED_SCREEN.titleLine2}
          </Text>
          <Text style={styles.subtitle}>{RATINGS_SUBMITTED_SCREEN.subtitle}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIcon}>
                <Ionicons name="people" size={22} color={colors.white} />
              </View>
              <View>
                <Text style={styles.summaryLabel}>
                  {RATINGS_SUBMITTED_SCREEN.summaryLabel}
                </Text>
                <Text style={styles.summaryCount}>
                  {RATINGS_SUBMITTED_SCREEN.ratedCountLabel(summary.ratedCount)}
                </Text>
              </View>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.textSecondary} />
              <Text style={styles.verifiedText}>
                {RATINGS_SUBMITTED_SCREEN.verifiedLabel}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.ratedList}>
            {summary.items.map((item) => (
              <View key={item.id} style={styles.ratedRow}>
                <Avatar
                  size={40}
                  uri={item.avatarUri || null}
                  accessibilityLabel={`${item.name} photo`}
                />
                <View style={styles.ratedMeta}>
                  <Text style={styles.ratedName}>{item.name}</Text>
                  <PreviewStars rating={item.rating} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
            onPress={goToDashboard}
            accessibilityRole="button"
            accessibilityLabel={RATINGS_SUBMITTED_SCREEN.dashboardLabel}
          >
            <Text style={styles.primaryLabel}>{RATINGS_SUBMITTED_SCREEN.dashboardLabel}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </Pressable>

          <View style={styles.supportRow}>
            <Text style={styles.supportPrompt}>{RATINGS_SUBMITTED_SCREEN.supportPrompt}</Text>
            <Pressable
              onPress={contactSupport}
              accessibilityRole="link"
              accessibilityLabel={RATINGS_SUBMITTED_SCREEN.supportLinkLabel}
            >
              <Text style={styles.supportLink}>
                {RATINGS_SUBMITTED_SCREEN.supportLinkLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

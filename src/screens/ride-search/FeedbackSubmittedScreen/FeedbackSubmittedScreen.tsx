import React, { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { APP_CONFIG } from '@/config';
import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic, useExitOnBack } from '@/shared/utils';
import { FEEDBACK_SUBMITTED_SCREEN } from '@/features/ride-search/constants';
import { useFeedbackSubmitted } from '@/features/ride-search/hooks';
import { styles } from './FeedbackSubmittedScreen.styles';

export const FeedbackSubmittedScreen = () => {
  const params = useLocalSearchParams<{ rating?: string }>();
  const ratingParam = Number(getSearchParam(params.rating));

  const { rating, goHome, viewReceipt, openNotifications, openSearch } = useFeedbackSubmitted({
    rating: Number.isFinite(ratingParam) ? ratingParam : 5,
  });

  useExitOnBack(goHome);

  const checkScale = useSharedValue(0.5);
  const checkOpacity = useSharedValue(0);
  const checkRotate = useSharedValue(-10);

  useEffect(() => {
    checkOpacity.value = withTiming(1, { duration: 280 });
    checkScale.value = withSequence(
      withSpring(1.1, { damping: 10, stiffness: 180 }),
      withSpring(1, { damping: 14, stiffness: 200 }),
    );
    checkRotate.value = withSequence(
      withTiming(5, { duration: 280 }),
      withTiming(0, { duration: 220 }),
    );
  }, [checkOpacity, checkRotate, checkScale]);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }, { rotate: `${checkRotate.value}deg` }],
  }));

  const handleHome = useCallback(() => {
    triggerLightHaptic();
    goHome();
  }, [goHome]);

  const handleReceipt = useCallback(() => {
    triggerLightHaptic();
    viewReceipt();
  }, [viewReceipt]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="car" size={28} color={colors.primary} />
          <Text style={styles.brandName}>{APP_CONFIG.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="search"
            onPress={openSearch}
            color="#434655"
            accessibilityLabel="Search rides"
          />
          <IconButton
            icon="notifications-outline"
            onPress={openNotifications}
            color="#434655"
            accessibilityLabel="Open notifications"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.successCard}>
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />

            <Animated.View style={[styles.checkWrap, checkAnimatedStyle]}>
              <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
            </Animated.View>

            <Text style={styles.heading}>{FEEDBACK_SUBMITTED_SCREEN.heading}</Text>
            <Text style={styles.subtitle}>{FEEDBACK_SUBMITTED_SCREEN.subtitle}</Text>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
                ]}
                onPress={handleHome}
                accessibilityRole="button"
                accessibilityLabel="Go to home"
              >
                <Text style={styles.primaryLabel}>{FEEDBACK_SUBMITTED_SCREEN.goHomeLabel}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && { backgroundColor: '#E7E8E9' },
                ]}
                onPress={handleReceipt}
                accessibilityRole="button"
                accessibilityLabel="View receipt"
              >
                <Text style={styles.secondaryLabel}>
                  {FEEDBACK_SUBMITTED_SCREEN.viewReceiptLabel}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconWallet}>
                <Ionicons name="wallet-outline" size={22} color="#5C6276" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>
                  {FEEDBACK_SUBMITTED_SCREEN.paymentMethodLabel}
                </Text>
                <Text style={styles.summaryValue}>
                  {FEEDBACK_SUBMITTED_SCREEN.paymentMethodValue}
                </Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryIconRating}>
                <Ionicons name="star" size={22} color="#0038B6" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>{FEEDBACK_SUBMITTED_SCREEN.ratingLabel}</Text>
                <View style={styles.starsRow}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Ionicons
                      key={`star-${index}`}
                      name={index < rating ? 'star' : 'star-outline'}
                      size={16}
                      color="#374BB1"
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

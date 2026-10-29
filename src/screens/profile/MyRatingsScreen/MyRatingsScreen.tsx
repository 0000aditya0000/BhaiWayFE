import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MY_RATINGS_SCREEN } from '@/features/profile/constants';
import { useMyRatings } from '@/features/profile/hooks';
import type { MyRatingsDirection } from '@/features/profile/types';
import { AppFooter, AppText as Text } from '@/shared/components';
import { myRatingsTokens, styles } from './MyRatingsScreen.styles';

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

const TABS: { id: MyRatingsDirection; label: string }[] = [
  { id: 'received', label: MY_RATINGS_SCREEN.receivedTab },
  { id: 'given', label: MY_RATINGS_SCREEN.givenTab },
];

const ReadOnlyStars = ({ value }: { value: number }) => (
  <View style={styles.starsRow} accessibilityLabel={`${value} out of 5 stars`}>
    {STAR_VALUES.map((star) => (
      <Ionicons
        key={star}
        name={star <= value ? 'star' : 'star-outline'}
        size={16}
        color={myRatingsTokens.STAR}
      />
    ))}
  </View>
);

export const MyRatingsScreen = () => {
  const {
    activeDirection,
    heroSubtitle,
    emptyTitle,
    emptySubtitle,
    summaryLabel,
    reviewCountLabel,
    reviews,
    loading,
    error,
    refreshing,
    setDirection,
    goBack,
    refresh,
    retry,
  } = useMyRatings();

  const averageValue = Number(summaryLabel);
  const roundedAverage = Number.isFinite(averageValue) ? Math.round(averageValue) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { backgroundColor: myRatingsTokens.SURFACE_LOW },
          ]}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={myRatingsTokens.PRIMARY} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {MY_RATINGS_SCREEN.title}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }
      >
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const active = activeDirection === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={({ pressed }) => [
                  styles.tabButton,
                  active && styles.tabButtonActive,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={() => setDirection(tab.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab.label}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="star" size={36} color={myRatingsTokens.ON_PRIMARY_CONTAINER} />
          </View>
          <Text style={styles.heroTitle}>{MY_RATINGS_SCREEN.heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryValue}>{summaryLabel}</Text>
            <ReadOnlyStars value={roundedAverage} />
            <Text style={styles.summaryLabel}>{MY_RATINGS_SCREEN.averageLabel}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryValue}>{reviewCountLabel}</Text>
            <Text style={styles.summaryLabel}>{MY_RATINGS_SCREEN.reviewsLabel}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={myRatingsTokens.PRIMARY} />
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.9 }]}
              onPress={retry}
              accessibilityRole="button"
              accessibilityLabel={MY_RATINGS_SCREEN.retryLabel}
            >
              <Text style={styles.retryLabel}>{MY_RATINGS_SCREEN.retryLabel}</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && reviews.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={32} color={myRatingsTokens.OUTLINE} />
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
          </View>
        ) : null}

        {!loading && !error && reviews.length > 0 ? (
          <View style={styles.list}>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.avatar}>
                    {review.reviewerPhoto ? (
                      <Image
                        source={{ uri: review.reviewerPhoto }}
                        style={styles.avatarImage}
                        accessibilityIgnoresInvertColors
                      />
                    ) : (
                      <Ionicons name="person" size={22} color={myRatingsTokens.PRIMARY} />
                    )}
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.contextLabel}>{review.contextLabel}</Text>
                    <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                    {review.createdAtLabel ? (
                      <Text style={styles.reviewDate}>{review.createdAtLabel}</Text>
                    ) : null}
                  </View>
                  <ReadOnlyStars value={review.rating} />
                </View>

                {review.roleLabel ? (
                  <View style={styles.rolePill}>
                    <Text style={styles.rolePillText}>{review.roleLabel}</Text>
                  </View>
                ) : null}

                {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

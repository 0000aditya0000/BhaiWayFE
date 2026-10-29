import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CouponDto } from '@/features/coupons';
import {
  AVAILABLE_COUPONS_SCREEN,
  formatCouponBenefitHeadline,
} from '@/features/coupons/constants/available-coupons.constants';
import { useAvailableCoupons } from '@/features/coupons/hooks';
import { IconButton, AppText as Text } from '@/shared/components';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';

import { couponTokens, styles } from './AvailableCouponsScreen.styles';

const asNumber = (value: string | undefined, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDate = (value: string | null): string | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const AvailableCouponsScreen = () => {
  const params = useLocalSearchParams<{
    rideId?: string;
    rideType?: string;
    rideFare?: string;
    assuredFee?: string;
    seats?: string;
    appliedCode?: string;
  }>();

  const rideId = getSearchParam(params.rideId);
  const rideType = getSearchParam(params.rideType) || 'regular';
  const rideFare = asNumber(getSearchParam(params.rideFare), 0);
  const assuredFee = asNumber(getSearchParam(params.assuredFee), 0);
  const seats = Math.max(1, Math.floor(asNumber(getSearchParam(params.seats), 1)));
  const appliedCode = getSearchParam(params.appliedCode);

  const {
    items,
    loading,
    refreshing,
    error,
    applyingCode,
    appliedCode: currentApplied,
    refresh,
    retry,
    applyCoupon,
    goBack,
  } = useAvailableCoupons({
    rideId,
    rideType,
    rideFare,
    assuredFee,
    seats,
    appliedCode,
  });

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const renderItem = useCallback(
    ({ item }: { item: CouponDto }) => {
      const isApplied = currentApplied === item.code;
      const isApplying = applyingCode === item.code;
      const expires = formatDate(item.expiresAt);
      const headline = formatCouponBenefitHeadline(item);
      const benefit = String(item.benefitType ?? '').toUpperCase();

      return (
        <View style={[styles.ticket, isApplied && styles.ticketApplied]}>
          <View style={styles.ticketInner}>
            <View style={[styles.accentRail, isApplied && styles.accentRailApplied]} />
            <View style={styles.ticketBody}>
              <View style={styles.ticketTop}>
                <Text style={styles.headline}>{headline}</Text>
                {isApplied ? (
                  <View style={styles.appliedBadge}>
                    <Text style={styles.appliedBadgeLabel}>
                      {AVAILABLE_COUPONS_SCREEN.appliedLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.title}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <View style={styles.metaRow}>
                {item.minEligibleAmount ? (
                  <View style={styles.metaChip}>
                    <Ionicons name="wallet-outline" size={12} color={couponTokens.OUTLINE} />
                    <Text style={styles.metaChipLabel}>
                      {AVAILABLE_COUPONS_SCREEN.minAmountPrefix} {item.minEligibleAmount}
                    </Text>
                  </View>
                ) : null}
                {item.maxDiscountAmount && benefit === 'PERCENTAGE_DISCOUNT' ? (
                  <View style={styles.metaChip}>
                    <Ionicons name="pricetag-outline" size={12} color={couponTokens.OUTLINE} />
                    <Text style={styles.metaChipLabel}>
                      {AVAILABLE_COUPONS_SCREEN.maxDiscountPrefix} {item.maxDiscountAmount}
                    </Text>
                  </View>
                ) : null}
                {expires ? (
                  <View style={styles.metaChip}>
                    <Ionicons name="calendar-outline" size={12} color={couponTokens.OUTLINE} />
                    <Text style={styles.metaChipLabel}>
                      {AVAILABLE_COUPONS_SCREEN.expiresPrefix} {expires}
                    </Text>
                  </View>
                ) : null}
                {benefit === 'POINTS_CREDIT' ? (
                  <View style={styles.metaChip}>
                    <Ionicons name="gift-outline" size={12} color={couponTokens.OUTLINE} />
                    <Text style={styles.metaChipLabel}>
                      {AVAILABLE_COUPONS_SCREEN.pointsCreditHint}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.perforated}>
            <View style={styles.notchLeft} />
            <View style={styles.dashLine} />
            <View style={styles.notchRight} />
          </View>

          <View style={styles.ticketFooter}>
            <View style={styles.codeBox}>
              <Text style={styles.codeBoxLabel}>{item.code}</Text>
            </View>
            <Pressable
              style={[
                styles.applyButton,
                (isApplying || Boolean(applyingCode)) && styles.applyButtonDisabled,
                isApplied && styles.applyButtonApplied,
              ]}
              disabled={Boolean(applyingCode) || isApplied}
              onPress={() => void applyCoupon(item)}
              accessibilityRole="button"
              accessibilityLabel={`Apply coupon ${item.code}`}
            >
              {isApplying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.applyLabel, isApplied && styles.applyLabelApplied]}>
                  {isApplied
                    ? AVAILABLE_COUPONS_SCREEN.appliedLabel
                    : AVAILABLE_COUPONS_SCREEN.applyLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      );
    },
    [applyCoupon, applyingCode, currentApplied],
  );

  const listHeader = useMemo(
    () =>
      items.length > 0 ? (
        <View style={styles.countPill}>
          <Text style={styles.countPillLabel}>
            {items.length} {items.length === 1 ? 'offer' : 'offers'} for this ride
          </Text>
        </View>
      ) : null,
    [items.length],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={couponTokens.ON_SURFACE}
          accessibilityLabel="Go back"
        />
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            {AVAILABLE_COUPONS_SCREEN.title}
          </Text>
          <Text style={styles.headerSubtitle}>{AVAILABLE_COUPONS_SCREEN.subtitle}</Text>
        </View>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={couponTokens.PRIMARY} />
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cloud-offline-outline" size={32} color={couponTokens.PRIMARY} />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={retry}
            accessibilityRole="button"
          >
            <Text style={styles.retryLabel}>{AVAILABLE_COUPONS_SCREEN.retryLabel}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh()}
              tintColor={couponTokens.PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="ticket-outline" size={32} color={couponTokens.PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>{AVAILABLE_COUPONS_SCREEN.emptyTitle}</Text>
              <Text style={styles.emptyMessage}>{AVAILABLE_COUPONS_SCREEN.emptyMessage}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CouponDto } from '@/features/coupons';
import { formatCouponBenefitHeadline } from '@/features/coupons/constants/available-coupons.constants';
import {
  PROMOTIONS_COUPONS_SCREEN,
  formatCouponChargeScopeLabel,
  formatCouponRideTypeLabel,
} from '@/features/coupons/constants/promotions-coupons.constants';
import { usePromotionsCoupons } from '@/features/coupons/hooks';
import { IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';

import { promoTokens, styles } from './PromotionsCouponsScreen.styles';

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

export const PromotionsCouponsScreen = () => {
  const {
    items,
    loading,
    refreshing,
    error,
    copiedCode,
    refresh,
    retry,
    copyCode,
    goBack,
  } = usePromotionsCoupons();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const renderItem = useCallback(
    ({ item }: { item: CouponDto }) => {
      const isCopied = copiedCode === item.code.trim().toUpperCase();
      const expires = formatDate(item.expiresAt);
      const starts = formatDate(item.startsAt);
      const headline = formatCouponBenefitHeadline(item);
      const benefit = String(item.benefitType ?? '').toUpperCase();

      return (
        <View style={[styles.ticket, !item.isActive && styles.ticketInactive]}>
          <View style={styles.ticketInner}>
            <View
              style={[styles.accentRail, !item.isActive && styles.accentRailInactive]}
            />
            <View style={styles.ticketBody}>
              <View style={styles.ticketTop}>
                <Text style={styles.headline}>{headline}</Text>
                {!item.isActive ? (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeLabel}>
                      {PROMOTIONS_COUPONS_SCREEN.inactiveLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.title}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.description} numberOfLines={3}>
                  {item.description}
                </Text>
              ) : null}
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Ionicons name="car-outline" size={12} color={promoTokens.OUTLINE} />
                  <Text style={styles.metaChipLabel}>
                    {formatCouponRideTypeLabel(item.rideTypeScope)}
                  </Text>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons name="card-outline" size={12} color={promoTokens.OUTLINE} />
                  <Text style={styles.metaChipLabel}>
                    {formatCouponChargeScopeLabel(item.chargeScope)}
                  </Text>
                </View>
                {item.minEligibleAmount ? (
                  <View style={styles.metaChip}>
                    <Ionicons name="wallet-outline" size={12} color={promoTokens.OUTLINE} />
                    <Text style={styles.metaChipLabel}>
                      {PROMOTIONS_COUPONS_SCREEN.minAmountPrefix} {item.minEligibleAmount}
                    </Text>
                  </View>
                ) : null}
                {item.maxDiscountAmount && benefit === 'PERCENTAGE_DISCOUNT' ? (
                  <View style={styles.metaChip}>
                    <Ionicons name="pricetag-outline" size={12} color={promoTokens.OUTLINE} />
                    <Text style={styles.metaChipLabel}>
                      {PROMOTIONS_COUPONS_SCREEN.maxDiscountPrefix}{' '}
                      {item.maxDiscountAmount}
                    </Text>
                  </View>
                ) : null}
                {starts ? (
                  <View style={styles.metaChip}>
                    <Ionicons name="play-outline" size={12} color={promoTokens.OUTLINE} />
                    <Text style={styles.metaChipLabel}>
                      {PROMOTIONS_COUPONS_SCREEN.startsPrefix} {starts}
                    </Text>
                  </View>
                ) : null}
                {expires ? (
                  <View style={styles.metaChip}>
                    <Ionicons name="calendar-outline" size={12} color={promoTokens.OUTLINE} />
                    <Text style={styles.metaChipLabel}>
                      {PROMOTIONS_COUPONS_SCREEN.expiresPrefix} {expires}
                    </Text>
                  </View>
                ) : null}
                {benefit === 'POINTS_CREDIT' ? (
                  <View style={styles.metaChip}>
                    <Ionicons name="gift-outline" size={12} color={promoTokens.OUTLINE} />
                    <Text style={styles.metaChipLabel}>
                      {PROMOTIONS_COUPONS_SCREEN.pointsCreditHint}
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
              style={[styles.copyButton, isCopied && styles.copyButtonCopied]}
              onPress={() => copyCode(item.code)}
              accessibilityRole="button"
              accessibilityLabel={`Copy coupon code ${item.code}`}
            >
              <Ionicons
                name={isCopied ? 'checkmark' : 'copy-outline'}
                size={16}
                color={isCopied ? promoTokens.PRIMARY : '#FFFFFF'}
              />
              <Text style={[styles.copyLabel, isCopied && styles.copyLabelCopied]}>
                {isCopied
                  ? PROMOTIONS_COUPONS_SCREEN.copiedLabel
                  : PROMOTIONS_COUPONS_SCREEN.copyLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      );
    },
    [copiedCode, copyCode],
  );

  const listHeader = useMemo(
    () =>
      items.length > 0 ? (
        <View style={styles.countPill}>
          <Text style={styles.countPillLabel}>
            {items.length} {items.length === 1 ? 'promotion' : 'promotions'}
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
          color={promoTokens.ON_SURFACE}
          accessibilityLabel="Go back"
        />
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            {PROMOTIONS_COUPONS_SCREEN.title}
          </Text>
          <Text style={styles.headerSubtitle}>{PROMOTIONS_COUPONS_SCREEN.subtitle}</Text>
        </View>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={promoTokens.PRIMARY} />
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cloud-offline-outline" size={32} color={promoTokens.PRIMARY} />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={retry}
            accessibilityRole="button"
          >
            <Text style={styles.retryLabel}>{PROMOTIONS_COUPONS_SCREEN.retryLabel}</Text>
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
              tintColor={promoTokens.PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="ticket-outline" size={32} color={promoTokens.PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>{PROMOTIONS_COUPONS_SCREEN.emptyTitle}</Text>
              <Text style={styles.emptyMessage}>
                {PROMOTIONS_COUPONS_SCREEN.emptyMessage}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

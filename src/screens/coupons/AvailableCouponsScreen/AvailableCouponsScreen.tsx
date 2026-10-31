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
import { CouponTicketCard } from '@/features/coupons/components';
import { AVAILABLE_COUPONS_SCREEN } from '@/features/coupons/constants/available-coupons.constants';
import { useAvailableCoupons } from '@/features/coupons/hooks';
import { buildAvailableCouponChips } from '@/features/coupons/utils/couponChips';
import { resolveCouponActorContext } from '@/features/coupons/utils/couponAudience';
import { IconButton, AppText as Text } from '@/shared/components';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';

import { couponTokens, styles } from './AvailableCouponsScreen.styles';

const asNumber = (value: string | undefined, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const AvailableCouponsScreen = () => {
  const params = useLocalSearchParams<{
    rideId?: string;
    rideType?: string;
    rideFare?: string;
    assuredFee?: string;
    seats?: string;
    appliedCode?: string;
    couponContext?: string;
  }>();

  const rideId = getSearchParam(params.rideId);
  const rideType = getSearchParam(params.rideType) || 'regular';
  const rideFare = asNumber(getSearchParam(params.rideFare), 0);
  const assuredFee = asNumber(getSearchParam(params.assuredFee), 0);
  const seats = Math.max(1, Math.floor(asNumber(getSearchParam(params.seats), 1)));
  const appliedCode = getSearchParam(params.appliedCode);
  const actorContext = resolveCouponActorContext({
    couponContext: getSearchParam(params.couponContext),
    rideId,
  });

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
    actorContext,
  });

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const renderItem = useCallback(
    ({ item }: { item: CouponDto }) => {
      const isApplied = currentApplied === item.code;
      const isApplying = applyingCode === item.code;

      return (
        <CouponTicketCard
          coupon={item}
          chips={buildAvailableCouponChips(item)}
          badge={
            isApplied
              ? { label: AVAILABLE_COUPONS_SCREEN.appliedLabel, tone: 'applied' }
              : undefined
          }
          ctaLabel={
            isApplied
              ? AVAILABLE_COUPONS_SCREEN.appliedLabel
              : AVAILABLE_COUPONS_SCREEN.applyLabel
          }
          ctaBusy={isApplying}
          ctaDisabled={Boolean(applyingCode) || isApplied}
          ctaVariant={isApplied ? 'applied' : 'apply'}
          onPressCta={() => void applyCoupon(item)}
          accessibilityLabel={`Apply coupon ${item.code}`}
        />
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

  const isDriver = actorContext === 'DRIVER';

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
          <Text style={styles.headerSubtitle}>
            {isDriver
              ? AVAILABLE_COUPONS_SCREEN.driverSubtitle
              : AVAILABLE_COUPONS_SCREEN.subtitle}
          </Text>
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
              <Text style={styles.emptyMessage}>
                {isDriver
                  ? AVAILABLE_COUPONS_SCREEN.driverEmptyMessage
                  : AVAILABLE_COUPONS_SCREEN.emptyMessage}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

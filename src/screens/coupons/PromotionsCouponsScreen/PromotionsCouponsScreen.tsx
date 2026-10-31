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
import { PROMOTIONS_COUPONS_SCREEN } from '@/features/coupons/constants/promotions-coupons.constants';
import { usePromotionsCoupons } from '@/features/coupons/hooks';
import {
  couponActorContextFromAppMode,
  parseCouponActorContext,
} from '@/features/coupons/utils/couponAudience';
import { buildPromotionsCouponChips } from '@/features/coupons/utils/couponChips';
import { IconButton, AppText as Text } from '@/shared/components';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { appModeStore } from '@/store';

import { promoTokens, styles } from './PromotionsCouponsScreen.styles';

export const PromotionsCouponsScreen = () => {
  const params = useLocalSearchParams<{ couponContext?: string }>();
  const paramContext = getSearchParam(params.couponContext);
  const actorContext = paramContext
    ? parseCouponActorContext(paramContext)
    : couponActorContextFromAppMode(appModeStore.get());

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
  } = usePromotionsCoupons({ actorContext });

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const renderItem = useCallback(
    ({ item }: { item: CouponDto }) => {
      const isCopied = copiedCode === item.code.trim().toUpperCase();

      return (
        <CouponTicketCard
          coupon={item}
          chips={buildPromotionsCouponChips(item)}
          badge={
            item.isActive
              ? undefined
              : {
                  label: PROMOTIONS_COUPONS_SCREEN.inactiveLabel,
                  tone: 'inactive',
                }
          }
          ctaLabel={
            isCopied
              ? PROMOTIONS_COUPONS_SCREEN.copiedLabel
              : PROMOTIONS_COUPONS_SCREEN.copyLabel
          }
          ctaVariant="copy"
          ctaIcon={isCopied ? 'checkmark' : 'copy-outline'}
          descriptionLines={3}
          onPressCta={() => copyCode(item.code)}
          accessibilityLabel={`Copy coupon code ${item.code}`}
        />
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

  const isDriver = actorContext === 'DRIVER';

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
          <Text style={styles.headerSubtitle}>
            {isDriver
              ? PROMOTIONS_COUPONS_SCREEN.driverSubtitle
              : PROMOTIONS_COUPONS_SCREEN.subtitle}
          </Text>
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
                {isDriver
                  ? PROMOTIONS_COUPONS_SCREEN.driverEmptyMessage
                  : PROMOTIONS_COUPONS_SCREEN.emptyMessage}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

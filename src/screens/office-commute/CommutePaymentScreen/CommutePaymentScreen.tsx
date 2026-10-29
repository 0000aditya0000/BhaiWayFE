import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  Button,
  KeyboardAwareScrollView,
  ScreenHeader,
  AppText as Text,
} from '@/shared/components';
import { formatBhaiWayCoins, getSearchParam } from '@/shared/utils';
import { COMMUTE_PAYMENT_SCREEN } from '@/features/office-commute/constants';
import { useCommutePayment } from '@/features/office-commute/hooks/useCommutePayment';
import { styles } from './CommutePaymentScreen.styles';

export const CommutePaymentScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rideId?: string;
    seats?: string;
    riderPricePerSeat?: string;
    origin?: string;
    destination?: string;
    driverName?: string;
    carModel?: string;
    couponCode?: string;
    couponChargeScope?: string;
    couponDiscount?: string;
    originLat?: string;
    originLng?: string;
    destinationLat?: string;
    destinationLng?: string;
  }>();

  const seatsParam = Number(getSearchParam(params.seats));
  const riderPriceParam = Number(getSearchParam(params.riderPricePerSeat));
  const couponCode = getSearchParam(params.couponCode);
  const couponChargeScopeRaw = getSearchParam(params.couponChargeScope);
  const couponChargeScope =
    couponChargeScopeRaw === 'ASSURED_SECURITY_DEPOSIT' || couponChargeScopeRaw === 'RIDE_FARE'
      ? couponChargeScopeRaw
      : null;
  const couponDiscount = getSearchParam(params.couponDiscount);
  const originLat = Number(getSearchParam(params.originLat));
  const originLng = Number(getSearchParam(params.originLng));
  const destinationLat = Number(getSearchParam(params.destinationLat));
  const destinationLng = Number(getSearchParam(params.destinationLng));

  const {
    totalFareLabel,
    walletAvailableCoins,
    submitting,
    confirmPayment,
    onAddCoins,
  } = useCommutePayment({
    rideId: getSearchParam(params.rideId) || 'ride-default',
    seats: Number.isFinite(seatsParam) && seatsParam > 0 ? seatsParam : 1,
    riderPricePerSeat:
      Number.isFinite(riderPriceParam) && riderPriceParam > 0 ? riderPriceParam : 0,
    origin: getSearchParam(params.origin),
    destination: getSearchParam(params.destination),
    driverName: getSearchParam(params.driverName),
    carModel: getSearchParam(params.carModel),
    couponCode: couponCode || null,
    couponChargeScope,
    couponDiscount: couponDiscount || null,
    originLat: Number.isFinite(originLat) ? originLat : undefined,
    originLng: Number.isFinite(originLng) ? originLng : undefined,
    destinationLat: Number.isFinite(destinationLat) ? destinationLat : undefined,
    destinationLng: Number.isFinite(destinationLng) ? destinationLng : undefined,
  });

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  const walletLabel = walletAvailableCoins
    ? formatBhaiWayCoins(Number(walletAvailableCoins), { spaced: false })
    : '—';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title={COMMUTE_PAYMENT_SCREEN.title}
          onBack={handleBack}
          right={<View style={{ width: 40 }} />}
        />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        footer={
          <View style={styles.footer}>
            <Button
              label={COMMUTE_PAYMENT_SCREEN.continueLabel}
              onPress={confirmPayment}
              loading={submitting}
              showArrow
              accessibilityLabel="Pay and request commute ride"
            />
          </View>
        }
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{COMMUTE_PAYMENT_SCREEN.fareTitle}</Text>
          <Text style={styles.summaryAmount}>{totalFareLabel}</Text>
          <Text style={styles.summaryHint}>{COMMUTE_PAYMENT_SCREEN.totalLabel}</Text>
          <View style={styles.walletRow}>
            <Text style={styles.walletLabel}>{COMMUTE_PAYMENT_SCREEN.walletLabel}</Text>
            <Text style={styles.walletValue}>{walletLabel}</Text>
          </View>
          <Button
            label="Add Coins"
            variant="secondary"
            onPress={onAddCoins}
            accessibilityLabel="Add coins to wallet"
          />
        </View>

        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#5C5F61" />
          <Text style={styles.secureText}>{COMMUTE_PAYMENT_SCREEN.secureLabel}</Text>
        </View>
      </KeyboardAwareScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

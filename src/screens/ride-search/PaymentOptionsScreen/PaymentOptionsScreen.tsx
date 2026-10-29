import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, Button, KeyboardAwareScrollView, ScreenHeader, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { formatBhaiWayCoins, getSearchParam } from '@/shared/utils';
import { formatCoinString, formatCoinsLabel } from '@/features/profile/utils/walletCoin';
import { PaymentMethodList } from '@/features/ride-search/components';
import { AssuredDepositPenaltyNotice } from '@/features/ride-search/components/AssuredDepositPenaltyNotice';
import { PAYMENT_SCREEN } from '@/features/ride-search/constants';
import { usePaymentOptions } from '@/features/ride-search/hooks';
import type { RideType } from '@/features/ride-search/types';
import { styles } from './PaymentOptionsScreen.styles';

const isRideType = (value: string): value is RideType =>
  value === 'regular' || value === 'assured';

const Radio = ({ selected }: { selected: boolean }) => (
  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
    {selected ? <View style={styles.radioInner} /> : null}
  </View>
);

export const PaymentOptionsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rideId?: string;
    rideType?: string;
    origin?: string;
    destination?: string;
    driverName?: string;
    carModel?: string;
    price?: string;
    seats?: string;
    assuredFee?: string;
    assuredDepositCoins?: string;
    assuredDepositPercentage?: string;
    assuredDepositPenaltyNotice?: string;
    couponCode?: string;
    couponChargeScope?: string;
    couponDiscount?: string;
    dateLabel?: string;
    departureTime?: string;
    originLat?: string;
    originLng?: string;
    destinationLat?: string;
    destinationLng?: string;
  }>();

  const rideTypeParam = getSearchParam(params.rideType);
  const rideType: RideType = isRideType(rideTypeParam) ? rideTypeParam : 'regular';
  const priceParam = Number(getSearchParam(params.price));
  const seatsParam = Number(getSearchParam(params.seats));
  const assuredFeeParam = Number(getSearchParam(params.assuredFee));
  const assuredDepositCoinsParam = getSearchParam(params.assuredDepositCoins);
  const assuredDepositPercentageParam = Number(getSearchParam(params.assuredDepositPercentage));
  const assuredDepositPenaltyNotice =
    getSearchParam(params.assuredDepositPenaltyNotice) === '1';
  const couponCode = getSearchParam(params.couponCode);
  const couponChargeScopeRaw = getSearchParam(params.couponChargeScope);
  const couponChargeScope =
    couponChargeScopeRaw === 'ASSURED_SECURITY_DEPOSIT' || couponChargeScopeRaw === 'RIDE_FARE'
      ? couponChargeScopeRaw
      : null;
  const originLat = Number(getSearchParam(params.originLat));
  const originLng = Number(getSearchParam(params.originLng));
  const destinationLat = Number(getSearchParam(params.destinationLat));
  const destinationLng = Number(getSearchParam(params.destinationLng));

  const {
    selectedId,
    setSelectedId,
    assuredFarePayment,
    setAssuredFarePayment,
    continueLabel,
    submitting,
    continuePayment,
    onAddCoins,
    walletAvailableCoins,
    assuredDepositCoins,
    assuredFareCoins,
    assuredRequiredCoins,
    isAssured,
    couponCode: appliedCouponCode,
    couponDiscountCoins,
    couponChargeScope: appliedCouponScope,
  } = usePaymentOptions({
    rideId: getSearchParam(params.rideId) || 'ride-default',
    rideType,
    origin: getSearchParam(params.origin),
    destination: getSearchParam(params.destination),
    driverName: getSearchParam(params.driverName),
    carModel: getSearchParam(params.carModel),
    price: Number.isFinite(priceParam) ? priceParam : undefined,
    seats: Number.isFinite(seatsParam) && seatsParam > 0 ? seatsParam : 1,
    assuredFee: Number.isFinite(assuredFeeParam) && assuredFeeParam > 0 ? assuredFeeParam : undefined,
    assuredDepositCoins: assuredDepositCoinsParam || null,
    couponCode: couponCode || null,
    couponChargeScope,
    couponDiscount: getSearchParam(params.couponDiscount) || null,
    dateLabel: getSearchParam(params.dateLabel),
    departureTime: getSearchParam(params.departureTime),
    originLat: Number.isFinite(originLat) ? originLat : undefined,
    originLng: Number.isFinite(originLng) ? originLng : undefined,
    destinationLat: Number.isFinite(destinationLat) ? destinationLat : undefined,
    destinationLng: Number.isFinite(destinationLng) ? destinationLng : undefined,
  });

  const depositLabel = assuredDepositCoins
    ? formatBhaiWayCoins(Number(assuredDepositCoins), { spaced: false })
    : '—';
  const fareLabel = assuredFareCoins
    ? formatBhaiWayCoins(Number(assuredFareCoins), { spaced: false })
    : '—';
  const payNowAmountLabel =
    assuredFarePayment === 'PAY_NOW' && assuredFareCoins
      ? formatBhaiWayCoins(Number(assuredFareCoins), { spaced: false })
      : formatBhaiWayCoins(0, { spaced: false });
  const requiredNowLabel = assuredRequiredCoins
    ? formatBhaiWayCoins(Number(assuredRequiredCoins), { spaced: false })
    : formatBhaiWayCoins(0, { spaced: false });

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title={PAYMENT_SCREEN.title}
          onBack={handleBack}
          right={<View style={{ width: 40 }} />}
        />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        footer={
          <View style={styles.footer}>
            <Button
              label={continueLabel}
              onPress={continuePayment}
              showArrow
              loading={submitting}
              disabled={submitting}
              accessibilityLabel="Continue to booking confirmation"
            />
          </View>
        }
      >
        {appliedCouponCode ? (
          <View style={styles.assuredCard}>
            <Text style={styles.assuredCardTitle}>Coupon {appliedCouponCode}</Text>
            {couponDiscountCoins > 0 ? (
              <Text style={styles.assuredAmount}>
                -{formatBhaiWayCoins(couponDiscountCoins, { spaced: false })}
              </Text>
            ) : (
              <Text style={styles.assuredHint}>
                Applied
                {appliedCouponScope ? ` · ${appliedCouponScope.replace(/_/g, ' ')}` : ''}
              </Text>
            )}
            {rideType === 'regular' ? (
              <Text style={styles.assuredHint}>
                Preview discount shown on review. Regular Pay After Ride bookings need backend
                coupon support on PAY_LATER to redeem at confirmation.
              </Text>
            ) : null}
          </View>
        ) : null}

        {isAssured ? (
          <>
            <Text style={styles.assuredHeading}>{PAYMENT_SCREEN.assuredHeading}</Text>

            <View style={styles.assuredCard}>
              <View style={styles.assuredCardHeader}>
                <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
                <Text style={styles.assuredCardTitle}>{PAYMENT_SCREEN.assuredDepositTitle}</Text>
              </View>
              <Text style={styles.assuredAmount}>{depositLabel}</Text>
              {Number.isFinite(assuredDepositPercentageParam) &&
              assuredDepositPercentageParam > 0 ? (
                <Text style={styles.assuredPercentage}>
                  {`${Math.round(assuredDepositPercentageParam)}%`}
                </Text>
              ) : null}
              <Text style={styles.assuredBadge}>{PAYMENT_SCREEN.assuredDepositMandatory}</Text>
              <Text style={styles.assuredHint}>{PAYMENT_SCREEN.assuredDepositHint}</Text>
              {assuredDepositPenaltyNotice &&
              Number.isFinite(assuredDepositPercentageParam) &&
              assuredDepositPercentageParam > 0 ? (
                <AssuredDepositPenaltyNotice
                  percentage={assuredDepositPercentageParam}
                  variant="payment"
                />
              ) : null}
              <View style={styles.walletRow}>
                <Text style={styles.walletLabel}>{PAYMENT_SCREEN.assuredWalletBalanceLabel}</Text>
                <Text style={styles.walletValue}>
                  {walletAvailableCoins != null
                    ? formatCoinsLabel(walletAvailableCoins)
                    : '—'}
                </Text>
              </View>
              <Pressable
                style={styles.addCoinsLink}
                onPress={onAddCoins}
                accessibilityRole="button"
                accessibilityLabel={PAYMENT_SCREEN.addCoinsLabel}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.addCoinsLinkText}>{PAYMENT_SCREEN.addCoinsLabel}</Text>
              </Pressable>
            </View>

            <View style={styles.assuredCard}>
              <Text style={styles.assuredCardTitle}>{PAYMENT_SCREEN.assuredFareTitle}</Text>
              <Text style={styles.assuredAmount}>{fareLabel}</Text>
              <Text style={styles.assuredChoiceTitle}>{PAYMENT_SCREEN.assuredFareChoiceTitle}</Text>

              <Pressable
                style={[
                  styles.choiceRow,
                  assuredFarePayment === 'PAY_NOW' && styles.choiceRowSelected,
                ]}
                onPress={() => setAssuredFarePayment('PAY_NOW')}
                accessibilityRole="radio"
                accessibilityState={{ selected: assuredFarePayment === 'PAY_NOW' }}
              >
                <View style={styles.choiceMeta}>
                  <Text style={styles.choiceLabel}>{PAYMENT_SCREEN.assuredPayNowLabel}</Text>
                  <Text style={styles.choiceSubtitle}>
                    {PAYMENT_SCREEN.assuredPayNowSubtitle(fareLabel)}
                  </Text>
                </View>
                <Radio selected={assuredFarePayment === 'PAY_NOW'} />
              </Pressable>

              <Pressable
                style={[
                  styles.choiceRow,
                  assuredFarePayment === 'PAY_LATER' && styles.choiceRowSelected,
                ]}
                onPress={() => setAssuredFarePayment('PAY_LATER')}
                accessibilityRole="radio"
                accessibilityState={{ selected: assuredFarePayment === 'PAY_LATER' }}
              >
                <View style={styles.choiceMeta}>
                  <Text style={styles.choiceLabel}>{PAYMENT_SCREEN.assuredPayLaterLabel}</Text>
                  <Text style={styles.choiceSubtitle}>
                    {PAYMENT_SCREEN.assuredPayLaterSubtitle}
                  </Text>
                </View>
                <Radio selected={assuredFarePayment === 'PAY_LATER'} />
              </Pressable>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{PAYMENT_SCREEN.assuredSummaryTitle}</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{PAYMENT_SCREEN.assuredSummaryDeposit}</Text>
                <Text style={styles.summaryValue}>{depositLabel}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{PAYMENT_SCREEN.assuredSummaryFare}</Text>
                <Text style={styles.summaryValue}>
                  {assuredFarePayment === 'PAY_NOW'
                    ? payNowAmountLabel
                    : PAYMENT_SCREEN.assuredSummaryFareZero}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Amount from wallet now</Text>
                <Text style={styles.summaryTotalValue}>{requiredNowLabel}</Text>
              </View>
              {walletAvailableCoins != null ? (
                <Text style={styles.summaryFootnote}>
                  Available: {formatCoinString(walletAvailableCoins)} Coins
                </Text>
              ) : null}
            </View>
          </>
        ) : (
          <PaymentMethodList
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddCoins={onAddCoins}
            walletAvailableCoins={walletAvailableCoins}
            showPayAfterRide
          />
        )}

        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#5C5F61" />
          <Text style={styles.secureText}>{PAYMENT_SCREEN.secureLabel}</Text>
        </View>
      </KeyboardAwareScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

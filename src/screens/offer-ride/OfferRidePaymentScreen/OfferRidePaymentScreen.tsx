import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  Button,
  KeyboardAwareScrollView,
  ScreenHeader,
  AppText as Text,
} from '@/shared/components';
import { formatCoinString } from '@/features/profile/utils/walletCoin';
import { colors } from '@/shared/theme';
import { formatBhaiWayCoins, triggerLightHaptic } from '@/shared/utils';
import { PaymentMethodList } from '@/features/ride-search/components';
import { OFFER_RIDE_PAYMENT_SCREEN } from '@/features/offer-ride/constants';
import { useOfferRidePayment } from '@/features/offer-ride/hooks';
import { styles } from './OfferRidePaymentScreen.styles';

export const OfferRidePaymentScreen = () => {
  const {
    selectedId,
    setSelectedId,
    confirmAndPublish,
    publishing,
    depositCoins,
    walletAvailableCoins,
    onAddCoins,
    goBack,
  } = useOfferRidePayment();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const depositLabel = depositCoins ? formatBhaiWayCoins(Number(depositCoins)) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title={OFFER_RIDE_PAYMENT_SCREEN.title}
          onBack={handleBack}
          right={<View style={{ width: 40 }} />}
        />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        footer={
          <View style={styles.footer}>
            <Button
              label={OFFER_RIDE_PAYMENT_SCREEN.continueLabel}
              onPress={confirmAndPublish}
              showArrow
              loading={publishing}
              disabled={publishing}
              accessibilityLabel={OFFER_RIDE_PAYMENT_SCREEN.continueLabel}
            />
          </View>
        }
      >
        {depositLabel ? (
          <View style={styles.assuredNotice}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <View style={styles.assuredNoticeText}>
              <Text style={styles.assuredNoticeTitle}>
                {OFFER_RIDE_PAYMENT_SCREEN.depositNoticeTitle} · {depositLabel}
              </Text>
              <Text style={styles.assuredNoticeBody}>
                {OFFER_RIDE_PAYMENT_SCREEN.depositNoticeBody}
                {walletAvailableCoins
                  ? `\nAvailable: ${formatCoinString(walletAvailableCoins)} Coins`
                  : ''}
              </Text>
            </View>
          </View>
        ) : null}

        <PaymentMethodList
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAddCoins={onAddCoins}
          showPayAfterRide={false}
          walletAvailableCoins={walletAvailableCoins}
        />

        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.secureText}>{OFFER_RIDE_PAYMENT_SCREEN.secureLabel}</Text>
        </View>
      </KeyboardAwareScrollView>

      <AppFooter />
    </SafeAreaView>
  );
};

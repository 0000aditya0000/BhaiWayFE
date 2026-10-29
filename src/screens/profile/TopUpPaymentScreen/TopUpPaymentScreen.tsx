import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, BhaiWayCoinIcon, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { TOP_UP_PAYMENT_SCREEN } from '@/features/profile/constants/top-up-payment.constants';
import { useTopUpPayment } from '@/features/profile/hooks';
import { styles, topUpTokens } from './TopUpPaymentScreen.styles';

export const TopUpPaymentScreen = () => {
  const {
    amountLabel,
    rupeeLabel,
    phase,
    processing,
    startPayment,
    retryPayment,
    cancelPayment,
    goBack,
  } = useTopUpPayment();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const busy =
    processing ||
    phase === 'opening_checkout' ||
    phase === 'verifying' ||
    phase === 'polling';

  const getStatusLabel = () => {
    if (phase === 'verifying') {
      return TOP_UP_PAYMENT_SCREEN.verifyingLabel;
    }
    if (phase === 'polling') {
      return TOP_UP_PAYMENT_SCREEN.pollingLabel;
    }
    return TOP_UP_PAYMENT_SCREEN.processingLabel;
  };

  const isRetry = phase === 'failed' || phase === 'cancelled' || phase === 'timeout';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={topUpTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header">
          {TOP_UP_PAYMENT_SCREEN.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{TOP_UP_PAYMENT_SCREEN.amountLabel}</Text>
          <Text style={styles.rupeeValue}>{rupeeLabel}</Text>
          <View style={styles.coinsRow}>
            <BhaiWayCoinIcon size={22} />
            <Text style={styles.coinsValue}>{amountLabel}</Text>
          </View>
        </View>

        {busy ? (
          <View style={styles.processingBlock}>
            <ActivityIndicator size="large" color={topUpTokens.PRIMARY} />
            <Text style={styles.processingText}>{getStatusLabel()}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.devNote}>{TOP_UP_PAYMENT_SCREEN.productionGatewayNote}</Text>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={isRetry ? retryPayment : startPayment}
              accessibilityRole="button"
              accessibilityLabel={isRetry ? TOP_UP_PAYMENT_SCREEN.retryPayLabel : TOP_UP_PAYMENT_SCREEN.payCtaLabel}
            >
              <Ionicons name="card-outline" size={20} color={topUpTokens.ON_PRIMARY} />
              <Text style={styles.primaryLabel}>
                {isRetry ? TOP_UP_PAYMENT_SCREEN.retryPayLabel : TOP_UP_PAYMENT_SCREEN.payCtaLabel}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.ghostButton, pressed && styles.buttonPressed]}
              onPress={cancelPayment}
              accessibilityRole="button"
              accessibilityLabel={TOP_UP_PAYMENT_SCREEN.cancelLabel}
            >
              <Text style={styles.ghostLabel}>{TOP_UP_PAYMENT_SCREEN.cancelLabel}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

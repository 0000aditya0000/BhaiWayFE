import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WITHDRAW_SCREEN } from '@/features/profile/constants';
import { useWithdraw } from '@/features/profile/hooks';
import {
  AppFooter,
  BhaiWayCoinIcon,
  IconButton,
  KeyboardAwareScrollView,
  AppText as Text,
  AppTextInput as TextInput,
} from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { styles, withdrawTokens } from './WithdrawScreen.styles';

export const WithdrawScreen = () => {
  const {
    title,
    balanceLabel,
    balanceValueLabel,
    amount,
    selectedPaymentMethodId,
    methods,
    methodsLoading,
    quickAmounts,
    submitting,
    submitError,
    canSubmit,
    setAmount,
    addQuickAmount,
    setMaxAmount,
    selectPaymentMethod,
    addPaymentMethod,
    proceed,
    goBack,
    openHistory,
    methodTitle,
    methodSubtitle,
  } = useWithdraw();

  const [amountFocused, setAmountFocused] = useState(false);

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={withdrawTokens.ON_SURFACE}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        <IconButton
          icon="time-outline"
          onPress={openHistory}
          color={withdrawTokens.PRIMARY}
          accessibilityLabel={WITHDRAW_SCREEN.historyLabel}
        />
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomInset={24}
      >
        <View style={styles.balanceHero}>
          <View style={styles.balanceGlow} pointerEvents="none" />
          <Text style={styles.balanceLabel}>{balanceLabel}</Text>
          <View style={styles.balanceValueRow}>
            <BhaiWayCoinIcon size={28} />
            <Text style={styles.balanceValue}>{balanceValueLabel}</Text>
          </View>
        </View>

        <View style={styles.amountSection}>
          <View>
            <Text style={styles.fieldLabel}>{WITHDRAW_SCREEN.amountLabel}</Text>
            <View style={styles.amountInputWrap}>
              <BhaiWayCoinIcon size={28} style={styles.currencyPrefix} />
              <TextInput
                style={[styles.amountInput, amountFocused && styles.amountInputFocused]}
                value={amount}
                onChangeText={setAmount}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
                placeholder={WITHDRAW_SCREEN.amountPlaceholder}
                placeholderTextColor={withdrawTokens.OUTLINE_VARIANT}
                keyboardType="number-pad"
                accessibilityLabel={WITHDRAW_SCREEN.amountLabel}
              />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {quickAmounts.map((chip) => (
              <Pressable
                key={chip.id}
                style={styles.chip}
                onPress={() => addQuickAmount(chip.amount)}
                accessibilityRole="button"
                accessibilityLabel={chip.label}
              >
                <Text style={styles.chipLabel}>{chip.label}</Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.chip}
              onPress={setMaxAmount}
              accessibilityRole="button"
              accessibilityLabel={WITHDRAW_SCREEN.maxLabel}
            >
              <Text style={styles.chipLabel}>{WITHDRAW_SCREEN.maxLabel}</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={styles.accountsSection}>
          <Text style={styles.fieldLabel}>{WITHDRAW_SCREEN.selectAccountLabel}</Text>
          <View style={styles.accountsList}>
            {methodsLoading ? (
              <ActivityIndicator color={withdrawTokens.PRIMARY} />
            ) : methods.length === 0 ? (
              <View style={styles.addAccountCard}>
                <View style={styles.bankMeta}>
                  <Text style={styles.addAccountTitle}>{WITHDRAW_SCREEN.noMethodsTitle}</Text>
                  <Text style={styles.addAccountSubtitle}>
                    {WITHDRAW_SCREEN.noMethodsSubtitle}
                  </Text>
                </View>
              </View>
            ) : (
              methods.map((method) => {
                const selected = method.id === selectedPaymentMethodId;
                return (
                  <Pressable
                    key={method.id}
                    style={[styles.bankCard, selected && styles.bankCardActive]}
                    onPress={() => selectPaymentMethod(method.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <View style={[styles.bankIcon, selected && styles.bankIconActive]}>
                      <Ionicons
                        name={method.type === 'UPI' ? 'phone-portrait' : 'business'}
                        size={26}
                        color={selected ? withdrawTokens.PRIMARY : withdrawTokens.OUTLINE}
                      />
                    </View>
                    <View style={styles.bankMeta}>
                      <Text style={styles.bankName}>{methodTitle(method)}</Text>
                      <Text style={styles.bankDetails}>{methodSubtitle(method)}</Text>
                    </View>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={selected ? withdrawTokens.PRIMARY : withdrawTokens.OUTLINE_VARIANT}
                    />
                  </Pressable>
                );
              })
            )}

            <Pressable
              style={styles.addAccountCard}
              onPress={addPaymentMethod}
              accessibilityRole="button"
              accessibilityLabel={WITHDRAW_SCREEN.addAccountTitle}
            >
              <View style={styles.addAccountIcon}>
                <Ionicons name="add" size={28} color={withdrawTokens.ON_PRIMARY} />
              </View>
              <View style={styles.bankMeta}>
                <Text style={styles.addAccountTitle}>{WITHDRAW_SCREEN.addAccountTitle}</Text>
                <Text style={styles.addAccountSubtitle}>
                  {WITHDRAW_SCREEN.addAccountSubtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={withdrawTokens.OUTLINE_VARIANT} />
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <View style={styles.bottomBar}>
        {submitError ? (
          <Text style={styles.submitError} accessibilityLiveRegion="polite">
            {submitError}
          </Text>
        ) : null}
        <Pressable
          style={[
            styles.proceedButton,
            (!canSubmit || submitting) && { opacity: 0.55 },
          ]}
          onPress={proceed}
          disabled={!canSubmit || submitting}
          accessibilityRole="button"
          accessibilityLabel={WITHDRAW_SCREEN.proceedLabel}
        >
          <Text style={styles.proceedLabel}>
            {submitting
              ? WITHDRAW_SCREEN.submittingLabel
              : amount
                ? `${WITHDRAW_SCREEN.proceedLabel} ${amount} Coins`
                : WITHDRAW_SCREEN.proceedLabel}
          </Text>
          {!submitting ? (
            <Ionicons name="arrow-forward" size={20} color={withdrawTokens.ON_PRIMARY} />
          ) : null}
        </Pressable>
      </View>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

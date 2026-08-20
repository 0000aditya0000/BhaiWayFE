import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { AppFooter, IconButton, KeyboardAwareScrollView, BhaiWayCoinIcon, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { WITHDRAW_SCREEN } from '@/features/profile/constants';
import { useWithdraw } from '@/features/profile/hooks';
import { styles, withdrawTokens } from './WithdrawScreen.styles';

export const WithdrawScreen = () => {
  const router = useRouter();
  const {
    title,
    balanceLabel,
    balanceValueLabel,
    amount,
    selectedBankId,
    banks,
    quickAmounts,
    setAmount,
    addQuickAmount,
    selectBank,
    addBankAccount,
    proceed,
    goBack,
  } = useWithdraw();

  const [amountFocused, setAmountFocused] = useState(false);

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleNotifications = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.notifications);
  }, [router]);

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
          icon="notifications-outline"
          onPress={handleNotifications}
          color={withdrawTokens.PRIMARY}
          accessibilityLabel="Notifications"
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
                keyboardType="decimal-pad"
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
                style={({ pressed }) => [
                  styles.chip,
                  pressed && styles.chipActive,
                ]}
                onPress={() => addQuickAmount(chip.amount)}
                accessibilityRole="button"
                accessibilityLabel={chip.label}
              >
                {({ pressed }) => (
                  <Text style={[styles.chipLabel, pressed && styles.chipLabelActive]}>
                    {chip.label}
                  </Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.accountsSection}>
          <Text style={styles.fieldLabel}>{WITHDRAW_SCREEN.selectAccountLabel}</Text>
          <View style={styles.accountsList}>
            {banks.map((bank) => {
              const selected = bank.id === selectedBankId;
              return (
                <Pressable
                  key={bank.id}
                  style={({ pressed }) => [
                    styles.bankCard,
                    selected && styles.bankCardActive,
                    pressed && { opacity: 0.94 },
                  ]}
                  onPress={() => selectBank(bank.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${bank.bankName} ${bank.accountTypeLabel} ${bank.maskedNumber}`}
                >
                  <View style={[styles.bankIcon, selected && styles.bankIconActive]}>
                    <Ionicons
                      name="business"
                      size={26}
                      color={selected ? withdrawTokens.PRIMARY : withdrawTokens.OUTLINE}
                    />
                  </View>
                  <View style={styles.bankMeta}>
                    <Text style={styles.bankName}>{bank.bankName}</Text>
                    <Text style={styles.bankDetails}>
                      {bank.accountTypeLabel} {bank.maskedNumber}
                    </Text>
                  </View>
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={24}
                    color={selected ? withdrawTokens.PRIMARY : 'transparent'}
                  />
                </Pressable>
              );
            })}

            <Pressable
              style={({ pressed }) => [
                styles.addAccountCard,
                pressed && { opacity: 0.94, borderColor: withdrawTokens.PRIMARY },
              ]}
              onPress={addBankAccount}
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
        <Pressable
          style={({ pressed }) => [
            styles.proceedButton,
            pressed && { transform: [{ scale: 0.98 }], backgroundColor: withdrawTokens.PRIMARY_CONTAINER },
          ]}
          onPress={proceed}
          accessibilityRole="button"
          accessibilityLabel={WITHDRAW_SCREEN.proceedLabel}
        >
          <Text style={styles.proceedLabel}>{WITHDRAW_SCREEN.proceedLabel}</Text>
          <Ionicons name="arrow-forward" size={20} color={withdrawTokens.ON_PRIMARY} />
        </Pressable>
      </View>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

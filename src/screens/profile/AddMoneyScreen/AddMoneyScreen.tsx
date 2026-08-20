import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { AppFooter, IconButton, KeyboardAwareScrollView, BhaiWayCoinIcon, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { ADD_MONEY_SCREEN } from '@/features/profile/constants';
import { useAddMoney } from '@/features/profile/hooks';
import { addMoneyTokens, styles } from './AddMoneyScreen.styles';

export const AddMoneyScreen = () => {
  const router = useRouter();
  const {
    amount,
    selectedSourceId,
    sources,
    quickAmounts,
    setAmount,
    setQuickAmount,
    selectSource,
    linkUpi,
    linkBank,
    submit,
    goBack,
  } = useAddMoney();

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
            color={addMoneyTokens.PRIMARY}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
            {ADD_MONEY_SCREEN.brandTitle}
          </Text>

        <IconButton
          icon="notifications-outline"
          onPress={handleNotifications}
          color={addMoneyTokens.PRIMARY}
          accessibilityLabel="Notifications"
        />
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomInset={40}
      >
        <View style={styles.amountCard}>
          <Text style={styles.fieldLabel}>{ADD_MONEY_SCREEN.amountLabel}</Text>
          <View style={styles.amountInputWrap}>
            <BhaiWayCoinIcon size={28} style={styles.currencyPrefix} />
            <TextInput
              style={[styles.amountInput, amountFocused && styles.amountInputFocused]}
              value={amount}
              onChangeText={setAmount}
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
              placeholder={ADD_MONEY_SCREEN.amountPlaceholder}
              placeholderTextColor={addMoneyTokens.OUTLINE_VARIANT}
              keyboardType="decimal-pad"
              accessibilityLabel={ADD_MONEY_SCREEN.amountLabel}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {quickAmounts.map((chip) => {
              const active = Number.parseFloat(amount) === chip.amount;
              return (
                <Pressable
                  key={chip.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setQuickAmount(chip.amount)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={chip.label}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.sourcesSection}>
          <Text style={styles.fieldLabel}>{ADD_MONEY_SCREEN.paymentSourceLabel}</Text>
          <View style={styles.sourcesList}>
            {sources.map((source) => {
              const selected = source.id === selectedSourceId;
              return (
                <Pressable
                  key={source.id}
                  style={[styles.sourceCard, selected && styles.sourceCardActive]}
                  onPress={() => selectSource(source.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${source.title}. ${source.subtitle}`}
                >
                  <View style={styles.sourceLeft}>
                    <View
                      style={[
                        styles.sourceIcon,
                        source.type === 'upi' && styles.sourceIconUpi,
                      ]}
                    >
                      <Ionicons
                        name={source.icon === 'business' ? 'business' : 'card-outline'}
                        size={22}
                        color={addMoneyTokens.PRIMARY}
                      />
                    </View>
                    <View>
                      <Text style={styles.sourceTitle}>{source.title}</Text>
                      <Text style={styles.sourceSubtitle}>{source.subtitle}</Text>
                    </View>
                  </View>
                  <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.linkOptions}>
            <Pressable
              style={({ pressed }) => [
                styles.linkCard,
                pressed && {
                  borderColor: addMoneyTokens.PRIMARY,
                  opacity: 0.95,
                },
              ]}
              onPress={linkUpi}
              accessibilityRole="button"
              accessibilityLabel={ADD_MONEY_SCREEN.linkUpiTitle}
            >
              <Ionicons name="card-outline" size={24} color={addMoneyTokens.ON_SURFACE_VARIANT} />
              <View style={styles.linkTextBlock}>
                <Text style={styles.linkTitle}>{ADD_MONEY_SCREEN.linkUpiTitle}</Text>
                <Text style={styles.linkSubtitle}>{ADD_MONEY_SCREEN.linkUpiSubtitle}</Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.linkCard,
                pressed && {
                  borderColor: addMoneyTokens.PRIMARY,
                  opacity: 0.95,
                },
              ]}
              onPress={linkBank}
              accessibilityRole="button"
              accessibilityLabel={ADD_MONEY_SCREEN.linkBankTitle}
            >
              <Ionicons name="wallet-outline" size={24} color={addMoneyTokens.ON_SURFACE_VARIANT} />
              <View style={styles.linkTextBlock}>
                <Text style={styles.linkTitle}>{ADD_MONEY_SCREEN.linkBankTitle}</Text>
                <Text style={styles.linkSubtitle}>{ADD_MONEY_SCREEN.linkBankSubtitle}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.actionBlock}>
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            onPress={submit}
            accessibilityRole="button"
            accessibilityLabel={ADD_MONEY_SCREEN.submitLabel}
          >
            <Text style={styles.submitLabel}>{ADD_MONEY_SCREEN.submitLabel}</Text>
            <Ionicons name="arrow-forward" size={18} color={addMoneyTokens.ON_PRIMARY} />
          </Pressable>

          <View style={styles.secureRow}>
            <Ionicons name="lock-closed" size={14} color={addMoneyTokens.OUTLINE} />
            <Text style={styles.secureNote}>{ADD_MONEY_SCREEN.secureNote}</Text>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

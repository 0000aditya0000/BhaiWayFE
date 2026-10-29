import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import {
  AppFooter,
  IconButton,
  KeyboardAwareScrollView,
  BhaiWayCoinIcon,
  AppText as Text,
  AppTextInput as TextInput,
} from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { ADD_MONEY_SCREEN } from '@/features/profile/constants';
import { useAddMoney } from '@/features/profile/hooks';
import { addMoneyTokens, styles } from './AddMoneyScreen.styles';

export const AddMoneyScreen = () => {
  const router = useRouter();
  const {
    amount,
    quickAmounts,
    coinsPreview,
    rupeePreview,
    submitting,
    setAmount,
    setQuickAmount,
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
          {ADD_MONEY_SCREEN.title}
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
            <Text style={styles.rupeePrefix}>₹</Text>
            <TextInput
              style={[styles.amountInput, amountFocused && styles.amountInputFocused]}
              value={amount}
              onChangeText={setAmount}
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
              placeholder={ADD_MONEY_SCREEN.amountPlaceholder}
              placeholderTextColor={addMoneyTokens.OUTLINE_VARIANT}
              keyboardType="number-pad"
              accessibilityLabel={ADD_MONEY_SCREEN.amountLabel}
            />
          </View>
          <Text style={styles.hint}>{ADD_MONEY_SCREEN.rupeeHint}</Text>

          <View style={styles.previewBlock}>
            <Text style={styles.previewLabel}>{ADD_MONEY_SCREEN.coinsPreviewLabel}</Text>
            <View style={styles.previewRow}>
              <Text style={styles.rupeePreview}>{rupeePreview}</Text>
              <View style={styles.previewCoinsRow}>
                <BhaiWayCoinIcon size={18} />
                <Text style={styles.coinsPreview}>{coinsPreview} Coins</Text>
              </View>
            </View>
          </View>

          <View style={styles.chipsRowWrap}>
            {quickAmounts.map((chip) => {
              const active = amount === chip.amount;
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
          </View>
        </View>

        <View style={styles.actionBlock}>
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              (pressed || submitting) && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            onPress={submit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={ADD_MONEY_SCREEN.submitLabel}
          >
            {submitting ? (
              <ActivityIndicator color={addMoneyTokens.ON_PRIMARY} />
            ) : (
              <>
                <Text style={styles.submitLabel}>{ADD_MONEY_SCREEN.submitLabel}</Text>
                <Ionicons name="arrow-forward" size={18} color={addMoneyTokens.ON_PRIMARY} />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

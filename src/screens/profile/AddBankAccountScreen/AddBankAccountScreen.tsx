import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  IconButton,
  KeyboardAwareScrollView,
  AppText as Text,
  AppTextInput as TextInput,
} from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { ADD_BANK_ACCOUNT_SCREEN } from '@/features/profile/constants';
import { useAddBankAccount } from '@/features/profile/hooks';
import { addBankTokens, styles } from './AddBankAccountScreen.styles';

type FocusField = 'holderName' | 'bankName' | 'accountNumber' | 'ifsc' | null;

export const AddBankAccountScreen = () => {
  const {
    form,
    submitState,
    avatarUri,
    setHolderName,
    setBankName,
    setAccountNumber,
    setIfsc,
    findIfsc,
    submit,
    goBack,
    openProfile,
  } = useAddBankAccount();

  const [focused, setFocused] = useState<FocusField>(null);
  const isBusy = submitState !== 'idle';

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleFind = useCallback(() => {
    triggerLightHaptic();
    findIfsc();
  }, [findIfsc]);

  const handleSubmit = useCallback(() => {
    void submit();
  }, [submit]);

  const submitLabel =
    submitState === 'submitting'
      ? ADD_BANK_ACCOUNT_SCREEN.submittingLabel
      : submitState === 'success'
        ? ADD_BANK_ACCOUNT_SCREEN.successLabel
        : ADD_BANK_ACCOUNT_SCREEN.submitLabel;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={addBankTokens.PRIMARY}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
            {ADD_BANK_ACCOUNT_SCREEN.brandTitle}
          </Text>

        <Pressable
          style={({ pressed }) => [styles.avatarButton, pressed && { opacity: 0.88 }]}
          onPress={openProfile}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Image source={{ uri: avatarUri }} style={styles.avatar} accessibilityIgnoresInvertColors />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomInset={40}
      >
        <View style={styles.intro}>
          <Text style={styles.title}>{ADD_BANK_ACCOUNT_SCREEN.title}</Text>
          <Text style={styles.subtitle}>{ADD_BANK_ACCOUNT_SCREEN.subtitle}</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>{ADD_BANK_ACCOUNT_SCREEN.holderNameLabel}</Text>
            <TextInput
              style={[styles.input, focused === 'holderName' && styles.inputFocused]}
              value={form.holderName}
              onChangeText={setHolderName}
              onFocus={() => setFocused('holderName')}
              onBlur={() => setFocused(null)}
              placeholder={ADD_BANK_ACCOUNT_SCREEN.holderNamePlaceholder}
              placeholderTextColor={addBankTokens.OUTLINE_VARIANT}
              autoCapitalize="words"
              editable={!isBusy}
              accessibilityLabel={ADD_BANK_ACCOUNT_SCREEN.holderNameLabel}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{ADD_BANK_ACCOUNT_SCREEN.bankNameLabel}</Text>
            <View style={styles.inputIconWrap}>
              <Ionicons
                name="business-outline"
                size={20}
                color={addBankTokens.OUTLINE_VARIANT}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIcon,
                  focused === 'bankName' && styles.inputFocused,
                ]}
                value={form.bankName}
                onChangeText={setBankName}
                onFocus={() => setFocused('bankName')}
                onBlur={() => setFocused(null)}
                placeholder={ADD_BANK_ACCOUNT_SCREEN.bankNamePlaceholder}
                placeholderTextColor={addBankTokens.OUTLINE_VARIANT}
                autoCapitalize="words"
                editable={!isBusy}
                accessibilityLabel={ADD_BANK_ACCOUNT_SCREEN.bankNameLabel}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{ADD_BANK_ACCOUNT_SCREEN.accountNumberLabel}</Text>
            <TextInput
              style={[styles.input, focused === 'accountNumber' && styles.inputFocused]}
              value={form.accountNumber}
              onChangeText={setAccountNumber}
              onFocus={() => setFocused('accountNumber')}
              onBlur={() => setFocused(null)}
              placeholder={ADD_BANK_ACCOUNT_SCREEN.accountNumberPlaceholder}
              placeholderTextColor={addBankTokens.OUTLINE_VARIANT}
              keyboardType="number-pad"
              secureTextEntry
              editable={!isBusy}
              accessibilityLabel={ADD_BANK_ACCOUNT_SCREEN.accountNumberLabel}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{ADD_BANK_ACCOUNT_SCREEN.ifscLabel}</Text>
            <View style={styles.ifscRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.ifscInput,
                  focused === 'ifsc' && styles.inputFocused,
                ]}
                value={form.ifsc}
                onChangeText={setIfsc}
                onFocus={() => setFocused('ifsc')}
                onBlur={() => setFocused(null)}
                placeholder={ADD_BANK_ACCOUNT_SCREEN.ifscPlaceholder}
                placeholderTextColor={addBankTokens.OUTLINE_VARIANT}
                autoCapitalize="characters"
                editable={!isBusy}
                accessibilityLabel={ADD_BANK_ACCOUNT_SCREEN.ifscLabel}
              />
              <Pressable
                style={({ pressed }) => [styles.findButton, pressed && { opacity: 0.9 }]}
                onPress={handleFind}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel={ADD_BANK_ACCOUNT_SCREEN.findLabel}
              >
                <Text style={styles.findLabel}>{ADD_BANK_ACCOUNT_SCREEN.findLabel}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.infoChip}>
            <Ionicons name="information-circle" size={16} color={addBankTokens.PRIMARY} />
            <Text style={styles.infoText}>{ADD_BANK_ACCOUNT_SCREEN.infoNote}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              submitState === 'success' && styles.submitButtonSuccess,
              isBusy && styles.submitButtonDisabled,
              pressed && !isBusy && { transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleSubmit}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={submitLabel}
          >
            {submitState === 'submitting' ? (
              <ActivityIndicator color={addBankTokens.ON_PRIMARY} />
            ) : (
              <Text style={styles.submitLabel}>{submitLabel}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

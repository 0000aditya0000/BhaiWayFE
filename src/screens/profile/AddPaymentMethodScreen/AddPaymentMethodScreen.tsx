import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ADD_PAYMENT_METHOD_SCREEN } from '@/features/profile/constants/payment-methods.constants';
import { useAddPaymentMethod } from '@/features/profile/hooks/useAddPaymentMethod';
import {
  Button,
  IconButton,
  Input,
  KeyboardAwareScrollView,
  AppText as Text,
} from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { styles, tokens } from './AddPaymentMethodScreen.styles';

export const AddPaymentMethodScreen = () => {
  const {
    title,
    step,
    upiId,
    accountHolderName,
    bankName,
    accountNumber,
    confirmAccountNumber,
    ifscCode,
    fieldError,
    submitting,
    setUpiId,
    setAccountHolderName,
    setBankName,
    setAccountNumber,
    setConfirmAccountNumber,
    setIfscCode,
    chooseUpi,
    chooseBank,
    goBack,
    submitUpi,
    submitBank,
  } = useAddPaymentMethod();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={tokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomInset={40}
      >
        {step === 'choose' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{ADD_PAYMENT_METHOD_SCREEN.chooseTitle}</Text>
            <Pressable
              style={styles.optionCard}
              onPress={chooseUpi}
              accessibilityRole="button"
              accessibilityLabel={ADD_PAYMENT_METHOD_SCREEN.upiOption}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="phone-portrait-outline" size={22} color={tokens.PRIMARY} />
              </View>
              <Text style={styles.optionLabel}>{ADD_PAYMENT_METHOD_SCREEN.upiOption}</Text>
              <Ionicons name="chevron-forward" size={18} color={tokens.ON_SURFACE_VARIANT} />
            </Pressable>
            <Pressable
              style={styles.optionCard}
              onPress={chooseBank}
              accessibilityRole="button"
              accessibilityLabel={ADD_PAYMENT_METHOD_SCREEN.bankOption}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="business-outline" size={22} color={tokens.PRIMARY} />
              </View>
              <Text style={styles.optionLabel}>{ADD_PAYMENT_METHOD_SCREEN.bankOption}</Text>
              <Ionicons name="chevron-forward" size={18} color={tokens.ON_SURFACE_VARIANT} />
            </Pressable>
          </View>
        ) : null}

        {step === 'UPI' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{ADD_PAYMENT_METHOD_SCREEN.upiTitle}</Text>
            <Text style={styles.hint}>{ADD_PAYMENT_METHOD_SCREEN.upiHint}</Text>
            <Input
              label={ADD_PAYMENT_METHOD_SCREEN.upiTitle}
              value={upiId}
              onChangeText={setUpiId}
              placeholder={ADD_PAYMENT_METHOD_SCREEN.upiPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!submitting}
              error={fieldError ?? undefined}
            />
            <Button
              label={
                submitting
                  ? ADD_PAYMENT_METHOD_SCREEN.addingUpiLabel
                  : ADD_PAYMENT_METHOD_SCREEN.addUpiLabel
              }
              onPress={submitUpi}
              disabled={submitting}
              loading={submitting}
              accessibilityLabel={ADD_PAYMENT_METHOD_SCREEN.addUpiLabel}
            />
          </View>
        ) : null}

        {step === 'BANK_ACCOUNT' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{ADD_PAYMENT_METHOD_SCREEN.bankTitle}</Text>
            <Input
              label={ADD_PAYMENT_METHOD_SCREEN.holderLabel}
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              editable={!submitting}
            />
            <Input
              label={ADD_PAYMENT_METHOD_SCREEN.bankNameLabel}
              value={bankName}
              onChangeText={setBankName}
              editable={!submitting}
            />
            <Input
              label={ADD_PAYMENT_METHOD_SCREEN.accountLabel}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
              editable={!submitting}
              secureTextEntry
            />
            <Input
              label={ADD_PAYMENT_METHOD_SCREEN.confirmAccountLabel}
              value={confirmAccountNumber}
              onChangeText={setConfirmAccountNumber}
              keyboardType="number-pad"
              editable={!submitting}
              secureTextEntry
            />
            <Input
              label={ADD_PAYMENT_METHOD_SCREEN.ifscLabel}
              value={ifscCode}
              onChangeText={setIfscCode}
              autoCapitalize="characters"
              editable={!submitting}
              error={fieldError ?? undefined}
            />
            <Button
              label={
                submitting
                  ? ADD_PAYMENT_METHOD_SCREEN.addingBankLabel
                  : ADD_PAYMENT_METHOD_SCREEN.addBankLabel
              }
              onPress={submitBank}
              disabled={submitting}
              loading={submitting}
              accessibilityLabel={ADD_PAYMENT_METHOD_SCREEN.addBankLabel}
            />
          </View>
        ) : null}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

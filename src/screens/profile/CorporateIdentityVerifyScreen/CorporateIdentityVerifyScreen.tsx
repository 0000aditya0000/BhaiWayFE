import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MorphingOTPInput } from '@/features/auth/components';
import { CORPORATE_IDENTITY_VERIFY_SCREEN } from '@/features/profile/constants/corporate-identity.constants';
import {
  CORPORATE_OTP_LENGTH,
  useCorporateIdentityVerifyScreen,
} from '@/features/profile/hooks/useCorporateIdentityVerifyScreen';
import {
  Button,
  IconButton,
  Input,
  KeyboardAwareScrollView,
  AppText as Text,
} from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { corporateVerifyTokens, styles } from './CorporateIdentityVerifyScreen.styles';

export const CorporateIdentityVerifyScreen = () => {
  const {
    step,
    title,
    subtitle,
    email,
    setEmail,
    otp,
    setOtp,
    error,
    isSending,
    isVerifying,
    canContinue,
    canVerify,
    canResend,
    resendLabel,
    continueLabel,
    verifyLabel,
    goBack,
    continueWithEmail,
    verify,
    resend,
    changeEmail,
  } = useCorporateIdentityVerifyScreen();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const busy = isSending || isVerifying;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={corporateVerifyTokens.PRIMARY}
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
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons
              name={step === 'otp' ? 'key-outline' : 'mail-outline'}
              size={36}
              color={corporateVerifyTokens.PRIMARY}
            />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>{subtitle}</Text>
          </View>
        </View>

        {step === 'email' ? (
          <View style={styles.formCard}>
            <Input
              label={CORPORATE_IDENTITY_VERIFY_SCREEN.emailLabel}
              value={email}
              onChangeText={setEmail}
              placeholder={CORPORATE_IDENTITY_VERIFY_SCREEN.emailPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!busy}
              error={error ?? undefined}
              accessibilityLabel={CORPORATE_IDENTITY_VERIFY_SCREEN.emailLabel}
            />

            <Button
              label={continueLabel}
              onPress={continueWithEmail}
              disabled={!canContinue}
              loading={isSending}
              accessibilityLabel={continueLabel}
            />
          </View>
        ) : (
          <View style={styles.formCard}>
            <MorphingOTPInput
              value={otp}
              onChange={setOtp}
              cellCount={CORPORATE_OTP_LENGTH}
              error={error ?? undefined}
              status={isVerifying ? 'verifying' : error ? 'error' : 'idle'}
              editable={!busy}
              accessibilityLabel={CORPORATE_IDENTITY_VERIFY_SCREEN.otpLabel}
            />

            <Pressable
              onPress={resend}
              disabled={!canResend}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canResend }}
              accessibilityLabel={resendLabel}
              style={styles.resendButton}
            >
              <Text style={[styles.resendText, !canResend && styles.resendDisabled]}>
                {isSending ? CORPORATE_IDENTITY_VERIFY_SCREEN.sendingLabel : resendLabel}
              </Text>
            </Pressable>

            <Button
              label={verifyLabel}
              onPress={verify}
              disabled={!canVerify}
              loading={isVerifying}
              accessibilityLabel={verifyLabel}
            />

            <Pressable
              onPress={changeEmail}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={CORPORATE_IDENTITY_VERIFY_SCREEN.changeEmailLabel}
              style={styles.changeEmailButton}
            >
              <Text style={styles.changeEmailText}>
                {CORPORATE_IDENTITY_VERIFY_SCREEN.changeEmailLabel}
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

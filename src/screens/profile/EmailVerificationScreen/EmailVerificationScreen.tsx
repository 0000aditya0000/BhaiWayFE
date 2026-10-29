import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MorphingOTPInput } from '@/features/auth/components';
import {
  EMAIL_OTP_LENGTH,
  useEmailVerificationScreen,
} from '@/features/profile/hooks/useEmailVerificationScreen';
import { EMAIL_VERIFICATION_SCREEN } from '@/features/profile/constants/email-verification.constants';
import {
  Button,
  IconButton,
  KeyboardAwareScrollView,
  AppText as Text,
} from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { emailVerifyTokens, styles } from './EmailVerificationScreen.styles';

export const EmailVerificationScreen = () => {
  const {
    title,
    description,
    otp,
    setOtp,
    error,
    isSending,
    isVerifying,
    isLoading,
    canVerify,
    canResend,
    resendLabel,
    verifyLabel,
    goBack,
    verify,
    resend,
  } = useEmailVerificationScreen();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const busy = isVerifying || isSending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={emailVerifyTokens.PRIMARY}
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
            <Ionicons name="mail-outline" size={36} color={emailVerifyTokens.PRIMARY} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>{description}</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={emailVerifyTokens.PRIMARY} />
        ) : (
          <View style={styles.otpCard}>
            <MorphingOTPInput
              value={otp}
              onChange={setOtp}
              cellCount={EMAIL_OTP_LENGTH}
              error={error ?? undefined}
              status={isVerifying ? 'verifying' : error ? 'error' : 'idle'}
              editable={!busy}
              accessibilityLabel={EMAIL_VERIFICATION_SCREEN.otpLabel}
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
                {isSending ? 'Sending…' : resendLabel}
              </Text>
            </Pressable>

            <Button
              label={verifyLabel}
              onPress={verify}
              disabled={!canVerify}
              loading={isVerifying}
              accessibilityLabel={verifyLabel}
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

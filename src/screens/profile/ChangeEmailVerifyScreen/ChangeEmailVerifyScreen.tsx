import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MorphingOTPInput } from '@/features/auth/components';
import { CHANGE_EMAIL_VERIFY_SCREEN } from '@/features/profile/constants/change-email.constants';
import { useVerifyChangeEmail } from '@/features/profile/hooks/useVerifyChangeEmail';
import { EMAIL_CHANGE_OTP_LENGTH } from '@/features/profile/utils/emailChange.mapper';
import {
  Button,
  IconButton,
  KeyboardAwareScrollView,
  AppText as Text,
} from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { changeEmailVerifyTokens, styles } from './ChangeEmailVerifyScreen.styles';

export const ChangeEmailVerifyScreen = () => {
  const {
    maskedEmail,
    otp,
    setOtp,
    error,
    isVerifying,
    isResending,
    attemptsExceeded,
    canVerify,
    canResend,
    verifyLabel,
    resendLabel,
    goBack,
    handleChangeEmail,
    verifyOtp,
    resendOtp,
  } = useVerifyChangeEmail();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleVerify = useCallback(() => {
    void verifyOtp();
  }, [verifyOtp]);

  const handleResend = useCallback(() => {
    void resendOtp();
  }, [resendOtp]);

  const busy = isVerifying || isResending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={changeEmailVerifyTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {CHANGE_EMAIL_VERIFY_SCREEN.title}
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
            <Ionicons name="key-outline" size={32} color={changeEmailVerifyTokens.PRIMARY} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{CHANGE_EMAIL_VERIFY_SCREEN.title}</Text>
            <Text style={styles.heroSubtitle}>{CHANGE_EMAIL_VERIFY_SCREEN.description}</Text>
          </View>
        </View>

        <View style={styles.targetEmailCard}>
          <View style={styles.targetEmailLeft}>
            <Text style={styles.targetEmailPrefix}>
              {CHANGE_EMAIL_VERIFY_SCREEN.maskedEmailPrefix}
            </Text>
            <Text style={styles.targetEmailValue} numberOfLines={1}>
              {maskedEmail}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.changeEmailBtn, pressed && { opacity: 0.7 }]}
            onPress={handleChangeEmail}
            accessibilityRole="button"
            accessibilityLabel={`${CHANGE_EMAIL_VERIFY_SCREEN.changeEmailAction} email`}
          >
            <Text style={styles.changeEmailBtnText}>
              {CHANGE_EMAIL_VERIFY_SCREEN.changeEmailAction}
            </Text>
          </Pressable>
        </View>

        <View style={styles.otpCard}>
          <Text style={styles.otpLabel}>{CHANGE_EMAIL_VERIFY_SCREEN.otpLabel}</Text>

          <MorphingOTPInput
            value={otp}
            onChange={setOtp}
            cellCount={EMAIL_CHANGE_OTP_LENGTH}
            error={error ?? undefined}
            status={isVerifying ? 'verifying' : error ? 'error' : 'idle'}
            editable={!busy && !attemptsExceeded}
            accessibilityLabel={CHANGE_EMAIL_VERIFY_SCREEN.otpLabel}
          />

          {error ? (
            <View style={styles.errorBanner} accessibilityLiveRegion="polite">
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={changeEmailVerifyTokens.DANGER}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleResend}
            disabled={!canResend}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canResend }}
            accessibilityLabel={resendLabel}
            style={styles.resendButton}
          >
            <Text style={[styles.resendText, !canResend && styles.resendDisabled]}>
              {resendLabel}
            </Text>
          </Pressable>

          <Button
            label={verifyLabel}
            onPress={handleVerify}
            disabled={!canVerify}
            loading={isVerifying}
            accessibilityLabel={verifyLabel}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

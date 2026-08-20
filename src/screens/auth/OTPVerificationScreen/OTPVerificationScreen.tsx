import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { MorphingOTPInput } from '@/features/auth/components';
import { AUTH_CONSTANTS } from '@/features/auth/constants';
import { useOtpVerification } from '@/features/auth/hooks';
import { Button, IconButton, KeyboardAwareScrollView, AppText as Text } from '@/shared/components';
import { colors, spacing } from '@/theme';
import { styles } from './OTPVerificationScreen.styles';

export const OTPVerificationScreen = () => {
  const router = useRouter();
  const {
    maskedPhone,
    code,
    setCode,
    error,
    loading,
    status,
    isValid,
    secondsLeft,
    canResend,
    verify,
    resend,
  } = useOtpVerification();

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.phone);
  }, [router]);

  const openFaq = useCallback(() => {
    router.push({ pathname: ROUTES.authFaq, params: { topic: 'auth' } });
  }, [router]);

  const isBusy = status === 'verifying' || status === 'success';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={colors.primary}
          accessibilityLabel="Go back"
        />
        <View style={styles.topBarSpacer} />
        <IconButton
          icon="help-circle-outline"
          onPress={openFaq}
          color={colors.primary}
          accessibilityLabel="Open FAQ"
        />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        bottomInset={spacing.xxxl}
      >
        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.lockWrapper}>
            <View style={styles.lockCircle}>
              <Ionicons name="lock-closed" size={36} color={colors.primary} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <Text style={styles.heading} accessibilityRole="header">
              Verify your number
            </Text>
            <Text style={styles.subtitle}>
              Enter the {AUTH_CONSTANTS.otpLength}-digit code sent to your number
              {maskedPhone ? `\n${maskedPhone}` : ''}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.otpWrapper}>
            <MorphingOTPInput
              value={code}
              onChange={setCode}
              onComplete={() => {
                void verify();
              }}
              cellCount={AUTH_CONSTANTS.otpLength}
              error={error}
              status={status}
              editable={!isBusy}
            />
          </Animated.View>

          <Pressable
            onPress={resend}
            disabled={!canResend || isBusy}
            accessibilityRole="button"
            accessibilityLabel={
              canResend ? 'Resend verification code' : `Resend code in ${secondsLeft} seconds`
            }
            style={styles.resendButton}
            android_ripple={{ color: 'rgba(55, 75, 177, 0.08)' }}
          >
            <Text style={[styles.resendText, (!canResend || isBusy) && styles.resendDisabled]}>
              {canResend ? 'Resend Code' : `Resend Code (${secondsLeft}s)`}
            </Text>
          </Pressable>

          <Animated.View entering={FadeInDown.delay(260).duration(400)} style={styles.buttonWrapper}>
            <Button
              label={status === 'success' ? 'Verified' : 'Verify'}
              onPress={() => {
                void verify();
              }}
              disabled={!isValid || isBusy}
              loading={loading && status === 'verifying'}
              accessibilityLabel="Verify phone number"
            />
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

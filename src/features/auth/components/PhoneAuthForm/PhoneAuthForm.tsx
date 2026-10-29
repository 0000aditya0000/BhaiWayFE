import React, { useCallback } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import {
  Button,
  Header,
  IconButton,
  Input,
  KeyboardAwareScrollView,
  PhoneInput,
  AppText as Text,
} from '@/shared/components';
import { colors } from '@/theme';
import { usePhoneAuth } from '../../hooks';
import { styles } from './PhoneAuthForm.styles';
import type { PhoneAuthFormProps } from './PhoneAuthForm.types';

export const PhoneAuthForm = ({
  flow,
  title,
  heading,
  subtitle,
}: PhoneAuthFormProps) => {
  const router = useRouter();
  const {
    phoneNumber,
    setPhoneNumber,
    referralCode,
    setReferralCode,
    showReferralField,
    referralFieldLabel,
    referralFieldPlaceholder,
    referralFieldHint,
    isValid,
    loading,
    submit,
  } = usePhoneAuth(flow);
  const showHeader = Boolean(title);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.welcome);
  }, [router]);

  const openFaq = useCallback(() => {
    router.push({ pathname: ROUTES.authFaq, params: { topic: 'auth' } });
  }, [router]);

  const content = (
    <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent}>
      <Animated.View entering={FadeInUp.duration(400)}>
        <Text style={styles.heading} accessibilityRole="header">
          {heading}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.inputWrapper}>
        <PhoneInput value={phoneNumber} onChangeText={setPhoneNumber} autoFocus />
      </Animated.View>

      {showReferralField ? (
        <Animated.View
          entering={FadeInDown.delay(160).duration(400)}
          style={styles.referralWrapper}
        >
          <Input
            label={referralFieldLabel}
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder={referralFieldPlaceholder}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel={referralFieldLabel}
          />
          <Text style={styles.referralHint}>{referralFieldHint}</Text>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.buttonWrapper}>
        <Button
          label="Continue"
          onPress={submit}
          disabled={!isValid}
          loading={loading}
          accessibilityLabel="Continue to verification"
        />
      </Animated.View>
    </KeyboardAwareScrollView>
  );

  if (!showHeader) {
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
        {content}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title={title} onBack={handleBack} onHelp={openFaq} variant="light" />
      {content}
    </View>
  );
};

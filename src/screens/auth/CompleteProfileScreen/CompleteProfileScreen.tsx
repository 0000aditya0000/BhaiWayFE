import React, { useCallback } from 'react';
import { Keyboard, KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, View } from 'react-native';

import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { Button, Header, Input, AppText as Text } from '@/shared/components';
import { spacing } from '@/shared/theme';
import {
  keyboardAvoidingBehavior,
  keyboardVerticalOffset,
  scrollKeyboardDismissMode,
} from '@/shared/utils/platform';
import { AvatarPicker, IdentityCard } from '@/features/auth/components';
import { useCompleteProfile } from '@/features/auth/hooks';
import { styles } from './CompleteProfileScreen.styles';

export const CompleteProfileScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    form,
    avatarUri,
    setAvatarUri,
    loading,
    isIdentityVerified,
    genderLabel,
    saveDraft,
    submit,
  } = useCompleteProfile();
  const {
    control,
    formState: { errors, isValid },
  } = form;

  const handleVerifyIdentity = useCallback(() => {
    saveDraft();
    router.push(ROUTES.authIdentityVerification);
  }, [router, saveDraft]);

  const handleHelp = useCallback(() => {
    router.push({ pathname: ROUTES.authFaq, params: { topic: 'profile' } });
  }, [router]);

  return (
    <View style={styles.screen}>
      <Header
        title="Setup Profile"
        variant="profile"
        onBack={() => router.back()}
        onHelp={handleHelp}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={keyboardAvoidingBehavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + spacing.huge + spacing.xxxl },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={scrollKeyboardDismissMode}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInUp.duration(400)}>
              <AvatarPicker imageUri={avatarUri} onImageSelected={setAvatarUri} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Full Name *"
                    placeholder="Enter your full name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.fullName?.message}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email Address *"
                    placeholder="name@example.com"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                  />
                )}
              />

              <View style={styles.genderReadOnly}>
                <Input
                  label="Gender"
                  value={genderLabel}
                  editable={false}
                  pointerEvents="none"
                />
                <Text style={styles.genderHint}>
                  Gender is set from identity verification and cannot be edited.
                </Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(260).duration(400)}>
              <IdentityCard
                optional
                verified={isIdentityVerified}
                onVerifyPress={handleVerifyIdentity}
              />
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          label="Save and Continue"
          onPress={submit}
          disabled={!isValid || loading}
          loading={loading}
          accessibilityLabel="Save profile and continue"
        />
      </View>
    </View>
  );
};

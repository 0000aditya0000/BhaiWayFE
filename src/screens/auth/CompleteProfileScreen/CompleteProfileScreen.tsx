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
import { AvatarPicker, GenderCard, IdentityCard } from '@/features/auth/components';
import { useCompleteProfile } from '@/features/auth/hooks';
import type { Gender } from '@/features/auth/types';
import { styles } from './CompleteProfileScreen.styles';

const GENDER_OPTIONS: { label: string; value: Gender; fullWidth?: boolean }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Prefer not to say / Other', value: 'other', fullWidth: true },
];

export const CompleteProfileScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    form,
    avatarUri,
    setAvatarUri,
    loading,
    isIdentityVerified,
    saveDraft,
    submit,
  } = useCompleteProfile();
  const {
    control,
    watch,
    setValue,
    formState: { errors, isValid },
  } = form;

  const selectedGender = watch('gender');

  const handleSelectGender = useCallback(
    (value: Gender) => {
      setValue('gender', value, { shouldValidate: true, shouldDirty: true });
    },
    [setValue],
  );

  const handleVerifyIdentity = useCallback(() => {
    saveDraft();
    router.push(ROUTES.authVerifyAadhaar);
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
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(180).duration(400)}>
              <Text style={styles.genderLabel}>Gender *</Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.filter((option) => !option.fullWidth).map((option) => (
                  <GenderCard
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    selected={selectedGender === option.value}
                    onSelect={handleSelectGender}
                  />
                ))}
              </View>
              {GENDER_OPTIONS.filter((option) => option.fullWidth).map((option) => (
                <GenderCard
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  selected={selectedGender === option.value}
                  onSelect={handleSelectGender}
                  fullWidth
                />
              ))}
              {errors.gender?.message ? (
                <Text style={styles.error} accessibilityLiveRegion="polite">
                  {errors.gender.message}
                </Text>
              ) : null}
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

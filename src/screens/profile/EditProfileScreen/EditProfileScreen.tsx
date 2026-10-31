import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Controller } from 'react-hook-form';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarPicker } from '@/features/auth/components';
import { EDIT_PROFILE_SCREEN } from '@/features/profile/constants';
import { useEditProfile } from '@/features/profile/hooks';
import { Button, Header, Input, AppText as Text } from '@/shared/components';
import { spacing } from '@/shared/theme';
import {
  keyboardAvoidingBehavior,
  keyboardVerticalOffset,
  scrollKeyboardDismissMode,
} from '@/shared/utils/platform';
import { editProfileTokens, styles } from './EditProfileScreen.styles';

export const EditProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    form,
    avatarUri,
    phoneLabel,
    genderLabel,
    loadingProfile,
    saving,
    avatarUploading,
    setAvatarUri,
    submit,
    goBack,
  } = useEditProfile();

  const {
    control,
    formState: { errors, isValid },
  } = form;

  if (loadingProfile) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={editProfileTokens.PRIMARY} />
      </View>
    );
  }

  const canSave = isValid;

  return (
    <View style={styles.screen}>
      <Header
        title={EDIT_PROFILE_SCREEN.title}
        variant="profile"
        onBack={goBack}
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

              <View style={styles.phoneBlock}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { value } }) => (
                    <Input
                      label={EDIT_PROFILE_SCREEN.emailLabel}
                      placeholder="name@example.com"
                      value={value}
                      editable={false}
                      pointerEvents="none"
                    />
                  )}
                />
                <Text style={styles.phoneHint}>{EDIT_PROFILE_SCREEN.emailHint}</Text>
              </View>

              <View style={styles.phoneBlock}>
                <Input
                  label={EDIT_PROFILE_SCREEN.phoneLabel}
                  value={phoneLabel}
                  editable={false}
                  pointerEvents="none"
                />
                <Text style={styles.phoneHint}>{EDIT_PROFILE_SCREEN.phoneHint}</Text>
              </View>

              <View style={styles.phoneBlock}>
                <Input
                  label="Gender"
                  value={genderLabel}
                  editable={false}
                  pointerEvents="none"
                />
                <Text style={styles.phoneHint}>
                  Gender is set from identity verification and cannot be edited.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          label={EDIT_PROFILE_SCREEN.saveLabel}
          onPress={submit}
          disabled={!canSave || saving}
          loading={saving || avatarUploading}
          accessibilityLabel="Save profile changes"
        />
      </View>
    </View>
  );
};

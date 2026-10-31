import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CHANGE_EMAIL_SCREEN } from '@/features/profile/constants/change-email.constants';
import { useChangeEmail } from '@/features/profile/hooks/useChangeEmail';
import {
  Button,
  IconButton,
  Input,
  KeyboardAwareScrollView,
  AppText as Text,
} from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { changeEmailTokens, styles } from './ChangeEmailScreen.styles';

export const ChangeEmailScreen = () => {
  const {
    newEmail,
    setNewEmail,
    currentEmail,
    error,
    isSubmitting,
    canSubmit,
    goBack,
    submitRequest,
  } = useChangeEmail();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleSubmit = useCallback(() => {
    void submitRequest();
  }, [submitRequest]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={changeEmailTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {CHANGE_EMAIL_SCREEN.title}
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
            <Ionicons name="mail-outline" size={32} color={changeEmailTokens.PRIMARY} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{CHANGE_EMAIL_SCREEN.title}</Text>
            <Text style={styles.heroSubtitle}>{CHANGE_EMAIL_SCREEN.description}</Text>
          </View>
        </View>

        {currentEmail ? (
          <View style={styles.currentEmailBanner}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={changeEmailTokens.PRIMARY}
            />
            <View style={styles.currentEmailContent}>
              <Text style={styles.currentEmailLabel}>
                {CHANGE_EMAIL_SCREEN.currentEmailLabel}
              </Text>
              <Text style={styles.currentEmailValue} numberOfLines={1}>
                {currentEmail}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Input
            label={CHANGE_EMAIL_SCREEN.emailLabel}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder={CHANGE_EMAIL_SCREEN.emailPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            editable={!isSubmitting}
            returnKeyType="done"
            onSubmitEditing={canSubmit ? handleSubmit : undefined}
          />

          {error ? (
            <View style={styles.errorBanner} accessibilityLiveRegion="polite">
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={changeEmailTokens.DANGER}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            label={
              isSubmitting
                ? CHANGE_EMAIL_SCREEN.sendingButtonLabel
                : CHANGE_EMAIL_SCREEN.sendButtonLabel
            }
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={isSubmitting}
            accessibilityLabel={CHANGE_EMAIL_SCREEN.sendButtonLabel}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

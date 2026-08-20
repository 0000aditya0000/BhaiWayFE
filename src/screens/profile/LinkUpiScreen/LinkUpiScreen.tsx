import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  IconButton,
  KeyboardAwareScrollView,
  AppText as Text,
  AppTextInput as TextInput,
} from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { LINK_UPI_SCREEN } from '@/features/profile/constants';
import { useLinkUpi } from '@/features/profile/hooks';
import { linkUpiTokens, styles } from './LinkUpiScreen.styles';

export const LinkUpiScreen = () => {
  const {
    upiId,
    verified,
    verifiedName,
    verifying,
    saving,
    canSave,
    avatarUri,
    setUpiId,
    verifyUpi,
    saveUpi,
    goBack,
    openProfile,
  } = useLinkUpi();

  const [upiFocused, setUpiFocused] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleVerify = useCallback(() => {
    triggerLightHaptic();
    if (!upiId.trim().includes('@')) {
      setShowError(true);
      return;
    }
    setShowError(false);
    verifyUpi();
  }, [upiId, verifyUpi]);

  const handleSave = useCallback(() => {
    triggerLightHaptic();
    saveUpi();
  }, [saveUpi]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={linkUpiTokens.ON_SURFACE}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
            {LINK_UPI_SCREEN.title}
          </Text>

        <Pressable
          style={styles.avatarButton}
          onPress={openProfile}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Image source={{ uri: avatarUri }} style={styles.avatar} accessibilityIgnoresInvertColors />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        bottomInset={24}
      >
        <View style={styles.settingsCard}>
          <View style={styles.settingsHeader}>
            <View style={styles.settingsIcon}>
              <Ionicons name="wallet-outline" size={28} color={linkUpiTokens.PRIMARY} />
            </View>
            <View style={styles.settingsText}>
              <Text style={styles.settingsTitle}>{LINK_UPI_SCREEN.settingsTitle}</Text>
              <Text style={styles.settingsSubtitle}>{LINK_UPI_SCREEN.settingsSubtitle}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{LINK_UPI_SCREEN.upiLabel}</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <TextInput
                  style={[
                    styles.input,
                    upiFocused && styles.inputFocused,
                    verified && styles.inputVerified,
                    showError && styles.inputError,
                  ]}
                  value={upiId}
                  onChangeText={(value) => {
                    setShowError(false);
                    setUpiId(value);
                  }}
                  placeholder={LINK_UPI_SCREEN.upiPlaceholder}
                  placeholderTextColor="rgba(67, 70, 85, 0.45)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  onFocus={() => setUpiFocused(true)}
                  onBlur={() => setUpiFocused(false)}
                  accessibilityLabel={LINK_UPI_SCREEN.upiLabel}
                />
                <View style={styles.inputIcon} pointerEvents="none">
                  <Ionicons
                    name="radio-outline"
                    size={20}
                    color="rgba(67, 70, 85, 0.4)"
                  />
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.verifyButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                ]}
                onPress={handleVerify}
                disabled={verifying}
                accessibilityRole="button"
                accessibilityLabel={LINK_UPI_SCREEN.verifyLabel}
              >
                {verifying ? (
                  <ActivityIndicator color={linkUpiTokens.ON_PRIMARY_CONTAINER} />
                ) : (
                  <Text style={styles.verifyLabel}>{LINK_UPI_SCREEN.verifyLabel}</Text>
                )}
              </Pressable>
            </View>
          </View>

          {verified && verifiedName ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={linkUpiTokens.SUCCESS} />
              <Text style={styles.verifiedText}>
                {LINK_UPI_SCREEN.verifiedPrefix} {verifiedName}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.securityCard}>
          <Ionicons name="shield-checkmark-outline" size={32} color={linkUpiTokens.PRIMARY} />
          <Text style={styles.securityText}>{LINK_UPI_SCREEN.securityNote}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              (!canSave || saving) && styles.saveButtonDisabled,
              pressed && canSave && !saving && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleSave}
            disabled={!canSave || saving}
            accessibilityRole="button"
            accessibilityLabel={LINK_UPI_SCREEN.saveLabel}
          >
            {saving ? (
              <ActivityIndicator color={linkUpiTokens.ON_PRIMARY} />
            ) : (
              <Text style={styles.saveLabel}>{LINK_UPI_SCREEN.saveLabel}</Text>
            )}
          </Pressable>

          <View style={styles.secureRow}>
            <Ionicons name="lock-closed" size={14} color="rgba(67, 70, 85, 0.6)" />
            <Text style={styles.secureLabel}>{LINK_UPI_SCREEN.secureFooter}</Text>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

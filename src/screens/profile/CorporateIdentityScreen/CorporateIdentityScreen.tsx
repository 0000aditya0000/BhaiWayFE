import React, { useCallback } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CORPORATE_IDENTITY_SCREEN } from '@/features/profile/constants/corporate-identity.constants';
import { useCorporateIdentityScreen } from '@/features/profile/hooks/useCorporateIdentityScreen';
import { Button, IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { corporateIdentityTokens, styles } from './CorporateIdentityScreen.styles';

export const CorporateIdentityScreen = () => {
  const {
    title,
    subtitle,
    statusLabel,
    statusTone,
    email,
    verifiedAt,
    isLoading,
    error,
    primaryCta,
    goBack,
    onPrimaryAction,
  } = useCorporateIdentityScreen();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const statusPillStyle =
    statusTone === 'success'
      ? styles.statusSuccess
      : statusTone === 'warning'
        ? styles.statusWarning
        : styles.statusNeutral;

  const statusTextStyle =
    statusTone === 'success'
      ? styles.statusTextSuccess
      : statusTone === 'warning'
        ? styles.statusTextWarning
        : styles.statusTextNeutral;

  const statusIcon =
    statusTone === 'success'
      ? 'checkmark-circle'
      : statusTone === 'warning'
        ? 'time-outline'
        : 'shield-outline';

  const statusIconColor =
    statusTone === 'success'
      ? corporateIdentityTokens.SUCCESS
      : statusTone === 'warning'
        ? corporateIdentityTokens.WARNING
        : corporateIdentityTokens.ON_SURFACE_VARIANT;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={corporateIdentityTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={corporateIdentityTokens.PRIMARY} />
            <Text style={styles.loadingText}>{CORPORATE_IDENTITY_SCREEN.loadingLabel}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.heroRow}>
              <View style={styles.iconWrap}>
                <Ionicons
                  name="briefcase-outline"
                  size={28}
                  color={corporateIdentityTokens.PRIMARY}
                />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>{title}</Text>
                <Text style={styles.heroSubtitle}>{subtitle}</Text>
              </View>
            </View>

            <View style={[styles.statusPill, statusPillStyle]} accessibilityLiveRegion="polite">
              <Ionicons name={statusIcon} size={12} color={statusIconColor} />
              <Text style={[styles.statusText, statusTextStyle]}>{statusLabel}</Text>
            </View>

            {email ? (
              <View style={styles.emailBlock}>
                <Text style={styles.emailLabel}>Corporate email</Text>
                <Text style={styles.emailValue}>{email}</Text>
                {verifiedAt ? (
                  <Text style={styles.heroSubtitle}>
                    {CORPORATE_IDENTITY_SCREEN.verifiedAtLabel}{' '}
                    {new Date(verifiedAt).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {primaryCta ? (
              <Button
                label={primaryCta}
                onPress={onPrimaryAction}
                accessibilityLabel={primaryCta}
              />
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

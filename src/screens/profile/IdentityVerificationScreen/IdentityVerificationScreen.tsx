import React, { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IDENTITY_VERIFICATION_SCREEN } from '@/features/profile/constants/identity-verification.constants';
import { useIdentityVerification } from '@/features/profile/hooks/useIdentityVerification';
import { IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { identityTokens, styles } from './IdentityVerificationScreen.styles';

export const IdentityVerificationScreen = () => {
  const {
    title,
    subtitle,
    aadhaarVerified,
    corporateVerified,
    corporateOtpPending,
    goBack,
    openAadhaar,
    openCorporateIdentity,
  } = useIdentityVerification();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const corporateStatusLabel = corporateVerified
    ? IDENTITY_VERIFICATION_SCREEN.corporateEmail.verifiedLabel
    : corporateOtpPending
      ? IDENTITY_VERIFICATION_SCREEN.corporateEmail.pendingLabel
      : null;

  const corporateCta = corporateVerified
    ? 'View details'
    : corporateOtpPending
      ? 'Continue verification'
      : IDENTITY_VERIFICATION_SCREEN.corporateEmail.cta;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={identityTokens.PRIMARY}
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
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>{title}</Text>
          <Text style={styles.introBody}>{subtitle}</Text>
        </View>

        <Pressable
          onPress={openAadhaar}
          style={({ pressed }) => [styles.methodCard, pressed && styles.methodCardPressed]}
          accessibilityRole="button"
          accessibilityLabel={IDENTITY_VERIFICATION_SCREEN.aadhaar.title}
        >
          <View style={styles.methodIconWrap}>
            <Ionicons
              name={IDENTITY_VERIFICATION_SCREEN.aadhaar.icon}
              size={26}
              color={identityTokens.PRIMARY}
            />
          </View>
          <View style={styles.methodText}>
            <View style={styles.methodTitleRow}>
              <Text style={styles.methodTitle}>
                {IDENTITY_VERIFICATION_SCREEN.aadhaar.title}
              </Text>
              {aadhaarVerified ? (
                <View style={styles.verifiedPill}>
                  <Ionicons name="checkmark-circle" size={12} color={identityTokens.SUCCESS} />
                  <Text style={styles.verifiedLabel}>
                    {IDENTITY_VERIFICATION_SCREEN.aadhaar.verifiedLabel}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.methodSubtitle}>
              {IDENTITY_VERIFICATION_SCREEN.aadhaar.subtitle}
            </Text>
            <Text style={styles.methodCta}>
              {aadhaarVerified
                ? 'View details'
                : IDENTITY_VERIFICATION_SCREEN.aadhaar.cta}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={identityTokens.ON_SURFACE_VARIANT}
            style={styles.chevron}
          />
        </Pressable>

        <Pressable
          onPress={openCorporateIdentity}
          style={({ pressed }) => [styles.methodCard, pressed && styles.methodCardPressed]}
          accessibilityRole="button"
          accessibilityLabel={IDENTITY_VERIFICATION_SCREEN.corporateEmail.title}
        >
          <View style={styles.methodIconWrap}>
            <Ionicons
              name={IDENTITY_VERIFICATION_SCREEN.corporateEmail.icon}
              size={26}
              color={identityTokens.PRIMARY}
            />
          </View>
          <View style={styles.methodText}>
            <View style={styles.methodTitleRow}>
              <Text style={styles.methodTitle}>
                {IDENTITY_VERIFICATION_SCREEN.corporateEmail.title}
              </Text>
              {corporateStatusLabel ? (
                <View style={styles.verifiedPill}>
                  <Ionicons
                    name={corporateVerified ? 'checkmark-circle' : 'time-outline'}
                    size={12}
                    color={identityTokens.SUCCESS}
                  />
                  <Text style={styles.verifiedLabel}>{corporateStatusLabel}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.methodSubtitle}>
              {IDENTITY_VERIFICATION_SCREEN.corporateEmail.subtitle}
            </Text>
            <Text style={styles.methodCta}>{corporateCta}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={identityTokens.ON_SURFACE_VARIANT}
            style={styles.chevron}
          />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

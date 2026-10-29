import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { useAadhaarVerification } from '@/hooks/useAadhaarVerification';
import { aadhaarRewardUiStore } from '@/features/profile/store/aadhaarRewardUiStore';
import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { useSessionUser } from '@/shared/hooks';
import { triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { formatApiGenderLabel } from '@/shared/utils/womenOnlyRide';
import { styles, verifyAadhaarTokens } from './VerifyAadhaarScreen.styles';

export const VerifyAadhaarScreen = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthFlow = pathname.includes('/login');
  const sessionUser = useSessionUser();

  const {
    status,
    isStarting,
    isRefreshing,
    isPolling,
    verifiedName,
    verifiedGender,
    error,
    userMessage,
    startVerification,
    refreshStatus,
  } = useAadhaarVerification({
    onVerified: () => {
      triggerSuccessHaptic();
      // Backend credits the promotional reward; host polls wallet before celebrating.
      aadhaarRewardUiStore.signalAadhaarVerified();
    },
  });

  const isBusy = isStarting || isRefreshing;

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(isAuthFlow ? ROUTES.completeProfile : ROUTES.profile);
  }, [isAuthFlow, router]);

  const handleStart = useCallback(() => {
    triggerLightHaptic();
    void startVerification();
  }, [startVerification]);

  const handleCheckStatus = useCallback(() => {
    triggerLightHaptic();
    void refreshStatus();
  }, [refreshStatus]);

  const handleDone = useCallback(() => {
    triggerLightHaptic();
    if (isAuthFlow) {
      router.replace(ROUTES.completeProfile);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [isAuthFlow, router]);

  const displayName = verifiedName || sessionUser?.fullName || '—';
  const displayGender = formatApiGenderLabel(verifiedGender || sessionUser?.gender || null);

  const renderStatusPill = () => {
    switch (status) {
      case 'VERIFIED':
        return (
          <View style={[styles.statusPill, styles.statusPillVerified]}>
            <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
            <Text style={[styles.statusPillText, styles.statusPillTextVerified]}>
              Verified ✓
            </Text>
          </View>
        );
      case 'VERIFICATION_IN_PROGRESS':
        return (
          <View style={[styles.statusPill, styles.statusPillInProgress]}>
            <ActivityIndicator size="small" color={verifyAadhaarTokens.PRIMARY} />
            <Text style={[styles.statusPillText, styles.statusPillTextInProgress]}>
              In Progress
            </Text>
          </View>
        );
      case 'VERIFICATION_FAILED':
        return (
          <View style={[styles.statusPill, styles.statusPillFailed]}>
            <Ionicons name="alert-circle" size={14} color="#D32F2F" />
            <Text style={[styles.statusPillText, styles.statusPillTextFailed]}>
              Failed
            </Text>
          </View>
        );
      case 'NOT_VERIFIED':
      default:
        return (
          <View style={[styles.statusPill, styles.statusPillNotVerified]}>
            <Ionicons name="shield-outline" size={14} color={verifyAadhaarTokens.ON_SURFACE_VARIANT} />
            <Text style={[styles.statusPillText, styles.statusPillTextNotVerified]}>
              Not Verified
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={verifyAadhaarTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          Verify Aadhaar
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusSection}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusSectionTitle}>Identity Status</Text>
            {renderStatusPill()}
          </View>
        </View>

        {status === 'VERIFIED' ? (
          <View style={styles.verifiedCard}>
            <View style={styles.verifiedHeader}>
              <Ionicons name="shield-checkmark" size={32} color="#2E7D32" />
              <View style={{ flex: 1 }}>
                <Text style={styles.verifiedTitle}>Identity verified</Text>
                <Text style={styles.verifiedSubtitle}>
                  Your identity has been verified via DigiLocker.
                </Text>
              </View>
            </View>

            <View style={styles.verifiedDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Verified Name</Text>
                <Text style={styles.detailValue}>{displayName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gender</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.detailValue}>{displayGender}</Text>
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={11} color={verifyAadhaarTokens.OUTLINE} />
                    <Text style={styles.lockedBadgeText}>Locked</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.noticeBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={verifyAadhaarTokens.ON_SECONDARY_CONTAINER}
              />
              <Text style={styles.noticeText}>
                Your verified details are synchronized with your BhaiWay profile. Gender is now locked for platform trust and safety.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleDone}
              accessibilityRole="button"
              accessibilityLabel="Continue"
            >
              <Text style={styles.ctaLabel}>Continue</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={verifyAadhaarTokens.ON_PRIMARY_CONTAINER}
              />
            </Pressable>
          </View>
        ) : status === 'VERIFICATION_IN_PROGRESS' ? (
          <View style={styles.card}>
            <View style={styles.progressBox}>
              <ActivityIndicator size="large" color={verifyAadhaarTokens.PRIMARY} />
              <Text style={styles.progressText}>
                {userMessage || 'Complete the DigiLocker verification process.'}
              </Text>
              {isPolling ? (
                <Text style={[styles.heroBody, { textAlign: 'center' }]}>
                  Checking verification status with backend…
                </Text>
              ) : null}
            </View>

            <View style={styles.noticeBox}>
              <Ionicons
                name="time-outline"
                size={20}
                color={verifyAadhaarTokens.PRIMARY}
              />
              <Text style={styles.noticeText}>
                If you just authorized via DigiLocker, please wait a few moments while the backend validates your document.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                isBusy && styles.ctaDisabled,
                pressed && !isBusy && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleStart}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Continue Verification"
            >
              {isStarting ? (
                <ActivityIndicator color={verifyAadhaarTokens.ON_PRIMARY_CONTAINER} />
              ) : (
                <>
                  <Text style={styles.ctaLabel}>Continue Verification</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={verifyAadhaarTokens.ON_PRIMARY_CONTAINER}
                  />
                </>
              )}
            </Pressable>

            <Pressable
              style={styles.linkButton}
              onPress={handleCheckStatus}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Check Status"
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={verifyAadhaarTokens.PRIMARY} />
              ) : (
                <Text style={styles.linkLabel}>Check Status</Text>
              )}
            </Pressable>
          </View>
        ) : status === 'VERIFICATION_FAILED' ? (
          <View style={styles.card}>
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={24} color="#D32F2F" />
              <Text style={styles.errorText}>
                {error || userMessage || "Verification couldn't be completed."}
              </Text>
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="finger-print" size={40} color={verifyAadhaarTokens.PRIMARY} />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>Verify Aadhaar</Text>
                <Text style={styles.heroBody}>
                  Verify your Aadhaar through DigiLocker to verify your identity.
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                isBusy && styles.ctaDisabled,
                pressed && !isBusy && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleStart}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Try Again"
            >
              {isStarting ? (
                <ActivityIndicator color={verifyAadhaarTokens.ON_PRIMARY_CONTAINER} />
              ) : (
                <>
                  <Text style={styles.ctaLabel}>Try Again</Text>
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={verifyAadhaarTokens.ON_PRIMARY_CONTAINER}
                  />
                </>
              )}
            </Pressable>
          </View>
        ) : (
          /* NOT_VERIFIED */
          <View style={{ gap: 20 }}>
            <View style={styles.heroCard}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="finger-print" size={40} color={verifyAadhaarTokens.PRIMARY} />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>Verify Aadhaar</Text>
                <Text style={styles.heroBody}>
                  Verify your Aadhaar through DigiLocker to verify your identity.
                </Text>
              </View>
            </View>

            {userMessage ? (
              <View style={styles.noticeBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={verifyAadhaarTokens.ON_SECONDARY_CONTAINER}
                />
                <Text style={styles.noticeText}>{userMessage}</Text>
              </View>
            ) : null}

            <View style={styles.noticeBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={verifyAadhaarTokens.PRIMARY}
              />
              <Text style={styles.noticeText}>
                DigiLocker is a Government of India initiative. Your credentials and Aadhaar number are completely protected.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                isBusy && styles.ctaDisabled,
                pressed && !isBusy && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleStart}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Verify Aadhaar"
            >
              {isStarting ? (
                <ActivityIndicator color={verifyAadhaarTokens.ON_PRIMARY_CONTAINER} />
              ) : (
                <>
                  <Text style={styles.ctaLabel}>Verify Aadhaar</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={verifyAadhaarTokens.ON_PRIMARY_CONTAINER}
                  />
                </>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.securityBlock}>
          <View style={styles.secureBadge}>
            <Ionicons name="lock-closed" size={14} color={verifyAadhaarTokens.PRIMARY} />
            <Text style={styles.secureBadgeText}>100% SECURE & ENCRYPTED</Text>
          </View>
          <Text style={styles.secureFooter}>
            DigiLocker is authorized by UIDAI and the Ministry of Electronics & IT, Government of India.
          </Text>
        </View>
      </ScrollView>

      {!isAuthFlow ? <AppFooter activeTab="profile" /> : null}
    </SafeAreaView>
  );
};

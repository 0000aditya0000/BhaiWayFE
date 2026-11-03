import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { authService } from '@/features/auth/services';
import {
  cancelAccountDeletionRequest,
  getAccountDeletionStatus,
} from '@/features/profile/api/accountDeletion.api';
import type { AccountDeletionRequestSummaryDto } from '@/features/profile/api/accountDeletion.types';
import { ACCOUNT_DELETION_PENDING_SCREEN } from '@/features/profile/constants';
import { AppText as Text } from '@/shared/components';
import {
  getErrorMessage,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils';
import { authSession, showAppAlert } from '@/store';
import { pendingTokens, styles } from './AccountDeletionPendingScreen.styles';

const formatStatusLabel = (status?: string | null): string => {
  if (!status) return 'Pending Review';
  switch (status) {
    case 'PENDING':
      return 'Pending Review';
    case 'UNDER_REVIEW':
      return 'Under Review';
    case 'ACTION_REQUIRED':
      return 'Action Required';
    case 'APPROVED':
      return 'Approved (Pending Closure)';
    case 'COMPLETED':
      return 'Deletion Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
};

export const AccountDeletionPendingScreen = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [summary, setSummary] = useState<AccountDeletionRequestSummaryDto | null>(null);

  const cancellingRef = useRef(false);

  const fetchStatus = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getAccountDeletionStatus();
      if (response.hasActiveRequest && response.request) {
        setSummary(response.request);
      } else {
        setSummary(null);
      }
    } catch (error) {
      // If unauthorized or token expired, session will be cleared
      console.warn('[AccountDeletionPending] failed to fetch status', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const handleSignOut = useCallback(() => {
    triggerLightHaptic();
    authSession.clear();
    router.replace(ROUTES.phone);
  }, [router]);

  const handleCancelRequestConfirmed = useCallback(async () => {
    if (cancellingRef.current) {
      return;
    }
    cancellingRef.current = true;
    setCancelling(true);
    triggerLightHaptic();

    try {
      await cancelAccountDeletionRequest();
      triggerSuccessHaptic();

      // Clear restricted deletion state and restore full session
      authSession.clearDeletionPending();
      await authService.hydrateAuthenticatedUser({ force: true }).catch(() => undefined);

      router.replace(ROUTES.home);
    } catch (error: any) {
      const errorCode = error?.code || error?.details?.code;
      if (errorCode === 'DELETION_ALREADY_COMPLETED' || errorCode === 'USER_DELETED') {
        showAppAlert(
          'Account Closed',
          'Permanent account deletion has already been completed and cannot be cancelled.',
          [
            {
              text: 'OK',
              onPress: () => {
                authSession.clear();
                router.replace(ROUTES.phone);
              },
            },
          ],
        );
      } else {
        const message = getErrorMessage(error);
        showAppAlert('Cancel Deletion', message);
      }
      setCancelling(false);
      cancellingRef.current = false;
    }
  }, [router]);

  const handleCancelRequestPress = useCallback(() => {
    triggerLightHaptic();
    showAppAlert(
      ACCOUNT_DELETION_PENDING_SCREEN.cancelConfirmTitle,
      ACCOUNT_DELETION_PENDING_SCREEN.cancelConfirmMessage,
      [
        {
          text: ACCOUNT_DELETION_PENDING_SCREEN.keepAccountAction,
          style: 'cancel',
        },
        {
          text: ACCOUNT_DELETION_PENDING_SCREEN.cancelConfirmAction,
          style: 'destructive',
          onPress: () => {
            void handleCancelRequestConfirmed();
          },
        },
      ],
    );
  }, [handleCancelRequestConfirmed]);

  const formattedDueDate = useMemo(() => {
    if (!summary?.responseDueAt) {
      return null;
    }
    const date = new Date(summary.responseDueAt);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [summary?.responseDueAt]);

  const canCancel = summary ? summary.canCancel !== false : true;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Deletion In Progress
        </Text>
        <Pressable
          style={styles.signOutHeaderButton}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel={ACCOUNT_DELETION_PENDING_SCREEN.signOutButtonLabel}
        >
          <Ionicons name="log-out-outline" size={16} color={pendingTokens.ON_SURFACE_VARIANT} />
          <Text style={styles.signOutHeaderText}>
            {ACCOUNT_DELETION_PENDING_SCREEN.signOutButtonLabel}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchStatus(true)} />
        }
      >
        <View style={styles.heroBlock}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="hourglass-outline" size={36} color={pendingTokens.WARNING} />
          </View>
          <Text style={styles.pageTitle}>{ACCOUNT_DELETION_PENDING_SCREEN.title}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusBadgeDot} />
            <Text style={styles.statusBadgeText}>
              {formatStatusLabel(summary?.status)}
            </Text>
          </View>
        </View>

        {summary?.userActionRequired && summary.userActionMessage ? (
          <View style={styles.actionRequiredCard}>
            <View style={styles.actionRequiredHeader}>
              <Ionicons name="alert-circle" size={18} color={pendingTokens.ACTION_REQUIRED_TEXT} />
              <Text style={styles.actionRequiredTitle}>
                {ACCOUNT_DELETION_PENDING_SCREEN.actionRequiredNotice}
              </Text>
            </View>
            <Text style={styles.actionRequiredMessage}>{summary.userActionMessage}</Text>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          {summary?.id ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {ACCOUNT_DELETION_PENDING_SCREEN.referenceIdLabel}
                </Text>
                <Text style={[styles.infoValue, styles.referenceIdValue]} numberOfLines={1}>
                  {summary.id}
                </Text>
              </View>
              <View style={styles.infoDivider} />
            </>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{ACCOUNT_DELETION_PENDING_SCREEN.timelineLabel}</Text>
            <Text style={styles.infoValue}>
              {formattedDueDate
                ? `${ACCOUNT_DELETION_PENDING_SCREEN.timelineValue} (${formattedDueDate})`
                : ACCOUNT_DELETION_PENDING_SCREEN.timelineValue}
            </Text>
          </View>
        </View>

        <View style={styles.descriptionCard}>
          {ACCOUNT_DELETION_PENDING_SCREEN.paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={styles.actions}>
          {canCancel ? (
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                cancelling && { opacity: 0.7 },
                pressed && !cancelling && { backgroundColor: pendingTokens.SURFACE_LOW },
              ]}
              onPress={handleCancelRequestPress}
              disabled={cancelling}
              accessibilityRole="button"
              accessibilityLabel={ACCOUNT_DELETION_PENDING_SCREEN.cancelButtonLabel}
            >
              {cancelling ? (
                <ActivityIndicator color={pendingTokens.PRIMARY} size="small" />
              ) : (
                <>
                  <Ionicons name="refresh" size={18} color={pendingTokens.PRIMARY} />
                  <Text style={styles.cancelButtonLabel}>
                    {ACCOUNT_DELETION_PENDING_SCREEN.cancelButtonLabel}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && { opacity: 0.88 },
            ]}
            onPress={handleSignOut}
            disabled={cancelling}
            accessibilityRole="button"
            accessibilityLabel={ACCOUNT_DELETION_PENDING_SCREEN.signOutButtonLabel}
          >
            <Ionicons name="log-out-outline" size={18} color={pendingTokens.ON_SURFACE_VARIANT} />
            <Text style={styles.signOutButtonLabel}>
              {ACCOUNT_DELETION_PENDING_SCREEN.signOutButtonLabel}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

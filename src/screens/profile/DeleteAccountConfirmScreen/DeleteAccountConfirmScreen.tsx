import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { submitAccountDeletionRequest } from '@/features/profile/api/accountDeletion.api';
import type { DeletionReason } from '@/features/profile/api/accountDeletion.types';
import { DELETE_ACCOUNT_CONFIRM_SCREEN } from '@/features/profile/constants';
import { unregisterCurrentPushDevice } from '@/features/notifications/push/pushRegistration';
import { resourceCache } from '@/network/resourceCache';
import { IconButton, AppText as Text } from '@/shared/components';
import { getErrorMessage, getSearchParam, triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { authSession, showAppAlert } from '@/store';
import { confirmTokens, styles } from './DeleteAccountConfirmScreen.styles';

export const DeleteAccountConfirmScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const reason = getSearchParam(params.reason) as DeletionReason;
  const reasonLabel = getSearchParam(params.reasonLabel);
  const comment = getSearchParam(params.comment);

  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleGoBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.deleteAccount);
  }, [router]);

  const toggleAcknowledgement = useCallback(() => {
    triggerLightHaptic();
    setAcknowledged((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!acknowledged || submittingRef.current || !reason) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    triggerLightHaptic();

    try {
      const response = await submitAccountDeletionRequest({
        reason,
        additionalComment: comment || undefined,
        acceptedDeletionTerms: true,
      });

      triggerSuccessHaptic();

      // Clear all authenticated resources, sensitive cache, and push devices
      await unregisterCurrentPushDevice().catch(() => undefined);
      resourceCache.clearAll();
      authSession.clear();

      router.replace({
        pathname: ROUTES.accountDeletionReceived,
        params: {
          requestId: response.request?.id || '',
          responseDueAt: response.request?.responseDueAt ? String(response.request.responseDueAt) : '',
        },
      });
    } catch (error) {
      const message = getErrorMessage(error);
      showAppAlert('Account Deletion', message);
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [acknowledged, comment, reason, router]);

  const canSubmit = acknowledged && !submitting;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleGoBack}
            color={confirmTokens.ON_SURFACE}
            accessibilityLabel="Go back"
            />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
            Confirm Deletion
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBlock}>
          <Text style={styles.pageTitle}>{DELETE_ACCOUNT_CONFIRM_SCREEN.title}</Text>
        </View>

        <View style={styles.warningCard}>
          <View style={styles.warningHeaderRow}>
            <Ionicons name="warning" size={24} color={confirmTokens.ERROR} />
            <Text style={styles.warningHeaderTitle}>{DELETE_ACCOUNT_CONFIRM_SCREEN.warningTitle}</Text>
          </View>

          {DELETE_ACCOUNT_CONFIRM_SCREEN.warningParagraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={styles.timelineBadge}>
          <Ionicons name="time-outline" size={20} color={confirmTokens.PRIMARY} />
          <Text style={styles.timelineText}>{DELETE_ACCOUNT_CONFIRM_SCREEN.timelineNotice}</Text>
        </View>

        {reasonLabel ? (
          <View style={styles.reasonReviewCard}>
            <Text style={styles.reasonReviewLabel}>Selected Reason</Text>
            <Text style={styles.reasonReviewValue}>{reasonLabel}</Text>
            {comment ? <Text style={styles.reasonCommentValue}>"{comment}"</Text> : null}
          </View>
        ) : null}

        <Pressable
          style={styles.acknowledgementRow}
          onPress={toggleAcknowledgement}
          disabled={submitting}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acknowledged }}
          accessibilityLabel={DELETE_ACCOUNT_CONFIRM_SCREEN.acknowledgementLabel}
        >
          <View style={[styles.checkbox, acknowledged && styles.checkboxChecked]}>
            {acknowledged ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
          </View>
          <Text style={styles.acknowledgementText}>
            {DELETE_ACCOUNT_CONFIRM_SCREEN.acknowledgementLabel}
          </Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && { opacity: 0.92, transform: [{ scale: 0.99 }] },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel={DELETE_ACCOUNT_CONFIRM_SCREEN.submitLabel}
            accessibilityState={{ disabled: !canSubmit }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonLabel}>{DELETE_ACCOUNT_CONFIRM_SCREEN.submitLabel}</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.goBackButton,
              pressed && { backgroundColor: confirmTokens.SURFACE_LOW },
            ]}
            onPress={handleGoBack}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={DELETE_ACCOUNT_CONFIRM_SCREEN.goBackLabel}
          >
            <Text style={styles.goBackButtonLabel}>{DELETE_ACCOUNT_CONFIRM_SCREEN.goBackLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

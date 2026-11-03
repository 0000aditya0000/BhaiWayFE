import React, { useCallback, useMemo } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { ACCOUNT_DELETION_RECEIVED_SCREEN } from '@/features/profile/constants';
import { AppText as Text } from '@/shared/components';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { receivedTokens, styles } from './AccountDeletionReceivedScreen.styles';

export const AccountDeletionReceivedScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const requestId = getSearchParam(params.requestId);
  const responseDueAt = getSearchParam(params.responseDueAt);

  const formattedDueDate = useMemo(() => {
    if (!responseDueAt) {
      return null;
    }
    const date = new Date(responseDueAt);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [responseDueAt]);

  const handleClose = useCallback(() => {
    triggerLightHaptic();
    router.replace(ROUTES.welcome);
  }, [router]);

  const handleContactSupport = useCallback(() => {
    triggerLightHaptic();
    void Linking.openURL('mailto:support@bhaiway.com?subject=Account%20Deletion%20Inquiry').catch(
      () => undefined,
    );
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Request Received
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroIconWrap}>
          <Ionicons name="checkmark-done" size={44} color={receivedTokens.SUCCESS} />
        </View>

        <Text style={styles.pageTitle}>{ACCOUNT_DELETION_RECEIVED_SCREEN.title}</Text>

        <View style={styles.statusBadge}>
          <View style={styles.statusBadgeDot} />
          <Text style={styles.statusBadgeText}>{ACCOUNT_DELETION_RECEIVED_SCREEN.statusValue}</Text>
        </View>

        <View style={styles.metaCard}>
          {requestId ? (
            <>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{ACCOUNT_DELETION_RECEIVED_SCREEN.referenceIdLabel}</Text>
                <Text style={[styles.metaValue, styles.referenceIdValue]} numberOfLines={1}>
                  {requestId}
                </Text>
              </View>
              <View style={styles.metaDivider} />
            </>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{ACCOUNT_DELETION_RECEIVED_SCREEN.timelineLabel}</Text>
            <Text style={styles.metaValue}>
              {formattedDueDate
                ? `${ACCOUNT_DELETION_RECEIVED_SCREEN.timelineValue} (${formattedDueDate})`
                : ACCOUNT_DELETION_RECEIVED_SCREEN.timelineValue}
            </Text>
          </View>
        </View>

        <View style={styles.descriptionCard}>
          {ACCOUNT_DELETION_RECEIVED_SCREEN.paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={20} color={receivedTokens.OUTLINE} />
          <Text style={styles.noticeText}>
            {ACCOUNT_DELETION_RECEIVED_SCREEN.consequenceNotice}
          </Text>
        </View>

        <View style={styles.supportBox}>
          <Text style={styles.supportText}>{ACCOUNT_DELETION_RECEIVED_SCREEN.supportNotice}</Text>
          <Pressable onPress={handleContactSupport} accessibilityRole="button">
            <Text style={styles.supportLink}>{ACCOUNT_DELETION_RECEIVED_SCREEN.supportLink}</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
            ]}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={ACCOUNT_DELETION_RECEIVED_SCREEN.closeLabel}
          >
            <Text style={styles.closeButtonLabel}>{ACCOUNT_DELETION_RECEIVED_SCREEN.closeLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


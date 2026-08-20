import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { ISSUE_REPORTED_SCREEN } from '@/features/my-rides/constants';
import { useIssueReported } from '@/features/my-rides/hooks';
import { styles } from './IssueReportedScreen.styles';

export const IssueReportedScreen = () => {
  const { referenceNumber, copied, copyReference, goHome, backToRideDetails, close } =
    useIssueReported();

  const handleClose = useCallback(() => {
    triggerLightHaptic();
    close();
  }, [close]);

  const handleCopy = useCallback(() => {
    void copyReference();
  }, [copyReference]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="car" size={28} color={colors.primary} />
        </View>
        <Text style={styles.headerTitle}>{ISSUE_REPORTED_SCREEN.headerTitle}</Text>

        <IconButton
          icon="close"
          onPress={handleClose}
          color="#585E72"
          accessibilityLabel="Close"
        />
      </View>

      <View style={styles.body}>
        <View style={styles.content}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Ionicons name="checkmark-circle" size={48} color="#4B61C4" />
            </View>
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title} accessibilityRole="header">
              {ISSUE_REPORTED_SCREEN.title}
            </Text>
            <Text style={styles.subtitle}>{ISSUE_REPORTED_SCREEN.subtitle}</Text>
          </View>

          <View style={styles.referenceCard}>
            <View style={styles.referenceMeta}>
              <Text style={styles.referenceLabel}>{ISSUE_REPORTED_SCREEN.referenceLabel}</Text>
              <Text style={styles.referenceValue}>{referenceNumber}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.copyButton, pressed && { opacity: 0.85 }]}
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel={ISSUE_REPORTED_SCREEN.copyLabel}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={22}
                color={colors.primary}
              />
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={goHome}
              accessibilityRole="button"
              accessibilityLabel={ISSUE_REPORTED_SCREEN.homeLabel}
            >
              <Text style={styles.primaryLabel}>{ISSUE_REPORTED_SCREEN.homeLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={backToRideDetails}
              accessibilityRole="button"
              accessibilityLabel={ISSUE_REPORTED_SCREEN.backToRideLabel}
            >
              <Text style={styles.secondaryLabel}>{ISSUE_REPORTED_SCREEN.backToRideLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.footerSpacer} />
      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

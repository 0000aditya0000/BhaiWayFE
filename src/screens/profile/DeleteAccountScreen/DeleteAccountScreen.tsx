import React, { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { DELETE_ACCOUNT_SCREEN } from '@/features/profile/constants';
import { useDeleteAccount } from '@/features/profile/hooks';
import { deleteAccountTokens, styles } from './DeleteAccountScreen.styles';

export const DeleteAccountScreen = () => {
  const {
    reasons,
    selectedReasonId,
    feedback,
    canContinue,
    selectReason,
    setFeedback,
    goBack,
    continueToConfirm,
  } = useDeleteAccount();

  const handleGoBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleFeedbackChange = useCallback(
    (text: string) => {
      if (text.length <= 1000) {
        setFeedback(text);
      }
    },
    [setFeedback],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleGoBack}
            color={deleteAccountTokens.ON_SURFACE}
            accessibilityLabel="Go back"
          />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
            Delete Account
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
          <Text style={styles.pageTitle}>{DELETE_ACCOUNT_SCREEN.title}</Text>
          <Text style={styles.pageSubtitle}>{DELETE_ACCOUNT_SCREEN.subtitle}</Text>
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.reasonsHeading}>{DELETE_ACCOUNT_SCREEN.reasonsHeading}</Text>

          <View style={styles.reasonsList} accessibilityRole="radiogroup">
            {reasons.map((reason) => {
              const selected = selectedReasonId === reason.id;
              return (
                <Pressable
                  key={reason.id}
                  style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                  onPress={() => selectReason(reason.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={reason.label}
                >
                  <Text style={[styles.reasonLabel, selected && styles.reasonLabelSelected]}>
                    {reason.label}
                  </Text>
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.feedbackBlock}>
            <Text style={styles.feedbackLabel}>{DELETE_ACCOUNT_SCREEN.feedbackLabel}</Text>
            <TextInput
              style={styles.feedbackInput}
              value={feedback}
              onChangeText={handleFeedbackChange}
              placeholder={DELETE_ACCOUNT_SCREEN.feedbackPlaceholder}
              placeholderTextColor={deleteAccountTokens.OUTLINE}
              multiline
              maxLength={1000}
              textAlignVertical="top"
              accessibilityLabel={DELETE_ACCOUNT_SCREEN.feedbackLabel}
            />
            <Text style={styles.charCounter}>{feedback.length} / 1000</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              !canContinue && styles.continueButtonDisabled,
              pressed && canContinue && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
            onPress={continueToConfirm}
            disabled={!canContinue}
            accessibilityRole="button"
            accessibilityLabel={DELETE_ACCOUNT_SCREEN.continueLabel}
            accessibilityState={{ disabled: !canContinue }}
          >
            <Text style={styles.continueLabel}>{DELETE_ACCOUNT_SCREEN.continueLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

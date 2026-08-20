import React, { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { DELETE_ACCOUNT_SCREEN } from '@/features/profile/constants';
import { useDeleteAccount } from '@/features/profile/hooks';
import { deleteAccountTokens, styles } from './DeleteAccountScreen.styles';

export const DeleteAccountScreen = () => {
  const {
    reasons,
    selectedReason,
    feedback,
    selectReason,
    setFeedback,
    goBack,
    openNotifications,
    keepAccount,
    deleteAccount,
  } = useDeleteAccount();

  const handleGoBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

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
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
            {DELETE_ACCOUNT_SCREEN.title}
          </Text>

        <IconButton
          icon="notifications-outline"
          onPress={openNotifications}
          color={deleteAccountTokens.PRIMARY}
          accessibilityLabel="Open notifications"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={28} color={deleteAccountTokens.ERROR} />
          <View style={styles.warningMeta}>
            <Text style={styles.warningTitle}>{DELETE_ACCOUNT_SCREEN.warningTitle}</Text>
            <Text style={styles.warningBody}>{DELETE_ACCOUNT_SCREEN.warningBody}</Text>
          </View>
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.reasonsHeading}>{DELETE_ACCOUNT_SCREEN.reasonsHeading}</Text>

          <View style={styles.reasonsList}>
            {reasons.map((reason) => {
              const selected = selectedReason === reason.id;
              return (
                <Pressable
                  key={reason.id}
                  style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                  onPress={() => selectReason(reason.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={reason.label}
                >
                  <Text style={styles.reasonLabel}>{reason.label}</Text>
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
              onChangeText={setFeedback}
              placeholder={DELETE_ACCOUNT_SCREEN.feedbackPlaceholder}
              placeholderTextColor={deleteAccountTokens.OUTLINE}
              multiline
              textAlignVertical="top"
              accessibilityLabel={DELETE_ACCOUNT_SCREEN.feedbackLabel}
            />
          </View>
        </View>

        <View style={styles.moodImageWrap} accessibilityLabel="Farewell illustration">
          <View style={styles.moodImage}>
            <Ionicons name="exit-outline" size={40} color={deleteAccountTokens.OUTLINE} />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.keepButton,
              pressed && { backgroundColor: '#DADFF7', transform: [{ scale: 0.98 }] },
            ]}
            onPress={keepAccount}
            accessibilityRole="button"
            accessibilityLabel={DELETE_ACCOUNT_SCREEN.keepAccountLabel}
          >
            <Text style={styles.keepLabel}>{DELETE_ACCOUNT_SCREEN.keepAccountLabel}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={deleteAccount}
            accessibilityRole="button"
            accessibilityLabel={DELETE_ACCOUNT_SCREEN.deleteAccountLabel}
          >
            <Text style={styles.deleteLabel}>{DELETE_ACCOUNT_SCREEN.deleteAccountLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

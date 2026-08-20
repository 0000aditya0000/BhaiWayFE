import React, { useCallback } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFooter, IconButton, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { EMERGENCY_END_TRIP_SCREEN } from '@/features/my-rides/constants';
import { useEmergencyEndTrip } from '@/features/my-rides/hooks';
import type { EmergencyEndIssueOption } from '@/features/my-rides/types';
import { styles } from './EmergencyEndTripScreen.styles';

const iconColorForTone = (tone: EmergencyEndIssueOption['iconTone']): string => {
  switch (tone) {
    case 'error':
      return '#BA1A1A';
    case 'secondary':
      return '#585E72';
    case 'neutral':
      return '#191C1D';
    default:
      return '#374BB1';
  }
};

export const EmergencyEndTripScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    issues,
    selectedIssue,
    comments,
    photos,
    submitting,
    selectIssue,
    setComments,
    capturePhoto,
    removePhoto,
    submit,
    goBack,
    openSupport,
  } = useEmergencyEndTrip();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleSupport = useCallback(() => {
    triggerLightHaptic();
    openSupport();
  }, [openSupport]);

  const handleSelectIssue = useCallback(
    (id: EmergencyEndIssueOption['id']) => {
      triggerLightHaptic();
      selectIssue(id);
    },
    [selectIssue],
  );

  const handleCapture = useCallback(() => {
    triggerLightHaptic();
    void capturePhoto();
  }, [capturePhoto]);

  const handleSubmit = useCallback(() => {
    triggerLightHaptic();
    submit();
  }, [submit]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color="#374BB1"
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle}>{EMERGENCY_END_TRIP_SCREEN.title}</Text>

        <IconButton
          icon="headset-outline"
          onPress={handleSupport}
          color="#374BB1"
          accessibilityLabel={EMERGENCY_END_TRIP_SCREEN.supportLabel}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 160 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{EMERGENCY_END_TRIP_SCREEN.issueHeading}</Text>
          <View style={styles.issueGrid}>
            {issues.map((issue) => {
              const selected = selectedIssue === issue.id;
              return (
                <Pressable
                  key={issue.id}
                  style={[styles.issueCard, selected && styles.issueCardActive]}
                  onPress={() => handleSelectIssue(issue.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={issue.label}
                >
                  <Ionicons
                    name={issue.icon}
                    size={28}
                    color={iconColorForTone(issue.iconTone)}
                  />
                  <Text style={styles.issueLabel}>{issue.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{EMERGENCY_END_TRIP_SCREEN.evidenceHeading}</Text>
            <Text style={styles.optionalLabel}>{EMERGENCY_END_TRIP_SCREEN.optionalLabel}</Text>
          </View>
          <View style={styles.evidenceGrid}>
            <Pressable
              style={styles.captureSlot}
              onPress={handleCapture}
              accessibilityRole="button"
              accessibilityLabel={EMERGENCY_END_TRIP_SCREEN.captureLabel}
            >
              <Ionicons name="camera-outline" size={28} color="#374BB1" />
              <Text style={styles.captureLabel}>{EMERGENCY_END_TRIP_SCREEN.captureLabel}</Text>
            </Pressable>

            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoSlot}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                <Pressable
                  style={styles.removePhoto}
                  onPress={() => removePhoto(photo.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                >
                  <Ionicons name="close" size={14} color={colors.white} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{EMERGENCY_END_TRIP_SCREEN.commentsHeading}</Text>
          <Text style={styles.fieldLabel}>{EMERGENCY_END_TRIP_SCREEN.commentsLabel}</Text>
          <TextInput
            style={styles.commentsInput}
            value={comments}
            onChangeText={setComments}
            placeholder={EMERGENCY_END_TRIP_SCREEN.commentsPlaceholder}
            placeholderTextColor="rgba(67,70,85,0.5)"
            multiline
            textAlignVertical="top"
            accessibilityLabel={EMERGENCY_END_TRIP_SCREEN.commentsLabel}
          />
        </View>
      </ScrollView>

      <View style={[styles.submitWrap, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            submitting && styles.submitDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel={EMERGENCY_END_TRIP_SCREEN.submitLabel}
        >
          <Ionicons name="flag" size={20} color={colors.white} />
          <Text style={styles.submitLabel}>{EMERGENCY_END_TRIP_SCREEN.submitLabel}</Text>
        </Pressable>
        <Text style={styles.submitHint}>{EMERGENCY_END_TRIP_SCREEN.submitHint}</Text>
      </View>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

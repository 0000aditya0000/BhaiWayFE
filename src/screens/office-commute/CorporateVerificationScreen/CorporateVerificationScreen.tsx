import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  DashedUploadCard,
  IconButton,
  InfoBanner,
  OTPInput,
  SectionHeader,
  UploadDocumentSheet,
  AppText as Text,
  AppTextInput as TextInput,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { CORPORATE_VERIFICATION_SCREEN } from '@/features/office-commute/constants';
import { useCorporateVerification } from '@/features/office-commute/hooks';
import { styles } from './CorporateVerificationScreen.styles';

export const CorporateVerificationScreen = () => {
  const {
    step,
    form,
    errors,
    frontStatus,
    backStatus,
    submitting,
    otpValue,
    otpError,
    maskedWorkEmail,
    uploadSheetVisible,
    openUpload,
    closeUpload,
    applyUploadedDocument,
    setCompanyName,
    setWorkEmail,
    setOtpValue,
    submitDetails,
    verifyOtp,
    resendOtp,
    backToDetails,
    goBack,
  } = useCorporateVerification();

  const isUploadingId = frontStatus === 'uploading' || backStatus === 'uploading';

  const [focusedField, setFocusedField] = useState<'company' | 'email' | null>(null);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <IconButton
            icon="arrow-back"
            onPress={goBack}
            color="#374BB1"
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {CORPORATE_VERIFICATION_SCREEN.title}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 'otp' ? (
          <View style={styles.otpCard}>
            <View style={styles.otpHero}>
              <Ionicons name="mail-outline" size={40} color="#374BB1" />
            </View>

            <View style={styles.otpIntro}>
              <Text style={styles.otpTitle}>{CORPORATE_VERIFICATION_SCREEN.otpTitle}</Text>
              <Text style={styles.otpSubtitle}>
                {CORPORATE_VERIFICATION_SCREEN.otpSubtitle(maskedWorkEmail)}
              </Text>
            </View>

            <View style={styles.otpInputWrap}>
              <OTPInput
                value={otpValue}
                onChange={setOtpValue}
                cellCount={CORPORATE_VERIFICATION_SCREEN.otpLength}
                error={otpError ?? undefined}
              />
            </View>

            <View style={styles.hintChip}>
              <Text style={styles.hintText}>
                {CORPORATE_VERIFICATION_SCREEN.otpHint}: {CORPORATE_VERIFICATION_SCREEN.demoOtp}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
                pressed && !submitting && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={() => {
                void verifyOtp();
              }}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel={CORPORATE_VERIFICATION_SCREEN.otpConfirmLabel}
            >
              {submitting ? (
                <>
                  <ActivityIndicator color={colors.white} />
                  <Text style={styles.submitLabel}>
                    {CORPORATE_VERIFICATION_SCREEN.verifyingLabel}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.submitLabel}>
                    {CORPORATE_VERIFICATION_SCREEN.otpConfirmLabel}
                  </Text>
                  <Ionicons name="shield-checkmark" size={20} color={colors.white} />
                </>
              )}
            </Pressable>

            <View style={styles.otpActions}>
              <Pressable
                onPress={() => {
                  void resendOtp();
                }}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={CORPORATE_VERIFICATION_SCREEN.otpResendLabel}
              >
                <Text style={styles.otpLink}>{CORPORATE_VERIFICATION_SCREEN.otpResendLabel}</Text>
              </Pressable>
              <Pressable
                onPress={backToDetails}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={CORPORATE_VERIFICATION_SCREEN.otpBackLabel}
              >
                <Text style={styles.otpLinkMuted}>
                  {CORPORATE_VERIFICATION_SCREEN.otpBackLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader title={CORPORATE_VERIFICATION_SCREEN.officeDetailsTitle} />

              <View style={styles.fields}>
                <View style={styles.field}>
                  <Text
                    style={[
                      styles.label,
                      focusedField === 'company' && styles.labelFocused,
                    ]}
                  >
                    {CORPORATE_VERIFICATION_SCREEN.companyLabel}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === 'company' && styles.inputFocused,
                      errors.companyName && styles.inputError,
                    ]}
                    value={form.companyName}
                    onChangeText={setCompanyName}
                    placeholder={CORPORATE_VERIFICATION_SCREEN.companyPlaceholder}
                    placeholderTextColor={colors.textPlaceholder}
                    autoCapitalize="words"
                    onFocus={() => setFocusedField('company')}
                    onBlur={() => setFocusedField(null)}
                    accessibilityLabel={CORPORATE_VERIFICATION_SCREEN.companyLabel}
                  />
                  {errors.companyName ? (
                    <Text style={styles.errorText}>{errors.companyName}</Text>
                  ) : null}
                </View>

                <View style={styles.field}>
                  <Text
                    style={[styles.label, focusedField === 'email' && styles.labelFocused]}
                  >
                    {CORPORATE_VERIFICATION_SCREEN.emailLabel}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === 'email' && styles.inputFocused,
                      errors.workEmail && styles.inputError,
                    ]}
                    value={form.workEmail}
                    onChangeText={setWorkEmail}
                    placeholder={CORPORATE_VERIFICATION_SCREEN.emailPlaceholder}
                    placeholderTextColor={colors.textPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    accessibilityLabel={CORPORATE_VERIFICATION_SCREEN.emailLabel}
                  />
                  {errors.workEmail ? (
                    <Text style={styles.errorText}>{errors.workEmail}</Text>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader title={CORPORATE_VERIFICATION_SCREEN.idVerificationTitle} />

              <DashedUploadCard
                status={frontStatus}
                title={CORPORATE_VERIFICATION_SCREEN.uploadTitle}
                subtitle={CORPORATE_VERIFICATION_SCREEN.uploadSubtitle}
                uploadingLabel={CORPORATE_VERIFICATION_SCREEN.uploadingLabel}
                uploadedLabel={CORPORATE_VERIFICATION_SCREEN.uploadedLabel}
                uploadedMeta={form.frontFileName ?? 'front_view_id.jpg'}
                onPress={() => openUpload('front')}
              />

              {errors.frontId ? <Text style={styles.errorText}>{errors.frontId}</Text> : null}

              <View style={styles.uploadHintRow}>
                <Ionicons name="information-circle-outline" size={16} color="#636C74" />
                <Text style={styles.uploadHint}>{CORPORATE_VERIFICATION_SCREEN.uploadHint}</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.previewRow}
              >
                <View style={styles.previewCard}>
                  {form.frontIdUri ? (
                    <Image
                      source={{ uri: form.frontIdUri }}
                      style={styles.previewPhoto}
                      resizeMode="cover"
                    />
                  ) : (
                    <>
                      <View style={styles.previewBlob} />
                      <View style={styles.previewTop}>
                        <View style={styles.previewAvatar}>
                          <Ionicons name="person" size={22} color="#747686" />
                        </View>
                        <View>
                          <View style={styles.previewLine} />
                          <View style={styles.previewLineShort} />
                        </View>
                      </View>
                      <View>
                        <View style={[styles.previewBodyLine, { width: '100%' }]} />
                        <View style={[styles.previewBodyLine, { width: '66%' }]} />
                      </View>
                      <View style={styles.previewFooter}>
                        <View style={styles.previewBadge} />
                        <Ionicons name="shield-checkmark" size={18} color="#374BB1" />
                      </View>
                    </>
                  )}
                </View>

                <Pressable
                  style={styles.previewOptional}
                  onPress={() => openUpload('back')}
                  accessibilityRole="button"
                  accessibilityLabel={CORPORATE_VERIFICATION_SCREEN.backOptionalLabel}
                >
                  {form.backIdUri ? (
                    <Image
                      source={{ uri: form.backIdUri }}
                      style={styles.previewPhoto}
                      resizeMode="cover"
                    />
                  ) : (
                    <>
                      <Ionicons name="add" size={32} color="#747686" />
                      <Text style={styles.previewOptionalLabel}>
                        {CORPORATE_VERIFICATION_SCREEN.backOptionalLabel}
                      </Text>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>

            <InfoBanner
              variant="security"
              title={CORPORATE_VERIFICATION_SCREEN.securityTitle}
              description={CORPORATE_VERIFICATION_SCREEN.securityBody}
            />

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                (submitting || isUploadingId) && styles.submitButtonDisabled,
                pressed && !submitting && !isUploadingId && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={() => {
                void submitDetails();
              }}
              disabled={submitting || isUploadingId}
              accessibilityRole="button"
              accessibilityLabel={CORPORATE_VERIFICATION_SCREEN.submitLabel}
            >
              {submitting ? (
                <>
                  <ActivityIndicator color={colors.white} />
                  <Text style={styles.submitLabel}>
                    {CORPORATE_VERIFICATION_SCREEN.submittingLabel}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.submitLabel}>
                    {CORPORATE_VERIFICATION_SCREEN.submitLabel}
                  </Text>
                  <Ionicons name="mail" size={20} color={colors.white} />
                </>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>

      <UploadDocumentSheet
        visible={uploadSheetVisible}
        onClose={closeUpload}
        onPicked={(document) => {
          void applyUploadedDocument(document);
        }}
        title={CORPORATE_VERIFICATION_SCREEN.uploadSheetTitle}
        subtitle={CORPORATE_VERIFICATION_SCREEN.uploadSheetSubtitle}
        imagePickerOptions={{
          allowsEditing: true,
          aspect: [16, 10],
          quality: 0.85,
        }}
      />

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

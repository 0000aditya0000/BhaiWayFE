import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, KeyboardAwareScrollView, UploadDocumentSheet, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { ADD_VEHICLE_SCREEN } from '@/features/profile/constants';
import { useAddVehicle } from '@/features/profile/hooks';
import { addVehicleTokens, styles } from './AddVehicleScreen.styles';

export const AddVehicleScreen = () => {
  const {
    form,
    categories,
    submitState,
    uploadSheetVisible,
    isEditMode,
    loadingVehicle,
    screenTitle,
    submitLabel,
    submittingLabel,
    successLabel,
    setCategory,
    setModel,
    setColor,
    setPlateNumber,
    openUpload,
    closeUpload,
    applyDocument,
    submit,
    goBack,
    isUploadingDocument,
    uploadProgress,
  } = useAddVehicle();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const isSubmitting = submitState === 'submitting';
  const isSuccess = submitState === 'success';
  const busy = isSubmitting || isSuccess || isUploadingDocument || loadingVehicle;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={addVehicleTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header">
          {screenTitle}
        </Text>
      </View>

      <KeyboardAwareScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomInset={40}
      >
        <View style={styles.hero}>
          {loadingVehicle ? (
            <ActivityIndicator size="small" color={addVehicleTokens.PRIMARY} />
          ) : (
            <Ionicons name="car" size={48} color={addVehicleTokens.PRIMARY} />
          )}
          <Text style={styles.heroHint}>
            {isEditMode ? 'Update your vehicle details below.' : ADD_VEHICLE_SCREEN.heroHint}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>{ADD_VEHICLE_SCREEN.categoryHeading}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categories.map((category) => {
              const selected = form.category === category.id;
              return (
                <Pressable
                  key={category.id}
                  style={[styles.categoryCard, selected && styles.categoryCardSelected]}
                  onPress={() => setCategory(category.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={category.label}
                >
                  <Ionicons
                    name={category.icon}
                    size={24}
                    color={
                      selected
                        ? addVehicleTokens.PRIMARY
                        : addVehicleTokens.ON_SURFACE_VARIANT
                    }
                  />
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{ADD_VEHICLE_SCREEN.modelLabel}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={form.model}
                onChangeText={setModel}
                placeholder={ADD_VEHICLE_SCREEN.modelPlaceholder}
                placeholderTextColor="rgba(69, 70, 77, 0.4)"
                autoCapitalize="words"
                accessibilityLabel={ADD_VEHICLE_SCREEN.modelLabel}
              />
              <Ionicons
                name="create-outline"
                size={20}
                color="rgba(69, 70, 77, 0.5)"
                style={styles.inputIcon}
              />
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>{ADD_VEHICLE_SCREEN.colorLabel}</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={form.color}
                  onChangeText={setColor}
                  placeholder={ADD_VEHICLE_SCREEN.colorPlaceholder}
                  placeholderTextColor="rgba(69, 70, 77, 0.4)"
                  autoCapitalize="words"
                  accessibilityLabel={ADD_VEHICLE_SCREEN.colorLabel}
                />
                <Ionicons
                  name="color-palette-outline"
                  size={20}
                  color="rgba(69, 70, 77, 0.5)"
                  style={styles.inputIcon}
                />
              </View>
            </View>

            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>{ADD_VEHICLE_SCREEN.plateLabel}</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={form.plateNumber}
                  onChangeText={setPlateNumber}
                  placeholder={ADD_VEHICLE_SCREEN.platePlaceholder}
                  placeholderTextColor="rgba(69, 70, 77, 0.4)"
                  autoCapitalize="characters"
                  accessibilityLabel={ADD_VEHICLE_SCREEN.plateLabel}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>{ADD_VEHICLE_SCREEN.verificationHeading}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.documentCard,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
            onPress={openUpload}
            accessibilityRole="button"
            accessibilityLabel={ADD_VEHICLE_SCREEN.documentTitle}
          >
            <View style={styles.documentAccent} />
            <View style={styles.documentTop}>
              <View style={styles.documentLeft}>
                <View style={styles.documentIcon}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color={addVehicleTokens.ON_TERTIARY_FIXED}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.documentTitle}>{ADD_VEHICLE_SCREEN.documentTitle}</Text>
                  <Text style={styles.documentSubtitle}>
                    {form.documentSecureUrl
                      ? ADD_VEHICLE_SCREEN.documentUploadedLabel
                      : isUploadingDocument
                        ? ADD_VEHICLE_SCREEN.uploadingDocumentLabel
                        : ADD_VEHICLE_SCREEN.documentSubtitle}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color={addVehicleTokens.PRIMARY} />
            </View>
            <View style={styles.documentFooter}>
              <View style={styles.priorityRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={addVehicleTokens.ON_SURFACE}
                />
                <Text style={styles.priorityLabel}>{ADD_VEHICLE_SCREEN.priorityLabel}</Text>
              </View>
              <Text
                style={
                  form.documentSecureUrl || isUploadingDocument
                    ? styles.uploadedLabel
                    : styles.optionalLabel
                }
              >
                {isUploadingDocument
                  ? uploadProgress > 0
                    ? `${ADD_VEHICLE_SCREEN.uploadingDocumentLabel} ${uploadProgress}%`
                    : ADD_VEHICLE_SCREEN.uploadingDocumentLabel
                  : form.documentSecureUrl
                    ? ADD_VEHICLE_SCREEN.documentUploadedLabel
                    : ADD_VEHICLE_SCREEN.optionalLabel}
              </Text>
            </View>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            isSuccess && styles.submitButtonSuccess,
            pressed && !busy && { transform: [{ scale: 0.97 }] },
            busy && { opacity: 0.95 },
          ]}
          onPress={() => {
            void submit();
          }}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.submitLabel}>{submittingLabel}</Text>
            </>
          ) : isSuccess ? (
            <>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={addVehicleTokens.ON_TERTIARY_FIXED}
              />
              <Text style={[styles.submitLabel, styles.submitLabelSuccess]}>
                {successLabel}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.submitLabel}>{submitLabel}</Text>
              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </View>

      <UploadDocumentSheet
        visible={uploadSheetVisible}
        onClose={closeUpload}
        onPicked={applyDocument}
        title={ADD_VEHICLE_SCREEN.uploadTitle}
        subtitle={ADD_VEHICLE_SCREEN.uploadSubtitle}
      />
    </SafeAreaView>
  );
};

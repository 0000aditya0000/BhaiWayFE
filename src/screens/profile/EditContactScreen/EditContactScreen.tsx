import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, KeyboardAwareScrollView, UploadDocumentSheet, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { EDIT_CONTACT_SCREEN } from '@/features/profile/constants';
import { useEditContact } from '@/features/profile/hooks';
import { relationshipDisplayLabel } from '@/features/profile/utils/trustedContacts.mapper';
import { editContactTokens, styles } from './EditContactScreen.styles';

type FocusField = 'name' | 'phone' | null;

export const EditContactScreen = () => {
  const {
    mode,
    title,
    subtitle,
    form,
    relations,
    submitState,
    uploadSheetVisible,
    saveLabel,
    uploadingPhoto,
    loadingContact,
    setName,
    setRelation,
    setPhone,
    openUpload,
    closeUpload,
    applyAvatar,
    save,
    deleteContact,
    goBack,
  } = useEditContact();

  const [focused, setFocused] = useState<FocusField>(null);
  const isBusy = submitState !== 'idle' || uploadingPhoto || loadingContact;
  const initials =
    form.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?';

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const buttonLabel =
    submitState === 'submitting'
      ? EDIT_CONTACT_SCREEN.submittingLabel
      : submitState === 'success'
        ? EDIT_CONTACT_SCREEN.successLabel
        : saveLabel;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={editContactTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomInset={40}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {form.avatarUri ? (
              <Image
                source={{ uri: form.avatarUri }}
                style={styles.avatar}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View style={[styles.avatar, styles.avatarInitials]}>
                <Text style={styles.avatarInitialsText}>{initials}</Text>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.editAvatarButton,
                pressed && { transform: [{ scale: 0.9 }] },
              ]}
              onPress={openUpload}
              accessibilityRole="button"
              accessibilityLabel="Change contact photo"
            >
              <Ionicons name="create" size={14} color={editContactTokens.ON_PRIMARY} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{EDIT_CONTACT_SCREEN.nameLabel}</Text>
          <View style={styles.inputWrap}>
            <Ionicons
              name="person-outline"
              size={20}
              color={
                focused === 'name' ? editContactTokens.PRIMARY : editContactTokens.OUTLINE
              }
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, focused === 'name' && styles.inputFocused]}
              value={form.name}
              onChangeText={setName}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              placeholder={EDIT_CONTACT_SCREEN.namePlaceholder}
              placeholderTextColor={editContactTokens.OUTLINE_VARIANT}
              autoCapitalize="words"
              editable={!isBusy}
              accessibilityLabel={EDIT_CONTACT_SCREEN.nameLabel}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{EDIT_CONTACT_SCREEN.relationLabel}</Text>
          <View style={styles.relationsRow}>
            {relations.map((relation) => {
              const active = form.relation === relation;
              return (
                <Pressable
                  key={relation}
                  style={[styles.relationChip, active && styles.relationChipActive]}
                  onPress={() => {
                    triggerLightHaptic();
                    setRelation(relation);
                  }}
                  disabled={isBusy}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={relationshipDisplayLabel(relation)}
                >
                  <Text style={[styles.relationLabel, active && styles.relationLabelActive]}>
                    {relationshipDisplayLabel(relation)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{EDIT_CONTACT_SCREEN.phoneLabel}</Text>
          <View style={styles.inputWrap}>
            <Ionicons
              name="call-outline"
              size={20}
              color={
                focused === 'phone' ? editContactTokens.PRIMARY : editContactTokens.OUTLINE
              }
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, focused === 'phone' && styles.inputFocused]}
              value={form.phoneLabel}
              onChangeText={setPhone}
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
              placeholder={EDIT_CONTACT_SCREEN.phonePlaceholder}
              placeholderTextColor={editContactTokens.OUTLINE_VARIANT}
              keyboardType="phone-pad"
              editable={!isBusy}
              accessibilityLabel={EDIT_CONTACT_SCREEN.phoneLabel}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              submitState === 'success' && styles.saveButtonSuccess,
              pressed && !isBusy && { transform: [{ scale: 0.97 }], opacity: 0.95 },
            ]}
            onPress={() => {
              void save();
            }}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={buttonLabel}
          >
            {submitState === 'submitting' ? (
              <ActivityIndicator color={editContactTokens.ON_PRIMARY} />
            ) : (
              <Text style={styles.saveLabel}>{buttonLabel}</Text>
            )}
          </Pressable>

          {mode === 'edit' ? (
            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && { backgroundColor: 'rgba(255, 218, 214, 0.35)' },
              ]}
              onPress={deleteContact}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel={EDIT_CONTACT_SCREEN.deleteLabel}
            >
              <Ionicons name="trash-outline" size={20} color={editContactTokens.ERROR} />
              <Text style={styles.deleteLabel}>{EDIT_CONTACT_SCREEN.deleteLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAwareScrollView>

      <UploadDocumentSheet
        visible={uploadSheetVisible}
        onClose={closeUpload}
        onPicked={applyAvatar}
        title={EDIT_CONTACT_SCREEN.changePhotoTitle}
        subtitle={EDIT_CONTACT_SCREEN.changePhotoSubtitle}
        imagePickerOptions={{
          allowsEditing: true,
          aspect: [1, 1],
        }}
      />

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

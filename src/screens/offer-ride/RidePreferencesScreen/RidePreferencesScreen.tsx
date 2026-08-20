import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import {
  AppFooter,
  Button,
  KeyboardAwareScrollView,
  ScreenHeader,
  AppText as Text,
  AppTextInput as TextInput,
} from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import {
  AssuredPaymentBlock,
  PreferenceToggleCard,
  PreferenceVehicleCard,
  ScreenSection,
} from '@/features/offer-ride/components';
import { RIDE_PREFERENCES_SCREEN } from '@/features/offer-ride/constants';
import { useRidePreferences } from '@/features/offer-ride/hooks';
import { styles } from './RidePreferencesScreen.styles';

export const RidePreferencesScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    draft,
    isAssured,
    preferenceOptions,
    vehicles,
    notesLength,
    canPublish,
    publishing,
    refundableAmountLabel,
    totalToPayLabel,
    primaryCtaLabel,
    togglePreference,
    setNotes,
    selectVehicle,
    setPromoCode,
    applyPromo,
    addVehicle,
    publish,
    goBack,
  } = useRidePreferences();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader
        title={RIDE_PREFERENCES_SCREEN.title}
        onBack={handleBack}
        onNotificationsPress={() => router.push(ROUTES.notifications)}
      />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        bottomInset={spacing.huge}
        footer={
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Button
              label={primaryCtaLabel}
              onPress={publish}
              disabled={!canPublish}
              loading={publishing}
              accessibilityLabel={primaryCtaLabel}
            />
          </View>
        }
      >
        <ScreenSection title={RIDE_PREFERENCES_SCREEN.preferencesTitle}>
          <View style={styles.preferenceGrid}>
            {preferenceOptions.map((option) => (
              <PreferenceToggleCard
                key={option.id}
                label={option.label}
                icon={option.icon}
                selected={draft.preferences[option.id]}
                onToggle={() => togglePreference(option.id)}
              />
            ))}
          </View>
        </ScreenSection>

        <ScreenSection title={RIDE_PREFERENCES_SCREEN.detailsTitle}>
          <View style={styles.notesWrap}>
            <TextInput
              style={styles.notesInput}
              value={draft.notes}
              onChangeText={setNotes}
              placeholder={RIDE_PREFERENCES_SCREEN.detailsPlaceholder}
              placeholderTextColor={colors.textPlaceholder}
              multiline
              maxLength={RIDE_PREFERENCES_SCREEN.notesMaxLength}
              accessibilityLabel={RIDE_PREFERENCES_SCREEN.detailsTitle}
            />
            <Text
              style={[
                styles.notesCounter,
                notesLength > RIDE_PREFERENCES_SCREEN.notesMaxLength - 20 &&
                  styles.notesCounterWarn,
              ]}
            >
              {notesLength}/{RIDE_PREFERENCES_SCREEN.notesMaxLength}
            </Text>
          </View>
        </ScreenSection>

        <ScreenSection
          title={RIDE_PREFERENCES_SCREEN.vehicleTitle}
          headerRight={
            <Pressable
              onPress={addVehicle}
              accessibilityRole="button"
              accessibilityLabel={RIDE_PREFERENCES_SCREEN.addVehicleLabel}
              hitSlop={8}
            >
              <Text style={styles.addVehicle}>{RIDE_PREFERENCES_SCREEN.addVehicleLabel}</Text>
            </Pressable>
          }
        >
          {vehicles.length === 0 ? (
            <View style={styles.emptyVehicles}>
              <Text style={styles.emptyVehiclesTitle}>
                {RIDE_PREFERENCES_SCREEN.emptyVehiclesTitle}
              </Text>
              <Text style={styles.emptyVehiclesMessage}>
                {RIDE_PREFERENCES_SCREEN.emptyVehiclesMessage}
              </Text>
              <Pressable
                onPress={addVehicle}
                accessibilityRole="button"
                accessibilityLabel={RIDE_PREFERENCES_SCREEN.addVehicleLabel}
                style={styles.emptyAddButton}
              >
                <Text style={styles.addVehicle}>{RIDE_PREFERENCES_SCREEN.addVehicleLabel}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.vehicleList}>
              {vehicles.map((vehicle) => (
                <PreferenceVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  selected={draft.selectedVehicleId === vehicle.id}
                  onSelect={() => selectVehicle(vehicle.id)}
                />
              ))}
            </View>
          )}
        </ScreenSection>

        {isAssured ? (
          <AssuredPaymentBlock
            promoCode={draft.promoCode}
            onPromoChange={setPromoCode}
            onApplyPromo={applyPromo}
            refundableAmountLabel={refundableAmountLabel}
            totalToPayLabel={totalToPayLabel}
          />
        ) : null}
      </KeyboardAwareScrollView>

      <AppFooter />
    </SafeAreaView>
  );
};

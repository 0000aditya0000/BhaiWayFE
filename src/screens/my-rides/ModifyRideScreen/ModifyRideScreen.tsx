import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppFooter,
  Button,
  BhaiWayCoinIcon,
  KeyboardAwareScrollView,
  NativeDatePicker,
  ScreenHeader,
  AppText as Text,
  AppTextInput as TextInput,
} from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import {
  PreferenceToggleCard,
  PreferenceVehicleCard,
} from '@/features/offer-ride/components';
import { MODIFY_RIDE_SCREEN } from '@/features/my-rides/constants';
import { useModifyRide } from '@/features/my-rides/hooks';
import {
  formatRouteDistanceLabel,
  formatRouteDurationLabel,
} from '@/features/offer-ride/utils';
import { styles } from './ModifyRideScreen.styles';

export const ModifyRideScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    form,
    preferenceOptions,
    vehicles,
    datePickerOpen,
    timePickerOpen,
    selectedDate,
    selectedTime,
    minimumDate,
    loading,
    saving,
    loadError,
    tripDetailsLocked,
    canEdit,
    bookedSeats,
    totalSeats,
    minSeats,
    maxSeats,
    updateField,
    togglePreference,
    selectVehicle,
    openDatePicker,
    closeDatePicker,
    openTimePicker,
    closeTimePicker,
    selectDate,
    selectTime,
    addVehicle,
    updateRide,
    openRouteSelection,
    routeChangeRequiresSelection,
    didRouteChange,
    reload,
    goBack,
  } = useModifyRide();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleToggleMaxTwo = useCallback(() => {
    if (tripDetailsLocked || !canEdit) {
      return;
    }
    triggerLightHaptic();
    updateField('maxTwoInBackSeat', !form.maxTwoInBackSeat);
  }, [canEdit, form.maxTwoInBackSeat, tripDetailsLocked, updateField]);

  const decrementSeats = useCallback(() => {
    if (!canEdit || form.availableSeats <= minSeats) {
      return;
    }
    triggerLightHaptic();
    updateField('availableSeats', form.availableSeats - 1);
  }, [canEdit, form.availableSeats, minSeats, updateField]);

  const incrementSeats = useCallback(() => {
    if (!canEdit || form.availableSeats >= maxSeats) {
      return;
    }
    triggerLightHaptic();
    updateField('availableSeats', form.availableSeats + 1);
  }, [canEdit, form.availableSeats, maxSeats, updateField]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.headerWrap}>
          <ScreenHeader title={MODIFY_RIDE_SCREEN.title} onBack={handleBack} />
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.centerMessage}>{MODIFY_RIDE_SCREEN.loadingMessage}</Text>
        </View>
        <AppFooter activeTab="rides" />
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.headerWrap}>
          <ScreenHeader title={MODIFY_RIDE_SCREEN.title} onBack={handleBack} />
        </View>
        <View style={styles.centerState}>
          <Text style={styles.centerMessage}>{loadError}</Text>
          <Button
            label={MODIFY_RIDE_SCREEN.retryLabel}
            onPress={() => {
              triggerLightHaptic();
              reload();
            }}
            accessibilityLabel={MODIFY_RIDE_SCREEN.retryLabel}
          />
        </View>
        <AppFooter activeTab="rides" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <ScreenHeader title={MODIFY_RIDE_SCREEN.title} onBack={handleBack} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        bottomInset={spacing.huge}
        footer={
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Button
              label={MODIFY_RIDE_SCREEN.updateLabel}
              onPress={updateRide}
              loading={saving}
              disabled={!canEdit || saving}
              accessibilityLabel={MODIFY_RIDE_SCREEN.updateLabel}
            />
          </View>
        }
      >
        {!canEdit ? (
          <View style={styles.lockBanner}>
            <Text style={styles.lockBannerText}>{MODIFY_RIDE_SCREEN.notEditableMessage}</Text>
          </View>
        ) : null}

        {tripDetailsLocked ? (
          <View style={styles.lockBanner}>
            <Text style={styles.lockBannerText}>{MODIFY_RIDE_SCREEN.bookingLockMessage}</Text>
            <Text style={styles.seatMeta}>
              {MODIFY_RIDE_SCREEN.bookedSeatsLabel(bookedSeats)}
            </Text>
            <Text style={styles.seatMeta}>
              {MODIFY_RIDE_SCREEN.totalSeatsLabel(totalSeats || form.availableSeats)}
            </Text>
            <Text style={styles.seatMeta}>
              {MODIFY_RIDE_SCREEN.minimumSeatsLabel(minSeats)}
            </Text>
          </View>
        ) : null}

        <View>
          <Text style={styles.sectionTitle}>{MODIFY_RIDE_SCREEN.routeTitle}</Text>
          <View style={styles.card}>
            <View>
              <Text style={styles.fieldLabel}>Starting point</Text>
              {tripDetailsLocked ? (
                <View style={[styles.pressableField, styles.lockedField, styles.fieldIconRow]}>
                  <Ionicons name="navigate-outline" size={20} color={colors.textMuted} />
                  <Text style={styles.lockedValue}>{form.origin}</Text>
                </View>
              ) : (
                <View style={[styles.pressableField, styles.fieldIconRow]}>
                  <Ionicons name="navigate-outline" size={20} color={colors.primary} />
                  <TextInput
                    style={styles.routeInput}
                    value={form.origin}
                    onChangeText={(origin) => updateField('origin', origin)}
                    placeholder="Choose starting point"
                    placeholderTextColor={colors.textPlaceholder}
                    editable={canEdit}
                    accessibilityLabel="Starting point"
                  />
                </View>
              )}
              {tripDetailsLocked ? (
                <Text style={styles.lockedHint}>{MODIFY_RIDE_SCREEN.lockedHint}</Text>
              ) : null}
            </View>
            <View>
              <Text style={styles.fieldLabel}>Destination</Text>
              {tripDetailsLocked ? (
                <View style={[styles.pressableField, styles.lockedField, styles.fieldIconRow]}>
                  <Ionicons name="location" size={20} color={colors.textMuted} />
                  <Text style={styles.lockedValue}>{form.destination}</Text>
                </View>
              ) : (
                <View style={[styles.pressableField, styles.fieldIconRow]}>
                  <Ionicons name="location" size={20} color={colors.primary} />
                  <TextInput
                    style={styles.routeInput}
                    value={form.destination}
                    onChangeText={(destination) => updateField('destination', destination)}
                    placeholder="Choose destination"
                    placeholderTextColor={colors.textPlaceholder}
                    editable={canEdit}
                    accessibilityLabel="Destination"
                  />
                </View>
              )}
            </View>
            {!tripDetailsLocked && canEdit ? (
              <View>
                {form.routeSelected && !didRouteChange ? (
                  <Text style={styles.lockedHint}>
                    {MODIFY_RIDE_SCREEN.routeSelectedLabel}
                    {form.routeLengthMeters
                      ? ` · ${formatRouteDistanceLabel(form.routeLengthMeters)}`
                      : ''}
                    {form.routeDurationSeconds
                      ? ` · ${formatRouteDurationLabel(form.routeDurationSeconds)}`
                      : ''}
                  </Text>
                ) : null}
                {!form.routeSelected && !didRouteChange ? (
                  <Text style={styles.lockedHint}>{MODIFY_RIDE_SCREEN.missingRouteHint}</Text>
                ) : null}
                {routeChangeRequiresSelection ? (
                  <Text style={styles.lockedHint}>{MODIFY_RIDE_SCREEN.selectRouteHint}</Text>
                ) : null}
                {form.routeSelection ? (
                  <Text style={styles.lockedHint}>
                    Route selected
                    {` · ${formatRouteDistanceLabel(form.routeSelection.distanceMeters)}`}
                    {form.routeSelection.durationSeconds
                      ? ` · ${formatRouteDurationLabel(form.routeSelection.durationSeconds)}`
                      : ''}
                  </Text>
                ) : null}
                {didRouteChange ? (
                  <Pressable
                    onPress={() => {
                      triggerLightHaptic();
                      openRouteSelection();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={MODIFY_RIDE_SCREEN.selectRouteLabel}
                    style={styles.selectRouteAction}
                  >
                    <Text style={styles.addVehicle}>{MODIFY_RIDE_SCREEN.selectRouteLabel}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>{MODIFY_RIDE_SCREEN.schedulingTitle}</Text>
          <View style={styles.card}>
            <View>
              <Text style={styles.fieldLabel}>{MODIFY_RIDE_SCREEN.departureTimeLabel}</Text>
              <Pressable
                onPress={openTimePicker}
                disabled={tripDetailsLocked || !canEdit}
                style={[
                  styles.pressableField,
                  timePickerOpen && styles.pressableFieldActive,
                  tripDetailsLocked && styles.lockedField,
                ]}
                accessibilityRole="button"
                accessibilityLabel={MODIFY_RIDE_SCREEN.departureTimeLabel}
              >
                <View style={styles.fieldIconRow}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={tripDetailsLocked ? colors.textMuted : colors.primary}
                  />
                  <Text
                    style={tripDetailsLocked ? styles.lockedValue : styles.fieldValue}
                  >
                    {form.departureTime}
                  </Text>
                </View>
              </Pressable>
            </View>

            <View>
              <Text style={styles.fieldLabel}>{MODIFY_RIDE_SCREEN.travelDateLabel}</Text>
              <Pressable
                onPress={openDatePicker}
                disabled={tripDetailsLocked || !canEdit}
                style={[
                  styles.pressableField,
                  datePickerOpen && styles.pressableFieldActive,
                  tripDetailsLocked && styles.lockedField,
                ]}
                accessibilityRole="button"
                accessibilityLabel={MODIFY_RIDE_SCREEN.travelDateLabel}
              >
                <View style={styles.fieldIconRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={tripDetailsLocked ? colors.textMuted : colors.primary}
                  />
                  <Text
                    style={tripDetailsLocked ? styles.lockedValue : styles.fieldValue}
                  >
                    {form.departureDate}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>{MODIFY_RIDE_SCREEN.seatingTitle}</Text>
          <View style={styles.seatingRow}>
            <View style={styles.seatingCard}>
              <Text style={styles.seatingLabel}>{MODIFY_RIDE_SCREEN.availableSeatsLabel}</Text>
              <View style={styles.seatControls}>
                <Pressable
                  style={[
                    styles.seatBtn,
                    (!canEdit || form.availableSeats <= minSeats) && styles.seatBtnDisabled,
                  ]}
                  onPress={decrementSeats}
                  disabled={!canEdit || form.availableSeats <= minSeats}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease seats"
                >
                  <Ionicons name="remove" size={18} color={colors.primary} />
                </Pressable>
                <Text style={styles.seatValue}>{form.availableSeats}</Text>
                <Pressable
                  style={[
                    styles.seatBtn,
                    (!canEdit || form.availableSeats >= maxSeats) && styles.seatBtnDisabled,
                  ]}
                  onPress={incrementSeats}
                  disabled={!canEdit || form.availableSeats >= maxSeats}
                  accessibilityRole="button"
                  accessibilityLabel="Increase seats"
                >
                  <Ionicons name="add" size={18} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.seatingCard}>
              <Text style={styles.seatingLabel}>{MODIFY_RIDE_SCREEN.pricePerSeatLabel}</Text>
              <View style={styles.priceRow}>
                <BhaiWayCoinIcon size={18} />
                {tripDetailsLocked ? (
                  <Text style={styles.seatValue}>{form.pricePerSeat}</Text>
                ) : (
                  <TextInput
                    style={styles.priceInput}
                    value={form.pricePerSeat}
                    onChangeText={(pricePerSeat) => updateField('pricePerSeat', pricePerSeat)}
                    keyboardType="decimal-pad"
                    editable={canEdit}
                    accessibilityLabel={MODIFY_RIDE_SCREEN.pricePerSeatLabel}
                  />
                )}
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.comfortRow, tripDetailsLocked && styles.lockedField]}
            onPress={handleToggleMaxTwo}
            disabled={tripDetailsLocked || !canEdit}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: form.maxTwoInBackSeat }}
            accessibilityLabel={MODIFY_RIDE_SCREEN.maxTwoLabel}
          >
            <View
              style={[
                styles.comfortCheck,
                form.maxTwoInBackSeat && styles.comfortCheckSelected,
              ]}
            >
              {form.maxTwoInBackSeat ? (
                <Ionicons name="checkmark" size={14} color={colors.white} />
              ) : null}
            </View>
            <View style={styles.comfortCopy}>
              <Text style={styles.comfortTitle}>{MODIFY_RIDE_SCREEN.maxTwoLabel}</Text>
              <Text style={styles.comfortHint}>{MODIFY_RIDE_SCREEN.maxTwoHint}</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.comfortRow, tripDetailsLocked && styles.lockedField]}
            onPress={() => {
              if (tripDetailsLocked || !canEdit) {
                return;
              }
              triggerLightHaptic();
              updateField('womenOnly', !form.womenOnly);
            }}
            disabled={tripDetailsLocked || !canEdit}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: form.womenOnly, disabled: tripDetailsLocked || !canEdit }}
            accessibilityLabel={MODIFY_RIDE_SCREEN.womenOnlyLabel}
          >
            <View
              style={[
                styles.comfortCheck,
                form.womenOnly && styles.comfortCheckSelected,
              ]}
            >
              {form.womenOnly ? (
                <Ionicons name="checkmark" size={14} color={colors.white} />
              ) : null}
            </View>
            <View style={styles.comfortCopy}>
              <Text style={styles.comfortTitle}>{MODIFY_RIDE_SCREEN.womenOnlyLabel}</Text>
              <Text style={styles.comfortHint}>
                {tripDetailsLocked
                  ? MODIFY_RIDE_SCREEN.womenOnlyLockedHint
                  : MODIFY_RIDE_SCREEN.womenOnlyHint}
              </Text>
            </View>
          </Pressable>
        </View>

        <View>
          <Text style={styles.sectionTitle}>{MODIFY_RIDE_SCREEN.preferencesTitle}</Text>
          <View style={styles.preferenceGrid}>
            {preferenceOptions.map((option) => (
              <View key={option.id} style={styles.preferenceItem}>
                <PreferenceToggleCard
                  label={option.label}
                  icon={option.icon}
                  selected={form.preferences[option.id]}
                  onToggle={() => togglePreference(option.id)}
                />
              </View>
            ))}
          </View>
        </View>

        <View>
          <View style={styles.vehicleHeader}>
            <Text style={styles.sectionTitle}>{MODIFY_RIDE_SCREEN.vehicleTitle}</Text>
            {!tripDetailsLocked && canEdit ? (
              <Pressable
                onPress={addVehicle}
                accessibilityRole="button"
                accessibilityLabel={MODIFY_RIDE_SCREEN.addVehicleLabel}
                hitSlop={8}
              >
                <Text style={styles.addVehicle}>{MODIFY_RIDE_SCREEN.addVehicleLabel}</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.vehicleList}>
            {vehicles.map((vehicle) => (
              <PreferenceVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                selected={form.selectedVehicleId === vehicle.id}
                onSelect={() => selectVehicle(vehicle.id)}
              />
            ))}
          </View>
        </View>
      </KeyboardAwareScrollView>

      <NativeDatePicker
        visible={datePickerOpen}
        value={selectedDate}
        minimumDate={minimumDate}
        title={MODIFY_RIDE_SCREEN.travelDateLabel}
        onChange={selectDate}
        onClose={closeDatePicker}
      />

      <NativeDatePicker
        visible={timePickerOpen}
        value={selectedTime}
        mode="time"
        title={MODIFY_RIDE_SCREEN.departureTimeLabel}
        onChange={selectTime}
        onClose={closeTimePicker}
      />

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

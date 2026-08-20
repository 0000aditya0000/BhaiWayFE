import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { AppFooter, BrandTopBar, Button, IconButton, KeyboardAwareScrollView, MissingLocationModal, NativeDatePicker, ScreenIntro, BhaiWayCoinIcon, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import {
  CheckboxRow,
  FormSectionCard,
  PublishRouteFields,
  SeatStepper,
} from '@/features/offer-ride/components';
import { PUBLISH_RIDE_SCREEN, PUBLISH_SEAT_LIMITS } from '@/features/offer-ride/constants';
import { usePublishRide } from '@/features/offer-ride/hooks';
import { styles } from './PublishRideScreen.styles';

export const PublishRideScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    draft,
    updateDraft,
    openLocationPicker,
    openDatePicker,
    closeDatePicker,
    datePickerOpen,
    selectedDate,
    minimumDate,
    selectDate,
    openTimePicker,
    closeTimePicker,
    timePickerOpen,
    selectedTime,
    selectTime,
    submit,
    missingLocationKind,
    closeMissingLocation,
    resolveMissingLocation,
  } = usePublishRide();

  const rideTypeTitle = draft.rideType === 'assured' ? 'Assured Ride' : 'Regular Ride';

  const handleMenuPress = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <BrandTopBar
        onMenuPress={handleMenuPress}
        right={
          <IconButton
            icon="notifications-outline"
            onPress={() => router.push(ROUTES.notifications)}
            accessibilityLabel="Notifications"
          />
        }
      />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        bottomInset={24}
        footer={
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Button
              label="Next"
              onPress={submit}
              variant="primary"
              showArrow
              accessibilityLabel="Continue to next step"
            />
          </View>
        }
      >
        <ScreenIntro
          title={rideTypeTitle}
          subtitle={PUBLISH_RIDE_SCREEN.intro.subtitle}
          variant="default"
          style={styles.intro}
        />

        <FormSectionCard title="Route Details" icon="git-branch-outline">
          <PublishRouteFields
            origin={draft.origin}
            destination={draft.destination}
            onOriginPress={() => openLocationPicker('origin')}
            onDestinationPress={() => openLocationPicker('destination')}
          />
        </FormSectionCard>

        <FormSectionCard title="Date & Time" icon="calendar-outline">
          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Pressable
                onPress={openDatePicker}
                style={[styles.pressableField, datePickerOpen && styles.pressableFieldActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.fieldLabel, datePickerOpen && styles.fieldLabelActive]}>
                  Departure Date
                </Text>
                <View style={styles.fieldIconRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={[styles.fieldValue, !draft.departureDate && styles.fieldPlaceholder]}>
                    {draft.departureDate || 'dd/mm/yyyy'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.primary} />
                </View>
              </Pressable>
            </View>

            <View style={styles.fieldHalf}>
              <Pressable
                onPress={openTimePicker}
                style={[styles.pressableField, timePickerOpen && styles.pressableFieldActive]}
                accessibilityRole="button"
                accessibilityLabel="Select departure time"
              >
                <Text style={[styles.fieldLabel, timePickerOpen && styles.fieldLabelActive]}>
                  Departure Time
                </Text>
                <View style={styles.fieldIconRow}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={[styles.fieldValue, !draft.departureTime && styles.fieldPlaceholder]}>
                    {draft.departureTime || '--:-- --'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.primary} />
                </View>
              </Pressable>
            </View>
          </View>
        </FormSectionCard>

        <FormSectionCard title="Preferences & Pricing" icon="options-outline">
          <CheckboxRow
            label="Max 2 people in back seat"
            checked={draft.maxTwoInBackSeat}
            onToggle={() => updateDraft({ maxTwoInBackSeat: !draft.maxTwoInBackSeat })}
          />

          <SeatStepper
            value={draft.availableSeats}
            min={PUBLISH_SEAT_LIMITS.min}
            max={PUBLISH_SEAT_LIMITS.max}
            onChange={(availableSeats) => updateDraft({ availableSeats })}
          />

          <Text style={styles.sectionLabel}>Gender Preference</Text>
          <CheckboxRow
            label="Accept women only"
            checked={draft.womenOnly}
            onToggle={() => updateDraft({ womenOnly: !draft.womenOnly })}
          />

          <Text style={styles.fieldLabel}>Price per Seat</Text>
          <View style={[styles.pressableField, styles.fieldIconRow]}>
            <BhaiWayCoinIcon size={18} />
            <TextInput
              style={styles.priceInput}
              value={draft.pricePerSeat}
              onChangeText={(pricePerSeat) => updateDraft({ pricePerSeat })}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textPlaceholder}
              accessibilityLabel="Price per seat"
            />
          </View>
        </FormSectionCard>
      </KeyboardAwareScrollView>

      <NativeDatePicker
        visible={datePickerOpen}
        value={selectedDate}
        minimumDate={minimumDate}
        title="Departure Date"
        onChange={selectDate}
        onClose={closeDatePicker}
      />

      <NativeDatePicker
        visible={timePickerOpen}
        value={selectedTime}
        mode="time"
        title="Departure Time"
        onChange={selectTime}
        onClose={closeTimePicker}
      />

      <MissingLocationModal
        visible={missingLocationKind != null}
        kind={missingLocationKind}
        context="drive"
        onClose={closeMissingLocation}
        onSelect={resolveMissingLocation}
      />

      <AppFooter />
    </SafeAreaView>
  );
};

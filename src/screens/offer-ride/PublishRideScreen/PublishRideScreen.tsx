import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  View,
  type KeyboardEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import {
  APP_FOOTER_KEYBOARD_OFFSET,
  AppFooter,
  BrandTopBar,
  Button,
  IconButton,
  KeyboardAwareScrollView,
  MissingLocationModal,
  NativeDatePicker,
  ScreenIntro,
  BhaiWayCoinIcon,
  AppText as Text,
  AppTextInput as TextInput,
} from '@/shared/components';
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
  const scrollRef = useRef<ScrollView>(null);
  const priceBlockRef = useRef<View>(null);
  const priceFocusedRef = useRef(false);
  const scrollOffsetRef = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardTop, setKeyboardTop] = useState(0);
  const keyboardOpen = keyboardHeight > 0;
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

  const scrollPriceIntoView = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) {
      return;
    }
    const field = priceBlockRef.current;
    if (!field) {
      scroll.scrollToEnd({ animated: true });
      return;
    }
    field.measureInWindow((_fx, fy, _fw, fh) => {
      const fieldBottom = fy + fh;
      const limit =
        keyboardTop > 0 ? keyboardTop - spacing.xl : Number.POSITIVE_INFINITY;
      if (fieldBottom <= limit) {
        return;
      }
      const nextY = Math.max(0, scrollOffsetRef.current + (fieldBottom - limit));
      scroll.scrollTo({ y: nextY, animated: true });
    });
  }, [keyboardTop]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event: KeyboardEvent) => {
      const height = Math.ceil(event.endCoordinates?.height ?? 0);
      const screenY = Math.ceil(event.endCoordinates?.screenY ?? 0);
      setKeyboardHeight(height);
      setKeyboardTop(screenY);
    };

    const onHide = () => {
      setKeyboardHeight(0);
      setKeyboardTop(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!keyboardOpen || !priceFocusedRef.current) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      setTimeout(scrollPriceIntoView, Platform.OS === 'ios' ? 60 : 80);
      setTimeout(scrollPriceIntoView, 280);
    });
    return () => cancelAnimationFrame(frame);
  }, [keyboardOpen, keyboardHeight, scrollPriceIntoView]);

  const handlePriceFocus = useCallback(() => {
    priceFocusedRef.current = true;
    requestAnimationFrame(() => {
      setTimeout(scrollPriceIntoView, 50);
      setTimeout(scrollPriceIntoView, 320);
    });
  }, [scrollPriceIntoView]);

  const handlePriceBlur = useCallback(() => {
    priceFocusedRef.current = false;
  }, []);

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
        scrollViewRef={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        bottomInset={
          keyboardOpen
            ? keyboardHeight + spacing.xxl
            : APP_FOOTER_KEYBOARD_OFFSET + spacing.lg
        }
        extraBottomOffset={keyboardOpen ? 0 : APP_FOOTER_KEYBOARD_OFFSET}
        footer={
          keyboardOpen ? undefined : (
            <View
              style={[
                styles.footer,
                { paddingBottom: insets.bottom + spacing.lg },
              ]}
            >
              <Button
                label="Next"
                onPress={submit}
                variant="primary"
                showArrow
                accessibilityLabel="Continue to next step"
              />
            </View>
          )
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

          <Text style={styles.sectionLabel}>Women Only Ride</Text>
          <CheckboxRow
            label="Women Only Ride"
            checked={draft.womenOnly}
            onToggle={() => updateDraft({ womenOnly: !draft.womenOnly })}
          />

          <View
            ref={priceBlockRef}
            collapsable={false}
            onLayout={() => {
              if (priceFocusedRef.current) {
                scrollPriceIntoView();
              }
            }}
          >
            <Text style={styles.fieldLabel}>Price per Seat</Text>
            <View style={[styles.pressableField, styles.fieldIconRow]}>
              <BhaiWayCoinIcon size={18} />
              <TextInput
                style={styles.priceInput}
                value={draft.pricePerSeat}
                onChangeText={(pricePerSeat) => updateDraft({ pricePerSeat })}
                onFocus={handlePriceFocus}
                onBlur={handlePriceBlur}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textPlaceholder}
                accessibilityLabel="Price per seat"
              />
            </View>
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

      {keyboardOpen ? null : <AppFooter />}
    </SafeAreaView>
  );
};

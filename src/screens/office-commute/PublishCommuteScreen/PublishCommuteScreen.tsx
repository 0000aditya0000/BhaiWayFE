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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { PUBLISH_COMMUTE_SCREEN } from '@/features/office-commute/constants';
import { usePublishCommute } from '@/features/office-commute/hooks';
import { styles } from './PublishCommuteScreen.styles';

export const PublishCommuteScreen = () => {
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
    weekdays,
    estimatedEarnings,
    datePickerOpen,
    timePickerOpen,
    returnTimePickerOpen,
    selectedDate,
    selectedTime,
    selectedReturnTime,
    minimumDate,
    updateDraft,
    toggleDay,
    toggleReturningBack,
    openDatePicker,
    closeDatePicker,
    selectDate,
    openTimePicker,
    closeTimePicker,
    selectTime,
    openReturnTimePicker,
    closeReturnTimePicker,
    selectReturnTime,
    openLocationPicker,
    submit,
    goBack,
    openNotifications,
    missingLocationKind,
    closeMissingLocation,
    resolveMissingLocation,
  } = usePublishCommute();

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
        onMenuPress={goBack}
        right={
          <IconButton
            icon="notifications-outline"
            onPress={openNotifications}
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
                label={PUBLISH_COMMUTE_SCREEN.nextLabel}
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
          title={PUBLISH_COMMUTE_SCREEN.title}
          subtitle={PUBLISH_COMMUTE_SCREEN.subtitle}
          variant="default"
          style={styles.intro}
        />

        <FormSectionCard title="Route Details" icon="git-branch-outline">
          <PublishRouteFields
            origin={draft.startLocation}
            destination={draft.officeLocation}
            onOriginPress={() => openLocationPicker('start')}
            onDestinationPress={() => openLocationPicker('office')}
          />
        </FormSectionCard>

        <FormSectionCard title="Date & Time" icon="calendar-outline">
          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Pressable
                onPress={openDatePicker}
                style={[styles.pressableField, datePickerOpen && styles.pressableFieldActive]}
                accessibilityRole="button"
                accessibilityLabel="Select departure date"
              >
                <Text style={[styles.fieldLabel, datePickerOpen && styles.fieldLabelActive]}>
                  {PUBLISH_COMMUTE_SCREEN.departureDateLabel}
                </Text>
                <View style={styles.fieldIconRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text
                    style={[
                      styles.fieldValue,
                      !draft.departureDate && styles.fieldPlaceholder,
                    ]}
                  >
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
                  {PUBLISH_COMMUTE_SCREEN.departureLabel}
                </Text>
                <View style={styles.fieldIconRow}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text
                    style={[
                      styles.fieldValue,
                      !draft.departureTime && styles.fieldPlaceholder,
                    ]}
                  >
                    {draft.departureTime || '--:-- --'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.primary} />
                </View>
              </Pressable>
            </View>
          </View>
        </FormSectionCard>

        <FormSectionCard title="Preferences & Pricing" icon="options-outline">
          <SeatStepper
            value={draft.seats}
            min={PUBLISH_COMMUTE_SCREEN.minSeats}
            max={PUBLISH_COMMUTE_SCREEN.maxSeats}
            onChange={(seats) => updateDraft({ seats })}
          />

          <Text style={styles.sectionLabel}>{PUBLISH_COMMUTE_SCREEN.recurringLabel}</Text>
          <View style={styles.optionalBadge}>
            <Text style={styles.optionalText}>{PUBLISH_COMMUTE_SCREEN.optionalBadge}</Text>
          </View>
          <View style={styles.daysRow}>
            {weekdays.map((day) => {
              const selected = draft.recurringDays.includes(day.id);
              return (
                <Pressable
                  key={day.id}
                  style={[styles.dayChip, selected && styles.dayChipSelected]}
                  onPress={() => toggleDay(day.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={day.id}
                >
                  <Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>
                    {day.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>{PUBLISH_COMMUTE_SCREEN.recurringHint}</Text>

          <CheckboxRow
            label={PUBLISH_COMMUTE_SCREEN.returningLabel}
            checked={draft.returningBack}
            onToggle={toggleReturningBack}
          />
          {draft.returningBack ? (
            <Pressable
              onPress={openReturnTimePicker}
              style={[
                styles.pressableField,
                { marginBottom: spacing.md },
                returnTimePickerOpen && styles.pressableFieldActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Select return departure time"
            >
              <Text
                style={[
                  styles.fieldLabel,
                  returnTimePickerOpen && styles.fieldLabelActive,
                ]}
              >
                {PUBLISH_COMMUTE_SCREEN.returnTimeLabel}
              </Text>
              <View style={styles.fieldIconRow}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text
                  style={[
                    styles.fieldValue,
                    !draft.returnDepartureTime && styles.fieldPlaceholder,
                  ]}
                >
                  {draft.returnDepartureTime || PUBLISH_COMMUTE_SCREEN.returnTimePlaceholder}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.primary} />
              </View>
            </Pressable>
          ) : null}

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
                onChangeText={(value) =>
                  updateDraft({ pricePerSeat: value.replace(/[^0-9]/g, '') })
                }
                onFocus={handlePriceFocus}
                onBlur={handlePriceBlur}
                keyboardType="number-pad"
                placeholder={PUBLISH_COMMUTE_SCREEN.pricePlaceholder}
                placeholderTextColor={colors.textPlaceholder}
                accessibilityLabel="Price per seat"
              />
            </View>
            <View style={styles.earningsBox}>
              <Text style={styles.earningsText}>
                {PUBLISH_COMMUTE_SCREEN.earningsPrefix}{' '}
                <Text style={styles.earningsValue}>{estimatedEarnings}</Text>
              </Text>
            </View>
          </View>
        </FormSectionCard>
      </KeyboardAwareScrollView>

      <NativeDatePicker
        visible={datePickerOpen}
        value={selectedDate}
        minimumDate={minimumDate}
        mode="date"
        title={PUBLISH_COMMUTE_SCREEN.departureDateLabel}
        onChange={selectDate}
        onClose={closeDatePicker}
      />

      <NativeDatePicker
        visible={timePickerOpen}
        value={selectedTime}
        mode="time"
        title={PUBLISH_COMMUTE_SCREEN.departureLabel}
        onChange={selectTime}
        onClose={closeTimePicker}
      />

      <NativeDatePicker
        visible={returnTimePickerOpen}
        value={selectedReturnTime}
        mode="time"
        title={PUBLISH_COMMUTE_SCREEN.returnTimeLabel}
        onChange={selectReturnTime}
        onClose={closeReturnTimePicker}
      />

      <MissingLocationModal
        visible={missingLocationKind != null}
        kind={missingLocationKind}
        context="commute"
        onClose={closeMissingLocation}
        onSelect={resolveMissingLocation}
      />

      {keyboardOpen ? null : <AppFooter />}
    </SafeAreaView>
  );
};

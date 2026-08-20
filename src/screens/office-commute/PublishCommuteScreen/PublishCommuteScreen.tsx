import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, View, type ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, BrandTopBar, IconButton, KeyboardAwareScrollView, APP_FOOTER_KEYBOARD_OFFSET, MissingLocationModal, NativeDatePicker, BhaiWayCoinIcon, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { PUBLISH_COMMUTE_SCREEN } from '@/features/office-commute/constants';
import { usePublishCommute } from '@/features/office-commute/hooks';
import { styles } from './PublishCommuteScreen.styles';

export const PublishCommuteScreen = () => {
  const {
    draft,
    weekdays,
    estimatedEarnings,
    timePickerOpen,
    selectedTime,
    updateDraft,
    incrementSeats,
    decrementSeats,
    toggleDay,
    openTimePicker,
    closeTimePicker,
    selectTime,
    openLocationPicker,
    submit,
    goBack,
    openNotifications,
    missingLocationKind,
    closeMissingLocation,
    resolveMissingLocation,
  } = usePublishCommute();

  const scrollRef = useRef<ScrollView>(null);
  const priceFocusedRef = useRef(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollPriceIntoView = useCallback(() => {
    // Price is the last field — scroll to end so it sits above the keyboard.
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = () => {
      setKeyboardOpen(true);
      if (!priceFocusedRef.current) {
        return;
      }
      requestAnimationFrame(() => {
        setTimeout(scrollPriceIntoView, Platform.OS === 'ios' ? 60 : 120);
      });
    };

    const onHide = () => {
      setKeyboardOpen(false);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollPriceIntoView]);

  const handleNext = useCallback(() => {
    triggerLightHaptic();
    submit();
  }, [submit]);

  const handlePriceFocus = useCallback(() => {
    priceFocusedRef.current = true;
    requestAnimationFrame(() => {
      setTimeout(scrollPriceIntoView, 50);
      setTimeout(scrollPriceIntoView, 280);
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
        bottomInset={APP_FOOTER_KEYBOARD_OFFSET}
      >
        <View style={styles.hero}>
          <Text style={styles.heading}>{PUBLISH_COMMUTE_SCREEN.title}</Text>
          <Text style={styles.subtitle}>{PUBLISH_COMMUTE_SCREEN.subtitle}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="git-branch-outline" size={20} color="#374BB1" />
            <Text style={styles.cardHeaderLabel}>{PUBLISH_COMMUTE_SCREEN.routeLabel}</Text>
          </View>
          <View style={styles.routeBlock}>
            <View style={styles.routeTrack} />
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{PUBLISH_COMMUTE_SCREEN.startLabel}</Text>
              <Pressable
                style={styles.inputRow}
                onPress={() => openLocationPicker('start')}
                accessibilityRole="button"
                accessibilityLabel="Start location"
              >
                <Ionicons name="locate-outline" size={20} color="#4B61C4" />
                <Text
                  style={[
                    styles.textInput,
                    !draft.startLocation && styles.locationPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {draft.startLocation || PUBLISH_COMMUTE_SCREEN.startPlaceholder}
                </Text>
              </Pressable>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{PUBLISH_COMMUTE_SCREEN.officeLabel}</Text>
              <Pressable
                style={styles.inputRow}
                onPress={() => openLocationPicker('office')}
                accessibilityRole="button"
                accessibilityLabel="Office location"
              >
                <Ionicons name="location" size={20} color="#4B61C4" />
                <Text
                  style={[
                    styles.textInput,
                    !draft.officeLocation && styles.locationPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {draft.officeLocation || PUBLISH_COMMUTE_SCREEN.officePlaceholder}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={[styles.card, styles.gridCard]}>
            <Text style={styles.fieldLabel}>{PUBLISH_COMMUTE_SCREEN.departureLabel}</Text>
            <Pressable
              style={styles.timeRow}
              onPress={openTimePicker}
              accessibilityRole="button"
              accessibilityLabel="Select departure time"
            >
              <Ionicons name="time-outline" size={22} color="#4B61C4" />
              <Text style={styles.timeValue}>{draft.departureTime}</Text>
            </Pressable>
          </View>

          <View style={[styles.card, styles.gridCard]}>
            <Text style={styles.fieldLabel}>{PUBLISH_COMMUTE_SCREEN.seatsLabel}</Text>
            <View style={styles.seatRow}>
              <Pressable
                style={({ pressed }) => [styles.seatButton, pressed && { opacity: 0.8 }]}
                onPress={decrementSeats}
                accessibilityRole="button"
                accessibilityLabel="Decrease seats"
              >
                <Ionicons name="remove" size={18} color="#191C1D" />
              </Pressable>
              <Text style={styles.seatValue}>{draft.seats}</Text>
              <Pressable
                style={({ pressed }) => [styles.seatButton, pressed && { opacity: 0.8 }]}
                onPress={incrementSeats}
                accessibilityRole="button"
                accessibilityLabel="Increase seats"
              >
                <Ionicons name="add" size={18} color="#191C1D" />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.recurringHeader}>
            <Text style={styles.fieldLabel}>{PUBLISH_COMMUTE_SCREEN.recurringLabel}</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>{PUBLISH_COMMUTE_SCREEN.optionalBadge}</Text>
            </View>
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
        </View>

        <View style={styles.card}>
          <Pressable
            style={styles.returningRow}
            onPress={() => updateDraft({ returningBack: !draft.returningBack })}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: draft.returningBack }}
          >
            <View style={[styles.checkbox, draft.returningBack && styles.checkboxChecked]}>
              {draft.returningBack ? (
                <Ionicons name="checkmark" size={14} color={colors.white} />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.returningLabel}>{PUBLISH_COMMUTE_SCREEN.returningLabel}</Text>
              <Text style={styles.returningHint}>{PUBLISH_COMMUTE_SCREEN.returningHint}</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.priceHeader}>
            <View>
              <Text style={styles.fieldLabel}>{PUBLISH_COMMUTE_SCREEN.priceLabel}</Text>
              <View style={styles.priceRow}>
                <BhaiWayCoinIcon size={18} />
                <TextInput
                  style={styles.priceInput}
                  value={draft.pricePerSeat}
                  onChangeText={(value) =>
                    updateDraft({ pricePerSeat: value.replace(/[^0-9]/g, '') })
                  }
                  onFocus={handlePriceFocus}
                  onBlur={handlePriceBlur}
                  placeholder={PUBLISH_COMMUTE_SCREEN.pricePlaceholder}
                  placeholderTextColor="#76777D"
                  keyboardType="number-pad"
                  accessibilityLabel="Price per seat"
                />
              </View>
            </View>
            <View style={styles.recommendedBadge}>
              <Ionicons name="flash" size={14} color="#374BB1" />
              <Text style={styles.recommendedText}>
                {PUBLISH_COMMUTE_SCREEN.recommendedBadge}
              </Text>
            </View>
          </View>
          <View style={styles.earningsBox}>
            <Text style={styles.earningsText}>
              {PUBLISH_COMMUTE_SCREEN.earningsPrefix}{' '}
              <Text style={styles.earningsValue}>{estimatedEarnings}</Text>
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={styles.nextLabel}>{PUBLISH_COMMUTE_SCREEN.nextLabel}</Text>
          <Ionicons name="arrow-forward" size={22} color={colors.white} />
        </Pressable>
      </KeyboardAwareScrollView>

      <NativeDatePicker
        visible={timePickerOpen}
        value={selectedTime}
        mode="time"
        title={PUBLISH_COMMUTE_SCREEN.departureLabel}
        onChange={selectTime}
        onClose={closeTimePicker}
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

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  IconButton,
  AppText as Text,
  AppTextInput as TextInput,
} from '@/shared/components';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { COMMUTE_CANCEL_RIDE_SCREEN } from '@/features/office-commute/constants';
import { useCommuteCancelRide } from '@/features/office-commute/hooks';
import { styles } from './CommuteCancelRideScreen.styles';

export const CommuteCancelRideScreen = () => {
  const params = useLocalSearchParams<{
    bookingId?: string;
    rideId?: string;
    origin?: string;
    destination?: string;
    dateLabel?: string;
    timeLabel?: string;
  }>();

  const {
    summary,
    reasons,
    selectedReason,
    otherNote,
    showOtherNote,
    submitting,
    selectReason,
    setOtherNote,
    confirmCancellation,
    goBack,
  } = useCommuteCancelRide({
    bookingId: getSearchParam(params.bookingId) || '',
    rideId: getSearchParam(params.rideId) || 'commute-ride',
    origin: getSearchParam(params.origin),
    destination: getSearchParam(params.destination),
    dateLabel: getSearchParam(params.dateLabel),
    timeLabel: getSearchParam(params.timeLabel),
  });

  const [otherFocused, setOtherFocused] = useState(false);

  const handleConfirm = useCallback(() => {
    triggerLightHaptic();
    confirmCancellation();
  }, [confirmCancellation]);

  const handleGoBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <IconButton
            icon="arrow-back"
            onPress={handleGoBack}
            color="#434655"
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle}>{COMMUTE_CANCEL_RIDE_SCREEN.title}</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.cancelIconWrap}>
            <Ionicons name="close-circle" size={36} color="#BA1A1A" />
          </View>
          <Text style={styles.heading}>{COMMUTE_CANCEL_RIDE_SCREEN.heading}</Text>
          <Text style={styles.subtitle}>{COMMUTE_CANCEL_RIDE_SCREEN.subtitle}</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsLabel}>{COMMUTE_CANCEL_RIDE_SCREEN.rideDetailsLabel}</Text>
            <View style={styles.regularBadge}>
              <Text style={styles.regularBadgeText}>{COMMUTE_CANCEL_RIDE_SCREEN.badge}</Text>
            </View>
          </View>

          <View style={styles.routeRow}>
            <View style={styles.routeTrack}>
              <View style={styles.originDot} />
              <View style={styles.routeLine} />
              <View style={styles.dropDot} />
            </View>
            <View style={styles.stopMeta}>
              <Text style={styles.stopValue}>{summary.pickupLabel}</Text>
              <Text style={styles.stopValue}>{summary.dropoffLabel}</Text>
            </View>
          </View>

          <View style={styles.scheduleRow}>
            <Ionicons name="time-outline" size={22} color="#434655" />
            <Text style={styles.scheduleText}>
              {summary.dateLabel},{' '}
              <Text style={styles.scheduleStrong}>{summary.timeLabel}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.policyCardRegular}>
          <View style={styles.policyRow}>
            <Ionicons name="information-circle" size={22} color="#374BB1" />
            <View style={styles.policyCopy}>
              <Text style={styles.policyTitleRegular}>
                {COMMUTE_CANCEL_RIDE_SCREEN.policyTitle}
              </Text>
              <Text style={styles.policyTextRegular}>
                {COMMUTE_CANCEL_RIDE_SCREEN.policyText}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.reasonSection}>
          <Text style={styles.reasonTitle}>{COMMUTE_CANCEL_RIDE_SCREEN.reasonTitle}</Text>
          <View style={styles.reasonWrap}>
            {reasons.map((reason) => {
              const selected = selectedReason === reason.id;
              return (
                <Pressable
                  key={reason.id}
                  style={({ pressed }) => [
                    styles.reasonChip,
                    selected && styles.reasonChipSelected,
                    pressed && { opacity: 0.9 },
                  ]}
                  onPress={() => selectReason(reason.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={reason.label}
                >
                  <Text
                    style={[
                      styles.reasonChipLabel,
                      selected && styles.reasonChipLabelSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {showOtherNote ? (
            <TextInput
              style={[styles.otherInput, otherFocused && styles.otherInputFocused]}
              value={otherNote}
              onChangeText={setOtherNote}
              placeholder={COMMUTE_CANCEL_RIDE_SCREEN.otherPlaceholder}
              placeholderTextColor="#747686"
              multiline
              onFocus={() => setOtherFocused(true)}
              onBlur={() => setOtherFocused(false)}
              accessibilityLabel={COMMUTE_CANCEL_RIDE_SCREEN.otherPlaceholder}
            />
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              submitting && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={COMMUTE_CANCEL_RIDE_SCREEN.confirmLabel}
          >
            {submitting ? (
              <ActivityIndicator color="#BA1A1A" />
            ) : (
              <Text style={styles.confirmLabel}>{COMMUTE_CANCEL_RIDE_SCREEN.confirmLabel}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

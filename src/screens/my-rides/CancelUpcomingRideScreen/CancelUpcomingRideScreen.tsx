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
import { CANCEL_UPCOMING_RIDE_SCREEN } from '@/features/my-rides/constants';
import { useCancelUpcomingRide } from '@/features/my-rides/hooks';
import { styles } from './CancelUpcomingRideScreen.styles';

export const CancelUpcomingRideScreen = () => {
  const params = useLocalSearchParams<{
    rideId?: string;
    dateLabel?: string;
    title?: string;
    pickupLabel?: string;
    dropoffLabel?: string;
    mode?: string;
    assured?: string;
    commute?: string;
    seriesId?: string;
  }>();

  const {
    summary,
    isDriving,
    heading,
    subtitle,
    policyText,
    showAssuredDriverWarning,
    confirmLabel,
    reasons,
    selectedReasonId,
    otherNote,
    showOtherNote,
    confirming,
    selectReason,
    setOtherNote,
    keepRide,
    confirmCancel,
    goBack,
  } = useCancelUpcomingRide({
    rideId: getSearchParam(params.rideId),
    dateLabel: getSearchParam(params.dateLabel),
    title: getSearchParam(params.title),
    pickupLabel: getSearchParam(params.pickupLabel),
    dropoffLabel: getSearchParam(params.dropoffLabel),
    mode: getSearchParam(params.mode),
    assured: getSearchParam(params.assured),
    commute: getSearchParam(params.commute),
  });

  const [otherFocused, setOtherFocused] = useState(false);

  const handleKeepRide = useCallback(() => {
    triggerLightHaptic();
    keepRide();
  }, [keepRide]);

  const handleConfirm = useCallback(() => {
    triggerLightHaptic();
    confirmCancel();
  }, [confirmCancel]);

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const dateParts = summary.dateLabel.split(',').map((part) => part.trim());
  const datePrefix = dateParts.length > 1 ? `${dateParts[0]}, ` : '';
  const dateTime = dateParts.length > 1 ? dateParts.slice(1).join(', ') : summary.dateLabel;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color="#434655"
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle}>{CANCEL_UPCOMING_RIDE_SCREEN.title}</Text>
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
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {showAssuredDriverWarning ? (
            <Text style={styles.assuredConfirmPrompt}>
              {CANCEL_UPCOMING_RIDE_SCREEN.heading}
            </Text>
          ) : null}
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsLabel}>{CANCEL_UPCOMING_RIDE_SCREEN.rideDetailsLabel}</Text>
            {!isDriving ? (
              summary.commute ? (
                <View style={styles.regularBadge}>
                  <Text style={styles.regularBadgeText}>
                    {CANCEL_UPCOMING_RIDE_SCREEN.commuteBadge}
                  </Text>
                </View>
              ) : summary.assured ? (
                <View style={styles.assuredBadge}>
                  <Text style={styles.assuredBadgeText}>
                    {CANCEL_UPCOMING_RIDE_SCREEN.assuredBadge}
                  </Text>
                </View>
              ) : (
                <View style={styles.regularBadge}>
                  <Text style={styles.regularBadgeText}>
                    {CANCEL_UPCOMING_RIDE_SCREEN.regularBadge}
                  </Text>
                </View>
              )
            ) : null}
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
              {datePrefix}
              <Text style={styles.scheduleStrong}>{dateTime}</Text>
            </Text>
          </View>
        </View>

        <View
          style={
            showAssuredDriverWarning || (summary.assured && !isDriving && !summary.commute)
              ? styles.policyCardAssured
              : styles.policyCardRegular
          }
        >
          <View style={styles.policyRow}>
            <Ionicons
              name={showAssuredDriverWarning || (summary.assured && !isDriving && !summary.commute) ? 'warning' : 'information-circle'}
              size={22}
              color={showAssuredDriverWarning || (summary.assured && !isDriving && !summary.commute) ? '#BA1A1A' : '#374BB1'}
            />
            <View style={styles.policyCopy}>
              <Text
                style={
                  showAssuredDriverWarning || (summary.assured && !isDriving && !summary.commute)
                    ? styles.policyTitleAssured
                    : styles.policyTitleRegular
                }
              >
                {CANCEL_UPCOMING_RIDE_SCREEN.policyTitle}
              </Text>
              {summary.assured && !isDriving && !summary.commute ? (
                <Text style={styles.policyTextAssured}>{policyText}</Text>
              ) : (
                <Text
                  style={
                    showAssuredDriverWarning ? styles.policyTextAssured : styles.policyTextRegular
                  }
                >
                  {policyText}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.reasonSection}>
          <Text style={styles.reasonTitle}>{CANCEL_UPCOMING_RIDE_SCREEN.reasonTitle}</Text>
          <View style={styles.reasonWrap}>
            {reasons.map((reason) => {
              const selected = selectedReasonId === reason.id;
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
              placeholder={CANCEL_UPCOMING_RIDE_SCREEN.otherPlaceholder}
              placeholderTextColor="#747686"
              multiline
              onFocus={() => setOtherFocused(true)}
              onBlur={() => setOtherFocused(false)}
              accessibilityLabel={CANCEL_UPCOMING_RIDE_SCREEN.otherPlaceholder}
            />
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.keepButton,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              confirming && styles.confirmButtonDisabled,
            ]}
            onPress={handleKeepRide}
            disabled={confirming}
            accessibilityRole="button"
            accessibilityLabel={CANCEL_UPCOMING_RIDE_SCREEN.keepLabel}
          >
            <Text style={styles.keepLabel}>{CANCEL_UPCOMING_RIDE_SCREEN.keepLabel}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              confirming && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={confirming}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
          >
            {confirming ? (
              <ActivityIndicator color="#BA1A1A" />
            ) : (
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

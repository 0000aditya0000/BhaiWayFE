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
import { CANCEL_RIDE_SCREEN } from '@/features/ride-search/constants';
import { useCancelRide } from '@/features/ride-search/hooks';
import type { RideType } from '@/features/ride-search/types';
import { styles } from './CancelRideScreen.styles';

const isRideType = (value: string): value is RideType =>
  value === 'regular' || value === 'assured';

export const CancelRideScreen = () => {
  const params = useLocalSearchParams<{
    rideId?: string;
    rideType?: string;
    origin?: string;
    destination?: string;
  }>();

  const rideTypeParam = getSearchParam(params.rideType);
  const rideType: RideType = isRideType(rideTypeParam) ? rideTypeParam : 'assured';

  const {
    summary,
    reasons,
    selectedReason,
    comments,
    isAssured,
    subtitle,
    showOtherNote,
    submitting,
    selectReason,
    setComments,
    confirmCancellation,
    goBack,
  } = useCancelRide({
    rideId: getSearchParam(params.rideId) || 'ride-default',
    rideType,
    origin: getSearchParam(params.origin),
    destination: getSearchParam(params.destination),
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
        <Text style={styles.headerTitle}>{CANCEL_RIDE_SCREEN.title}</Text>
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
          <Text style={styles.heading}>{CANCEL_RIDE_SCREEN.heading}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsLabel}>{CANCEL_RIDE_SCREEN.rideDetailsLabel}</Text>
            {isAssured ? (
              <View style={styles.assuredBadge}>
                <Text style={styles.assuredBadgeText}>{CANCEL_RIDE_SCREEN.assuredBadge}</Text>
              </View>
            ) : (
              <View style={styles.regularBadge}>
                <Text style={styles.regularBadgeText}>{CANCEL_RIDE_SCREEN.regularBadge}</Text>
              </View>
            )}
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

        <View style={isAssured ? styles.policyCardAssured : styles.policyCardRegular}>
          <View style={styles.policyRow}>
            <Ionicons
              name={isAssured ? 'warning' : 'information-circle'}
              size={22}
              color={isAssured ? '#BA1A1A' : '#374BB1'}
            />
            <View style={styles.policyCopy}>
              <Text style={isAssured ? styles.policyTitleAssured : styles.policyTitleRegular}>
                {CANCEL_RIDE_SCREEN.policyTitle}
              </Text>
              {isAssured ? (
                <Text style={styles.policyTextAssured}>
                  {CANCEL_RIDE_SCREEN.policyAssuredPrefix}
                  <Text style={styles.policyStrong}>
                    {CANCEL_RIDE_SCREEN.policyAssuredHighlight}
                  </Text>
                  {CANCEL_RIDE_SCREEN.policyAssuredMid}
                  <Text style={styles.policyStrong}>{CANCEL_RIDE_SCREEN.policyAssuredFee}</Text>
                  {CANCEL_RIDE_SCREEN.policyAssuredSuffix}
                </Text>
              ) : (
                <Text style={styles.policyTextRegular}>{CANCEL_RIDE_SCREEN.policyRegular}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.reasonSection}>
          <Text style={styles.reasonTitle}>{CANCEL_RIDE_SCREEN.reasonTitle}</Text>
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
              value={comments}
              onChangeText={setComments}
              placeholder={CANCEL_RIDE_SCREEN.otherPlaceholder}
              placeholderTextColor="#747686"
              multiline
              onFocus={() => setOtherFocused(true)}
              onBlur={() => setOtherFocused(false)}
              accessibilityLabel={CANCEL_RIDE_SCREEN.otherPlaceholder}
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
            accessibilityLabel={CANCEL_RIDE_SCREEN.confirmLabel}
          >
            {submitting ? (
              <ActivityIndicator color="#BA1A1A" />
            ) : (
              <Text style={styles.confirmLabel}>{CANCEL_RIDE_SCREEN.confirmLabel}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

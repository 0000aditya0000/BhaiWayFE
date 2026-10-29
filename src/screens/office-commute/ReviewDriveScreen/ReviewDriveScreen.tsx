import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, BhaiWayCoinIcon, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { CommuteReviewMapPreview } from '@/features/office-commute/components';
import { REVIEW_DRIVE_SCREEN } from '@/features/office-commute/constants';
import { useReviewDrive } from '@/features/office-commute/hooks';
import { styles } from './ReviewDriveScreen.styles';

export const ReviewDriveScreen = () => {
  const {
    draft,
    pickup,
    destination,
    routeCoordinates,
    pickupLabel,
    destinationLabel,
    departureLabel,
    returnDepartureLabel,
    distanceLabel,
    durationLabel,
    routeLoading,
    estimatedEarnings,
    weekdays,
    publishing,
    canPublish,
    goBack,
    verifyIdentity,
    publishRide,
    isCorporateVerified,
    corporateStatusReady,
  } = useReviewDrive();

  const hasRecurringDays = draft.recurringDays.length > 0;

  const handlePublish = useCallback(() => {
    if (publishing || !canPublish) {
      return;
    }
    triggerLightHaptic();
    publishRide();
  }, [canPublish, publishRide, publishing]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={goBack}
            color={colors.primary}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {REVIEW_DRIVE_SCREEN.title}
        </Text>
        <IconButton
          icon="ellipsis-vertical"
          onPress={() => undefined}
          color={colors.primary}
          accessibilityLabel="More options"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CommuteReviewMapPreview
          pickup={pickup}
          dropoff={destination}
          pickupLabel={pickupLabel}
          dropoffLabel={destinationLabel}
          routeCoordinates={routeCoordinates}
          distanceLabel={distanceLabel}
          durationLabel={durationLabel}
          distanceCaption={REVIEW_DRIVE_SCREEN.distanceLabel}
          loading={routeLoading}
        />

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="git-branch-outline" size={18} color="#45464D" />
              <Text style={styles.cardHeaderLabel}>{REVIEW_DRIVE_SCREEN.routeLabel}</Text>
            </View>
            <View style={styles.routeTimeline}>
              <View style={styles.routeLine} />
              <View style={styles.routeStop}>
                <View style={[styles.routeDot, styles.routeDotPickup]} />
                <Text style={styles.stopLabel}>{REVIEW_DRIVE_SCREEN.pickupLabel}</Text>
                <Text style={styles.stopValue}>{pickupLabel}</Text>
              </View>
              <View style={styles.routeStop}>
                <View style={[styles.routeDot, styles.routeDotDrop]} />
                <Text style={styles.stopLabel}>{REVIEW_DRIVE_SCREEN.destinationLabel}</Text>
                <Text style={styles.stopValue}>{destinationLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.bentoGrid}>
            <View style={[styles.card, styles.scheduleCard]}>
              <Text style={styles.fieldCaption}>{REVIEW_DRIVE_SCREEN.departureLabel}</Text>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={22} color="#4B61C4" />
                <Text style={styles.timeValue}>{departureLabel}</Text>
              </View>
              {draft.returningBack && returnDepartureLabel ? (
                <>
                  <Text style={[styles.fieldCaption, styles.repeatCaption]}>
                    Return
                  </Text>
                  <View style={styles.timeRow}>
                    <Ionicons name="return-down-back-outline" size={22} color="#4B61C4" />
                    <Text style={styles.timeValue}>{returnDepartureLabel}</Text>
                  </View>
                </>
              ) : null}
              <Text style={[styles.fieldCaption, styles.repeatCaption]}>
                {REVIEW_DRIVE_SCREEN.repeatLabel}
              </Text>
              {hasRecurringDays ? (
                <View style={styles.daysRow}>
                  {weekdays.map((day) => {
                    const selected = draft.recurringDays.includes(day.id);
                    return (
                      <View
                        key={day.id}
                        style={[styles.dayChip, selected && styles.dayChipSelected]}
                      >
                        <Text
                          style={[styles.dayLabel, selected && styles.dayLabelSelected]}
                        >
                          {day.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.oneTime}>{REVIEW_DRIVE_SCREEN.oneTimeLabel}</Text>
              )}
            </View>

            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.fieldCaption}>{REVIEW_DRIVE_SCREEN.seatsLabel}</Text>
              <View style={styles.metricRow}>
                <Ionicons name="car-sport-outline" size={22} color="#4B61C4" />
                <Text style={styles.metricValue}>{draft.seats}</Text>
              </View>
            </View>

            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.fieldCaption}>{REVIEW_DRIVE_SCREEN.priceLabel}</Text>
              <View style={styles.metricRow}>
                <BhaiWayCoinIcon size={18} />
                <Text style={styles.metricValue}>{draft.pricePerSeat || '0'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.earningsCard}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.earningsCaption}>{REVIEW_DRIVE_SCREEN.earningsLabel}</Text>
              <Text style={styles.earningsHint}>{REVIEW_DRIVE_SCREEN.earningsHint}</Text>
            </View>
            <View>
              <Text style={styles.earningsValue}>{estimatedEarnings}</Text>
              <Text style={styles.profitableBadge}>{REVIEW_DRIVE_SCREEN.profitableBadge}</Text>
            </View>
          </View>

          {corporateStatusReady ? (
            <View>
              {isCorporateVerified ? (
                <View style={styles.verifiedCard}>
                  <Ionicons name="shield-checkmark" size={22} color="#374BB1" />
                  <Text style={styles.verifiedText}>{REVIEW_DRIVE_SCREEN.verifiedLabel}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.warningCard}>
                    <Ionicons name="warning" size={22} color="#D97706" />
                    <Text style={styles.warningText}>
                      <Text style={styles.warningBold}>Note: </Text>
                      {REVIEW_DRIVE_SCREEN.verifyWarning}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.verifyButton,
                      { marginTop: 16 },
                      pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={verifyIdentity}
                    accessibilityRole="button"
                    accessibilityLabel={REVIEW_DRIVE_SCREEN.verifyLabel}
                  >
                    <Ionicons name="shield-checkmark-outline" size={20} color="#4B61C4" />
                    <Text style={styles.verifyLabel}>{REVIEW_DRIVE_SCREEN.verifyLabel}</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.stickyFooter}>
        <Pressable
          style={({ pressed }) => [
            styles.publishButton,
            pressed && canPublish && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            !canPublish && { opacity: 0.55 },
          ]}
          onPress={handlePublish}
          disabled={!canPublish}
          accessibilityRole="button"
          accessibilityLabel={REVIEW_DRIVE_SCREEN.publishLabel}
        >
          {publishing ? (
            <>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.publishLabel}>{REVIEW_DRIVE_SCREEN.publishingLabel}</Text>
            </>
          ) : (
            <>
              <Text style={styles.publishLabel}>{REVIEW_DRIVE_SCREEN.publishLabel}</Text>
              <Ionicons name="send" size={18} color={colors.white} />
            </>
          )}
        </Pressable>
      </View>

      <AppFooter />
    </SafeAreaView>
  );
};

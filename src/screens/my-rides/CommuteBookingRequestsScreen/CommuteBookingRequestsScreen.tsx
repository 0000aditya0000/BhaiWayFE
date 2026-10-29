import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, ScreenHeader, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { PendingRequestCard } from '@/features/my-rides/components';
import { COMMUTE_BOOKING_REQUESTS_SCREEN } from '@/features/my-rides/constants/commute-booking-requests.constants';
import { useCommuteBookingRequests } from '@/features/my-rides/hooks/useCommuteBookingRequests';
import { styles } from './CommuteBookingRequestsScreen.styles';

export const CommuteBookingRequestsScreen = () => {
  const {
    groups,
    loading,
    refreshing,
    errorMessage,
    refresh,
    goBack,
    openRideDetails,
    acceptRequest,
    declineRequest,
    isAccepting,
    isRejecting,
  } = useCommuteBookingRequests();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleRetry = useCallback(() => {
    triggerLightHaptic();
    void refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <ScreenHeader title={COMMUTE_BOOKING_REQUESTS_SCREEN.title} onBack={handleBack} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>{COMMUTE_BOOKING_REQUESTS_SCREEN.title}</Text>
          <Text style={styles.introSubtitle}>{COMMUTE_BOOKING_REQUESTS_SCREEN.subtitle}</Text>
        </View>

        {loading ? (
          <View style={styles.stateBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>{COMMUTE_BOOKING_REQUESTS_SCREEN.loadingLabel}</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateTitle}>{COMMUTE_BOOKING_REQUESTS_SCREEN.errorTitle}</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable
              style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.9 }]}
              onPress={handleRetry}
              accessibilityRole="button"
              accessibilityLabel={COMMUTE_BOOKING_REQUESTS_SCREEN.errorRetryLabel}
            >
              <Text style={styles.retryLabel}>
                {COMMUTE_BOOKING_REQUESTS_SCREEN.errorRetryLabel}
              </Text>
            </Pressable>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateTitle}>{COMMUTE_BOOKING_REQUESTS_SCREEN.emptyTitle}</Text>
            <Text style={styles.stateText}>{COMMUTE_BOOKING_REQUESTS_SCREEN.emptyMessage}</Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.rideId} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupEyebrow}>Daily Office Commute</Text>
                <Text style={styles.groupRoute}>{group.routeTitle}</Text>
                <View style={styles.groupMetaRow}>
                  <Text style={styles.groupMeta}>
                    {[group.dateLabel, group.departureTimeLabel].filter(Boolean).join(' · ')}
                  </Text>
                  {group.availableSeats != null ? (
                    <Text style={styles.groupMeta}>
                      {COMMUTE_BOOKING_REQUESTS_SCREEN.availableSeatsLabel(
                        group.availableSeats,
                      )}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.groupCountBadge}>
                  <Text style={styles.groupCountText}>
                    {COMMUTE_BOOKING_REQUESTS_SCREEN.groupRequestCount(group.requests.length)}
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.rideDetailsBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => openRideDetails(group.rideId)}
                  accessibilityRole="button"
                  accessibilityLabel={COMMUTE_BOOKING_REQUESTS_SCREEN.openRideDetailsLabel}
                >
                  <Text style={styles.rideDetailsLabel}>
                    {COMMUTE_BOOKING_REQUESTS_SCREEN.openRideDetailsLabel}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.requestList}>
                {group.requests.map((request) => {
                  const bookingId = request.bookingId || request.id;
                  return (
                    <PendingRequestCard
                      key={request.id}
                      request={request}
                      onAccept={() => acceptRequest(request)}
                      onDecline={() => declineRequest(request)}
                      acceptLoading={isAccepting(bookingId)}
                      declineLoading={isRejecting(bookingId)}
                      disabled={
                        isAccepting(bookingId) || isRejecting(bookingId)
                      }
                    />
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

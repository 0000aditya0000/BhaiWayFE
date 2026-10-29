import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  IconButton,
  AppText as Text,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { PastRideCard, UpcomingRideCard } from '@/features/my-rides/components';
import { MY_RIDES_SCREEN } from '@/features/my-rides/constants';
import { COMMUTE_BOOKING_REQUESTS_SCREEN } from '@/features/my-rides/constants/commute-booking-requests.constants';
import { useMyRides } from '@/features/my-rides/hooks';
import type { HistoryRideItem, MyRidesTab, UpcomingRideSummary } from '@/features/my-rides/types';
import { styles } from './MyRidesScreen.styles';

export const MyRidesScreen = () => {
  const {
    showModeBadge,
    modeBadge,
    tab,
    setTab,
    upcomingRides,
    historyRides,
    historyLoading,
    historyLoadingMore,
    historyError,
    historyHasMore,
    loadMoreHistory,
    modifyLabel,
    emptyUpcomingSubtitle,
    emptyPastSubtitle,
    refreshing,
    refresh,
    resolveRideRole,
    labelsForRole,
    trackLabelForRide,
    openNotifications,
    openRideDetails,
    openBookingRequests,
    pendingCommuteRequestCount,
    openPastRide,
    modifyRide,
    trackRide,
    cancelRequest,
  } = useMyRides();

  const handleTab = useCallback(
    (next: MyRidesTab) => {
      triggerLightHaptic();
      setTab(next);
    },
    [setTab],
  );

  const handleTrack = useCallback(
    (ride: UpcomingRideSummary) => {
      triggerLightHaptic();
      trackRide(ride);
    },
    [trackRide],
  );

  const handleCancel = useCallback(
    (ride: UpcomingRideSummary) => {
      triggerLightHaptic();
      cancelRequest(ride);
    },
    [cancelRequest],
  );

  const handleModify = useCallback(
    (ride: UpcomingRideSummary) => {
      triggerLightHaptic();
      modifyRide(ride);
    },
    [modifyRide],
  );

  const handleOpenDetails = useCallback(
    (ride: UpcomingRideSummary) => {
      triggerLightHaptic();
      openRideDetails(ride);
    },
    [openRideDetails],
  );

  const handleOpenPastRide = useCallback(
    (ride: HistoryRideItem) => {
      triggerLightHaptic();
      openPastRide(ride);
    },
    [openPastRide],
  );

  const showPastEmpty =
    tab === 'past' && !historyLoading && !historyError && historyRides.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{MY_RIDES_SCREEN.title}</Text>
          {showModeBadge ? (
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>{modeBadge}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon="notifications-outline"
            onPress={openNotifications}
            color={colors.primary}
            accessibilityLabel="Open notifications"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }
      >
        <View style={styles.tabs}>
          <Pressable
            style={styles.tab}
            onPress={() => handleTab('upcoming')}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'upcoming' }}
          >
            <Text style={[styles.tabLabel, tab === 'upcoming' && styles.tabLabelActive]}>
              {MY_RIDES_SCREEN.tabUpcoming}
            </Text>
            {tab === 'upcoming' ? <View style={styles.tabIndicator} /> : null}
          </Pressable>
          <Pressable
            style={styles.tab}
            onPress={() => handleTab('past')}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'past' }}
          >
            <Text style={[styles.tabLabel, tab === 'past' && styles.tabLabelActive]}>
              {MY_RIDES_SCREEN.tabPast}
            </Text>
            {tab === 'past' ? <View style={styles.tabIndicator} /> : null}
          </Pressable>
        </View>

        {tab === 'upcoming' ? (
          <>
            {pendingCommuteRequestCount > 0 ? (
              <Pressable
                style={({ pressed }) => [styles.requestsBanner, pressed && { opacity: 0.92 }]}
                onPress={() => {
                  triggerLightHaptic();
                  openBookingRequests();
                }}
                accessibilityRole="button"
                accessibilityLabel={COMMUTE_BOOKING_REQUESTS_SCREEN.myRidesBannerTitle}
              >
                <View style={styles.requestsBannerCopy}>
                  <Text style={styles.requestsBannerTitle}>
                    {COMMUTE_BOOKING_REQUESTS_SCREEN.myRidesBannerTitle}
                  </Text>
                  <Text style={styles.requestsBannerSubtitle}>
                    {COMMUTE_BOOKING_REQUESTS_SCREEN.myRidesBannerSubtitle(
                      pendingCommuteRequestCount,
                    )}
                  </Text>
                </View>
                <View style={styles.requestsBannerCta}>
                  <Text style={styles.requestsBannerCtaLabel}>
                    {COMMUTE_BOOKING_REQUESTS_SCREEN.myRidesBannerCta}
                  </Text>
                  <View style={styles.requestsBannerCount}>
                    <Text style={styles.requestsBannerCountText}>
                      {COMMUTE_BOOKING_REQUESTS_SCREEN.pendingBadge(
                        pendingCommuteRequestCount,
                      )}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ) : null}
            {upcomingRides.length > 0 ? (
            <View style={styles.upcomingList}>
              {upcomingRides.map((ride) => {
                const role = resolveRideRole(ride);
                const labels = labelsForRole(role);
                return (
                  <UpcomingRideCard
                    key={ride.id}
                    ride={ride}
                    role={role}
                    peerLabel={labels.peerLabel}
                    cancelLabel={labels.cancelLabel}
                    trackLabel={trackLabelForRide(ride)}
                    modifyLabel={modifyLabel}
                    onCancel={() => handleCancel(ride)}
                    onTrack={() => handleTrack(ride)}
                    onModify={() => handleModify(ride)}
                    onOpenDetails={() => handleOpenDetails(ride)}
                  />
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={32} color="#747686" />
              <Text style={styles.emptyTitle}>{MY_RIDES_SCREEN.emptyUpcomingTitle}</Text>
              <Text style={styles.emptySubtitle}>{emptyUpcomingSubtitle}</Text>
            </View>
          )}
          </>
        ) : historyLoading && historyRides.length === 0 ? (
          <View style={styles.historyLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.historyLoadingText}>{MY_RIDES_SCREEN.historyLoadingLabel}</Text>
          </View>
        ) : showPastEmpty ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={32} color="#747686" />
            <Text style={styles.emptyTitle}>{MY_RIDES_SCREEN.emptyPastTitle}</Text>
            <Text style={styles.emptySubtitle}>{emptyPastSubtitle}</Text>
          </View>
        ) : (
          <View style={styles.pastListCards}>
            {historyError ? (
              <View style={styles.historyErrorBanner}>
                <Text style={styles.historyErrorText}>{historyError}</Text>
              </View>
            ) : null}
            {historyRides.map((ride) => (
              <PastRideCard
                key={ride.id}
                ride={ride}
                onOpenDetails={() => handleOpenPastRide(ride)}
              />
            ))}
            {historyHasMore ? (
              <Pressable
                style={({ pressed }) => [styles.loadMoreBtn, pressed && { opacity: 0.9 }]}
                onPress={() => void loadMoreHistory()}
                disabled={historyLoadingMore}
                accessibilityRole="button"
                accessibilityLabel={MY_RIDES_SCREEN.loadMoreLabel}
              >
                {historyLoadingMore ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.loadMoreLabel}>{MY_RIDES_SCREEN.loadMoreLabel}</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        )}
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

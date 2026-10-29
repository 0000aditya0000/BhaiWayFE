import React, { useCallback } from 'react';
import { FlatList, ListRenderItem, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ROUTES } from '@/config';
import {
  AppFooter,
  BrandTopBar,
  IconButton,
  ScreenIntro,
  AppText as Text,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { getSearchParam } from '@/shared/utils';
import { HomeLoader } from '@/features/home/components';
import {
  CommuteRideResultCard,
  CommuteRideResultFilters,
  CommuteSearchSummaryCard,
} from '@/features/office-commute/components';
import { COMMUTE_RIDE_RESULT_SCREEN } from '@/features/office-commute/constants';
import { useCommuteRideResult } from '@/features/office-commute/hooks';
import type { CommuteRideResultItem } from '@/features/office-commute/types';
import { styles } from './CommuteRideResultScreen.styles';

export const CommuteRideResultScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    origin?: string;
    destination?: string;
    dateLabel?: string;
    searchDate?: string;
    /** Legacy query alias for searchDate. */
    date?: string;
    timeLabel?: string;
    sameOrganizationOnly?: string;
    originLat?: string;
    originLng?: string;
    destinationLat?: string;
    destinationLng?: string;
  }>();

  const originLat = Number(getSearchParam(params.originLat));
  const originLng = Number(getSearchParam(params.originLng));
  const destinationLat = Number(getSearchParam(params.destinationLat));
  const destinationLng = Number(getSearchParam(params.destinationLng));

  const {
    summary,
    rides,
    totalCount,
    matchFilterId,
    sortId,
    setMatchFilterId,
    setSortId,
    loading,
    refreshing,
    requestStates,
    refresh,
    editSearch,
    requestToJoin,
    goBack,
  } = useCommuteRideResult({
    origin: getSearchParam(params.origin),
    destination: getSearchParam(params.destination),
    dateLabel: getSearchParam(params.dateLabel),
    searchDate: getSearchParam(params.searchDate) || getSearchParam(params.date),
    timeLabel: getSearchParam(params.timeLabel),
    sameOrganizationOnly: getSearchParam(params.sameOrganizationOnly) === 'true',
    originLat: Number.isFinite(originLat) ? originLat : undefined,
    originLng: Number.isFinite(originLng) ? originLng : undefined,
    destinationLat: Number.isFinite(destinationLat) ? destinationLat : undefined,
    destinationLng: Number.isFinite(destinationLng) ? destinationLng : undefined,
  });

  const handleNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const handleRidePress = useCallback((_ride: CommuteRideResultItem) => {
    // Details can be added later; card CTA is the primary action.
  }, []);

  const renderItem = useCallback<ListRenderItem<CommuteRideResultItem>>(
    ({ item, index }) => (
      <Animated.View entering={FadeInUp.duration(320).delay(Math.min(index * 60, 240))}>
        <CommuteRideResultCard
          ride={item}
          requestState={requestStates[item.id] ?? 'idle'}
          onPress={handleRidePress}
          onRequestPress={requestToJoin}
        />
      </Animated.View>
    ),
    [handleRidePress, requestStates, requestToJoin],
  );

  const keyExtractor = useCallback((item: CommuteRideResultItem) => item.id, []);

  const showFilteredEmpty = !loading && totalCount > 0 && rides.length === 0;

  const listHeader = (
    <View style={styles.headerBlock}>
      <CommuteSearchSummaryCard summary={summary} onEdit={editSearch} />
      <ScreenIntro
        title={COMMUTE_RIDE_RESULT_SCREEN.title}
        subtitle={COMMUTE_RIDE_RESULT_SCREEN.subtitle}
        variant="default"
        style={styles.intro}
      />
      {!loading && totalCount > 0 ? (
        <CommuteRideResultFilters
          matchFilterId={matchFilterId}
          sortId={sortId}
          onMatchFilterChange={setMatchFilterId}
          onSortChange={setSortId}
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <BrandTopBar
        onMenuPress={goBack}
        right={
          <IconButton
            icon="notifications-outline"
            onPress={handleNotifications}
            accessibilityLabel="Notifications"
          />
        }
      />

      {loading ? (
        <View style={styles.listContent}>
          {listHeader}
          <HomeLoader label="Finding commute rides…" />
          <View style={styles.skeletonStack}>
            <View style={styles.skeletonCard} />
            <View style={styles.skeletonCard} />
          </View>
        </View>
      ) : (
        <FlatList
          data={[...rides]}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            showFilteredEmpty ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="funnel-outline" size={28} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {COMMUTE_RIDE_RESULT_SCREEN.emptyFilteredTitle}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {COMMUTE_RIDE_RESULT_SCREEN.emptyFilteredSubtitle}
                </Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="car-outline" size={28} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>{COMMUTE_RIDE_RESULT_SCREEN.emptyTitle}</Text>
                <Text style={styles.emptySubtitle}>{COMMUTE_RIDE_RESULT_SCREEN.emptySubtitle}</Text>
              </View>
            )
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={refresh}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          accessibilityLabel="Available commute rides"
        />
      )}

      <AppFooter />
    </SafeAreaView>
  );
};

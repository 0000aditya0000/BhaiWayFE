import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_CONFIG, ROUTES } from '@/config';
import { AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { appModeStore } from '@/store';
import { myRidesSurfaceStore } from '@/features/my-rides/store';
import {
  ActiveRideContainer,
  EmptyHomeState,
  HomeCategoryCard,
  HomeFooter,
  HomeHeader,
  HomeLoader,
} from '@/features/home/components';
import { getActiveRideDockHeight, HOME_GREETING } from '@/features/home/constants';
import { useActiveRides, useHome } from '@/features/home/hooks';
import type { HomeAction, HomeCategory } from '@/features/home/types';
import { useUnreadNotificationCount } from '@/features/notifications/hooks';
import { styles } from './HomeScreen.styles';

export const HomeScreen = () => {
  const router = useRouter();
  const {
    loading,
    refreshing,
    error,
    firstName,
    user,
    location,
    categories,
    refresh,
    retry,
  } = useHome();
  const { count: unreadNotificationCount } = useUnreadNotificationCount();
  const activeRide = useActiveRides();

  const handleNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const handleProfile = useCallback(() => {
    router.push(ROUTES.profile);
  }, [router]);

  const handleActionPress = useCallback(
    (action: HomeAction, _category: HomeCategory) => {
      switch (action.id) {
        case 'outstation-publish':
          myRidesSurfaceStore.setStandard();
          appModeStore.setDriving();
          router.push(ROUTES.offerRide);
          return;
        case 'outstation-book':
          myRidesSurfaceStore.setStandard();
          appModeStore.setRiding();
          router.push({
            pathname: ROUTES.rideSearch,
            params: { mode: 'outstation' },
          });
          return;
        case 'office-publish':
          myRidesSurfaceStore.setOfficeCommute();
          appModeStore.setDriving();
          router.push(ROUTES.officeCommutePublish);
          return;
        case 'office-book':
          myRidesSurfaceStore.setOfficeCommute();
          appModeStore.setRiding();
          router.push(ROUTES.officeCommuteSearch);
          return;
        default:
          return;
      }
    },
    [router],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), activeRide.refresh()]);
  }, [activeRide.refresh, refresh]);

  const showEmpty = !loading && !error && categories.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#EEF1FA', '#F4F6FB', '#F8F9FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backdrop}
        pointerEvents="none"
      />

      <HomeHeader
        brandName={APP_CONFIG.name}
        location={location}
        hasUnreadNotifications={unreadNotificationCount > 0}
        notificationBadgeCount={unreadNotificationCount}
        avatarUri={user?.avatarUri}
        onNotificationsPress={handleNotifications}
        onProfilePress={handleProfile}
      />

      <ScrollView
        style={activeRide.visible ? { marginBottom: getActiveRideDockHeight() } : undefined}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(380)} style={styles.hero}>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting} accessibilityRole="header">
              {HOME_GREETING.prefix},{' '}
              <Text style={[styles.greeting, styles.greetingAccent]}>{firstName}</Text>
            </Text>
          </View>
          <Text style={styles.heroHint}>{HOME_GREETING.hint}</Text>
        </Animated.View>

        {loading ? <HomeLoader /> : null}

        {error ? (
          <EmptyHomeState
            variant="error"
            title="Something went wrong"
            message={error}
            onRetry={retry}
          />
        ) : null}

        {showEmpty ? (
          <EmptyHomeState
            variant="empty"
            title="No services available"
            message="Please check back in a little while."
            onRetry={retry}
          />
        ) : null}

        {!loading && !error && categories.length > 0 ? (
          <>
            {categories.map((category, index) => (
              <HomeCategoryCard
                key={category.id}
                category={category}
                index={index}
                onActionPress={handleActionPress}
              />
            ))}
            <HomeFooter />
          </>
        ) : null}
      </ScrollView>

      {activeRide.visible ? (
        <ActiveRideContainer
          items={activeRide.items}
          selected={activeRide.selected}
          expanded={activeRide.expanded}
          onToggleExpanded={activeRide.toggleExpanded}
          onCollapse={activeRide.collapse}
          onSelectRide={activeRide.selectRide}
          onGoToRide={activeRide.goToRide}
        />
      ) : null}
    </SafeAreaView>
  );
};

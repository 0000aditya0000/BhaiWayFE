import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconButton, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { NotificationItem } from '@/features/notifications/components';
import { NOTIFICATIONS_SCREEN } from '@/features/notifications/constants';
import { useNotifications } from '@/features/notifications/hooks';
import type { AppNotification } from '@/features/notifications/types';
import { styles } from './NotificationsScreen.styles';

export const NotificationsScreen = () => {
  const {
    items,
    todayItems,
    earlierItems,
    unreadCount,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    markingAll,
    permissionStatus,
    requestPermission,
    openNotificationSettings,
    markAllAsRead,
    openNotification,
    refresh,
    loadMore,
    retry,
    goBack,
  } = useNotifications();

  const handlePressItem = useCallback(
    (notification: AppNotification) => {
      void openNotification(notification);
    },
    [openNotification],
  );

  const showPermissionBanner = permissionStatus !== 'granted';
  const markAllDisabled = unreadCount === 0 || markingAll || loading;

  const listHeader = (
    <View style={styles.listHeader}>
      {showPermissionBanner ? (
        <View style={styles.permissionBanner}>
          <View style={styles.permissionIcon}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.permissionCopy}>
            <Text style={styles.permissionTitle}>{NOTIFICATIONS_SCREEN.permissionTitle}</Text>
            <Text style={styles.permissionBody}>
              {permissionStatus === 'denied'
                ? NOTIFICATIONS_SCREEN.permissionDeniedBody
                : NOTIFICATIONS_SCREEN.permissionBody}
            </Text>
          </View>
          <Pressable
            style={styles.permissionCta}
            onPress={() => {
              if (permissionStatus === 'denied') {
                openNotificationSettings();
                return;
              }
              void requestPermission();
            }}
            accessibilityRole="button"
            accessibilityLabel={
              permissionStatus === 'denied'
                ? NOTIFICATIONS_SCREEN.permissionOpenSettingsCta
                : NOTIFICATIONS_SCREEN.permissionCta
            }
          >
            <Text style={styles.permissionCtaLabel}>
              {permissionStatus === 'denied'
                ? NOTIFICATIONS_SCREEN.permissionOpenSettingsCta
                : NOTIFICATIONS_SCREEN.permissionCta}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  const renderSections = () => {
    const rows: Array<
      | { kind: 'section'; id: string; label: string }
      | { kind: 'item'; id: string; notification: AppNotification }
    > = [];

    if (todayItems.length > 0) {
      rows.push({ kind: 'section', id: 'section-today', label: NOTIFICATIONS_SCREEN.sectionToday });
      todayItems.forEach((item) => {
        rows.push({ kind: 'item', id: item.id, notification: item });
      });
    }
    if (earlierItems.length > 0) {
      rows.push({
        kind: 'section',
        id: 'section-earlier',
        label: NOTIFICATIONS_SCREEN.sectionEarlier,
      });
      earlierItems.forEach((item) => {
        rows.push({ kind: 'item', id: item.id, notification: item });
      });
    }
    return rows;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <IconButton
            icon="arrow-back"
            onPress={goBack}
            color={colors.primary}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.title} accessibilityRole="header" pointerEvents="none">
          {NOTIFICATIONS_SCREEN.title}
        </Text>
        <View style={styles.headerSideRight}>
          <Pressable
            onPress={() => {
              void markAllAsRead();
            }}
            disabled={markAllDisabled}
            accessibilityRole="button"
            accessibilityLabel={NOTIFICATIONS_SCREEN.markAllRead}
            accessibilityState={{ disabled: markAllDisabled }}
            hitSlop={8}
          >
            <Text
              style={[styles.markAll, markAllDisabled && styles.markAllDisabled]}
              numberOfLines={2}
            >
              {markingAll
                ? NOTIFICATIONS_SCREEN.markingAllLabel
                : NOTIFICATIONS_SCREEN.markAllRead}
            </Text>
          </Pressable>
        </View>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centeredBody}>{NOTIFICATIONS_SCREEN.loadingLabel}</Text>
        </View>
      ) : null}

      {!loading && error && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.centeredTitle}>{NOTIFICATIONS_SCREEN.loadErrorTitle}</Text>
          <Text style={styles.centeredBody}>{error}</Text>
          <Button label={NOTIFICATIONS_SCREEN.retryLabel} onPress={retry} />
        </View>
      ) : null}

      {!loading || items.length > 0 ? (
        <FlatList
          data={renderSections()}
          keyExtractor={(row) => row.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 && styles.listEmptyContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void refresh();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            !loading && !error ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="notifications-outline" size={28} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>{NOTIFICATIONS_SCREEN.emptyTitle}</Text>
                <Text style={styles.emptyMessage}>{NOTIFICATIONS_SCREEN.emptyMessage}</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} style={styles.listFooter} />
            ) : null
          }
          renderItem={({ item: row }) => {
            if (row.kind === 'section') {
              return <Text style={styles.sectionLabel}>{row.label}</Text>;
            }
            return (
              <NotificationItem notification={row.notification} onPress={handlePressItem} />
            );
          }}
        />
      ) : null}
    </SafeAreaView>
  );
};

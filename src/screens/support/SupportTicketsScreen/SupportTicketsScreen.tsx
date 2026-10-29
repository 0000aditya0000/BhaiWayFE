import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { SUPPORT_TICKETS_SCREEN } from '@/features/support/constants';
import { useSupportTickets } from '@/features/support/hooks';
import type { SupportTicketListItemDto, SupportTicketStatus } from '@/features/support/api';
import {
  formatSupportCategoryLabel,
  formatSupportDateTime,
  formatSupportStatusLabel,
  formatSupportSubcategoryLabel,
  previewDescription,
} from '@/features/support/utils';
import { supportSharedStyles as styles, supportTokens } from '../supportShared.styles';

const STATUS_FILTERS: Array<SupportTicketStatus | 'ALL'> = [
  'ALL',
  'CREATED',
  'IN_PROGRESS',
  'RESOLVED',
];

const statusBadgeStyle = (status: string) => {
  const key = status.trim().toUpperCase();
  if (key === 'RESOLVED') {
    return { badge: styles.statusResolved, label: styles.statusLabelResolved };
  }
  if (key === 'CREATED') {
    return { badge: styles.statusCreated, label: styles.statusLabelCreated };
  }
  return { badge: styles.statusProgress, label: styles.statusLabelProgress };
};

export const SupportTicketsScreen = () => {
  const {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    statusFilter,
    setStatusFilter,
    refresh,
    loadMore,
    retry,
    openTicket,
    goBack,
  } = useSupportTickets();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const renderItem = useCallback(
    ({ item }: { item: SupportTicketListItemDto }) => {
      const statusStyle = statusBadgeStyle(String(item.status));
      return (
        <Pressable
          style={styles.card}
          onPress={() => openTicket(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`${item.reference}. ${formatSupportStatusLabel(String(item.status))}`}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: supportTokens.ON_SURFACE }}>
                {item.reference}
              </Text>
              <Text style={styles.body} numberOfLines={1}>
                {formatSupportCategoryLabel(String(item.category))} ·{' '}
                {formatSupportSubcategoryLabel(item.subcategory)}
              </Text>
              <Text style={styles.muted} numberOfLines={2}>
                {previewDescription(item.subject)}
              </Text>
              {item.relatedRideId ? (
                <Text style={styles.muted} numberOfLines={1}>
                  Ride · {item.relatedRideId.slice(0, 8)}…
                </Text>
              ) : null}
              <Text style={styles.muted}>{formatSupportDateTime(item.updatedAt || item.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, statusStyle.badge]}>
              <Text style={[styles.statusLabel, statusStyle.label]}>
                {formatSupportStatusLabel(String(item.status))}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [openTicket],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={supportTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header">
          {SUPPORT_TICKETS_SCREEN.title}
        </Text>
      </View>

      <View style={[styles.content, { paddingBottom: 8, flexGrow: 0 }]}>
        <View style={styles.chipRow}>
          {STATUS_FILTERS.map((value) => {
            const selected = statusFilter === value;
            const label =
              value === 'ALL'
                ? SUPPORT_TICKETS_SCREEN.filterAll
                : formatSupportStatusLabel(value);
            return (
              <Pressable
                key={value}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setStatusFilter(value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={supportTokens.PRIMARY} />
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={retry} accessibilityRole="button">
            <Text style={[styles.chipLabelSelected, { fontSize: 15 }]}>
              {SUPPORT_TICKETS_SCREEN.retryLabel}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.content, { flexGrow: 1 }]}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
          }
          onEndReached={() => {
            if (hasMore) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: supportTokens.ON_SURFACE }}>
                {SUPPORT_TICKETS_SCREEN.emptyTitle}
              </Text>
              <Text style={styles.muted}>{SUPPORT_TICKETS_SCREEN.emptyMessage}</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={{ marginVertical: 16 }}
                color={supportTokens.PRIMARY}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

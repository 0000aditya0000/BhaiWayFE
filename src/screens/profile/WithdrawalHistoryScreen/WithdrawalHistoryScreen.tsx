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

import { useWithdrawals } from '@/features/profile/hooks/useWithdrawals';
import {
  formatCoinString,
} from '@/features/profile/utils/walletCoin';
import {
  WITHDRAWAL_STATUS_COPY,
  formatWithdrawalDay,
  withdrawalPaymentSummary,
} from '@/features/profile/utils/withdrawals.mapper';
import { Button, IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { styles, tokens } from './WithdrawalHistoryScreen.styles';

export const WithdrawalHistoryScreen = () => {
  const {
    title,
    emptyTitle,
    emptySubtitle,
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    goBack,
    refresh,
    loadMore,
    retry,
    openDetails,
  } = useWithdrawals();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={tokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.PRIMARY} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{error}</Text>
          <Button label="Retry" onPress={retry} accessibilityLabel="Retry" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
            <View style={styles.emptyCard}>
              <Ionicons name="cash-outline" size={28} color={tokens.PRIMARY} />
              <Text style={styles.emptyTitle}>{emptyTitle}</Text>
              <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={tokens.PRIMARY} style={{ marginVertical: 16 }} />
            ) : null
          }
          renderItem={({ item }) => {
            const status = WITHDRAWAL_STATUS_COPY[item.status];
            return (
              <Pressable
                style={styles.rowCard}
                onPress={() => openDetails(item.id)}
                accessibilityRole="button"
              >
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle}>Withdrawal</Text>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{status.label}</Text>
                  </View>
                </View>
                <Text style={styles.rowAmount}>{formatCoinString(item.amount)} Coins</Text>
                <Text style={styles.rowMeta}>{withdrawalPaymentSummary(item)}</Text>
                <Text style={styles.rowMeta}>
                  {formatWithdrawalDay(item.requestedAt ?? item.createdAt)}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import {
  WalletTransactionDetailModal,
  WalletTransactionRow,
} from '@/features/profile/components';
import { WALLET_TRANSACTIONS_SCREEN } from '@/features/profile/constants';
import { useWalletTransactions } from '@/features/profile/hooks';
import { styles, walletTxTokens } from './WalletTransactionsScreen.styles';

export const WalletTransactionsScreen = () => {
  const {
    title,
    subtitle,
    filters,
    activeFilter,
    transactions,
    loading,
    loadingMore,
    error,
    hasMore,
    selectedTransaction,
    isTransactionDetailOpen,
    setFilter,
    loadMore,
    retry,
    openTransaction,
    closeTransaction,
    goBack,
  } = useWalletTransactions();

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
          color={walletTxTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>{subtitle}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {filters.map((filter) => {
            const active = filter.id === activeFilter;
            return (
              <Pressable
                key={filter.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(filter.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={filter.label}
              >
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading && transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={walletTxTokens.PRIMARY} />
          </View>
        ) : error && transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{WALLET_TRANSACTIONS_SCREEN.errorTitle}</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={retry} accessibilityRole="button">
              <Text style={styles.retryLabel}>{WALLET_TRANSACTIONS_SCREEN.retryLabel}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{WALLET_TRANSACTIONS_SCREEN.emptyTitle}</Text>
                <Text style={styles.stateText}>{WALLET_TRANSACTIONS_SCREEN.emptyMessage}</Text>
              </View>
            ) : (
              transactions.map((tx) => (
                <WalletTransactionRow
                  key={tx.id}
                  transaction={tx}
                  onPress={openTransaction}
                />
              ))
            )}
          </View>
        )}

        {hasMore ? (
          <Pressable
            style={styles.loadMoreButton}
            onPress={loadMore}
            disabled={loadingMore}
            accessibilityRole="button"
            accessibilityLabel={WALLET_TRANSACTIONS_SCREEN.loadMoreLabel}
          >
            {loadingMore ? (
              <ActivityIndicator color={walletTxTokens.PRIMARY} />
            ) : (
              <Text style={styles.loadMoreLabel}>{WALLET_TRANSACTIONS_SCREEN.loadMoreLabel}</Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>

      <WalletTransactionDetailModal
        visible={isTransactionDetailOpen}
        transaction={selectedTransaction}
        onClose={closeTransaction}
      />

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

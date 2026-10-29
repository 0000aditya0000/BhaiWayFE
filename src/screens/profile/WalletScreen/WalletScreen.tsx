import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import {
  WalletCoinsGlyph,
  WalletTransactionDetailModal,
  WalletTransactionRow,
} from '@/features/profile/components';
import { WALLET_SCREEN } from '@/features/profile/constants';
import { useWallet } from '@/features/profile/hooks';
import { formatCoinString } from '@/features/profile/utils/walletCoin';
import { styles, walletTokens } from './WalletScreen.styles';

export const WalletScreen = () => {
  const {
    summary,
    loading,
    error,
    filters,
    activeFilter,
    transactions,
    transactionsLoading,
    hasHeldCoins,
    refreshing,
    selectedTransaction,
    isTransactionDetailOpen,
    goBack,
    openNotifications,
    setFilter,
    withdraw,
    openWithdrawalHistory,
    openPaymentMethods,
    addCoins,
    viewAll,
    refresh,
    retry,
    openTransaction,
    closeTransaction,
  } = useWallet();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  const renderBalanceSection = () => {
    if (loading && !summary) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={walletTokens.PRIMARY} />
        </View>
      );
    }

    if (error && !summary) {
      return (
        <View style={styles.errorCard}>
          <Ionicons name="cloud-offline-outline" size={32} color={walletTokens.ON_SURFACE_VARIANT} />
          <Text style={styles.errorTitle}>{WALLET_SCREEN.loadErrorTitle}</Text>
          <Text style={styles.errorMessage}>{WALLET_SCREEN.loadErrorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={retry} accessibilityRole="button">
            <Text style={styles.retryLabel}>{WALLET_SCREEN.retryLabel}</Text>
          </Pressable>
        </View>
      );
    }

    if (!summary) {
      return null;
    }

    return (
      <>
        <LinearGradient
          colors={['#4B61C4', '#374BB1', '#2B3A8C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlowOne} pointerEvents="none" />
          <View style={styles.heroGlowTwo} pointerEvents="none" />

          <View style={styles.heroTopRow}>
            <View style={styles.heroWalletBadge}>
              <Ionicons name="wallet-outline" size={18} color={walletTokens.ON_PRIMARY} />
              <Text style={styles.heroWalletLabel}>BhaiWay Wallet</Text>
            </View>
            <Text style={styles.heroRateHint}>{WALLET_SCREEN.coinRateHint}</Text>
          </View>

          <Text style={styles.heroBalanceLabel}>{WALLET_SCREEN.totalBalanceLabel}</Text>
          <View style={styles.heroBalanceRow}>
            <WalletCoinsGlyph size={26} color="#F5D76E" />
            <Text style={styles.heroBalanceValue}>{formatCoinString(summary.balanceCoins)}</Text>
            <Text style={styles.heroBalanceSuffix}>{WALLET_SCREEN.coinsSuffix}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>{WALLET_SCREEN.availableLabel}</Text>
              <Text style={styles.statValue}>{formatCoinString(summary.availableCoins)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>{WALLET_SCREEN.heldLabel}</Text>
              <Text style={styles.statValue}>{formatCoinString(summary.heldCoins)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>{WALLET_SCREEN.withdrawableLabel}</Text>
              <Text style={styles.statValue}>{formatCoinString(summary.withdrawableCoins)}</Text>
            </View>
          </View>
        </LinearGradient>

        {hasHeldCoins ? (
          <View style={styles.heldNotice}>
            <Ionicons name="information-circle-outline" size={18} color={walletTokens.PRIMARY} />
            <Text style={styles.heldNoticeText}>{WALLET_SCREEN.heldNotice}</Text>
          </View>
        ) : null}

        <View style={styles.bucketsCard}>
          <Text style={styles.bucketsTitle}>{WALLET_SCREEN.bucketsTitle}</Text>
          <View style={styles.bucketGrid}>
            {[summary.buckets.purchased, summary.buckets.promotional, summary.buckets.driverEarned].map(
              (bucket) => (
                <View key={bucket.label} style={styles.bucketTile}>
                  <Text style={styles.bucketLabel}>{bucket.label}</Text>
                  <Text style={styles.bucketValue}>{bucket.availableLabel}</Text>
                  {bucket.heldLabel !== '0' ? (
                    <Text style={styles.bucketHeld}>{bucket.heldLabel} held</Text>
                  ) : null}
                </View>
              ),
            )}
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={walletTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {WALLET_SCREEN.title}
        </Text>
        <IconButton
          icon="notifications-outline"
          onPress={openNotifications}
          color={walletTokens.ON_SURFACE_VARIANT}
          accessibilityLabel="Notifications"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={walletTokens.PRIMARY}
          />
        }
      >
        {renderBalanceSection()}

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.actionPrimary, pressed && styles.actionPressed]}
            onPress={addCoins}
            accessibilityRole="button"
            accessibilityLabel={WALLET_SCREEN.addCoinsLabel}
          >
            <View style={styles.actionIconPrimary}>
              <Ionicons name="add" size={20} color={walletTokens.ON_PRIMARY} />
            </View>
            <Text style={styles.actionPrimaryLabel}>{WALLET_SCREEN.addCoinsLabel}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionSecondary, pressed && styles.actionPressed]}
            onPress={withdraw}
            accessibilityRole="button"
            accessibilityLabel={WALLET_SCREEN.withdrawLabel}
          >
            <View style={styles.actionIconSecondary}>
              <Ionicons name="arrow-up-outline" size={18} color={walletTokens.PRIMARY} />
            </View>
            <Text style={styles.actionSecondaryLabel}>{WALLET_SCREEN.withdrawLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.actionSecondary, pressed && styles.actionPressed, { flex: 1 }]}
            onPress={openWithdrawalHistory}
            accessibilityRole="button"
            accessibilityLabel={WALLET_SCREEN.withdrawalHistoryLabel}
          >
            <View style={styles.actionIconSecondary}>
              <Ionicons name="time-outline" size={18} color={walletTokens.PRIMARY} />
            </View>
            <Text style={styles.actionSecondaryLabel}>{WALLET_SCREEN.withdrawalHistoryLabel}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionSecondary, pressed && styles.actionPressed, { flex: 1 }]}
            onPress={openPaymentMethods}
            accessibilityRole="button"
            accessibilityLabel={WALLET_SCREEN.paymentMethodsLabel}
          >
            <View style={styles.actionIconSecondary}>
              <Ionicons name="card-outline" size={18} color={walletTokens.PRIMARY} />
            </View>
            <Text style={styles.actionSecondaryLabel}>{WALLET_SCREEN.paymentMethodsLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>{WALLET_SCREEN.transactionsTitle}</Text>
            <Pressable onPress={viewAll} hitSlop={8} accessibilityRole="button">
              <Text style={styles.viewAllLabel}>{WALLET_SCREEN.viewAllLabel}</Text>
            </Pressable>
          </View>

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
                >
                  <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.transactionList}>
            {transactionsLoading && transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={walletTokens.PRIMARY} />
              </View>
            ) : transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={36} color={walletTokens.OUTLINE_VARIANT} />
                <Text style={styles.emptyTitle}>{WALLET_SCREEN.emptyTransactionsTitle}</Text>
                <Text style={styles.emptyText}>{WALLET_SCREEN.emptyTransactionsMessage}</Text>
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
        </View>
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

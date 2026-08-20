import React, { useCallback } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, BhaiWayCoinAmount, BhaiWayCoinIcon, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { WALLET_SCREEN } from '@/features/profile/constants';
import { useWallet } from '@/features/profile/hooks';
import type { WalletTransaction } from '@/features/profile/types';
import { styles, walletTokens } from './WalletScreen.styles';

const PROMO_IMAGE =
  'https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg';

const transactionIcon = (icon: WalletTransaction['icon']) => {
  if (icon === 'car') return 'car-outline' as const;
  if (icon === 'card') return 'card-outline' as const;
  if (icon === 'business') return 'business-outline' as const;
  return 'star' as const;
};

export const WalletScreen = () => {
  const {
    summary,
    balance,
    filters,
    activeFilter,
    transactions,
    goBack,
    openNotifications,
    setFilter,
    withdraw,
    addMoney,
    viewAll,
    openPromo,
    openTransaction,
  } = useWallet();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={walletTokens.PRIMARY}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {WALLET_SCREEN.brandTitle}
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
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceGlow} pointerEvents="none" />
          <View>
            <Text style={styles.balanceLabel}>{WALLET_SCREEN.balanceLabel}</Text>
            <BhaiWayCoinAmount
              amount={balance}
              size={28}
              textStyle={styles.balanceValue}
            />
          </View>
          <View style={styles.balanceFooter}>
            <View style={styles.walletNameRow}>
              <Ionicons name="diamond" size={20} color={walletTokens.ON_PRIMARY} />
              <Text style={styles.walletName}>{summary.walletName}</Text>
            </View>
            <View style={styles.walletIdBlock}>
              <Text style={styles.walletIdLabel}>{WALLET_SCREEN.walletIdLabel}</Text>
              <Text style={styles.walletIdValue}>{summary.walletId}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.withdrawButton, pressed && { transform: [{ scale: 0.97 }] }]}
            onPress={withdraw}
            accessibilityRole="button"
            accessibilityLabel={WALLET_SCREEN.withdrawLabel}
          >
            <Ionicons name="business-outline" size={18} color={walletTokens.ON_PRIMARY} />
            <Text style={styles.actionLabelPrimary} numberOfLines={1}>
              {WALLET_SCREEN.withdrawLabel}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.addMoneyButton, pressed && { transform: [{ scale: 0.97 }] }]}
            onPress={addMoney}
            accessibilityRole="button"
            accessibilityLabel={WALLET_SCREEN.addMoneyLabel}
          >
            <Ionicons name="add" size={18} color={walletTokens.PRIMARY} />
            <Text style={styles.actionLabelOutline} numberOfLines={1}>
              {WALLET_SCREEN.addMoneyLabel}
            </Text>
          </Pressable>
        </View>

        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle} numberOfLines={1}>
              {WALLET_SCREEN.transactionsTitle}
            </Text>
            <Pressable
              onPress={viewAll}
              accessibilityRole="button"
              accessibilityLabel={WALLET_SCREEN.viewAllLabel}
              hitSlop={8}
            >
              <Text style={styles.viewAllLabel} numberOfLines={1}>
                {WALLET_SCREEN.viewAllLabel}
              </Text>
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
                  accessibilityLabel={filter.label}
                >
                  <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.transactionList}>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No transactions in this filter.</Text>
              </View>
            ) : (
              transactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <Pressable
                    key={tx.id}
                    style={({ pressed }) => [
                      styles.transactionCard,
                      pressed && { opacity: 0.92, borderColor: 'rgba(55, 75, 177, 0.3)' },
                    ]}
                    onPress={() => openTransaction(tx)}
                    accessibilityRole="button"
                    accessibilityLabel={`${tx.title} ${tx.amountLabel}`}
                  >
                    <View style={styles.transactionLeft}>
                      <View
                        style={
                          isCredit ? styles.transactionIconCredit : styles.transactionIconDebit
                        }
                      >
                        <Ionicons
                          name={transactionIcon(tx.icon)}
                          size={22}
                          color={isCredit ? walletTokens.CREDIT_ICON : walletTokens.ERROR}
                        />
                      </View>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionTitle}>{tx.title}</Text>
                        <Text style={styles.transactionDate}>{tx.dateLabel}</Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <View style={styles.amountRow}>
                        <BhaiWayCoinIcon size={14} />
                        <Text style={isCredit ? styles.amountCredit : styles.amountDebit}>
                          {tx.amountLabel}
                        </Text>
                      </View>
                      <Text style={styles.typeLabel}>{tx.type}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.promoCard, pressed && { opacity: 0.95 }]}
          onPress={openPromo}
          accessibilityRole="button"
          accessibilityLabel={WALLET_SCREEN.promoTitle}
        >
          <Image
            source={{ uri: PROMO_IMAGE }}
            style={styles.promoImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.promoOverlay}>
            <Text style={styles.promoEyebrow}>{WALLET_SCREEN.promoEyebrow}</Text>
            <Text style={styles.promoTitle}>{WALLET_SCREEN.promoTitle}</Text>
          </View>
        </Pressable>
      </ScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};

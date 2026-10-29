import React, { useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';

import { WALLET_TRANSACTION_DETAIL } from '../../constants/wallet-transaction-detail.constants';
import type { WalletTransaction } from '../../types';
import { resolveWalletCategoryVisual } from '../../utils/walletTransactionRowVisual';
import { WalletCoinsGlyph } from '../WalletCoinsGlyph';
import { rowTokens, styles } from './WalletTransactionRow.styles';

export interface WalletTransactionRowProps {
  transaction: WalletTransaction;
  onPress: (transaction: WalletTransaction) => void;
  showDetailButton?: boolean;
}

export const WalletTransactionRow = ({
  transaction,
  onPress,
  showDetailButton = true,
}: WalletTransactionRowProps) => {
  const isCredit = transaction.type === 'credit';
  const visual = useMemo(
    () => resolveWalletCategoryVisual(transaction),
    [transaction],
  );

  const handlePress = useCallback(() => {
    onPress(transaction);
  }, [onPress, transaction]);

  const handleDetailPress = useCallback(() => {
    onPress(transaction);
  }, [onPress, transaction]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${transaction.title}, ${transaction.amountLabel}`}
    >
      <View style={[styles.accent, { backgroundColor: visual.accentColor }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: visual.iconBackground }]}>
            <Ionicons name={visual.ionicon} size={22} color={visual.iconColor} />
          </View>
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={2}>
              {transaction.title}
            </Text>
            {transaction.subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {transaction.subtitle}
              </Text>
            ) : null}
            <Text style={styles.date} numberOfLines={1}>
              {transaction.dateLabel}
            </Text>
            {transaction.displayCategory ? (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{transaction.displayCategory}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.amountBlock}>
            <View style={styles.amountRow}>
              <WalletCoinsGlyph size={14} color={rowTokens.COIN_GOLD} />
              <Text style={isCredit ? styles.amountCredit : styles.amountDebit}>
                {transaction.amountLabel}
              </Text>
            </View>
          </View>
        </View>

        {showDetailButton ? (
          <View style={styles.footer}>
            <Text style={styles.date}>{transaction.status ?? 'POSTED'}</Text>
            <Pressable
              style={styles.detailButton}
              onPress={handleDetailPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={WALLET_TRANSACTION_DETAIL.viewDetailsLabel}
            >
              <Text style={styles.detailLabel}>{WALLET_TRANSACTION_DETAIL.viewDetailsLabel}</Text>
              <Ionicons name="chevron-forward" size={14} color={rowTokens.PRIMARY} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

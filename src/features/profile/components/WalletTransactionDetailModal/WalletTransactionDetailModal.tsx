import React, { useCallback, useMemo } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';

import { WALLET_TRANSACTION_DETAIL } from '../../constants/wallet-transaction-detail.constants';
import type { WalletTransaction } from '../../types';
import { buildWalletTransactionDetailRows } from '../../utils/mapWalletTransactionDetail';
import { resolveWalletCategoryVisual } from '../../utils/walletTransactionRowVisual';
import { WalletCoinsGlyph } from '../WalletCoinsGlyph';
import { detailTokens, styles } from './WalletTransactionDetailModal.styles';

export interface WalletTransactionDetailModalProps {
  visible: boolean;
  transaction: WalletTransaction | null;
  onClose: () => void;
}

export const WalletTransactionDetailModal = ({
  visible,
  transaction,
  onClose,
}: WalletTransactionDetailModalProps) => {
  const rows = useMemo(
    () => (transaction ? buildWalletTransactionDetailRows(transaction) : []),
    [transaction],
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!transaction) {
    return null;
  }

  const isCredit = transaction.type === 'credit';
  const visual = resolveWalletCategoryVisual(transaction);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={WALLET_TRANSACTION_DETAIL.closeLabel}
        />

        <View style={styles.sheet}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>{WALLET_TRANSACTION_DETAIL.title}</Text>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={WALLET_TRANSACTION_DETAIL.closeLabel}
            >
              <Ionicons name="close" size={20} color={detailTokens.ON_SURFACE_VARIANT} />
            </Pressable>
          </View>

          <View style={[styles.hero, isCredit ? styles.heroCredit : styles.heroDebit]}>
            <View style={[styles.heroIconWrap, { backgroundColor: visual.iconBackground }]}>
              <Ionicons name={visual.ionicon} size={26} color={visual.iconColor} />
            </View>
            <Text style={styles.heroTitle}>{transaction.title}</Text>
            <View style={styles.heroAmountRow}>
              <WalletCoinsGlyph size={20} color={detailTokens.COIN_GOLD} />
              <Text style={isCredit ? styles.heroAmountCredit : styles.heroAmountDebit}>
                {transaction.amountLabel}
              </Text>
            </View>
            <Text style={styles.heroDate}>{transaction.dateLabel}</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            bounces
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {rows.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={[styles.rowValue, row.mono && styles.rowValueMono]} selectable>
                  {row.value}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

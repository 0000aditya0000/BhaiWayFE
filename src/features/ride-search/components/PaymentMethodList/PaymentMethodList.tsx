import React, { useSyncExternalStore } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getBhaiWayWalletBalance, subscribeBhaiWayWallet } from '@/DemoData';
import { formatCoinString } from '@/features/profile/utils/walletCoin';
import { AppText as Text, BhaiWayCoinIcon } from '@/shared/components';
import { colors } from '@/shared/theme';
import { formatBhaiWayCoins } from '@/shared/utils';
import { PAYMENT_METHODS, PAYMENT_SCREEN } from '../../constants';
import type { PaymentMethodId } from '../../types';
import { styles } from './PaymentMethodList.styles';

export interface PaymentMethodListProps {
  selectedId: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
  onAddCoins: () => void;
  /**
   * Rider fare payment only. Hide for drivers (publish flow).
   * Shown for both Regular and Assured — Assured still charges the fee upfront.
   */
  showPayAfterRide?: boolean;
  /** Overrides the default Pay After Ride subtitle (e.g. Assured fee note). */
  payAfterSubtitle?: string;
  /** Overrides DemoData wallet balance — Assured uses Wallet V1 availableCoins. */
  walletAvailableCoins?: string | null;
}

const Radio = ({ selected }: { selected: boolean }) => (
  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
    {selected ? <View style={styles.radioInner} /> : null}
  </View>
);

const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

export const PaymentMethodList = React.memo(
  ({
    selectedId,
    onSelect,
    onAddCoins,
    showPayAfterRide = true,
    payAfterSubtitle,
    walletAvailableCoins,
  }: PaymentMethodListProps) => {
    const demoWalletBalance = useSyncExternalStore(subscribeBhaiWayWallet, getBhaiWayWalletBalance);
    const walletBalanceDisplay =
      walletAvailableCoins != null
        ? formatCoinString(walletAvailableCoins)
        : formatBhaiWayCoins(demoWalletBalance, { minimumFractionDigits: 2 });
    const wallet = PAYMENT_METHODS.find((method) => method.kind === 'wallet')!;
    const payAfter = PAYMENT_METHODS.find((method) => method.kind === 'pay-after');

    return (
      <>
        <View style={styles.section}>
          <SectionTitle title={PAYMENT_SCREEN.walletTitle} />
          <View style={styles.card}>
            <Pressable
              style={styles.row}
              onPress={() => onSelect(wallet.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedId === wallet.id }}
              android_ripple={{ color: 'rgba(29, 78, 216, 0.08)' }}
            >
              <View style={styles.iconWrap}>
                <BhaiWayCoinIcon size={22} />
              </View>
              <View style={styles.meta}>
                <Text style={styles.label}>{wallet.label}</Text>
                <View style={styles.balanceRow}>
                  <Text style={styles.subtitle}>Balance: </Text>
                  <BhaiWayCoinIcon size={14} />
                  <Text style={styles.balanceValue}>
                    {walletAvailableCoins != null
                      ? formatBhaiWayCoins(Number(walletAvailableCoins), {
                          minimumFractionDigits: 0,
                        })
                      : walletBalanceDisplay}
                  </Text>
                </View>
              </View>
              <Radio selected={selectedId === wallet.id} />
            </Pressable>
            <View style={styles.rowDivider} />
            <Pressable
              style={styles.addRow}
              onPress={onAddCoins}
              accessibilityRole="button"
              accessibilityLabel={PAYMENT_SCREEN.addCoinsLabel}
              android_ripple={{ color: 'rgba(29, 78, 216, 0.08)' }}
            >
              <View style={styles.addIcon}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </View>
              <Text style={styles.addLabel}>{PAYMENT_SCREEN.addCoinsLabel}</Text>
            </Pressable>
          </View>
        </View>

        {showPayAfterRide && payAfter ? (
          <View style={styles.section}>
            <SectionTitle title={PAYMENT_SCREEN.payAfterTitle} />
            <View style={styles.card}>
              <Pressable
                style={styles.row}
                onPress={() => onSelect(payAfter.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedId === payAfter.id }}
                android_ripple={{ color: 'rgba(29, 78, 216, 0.08)' }}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name="repeat-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.meta}>
                  <Text style={styles.label}>{payAfter.label}</Text>
                  <Text style={styles.subtitle}>{payAfterSubtitle || payAfter.subtitle}</Text>
                </View>
                <Radio selected={selectedId === payAfter.id} />
              </Pressable>
            </View>
          </View>
        ) : null}
      </>
    );
  },
);

PaymentMethodList.displayName = 'PaymentMethodList';

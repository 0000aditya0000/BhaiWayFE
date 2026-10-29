import React, { useCallback } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WITHDRAWAL_DETAILS_SCREEN } from '@/features/profile/constants/withdrawal-details.constants';
import { useWithdrawalDetails } from '@/features/profile/hooks/useWithdrawalDetails';
import { formatCoinString } from '@/features/profile/utils/walletCoin';
import {
  WITHDRAWAL_STATUS_COPY,
  formatWithdrawalDate,
} from '@/features/profile/utils/withdrawals.mapper';
import { Button, IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { styles, tokens } from './WithdrawalDetailsScreen.styles';

export const WithdrawalDetailsScreen = () => {
  const {
    title,
    withdrawal,
    loading,
    error,
    goBack,
    openHistory,
    goWallet,
    retry,
  } = useWithdrawalDetails();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const status = withdrawal ? WITHDRAWAL_STATUS_COPY[withdrawal.status] : null;
  const method = withdrawal?.paymentMethod;
  const requestedDone = Boolean(withdrawal);
  const processingDone =
    withdrawal?.status === 'PROCESSING' ||
    withdrawal?.status === 'COMPLETED' ||
    Boolean(withdrawal?.processingAt);
  const completedDone =
    withdrawal?.status === 'COMPLETED' || Boolean(withdrawal?.completedAt);

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
      ) : error || !withdrawal ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{error ?? 'Withdrawal not found.'}</Text>
          <Button
            label={WITHDRAWAL_DETAILS_SCREEN.retryLabel}
            onPress={retry}
            accessibilityLabel={WITHDRAWAL_DETAILS_SCREEN.retryLabel}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>{title}</Text>
            <Text style={styles.heroAmount}>
              {formatCoinString(withdrawal.amount)} Coins
            </Text>
            {status ? (
              <View style={styles.statusPill}>
                <Ionicons
                  name={
                    withdrawal.status === 'FAILED' || withdrawal.status === 'CANCELLED'
                      ? 'close-circle'
                      : withdrawal.status === 'COMPLETED'
                        ? 'checkmark-circle'
                        : 'time-outline'
                  }
                  size={14}
                  color={
                    withdrawal.status === 'FAILED' || withdrawal.status === 'CANCELLED'
                      ? tokens.ERROR
                      : tokens.SUCCESS
                  }
                />
                <Text style={styles.statusText}>{status.label}</Text>
              </View>
            ) : null}
            {status ? <Text style={styles.statusDesc}>{status.description}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{WITHDRAWAL_DETAILS_SCREEN.paymentHeading}</Text>
            <Text style={styles.rowValue}>
              {method?.type === 'UPI' ? 'UPI' : method?.bankName || 'Bank Account'}
            </Text>
            {method?.type === 'UPI' ? (
              <Text style={styles.rowMeta}>{method.upiId}</Text>
            ) : (
              <>
                {method?.accountHolderName ? (
                  <Text style={styles.rowMeta}>{method.accountHolderName}</Text>
                ) : null}
                <Text style={styles.rowMeta}>
                  {WITHDRAWAL_DETAILS_SCREEN.accountLabel}{' '}
                  {method?.accountNumberMasked || '—'}
                </Text>
                {method?.ifscCode ? (
                  <Text style={styles.rowMeta}>
                    {WITHDRAWAL_DETAILS_SCREEN.ifscLabel} {method.ifscCode}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{WITHDRAWAL_DETAILS_SCREEN.referenceHeading}</Text>
            <Text style={styles.rowValue}>{withdrawal.reference || withdrawal.id}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{WITHDRAWAL_DETAILS_SCREEN.timelineHeading}</Text>
            <TimelineRow
              label={WITHDRAWAL_DETAILS_SCREEN.requestedLabel}
              done={requestedDone}
              value={formatWithdrawalDate(withdrawal.requestedAt ?? withdrawal.createdAt)}
            />
            <TimelineRow
              label={WITHDRAWAL_DETAILS_SCREEN.processingLabel}
              done={processingDone}
              value={
                processingDone
                  ? formatWithdrawalDate(withdrawal.processingAt ?? withdrawal.updatedAt)
                  : WITHDRAWAL_DETAILS_SCREEN.pendingLabel
              }
            />
            <TimelineRow
              label={WITHDRAWAL_DETAILS_SCREEN.completedLabel}
              done={completedDone}
              value={
                completedDone
                  ? formatWithdrawalDate(withdrawal.completedAt)
                  : WITHDRAWAL_DETAILS_SCREEN.pendingLabel
              }
              last
            />
          </View>

          <Button
            label={WITHDRAWAL_DETAILS_SCREEN.historyLabel}
            onPress={openHistory}
            accessibilityLabel={WITHDRAWAL_DETAILS_SCREEN.historyLabel}
          />
          <Button
            label={WITHDRAWAL_DETAILS_SCREEN.walletLabel}
            onPress={goWallet}
            variant="secondary"
            accessibilityLabel={WITHDRAWAL_DETAILS_SCREEN.walletLabel}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const TimelineRow = ({
  label,
  value,
  done,
  last,
}: {
  label: string;
  value: string;
  done: boolean;
  last?: boolean;
}) => (
  <View style={[styles.timelineRow, last && { borderBottomWidth: 0 }]}>
    <Ionicons
      name={done ? 'checkmark-circle' : 'ellipse-outline'}
      size={18}
      color={done ? tokens.SUCCESS : tokens.ON_SURFACE_VARIANT}
    />
    <View style={styles.timelineText}>
      <Text style={styles.timelineLabel}>{label}</Text>
      <Text style={styles.timelineValue}>{value}</Text>
    </View>
  </View>
);

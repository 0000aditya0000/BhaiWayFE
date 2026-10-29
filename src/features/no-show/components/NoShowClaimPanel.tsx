import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';

import type { NoShowClaimDto } from '../api/noShow.types';
import { NO_SHOW_COPY } from '../constants/no-show.constants';
import {
  formatNoShowKindLabel,
  formatNoShowStatusLabel,
  formatRemainingRespondLabel,
  formatRespondByLabel,
} from '../utils/noShow.mapper';
import { isPendingNoShowStatus } from '../utils/noShow.visibility';
import { styles } from './NoShowClaimPanel.styles';

export interface NoShowClaimPanelProps {
  reportLabel: string;
  pendingBody: string;
  canReport: boolean;
  canRespond: boolean;
  isClaimant: boolean;
  submitting: boolean;
  responding: boolean;
  claim: NoShowClaimDto | null;
  remainingMs: number | null;
  compact?: boolean;
  onReport: () => void;
  onApprove: () => void;
  onReject: () => void;
  onOpenSupport: () => void;
}

const cardStyleForStatus = (status: string) => {
  const key = status.trim().toUpperCase();
  if (key === 'PENDING') {
    return styles.cardPending;
  }
  if (key === 'APPROVED') {
    return styles.cardApproved;
  }
  return styles.cardRejected;
};

const pendingMessage = (claim: NoShowClaimDto, fallback: string): string => {
  if (String(claim.kind).toUpperCase() === 'DRIVER_NO_SHOW') {
    return NO_SHOW_COPY.passengerPendingBody;
  }
  if (String(claim.kind).toUpperCase() === 'PASSENGER_NO_SHOW') {
    return NO_SHOW_COPY.driverPendingBody;
  }
  return fallback;
};

const resolvedMessage = (claim: NoShowClaimDto): string => {
  const status = String(claim.status).toUpperCase();
  if (status === 'REJECTED') {
    return claim.support?.message?.trim() || NO_SHOW_COPY.rejectedBody;
  }
  if (status === 'SUPERSEDED') {
    return NO_SHOW_COPY.supersededBody;
  }
  if (String(claim.decisionSource).toUpperCase() === 'TIMEOUT') {
    return NO_SHOW_COPY.timeoutBody;
  }
  return NO_SHOW_COPY.approvedBody;
};

export const NoShowClaimPanel = ({
  reportLabel,
  pendingBody,
  canReport,
  canRespond,
  isClaimant,
  submitting,
  responding,
  claim,
  remainingMs,
  compact = false,
  onReport,
  onApprove,
  onReject,
  onOpenSupport,
}: NoShowClaimPanelProps) => {
  const busy = submitting || responding;
  const respondByLabel = formatRespondByLabel(claim?.respondBy);
  const showCountdown =
    claim &&
    isPendingNoShowStatus(claim.status) &&
    remainingMs != null &&
    respondByLabel;

  if (claim) {
    const status = String(claim.status);
    const pending = isPendingNoShowStatus(status);
    return (
      <View style={[styles.card, cardStyleForStatus(status)]}>
        <View style={styles.statusRow}>
          <Text style={styles.eyebrow}>{NO_SHOW_COPY.detailsTitle}</Text>
          <View
            style={[
              styles.statusPill,
              pending && styles.statusPillPending,
              String(status).toUpperCase() === 'APPROVED' && styles.statusPillApproved,
            ]}
          >
            <Text style={styles.statusText}>{formatNoShowStatusLabel(status)}</Text>
          </View>
        </View>
        <Text style={styles.title}>{formatNoShowKindLabel(String(claim.kind))}</Text>
        <Text style={styles.body}>
          {pending ? pendingMessage(claim, pendingBody) : resolvedMessage(claim)}
        </Text>
        {claim.claimantName ? (
          <Text style={styles.meta}>
            {NO_SHOW_COPY.claimantLabel}: {claim.claimantName}
          </Text>
        ) : null}
        {pending ? <Text style={styles.meta}>{NO_SHOW_COPY.pendingHint}</Text> : null}
        {showCountdown ? (
          <Text style={styles.meta}>
            {NO_SHOW_COPY.respondByPrefix} {respondByLabel}
            {' · '}
            {NO_SHOW_COPY.remainingPrefix} {formatRemainingRespondLabel(remainingMs)}
          </Text>
        ) : respondByLabel && pending ? (
          <Text style={styles.meta}>
            {NO_SHOW_COPY.respondByPrefix} {respondByLabel}
          </Text>
        ) : null}
        {canRespond && pending && !isClaimant ? (
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                busy && styles.actionButtonDisabled,
                pressed && { opacity: 0.9 },
              ]}
              onPress={onApprove}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={NO_SHOW_COPY.approveLabel}
            >
              {responding ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.actionLabel}>{NO_SHOW_COPY.approveLabel}</Text>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionButtonDanger,
                busy && styles.actionButtonDisabled,
                pressed && { opacity: 0.9 },
              ]}
              onPress={onReject}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={NO_SHOW_COPY.rejectLabel}
            >
              <Text style={[styles.actionLabel, styles.actionLabelDanger]}>
                {NO_SHOW_COPY.rejectLabel}
              </Text>
            </Pressable>
          </View>
        ) : null}
        {String(status).toUpperCase() === 'REJECTED' ? (
          <Pressable
            style={({ pressed }) => [styles.supportButton, pressed && { opacity: 0.92 }]}
            onPress={onOpenSupport}
            accessibilityRole="button"
            accessibilityLabel={NO_SHOW_COPY.supportCta}
          >
            <Text style={styles.actionLabel}>{NO_SHOW_COPY.supportCta}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (!canReport) {
    return null;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        compact ? styles.compactReport : styles.reportButton,
        (busy || pressed) && styles.reportButtonMuted,
      ]}
      onPress={onReport}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={reportLabel}
    >
      {submitting ? (
        <ActivityIndicator color={colors.error} />
      ) : (
        <>
          {compact ? null : <Ionicons name="alert-circle-outline" size={18} color={colors.error} />}
          <Text style={styles.reportLabel}>{reportLabel}</Text>
        </>
      )}
    </Pressable>
  );
};

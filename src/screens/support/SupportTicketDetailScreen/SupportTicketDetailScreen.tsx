import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { SUPPORT_COMMENT_MAX, SUPPORT_TICKET_DETAIL_SCREEN } from '@/features/support/constants';
import { useSupportTicketDetail } from '@/features/support/hooks';
import {
  formatSupportCategoryLabel,
  formatSupportDateTime,
  formatSupportRideLabel,
  formatSupportStatusLabel,
  formatSupportSubcategoryLabel,
} from '@/features/support/utils';
import { supportSharedStyles as styles, supportTokens } from '../supportShared.styles';

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

export const SupportTicketDetailScreen = () => {
  const params = useLocalSearchParams<{ ticketId?: string }>();
  const ticketId = getSearchParam(params.ticketId) ?? '';

  const {
    ticket,
    loading,
    refreshing,
    error,
    draft,
    setDraft,
    canComment,
    submittingComment,
    commentError,
    refresh,
    retry,
    submitComment,
    goBack,
  } = useSupportTicketDetail(ticketId);

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
          color={supportTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header">
          {SUPPORT_TICKET_DETAIL_SCREEN.title}
        </Text>
      </View>

      {loading && !ticket ? (
        <View style={styles.center}>
          <ActivityIndicator color={supportTokens.PRIMARY} />
        </View>
      ) : error && !ticket ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={retry} accessibilityRole="button">
            <Text style={styles.chipLabelSelected}>Retry</Text>
          </Pressable>
        </View>
      ) : ticket ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
          }
        >
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: supportTokens.ON_SURFACE }}>
                  {ticket.reference}
                </Text>
                <Text style={styles.body}>
                  {formatSupportCategoryLabel(String(ticket.category))} ·{' '}
                  {formatSupportSubcategoryLabel(ticket.subcategory)}
                </Text>
                <Text style={styles.muted}>Created {formatSupportDateTime(ticket.createdAt)}</Text>
                <Text style={styles.muted}>Updated {formatSupportDateTime(ticket.updatedAt)}</Text>
              </View>
              {(() => {
                const statusStyle = statusBadgeStyle(String(ticket.status));
                return (
                  <View style={[styles.statusBadge, statusStyle.badge]}>
                    <Text style={[styles.statusLabel, statusStyle.label]}>
                      {formatSupportStatusLabel(String(ticket.status))}
                    </Text>
                  </View>
                );
              })()}
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Description</Text>
            <Text style={styles.body}>{ticket.description || '—'}</Text>
          </View>

          {ticket.relatedRide ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {SUPPORT_TICKET_DETAIL_SCREEN.relatedRideHeading}
              </Text>
              <Text style={styles.body}>{formatSupportRideLabel(ticket.relatedRide)}</Text>
              <Text style={styles.muted}>
                Ride {ticket.relatedRide.rideId}
                {ticket.relatedRide.bookingId
                  ? ` · Booking ${ticket.relatedRide.bookingId}`
                  : ''}
              </Text>
            </View>
          ) : ticket.relatedRideId ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {SUPPORT_TICKET_DETAIL_SCREEN.relatedRideHeading}
              </Text>
              <Text style={styles.muted}>{ticket.relatedRideId}</Text>
            </View>
          ) : null}

          {ticket.relatedWalletTransactionId ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {SUPPORT_TICKET_DETAIL_SCREEN.relatedTxnHeading}
              </Text>
              <Text style={styles.muted}>{ticket.relatedWalletTransactionId}</Text>
            </View>
          ) : null}

          {ticket.attachments.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {SUPPORT_TICKET_DETAIL_SCREEN.attachmentsHeading}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {ticket.attachments.map((attachment) => (
                  <Pressable
                    key={attachment.id}
                    onPress={() => {
                      void Linking.openURL(attachment.url).catch(() => undefined);
                    }}
                    accessibilityRole="link"
                    accessibilityLabel="Open attachment"
                  >
                    <Image
                      source={{ uri: attachment.url }}
                      style={{ width: 96, height: 96, borderRadius: 12 }}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {SUPPORT_TICKET_DETAIL_SCREEN.historyHeading}
            </Text>
            {ticket.statusHistory.length === 0 ? (
              <Text style={styles.muted}>{SUPPORT_TICKET_DETAIL_SCREEN.emptyHistory}</Text>
            ) : (
              ticket.statusHistory.map((entry) => (
                <View key={entry.id} style={{ marginBottom: 10, gap: 2 }}>
                  <Text style={styles.body}>
                    {entry.fromStatus
                      ? `${formatSupportStatusLabel(String(entry.fromStatus))} → ${formatSupportStatusLabel(String(entry.toStatus))}`
                      : formatSupportStatusLabel(String(entry.toStatus))}
                  </Text>
                  <Text style={styles.muted}>
                    {formatSupportDateTime(entry.createdAt)}
                    {entry.changedByAdmin ? ' · Support team' : ' · System'}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {SUPPORT_TICKET_DETAIL_SCREEN.commentsHeading}
            </Text>
            {ticket.comments.length === 0 ? (
              <Text style={styles.muted}>{SUPPORT_TICKET_DETAIL_SCREEN.emptyComments}</Text>
            ) : (
              ticket.comments.map((comment) => {
                const isAdmin = String(comment.authorType).toUpperCase() === 'ADMIN';
                return (
                  <View
                    key={comment.id}
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: isAdmin
                        ? 'rgba(55, 75, 177, 0.08)'
                        : supportTokens.SURFACE_CONTAINER,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: supportTokens.PRIMARY }}>
                      {isAdmin ? 'Support team' : 'You'}
                    </Text>
                    <Text style={[styles.body, { marginTop: 4 }]}>{comment.message}</Text>
                    <Text style={[styles.muted, { marginTop: 4 }]}>
                      {formatSupportDateTime(comment.createdAt)}
                    </Text>
                  </View>
                );
              })
            )}

            {canComment ? (
              <View style={{ marginTop: 8, gap: 10 }}>
                <TextInput
                  style={{
                    minHeight: 88,
                    borderWidth: 1,
                    borderColor: '#C4C5D7',
                    borderRadius: 16,
                    padding: 12,
                    textAlignVertical: 'top',
                    fontSize: 15,
                    color: supportTokens.ON_SURFACE,
                    backgroundColor: '#FFFFFF',
                  }}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={SUPPORT_TICKET_DETAIL_SCREEN.commentPlaceholder}
                  placeholderTextColor={supportTokens.OUTLINE}
                  multiline
                  maxLength={SUPPORT_COMMENT_MAX}
                  editable={!submittingComment}
                />
                {commentError ? <Text style={styles.errorText}>{commentError}</Text> : null}
                <Pressable
                  style={[
                    styles.primaryButton,
                    submittingComment && styles.primaryButtonDisabled,
                  ]}
                  disabled={submittingComment}
                  onPress={() => void submitComment()}
                  accessibilityRole="button"
                >
                  {submittingComment ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonLabel}>
                      {SUPPORT_TICKET_DETAIL_SCREEN.sendComment}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.muted, { marginTop: 8 }]}>
                {SUPPORT_TICKET_DETAIL_SCREEN.resolvedCommentNotice}
              </Text>
            )}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
};

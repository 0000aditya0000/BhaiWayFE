import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  IconButton,
  UploadDocumentSheet,
  AppText as Text,
  AppTextInput as TextInput,
} from '@/shared/components';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import type { SupportTicketCategory } from '@/features/support/api';
import {
  CREATE_SUPPORT_TICKET_SCREEN,
  SUPPORT_ATTACHMENT_MAX,
  SUPPORT_DESCRIPTION_MAX,
  SUPPORT_HOME_CATEGORIES,
} from '@/features/support/constants';
import {
  useCreateSupportTicket,
  useEligibleSupportRides,
} from '@/features/support/hooks';
import {
  formatSupportRideLabel,
  formatSupportSubcategoryLabel,
} from '@/features/support/utils';
import { supportSharedStyles as styles, supportTokens } from '../supportShared.styles';

const asCategory = (value: string | undefined): SupportTicketCategory => {
  const key = (value ?? '').trim().toUpperCase();
  if (key === 'PAYMENTS_AND_WALLETS' || key === 'OTHERS' || key === 'BOOKINGS_AND_RIDES') {
    return key;
  }
  return 'BOOKINGS_AND_RIDES';
};

export const CreateSupportTicketScreen = () => {
  const params = useLocalSearchParams<{ category?: string }>();
  const initialCategory = asCategory(getSearchParam(params.category));

  const {
    category,
    setCategory,
    subcategory,
    setSubcategory,
    subcategories,
    description,
    setDescription,
    relatedRideId,
    setRelatedRideId,
    attachments,
    uploadSheetVisible,
    openUploadSheet,
    closeUploadSheet,
    applyUploadedDocument,
    removeAttachment,
    fieldError,
    submitting,
    canSubmit,
    anyUploading,
    submit,
    goBack,
  } = useCreateSupportTicket(initialCategory);

  const rides = useEligibleSupportRides('active');

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const needsRide = category === 'BOOKINGS_AND_RIDES';

  const selectedRideLabel = useMemo(() => {
    if (!relatedRideId) {
      return null;
    }
    const match = rides.items.find((ride) => ride.rideId === relatedRideId);
    return match
      ? formatSupportRideLabel(match)
      : `Selected ride · ${relatedRideId.slice(0, 8)}…`;
  }, [relatedRideId, rides.items]);

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
          {CREATE_SUPPORT_TICKET_SCREEN.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.sectionTitle}>{CREATE_SUPPORT_TICKET_SCREEN.categoryHeading}</Text>
          <View style={styles.chipRow}>
            {SUPPORT_HOME_CATEGORIES.map((item) => {
              const selected = category === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setCategory(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>
            {CREATE_SUPPORT_TICKET_SCREEN.subcategoryHeading}
          </Text>
          <View style={styles.chipRow}>
            {subcategories.map((value) => {
              const selected = subcategory === value;
              return (
                <Pressable
                  key={value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setSubcategory(value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                    {formatSupportSubcategoryLabel(value)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {needsRide ? (
          <View>
            <Text style={styles.sectionTitle}>{CREATE_SUPPORT_TICKET_SCREEN.rideHeading}</Text>
            <View style={[styles.chipRow, { marginBottom: 12 }]}>
              {(['active', 'past'] as const).map((period) => {
                const selected = rides.period === period;
                const label =
                  period === 'active'
                    ? CREATE_SUPPORT_TICKET_SCREEN.activeRides
                    : CREATE_SUPPORT_TICKET_SCREEN.pastRides;
                return (
                  <Pressable
                    key={period}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => rides.setPeriod(period)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {selectedRideLabel ? (
              <Text style={[styles.body, { marginBottom: 8 }]}>Selected: {selectedRideLabel}</Text>
            ) : null}

            {rides.loading && rides.items.length === 0 ? (
              <ActivityIndicator color={supportTokens.PRIMARY} />
            ) : rides.error && rides.items.length === 0 ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.errorText}>{rides.error}</Text>
                <Pressable onPress={rides.retry} accessibilityRole="button">
                  <Text style={styles.chipLabelSelected}>Retry</Text>
                </Pressable>
              </View>
            ) : rides.items.length === 0 ? (
              <Text style={styles.muted}>
                {rides.period === 'active'
                  ? CREATE_SUPPORT_TICKET_SCREEN.emptyActiveRides
                  : CREATE_SUPPORT_TICKET_SCREEN.emptyPastRides}
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                {rides.items.map((ride) => {
                  const selected = relatedRideId === ride.rideId;
                  return (
                    <Pressable
                      key={`${ride.rideId}:${ride.bookingId ?? ''}:${ride.role}`}
                      style={[
                        styles.card,
                        selected && { borderColor: supportTokens.PRIMARY, borderWidth: 2 },
                      ]}
                      onPress={() => setRelatedRideId(ride.rideId)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: supportTokens.ON_SURFACE,
                        }}
                      >
                        {formatSupportRideLabel(ride)}
                      </Text>
                      <Text style={styles.muted}>
                        {ride.role} · {ride.rideStatus}
                        {ride.bookingStatus ? ` · Booking ${ride.bookingStatus}` : ''}
                        {ride.rideType ? ` · ${ride.rideType}` : ''}
                      </Text>
                    </Pressable>
                  );
                })}
                {rides.hasMore ? (
                  <Pressable
                    onPress={rides.loadMore}
                    disabled={rides.loadingMore}
                    accessibilityRole="button"
                  >
                    <Text style={styles.chipLabelSelected}>
                      {rides.loadingMore ? 'Loading…' : 'Load more rides'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        ) : null}

        <View>
          <Text style={styles.sectionTitle}>
            {CREATE_SUPPORT_TICKET_SCREEN.descriptionHeading}
          </Text>
          <TextInput
            style={{
              minHeight: 120,
              borderWidth: 1,
              borderColor: '#C4C5D7',
              borderRadius: 16,
              padding: 14,
              textAlignVertical: 'top',
              fontSize: 15,
              color: supportTokens.ON_SURFACE,
              backgroundColor: '#FFFFFF',
            }}
            value={description}
            onChangeText={setDescription}
            placeholder={CREATE_SUPPORT_TICKET_SCREEN.descriptionPlaceholder}
            placeholderTextColor={supportTokens.OUTLINE}
            multiline
            maxLength={SUPPORT_DESCRIPTION_MAX}
            accessibilityLabel={CREATE_SUPPORT_TICKET_SCREEN.descriptionHeading}
          />
          <Text style={[styles.muted, { marginTop: 6, textAlign: 'right' }]}>
            {description.trim().length}/{SUPPORT_DESCRIPTION_MAX}
          </Text>
        </View>

        <View>
          <Text style={styles.sectionTitle}>
            {CREATE_SUPPORT_TICKET_SCREEN.attachmentsHeading}
          </Text>
          <Text style={[styles.muted, { marginBottom: 10 }]}>
            {CREATE_SUPPORT_TICKET_SCREEN.attachmentsHint}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {attachments.map((item) => (
              <View key={item.id} style={{ width: 88, gap: 6 }}>
                {item.localUri && !item.localUri.startsWith('pending-') ? (
                  <View>
                    <Image
                      source={{ uri: item.secureUrl || item.localUri }}
                      style={{ width: 88, height: 88, borderRadius: 12 }}
                    />
                    {item.uploading ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: 12,
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ActivityIndicator color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 12,
                      backgroundColor: supportTokens.SURFACE_CONTAINER,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ActivityIndicator color={supportTokens.PRIMARY} />
                  </View>
                )}
                {item.error ? <Text style={styles.errorText}>{item.error}</Text> : null}
                <Pressable
                  onPress={() => removeAttachment(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Remove screenshot"
                >
                  <Text style={styles.errorText}>Remove</Text>
                </Pressable>
              </View>
            ))}
            {attachments.length < SUPPORT_ATTACHMENT_MAX ? (
              <Pressable
                style={[
                  styles.chip,
                  {
                    height: 88,
                    width: 88,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  },
                ]}
                onPress={openUploadSheet}
                disabled={anyUploading || submitting}
                accessibilityRole="button"
                accessibilityLabel={CREATE_SUPPORT_TICKET_SCREEN.addScreenshot}
              >
                <Ionicons name="camera-outline" size={22} color={supportTokens.PRIMARY} />
                <Text style={[styles.chipLabelSelected, { fontSize: 11 }]}>Add</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {fieldError ? <Text style={styles.errorText}>{fieldError}</Text> : null}

        <Pressable
          style={[
            styles.primaryButton,
            (!canSubmit || submitting) && styles.primaryButtonDisabled,
          ]}
          disabled={!canSubmit || submitting}
          onPress={() => void submit()}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit || submitting }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonLabel}>
              {CREATE_SUPPORT_TICKET_SCREEN.submitLabel}
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <UploadDocumentSheet
        visible={uploadSheetVisible}
        onClose={closeUploadSheet}
        onPicked={(document) => {
          void applyUploadedDocument(document);
        }}
        title={CREATE_SUPPORT_TICKET_SCREEN.addScreenshot}
        subtitle={CREATE_SUPPORT_TICKET_SCREEN.attachmentsHint}
      />
    </SafeAreaView>
  );
};

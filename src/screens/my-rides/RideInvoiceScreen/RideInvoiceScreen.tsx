import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  Avatar,
  ScreenHeader,
  AppText as Text,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { GstInvoiceCard } from '@/features/invoices';
import { RIDE_INVOICE_SCREEN } from '@/features/my-rides/constants';
import { useRideInvoice } from '@/features/my-rides/hooks';
import { styles } from './RideInvoiceScreen.styles';

export const RideInvoiceScreen = () => {
  const {
    invoice,
    loading,
    error,
    downloadPdf,
    reportIssue,
    openPaymentMethod,
    payOutstandingFare,
    goBack,
    retry,
    gstInvoice,
  } = useRideInvoice();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.headerWrap}>
          <ScreenHeader title={RIDE_INVOICE_SCREEN.title} onBack={handleBack} />
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerStateText}>{RIDE_INVOICE_SCREEN.loadingLabel}</Text>
        </View>
        <AppFooter activeTab="rides" />
      </SafeAreaView>
    );
  }

  if (error || !invoice) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.headerWrap}>
          <ScreenHeader title={RIDE_INVOICE_SCREEN.title} onBack={handleBack} />
        </View>
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color="#747686" />
          <Text style={styles.centerStateTitle}>{RIDE_INVOICE_SCREEN.loadErrorTitle}</Text>
          <Text style={styles.centerStateText}>{error ?? RIDE_INVOICE_SCREEN.loadErrorMessage}</Text>
          <Pressable style={styles.retryBtn} onPress={retry} accessibilityRole="button">
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
        <AppFooter activeTab="rides" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title={RIDE_INVOICE_SCREEN.title}
          onBack={handleBack}
          right={
            <Avatar
              size={32}
              uri={invoice.avatarUri}
              accessibilityLabel="Profile photo"
            />
          }
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.totalCaption}>{RIDE_INVOICE_SCREEN.totalAmountLabel}</Text>
          <Text style={styles.totalAmount}>{invoice.totalAmountLabel}</Text>
          <View style={styles.metaBlock}>
            <View style={styles.bookingIdBlock}>
              <Text style={styles.bookingIdCaption}>
                {RIDE_INVOICE_SCREEN.bookingIdLabel}
              </Text>
              <Text
                style={styles.bookingIdValue}
                selectable
                accessibilityLabel={`${RIDE_INVOICE_SCREEN.bookingIdLabel} ${
                  invoice.bookingId?.trim() || RIDE_INVOICE_SCREEN.unavailableInvoiceId
                }`}
              >
                {invoice.bookingId?.trim()
                  ? invoice.bookingId
                  : RIDE_INVOICE_SCREEN.unavailableInvoiceId}
              </Text>
            </View>
            <Text style={styles.metaText}>
              {RIDE_INVOICE_SCREEN.dateLabel}{' '}
              <Text style={styles.metaStrong}>{invoice.dateLabel}</Text>
            </Text>
          </View>
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>{invoice.statusLabel}</Text>
          </View>
          {invoice.cancelledAtLabel ? (
            <Text style={styles.cancelledAt}>Cancelled {invoice.cancelledAtLabel}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{RIDE_INVOICE_SCREEN.tripDetailsTitle}</Text>
          <View style={styles.tripTrack}>
            <View style={styles.dashLine} />
            <View style={styles.stopBlock}>
              <View style={styles.stopDotOuter} />
              <Text style={styles.stopLabel}>{RIDE_INVOICE_SCREEN.pickupLabel}</Text>
              <Text style={styles.stopValue}>{invoice.pickupLabel}</Text>
              <Text style={styles.stopTime}>{invoice.pickupTimeLabel}</Text>
            </View>
            <View style={styles.stopBlock}>
              <View style={styles.stopDotFilled} />
              <Text style={styles.stopLabel}>{RIDE_INVOICE_SCREEN.dropoffLabel}</Text>
              <Text style={styles.stopValue}>{invoice.dropoffLabel}</Text>
              <Text style={styles.stopTime}>{invoice.dropoffTimeLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.driverHeader}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              {RIDE_INVOICE_SCREEN.driverDetailsTitle}
            </Text>
            {invoice.driver.verified ? (
              <View style={styles.verifiedChip}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.verifiedText}>{RIDE_INVOICE_SCREEN.verifiedLabel}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Avatar
                size={48}
                uri={invoice.driver.avatarUri}
                accessibilityLabel={`${invoice.driver.name} photo`}
              />
            </View>
            <View style={styles.driverMeta}>
              <Text style={styles.driverName}>{invoice.driver.name}</Text>
              <Text style={styles.driverVehicle}>
                {invoice.driver.vehicleLabel} • {invoice.driver.plateNumber}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{RIDE_INVOICE_SCREEN.fareBreakdownTitle}</Text>
          {invoice.fareLines.length > 0 ? (
            invoice.fareLines.map((line) => (
              <View key={line.id} style={styles.fareRow}>
                <Text
                  style={[
                    styles.fareLabel,
                    line.tone === 'discount' && styles.fareDiscount,
                  ]}
                >
                  {line.label}
                </Text>
                <Text
                  style={[
                    styles.fareValue,
                    line.tone === 'discount' && styles.fareDiscount,
                  ]}
                >
                  {line.amountLabel}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyFare}>{RIDE_INVOICE_SCREEN.noFareBreakdown}</Text>
          )}
          <View style={styles.fareTotalRow}>
            <Text style={styles.fareTotalLabel}>{RIDE_INVOICE_SCREEN.totalPaidLabel}</Text>
            <Text style={styles.fareTotalValue}>{invoice.paidAmountLabel}</Text>
          </View>
        </View>

        {invoice.payLaterSettlement?.eligible ? (
          <View style={styles.card}>
            <View style={styles.unpaidHeader}>
              <Text style={styles.sectionTitle}>{RIDE_INVOICE_SCREEN.paymentPendingLabel}</Text>
              <View style={styles.unpaidChip}>
                <Text style={styles.unpaidChipText}>{RIDE_INVOICE_SCREEN.unpaidStatusLabel}</Text>
              </View>
            </View>
            <View style={styles.unpaidAmountRow}>
              <Text style={styles.unpaidAmountLabel}>{RIDE_INVOICE_SCREEN.amountDueLabel}</Text>
              <Text style={styles.unpaidAmountValue}>
                {invoice.payLaterSettlement.outstandingFareLabel}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.payNowButton, pressed && { opacity: 0.92 }]}
              onPress={payOutstandingFare}
              accessibilityRole="button"
              accessibilityLabel={RIDE_INVOICE_SCREEN.payNowLabel}
            >
              <Text style={styles.payNowLabel}>{RIDE_INVOICE_SCREEN.payNowLabel}</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.card, styles.paymentRow, pressed && { opacity: 0.92 }]}
          onPress={openPaymentMethod}
          accessibilityRole="button"
          accessibilityLabel={RIDE_INVOICE_SCREEN.paymentMethodTitle}
        >
          <View style={styles.paymentLeft}>
            <View style={styles.paymentIconWrap}>
              <Ionicons name="wallet" size={20} color={colors.primary} />
            </View>
            <View style={styles.paymentMeta}>
              <Text style={styles.paymentCaption}>{RIDE_INVOICE_SCREEN.paymentMethodTitle}</Text>
              <Text style={styles.paymentValue}>{invoice.paymentMethodLabel}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#585E72" />
        </Pressable>

        {gstInvoice.visible ? <GstInvoiceCard gst={gstInvoice} /> : null}

        <View style={styles.actionsRow}>
          {gstInvoice.visible && gstInvoice.state.kind === 'ready' ? null : (
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.9 }]}
              onPress={downloadPdf}
              accessibilityRole="button"
              accessibilityLabel={RIDE_INVOICE_SCREEN.downloadPdfLabel}
            >
              <Ionicons name="download-outline" size={20} color="#191C1D" />
              <Text style={styles.actionLabel}>{RIDE_INVOICE_SCREEN.downloadPdfLabel}</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.9 }]}
            onPress={reportIssue}
            accessibilityRole="button"
            accessibilityLabel={RIDE_INVOICE_SCREEN.reportIssueLabel}
          >
            <Ionicons name="flag-outline" size={20} color="#BA1A1A" />
            <Text style={[styles.actionLabel, styles.reportLabel]}>
              {RIDE_INVOICE_SCREEN.reportIssueLabel}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

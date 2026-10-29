import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { GST_INVOICE_COPY } from '../constants';
import type { UseGstInvoiceForBookingResult } from '../hooks/useGstInvoiceForBooking';
import {
  formatGstInvoiceAmount,
  formatGstInvoiceDate,
  formatGstInvoiceRoute,
  formatGstRideTypeLabel,
  shouldShowGstEmailSent,
} from '../utils/gstInvoiceDisplay';
import { styles } from './GstInvoiceCard.styles';

export interface GstInvoiceCardProps {
  gst: UseGstInvoiceForBookingResult;
}

export const GstInvoiceCard = ({ gst }: GstInvoiceCardProps) => {
  const { state, downloading, downloadInvoice, retry } = gst;
  if (state.kind === 'hidden') {
    return null;
  }

  const invoice = state.invoice;

  return (
    <View style={styles.card} accessibilityLabel={GST_INVOICE_COPY.title}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
        </View>
        <Text style={styles.title}>{GST_INVOICE_COPY.title}</Text>
      </View>

      {state.kind === 'loading' ? (
        <View style={styles.centerRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.body}>{GST_INVOICE_COPY.generatingBody}</Text>
        </View>
      ) : null}

      {state.kind === 'pending' || state.kind === 'pdf-pending' ? (
        <>
          <Text style={styles.statusTitle}>{GST_INVOICE_COPY.generatingTitle}</Text>
          <Text style={styles.body}>{state.message ?? GST_INVOICE_COPY.generatingBody}</Text>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={retry}
            accessibilityRole="button"
            accessibilityLabel={GST_INVOICE_COPY.retryLabel}
          >
            <Text style={styles.secondaryLabel}>{GST_INVOICE_COPY.retryLabel}</Text>
          </Pressable>
        </>
      ) : null}

      {state.kind === 'unavailable' || state.kind === 'error' ? (
        <>
          <Text style={styles.statusTitle}>{GST_INVOICE_COPY.unavailableTitle}</Text>
          <Text style={styles.body}>{state.message ?? GST_INVOICE_COPY.unavailableBody}</Text>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={retry}
            accessibilityRole="button"
            accessibilityLabel={GST_INVOICE_COPY.retryLabel}
          >
            <Text style={styles.secondaryLabel}>{GST_INVOICE_COPY.retryLabel}</Text>
          </Pressable>
        </>
      ) : null}

      {state.kind === 'ready' && invoice ? (
        <>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{GST_INVOICE_COPY.invoiceNumberLabel}</Text>
            <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{GST_INVOICE_COPY.invoiceDateLabel}</Text>
            <Text style={styles.metaValue}>{formatGstInvoiceDate(invoice.issuedAt)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{GST_INVOICE_COPY.bookingRefLabel}</Text>
            <Text style={styles.metaValue}>{invoice.bookingId}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{GST_INVOICE_COPY.rideTypeLabel}</Text>
            <Text style={styles.metaValue}>{formatGstRideTypeLabel(invoice.rideType)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{GST_INVOICE_COPY.routeLabel}</Text>
            <Text style={styles.metaValue}>
              {formatGstInvoiceRoute(invoice.source, invoice.destination)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{GST_INVOICE_COPY.amountLabel}</Text>
            <Text style={styles.amountValue}>
              {formatGstInvoiceAmount(invoice.currency, invoice.invoiceTotal)}
            </Text>
          </View>
          {shouldShowGstEmailSent(invoice.emailStatus) ? (
            <Text style={styles.emailNote}>{GST_INVOICE_COPY.emailedLabel}</Text>
          ) : null}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || downloading) && styles.pressed,
            ]}
            onPress={downloadInvoice}
            disabled={downloading}
            accessibilityRole="button"
            accessibilityLabel={GST_INVOICE_COPY.downloadLabel}
            accessibilityState={{ busy: downloading, disabled: downloading }}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="download-outline" size={18} color={colors.white} />
            )}
            <Text style={styles.primaryLabel}>
              {downloading ? GST_INVOICE_COPY.downloadingLabel : GST_INVOICE_COPY.downloadLabel}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
};

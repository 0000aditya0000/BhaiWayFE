import { GST_INVOICE_COPY } from '../constants';
import type { RiderInvoiceListItemDto } from '../api/invoices.types';

const normalize = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toUpperCase();

/** Backend `invoiceRideTypeLabel` — display only, no tax math. */
export const formatGstRideTypeLabel = (rideType: string | null | undefined): string => {
  const normalized = normalize(rideType);
  if (normalized === 'COMMUTE') {
    return GST_INVOICE_COPY.rideTypeCommute;
  }
  if (normalized === 'REGULAR') {
    return GST_INVOICE_COPY.rideTypeOutstation;
  }
  return rideType?.trim() || '';
};

/** Concatenate backend `currency` + `invoiceTotal`. Do not convert or recompute. */
export const formatGstInvoiceAmount = (
  currency: string | null | undefined,
  invoiceTotal: string | null | undefined,
): string => {
  const amount = invoiceTotal?.trim() ?? '';
  const code = currency?.trim() ?? '';
  if (!amount) {
    return '';
  }
  return code ? `${code} ${amount}` : amount;
};

export const formatGstInvoiceDate = (issuedAt: string | null | undefined): string => {
  const raw = issuedAt?.trim() ?? '';
  if (!raw) {
    return '';
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatGstInvoiceRoute = (
  source: string | null | undefined,
  destination: string | null | undefined,
): string => {
  const from = source?.trim() ?? '';
  const to = destination?.trim() ?? '';
  if (from && to) {
    return `${from} → ${to}`;
  }
  return from || to;
};

export const shouldShowGstEmailSent = (
  emailStatus: RiderInvoiceListItemDto['emailStatus'] | null | undefined,
): boolean => normalize(emailStatus) === 'SENT';

export const gstInvoicePdfFileName = (invoiceNumber: string): string => {
  const safe = invoiceNumber.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'invoice';
  return `BhaiWay-Invoice-${safe}.pdf`;
};

export const parseContentDispositionFilename = (
  header: string | null | undefined,
): string | null => {
  const value = header?.trim() ?? '';
  if (!value) {
    return null;
  }
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(value);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim().replace(/^"|"$/g, ''));
    } catch {
      return utfMatch[1].trim();
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(value);
  if (quoted?.[1]) {
    return quoted[1].trim();
  }
  const plain = /filename=([^;]+)/i.exec(value);
  return plain?.[1]?.trim().replace(/^"|"$/g, '') || null;
};

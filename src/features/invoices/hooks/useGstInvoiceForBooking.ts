import { useCallback, useEffect, useMemo, useState } from 'react';

import { showAppAlert, triggerLightHaptic } from '@/shared/utils';

import type { RiderInvoiceListItemDto } from '../api/invoices.types';
import { findRiderInvoiceByBookingId } from '../api/invoices.api';
import { GST_INVOICE_COPY } from '../constants';
import { downloadAndShareGstInvoicePdf, GstInvoiceDownloadError } from '../utils/downloadGstInvoicePdf';
import { mapGstInvoiceError } from '../utils/gstInvoiceErrors';
import {
  isGstInvoiceActionVisible,
  type GstInvoiceEligibilityInput,
} from '../utils/gstInvoiceEligibility';
import { gstInvoiceDownloadGate } from '../utils/gstInvoicePdf';

export type GstInvoiceUiKind =
  | 'hidden'
  | 'loading'
  | 'pending'
  | 'ready'
  | 'pdf-pending'
  | 'unavailable'
  | 'error';

export interface GstInvoiceUiState {
  kind: GstInvoiceUiKind;
  invoice: RiderInvoiceListItemDto | null;
  message: string | null;
}

export interface UseGstInvoiceForBookingResult {
  visible: boolean;
  state: GstInvoiceUiState;
  downloading: boolean;
  downloadInvoice: () => void;
  retry: () => void;
}

const hiddenState = (): GstInvoiceUiState => ({
  kind: 'hidden',
  invoice: null,
  message: null,
});

export const useGstInvoiceForBooking = (
  input: GstInvoiceEligibilityInput & { bookingId: string },
): UseGstInvoiceForBookingResult => {
  const visible = isGstInvoiceActionVisible(input);
  const bookingId = input.bookingId.trim();
  const [reloadToken, setReloadToken] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [state, setState] = useState<GstInvoiceUiState>(hiddenState);

  useEffect(() => {
    if (!visible || !bookingId) {
      setState(hiddenState());
      return;
    }

    let cancelled = false;
    setState({ kind: 'loading', invoice: null, message: null });

    void (async () => {
      try {
        const invoice = await findRiderInvoiceByBookingId(bookingId);
        if (cancelled) {
          return;
        }
        if (!invoice) {
          setState({
            kind: 'pending',
            invoice: null,
            message: GST_INVOICE_COPY.generatingBody,
          });
          return;
        }
        if (!invoice.pdfAvailable) {
          setState({
            kind: 'pdf-pending',
            invoice,
            message: GST_INVOICE_COPY.pdfNotReadyBody,
          });
          return;
        }
        setState({ kind: 'ready', invoice, message: null });
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: 'error',
            invoice: null,
            message: mapGstInvoiceError(error),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId, reloadToken, visible]);

  const retry = useCallback(() => {
    if (!visible) {
      return;
    }
    setReloadToken((value) => value + 1);
  }, [visible]);

  const downloadInvoice = useCallback(() => {
    const invoice = state.invoice;
    if (!visible || !invoice || downloading || gstInvoiceDownloadGate.isBusy(invoice.id)) {
      return;
    }
    triggerLightHaptic();
    setDownloading(true);
    void (async () => {
      try {
        await downloadAndShareGstInvoicePdf({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        });
      } catch (error) {
        if (error instanceof GstInvoiceDownloadError && error.code === 'busy') {
          return;
        }
        if (error instanceof GstInvoiceDownloadError && error.code === 'not-ready') {
          setState({
            kind: 'pdf-pending',
            invoice,
            message: error.message,
          });
          showAppAlert(GST_INVOICE_COPY.generatingTitle, error.message);
          return;
        }
        const message =
          error instanceof GstInvoiceDownloadError
            ? error.message
            : mapGstInvoiceError(error);
        showAppAlert(GST_INVOICE_COPY.title, message);
      } finally {
        setDownloading(false);
      }
    })();
  }, [downloading, state.invoice, visible]);

  return useMemo(
    () => ({
      visible,
      state,
      downloading,
      downloadInvoice,
      retry,
    }),
    [downloadInvoice, downloading, retry, state, visible],
  );
};

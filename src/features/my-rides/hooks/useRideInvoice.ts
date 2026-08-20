import { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getSearchParam, showAppAlert, triggerLightHaptic } from '@/shared/utils';
import { RIDE_INVOICE_SCREEN, getRideInvoiceMock, getReportIssuePath } from '../constants';
import type { RideInvoiceSummary } from '../types';
import { buildRiderTripInvoiceText, shareInvoiceDocument } from '../utils';

export interface UseRideInvoiceResult {
  invoice: RideInvoiceSummary;
  downloadPdf: () => void;
  reportIssue: () => void;
  openPaymentMethod: () => void;
  goBack: () => void;
}

export const useRideInvoice = (): UseRideInvoiceResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rideId?: string;
    pickupLabel?: string;
    dropoffLabel?: string;
    dateLabel?: string;
  }>();
  const [sharing, setSharing] = useState(false);

  const invoice = useMemo(
    () =>
      getRideInvoiceMock({
        rideId: getSearchParam(params.rideId) || undefined,
        pickupLabel: getSearchParam(params.pickupLabel) || undefined,
        dropoffLabel: getSearchParam(params.dropoffLabel) || undefined,
        dateLabel: getSearchParam(params.dateLabel) || undefined,
      }),
    [params.dateLabel, params.dropoffLabel, params.pickupLabel, params.rideId],
  );

  const downloadPdf = useCallback(() => {
    if (sharing) {
      return;
    }
    triggerLightHaptic();
    setSharing(true);
    void (async () => {
      try {
        const body = buildRiderTripInvoiceText(invoice);
        await shareInvoiceDocument({
          fileBaseName: `bhaiway-invoice-${invoice.invoiceId || invoice.id}`,
          body,
          dialogTitle: RIDE_INVOICE_SCREEN.downloadTitle,
        });
      } catch {
        showAppAlert(
          RIDE_INVOICE_SCREEN.downloadTitle,
          'Unable to share the invoice right now. Please try again.',
        );
      } finally {
        setSharing(false);
      }
    })();
  }, [invoice, sharing]);

  const reportIssue = useCallback(() => {
    triggerLightHaptic();
    router.push(
      getReportIssuePath({
        rideId: invoice.id,
        pickupLabel: invoice.pickupLabel,
        dropoffLabel: invoice.dropoffLabel,
        dateLabel: invoice.dateLabel,
      }),
    );
  }, [invoice.dateLabel, invoice.dropoffLabel, invoice.id, invoice.pickupLabel, router]);

  const openPaymentMethod = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.wallet);
  }, [router]);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  return {
    invoice,
    downloadPdf,
    reportIssue,
    openPaymentMethod,
    goBack,
  };
};

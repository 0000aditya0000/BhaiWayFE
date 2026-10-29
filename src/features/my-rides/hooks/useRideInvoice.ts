import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { findRiderInvoiceByBookingId } from '@/features/invoices/api/invoices.api';
import { GST_INVOICE_COPY } from '@/features/invoices/constants';
import { downloadAndShareGstInvoicePdf } from '@/features/invoices/utils/downloadGstInvoicePdf';
import { getBookingById, getBookingHistoryById } from '@/features/ride-search/api';
import type { BookingHistoryItemDto, BookingResponseDto } from '@/features/ride-search/api';
import { getTripCompletedPath } from '@/features/ride-search/constants';
import {
  bookingDtoToPayLaterSnapshot,
  buildPayLaterSettlementView,
} from '@/features/ride-search/utils/payLaterSettlement.utils';
import { useGstInvoiceForBooking } from '@/features/invoices';
import type { UseGstInvoiceForBookingResult } from '@/features/invoices';
import { useSessionUser } from '@/shared/hooks';
import { getErrorMessage, getSearchParam, showAppAlert, triggerLightHaptic } from '@/shared/utils';
import {
  DEFAULT_PROFILE_AVATAR,
  RIDE_INVOICE_SCREEN,
  getReportIssuePath,
} from '../constants';
import type { RideInvoiceSummary } from '../types';
import { mapBookingHistoryDetail } from '../utils';

export interface UseRideInvoiceResult {
  invoice: RideInvoiceSummary | null;
  loading: boolean;
  error: string | null;
  downloadPdf: () => void;
  reportIssue: () => void;
  openPaymentMethod: () => void;
  payOutstandingFare: () => void;
  goBack: () => void;
  retry: () => void;
  gstInvoice: UseGstInvoiceForBookingResult;
}

const attachPayLaterSettlement = (
  invoice: RideInvoiceSummary,
  booking: BookingResponseDto,
): RideInvoiceSummary => {
  const settlement = buildPayLaterSettlementView(bookingDtoToPayLaterSnapshot(booking));
  if (!settlement.eligible) {
    return invoice;
  }
  return {
    ...invoice,
    payLaterSettlement: {
      eligible: true,
      outstandingFareLabel: settlement.fareLabel,
      rideType: settlement.rideType,
      rideId: booking.rideId,
      bookingId: booking.id,
      pickupLabel: invoice.pickupLabel,
      dropoffLabel: invoice.dropoffLabel,
      driverName: invoice.driver.name,
      carModel: invoice.driver.vehicleLabel,
      price: Number(settlement.fareCoins),
    },
  };
};

export const useRideInvoice = (): UseRideInvoiceResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    rideId?: string;
    id?: string;
  }>();
  const user = useSessionUser();

  const bookingId =
    getSearchParam(params.bookingId)?.trim() ||
    getSearchParam(params.rideId)?.trim() ||
    getSearchParam(params.id)?.trim() ||
    '';

  const [invoice, setInvoice] = useState<RideInvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [gstLookup, setGstLookup] = useState<{
    status: string;
    rideType: string | null;
    bookingMode: string | null;
    passengerUserId: string | null;
  } | null>(null);

  const avatarUri = user?.avatarUri ?? DEFAULT_PROFILE_AVATAR;

  useEffect(() => {
    if (!bookingId) {
      console.log('[Ride Invoice] missing bookingId in route params', params);
      setInvoice(null);
      setGstLookup(null);
      setLoading(false);
      setError('Booking not found. Open this invoice again from Past Rides.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        let dto: BookingHistoryItemDto;
        try {
          dto = await getBookingHistoryById(bookingId);
        } catch (historyError) {
          console.log(
            '[Ride Invoice] GET /bookings/history/:id failed — falling back to /bookings/:id',
            getErrorMessage(historyError),
          );
          const booking = await getBookingById(bookingId);
          dto = {
            id: booking.id,
            rideId: booking.rideId,
            status: booking.status,
            bookingMode: booking.bookingMode,
            seats: booking.seats,
            paymentMethod: booking.paymentMethod,
            paymentStatus: booking.paymentStatus,
            totalAmount: booking.totalAmount,
            pricePerSeatSnapshot: booking.pricePerSeatSnapshot,
            securityDepositAmount: booking.securityDepositAmount,
            pickupVerifiedAt: booking.pickupVerifiedAt,
            source: booking.ride?.source,
            destination: booking.ride?.destination,
            departureDate: booking.ride?.departureDate,
            departureTime: booking.ride?.departureTime,
            ride: booking.ride,
            driver: booking.driver,
            vehicle: booking.vehicle,
            passenger: booking.passenger,
          };
        }
        if (cancelled) {
          return;
        }
        let nextInvoice = mapBookingHistoryDetail(dto, avatarUri, bookingId);
        let liveBooking: BookingResponseDto | null = null;
        try {
          liveBooking = await getBookingById(bookingId);
          if (!cancelled) {
            nextInvoice = attachPayLaterSettlement(nextInvoice, liveBooking);
            const liveBookingId = liveBooking.id?.trim();
            if (liveBookingId && !nextInvoice.bookingId.trim()) {
              nextInvoice = {
                ...nextInvoice,
                id: liveBookingId,
                bookingId: liveBookingId,
              };
            }
          }
        } catch (bookingError) {
          console.log(
            '[Ride Invoice] GET /bookings/:id settlement check failed',
            getErrorMessage(bookingError),
          );
        }
        if (!cancelled) {
          setGstLookup({
            status: String(liveBooking?.status ?? dto.status ?? ''),
            rideType: liveBooking?.ride?.rideType ?? dto.ride?.rideType ?? null,
            bookingMode: liveBooking?.bookingMode ?? dto.bookingMode ?? null,
            passengerUserId:
              liveBooking?.passengerId?.trim() || dto.passenger?.id?.trim() || null,
          });
          setInvoice(nextInvoice);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.log('[Ride Invoice] load failed', getErrorMessage(err));
          setInvoice(null);
          setGstLookup(null);
          setError(RIDE_INVOICE_SCREEN.loadErrorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [avatarUri, bookingId, reloadToken]);

  const downloadPdf = useCallback(() => {
    if (sharing || !invoice) {
      return;
    }
    triggerLightHaptic();
    setSharing(true);
    void (async () => {
      try {
        const gst = invoice.bookingId.trim()
          ? await findRiderInvoiceByBookingId(invoice.bookingId)
          : null;
        if (gst?.pdfAvailable) {
          await downloadAndShareGstInvoicePdf({
            invoiceId: gst.id,
            invoiceNumber: gst.invoiceNumber,
          });
          return;
        }
        if (gst && !gst.pdfAvailable) {
          showAppAlert(GST_INVOICE_COPY.generatingTitle, GST_INVOICE_COPY.pdfNotReadyBody);
          return;
        }
        showAppAlert(
          RIDE_INVOICE_SCREEN.downloadTitle,
          GST_INVOICE_COPY.unavailableBody,
        );
      } catch {
        showAppAlert(
          RIDE_INVOICE_SCREEN.downloadTitle,
          GST_INVOICE_COPY.downloadFailed,
        );
      } finally {
        setSharing(false);
      }
    })();
  }, [invoice, sharing]);

  const reportIssue = useCallback(() => {
    if (!invoice) {
      return;
    }
    triggerLightHaptic();
    router.push(
      getReportIssuePath({
        rideId: invoice.bookingId,
        pickupLabel: invoice.pickupLabel,
        dropoffLabel: invoice.dropoffLabel,
        dateLabel: invoice.dateLabel,
      }),
    );
  }, [invoice, router]);

  const openPaymentMethod = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.wallet);
  }, [router]);

  const payOutstandingFare = useCallback(() => {
    const settlement = invoice?.payLaterSettlement;
    if (!settlement?.eligible) {
      return;
    }
    triggerLightHaptic();
    router.push(
      getTripCompletedPath({
        rideId: settlement.rideId,
        rideType: settlement.rideType,
        bookingId: settlement.bookingId,
        origin: settlement.pickupLabel,
        destination: settlement.dropoffLabel,
        driverName: settlement.driverName,
        carModel: settlement.carModel,
        price: settlement.price,
      }),
    );
  }, [invoice?.payLaterSettlement, router]);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  const retry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  const gstInvoice = useGstInvoiceForBooking({
    bookingId,
    viewerRole: 'rider',
    bookingStatus: gstLookup?.status,
    rideType: gstLookup?.rideType,
    bookingMode: gstLookup?.bookingMode,
    passengerUserId: gstLookup?.passengerUserId,
    sessionUserId: user?.id ?? null,
  });

  return useMemo(
    () => ({
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
    }),
    [
      downloadPdf,
      error,
      goBack,
      gstInvoice,
      invoice,
      loading,
      openPaymentMethod,
      payOutstandingFare,
      reportIssue,
      retry,
    ],
  );
};

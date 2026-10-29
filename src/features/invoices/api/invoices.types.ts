/** Rider DTO fields from NestJS `InvoicesService.toRiderDto`. */

export type ApiInvoiceRideType = 'REGULAR' | 'ASSURED' | 'COMMUTE' | string;

export type ApiInvoicePaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | string;

export type ApiInvoiceEmailStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED' | string;

/** GET /invoices list item (detailed tax fields are omitted). */
export interface RiderInvoiceListItemDto {
  id: string;
  invoiceNumber: string;
  rideId: string;
  bookingId: string;
  rideType: ApiInvoiceRideType;
  source: string;
  destination: string;
  issuedAt: string;
  invoiceTotal: string;
  currency: string;
  paymentStatus: ApiInvoicePaymentStatus;
  emailStatus: ApiInvoiceEmailStatus;
  pdfAvailable: boolean;
}

/** GET /invoices/:id — list fields plus tax/issuer snapshot from the backend. */
export interface RiderInvoiceDetailDto extends RiderInvoiceListItemDto {
  riderName: string | null;
  driverName: string | null;
  vehicleRegistrationNumber: string | null;
  departureAt: string | null;
  completedAt: string | null;
  taxableValue: string;
  gstRateBasisPoints: number;
  cgst: string;
  sgst: string;
  igst: string;
  issuerLegalName: string;
  issuerGstin: string;
  sacCode: string;
  placeOfSupplyStateCode: string;
}

export interface RiderInvoiceListPageDto {
  items: RiderInvoiceListItemDto[];
  page: number;
  limit: number;
  total: number;
}

export interface ListRiderInvoicesQuery {
  page?: number;
  limit?: number;
}

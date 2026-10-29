import { httpClient } from '@/network';

import {
  findInvoiceForBooking,
  formatInvoiceByIdPath,
  formatInvoicePdfPath,
  formatListInvoicesPath,
  parseRiderInvoiceDetail,
  parseRiderInvoiceListPage,
} from './invoices.unwrap';
import type {
  ListRiderInvoicesQuery,
  RiderInvoiceDetailDto,
  RiderInvoiceListItemDto,
  RiderInvoiceListPageDto,
} from './invoices.types';

const MAX_LIST_PAGES = 10;

export { formatInvoiceByIdPath, formatInvoicePdfPath, formatListInvoicesPath };

/** GET /invoices */
export const listRiderInvoices = async (
  query: ListRiderInvoicesQuery = {},
): Promise<RiderInvoiceListPageDto> => {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const limit = Math.max(1, Math.min(100, Math.floor(query.limit ?? 20)));
  const payload = await httpClient.get<unknown>(formatListInvoicesPath({ page, limit }));
  return parseRiderInvoiceListPage(payload, { page, limit });
};

/** GET /invoices/:id */
export const getRiderInvoiceById = async (
  invoiceId: string,
): Promise<RiderInvoiceDetailDto> => {
  const id = invoiceId.trim();
  const payload = await httpClient.get<unknown>(formatInvoiceByIdPath(id));
  const parsed = parseRiderInvoiceDetail(payload);
  if (!parsed) {
    throw {
      status: 0,
      code: 'INVOICE_SHAPE_INVALID',
      message: 'Invoice details are unavailable right now.',
    };
  }
  return parsed;
};

/** GET /invoices/:id/pdf — authenticated PDF bytes. */
export const downloadRiderInvoicePdf = async (invoiceId: string) => {
  const id = invoiceId.trim();
  return httpClient.getBinary(formatInvoicePdfPath(id));
};

/**
 * Locate the issued invoice for one booking.
 * GET /invoices has no bookingId filter — pages are scanned until a match or the last page.
 */
export const findRiderInvoiceByBookingId = async (
  bookingId: string,
): Promise<RiderInvoiceListItemDto | null> => {
  const id = bookingId.trim();
  if (!id) {
    return null;
  }
  const limit = 100;
  for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
    const result = await listRiderInvoices({ page, limit });
    const match = findInvoiceForBooking(result.items, id);
    if (match) {
      return match;
    }
    const fetched = (page - 1) * result.limit + result.items.length;
    if (result.items.length === 0 || fetched >= result.total) {
      return null;
    }
  }
  return null;
};

export type {
  ListRiderInvoicesQuery,
  RiderInvoiceDetailDto,
  RiderInvoiceListItemDto,
  RiderInvoiceListPageDto,
} from './invoices.types';

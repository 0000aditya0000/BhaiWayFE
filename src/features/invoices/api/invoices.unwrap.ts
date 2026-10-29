import type {
  RiderInvoiceDetailDto,
  RiderInvoiceListItemDto,
  RiderInvoiceListPageDto,
} from './invoices.types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return null;
};

const asNullableString = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }
  return asString(value);
};

const asBoolean = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') {
    return value;
  }
  return null;
};

const asFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
};

const unwrapData = (payload: unknown): unknown => {
  if (!isRecord(payload)) {
    return payload;
  }
  if ('data' in payload && payload.data != null && typeof payload.data === 'object') {
    return payload.data;
  }
  return payload;
};

export const parseRiderInvoiceListItem = (
  value: unknown,
): RiderInvoiceListItemDto | null => {
  const record = isRecord(value) ? value : null;
  if (!record) {
    return null;
  }
  const id = asString(record.id);
  const invoiceNumber = asString(record.invoiceNumber);
  const rideId = asString(record.rideId);
  const bookingId = asString(record.bookingId);
  const rideType = asString(record.rideType);
  const source = asString(record.source);
  const destination = asString(record.destination);
  const issuedAt = asString(record.issuedAt);
  const invoiceTotal = asString(record.invoiceTotal);
  const currency = asString(record.currency);
  const paymentStatus = asString(record.paymentStatus);
  const emailStatus = asString(record.emailStatus);
  const pdfAvailable = asBoolean(record.pdfAvailable);
  if (
    !id ||
    !invoiceNumber ||
    !rideId ||
    !bookingId ||
    !rideType ||
    !source ||
    !destination ||
    !issuedAt ||
    !invoiceTotal ||
    !currency ||
    !paymentStatus ||
    !emailStatus ||
    pdfAvailable == null
  ) {
    return null;
  }
  return {
    id,
    invoiceNumber,
    rideId,
    bookingId,
    rideType,
    source,
    destination,
    issuedAt,
    invoiceTotal,
    currency,
    paymentStatus,
    emailStatus,
    pdfAvailable,
  };
};

export const parseRiderInvoiceDetail = (
  value: unknown,
): RiderInvoiceDetailDto | null => {
  const root = unwrapData(value);
  const base = parseRiderInvoiceListItem(root);
  const record = isRecord(root) ? root : null;
  if (!base || !record) {
    return null;
  }
  const taxableValue = asString(record.taxableValue);
  const gstRateBasisPoints = asFiniteNumber(record.gstRateBasisPoints);
  const cgst = asString(record.cgst);
  const sgst = asString(record.sgst);
  const igst = asString(record.igst);
  const issuerLegalName = asString(record.issuerLegalName);
  const issuerGstin = asString(record.issuerGstin);
  const sacCode = asString(record.sacCode);
  const placeOfSupplyStateCode = asString(record.placeOfSupplyStateCode);
  if (
    !taxableValue ||
    gstRateBasisPoints == null ||
    !cgst ||
    !sgst ||
    !igst ||
    !issuerLegalName ||
    !issuerGstin ||
    !sacCode ||
    !placeOfSupplyStateCode
  ) {
    return null;
  }
  return {
    ...base,
    riderName: asNullableString(record.riderName),
    driverName: asNullableString(record.driverName),
    vehicleRegistrationNumber: asNullableString(record.vehicleRegistrationNumber),
    departureAt: asNullableString(record.departureAt),
    completedAt: asNullableString(record.completedAt),
    taxableValue,
    gstRateBasisPoints,
    cgst,
    sgst,
    igst,
    issuerLegalName,
    issuerGstin,
    sacCode,
    placeOfSupplyStateCode,
  };
};

export const parseRiderInvoiceListPage = (
  payload: unknown,
  fallback: { page: number; limit: number },
): RiderInvoiceListPageDto => {
  const root = unwrapData(payload);
  const record = isRecord(root) ? root : null;
  const rawItems = record
    ? Array.isArray(record.items)
      ? record.items
      : Array.isArray(record.invoices)
        ? record.invoices
        : []
    : Array.isArray(root)
      ? root
      : [];
  const items = rawItems
    .map(parseRiderInvoiceListItem)
    .filter((item): item is RiderInvoiceListItemDto => item != null);
  const page = asFiniteNumber(record?.page) ?? fallback.page;
  const limit = asFiniteNumber(record?.limit) ?? fallback.limit;
  const total = asFiniteNumber(record?.total) ?? items.length;
  return { items, page, limit, total };
};

export const formatListInvoicesPath = (
  query: { page?: number; limit?: number } = {},
): string => {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const limit = Math.max(1, Math.min(100, Math.floor(query.limit ?? 20)));
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  return `/invoices?${params.toString()}`;
};

export const formatInvoiceByIdPath = (invoiceId: string): string =>
  `/invoices/${encodeURIComponent(invoiceId.trim())}`;

export const formatInvoicePdfPath = (invoiceId: string): string =>
  `/invoices/${encodeURIComponent(invoiceId.trim())}/pdf`;

export const findInvoiceForBooking = (
  items: readonly RiderInvoiceListItemDto[],
  bookingId: string,
): RiderInvoiceListItemDto | null => {
  const id = bookingId.trim();
  if (!id) {
    return null;
  }
  return items.find((item) => item.bookingId === id) ?? null;
};

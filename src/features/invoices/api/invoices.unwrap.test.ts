import {
  findInvoiceForBooking,
  parseRiderInvoiceDetail,
  parseRiderInvoiceListItem,
  parseRiderInvoiceListPage,
} from './invoices.unwrap';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const listItem = {
  id: 'inv-1',
  invoiceNumber: 'BW-2526-000001',
  rideId: 'ride-1',
  bookingId: 'booking-outstation',
  rideType: 'REGULAR',
  source: 'Hauz Khas',
  destination: 'Connaught Place',
  issuedAt: '2026-10-28T10:00:00.000Z',
  invoiceTotal: '210.50',
  currency: 'INR',
  paymentStatus: 'PAID',
  emailStatus: 'SENT',
  pdfAvailable: true,
};

const parsed = parseRiderInvoiceListItem(listItem);
assertTrue(parsed != null, 'list item parses');
assertEqual(parsed?.invoiceTotal, '210.50', 'invoice total is the backend string, not recalculated');
assertEqual(parsed?.pdfAvailable, true, 'pdfAvailable from backend');

const commuteItem = parseRiderInvoiceListItem({
  ...listItem,
  id: 'inv-2',
  bookingId: 'booking-commute',
  rideType: 'COMMUTE',
  invoiceTotal: '95.00',
});
assertEqual(commuteItem?.rideType, 'COMMUTE', 'commute invoice keeps backend rideType');
assertEqual(commuteItem?.invoiceTotal, '95.00', 'commute total is backend-provided');

const page = parseRiderInvoiceListPage(
  { items: [listItem, { ...listItem, id: 'inv-2', bookingId: 'booking-commute', rideType: 'COMMUTE' }], page: 1, limit: 20, total: 2 },
  { page: 1, limit: 20 },
);
assertEqual(findInvoiceForBooking(page.items, 'booking-outstation')?.id, 'inv-1', 'find outstation by bookingId');
assertEqual(findInvoiceForBooking(page.items, 'booking-commute')?.rideType, 'COMMUTE', 'find commute by bookingId');
assertEqual(findInvoiceForBooking(page.items, 'missing'), null, 'unknown booking has no invoice');

const detail = parseRiderInvoiceDetail({
  ...listItem,
  riderName: 'Asha',
  driverName: 'Vikram',
  vehicleRegistrationNumber: 'DL1CAB1234',
  departureAt: '2026-10-28T08:00:00.000Z',
  completedAt: '2026-10-28T09:30:00.000Z',
  taxableValue: '178.39',
  gstRateBasisPoints: 1800,
  cgst: '16.06',
  sgst: '16.06',
  igst: '0.00',
  issuerLegalName: 'BhaiWay',
  issuerGstin: '27AAAAA0000A1Z5',
  sacCode: '996411',
  placeOfSupplyStateCode: '27',
});
assertTrue(detail != null, 'detail parses');
assertEqual(detail?.cgst, '16.06', 'cgst is backend string');
assertEqual(detail?.sgst, '16.06', 'sgst is backend string');
assertEqual(detail?.igst, '0.00', 'igst is backend string');
assertEqual(detail?.taxableValue, '178.39', 'taxable value is backend string');

assertEqual(
  parseRiderInvoiceListItem({ ...listItem, invoiceTotal: undefined }),
  null,
  'do not invent a missing invoice total',
);

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('invoices.unwrap tests passed');

import {
  isSupportUuid,
  mergeEligibleRidesWithoutDuplicates,
  mergeSupportTicketsWithoutDuplicates,
  normalizeEligibleSupportRidePage,
  normalizeSupportTicketDetail,
  normalizeSupportTicketPage,
} from './support.mapper';
import {
  generateSupportTicketIdempotencyKey,
  validateAndBuildCreateTicketBody,
} from './support.payload';
import { formatSupportStatusLabel } from './supportLabels';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const assertFalse = (value: boolean, label: string): void => {
  if (value) {
    failed.push(`${label}: expected false`);
  }
};

assertTrue(isSupportUuid('550e8400-e29b-41d4-a716-446655440000'), 'valid uuid');
assertFalse(isSupportUuid('not-a-uuid'), 'invalid uuid');
assertFalse(isSupportUuid(''), 'empty uuid');

assertEqual(formatSupportStatusLabel('CREATED'), 'Created', 'status CREATED');
assertEqual(formatSupportStatusLabel('IN_PROGRESS'), 'In Progress', 'status IN_PROGRESS');
assertEqual(formatSupportStatusLabel('RESOLVED'), 'Resolved', 'status RESOLVED');
assertEqual(formatSupportStatusLabel('UNKNOWN_X'), 'Unknown X', 'unknown status humanized');

const page = normalizeSupportTicketPage(
  {
    items: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        reference: 'SUP-TEST01',
        category: 'BOOKINGS_AND_RIDES',
        subcategory: 'DRIVER_BEHAVIOUR',
        subject: 'Bookings And Rides · Driver Behaviour',
        status: 'CREATED',
        relatedRideId: null,
        relatedBookingId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        resolvedAt: null,
      },
      { id: '', reference: 'bad' },
    ],
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
  { page: 1, limit: 20 },
);
assertEqual(page.items.length, 1, 'drops invalid ticket rows');
assertEqual(page.items[0]?.reference, 'SUP-TEST01', 'keeps reference');

const wrapped = normalizeSupportTicketPage(
  {
    data: {
      items: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          reference: 'SUP-WRAP',
          category: 'OTHERS',
          subcategory: 'OTHER',
          subject: 'Others · Other',
          status: 'IN_PROGRESS',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      page: 2,
      limit: 10,
      total: 11,
      totalPages: 2,
    },
  },
  { page: 1, limit: 20 },
);
assertEqual(wrapped.page, 2, 'unwraps data envelope page');
assertEqual(wrapped.items[0]?.reference, 'SUP-WRAP', 'unwraps data envelope item');

const detail = normalizeSupportTicketDetail({
  id: '550e8400-e29b-41d4-a716-446655440000',
  reference: 'SUP-D1',
  category: 'PAYMENTS_AND_WALLETS',
  subcategory: 'WALLET_ISSUE',
  subject: 'Payments',
  status: 'RESOLVED',
  description: 'Wallet debit failed',
  relatedRideId: null,
  relatedBookingId: null,
  relatedWalletTransactionId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  resolvedAt: '2026-01-02T00:00:00.000Z',
  attachments: [{ id: 'a1', url: 'https://cdn.example.com/a.png', contentType: 'image/png', createdAt: '2026-01-01T00:00:00.000Z' }],
  comments: [
    {
      id: 'c1',
      authorType: 'ADMIN',
      authorUserId: 'u1',
      message: 'We are looking into it',
      createdAt: '2026-01-01T12:00:00.000Z',
    },
  ],
  statusHistory: [
    {
      id: 'h1',
      fromStatus: 'CREATED',
      toStatus: 'RESOLVED',
      changedByAdmin: true,
      createdAt: '2026-01-02T00:00:00.000Z',
    },
  ],
  relatedRide: null,
});
assertEqual(detail?.comments[0]?.authorType, 'ADMIN', 'admin comment preserved');
assertEqual(detail?.attachments.length, 1, 'attachment preserved');
assertEqual(detail?.statusHistory.length, 1, 'history preserved');

const rides = normalizeEligibleSupportRidePage(
  {
    items: [
      {
        rideId: '550e8400-e29b-41d4-a716-446655440010',
        bookingId: null,
        role: 'DRIVER',
        source: 'Pune',
        destination: 'Mumbai',
        departureDate: '2026-03-01',
        departureTime: '09:00',
        rideStatus: 'COMPLETED',
        bookingStatus: null,
        rideType: 'REGULAR',
      },
    ],
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
  { page: 1, limit: 20 },
);
assertEqual(rides.items.length, 1, 'eligible ride parsed');
assertEqual(rides.items[0]?.source, 'Pune', 'eligible ride source');

const merged = mergeSupportTicketsWithoutDuplicates(page.items, [
  page.items[0]!,
  {
    id: '550e8400-e29b-41d4-a716-446655440099',
    reference: 'SUP-NEW',
    category: 'OTHERS',
    subcategory: 'OTHER',
    subject: 'x',
    status: 'CREATED',
    relatedRideId: null,
    relatedBookingId: null,
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
    resolvedAt: null,
  },
]);
assertEqual(merged.length, 2, 'pagination merge dedupes');

const ridesMerged = mergeEligibleRidesWithoutDuplicates(rides.items, rides.items);
assertEqual(ridesMerged.length, 1, 'eligible rides merge dedupes');

const bookingRequired = validateAndBuildCreateTicketBody({
  category: 'BOOKINGS_AND_RIDES',
  subcategory: 'DRIVER_BEHAVIOUR',
  description: 'Late pickup',
});
assertFalse(bookingRequired.ok, 'bookings requires ride');

const bookingOk = validateAndBuildCreateTicketBody({
  category: 'BOOKINGS_AND_RIDES',
  subcategory: 'DRIVER_BEHAVIOUR',
  description: 'Late pickup',
  relatedRideId: '550e8400-e29b-41d4-a716-446655440010',
  idempotencyKey: 'support-ticket-test',
});
assertTrue(bookingOk.ok, 'bookings with ride ok');
if (bookingOk.ok) {
  assertEqual(bookingOk.body.relatedRideId, '550e8400-e29b-41d4-a716-446655440010', 'ride id sent');
  assertEqual(bookingOk.body.idempotencyKey, 'support-ticket-test', 'idempotency in body');
  assertTrue(bookingOk.body.relatedWalletTransactionId == null, 'no wallet id for bookings');
}

const paymentsOk = validateAndBuildCreateTicketBody({
  category: 'PAYMENTS_AND_WALLETS',
  subcategory: 'REFUND_ISSUE',
  description: 'Refund pending',
});
assertTrue(paymentsOk.ok, 'payments without ride ok');
if (paymentsOk.ok) {
  assertTrue(paymentsOk.body.relatedRideId == null, 'payments omits ride id');
}

const emptyDesc = validateAndBuildCreateTicketBody({
  category: 'OTHERS',
  subcategory: 'SUGGESTION',
  description: '   ',
});
assertFalse(emptyDesc.ok, 'empty description rejected');

const badAttachment = validateAndBuildCreateTicketBody({
  category: 'OTHERS',
  subcategory: 'OTHER',
  description: 'Issue',
  attachmentUrls: ['file:///local/photo.jpg'],
});
assertFalse(badAttachment.ok, 'local file uri rejected');

const goodAttachment = validateAndBuildCreateTicketBody({
  category: 'OTHERS',
  subcategory: 'OTHER',
  description: 'Issue',
  attachmentUrls: ['https://res.cloudinary.com/demo/image/upload/v1/shot.jpg'],
});
assertTrue(goodAttachment.ok, 'https cloudinary url accepted');

const key = generateSupportTicketIdempotencyKey();
assertTrue(key.startsWith('support-ticket-'), 'idempotency key prefix');

if (failed.length > 0) {
  throw new Error(`support mapper/payload tests failed:\n${failed.join('\n')}`);
}

console.log('support mapper/payload tests passed');

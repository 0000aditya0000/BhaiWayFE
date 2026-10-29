import { resolvePushNavigationTarget } from './resolvePushNavigation';
import { getPushType, parsePushNotification } from './parsePushNotification';
import { activeChatConversationStore } from '../push/activeChatConversationStore';
import { pendingPushNavigation } from '../push/pendingPushNavigation';

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

assertEqual(getPushType({ type: 'chat_message' }), 'CHAT_MESSAGE', 'type uppercased');
assertEqual(getPushType({}), '', 'missing type');

assertEqual(
  resolvePushNavigationTarget({
    type: 'CHAT_MESSAGE',
    conversationId: 'conv-1',
    bookingId: 'book-1',
  }).params?.conversationId,
  'conv-1',
  'CHAT_MESSAGE routes to conversation',
);

assertEqual(
  resolvePushNavigationTarget({ type: 'WALLET_CREDITED' }).pathname,
  '/wallet',
  'WALLET_CREDITED → wallet',
);

assertEqual(
  resolvePushNavigationTarget({ type: 'COMMUTE_BOOKING_REQUESTED' }).pathname,
  '/my-rides/booking-requests',
  'COMMUTE_BOOKING_REQUESTED → booking requests',
);

assertEqual(
  resolvePushNavigationTarget({
    type: 'BOOKING_CONFIRMED',
    bookingId: 'b-9',
    rideId: 'r-9',
  }).pathname,
  '/my-rides/rider-booking',
  'BOOKING_CONFIRMED → rider booking',
);

assertEqual(
  resolvePushNavigationTarget({ type: 'BOOKING_RECEIVED', rideId: 'ride-1', bookingMode: 'ASSURED' })
    .params?.rideType,
  'assured',
  'BOOKING_RECEIVED Assured → trip details assured',
);

assertEqual(
  resolvePushNavigationTarget({ type: 'ASSURED_RIDE_PUBLISHED', rideId: 'a-1' }).pathname,
  '/my-rides/trip-details',
  'ASSURED_RIDE_PUBLISHED → trip details',
);

assertEqual(
  resolvePushNavigationTarget({
    type: 'COMMUTE_BOOKING_CONFIRMED',
    rideId: 'c-1',
    bookingId: 'cb-1',
  }).pathname,
  '/office-commute/booked',
  'COMMUTE_BOOKING_CONFIRMED → commute booked',
);

assertEqual(
  resolvePushNavigationTarget({ type: 'CHAT_MESSAGE' }).pathname,
  '/inbox',
  'CHAT_MESSAGE without id → inbox',
);

assertEqual(
  resolvePushNavigationTarget({ type: 'BOOKING_CANCELLED' }).pathname,
  '/my-rides',
  'BOOKING_CANCELLED missing ids → my rides',
);

assertEqual(
  resolvePushNavigationTarget({
    type: 'SUPPORT_TICKET_COMMENT',
    ticketId: '550e8400-e29b-41d4-a716-446655440000',
  }).pathname,
  '/support-ticket-detail',
  'SUPPORT_TICKET_COMMENT with uuid → ticket detail',
);

assertEqual(
  resolvePushNavigationTarget({
    type: 'SUPPORT_TICKET_CREATED',
    ticketId: '550e8400-e29b-41d4-a716-446655440000',
  }).params?.ticketId,
  '550e8400-e29b-41d4-a716-446655440000',
  'SUPPORT_TICKET_CREATED passes ticketId',
);

assertEqual(
  resolvePushNavigationTarget({ type: 'SUPPORT_TICKET_RESOLVED' }).pathname,
  '/support-tickets',
  'SUPPORT_TICKET_RESOLVED without ticketId → ticket list',
);

assertEqual(
  resolvePushNavigationTarget({
    type: 'SUPPORT_TICKET_IN_PROGRESS',
    ticketId: 'not-a-uuid',
  }).pathname,
  '/support-tickets',
  'SUPPORT_TICKET_IN_PROGRESS invalid ticketId → ticket list',
);

assertEqual(
  resolvePushNavigationTarget({
    type: 'NO_SHOW_CLAIM_OPENED',
    claimId: '11111111-1111-4111-8111-111111111111',
    rideId: '22222222-2222-4222-8222-222222222222',
    bookingId: '33333333-3333-4333-8333-333333333333',
    kind: 'DRIVER_NO_SHOW',
  }).pathname,
  '/no-show-claim',
  'NO_SHOW_CLAIM_OPENED → claim screen',
);

assertEqual(
  resolvePushNavigationTarget({
    type: 'NO_SHOW_CLAIM_APPROVED',
    claimId: '11111111-1111-4111-8111-111111111111',
    rideId: '22222222-2222-4222-8222-222222222222',
  }).params?.claimId,
  '11111111-1111-4111-8111-111111111111',
  'NO_SHOW_CLAIM_APPROVED passes claimId',
);

assertEqual(
  resolvePushNavigationTarget({
    type: 'NO_SHOW_CLAIM_REJECTED',
    bookingId: 'b-9',
    rideId: 'r-9',
  }).pathname,
  '/my-rides/rider-booking',
  'NO_SHOW_CLAIM_REJECTED without claimId → rider booking',
);

const parsed = parsePushNotification({
  request: {
    content: {
      title: 'New message',
      body: 'Hi',
      data: { type: 'CHAT_MESSAGE', conversationId: 'c1' },
    },
  },
});
assertEqual(parsed.title, 'New message', 'parse title');
assertEqual(parsed.data.conversationId, 'c1', 'parse data');

const malformed = parsePushNotification(null);
assertEqual(malformed.title, 'BhaiWay', 'malformed fallback title');
assertTrue(typeof malformed.data === 'object', 'malformed data object');

activeChatConversationStore.set('c1');
assertTrue(activeChatConversationStore.isActive('c1'), 'active conversation matches');
assertTrue(!activeChatConversationStore.isActive('c2'), 'other conversation not active');
activeChatConversationStore.clear();
assertTrue(!activeChatConversationStore.isActive('c1'), 'cleared conversation inactive');

pendingPushNavigation.clear();
pendingPushNavigation.set(parsed);
const first = pendingPushNavigation.consume();
assertTrue(Boolean(first), 'pending consume returns once');
const second = pendingPushNavigation.consume();
assertTrue(second == null, 'pending consume is single-shot');
pendingPushNavigation.markProcessed(parsed);
pendingPushNavigation.set(parsed);
assertTrue(pendingPushNavigation.consume() == null, 'duplicate tap key skipped');

if (failed.length > 0) {
  throw new Error(`push notification tests failed:\n${failed.join('\n')}`);
}

console.log('push notification tests passed');

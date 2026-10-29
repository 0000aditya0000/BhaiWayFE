import {
  formatUnreadBadgeCount,
  inboxDataToPushData,
  mapInboxToAppNotification,
  mapInboxTypeToCategory,
  mergeInboxPagesWithoutDuplicates,
  normalizeInboxPage,
  normalizeMarkAllRead,
  normalizeUnreadCount,
  notificationSectionFor,
} from './notificationsInbox.mapper';

const assertEqual = (actual: unknown, expected: unknown, message: string): void => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${message}\nExpected: ${e}\nActual: ${a}`);
  }
};

assertEqual(formatUnreadBadgeCount(0), null, 'zero → no badge');
assertEqual(formatUnreadBadgeCount(3), '3', 'normal count');
assertEqual(formatUnreadBadgeCount(99), '99', '99 still numeric');
assertEqual(formatUnreadBadgeCount(100), '99+', '100+ capped');
assertEqual(formatUnreadBadgeCount(2500), '99+', 'large capped');

assertEqual(mapInboxTypeToCategory('BOOKING_CONFIRMED'), 'booking', 'booking type');
assertEqual(mapInboxTypeToCategory('WALLET_CREDITED'), 'payment', 'wallet type');
assertEqual(mapInboxTypeToCategory('AADHAAR_VERIFICATION_REWARD'), 'verification', 'aadhaar');
assertEqual(mapInboxTypeToCategory('REFERRAL_REWARD_REFERRER'), 'promo', 'referral');
assertEqual(mapInboxTypeToCategory('UNKNOWN_THING'), 'system', 'unknown type');

const page = normalizeInboxPage(
  {
    items: [
      {
        id: 'a',
        title: 'Hello',
        body: 'World',
        type: 'BOOKING_CONFIRMED',
        data: { type: 'BOOKING_CONFIRMED', bookingId: 'b1' },
        isRead: false,
        createdAt: '2026-10-19T10:00:00.000Z',
        readAt: null,
      },
      { id: '', title: 'bad' },
    ],
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
  { page: 1, limit: 20 },
);
assertEqual(page.items.length, 1, 'drops invalid rows');
assertEqual(page.items[0]?.id, 'a', 'keeps valid id');

assertEqual(normalizeUnreadCount({ count: 7 }).count, 7, 'unread count');
assertEqual(normalizeMarkAllRead({ updatedCount: 4 }).updatedCount, 4, 'mark all');

const mapped = mapInboxToAppNotification(page.items[0]!);
assertEqual(mapped.unread, true, 'unread from isRead false');
assertEqual(mapped.category, 'booking', 'mapped category');

const pushData = inboxDataToPushData({ type: 'CHAT_MESSAGE', conversationId: 'c1' });
assertEqual(pushData.type, 'CHAT_MESSAGE', 'push type string');
assertEqual(pushData.conversationId, 'c1', 'push conversationId');

const merged = mergeInboxPagesWithoutDuplicates(
  [mapped],
  [mapped, { ...mapped, id: 'b', title: 'Other' }],
);
assertEqual(merged.length, 2, 'dedupe on append');
assertEqual(merged.map((i) => i.id), ['a', 'b'], 'order preserved');

const today = new Date('2026-10-19T15:00:00.000Z');
assertEqual(
  notificationSectionFor('2026-10-19T10:00:00.000Z', today),
  'today',
  'same calendar day → today',
);
assertEqual(
  notificationSectionFor('2026-10-18T10:00:00.000Z', today),
  'earlier',
  'previous day → earlier',
);

console.log('notificationsInbox.mapper.test.ts: ok');

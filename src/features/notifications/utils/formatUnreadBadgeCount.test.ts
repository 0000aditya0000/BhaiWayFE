import { formatUnreadBadgeCount } from './notificationsInbox.mapper';

const assert = (cond: boolean, message: string): void => {
  if (!cond) {
    throw new Error(message);
  }
};

assert(formatUnreadBadgeCount(0) === null, '0 → null');
assert(formatUnreadBadgeCount(-3) === null, 'negative → null');
assert(formatUnreadBadgeCount(1) === '1', '1');
assert(formatUnreadBadgeCount(42) === '42', '42');
assert(formatUnreadBadgeCount(99) === '99', '99');
assert(formatUnreadBadgeCount(100) === '99+', '100 → 99+');
assert(formatUnreadBadgeCount(9999) === '99+', 'large → 99+');

console.log('formatUnreadBadgeCount.test.ts: ok');

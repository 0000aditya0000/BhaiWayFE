import type { ParsedPushNotification } from '../api/pushDevices.types';

let pending: ParsedPushNotification | null = null;
let processedKey: string | null = null;

const tapKey = (notification: ParsedPushNotification): string => {
  const d = notification.data;
  return [
    d.type ?? '',
    d.conversationId ?? '',
    d.messageId ?? '',
    d.bookingId ?? '',
    d.rideId ?? '',
    d.transactionId ?? '',
    notification.title,
    notification.body,
  ].join('|');
};

/**
 * Holds a cold-start / early tap until auth + navigation are ready.
 * Processes each unique tap at most once.
 */
export const pendingPushNavigation = {
  set: (notification: ParsedPushNotification): void => {
    pending = notification;
  },

  peek: (): ParsedPushNotification | null => pending,

  consume: (): ParsedPushNotification | null => {
    const next = pending;
    pending = null;
    if (!next) {
      return null;
    }
    const key = tapKey(next);
    if (processedKey === key) {
      return null;
    }
    processedKey = key;
    return next;
  },

  markProcessed: (notification: ParsedPushNotification): void => {
    processedKey = tapKey(notification);
    if (pending && tapKey(pending) === processedKey) {
      pending = null;
    }
  },

  clear: (): void => {
    pending = null;
  },
};

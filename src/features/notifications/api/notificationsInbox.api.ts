import { ENDPOINTS, httpClient } from '@/network';

import type {
  InboxNotificationDto,
  InboxNotificationPageDto,
  InboxUnreadCountDto,
  ListInboxNotificationsQuery,
  MarkAllInboxReadDto,
} from './notificationsInbox.types';
import {
  normalizeInboxNotification,
  normalizeInboxPage,
  normalizeMarkAllRead,
  normalizeUnreadCount,
} from '../utils/notificationsInbox.mapper';

/** GET /notifications?page=&limit=&unreadOnly= */
export const listInboxNotifications = async (
  query: ListInboxNotificationsQuery = {},
): Promise<InboxNotificationPageDto> => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(50, query.limit) : 20;
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (query.unreadOnly === true) {
    params.set('unreadOnly', 'true');
  }
  const payload = await httpClient.get<unknown>(
    `${ENDPOINTS.notifications.list}?${params.toString()}`,
  );
  return normalizeInboxPage(payload, { page, limit });
};

/** GET /notifications/unread-count */
export const getInboxUnreadCount = async (): Promise<InboxUnreadCountDto> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.notifications.unreadCount);
  return normalizeUnreadCount(payload);
};

/** PATCH /notifications/:id/read — idempotent */
export const markInboxNotificationRead = async (
  id: string,
): Promise<InboxNotificationDto> => {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error('Missing notification id');
  }
  const payload = await httpClient.patch<unknown>(
    ENDPOINTS.notifications.readOne(trimmed),
    {},
  );
  const item = normalizeInboxNotification(payload);
  if (!item) {
    throw new Error('Invalid mark-read response');
  }
  return item;
};

/** PATCH /notifications/read-all */
export const markAllInboxNotificationsRead = async (): Promise<MarkAllInboxReadDto> => {
  const payload = await httpClient.patch<unknown>(ENDPOINTS.notifications.readAll, {});
  return normalizeMarkAllRead(payload);
};

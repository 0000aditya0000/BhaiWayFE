import { notificationsSheetStore } from '@/DemoData';

import type { NormalizedRequest } from './demoRouter';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Demo-mode stand-in for inbox APIs — shapes match backend NotificationPageDto /
 * UnreadCount / MarkAll / Item DTOs so mobile parsers stay consistent.
 */
export const handleNotificationsDemo = async (request: NormalizedRequest): Promise<unknown> => {
  await wait(80);
  const { method, url } = request;
  const path = url.split('?')[0] ?? url;

  if (method === 'GET' && path === '/notifications/unread-count') {
    const count = notificationsSheetStore
      .getForCurrentUser()
      .filter((row) => row.unread).length;
    return { count };
  }

  if (method === 'GET' && path === '/notifications') {
    const rows = notificationsSheetStore.getForCurrentUser();
    const items = rows.map((row) => ({
      id: String(row.notificationId),
      title: row.title,
      body: row.body,
      type: 'SYSTEM',
      data: { type: 'SYSTEM' },
      isRead: !row.unread,
      createdAt: row.createdAt || new Date().toISOString(),
      readAt: row.unread ? null : new Date().toISOString(),
    }));
    return {
      items,
      page: 1,
      limit: 20,
      total: items.length,
      totalPages: items.length === 0 ? 0 : 1,
    };
  }

  const readMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if ((method === 'PATCH' || method === 'PUT') && readMatch) {
    const id = readMatch[1]!;
    const numericId = Number(id);
    if (Number.isFinite(numericId)) {
      await notificationsSheetStore.markRead(numericId, false);
    }
    return {
      id,
      title: 'Notification',
      body: '',
      type: 'SYSTEM',
      data: { type: 'SYSTEM' },
      isRead: true,
      createdAt: new Date().toISOString(),
      readAt: new Date().toISOString(),
    };
  }

  if ((method === 'PATCH' || method === 'PUT') && path === '/notifications/read-all') {
    const rows = await notificationsSheetStore.markAllReadForCurrentUser();
    return { updatedCount: rows.length };
  }

  throw new Error(`Demo notifications route not implemented: ${method} ${path}`);
};

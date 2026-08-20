import { DEMO_STORAGE_KEYS } from '@/DemoData/files';
import { authSession } from '@/store';

import { createLocalListStore } from './localStore';
import {
  NOTIFICATIONS_SHEET_HEADERS,
  NOTIFICATIONS_SHEET_ID_START,
  type NotificationSheetCategory,
  type NotificationSheetSection,
  type NotificationsSheetPatch,
  type NotificationsSheetRow,
} from './notificationsSheet.types';

const store = createLocalListStore<NotificationsSheetRow, 'row_id'>(
  DEMO_STORAGE_KEYS.notificationsSheet,
  'row_id',
);

const normalizeMobile = (mobile?: string | null): string =>
  (mobile ?? '').replace(/\D/g, '').slice(-10);

const normalizeCategory = (value?: string | null): NotificationSheetCategory => {
  const key = (value ?? '').trim().toLowerCase();
  if (
    key === 'ride' ||
    key === 'booking' ||
    key === 'payment' ||
    key === 'verification' ||
    key === 'promo' ||
    key === 'system'
  ) {
    return key;
  }
  return 'system';
};

const normalizeSection = (value?: string | null): NotificationSheetSection =>
  (value ?? '').trim().toLowerCase() === 'earlier' ? 'earlier' : 'today';

const parseUnread = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  const key = String(value ?? '')
    .trim()
    .toLowerCase();
  return key === 'true' || key === '1' || key === 'yes' || key === 'y';
};

const emptyRow = (
  rowId: number,
  notificationId: number,
  userId: number,
  mobile: string,
): NotificationsSheetRow => ({
  row_id: rowId,
  notificationId,
  userId,
  mobile,
  title: '',
  body: '',
  timeLabel: '',
  category: 'system',
  section: 'today',
  unread: true,
  createdAt: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const normalizeStoredRow = (
  row: Partial<NotificationsSheetRow> & { row_id: number },
): NotificationsSheetRow => ({
  row_id: row.row_id,
  notificationId: Number(row.notificationId) || 0,
  userId: Number(row.userId) || 0,
  mobile: row.mobile ?? '',
  title: row.title ?? '',
  body: row.body ?? '',
  timeLabel: row.timeLabel ?? '',
  category: normalizeCategory(row.category),
  section: normalizeSection(row.section),
  unread: parseUnread(row.unread),
  createdAt: row.createdAt ?? new Date().toISOString(),
  updated_at: row.updated_at ?? new Date().toISOString(),
});

export const notificationsSheetStore = {
  hydrate: async () => {
    const rows = await store.hydrate();
    return rows.map((row) => normalizeStoredRow(row));
  },
  getAll: () => store.getAll().map((row) => normalizeStoredRow(row)),
  subscribe: (listener: (items: NotificationsSheetRow[]) => void) =>
    store.subscribe((items) => listener(items.map((row) => normalizeStoredRow(row)))),
  clear: store.clear,
  removeById: store.removeById,
  getById: (rowId: number) => {
    const row = store.getById(rowId);
    return row ? normalizeStoredRow(row) : undefined;
  },

  nextNotificationId: (extraIds: number[] = []): number => {
    const ids = [
      ...store.getAll().map((row) => row.notificationId),
      ...extraIds,
    ].filter((id) => Number.isFinite(id) && id >= NOTIFICATIONS_SHEET_ID_START);
    if (ids.length === 0) {
      return NOTIFICATIONS_SHEET_ID_START;
    }
    return Math.max(...ids) + 1;
  },

  getByMobile: (mobile?: string | null) => {
    const key = normalizeMobile(mobile);
    if (!key) {
      return [];
    }
    return store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .filter((row) => normalizeMobile(row.mobile) === key)
      .sort((a, b) => b.notificationId - a.notificationId);
  },

  getForCurrentUser: (): NotificationsSheetRow[] => {
    const phone = authSession.getUser()?.phone;
    return notificationsSheetStore.getByMobile(phone);
  },

  findByNotificationId: (notificationId: number) =>
    store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .find((row) => row.notificationId === notificationId),

  upsert: async (patch: NotificationsSheetPatch): Promise<NotificationsSheetRow> => {
    await store.hydrate();
    const mobile =
      normalizeMobile(patch.mobile) ||
      normalizeMobile(authSession.getUser()?.phone) ||
      `unknown_${Date.now()}`;

    const existing =
      (patch.notificationId && patch.notificationId > 0
        ? store.getAll().find((row) => row.notificationId === patch.notificationId)
        : undefined) ||
      (patch.row_id ? store.getById(patch.row_id) : undefined);

    if (existing) {
      const merged: NotificationsSheetRow = {
        ...normalizeStoredRow(existing),
        userId: patch.userId && patch.userId > 0 ? patch.userId : existing.userId,
        mobile: mobile.startsWith('unknown_') ? existing.mobile || mobile : mobile,
        title: patch.title?.trim() || existing.title,
        body: patch.body?.trim() || existing.body,
        timeLabel: patch.timeLabel?.trim() || existing.timeLabel,
        category: patch.category ? normalizeCategory(patch.category) : existing.category,
        section: patch.section ? normalizeSection(patch.section) : existing.section,
        unread: patch.unread !== undefined ? Boolean(patch.unread) : existing.unread,
        createdAt: existing.createdAt || new Date().toISOString(),
        notificationId:
          existing.notificationId > 0
            ? existing.notificationId
            : notificationsSheetStore.nextNotificationId(),
        updated_at: new Date().toISOString(),
      };
      return store.save(merged);
    }

    const notificationId =
      patch.notificationId && patch.notificationId >= NOTIFICATIONS_SHEET_ID_START
        ? patch.notificationId
        : notificationsSheetStore.nextNotificationId();

    const base = emptyRow(
      store.nextId(),
      notificationId,
      patch.userId && patch.userId > 0 ? patch.userId : 0,
      mobile,
    );

    return store.save({
      ...base,
      title: patch.title?.trim() || '',
      body: patch.body?.trim() || '',
      timeLabel: patch.timeLabel?.trim() || '',
      category: normalizeCategory(patch.category),
      section: normalizeSection(patch.section),
      unread: patch.unread !== undefined ? Boolean(patch.unread) : true,
      createdAt: patch.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  markRead: async (notificationId: number, unread = false): Promise<NotificationsSheetRow | null> => {
    const existing = notificationsSheetStore.findByNotificationId(notificationId);
    if (!existing) {
      return null;
    }
    return notificationsSheetStore.upsert({
      notificationId: existing.notificationId,
      unread,
    });
  },

  markAllReadForCurrentUser: async (): Promise<NotificationsSheetRow[]> => {
    const rows = notificationsSheetStore.getForCurrentUser();
    const updated: NotificationsSheetRow[] = [];
    for (const row of rows) {
      if (!row.unread) {
        updated.push(row);
        continue;
      }
      updated.push(await notificationsSheetStore.upsert({ notificationId: row.notificationId, unread: false }));
    }
    return updated;
  },

  headers: NOTIFICATIONS_SHEET_HEADERS,
};

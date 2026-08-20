import { DEMO_STORAGE_KEYS } from '@/DemoData/files';
import { authSession } from '@/store';

import { createLocalListStore } from './localStore';
import {
  CHAT_THREADS_SHEET_HEADERS,
  CHAT_THREADS_SHEET_ID_START,
  type ChatThreadSheetRideType,
  type ChatThreadSheetRole,
  type ChatThreadsSheetPatch,
  type ChatThreadsSheetRow,
} from './chatSheet.types';

const store = createLocalListStore<ChatThreadsSheetRow, 'row_id'>(
  DEMO_STORAGE_KEYS.chatThreadsSheet,
  'row_id',
);

const normalizeMobile = (mobile?: string | null): string =>
  (mobile ?? '').replace(/\D/g, '').slice(-10);

const normalizeRole = (value?: string | null): ChatThreadSheetRole =>
  (value ?? '').trim().toLowerCase() === 'driver' ? 'driver' : 'rider';

const normalizeRideType = (value?: string | null): ChatThreadSheetRideType => {
  const key = (value ?? '').trim().toLowerCase();
  if (key === 'office' || key === 'published' || key === 'support') {
    return key;
  }
  return 'outstation';
};

const parseBool = (value: unknown): boolean => {
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
  threadId: number,
  threadKey: string,
  userId: number,
  mobile: string,
): ChatThreadsSheetRow => ({
  row_id: rowId,
  threadId,
  threadKey,
  userId,
  mobile,
  role: 'rider',
  rideType: 'outstation',
  peerName: '',
  peerSubtitle: '',
  routeLabel: '',
  lastMessage: '',
  timeLabel: '',
  unreadCount: 0,
  isOnline: false,
  avatarUri: '',
  updated_at: new Date().toISOString(),
});

const normalizeStoredRow = (
  row: Partial<ChatThreadsSheetRow> & { row_id: number },
): ChatThreadsSheetRow => ({
  row_id: row.row_id,
  threadId: Number(row.threadId) || 0,
  threadKey: row.threadKey ?? '',
  userId: Number(row.userId) || 0,
  mobile: row.mobile ?? '',
  role: normalizeRole(row.role),
  rideType: normalizeRideType(row.rideType),
  peerName: row.peerName ?? '',
  peerSubtitle: row.peerSubtitle ?? '',
  routeLabel: row.routeLabel ?? '',
  lastMessage: row.lastMessage ?? '',
  timeLabel: row.timeLabel ?? '',
  unreadCount: Number(row.unreadCount) || 0,
  isOnline: parseBool(row.isOnline),
  avatarUri: row.avatarUri ?? '',
  updated_at: row.updated_at ?? new Date().toISOString(),
});

export const chatThreadsSheetStore = {
  hydrate: async () => {
    const rows = await store.hydrate();
    return rows.map((row) => normalizeStoredRow(row));
  },
  getAll: () => store.getAll().map((row) => normalizeStoredRow(row)),
  subscribe: (listener: (items: ChatThreadsSheetRow[]) => void) =>
    store.subscribe((items) => listener(items.map((row) => normalizeStoredRow(row)))),
  clear: store.clear,
  removeById: store.removeById,
  getById: (rowId: number) => {
    const row = store.getById(rowId);
    return row ? normalizeStoredRow(row) : undefined;
  },

  nextThreadId: (extraIds: number[] = []): number => {
    const ids = [
      ...store.getAll().map((row) => row.threadId),
      ...extraIds,
    ].filter((id) => Number.isFinite(id) && id >= CHAT_THREADS_SHEET_ID_START);
    if (ids.length === 0) {
      return CHAT_THREADS_SHEET_ID_START;
    }
    return Math.max(...ids) + 1;
  },

  findByThreadKey: (threadKey?: string | null, mobile?: string | null) => {
    const key = (threadKey ?? '').trim();
    if (!key) {
      return undefined;
    }
    const phone = normalizeMobile(mobile);
    return store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .find(
        (row) =>
          row.threadKey === key && (!phone || normalizeMobile(row.mobile) === phone),
      );
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
      .sort((a, b) => b.threadId - a.threadId);
  },

  getForCurrentUser: (): ChatThreadsSheetRow[] => {
    const phone = authSession.getUser()?.phone;
    return chatThreadsSheetStore.getByMobile(phone);
  },

  upsert: async (patch: ChatThreadsSheetPatch): Promise<ChatThreadsSheetRow> => {
    await store.hydrate();
    const mobile =
      normalizeMobile(patch.mobile) ||
      normalizeMobile(authSession.getUser()?.phone) ||
      `unknown_${Date.now()}`;
    const threadKey = (patch.threadKey ?? '').trim();

    const existing =
      (threadKey
        ? store.getAll().find(
            (row) =>
              row.threadKey === threadKey &&
              (!normalizeMobile(row.mobile) || normalizeMobile(row.mobile) === mobile || mobile.startsWith('unknown_')),
          )
        : undefined) ||
      (patch.threadId && patch.threadId > 0
        ? store.getAll().find((row) => row.threadId === patch.threadId)
        : undefined);

    if (existing) {
      const merged: ChatThreadsSheetRow = {
        ...normalizeStoredRow(existing),
        threadKey: threadKey || existing.threadKey,
        userId: patch.userId && patch.userId > 0 ? patch.userId : existing.userId,
        mobile: mobile.startsWith('unknown_') ? existing.mobile || mobile : mobile,
        role: patch.role ? normalizeRole(patch.role) : existing.role,
        rideType: patch.rideType ? normalizeRideType(patch.rideType) : existing.rideType,
        peerName: patch.peerName?.trim() || existing.peerName,
        peerSubtitle: patch.peerSubtitle?.trim() || existing.peerSubtitle,
        routeLabel: patch.routeLabel?.trim() || existing.routeLabel,
        lastMessage: patch.lastMessage?.trim() || existing.lastMessage,
        timeLabel: patch.timeLabel?.trim() || existing.timeLabel,
        unreadCount:
          patch.unreadCount !== undefined ? Number(patch.unreadCount) || 0 : existing.unreadCount,
        isOnline: patch.isOnline !== undefined ? Boolean(patch.isOnline) : existing.isOnline,
        avatarUri: patch.avatarUri?.trim() || existing.avatarUri,
        threadId:
          existing.threadId > 0 ? existing.threadId : chatThreadsSheetStore.nextThreadId(),
        updated_at: new Date().toISOString(),
      };
      return store.save(merged);
    }

    const threadId =
      patch.threadId && patch.threadId >= CHAT_THREADS_SHEET_ID_START
        ? patch.threadId
        : chatThreadsSheetStore.nextThreadId();

    const base = emptyRow(
      store.nextId(),
      threadId,
      threadKey || `thread-${threadId}`,
      patch.userId && patch.userId > 0 ? patch.userId : 0,
      mobile,
    );

    return store.save({
      ...base,
      role: normalizeRole(patch.role),
      rideType: normalizeRideType(patch.rideType),
      peerName: patch.peerName?.trim() || '',
      peerSubtitle: patch.peerSubtitle?.trim() || '',
      routeLabel: patch.routeLabel?.trim() || '',
      lastMessage: patch.lastMessage?.trim() || '',
      timeLabel: patch.timeLabel?.trim() || '',
      unreadCount: Number(patch.unreadCount) || 0,
      isOnline: Boolean(patch.isOnline),
      avatarUri: patch.avatarUri?.trim() || '',
      updated_at: new Date().toISOString(),
    });
  },

  headers: CHAT_THREADS_SHEET_HEADERS,
};

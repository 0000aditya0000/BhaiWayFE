import { DEMO_STORAGE_KEYS } from '@/DemoData/files';
import { authSession } from '@/store';

import { createLocalListStore } from './localStore';
import {
  CHAT_MESSAGES_SHEET_HEADERS,
  CHAT_MESSAGES_SHEET_ID_START,
  type ChatMessageSheetSender,
  type ChatMessageSheetStatus,
  type ChatMessagesSheetPatch,
  type ChatMessagesSheetRow,
} from './chatSheet.types';

const store = createLocalListStore<ChatMessagesSheetRow, 'row_id'>(
  DEMO_STORAGE_KEYS.chatMessagesSheet,
  'row_id',
);

const normalizeMobile = (mobile?: string | null): string =>
  (mobile ?? '').replace(/\D/g, '').slice(-10);

const normalizeSender = (value?: string | null): ChatMessageSheetSender => {
  const key = (value ?? '').trim().toLowerCase();
  if (key === 'driver' || key === 'support') {
    return key;
  }
  return 'user';
};

const normalizeStatus = (value?: string | null): ChatMessageSheetStatus => {
  const key = (value ?? '').trim().toLowerCase();
  if (key === 'sent' || key === 'read') {
    return key;
  }
  return '';
};

const emptyRow = (
  rowId: number,
  messageId: number,
  threadKey: string,
  userId: number,
  mobile: string,
): ChatMessagesSheetRow => ({
  row_id: rowId,
  messageId,
  threadKey,
  userId,
  mobile,
  sender: 'user',
  text: '',
  timeLabel: '',
  status: '',
  createdAt: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const normalizeStoredRow = (
  row: Partial<ChatMessagesSheetRow> & { row_id: number },
): ChatMessagesSheetRow => ({
  row_id: row.row_id,
  messageId: Number(row.messageId) || 0,
  threadKey: row.threadKey ?? '',
  userId: Number(row.userId) || 0,
  mobile: row.mobile ?? '',
  sender: normalizeSender(row.sender),
  text: row.text ?? '',
  timeLabel: row.timeLabel ?? '',
  status: normalizeStatus(row.status),
  createdAt: row.createdAt ?? new Date().toISOString(),
  updated_at: row.updated_at ?? new Date().toISOString(),
});

export const chatMessagesSheetStore = {
  hydrate: async () => {
    const rows = await store.hydrate();
    return rows.map((row) => normalizeStoredRow(row));
  },
  getAll: () => store.getAll().map((row) => normalizeStoredRow(row)),
  subscribe: (listener: (items: ChatMessagesSheetRow[]) => void) =>
    store.subscribe((items) => listener(items.map((row) => normalizeStoredRow(row)))),
  clear: store.clear,
  removeById: store.removeById,
  getById: (rowId: number) => {
    const row = store.getById(rowId);
    return row ? normalizeStoredRow(row) : undefined;
  },

  nextMessageId: (extraIds: number[] = []): number => {
    const ids = [
      ...store.getAll().map((row) => row.messageId),
      ...extraIds,
    ].filter((id) => Number.isFinite(id) && id >= CHAT_MESSAGES_SHEET_ID_START);
    if (ids.length === 0) {
      return CHAT_MESSAGES_SHEET_ID_START;
    }
    return Math.max(...ids) + 1;
  },

  findByMessageId: (messageId: number) =>
    store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .find((row) => row.messageId === messageId),

  getByThreadKey: (threadKey?: string | null, mobile?: string | null) => {
    const key = (threadKey ?? '').trim();
    if (!key) {
      return [];
    }
    const phone = normalizeMobile(mobile);
    return store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .filter(
        (row) =>
          row.threadKey === key && (!phone || normalizeMobile(row.mobile) === phone),
      )
      .sort((a, b) => a.messageId - b.messageId);
  },

  getForCurrentUserThread: (threadKey: string) => {
    const phone = authSession.getUser()?.phone;
    return chatMessagesSheetStore.getByThreadKey(threadKey, phone);
  },

  upsert: async (patch: ChatMessagesSheetPatch): Promise<ChatMessagesSheetRow> => {
    await store.hydrate();
    const mobile =
      normalizeMobile(patch.mobile) ||
      normalizeMobile(authSession.getUser()?.phone) ||
      `unknown_${Date.now()}`;
    const threadKey = (patch.threadKey ?? '').trim();

    const existing =
      (patch.messageId && patch.messageId > 0
        ? store.getAll().find((row) => row.messageId === patch.messageId)
        : undefined) || undefined;

    if (existing) {
      const merged: ChatMessagesSheetRow = {
        ...normalizeStoredRow(existing),
        threadKey: threadKey || existing.threadKey,
        userId: patch.userId && patch.userId > 0 ? patch.userId : existing.userId,
        mobile: mobile.startsWith('unknown_') ? existing.mobile || mobile : mobile,
        sender: patch.sender ? normalizeSender(patch.sender) : existing.sender,
        text: patch.text?.trim() || existing.text,
        timeLabel: patch.timeLabel?.trim() || existing.timeLabel,
        status: patch.status !== undefined ? normalizeStatus(patch.status) : existing.status,
        createdAt: existing.createdAt || new Date().toISOString(),
        messageId:
          existing.messageId > 0 ? existing.messageId : chatMessagesSheetStore.nextMessageId(),
        updated_at: new Date().toISOString(),
      };
      return store.save(merged);
    }

    const messageId =
      patch.messageId && patch.messageId >= CHAT_MESSAGES_SHEET_ID_START
        ? patch.messageId
        : chatMessagesSheetStore.nextMessageId();

    const base = emptyRow(
      store.nextId(),
      messageId,
      threadKey || 'unknown',
      patch.userId && patch.userId > 0 ? patch.userId : 0,
      mobile,
    );

    return store.save({
      ...base,
      sender: normalizeSender(patch.sender),
      text: patch.text?.trim() || '',
      timeLabel: patch.timeLabel?.trim() || '',
      status: normalizeStatus(patch.status),
      createdAt: patch.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  headers: CHAT_MESSAGES_SHEET_HEADERS,
};

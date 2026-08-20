import {
  CHAT_MESSAGES_SHEET_ID_START,
  CHAT_THREADS_SHEET_ID_START,
} from '@/DemoData/files';
import { authSession } from '@/store';

import {
  SUPPORT_CHAT_THREAD_KEY,
  type ChatMessagesSheetRow,
  type ChatThreadsSheetRow,
} from '../chatSheet.types';
import { chatMessagesSheetStore } from '../chatMessagesSheetStore';
import { chatThreadsSheetStore } from '../chatThreadsSheetStore';
import { userDetailsSheetStore } from '../userDetailsSheetStore';

export interface RemoteChatThreadRow {
  threadId: number;
  threadKey: string;
  userId: number;
  mobile: string;
  role: string;
  rideType: string;
  peerName: string;
  peerSubtitle: string;
  routeLabel: string;
  lastMessage: string;
  timeLabel: string;
  unreadCount: number;
  isOnline: boolean;
  avatarUri: string;
}

export interface RemoteChatMessageRow {
  messageId: number;
  threadKey: string;
  userId: number;
  mobile: string;
  sender: string;
  text: string;
  timeLabel: string;
  status: string;
  createdAt: string;
}

export interface ChatSyncResult {
  localRowSaved: boolean;
  remoteSynced: boolean;
  mode: 'insert' | 'update';
  id: number;
  message: string;
}

const normalizeMobile = (value?: string | null): string =>
  (value ?? '').replace(/\D/g, '').slice(-10);

const resolveOwner = () => {
  const phone = normalizeMobile(authSession.getUser()?.phone);
  return (
    (phone ? userDetailsSheetStore.findByMobile(phone) : undefined) ||
    userDetailsSheetStore.getAll()[0]
  );
};

/** Local ChatThreads / ChatMessages persistence (device store). */
export const chatSheetSync = {
  /** Hydrate local chat thread and message stores. */
  pullIntoLocal: async (): Promise<void> => {
    await Promise.all([chatThreadsSheetStore.hydrate(), chatMessagesSheetStore.hydrate()]);
  },

  upsertThreadAndSync: async (
    input: Partial<RemoteChatThreadRow> & { threadKey: string; peerName: string },
  ): Promise<ChatSyncResult> => {
    const owner = resolveOwner();
    const mobile =
      normalizeMobile(input.mobile) ||
      owner?.mobile ||
      normalizeMobile(authSession.getUser()?.phone) ||
      '';
    const existing = chatThreadsSheetStore.findByThreadKey(input.threadKey, mobile);
    const mode: 'insert' | 'update' = existing ? 'update' : 'insert';
    const threadId =
      existing?.threadId && existing.threadId > 0
        ? existing.threadId
        : input.threadId && input.threadId >= CHAT_THREADS_SHEET_ID_START
          ? input.threadId
          : chatThreadsSheetStore.nextThreadId();

    const saved = await chatThreadsSheetStore.upsert({
      threadId,
      threadKey: input.threadKey,
      userId: input.userId || owner?.userId || 0,
      mobile,
      role: input.role as ChatThreadsSheetRow['role'],
      rideType: input.rideType as ChatThreadsSheetRow['rideType'],
      peerName: input.peerName,
      peerSubtitle: input.peerSubtitle,
      routeLabel: input.routeLabel,
      lastMessage: input.lastMessage,
      timeLabel: input.timeLabel,
      unreadCount: input.unreadCount,
      isOnline: input.isOnline,
      avatarUri: input.avatarUri,
    });

    return {
      localRowSaved: true,
      remoteSynced: false,
      mode,
      id: saved.threadId,
      message: `ThreadID ${saved.threadId} saved locally.`,
    };
  },

  upsertMessageAndSync: async (
    input: Partial<RemoteChatMessageRow> & { threadKey: string; text: string; sender: string },
  ): Promise<ChatSyncResult> => {
    const owner = resolveOwner();
    const mobile =
      normalizeMobile(input.mobile) ||
      owner?.mobile ||
      normalizeMobile(authSession.getUser()?.phone) ||
      '';
    const existing =
      input.messageId && input.messageId > 0
        ? chatMessagesSheetStore.findByMessageId(input.messageId)
        : undefined;
    const mode: 'insert' | 'update' = existing ? 'update' : 'insert';
    const messageId =
      existing?.messageId && existing.messageId > 0
        ? existing.messageId
        : input.messageId && input.messageId >= CHAT_MESSAGES_SHEET_ID_START
          ? input.messageId
          : chatMessagesSheetStore.nextMessageId();

    const saved = await chatMessagesSheetStore.upsert({
      messageId,
      threadKey: input.threadKey,
      userId: input.userId || owner?.userId || 0,
      mobile,
      sender: input.sender as ChatMessagesSheetRow['sender'],
      text: input.text,
      timeLabel: input.timeLabel,
      status: input.status as ChatMessagesSheetRow['status'],
      createdAt: input.createdAt,
    });

    // Keep inbox preview in sync.
    await chatThreadsSheetStore.upsert({
      threadKey: input.threadKey,
      mobile,
      userId: owner?.userId,
      lastMessage: input.text,
      timeLabel: input.timeLabel || saved.timeLabel,
    });

    return {
      localRowSaved: true,
      remoteSynced: false,
      mode,
      id: saved.messageId,
      message: `MessageID ${saved.messageId} saved locally.`,
    };
  },

  ensureSupportThread: async (): Promise<ChatThreadsSheetRow> => {
    const owner = resolveOwner();
    const mobile = owner?.mobile || normalizeMobile(authSession.getUser()?.phone) || '';
    const existing = chatThreadsSheetStore.findByThreadKey(SUPPORT_CHAT_THREAD_KEY, mobile);
    if (existing) {
      return existing;
    }
    const result = await chatSheetSync.upsertThreadAndSync({
      threadKey: SUPPORT_CHAT_THREAD_KEY,
      peerName: 'BhaiWay Support',
      peerSubtitle: 'Help desk',
      routeLabel: 'Support',
      role: 'rider',
      rideType: 'support',
      lastMessage: '',
      timeLabel: '',
      unreadCount: 0,
      isOnline: true,
      mobile,
      userId: owner?.userId,
    });
    return (
      chatThreadsSheetStore.findByThreadKey(SUPPORT_CHAT_THREAD_KEY, mobile) ||
      ({
        row_id: 0,
        threadId: result.id,
        threadKey: SUPPORT_CHAT_THREAD_KEY,
        userId: owner?.userId || 0,
        mobile,
        role: 'rider',
        rideType: 'support',
        peerName: 'BhaiWay Support',
        peerSubtitle: 'Help desk',
        routeLabel: 'Support',
        lastMessage: '',
        timeLabel: '',
        unreadCount: 0,
        isOnline: true,
        avatarUri: '',
        updated_at: new Date().toISOString(),
      } satisfies ChatThreadsSheetRow)
    );
  },
};

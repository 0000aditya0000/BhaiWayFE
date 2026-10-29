import { ENDPOINTS, httpClient } from '@/network';

import type {
  ChatConversationDto,
  ChatConversationsListDto,
  ChatMessageDto,
  ChatMessagesListDto,
  ListChatMessagesQuery,
  MarkChatReadDto,
  SendChatMessageDto,
  SendChatMessageResultDto,
} from './chat.types';

const unwrapConversations = (payload: unknown): ChatConversationDto[] => {
  if (Array.isArray(payload)) {
    return payload as ChatConversationDto[];
  }
  if (payload && typeof payload === 'object') {
    const record = payload as ChatConversationsListDto;
    if (Array.isArray(record.items)) {
      return record.items;
    }
    if (Array.isArray(record.conversations)) {
      return record.conversations;
    }
    if (Array.isArray(record.data)) {
      return record.data;
    }
    if (Array.isArray(record.results)) {
      return record.results;
    }
  }
  return [];
};

const unwrapMessagesPage = (
  payload: unknown,
): { messages: ChatMessageDto[]; hasMore: boolean; nextBefore: string | null } => {
  if (Array.isArray(payload)) {
    return {
      messages: payload as ChatMessageDto[],
      hasMore: false,
      nextBefore: null,
    };
  }
  if (payload && typeof payload === 'object') {
    const record = payload as ChatMessagesListDto;
    const messages =
      (Array.isArray(record.items) && record.items) ||
      (Array.isArray(record.messages) && record.messages) ||
      (Array.isArray(record.data) && record.data) ||
      (Array.isArray(record.results) && record.results) ||
      [];
    const nextBefore =
      typeof record.nextBefore === 'string' && record.nextBefore.trim()
        ? record.nextBefore.trim()
        : null;
    const hasMore =
      typeof record.hasMore === 'boolean' ? record.hasMore : Boolean(nextBefore);
    return { messages, hasMore, nextBefore };
  }
  return { messages: [], hasMore: false, nextBefore: null };
};

/**
 * Backend returns newest-first. UI lists oldest→newest.
 */
const toChronological = (messages: ChatMessageDto[]): ChatMessageDto[] =>
  [...messages].reverse();

const buildMessagesPath = (conversationId: string, query: ListChatMessagesQuery = {}): string => {
  const params = new URLSearchParams();
  if (query.limit != null && Number.isFinite(query.limit)) {
    params.set('limit', String(Math.max(1, Math.floor(query.limit))));
  }
  if (query.before?.trim()) {
    params.set('before', query.before.trim());
  }
  const qs = params.toString();
  const base = ENDPOINTS.chat.messages(conversationId);
  return qs ? `${base}?${qs}` : base;
};

/** GET /chat/conversations */
export const listChatConversations = async (): Promise<ChatConversationDto[]> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.chat.conversations);
  return unwrapConversations(payload);
};

/** GET /chat/conversations/:id */
export const getChatConversation = async (conversationId: string): Promise<ChatConversationDto> =>
  httpClient.get<ChatConversationDto>(ENDPOINTS.chat.conversationById(conversationId));

/** GET /chat/conversations/:id/messages?limit&before */
export const listChatMessages = async (
  conversationId: string,
  query: ListChatMessagesQuery = {},
): Promise<{ messages: ChatMessageDto[]; hasMore: boolean; nextBefore: string | null }> => {
  const payload = await httpClient.get<unknown>(buildMessagesPath(conversationId, query));
  const page = unwrapMessagesPage(payload);
  return {
    messages: toChronological(page.messages),
    hasMore: page.hasMore,
    nextBefore: page.nextBefore,
  };
};

/** POST /chat/conversations/:id/messages — REST fallback / offline send */
export const sendChatMessageRest = async (
  conversationId: string,
  body: SendChatMessageDto,
): Promise<SendChatMessageResultDto> => {
  const payload = await httpClient.post<SendChatMessageResultDto>(
    ENDPOINTS.chat.messages(conversationId),
    {
      clientMessageId: body.clientMessageId,
      message: body.message,
      messageType: body.messageType ?? 'TEXT',
    },
  );
  return payload ?? {};
};

/** POST /chat/conversations/:id/read */
export const markChatConversationRead = async (
  conversationId: string,
  body: MarkChatReadDto = {},
): Promise<void> => {
  const requestBody =
    body.upToMessageId?.trim()
      ? { upToMessageId: body.upToMessageId.trim() }
      : {};
  await httpClient.post(ENDPOINTS.chat.read(conversationId), requestBody);
};

export type {
  ChatConversationDto,
  ChatMessageDto,
  ListChatMessagesQuery,
  SendChatMessageDto,
  SendChatMessageResultDto,
};

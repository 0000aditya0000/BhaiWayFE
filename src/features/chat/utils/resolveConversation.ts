import {
  getChatConversation,
  listChatConversations,
  listChatMessages,
  markChatConversationRead,
  sendChatMessageRest,
} from '../api/chat.api';
import {
  extractConversationIdFromBooking,
  mapConversationDto,
  mapMessageDto,
} from '../api/chat.mapper';
import type { ChatConversationSummary } from '../types/chat.types';

/** Resolve a conversation by id, or by bookingId via the conversations list. */
export const resolveChatConversation = async (params: {
  conversationId?: string | null;
  bookingId?: string | null;
  currentUserId?: string | null;
  /** Optional booking payload that may embed conversationId. */
  bookingPayload?: unknown;
}): Promise<ChatConversationSummary | null> => {
  const embedded = extractConversationIdFromBooking(params.bookingPayload);
  const conversationId = (params.conversationId || embedded || '').trim();
  const bookingId = (params.bookingId || '').trim();
  const currentUserId = params.currentUserId ?? null;

  if (conversationId) {
    try {
      const dto = await getChatConversation(conversationId);
      return mapConversationDto(dto, currentUserId);
    } catch {
      // Fall through to list lookup.
    }
  }

  if (!bookingId && !conversationId) {
    return null;
  }

  const list = await listChatConversations();
  const mapped = list
    .map((item) => mapConversationDto(item, currentUserId))
    .filter((item): item is ChatConversationSummary => Boolean(item));

  if (conversationId) {
    const byId = mapped.find((item) => item.id === conversationId);
    if (byId) {
      return byId;
    }
  }

  if (bookingId) {
    return mapped.find((item) => item.bookingId === bookingId) ?? null;
  }

  return null;
};

export const fetchLatestMessages = async (
  conversationId: string,
  currentUserId: string,
  limit: number,
) => {
  const result = await listChatMessages(conversationId, { limit });
  const messages = result.messages
    .map((dto) => mapMessageDto(dto, currentUserId, conversationId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  return {
    messages,
    hasMore: result.hasMore,
    nextBefore: result.nextBefore,
  };
};

export const fetchOlderMessages = async (
  conversationId: string,
  currentUserId: string,
  beforeMessageId: string,
  limit: number,
) => {
  const result = await listChatMessages(conversationId, {
    limit,
    before: beforeMessageId,
  });
  const messages = result.messages
    .map((dto) => mapMessageDto(dto, currentUserId, conversationId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  return {
    messages,
    hasMore: result.hasMore,
    nextBefore: result.nextBefore,
  };
};

export { markChatConversationRead, sendChatMessageRest };

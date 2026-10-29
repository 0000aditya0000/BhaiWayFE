/**
 * Socket.IO events for ride chat namespace `/chat`.
 * REST remains source of truth; socket is realtime delivery only.
 */

export const CHAT_SOCKET_EVENTS = {
  JOIN: 'chat:join',
  LEAVE: 'chat:leave',
  SEND: 'chat:send',
  READ: 'chat:read',
  TYPING: 'chat:typing',
  STOP_TYPING: 'chat:stop_typing',
  MESSAGE: 'chat:message',
  MESSAGE_ACK: 'chat:message_ack',
  CONVERSATION_CLOSED: 'chat:conversation_closed',
  ERROR: 'chat:error',
} as const;

export type ChatSocketConnectionStatus =
  | 'OFFLINE'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ERROR';

export interface ChatSocketErrorPayload {
  message: string;
  code?: string;
  conversationId?: string;
}

export interface ChatJoinPayload {
  conversationId: string;
}

export interface ChatSendPayload {
  conversationId: string;
  clientMessageId: string;
  message: string;
}

export interface ChatReadPayload {
  conversationId: string;
  upToMessageId?: string;
}

export interface ChatTypingPayload {
  conversationId: string;
}

export interface ChatMessageAckPayload {
  conversationId?: string;
  clientMessageId?: string;
  messageId?: string;
  id?: string;
  status?: 'SENT' | 'DUPLICATE' | string;
  message?: unknown;
}

export interface ChatConversationClosedPayload {
  conversationId: string;
  reason?: string;
}

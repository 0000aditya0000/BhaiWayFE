/**
 * Tracks which chat conversation is currently visible so CHAT_MESSAGE
 * pushes can be suppressed (WebSocket is the realtime source of truth).
 */
let activeConversationId: string | null = null;

export const activeChatConversationStore = {
  get: (): string | null => activeConversationId,
  set: (conversationId: string | null): void => {
    activeConversationId = conversationId?.trim() || null;
  },
  clear: (): void => {
    activeConversationId = null;
  },
  isActive: (conversationId: string | null | undefined): boolean => {
    const id = conversationId?.trim();
    return Boolean(id && activeConversationId && id === activeConversationId);
  },
};

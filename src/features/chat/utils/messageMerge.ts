import type { ChatUiMessage } from '../types/chat.types';

/** Chronological ascending (oldest → newest) for chat FlatList. */
export const sortMessagesAscending = (messages: readonly ChatUiMessage[]): ChatUiMessage[] =>
  [...messages].sort((a, b) => {
    const byTime = a.createdAt.localeCompare(b.createdAt);
    if (byTime !== 0) {
      return byTime;
    }
    return a.id.localeCompare(b.id);
  });

/**
 * Merge incoming server/optimistic messages without duplicates.
 * Dedupes by server id, then by clientMessageId (reconciles pending bubbles).
 */
export const mergeChatMessages = (
  existing: readonly ChatUiMessage[],
  incoming: readonly ChatUiMessage[],
): ChatUiMessage[] => {
  const byId = new Map<string, ChatUiMessage>();
  const byClientId = new Map<string, string>();

  const upsert = (message: ChatUiMessage): void => {
    if (message.clientMessageId) {
      const priorId = byClientId.get(message.clientMessageId);
      if (priorId && priorId !== message.id) {
        byId.delete(priorId);
      }
      byClientId.set(message.clientMessageId, message.id);
    }
    const previous = byId.get(message.id);
    byId.set(message.id, previous ? { ...previous, ...message } : message);
  };

  existing.forEach(upsert);
  incoming.forEach(upsert);
  return sortMessagesAscending([...byId.values()]);
};

export const prependOlderMessages = (
  existing: readonly ChatUiMessage[],
  older: readonly ChatUiMessage[],
): ChatUiMessage[] => mergeChatMessages(existing, older);

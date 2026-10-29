export const CHAT_MESSAGE_MAX_LENGTH = 1000;

export const validateChatMessageText = (
  raw: string,
): { ok: true; text: string } | { ok: false; reason: 'empty' | 'too_long' } => {
  const text = raw.trim();
  if (!text) {
    return { ok: false, reason: 'empty' };
  }
  if (text.length > CHAT_MESSAGE_MAX_LENGTH) {
    return { ok: false, reason: 'too_long' };
  }
  return { ok: true, text };
};

import type { ApiError } from '@/network';

export const isChatClosedError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const api = error as ApiError;
  const code = String(api.code ?? '').toUpperCase();
  if (code === 'CHAT_CLOSED' || code.includes('CHAT_CLOSED')) {
    return true;
  }
  const message = String(api.message ?? '').toUpperCase();
  return message.includes('CHAT_CLOSED') || message.includes('CONVERSATION IS CLOSED');
};

export const mapChatUserError = (error: unknown, fallback: string): string => {
  if (isChatClosedError(error)) {
    return 'This chat is closed because the trip has ended.';
  }
  if (error && typeof error === 'object' && 'status' in error) {
    const api = error as ApiError;
    if (api.status === 401) {
      return 'Your session expired. Please sign in again.';
    }
    if (api.status === 403) {
      return 'You do not have access to this conversation.';
    }
    if (api.status === 404) {
      return 'Conversation not found.';
    }
    if (typeof api.message === 'string' && api.message.trim()) {
      return api.message.trim();
    }
  }
  return fallback;
};

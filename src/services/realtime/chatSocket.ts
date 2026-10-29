import { io, type Socket } from 'socket.io-client';

import { env } from '@/config';
import { authSession } from '@/store';

import {
  CHAT_SOCKET_EVENTS,
  type ChatConversationClosedPayload,
  type ChatMessageAckPayload,
  type ChatReadPayload,
  type ChatSendPayload,
  type ChatSocketConnectionStatus,
  type ChatSocketErrorPayload,
  type ChatTypingPayload,
} from './chatSocket.types';

type StatusListener = (status: ChatSocketConnectionStatus) => void;
type MessageListener = (payload: unknown) => void;
type AckListener = (payload: ChatMessageAckPayload) => void;
type ClosedListener = (payload: ChatConversationClosedPayload) => void;
type TypingListener = (payload: ChatTypingPayload & { userId?: string }) => void;
type ErrorListener = (payload: ChatSocketErrorPayload) => void;

const CHAT_NAMESPACE = '/chat';

const stripAccidentalRestSuffix = (url: string): string =>
  url
    .replace(/\/chat\/conversations(\/.*)?$/i, CHAT_NAMESPACE)
    .replace(/\/tracking(\/.*)?$/i, '')
    .replace(/\/v1\/?$/i, '');

/**
 * Resolve Socket.IO namespace URL for ride chat.
 * Always ends with `/chat` (never a REST path).
 */
export const resolveChatSocketUrl = (): string => {
  const configured = env.realtimeUrl?.trim();
  let base: string;

  if (configured) {
    base = stripAccidentalRestSuffix(configured.replace(/\/$/, ''));
    // realtimeUrl may already be .../tracking — strip namespace for origin
    base = base.replace(/\/tracking$/i, '').replace(/\/chat$/i, '');
  } else {
    try {
      const api = new URL(env.apiBaseUrl);
      base = `${api.protocol}//${api.host}`;
    } catch {
      base = stripAccidentalRestSuffix(
        env.apiBaseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, ''),
      );
    }
  }

  if (base.endsWith(CHAT_NAMESPACE)) {
    return base;
  }
  return `${base}${CHAT_NAMESPACE}`;
};

const sanitizeError = (raw: unknown): ChatSocketErrorPayload => {
  if (typeof raw === 'string' && raw.trim()) {
    return { message: raw.trim() };
  }
  if (raw && typeof raw === 'object') {
    const data = raw as Record<string, unknown>;
    const message =
      typeof data.message === 'string'
        ? data.message
        : typeof data.error === 'string'
          ? data.error
          : 'Chat connection error';
    const code = typeof data.code === 'string' ? data.code : undefined;
    const conversationId =
      typeof data.conversationId === 'string' ? data.conversationId : undefined;
    return { message, code, conversationId };
  }
  return { message: 'Chat connection error' };
};

let socket: Socket | null = null;
let activeConversationId: string | null = null;
let handshakeToken: string | null = null;
let connectionStatus: ChatSocketConnectionStatus = 'OFFLINE';
let lastError: ChatSocketErrorPayload | null = null;
let coreListenersAttached = false;

const statusListeners = new Set<StatusListener>();
const messageListeners = new Set<MessageListener>();
const ackListeners = new Set<AckListener>();
const closedListeners = new Set<ClosedListener>();
const typingListeners = new Set<TypingListener>();
const stopTypingListeners = new Set<TypingListener>();
const errorListeners = new Set<ErrorListener>();

const setStatus = (next: ChatSocketConnectionStatus): void => {
  if (connectionStatus === next) {
    return;
  }
  connectionStatus = next;
  statusListeners.forEach((listener) => {
    try {
      listener(next);
    } catch {
      // ignore
    }
  });
};

const emitJoin = (instance: Socket, conversationId: string): void => {
  instance.emit(CHAT_SOCKET_EVENTS.JOIN, { conversationId });
};

const attachCoreListeners = (instance: Socket): void => {
  if (coreListenersAttached) {
    return;
  }
  coreListenersAttached = true;

  instance.on('connect', () => {
    lastError = null;
    setStatus('CONNECTED');
    if (activeConversationId) {
      emitJoin(instance, activeConversationId);
    }
  });

  instance.on('disconnect', () => {
    setStatus('RECONNECTING');
  });

  instance.on('connect_error', (error: Error) => {
    lastError = { message: error.message || 'Socket connection failed' };
    setStatus('RECONNECTING');
  });

  instance.io.on('reconnect_attempt', () => {
    setStatus('RECONNECTING');
  });

  instance.io.on('reconnect', () => {
    lastError = null;
    setStatus('CONNECTED');
    if (activeConversationId) {
      emitJoin(instance, activeConversationId);
    }
  });

  instance.on(CHAT_SOCKET_EVENTS.MESSAGE, (raw: unknown) => {
    messageListeners.forEach((listener) => {
      try {
        listener(raw);
      } catch {
        // ignore
      }
    });
  });

  instance.on(CHAT_SOCKET_EVENTS.MESSAGE_ACK, (raw: unknown) => {
    const data =
      raw && typeof raw === 'object' ? (raw as ChatMessageAckPayload) : {};
    ackListeners.forEach((listener) => {
      try {
        listener(data);
      } catch {
        // ignore
      }
    });
  });

  instance.on(CHAT_SOCKET_EVENTS.CONVERSATION_CLOSED, (raw: unknown) => {
    const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const conversationId = String(data.conversationId ?? activeConversationId ?? '');
    if (!conversationId) {
      return;
    }
    const payload: ChatConversationClosedPayload = {
      conversationId,
      reason: typeof data.reason === 'string' ? data.reason : undefined,
    };
    closedListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch {
        // ignore
      }
    });
  });

  instance.on(CHAT_SOCKET_EVENTS.TYPING, (raw: unknown) => {
    const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const conversationId = String(data.conversationId ?? '');
    if (!conversationId) {
      return;
    }
    const payload = {
      conversationId,
      userId: typeof data.userId === 'string' ? data.userId : undefined,
    };
    typingListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch {
        // ignore
      }
    });
  });

  instance.on(CHAT_SOCKET_EVENTS.STOP_TYPING, (raw: unknown) => {
    const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const conversationId = String(data.conversationId ?? '');
    if (!conversationId) {
      return;
    }
    const payload = {
      conversationId,
      userId: typeof data.userId === 'string' ? data.userId : undefined,
    };
    stopTypingListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch {
        // ignore
      }
    });
  });

  instance.on(CHAT_SOCKET_EVENTS.ERROR, (raw: unknown) => {
    const payload = sanitizeError(raw);
    lastError = payload;
    setStatus('ERROR');
    errorListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch {
        // ignore
      }
    });
  });
};

const ensureSocket = (): Socket | null => {
  const token = authSession.getToken();
  if (!token) {
    setStatus('OFFLINE');
    return null;
  }

  if (socket) {
    return socket;
  }

  setStatus('CONNECTING');
  const url = resolveChatSocketUrl();

  socket = io(url, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 8000,
    auth: { token },
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  coreListenersAttached = false;
  attachCoreListeners(socket);
  return socket;
};

export const chatSocket = {
  getStatus: (): ChatSocketConnectionStatus => connectionStatus,

  getLastError: (): ChatSocketErrorPayload | null => lastError,

  subscribeStatus: (listener: StatusListener): (() => void) => {
    statusListeners.add(listener);
    listener(connectionStatus);
    return () => {
      statusListeners.delete(listener);
    };
  },

  subscribeMessage: (listener: MessageListener): (() => void) => {
    messageListeners.add(listener);
    return () => {
      messageListeners.delete(listener);
    };
  },

  subscribeAck: (listener: AckListener): (() => void) => {
    ackListeners.add(listener);
    return () => {
      ackListeners.delete(listener);
    };
  },

  subscribeClosed: (listener: ClosedListener): (() => void) => {
    closedListeners.add(listener);
    return () => {
      closedListeners.delete(listener);
    };
  },

  subscribeTyping: (listener: TypingListener): (() => void) => {
    typingListeners.add(listener);
    return () => {
      typingListeners.delete(listener);
    };
  },

  subscribeStopTyping: (listener: TypingListener): (() => void) => {
    stopTypingListeners.add(listener);
    return () => {
      stopTypingListeners.delete(listener);
    };
  },

  subscribeError: (listener: ErrorListener): (() => void) => {
    errorListeners.add(listener);
    if (lastError) {
      listener(lastError);
    }
    return () => {
      errorListeners.delete(listener);
    };
  },

  /**
   * Connect (or reuse) and join a conversation room.
   * Safe to call repeatedly — one socket instance, one core listener set.
   */
  joinConversation: (conversationId: string): void => {
    const id = conversationId.trim();
    if (!id) {
      return;
    }
    activeConversationId = id;
    const instance = ensureSocket();
    if (!instance) {
      setStatus('OFFLINE');
      return;
    }
    if (instance.connected) {
      emitJoin(instance, id);
      setStatus('CONNECTED');
    } else {
      setStatus('CONNECTING');
      instance.connect();
    }
  },

  leaveConversation: (conversationId?: string): void => {
    const id = (conversationId ?? activeConversationId)?.trim();
    if (socket && id) {
      socket.emit(CHAT_SOCKET_EVENTS.LEAVE, { conversationId: id });
    }
    if (!conversationId || conversationId === activeConversationId) {
      activeConversationId = null;
    }
  },

  sendMessage: (payload: ChatSendPayload): boolean => {
    const instance = ensureSocket();
    if (!instance?.connected) {
      return false;
    }
    instance.emit(CHAT_SOCKET_EVENTS.SEND, {
      conversationId: payload.conversationId,
      clientMessageId: payload.clientMessageId,
      message: payload.message,
    });
    return true;
  },

  markRead: (payload: ChatReadPayload): boolean => {
    const instance = ensureSocket();
    if (!instance?.connected) {
      return false;
    }
    instance.emit(CHAT_SOCKET_EVENTS.READ, payload);
    return true;
  },

  emitTyping: (conversationId: string): boolean => {
    const instance = ensureSocket();
    if (!instance?.connected) {
      return false;
    }
    instance.emit(CHAT_SOCKET_EVENTS.TYPING, { conversationId });
    return true;
  },

  emitStopTyping: (conversationId: string): boolean => {
    const instance = ensureSocket();
    if (!instance?.connected) {
      return false;
    }
    instance.emit(CHAT_SOCKET_EVENTS.STOP_TYPING, { conversationId });
    return true;
  },

  disconnect: (): void => {
    activeConversationId = null;
    lastError = null;
    coreListenersAttached = false;
    if (socket) {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    setStatus('OFFLINE');
    handshakeToken = null;
  },

  isConnected: (): boolean => Boolean(socket?.connected),
};

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  type FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { activeChatConversationStore } from '@/features/notifications/push/activeChatConversationStore';
import { getBookingById } from '@/features/ride-search/api';
import { resolveRidePeerContactPhone } from '@/features/ride-search/utils/bookingContactPhone';
import { chatSocket } from '@/services/realtime';
import { useSessionUser } from '@/shared/hooks';
import { openPhoneCall } from '@/shared/utils';
import { showAppAlert } from '@/store';

import type { ChatMessageDto } from '../api/chat.types';
import {
  isMessageForConversation,
  mapMessageDto,
  parseChatSocketMessage,
  shouldRejoinOnSocketStatus,
} from '../api/chat.mapper';
import {
  CHAT_QUICK_REPLIES_DRIVER,
  CHAT_QUICK_REPLIES_RIDER,
  CHAT_SCREEN,
} from '../constants/chat.constants';
import type {
  ChatConversationStatus,
  ChatConversationSummary,
  ChatUiMessage,
} from '../types/chat.types';
import { createClientMessageId } from '../utils/clientMessageId';
import { isChatClosedError, mapChatUserError } from '../utils/chatErrors';
import { mergeChatMessages, prependOlderMessages } from '../utils/messageMerge';
import {
  fetchLatestMessages,
  fetchOlderMessages,
  markChatConversationRead,
  resolveChatConversation,
  sendChatMessageRest,
} from '../utils/resolveConversation';
import { validateChatMessageText } from '../utils/validateChatMessage';

export type RideChatPerspective = 'rider' | 'driver';

export interface UseConversationChatParams {
  conversationId?: string;
  bookingId?: string;
  /** Display fallbacks while conversation loads. */
  peerName?: string;
  peerSubtitle?: string;
  routeLabel?: string;
  tripTimeLabel?: string;
  avatarUri?: string;
  perspective?: RideChatPerspective;
}

export interface UseConversationChatResult {
  loading: boolean;
  errorMessage: string | null;
  conversation: ChatConversationSummary | null;
  status: ChatConversationStatus;
  isClosed: boolean;
  peerName: string;
  peerSubtitle: string;
  routeLabel: string;
  tripTimeLabel: string;
  avatarUri?: string;
  messages: ChatUiMessage[];
  draft: string;
  quickReplies: readonly string[];
  listRef: React.RefObject<FlatList<ChatUiMessage> | null>;
  perspective: RideChatPerspective;
  peerTyping: boolean;
  loadingOlder: boolean;
  hasMoreOlder: boolean;
  setDraft: (value: string) => void;
  sendMessage: (text?: string) => void;
  retryFailedMessage: (message: ChatUiMessage) => void;
  loadOlderMessages: () => void;
  onMessagesScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  goBack: () => void;
  refresh: () => Promise<void>;
  canCallPeer: boolean;
  callPeer: () => void;
}

export const useConversationChat = (
  params: UseConversationChatParams,
): UseConversationChatResult => {
  const router = useRouter();
  const listRef = useRef<FlatList<ChatUiMessage> | null>(null);
  const perspective: RideChatPerspective =
    params.perspective === 'driver' ? 'driver' : 'rider';
  const sessionUser = useSessionUser();
  const currentUserId = sessionUser?.id?.trim() || '';

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ChatConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [draft, setDraftState] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [statusOverride, setStatusOverride] = useState<ChatConversationStatus | null>(null);

  const conversationIdRef = useRef<string>('');
  const pendingByClientId = useRef<Map<string, ChatUiMessage>>(new Map());
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef(0);
  const nearBottomRef = useRef(true);
  const loadingOlderRef = useRef(false);
  const syncInFlightRef = useRef(false);

  const status: ChatConversationStatus =
    statusOverride ?? conversation?.status ?? 'OPEN';
  const isClosed = status === 'CLOSED';

  const scrollToEndIfNeeded = useCallback((animated = true) => {
    if (!nearBottomRef.current) {
      return;
    }
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const applyIncomingMessage = useCallback(
    (dto: ChatMessageDto, conversationId: string) => {
      const mapped = mapMessageDto(dto, currentUserId, conversationId);
      if (!mapped) {
        return;
      }
      if (!isMessageForConversation(mapped.conversationId, conversationId)) {
        return;
      }
      setMessages((prev) => mergeChatMessages(prev, [mapped]));
      if (mapped.clientMessageId) {
        pendingByClientId.current.delete(mapped.clientMessageId);
      }
      scrollToEndIfNeeded(true);
    },
    [currentUserId, scrollToEndIfNeeded],
  );

  const markReadForConversation = useCallback(
    (conversationId: string, messagesForRead: readonly ChatUiMessage[]) => {
      const latestIncoming = [...messagesForRead].reverse().find((item) => !item.isMine);
      const upToMessageId = latestIncoming?.id?.startsWith('local_')
        ? undefined
        : latestIncoming?.id;
      void markChatConversationRead(
        conversationId,
        upToMessageId ? { upToMessageId } : {},
      ).catch(() => undefined);
      chatSocket.markRead({
        conversationId,
        ...(upToMessageId ? { upToMessageId } : {}),
      });
    },
    [],
  );

  const syncLatest = useCallback(
    async (conversationId: string) => {
      if (!currentUserId || syncInFlightRef.current) {
        return;
      }
      syncInFlightRef.current = true;
      try {
        const latest = await fetchLatestMessages(
          conversationId,
          currentUserId,
          CHAT_SCREEN.pageSize,
        );
        setMessages((prev) => {
          const merged = mergeChatMessages(prev, latest.messages);
          markReadForConversation(conversationId, merged);
          return merged;
        });
        setHasMoreOlder(latest.hasMore);
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [currentUserId, markReadForConversation],
  );

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const resolved = await resolveChatConversation({
        conversationId: params.conversationId,
        bookingId: params.bookingId,
        currentUserId,
      });
      if (!resolved) {
        setConversation(null);
        setMessages([]);
        setErrorMessage(CHAT_SCREEN.unavailableMessage);
        return;
      }
      let next = resolved;
      if (!resolved.peer.phone && resolved.bookingId) {
        try {
          const booking = await getBookingById(resolved.bookingId);
          const fallback = resolveRidePeerContactPhone(booking, perspective);
          if (fallback) {
            next = {
              ...resolved,
              peer: { ...resolved.peer, phone: fallback },
            };
          }
        } catch {
          // Call stays unavailable when booking contact is missing.
        }
      }
      setConversation(next);
      setStatusOverride(null);
      conversationIdRef.current = resolved.id;
      activeChatConversationStore.set(resolved.id);
      chatSocket.joinConversation(resolved.id);
      const latest = await fetchLatestMessages(
        resolved.id,
        currentUserId,
        CHAT_SCREEN.pageSize,
      );
      setMessages((prev) => mergeChatMessages(prev, latest.messages));
      setHasMoreOlder(latest.hasMore);
      markReadForConversation(resolved.id, latest.messages);
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: false });
      });
    } catch (error) {
      setErrorMessage(mapChatUserError(error, 'Unable to load chat.'));
    } finally {
      setLoading(false);
    }
  }, [currentUserId, markReadForConversation, params.bookingId, params.conversationId, perspective]);

  useFocusEffect(
    useCallback(() => {
      void bootstrap();
      return () => {
        const id = conversationIdRef.current;
        activeChatConversationStore.clear();
        if (id) {
          chatSocket.emitStopTyping(id);
          chatSocket.leaveConversation(id);
        }
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = null;
        }
        setPeerTyping(false);
      };
    }, [bootstrap]),
  );

  useEffect(() => {
    const unsubMessage = chatSocket.subscribeMessage((raw) => {
      const activeId = conversationIdRef.current;
      if (!activeId) {
        return;
      }
      const data = parseChatSocketMessage(raw);
      if (!data) {
        return;
      }
      if (!isMessageForConversation(data.conversationId, activeId)) {
        return;
      }
      applyIncomingMessage(data, activeId);
    });

    const unsubAck = chatSocket.subscribeAck((ack) => {
      const activeId = conversationIdRef.current;
      if (!activeId) {
        return;
      }
      const clientMessageId = String(ack.clientMessageId ?? '').trim();
      const serverId = String(ack.messageId ?? ack.id ?? '').trim();
      if (ack.message && typeof ack.message === 'object') {
        const parsed = parseChatSocketMessage(ack.message) ?? (ack.message as ChatMessageDto);
        applyIncomingMessage(parsed, activeId);
        if (clientMessageId) {
          pendingByClientId.current.delete(clientMessageId);
        }
        return;
      }
      if (!clientMessageId) {
        return;
      }
      const pending = pendingByClientId.current.get(clientMessageId);
      if (!pending) {
        return;
      }
      const status = String(ack.status ?? '').toUpperCase();
      if (status !== 'SENT' && status !== 'DUPLICATE' && !serverId) {
        return;
      }
      const reconciled: ChatUiMessage = {
        ...pending,
        id: serverId || pending.id,
        localStatus: 'sent',
      };
      pendingByClientId.current.delete(clientMessageId);
      setMessages((prev) =>
        mergeChatMessages(
          prev.filter((item) => item.id !== pending.id),
          [reconciled],
        ),
      );
    });

    const unsubClosed = chatSocket.subscribeClosed((payload) => {
      if (payload.conversationId !== conversationIdRef.current) {
        return;
      }
      setStatusOverride('CLOSED');
      setConversation((prev) =>
        prev ? { ...prev, status: 'CLOSED', closedReason: payload.reason } : prev,
      );
      setPeerTyping(false);
      chatSocket.emitStopTyping(payload.conversationId);
    });

    const unsubTyping = chatSocket.subscribeTyping((payload) => {
      if (payload.conversationId !== conversationIdRef.current) {
        return;
      }
      if (payload.userId && payload.userId === currentUserId) {
        return;
      }
      setPeerTyping(true);
    });

    const unsubStop = chatSocket.subscribeStopTyping((payload) => {
      if (payload.conversationId !== conversationIdRef.current) {
        return;
      }
      setPeerTyping(false);
    });

    const unsubError = chatSocket.subscribeError((payload) => {
      if (
        payload.code?.toUpperCase() === 'CHAT_CLOSED' ||
        payload.message.toUpperCase().includes('CHAT_CLOSED')
      ) {
        setStatusOverride('CLOSED');
      }
    });

    const unsubStatus = chatSocket.subscribeStatus((socketStatus) => {
      const activeId = conversationIdRef.current;
      if (!activeId || !shouldRejoinOnSocketStatus(socketStatus)) {
        return;
      }
      chatSocket.joinConversation(activeId);
      void syncLatest(activeId);
    });

    return () => {
      unsubMessage();
      unsubAck();
      unsubClosed();
      unsubTyping();
      unsubStop();
      unsubError();
      unsubStatus();
    };
  }, [applyIncomingMessage, currentUserId, syncLatest]);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next === 'active' && conversationIdRef.current) {
        chatSocket.joinConversation(conversationIdRef.current);
        void syncLatest(conversationIdRef.current);
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [syncLatest]);

  const setDraft = useCallback(
    (value: string) => {
      setDraftState(value.slice(0, CHAT_SCREEN.maxLength));
      const id = conversationIdRef.current;
      if (!id || isClosed) {
        return;
      }
      const now = Date.now();
      if (value.trim() && now - lastTypingEmitRef.current >= CHAT_SCREEN.typingThrottleMs) {
        lastTypingEmitRef.current = now;
        chatSocket.emitTyping(id);
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => {
        chatSocket.emitStopTyping(id);
      }, CHAT_SCREEN.typingIdleMs);
    },
    [isClosed],
  );

  const transmit = useCallback(
    async (optimistic: ChatUiMessage, text: string, clientMessageId: string) => {
      const conversationId = conversationIdRef.current;
      if (!conversationId) {
        return;
      }

      const reconcileAck = (result: {
        status?: string | null;
        clientMessageId?: string | null;
        messageId?: string | null;
        id?: string | null;
        message?: ChatMessageDto | null;
      }) => {
        if (result.message) {
          const parsed =
            parseChatSocketMessage(result.message) ?? result.message;
          applyIncomingMessage(parsed, conversationId);
          pendingByClientId.current.delete(clientMessageId);
          return;
        }
        const status = String(result.status ?? '').toUpperCase();
        const serverId = String(result.messageId ?? result.id ?? '').trim();
        if (status === 'SENT' || status === 'DUPLICATE' || serverId) {
          const reconciled: ChatUiMessage = {
            ...optimistic,
            id: serverId || optimistic.id,
            localStatus: 'sent',
          };
          pendingByClientId.current.delete(clientMessageId);
          setMessages((prev) =>
            mergeChatMessages(
              prev.filter((item) => item.id !== optimistic.id),
              [reconciled],
            ),
          );
        }
      };

      const markFailed = (error: unknown) => {
        if (isChatClosedError(error)) {
          setStatusOverride('CLOSED');
          pendingByClientId.current.delete(clientMessageId);
          setMessages((prev) => prev.filter((item) => item.id !== optimistic.id));
          showAppAlert('Chat closed', CHAT_SCREEN.closedBanner);
          return;
        }
        pendingByClientId.current.set(clientMessageId, {
          ...optimistic,
          localStatus: 'failed',
        });
        setMessages((prev) =>
          mergeChatMessages(prev, [{ ...optimistic, localStatus: 'failed' }]),
        );
      };

      const sendBody = {
        clientMessageId,
        message: text,
        messageType: 'TEXT' as const,
      };

      const sentViaSocket = chatSocket.sendMessage({
        conversationId,
        clientMessageId,
        message: text,
      });

      if (sentViaSocket) {
        // Wait for chat:message_ack; REST fallback if ack is slow / lost.
        setTimeout(() => {
          const stillPending = pendingByClientId.current.get(clientMessageId);
          if (!stillPending) {
            return;
          }
          void sendChatMessageRest(conversationId, sendBody)
            .then(reconcileAck)
            .catch(markFailed);
        }, 2500);
        return;
      }

      try {
        const result = await sendChatMessageRest(conversationId, sendBody);
        reconcileAck(result);
        // If backend returned an unexpected empty body, still clear pending.
        if (pendingByClientId.current.has(clientMessageId)) {
          pendingByClientId.current.delete(clientMessageId);
          setMessages((prev) =>
            mergeChatMessages(prev, [{ ...optimistic, localStatus: 'sent' }]),
          );
        }
      } catch (error) {
        markFailed(error);
      }
    },
    [applyIncomingMessage],
  );

  const sendMessage = useCallback(
    (text?: string) => {
      if (isClosed) {
        showAppAlert('Chat closed', CHAT_SCREEN.closedBanner);
        return;
      }
      const conversationId = conversationIdRef.current;
      if (!conversationId) {
        showAppAlert(CHAT_SCREEN.unavailableTitle, CHAT_SCREEN.unavailableMessage);
        return;
      }
      const validated = validateChatMessageText(text ?? draft);
      if (!validated.ok) {
        showAppAlert(
          'Message',
          validated.reason === 'too_long'
            ? CHAT_SCREEN.validationTooLong
            : CHAT_SCREEN.validationEmpty,
        );
        return;
      }

      const clientMessageId = createClientMessageId();
      const createdAt = new Date().toISOString();
      const optimistic: ChatUiMessage = {
        id: `local_${clientMessageId}`,
        clientMessageId,
        conversationId,
        senderId: currentUserId,
        text: validated.text,
        createdAt,
        timeLabel: new Date(createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isMine: true,
        localStatus: 'pending',
      };
      pendingByClientId.current.set(clientMessageId, optimistic);
      setMessages((prev) => mergeChatMessages(prev, [optimistic]));
      setDraftState('');
      chatSocket.emitStopTyping(conversationId);
      nearBottomRef.current = true;
      scrollToEndIfNeeded(true);
      void transmit(optimistic, validated.text, clientMessageId);
    },
    [currentUserId, draft, isClosed, scrollToEndIfNeeded, transmit],
  );

  const retryFailedMessage = useCallback(
    (message: ChatUiMessage) => {
      if (isClosed || !message.clientMessageId || message.localStatus !== 'failed') {
        return;
      }
      const retry: ChatUiMessage = { ...message, localStatus: 'pending' };
      pendingByClientId.current.set(message.clientMessageId, retry);
      setMessages((prev) => mergeChatMessages(prev, [retry]));
      void transmit(retry, message.text, message.clientMessageId);
    },
    [isClosed, transmit],
  );

  const loadOlderMessages = useCallback(() => {
    const conversationId = conversationIdRef.current;
    if (
      !conversationId ||
      !currentUserId ||
      !hasMoreOlder ||
      loadingOlderRef.current ||
      messages.length === 0
    ) {
      return;
    }
    const oldest = messages[0];
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    void (async () => {
      try {
        const older = await fetchOlderMessages(
          conversationId,
          currentUserId,
          oldest.id,
          CHAT_SCREEN.pageSize,
        );
        setMessages((prev) => prependOlderMessages(prev, older.messages));
        setHasMoreOlder(older.hasMore && older.messages.length > 0);
      } catch {
        // keep current history
      } finally {
        loadingOlderRef.current = false;
        setLoadingOlder(false);
      }
    })();
  }, [currentUserId, hasMoreOlder, messages]);

  const onMessagesScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    nearBottomRef.current = distanceFromBottom < 80;
  }, []);

  const canCallPeer = Boolean(conversation?.peer.phone?.trim());

  const callPeer = useCallback(() => {
    const phone = conversation?.peer.phone?.trim();
    if (!phone) {
      showAppAlert(CHAT_SCREEN.callTitle, CHAT_SCREEN.callUnavailable);
      return;
    }
    void openPhoneCall(phone).then((started) => {
      if (!started) {
        showAppAlert(CHAT_SCREEN.callTitle, CHAT_SCREEN.callFailed);
      }
    });
  }, [conversation?.peer.phone]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(perspective === 'driver' ? ROUTES.myRides : ROUTES.inbox);
  }, [perspective, router]);

  const refresh = useCallback(async () => {
    await bootstrap();
  }, [bootstrap]);

  const peerName = conversation?.peer.name || params.peerName?.trim() || 'Chat';
  const peerSubtitle =
    conversation?.peer.roleLabel ||
    params.peerSubtitle?.trim() ||
    (perspective === 'driver' ? 'Passenger' : 'Driver');
  const routeLabel = conversation?.routeLabel || params.routeLabel?.trim() || '';
  const tripTimeLabel = params.tripTimeLabel?.trim() || '';
  const avatarUri = conversation?.peer.avatarUri || params.avatarUri?.trim() || undefined;

  const quickReplies = useMemo(
    () => (perspective === 'driver' ? CHAT_QUICK_REPLIES_DRIVER : CHAT_QUICK_REPLIES_RIDER),
    [perspective],
  );

  return {
    loading,
    errorMessage,
    conversation,
    status,
    isClosed,
    peerName,
    peerSubtitle,
    routeLabel,
    tripTimeLabel,
    avatarUri,
    messages,
    draft,
    quickReplies,
    listRef,
    perspective,
    peerTyping: isClosed ? false : peerTyping,
    loadingOlder,
    hasMoreOlder,
    setDraft,
    sendMessage,
    retryFailedMessage,
    loadOlderMessages,
    onMessagesScroll,
    goBack,
    refresh,
    canCallPeer,
    callPeer,
  };
};

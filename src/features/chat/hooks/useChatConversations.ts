import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { authSession, appModeStore, type AppMode } from '@/store';

import { listChatConversations } from '../api/chat.api';
import { mapConversationDto } from '../api/chat.mapper';
import type { ChatConversationSummary } from '../types/chat.types';
import { getChatConversationPath } from '../constants/chat.navigation';

export interface UseChatConversationsResult {
  mode: AppMode;
  loading: boolean;
  errorMessage: string | null;
  conversations: ChatConversationSummary[];
  openConversation: (conversation: ChatConversationSummary) => void;
  refresh: () => Promise<void>;
  openNotifications: () => void;
}

export const useChatConversations = (): UseChatConversationsResult => {
  const router = useRouter();
  const [mode, setMode] = useState<AppMode>(() => appModeStore.get());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const currentUserId = authSession.getUser()?.id ?? null;
      const list = await listChatConversations();
      const mapped = list
        .map((item) => mapConversationDto(item, currentUserId))
        .filter((item): item is ChatConversationSummary => Boolean(item));
      mapped.sort((a, b) => {
        const aTime = a.lastMessageAt || '';
        const bTime = b.lastMessageAt || '';
        return bTime.localeCompare(aTime);
      });
      setConversations(mapped);
    } catch (error) {
      setErrorMessage(
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message ?? 'Unable to load chats.')
          : 'Unable to load chats.',
      );
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setMode(appModeStore.get());
      const unsub = appModeStore.subscribe(setMode);
      void load();
      return () => {
        unsub();
      };
    }, [load]),
  );

  const openConversation = useCallback(
    (conversation: ChatConversationSummary) => {
      const perspective = mode === 'driving' ? 'driver' : 'rider';
      router.push(
        getChatConversationPath({
          conversationId: conversation.id,
          bookingId: conversation.bookingId,
          peerName: conversation.peer.name,
          peerSubtitle: conversation.peer.roleLabel,
          routeLabel: conversation.routeLabel,
          avatarUri: conversation.peer.avatarUri,
          perspective,
        }),
      );
    },
    [mode, router],
  );

  const openNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  return {
    mode,
    loading,
    errorMessage,
    conversations,
    openConversation,
    refresh: load,
    openNotifications,
  };
};

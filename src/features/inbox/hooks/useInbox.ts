import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { useChatConversations } from '@/features/chat';
import type { ChatConversationSummary } from '@/features/chat';
import { INBOX_SCREEN } from '../constants';
import type { InboxThread } from '../types';

export interface UseInboxResult {
  mode: 'riding' | 'driving';
  subtitle: string;
  emptyMessage: string;
  threads: InboxThread[];
  loading: boolean;
  openThread: (thread: InboxThread) => void;
  openNotifications: () => void;
  openProfile: () => void;
  refresh: () => Promise<void>;
}

const mapConversationToThread = (
  conversation: ChatConversationSummary,
  mode: 'riding' | 'driving',
): InboxThread => {
  const rideTypeUpper = String(conversation.rideType || '').toUpperCase();
  const rideType =
    rideTypeUpper === 'COMMUTE'
      ? 'office'
      : mode === 'driving'
        ? 'published'
        : 'outstation';

  return {
    id: conversation.id,
    conversationId: conversation.id,
    bookingId: conversation.bookingId,
    role: mode === 'driving' ? 'driver' : 'rider',
    rideType,
    peerName: conversation.peer.name,
    peerSubtitle:
      conversation.status === 'CLOSED'
        ? 'Chat closed'
        : conversation.peer.roleLabel || (mode === 'driving' ? 'Passenger' : 'Driver'),
    routeLabel: conversation.routeLabel,
    lastMessage: conversation.lastMessageText || (conversation.status === 'CLOSED' ? 'Chat closed' : ''),
    timeLabel: conversation.timeLabel,
    unreadCount: conversation.unreadCount,
    isOnline: conversation.status === 'OPEN',
    avatarUri: conversation.peer.avatarUri,
    status: conversation.status,
  };
};

export const useInbox = (): UseInboxResult => {
  const router = useRouter();
  const {
    mode,
    loading,
    conversations,
    openConversation,
    openNotifications,
    refresh,
  } = useChatConversations();

  const threads = useMemo((): InboxThread[] => {
    return conversations.map((item: ChatConversationSummary) =>
      mapConversationToThread(item, mode),
    );
  }, [conversations, mode]);

  const openThread = useCallback(
    (thread: InboxThread) => {
      const conversation = conversations.find(
        (item: ChatConversationSummary) => item.id === thread.id,
      );
      if (conversation) {
        openConversation(conversation);
        return;
      }
      router.push({
        pathname: '/ride-search/driver-chat',
        params: {
          conversationId: thread.conversationId || thread.id,
          bookingId: thread.bookingId || '',
          driverName: thread.peerName,
          carModel: thread.peerSubtitle,
          perspective: thread.role === 'driver' ? 'driver' : 'rider',
          routeLabel: thread.routeLabel,
          avatarUri: thread.avatarUri || '',
        },
      });
    },
    [conversations, openConversation, router],
  );

  const openProfile = useCallback(() => {
    router.push(ROUTES.profile);
  }, [router]);

  return {
    mode,
    subtitle: mode === 'driving' ? INBOX_SCREEN.subtitleDriving : INBOX_SCREEN.subtitleRiding,
    emptyMessage: mode === 'driving' ? INBOX_SCREEN.emptyDriving : INBOX_SCREEN.emptyRiding,
    threads,
    loading,
    openThread,
    openNotifications,
    openProfile,
    refresh,
  };
};

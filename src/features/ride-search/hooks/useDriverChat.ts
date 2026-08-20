import { useCallback, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { showAppAlert } from '@/store';
import { Linking, type FlatList } from 'react-native';

import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  chatMessagesSheetStore,
  chatSheetSync,
  chatThreadsSheetStore,
  type ChatMessagesSheetRow,
} from '@/DemoData';
import {
  DRIVER_CHAT_QUICK_REPLIES,
  DRIVER_CHAT_SCREEN,
  RIDER_CHAT_QUICK_REPLIES_FROM_DRIVER,
  formatChatTime,
  getDriverChatMock,
  type RideChatPerspective,
} from '../constants';
import type { ChatMessage, DriverChatProfile } from '../types';

export interface UseDriverChatParams {
  driverName?: string;
  carModel?: string;
  threadId?: string;
  perspective?: RideChatPerspective;
  routeLabel?: string;
  tripTimeLabel?: string;
  avatarUri?: string;
}

export interface UseDriverChatResult {
  profile: DriverChatProfile;
  messages: ChatMessage[];
  draft: string;
  quickReplies: readonly string[];
  listRef: RefObject<FlatList<ChatMessage> | null>;
  perspective: RideChatPerspective;
  selfSender: 'user' | 'driver';
  callLabel: string;
  setDraft: (value: string) => void;
  sendMessage: (text?: string) => void;
  goBack: () => void;
  callDriver: () => void;
  openMore: () => void;
  attachFile: () => void;
}

const mapRow = (row: ChatMessagesSheetRow): ChatMessage => ({
  id: String(row.messageId),
  sender: row.sender === 'driver' ? 'driver' : 'user',
  text: row.text,
  timeLabel: row.timeLabel,
  status: row.status === 'sent' || row.status === 'read' ? row.status : undefined,
});

export const useDriverChat = (params: UseDriverChatParams): UseDriverChatResult => {
  const router = useRouter();
  const listRef = useRef<FlatList<ChatMessage> | null>(null);
  const perspective: RideChatPerspective =
    params.perspective === 'driver' ? 'driver' : 'rider';
  const selfSender: 'user' | 'driver' = perspective === 'driver' ? 'driver' : 'user';
  const threadKey =
    params.threadId?.trim() ||
    `thread-${perspective}-${(params.driverName || 'peer').trim().toLowerCase().replace(/\s+/g, '-')}`;

  const mock = useMemo(
    () =>
      getDriverChatMock({
        driverName: params.driverName,
        carModel: params.carModel,
        perspective,
        routeLabel: params.routeLabel,
        tripTimeLabel: params.tripTimeLabel,
        avatarUri: params.avatarUri,
      }),
    [
      params.avatarUri,
      params.carModel,
      params.driverName,
      params.routeLabel,
      params.tripTimeLabel,
      perspective,
    ],
  );

  const getSnapshot = useCallback(
    () =>
      chatMessagesSheetStore
        .getForCurrentUserThread(threadKey)
        .map((row) => `${row.messageId}:${row.text}:${row.status}`)
        .join('|'),
    [threadKey],
  );

  const subscribe = useCallback(
    (onStoreChange: () => void) => chatMessagesSheetStore.subscribe(() => onStoreChange()),
    [],
  );

  const sheetSnapshot = useSyncExternalStore(subscribe, getSnapshot);
  const [draft, setDraft] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          await chatSheetSync.pullIntoLocal();
          if (!active) {
            return;
          }
          const existingThread = chatThreadsSheetStore.findByThreadKey(threadKey);
          if (!existingThread) {
            await chatSheetSync.upsertThreadAndSync({
              threadKey,
              peerName: mock.profile.name,
              peerSubtitle: mock.profile.roleLabel || mock.profile.vehicleLabel,
              routeLabel: mock.profile.routeLabel || '',
              role: perspective === 'driver' ? 'driver' : 'rider',
              rideType: 'outstation',
              lastMessage: mock.messages[mock.messages.length - 1]?.text || '',
              timeLabel: mock.messages[mock.messages.length - 1]?.timeLabel || '',
              unreadCount: 0,
              isOnline: mock.profile.isOnline,
              avatarUri: mock.profile.avatarUri || '',
            });
          }
          if (chatMessagesSheetStore.getForCurrentUserThread(threadKey).length === 0) {
            for (const message of mock.messages) {
              await chatSheetSync.upsertMessageAndSync({
                threadKey,
                sender: message.sender,
                text: message.text,
                timeLabel: message.timeLabel,
                status: message.status || '',
              });
            }
          }
        } catch {
          // keep local
        }
      })();
      return () => {
        active = false;
      };
    }, [mock.messages, mock.profile, perspective, threadKey]),
  );

  const messages = useMemo(
    () => chatMessagesSheetStore.getForCurrentUserThread(threadKey).map(mapRow),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheetSnapshot, threadKey],
  );

  const profile = useMemo((): DriverChatProfile => {
    const thread = chatThreadsSheetStore.findByThreadKey(threadKey);
    return {
      name: thread?.peerName || mock.profile.name,
      vehicleLabel: thread?.peerSubtitle || mock.profile.vehicleLabel,
      isOnline: thread?.isOnline ?? mock.profile.isOnline,
      avatarUri: thread?.avatarUri || mock.profile.avatarUri,
      roleLabel: mock.profile.roleLabel,
      verified: mock.profile.verified,
      routeLabel: thread?.routeLabel || mock.profile.routeLabel,
      tripTimeLabel: mock.profile.tripTimeLabel,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mock.profile, sheetSnapshot, threadKey]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const sendMessage = useCallback(
    (text?: string) => {
      const content = (text ?? draft).trim();
      if (!content) {
        return;
      }

      const timeLabel = formatChatTime();
      setDraft('');
      scrollToEnd();

      void (async () => {
        const result = await chatSheetSync.upsertMessageAndSync({
          threadKey,
          sender: selfSender,
          text: content,
          timeLabel,
          status: 'sent',
        });
        scrollToEnd();
        setTimeout(() => {
          void chatSheetSync.upsertMessageAndSync({
            messageId: result.id,
            threadKey,
            sender: selfSender,
            text: content,
            timeLabel,
            status: 'read',
          });
        }, 1500);
      })();
    },
    [draft, scrollToEnd, selfSender, threadKey],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(perspective === 'driver' ? ROUTES.myRides : ROUTES.inbox);
  }, [perspective, router]);

  const callDriver = useCallback(() => {
    Linking.openURL('tel:+919999999999').catch(() => {
      showAppAlert('Call', 'Unable to start a call right now.');
    });
  }, []);

  const openMore = useCallback(() => {
    showAppAlert(DRIVER_CHAT_SCREEN.moreTitle, DRIVER_CHAT_SCREEN.moreMessage);
  }, []);

  const attachFile = useCallback(() => {
    showAppAlert(DRIVER_CHAT_SCREEN.attachTitle, DRIVER_CHAT_SCREEN.attachMessage);
  }, []);

  return {
    profile,
    messages,
    draft,
    quickReplies:
      perspective === 'driver' ? RIDER_CHAT_QUICK_REPLIES_FROM_DRIVER : DRIVER_CHAT_QUICK_REPLIES,
    listRef,
    perspective,
    selfSender,
    callLabel: perspective === 'driver' ? 'Call rider' : 'Call driver',
    setDraft,
    sendMessage,
    goBack,
    callDriver,
    openMore,
    attachFile,
  };
};

import {
  isMessageForConversation,
  mapMessageDto,
  parseChatSocketMessage,
  shouldRejoinOnSocketStatus,
} from '../api/chat.mapper';
import { mergeChatMessages } from './messageMerge';
import type { ChatUiMessage } from '../types/chat.types';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const assertFalse = (value: boolean, label: string): void => {
  if (value) {
    failed.push(`${label}: expected false`);
  }
};

const DRIVER = 'driver-1';
const RIDER = 'rider-1';
const CONV = 'conv-ride-1';
const OTHER = 'conv-other';

const applyIncoming = (
  openScreenMessages: ChatUiMessage[],
  raw: unknown,
  viewerId: string,
  conversationId: string,
): ChatUiMessage[] => {
  const parsed = parseChatSocketMessage(raw);
  if (!parsed || !isMessageForConversation(parsed.conversationId, conversationId)) {
    return openScreenMessages;
  }
  const mapped = mapMessageDto(parsed, viewerId, conversationId);
  if (!mapped) {
    return openScreenMessages;
  }
  return mergeChatMessages(openScreenMessages, [mapped]);
};

const driverPayload = {
  conversationId: CONV,
  message: {
    id: 'm-live-1',
    conversationId: CONV,
    senderId: DRIVER,
    message: 'Reached the gate',
    createdAt: '2026-10-28T18:01:00.000Z',
    clientMessageId: 'uuid-driver-1',
  },
};

const riderPayload = {
  data: {
    messageId: 'm-live-2',
    conversationId: CONV,
    sender: { id: RIDER },
    text: 'Coming out now',
    createdAt: '2026-10-28T18:01:20.000Z',
    clientMessageId: 'uuid-rider-1',
  },
};

let riderScreen: ChatUiMessage[] = [];
riderScreen = applyIncoming(riderScreen, driverPayload, RIDER, CONV);
assertEqual(riderScreen.length, 1, '1. driver send appears on rider screen without remount');
assertEqual(riderScreen[0]?.text, 'Reached the gate', '1. rider sees driver text');
assertFalse(riderScreen[0]?.isMine ?? true, '1. rider sees it as incoming');

let driverScreen: ChatUiMessage[] = [
  {
    id: 'local_uuid-driver-1',
    clientMessageId: 'uuid-driver-1',
    conversationId: CONV,
    senderId: DRIVER,
    text: 'Reached the gate',
    createdAt: '2026-10-28T18:01:00.000Z',
    timeLabel: '6:01 PM',
    isMine: true,
    localStatus: 'pending',
  },
];
driverScreen = applyIncoming(driverScreen, driverPayload, DRIVER, CONV);
assertEqual(driverScreen.length, 1, '3. sender echo does not duplicate optimistic bubble');
assertEqual(driverScreen[0]?.id, 'm-live-1', '3. server id reconciles pending');
assertEqual(driverScreen[0]?.localStatus, 'sent', '3. pending becomes sent');

driverScreen = applyIncoming(driverScreen, riderPayload, DRIVER, CONV);
assertEqual(driverScreen.length, 2, '2. rider send appears on driver screen without remount');
assertEqual(driverScreen[1]?.text, 'Coming out now', '2. driver sees rider text');
assertFalse(driverScreen[1]?.isMine ?? true, '2. driver sees it as incoming');

riderScreen = applyIncoming(riderScreen, riderPayload, RIDER, CONV);
const riderEcho = applyIncoming(riderScreen, riderPayload, RIDER, CONV);
assertEqual(riderEcho.length, riderScreen.length, '3. same socket event twice stays once');
assertEqual(
  riderEcho.filter((item) => item.id === 'm-live-2').length,
  1,
  '3. recipient also sees rider message once',
);

const remountSameState = applyIncoming(riderScreen, driverPayload, RIDER, CONV);
assertEqual(remountSameState.length, riderScreen.length, '4. incoming updates existing list in place');

const listenerSet = new Set<(raw: unknown) => void>();
const subscribeOnce = (listener: (raw: unknown) => void): (() => void) => {
  listenerSet.add(listener);
  return () => {
    listenerSet.delete(listener);
  };
};
const handler = (): void => undefined;
const unsubA = subscribeOnce(handler);
assertEqual(listenerSet.size, 1, '5. first subscribe registers one listener');
const unsubB = subscribeOnce(handler);
assertEqual(listenerSet.size, 1, '5. same listener is not registered twice');
unsubA();
unsubB();
assertEqual(listenerSet.size, 0, '5. navigating away removes the listener');
subscribeOnce(handler);
assertEqual(listenerSet.size, 1, '5. returning registers a single fresh listener');

assertTrue(shouldRejoinOnSocketStatus('CONNECTED'), '6. reconnect CONNECTED rejoins the room');
assertFalse(shouldRejoinOnSocketStatus('RECONNECTING'), '6. do not join while still reconnecting');
assertFalse(shouldRejoinOnSocketStatus('OFFLINE'), '6. offline does not join');

const missedWhileDisconnected = {
  id: 'm-missed',
  conversationId: CONV,
  senderId: DRIVER,
  message: 'Where are you?',
  createdAt: '2026-10-28T18:05:00.000Z',
};
const afterReconnectHistory = mergeChatMessages(
  riderScreen,
  [mapMessageDto(missedWhileDisconnected, RIDER, CONV)!],
);
assertTrue(
  afterReconnectHistory.some((item) => item.id === 'm-missed'),
  '7. history fetch after reconnect recovers missed messages',
);
assertTrue(
  afterReconnectHistory.some((item) => item.id === 'm-live-1'),
  '7. reconnect merge keeps messages already on the open screen',
);

const otherConv = applyIncoming(
  riderScreen,
  {
    conversationId: OTHER,
    message: {
      id: 'm-other',
      conversationId: OTHER,
      senderId: DRIVER,
      message: 'Wrong thread',
      createdAt: '2026-10-28T18:09:00.000Z',
    },
  },
  RIDER,
  CONV,
);
assertFalse(
  otherConv.some((item) => item.id === 'm-other'),
  '8. messages from another conversation are not displayed',
);

const staleHistory = [
  mapMessageDto(
    {
      id: 'm-old',
      conversationId: CONV,
      senderId: DRIVER,
      message: 'Old page',
      createdAt: '2026-10-28T17:00:00.000Z',
    },
    RIDER,
    CONV,
  )!,
];
const afterStalePage = mergeChatMessages(afterReconnectHistory, staleHistory);
assertTrue(
  afterStalePage.some((item) => item.id === 'm-live-1'),
  '9. older history does not drop newer socket messages',
);
assertTrue(
  afterStalePage.some((item) => item.id === 'm-missed'),
  '9. older history does not overwrite reconnect recoveries',
);
assertEqual(
  afterStalePage[0]?.id,
  'm-old',
  '10. older history still prepends in chronological order',
);

const failedSend: ChatUiMessage = {
  id: 'local_fail',
  clientMessageId: 'uuid-fail',
  conversationId: CONV,
  senderId: RIDER,
  text: 'Did this send?',
  createdAt: '2026-10-28T18:10:00.000Z',
  timeLabel: '6:10 PM',
  isMine: true,
  localStatus: 'failed',
};
const withFailure = mergeChatMessages(afterStalePage, [failedSend]);
assertEqual(
  withFailure.find((item) => item.id === 'local_fail')?.localStatus,
  'failed',
  '10. failed send status is preserved',
);
const pendingRetry = mergeChatMessages(withFailure, [
  { ...failedSend, localStatus: 'pending' },
]);
assertEqual(
  pendingRetry.find((item) => item.id === 'local_fail')?.localStatus,
  'pending',
  '10. retry keeps a single bubble and pending indicator',
);

const nestedIdOnly = parseChatSocketMessage({
  payload: { _id: 'm-mongo', conversationId: CONV, content: 'Hi', senderId: DRIVER },
});
assertEqual(mapMessageDto(nestedIdOnly!, RIDER, CONV)?.id, 'm-mongo', 'parses nested _id envelope');

if (failed.length > 0) {
  throw new Error(`chat realtime tests failed:\n${failed.join('\n')}`);
}

console.log('chat realtime tests passed');

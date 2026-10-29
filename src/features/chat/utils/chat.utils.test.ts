import { mergeChatMessages, prependOlderMessages } from './messageMerge';
import type { ChatUiMessage } from '../types/chat.types';
import { validateChatMessageText } from './validateChatMessage';
import { createClientMessageId } from './clientMessageId';
import { mapConversationDto } from '../api/chat.mapper';

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

const msg = (partial: Partial<ChatUiMessage> & Pick<ChatUiMessage, 'id' | 'text'>): ChatUiMessage => ({
  conversationId: 'c1',
  senderId: 'u1',
  createdAt: '2026-09-06T10:00:00.000Z',
  timeLabel: '10:00 AM',
  isMine: true,
  localStatus: 'sent',
  ...partial,
});

const a = msg({ id: 'm1', text: 'Hi', createdAt: '2026-09-06T10:00:00.000Z' });
const b = msg({
  id: 'local_x',
  clientMessageId: 'x',
  text: 'Hello',
  createdAt: '2026-09-06T10:01:00.000Z',
  localStatus: 'pending',
});
const bAck = msg({
  id: 'm2',
  clientMessageId: 'x',
  text: 'Hello',
  createdAt: '2026-09-06T10:01:00.000Z',
  localStatus: 'sent',
});

const merged = mergeChatMessages([a, b], [bAck]);
assertEqual(merged.length, 2, 'reconciles pending by clientMessageId without duplicate');
assertEqual(merged[1]?.id, 'm2', 'server id wins after ack');
assertTrue(!merged.some((item) => item.id === 'local_x'), 'local pending removed');

const older = msg({ id: 'm0', text: 'Earlier', createdAt: '2026-09-06T09:00:00.000Z' });
const prepended = prependOlderMessages(merged, [older]);
assertEqual(prepended[0]?.id, 'm0', 'older message prepended chronologically');
assertEqual(prepended.length, 3, 'prepend keeps existing messages');

assertEqual(validateChatMessageText('   ').ok, false, 'rejects whitespace');
assertEqual(validateChatMessageText('hi').ok, true, 'accepts text');
assertEqual(validateChatMessageText('x'.repeat(1001)).ok, false, 'rejects >1000 chars');
assertTrue(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(createClientMessageId()), 'clientMessageId is UUID v4');

const mappedWithPhone = mapConversationDto(
  {
    id: 'conv-1',
    bookingId: 'b-1',
    otherParticipant: {
      id: 'driver-1',
      displayName: 'Ravi',
      role: 'DRIVER',
      phone: '+919876543210',
    },
  },
  'rider-1',
);
assertEqual(mappedWithPhone?.peer.phone, '+919876543210', 'maps conversation peer phone');

const mappedWithoutPhone = mapConversationDto(
  {
    id: 'conv-2',
    bookingId: 'b-2',
    otherParticipant: {
      id: 'passenger-1',
      displayName: 'Asha',
      role: 'PASSENGER',
    },
  },
  'driver-1',
);
assertEqual(mappedWithoutPhone?.peer.phone, undefined, 'does not invent peer phone');

if (failed.length > 0) {
  throw new Error(`chat utils tests failed:\n${failed.join('\n')}`);
}

console.log('chat utils tests passed');

import type {
  ChatConversationDto,
  ChatMessageDto,
  ChatParticipantDto,
} from '../api/chat.types';
import type {
  ChatConversationStatus,
  ChatConversationSummary,
  ChatPeer,
  ChatUiMessage,
} from '../types/chat.types';

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const shortPlace = (value: string): string => {
  const segment = value.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value;
};

export const formatChatClock = (iso?: string | null): string => {
  if (!iso?.trim()) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatChatListTime = (iso?: string | null): string => {
  if (!iso?.trim()) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return formatChatClock(iso);
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { weekday: 'short' });
};

const asMessageText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const resolveMessageText = (dto: ChatMessageDto | null | undefined): string => {
  if (!dto) {
    return '';
  }
  return (
    asMessageText(dto.message) ||
    asMessageText(dto.body) ||
    asMessageText(dto.text) ||
    asMessageText(dto.content)
  );
};

export const resolveParticipantPhone = (peer: ChatParticipantDto | null | undefined): string =>
  readText(peer?.phone) || readText(peer?.phoneNumber) || readText(peer?.mobile);

const resolveParticipantName = (peer: ChatParticipantDto | null | undefined): string => {
  if (!peer) {
    return '';
  }
  const composed = [readText(peer.firstName), readText(peer.lastName)].filter(Boolean).join(' ');
  return (
    readText(peer.displayName) ||
    readText(peer.fullName) ||
    readText(peer.name) ||
    composed
  );
};

const pickOtherParticipant = (
  dto: ChatConversationDto,
  currentUserId?: string | null,
): ChatParticipantDto | null => {
  const candidates = [
    dto.otherParticipant,
    dto.peer,
    dto.counterpart,
    dto.passenger,
    dto.driver,
  ].filter(Boolean) as ChatParticipantDto[];

  if (currentUserId) {
    const other = candidates.find((item) => readText(item.id) && readText(item.id) !== currentUserId);
    if (other) {
      return other;
    }
  }
  return candidates[0] ?? null;
};

export const mapConversationStatus = (raw: unknown): ChatConversationStatus => {
  const value = String(raw ?? '').trim().toUpperCase();
  return value === 'CLOSED' ? 'CLOSED' : 'OPEN';
};

const mapPeer = (
  dto: ChatConversationDto,
  currentUserId?: string | null,
): ChatPeer => {
  const peer = pickOtherParticipant(dto, currentUserId);
  const name = resolveParticipantName(peer) || 'BhaiWay User';
  const roleRaw = String(peer?.role ?? '').toUpperCase();
  return {
    id: readText(peer?.id),
    name,
    avatarUri: readText(peer?.profilePhoto) || undefined,
    roleLabel: roleRaw === 'DRIVER' ? 'Driver' : roleRaw === 'PASSENGER' ? 'Passenger' : undefined,
    phone: resolveParticipantPhone(peer) || undefined,
  };
};

const mapRouteLabel = (dto: ChatConversationDto): string => {
  const explicit = readText(dto.routeLabel);
  if (explicit) {
    return explicit;
  }
  const source = shortPlace(readText(dto.source) || readText(dto.ride?.source));
  const destination = shortPlace(readText(dto.destination) || readText(dto.ride?.destination));
  if (source && destination) {
    return `${source} → ${destination}`;
  }
  return source || destination || '';
};

const mapLastMessageText = (dto: ChatConversationDto): string => {
  if (typeof dto.lastMessage === 'string') {
    return dto.lastMessage.trim();
  }
  return resolveMessageText(dto.lastMessage ?? undefined);
};

const mapLastMessageAt = (dto: ChatConversationDto): string | null => {
  if (typeof dto.lastMessage === 'object' && dto.lastMessage) {
    const fromMsg = readText(dto.lastMessage.createdAt);
    if (fromMsg) {
      return fromMsg;
    }
  }
  return readText(dto.lastMessageAt) || readText(dto.updatedAt) || readText(dto.createdAt) || null;
};

export const mapConversationDto = (
  dto: ChatConversationDto,
  currentUserId?: string | null,
): ChatConversationSummary | null => {
  const id = readText(dto.id);
  if (!id) {
    return null;
  }
  const bookingId =
    readText(dto.bookingId) || readText(dto.booking?.id) || '';
  const rideId = readText(dto.rideId) || readText(dto.ride?.id) || readText(dto.booking?.rideId);
  const lastMessageAt = mapLastMessageAt(dto);
  const rideTypeRaw = (
    readText(dto.rideType) ||
    readText(dto.bookingMode) ||
    readText(dto.ride?.rideType) ||
    'REGULAR'
  ).toUpperCase();

  return {
    id,
    bookingId,
    rideId,
    status: mapConversationStatus(dto.status),
    rideType: rideTypeRaw,
    peer: mapPeer(dto, currentUserId),
    routeLabel: mapRouteLabel(dto),
    lastMessageText: mapLastMessageText(dto),
    lastMessageAt,
    timeLabel: formatChatListTime(lastMessageAt),
    unreadCount: Math.max(0, Math.floor(Number(dto.unreadCount) || 0)),
    closedReason: readText(dto.closedReason) || undefined,
  };
};

const resolveMessageId = (dto: ChatMessageDto): string =>
  readText(dto.id) || readText(dto._id) || readText(dto.messageId);

const resolveSenderId = (dto: ChatMessageDto): string => {
  const nestedSender = asRecord(dto.sender);
  const senderAsString = typeof dto.sender === 'string' ? readText(dto.sender) : '';
  return (
    readText(dto.senderId) ||
    readText(dto.senderUserId) ||
    readText(dto.userId) ||
    readText(nestedSender?.id) ||
    senderAsString
  );
};

/**
 * Socket.IO `chat:message` may be the DTO, or `{ message }`, `{ data }`, `{ payload }`.
 * Do not log message text.
 */
export const parseChatSocketMessage = (raw: unknown): ChatMessageDto | null => {
  const root = asRecord(raw);
  if (!root) {
    return null;
  }

  const nestedCandidates = [
    asRecord(root.message),
    asRecord(root.data),
    asRecord(root.payload),
    asRecord(root.body),
    asRecord(asRecord(root.data)?.message),
    asRecord(asRecord(root.payload)?.message),
  ].filter(Boolean) as Record<string, unknown>[];

  const nested = nestedCandidates.find((item) => {
    const dto = item as ChatMessageDto;
    return Boolean(resolveMessageId(dto) || resolveMessageText(dto));
  });

  const merged: ChatMessageDto = nested
    ? ({ ...root, ...nested } as ChatMessageDto)
    : (root as ChatMessageDto);
  if (asRecord(merged.message)) {
    delete merged.message;
  }
  merged.conversationId =
    readText(nested?.conversationId as string | undefined) ||
    readText(root.conversationId as string | undefined) ||
    merged.conversationId;
  if (!resolveMessageId(merged) && !resolveMessageText(merged)) {
    return null;
  }
  return merged;
};

export const isMessageForConversation = (
  messageConversationId: string | null | undefined,
  activeConversationId: string,
): boolean => {
  const active = activeConversationId.trim();
  if (!active) {
    return false;
  }
  const cid = String(messageConversationId ?? '').trim();
  if (!cid) {
    return true;
  }
  return cid === active;
};

export const shouldRejoinOnSocketStatus = (status: string): boolean =>
  status === 'CONNECTED';

export const mapMessageDto = (
  dto: ChatMessageDto,
  currentUserId: string,
  conversationIdFallback?: string,
): ChatUiMessage | null => {
  const id = resolveMessageId(dto);
  const text = resolveMessageText(dto);
  if (!id || !text) {
    return null;
  }
  const senderId = resolveSenderId(dto);
  const createdAt = readText(dto.createdAt) || new Date().toISOString();
  const isMine = Boolean(currentUserId) && senderId === currentUserId;
  const isRead = dto.isRead === true || Boolean(readText(dto.readAt));
  return {
    id,
    clientMessageId: readText(dto.clientMessageId) || undefined,
    conversationId: readText(dto.conversationId) || conversationIdFallback || '',
    senderId,
    text,
    createdAt,
    timeLabel: formatChatClock(createdAt),
    isMine,
    localStatus: isMine ? (isRead ? 'read' : 'sent') : 'sent',
  };
};

/** Extract conversation id from booking payloads when backend embeds it. */
export const extractConversationIdFromBooking = (booking: unknown): string | null => {
  const record = asRecord(booking);
  if (!record) {
    return null;
  }
  const direct =
    readText(record.conversationId) ||
    readText(asRecord(record.conversation)?.id) ||
    readText(asRecord(record.chat)?.conversationId) ||
    readText(asRecord(record.chat)?.id);
  return direct || null;
};

export const extractConversationStatusFromBooking = (
  booking: unknown,
): ChatConversationStatus | null => {
  const record = asRecord(booking);
  if (!record) {
    return null;
  }
  const nested =
    asRecord(record.conversation)?.status ??
    asRecord(record.chat)?.status ??
    record.conversationStatus ??
    record.chatStatus;
  if (nested == null || nested === '') {
    return null;
  }
  return mapConversationStatus(nested);
};

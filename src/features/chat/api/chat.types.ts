/**
 * Backend chat REST / Socket.IO DTOs.
 * Field aliases are accepted in mappers — do not invent sender identity client-side.
 */

export type ApiChatConversationStatus = 'OPEN' | 'CLOSED' | string;

export type ApiChatMessageAckStatus = 'SENT' | 'DUPLICATE' | string;

export interface ChatParticipantDto {
  id?: string | null;
  displayName?: string | null;
  name?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profilePhoto?: string | null;
  role?: 'DRIVER' | 'PASSENGER' | 'driver' | 'passenger' | string | null;
  /** Contact — map Call only when the conversation DTO includes a number. */
  phone?: string | null;
  phoneNumber?: string | null;
  mobile?: string | null;
}

export interface ChatMessageDto {
  id?: string | null;
  _id?: string | null;
  messageId?: string | null;
  conversationId?: string | null;
  senderId?: string | null;
  userId?: string | null;
  senderUserId?: string | null;
  sender?: { id?: string | null } | string | null;
  clientMessageId?: string | null;
  messageType?: 'TEXT' | string | null;
  /** Prefer `message`; also accept body/text/content. */
  message?: string | null;
  body?: string | null;
  text?: string | null;
  content?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  readAt?: string | null;
  isRead?: boolean | null;
}

export interface ChatConversationDto {
  id: string;
  bookingId?: string | null;
  rideId?: string | null;
  status?: ApiChatConversationStatus | null;
  rideType?: string | null;
  bookingMode?: string | null;
  source?: string | null;
  destination?: string | null;
  routeLabel?: string | null;
  departureDate?: string | null;
  departureTime?: string | null;
  closedReason?: string | null;
  closedAt?: string | null;
  unreadCount?: number | null;
  lastMessage?: ChatMessageDto | string | null;
  lastMessageAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  otherParticipant?: ChatParticipantDto | null;
  peer?: ChatParticipantDto | null;
  counterpart?: ChatParticipantDto | null;
  driver?: ChatParticipantDto | null;
  passenger?: ChatParticipantDto | null;
  /** When backend nests booking summary. */
  booking?: {
    id?: string | null;
    status?: string | null;
    rideId?: string | null;
  } | null;
  ride?: {
    id?: string | null;
    rideType?: string | null;
    source?: string | null;
    destination?: string | null;
  } | null;
}

export interface ChatConversationsListDto {
  items?: ChatConversationDto[];
  conversations?: ChatConversationDto[];
  data?: ChatConversationDto[];
  results?: ChatConversationDto[];
}

export interface ChatMessagesListDto {
  items?: ChatMessageDto[];
  messages?: ChatMessageDto[];
  data?: ChatMessageDto[];
  results?: ChatMessageDto[];
  hasMore?: boolean | null;
  nextBefore?: string | null;
}

export interface SendChatMessageDto {
  clientMessageId: string;
  message: string;
  /** Backend accepts TEXT only. */
  messageType?: 'TEXT';
}

export interface SendChatMessageResultDto {
  status?: ApiChatMessageAckStatus | null;
  clientMessageId?: string | null;
  messageId?: string | null;
  id?: string | null;
  message?: ChatMessageDto | null;
}

export interface MarkChatReadDto {
  /** Optional cursor — mark messages up to and including this id as read. */
  upToMessageId?: string;
}

export interface ListChatMessagesQuery {
  limit?: number;
  /** Cursor: load messages older than this message id. */
  before?: string;
}

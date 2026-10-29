export type ChatConversationStatus = 'OPEN' | 'CLOSED';

export type ChatMessageLocalStatus = 'pending' | 'sent' | 'failed' | 'read';

export interface ChatPeer {
  id: string;
  name: string;
  avatarUri?: string;
  roleLabel?: string;
  /** Present only when conversation or booking snapshot includes a number. */
  phone?: string;
}

export interface ChatConversationSummary {
  id: string;
  bookingId: string;
  rideId: string;
  status: ChatConversationStatus;
  rideType: 'REGULAR' | 'ASSURED' | 'COMMUTE' | string;
  peer: ChatPeer;
  routeLabel: string;
  lastMessageText: string;
  lastMessageAt: string | null;
  timeLabel: string;
  unreadCount: number;
  closedReason?: string;
}

export interface ChatUiMessage {
  id: string;
  clientMessageId?: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  timeLabel: string;
  /** True when senderId matches the logged-in user. */
  isMine: boolean;
  localStatus: ChatMessageLocalStatus;
}

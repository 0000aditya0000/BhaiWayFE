export type InboxRideType = 'outstation' | 'office' | 'published';

export interface InboxThread {
  id: string;
  conversationId?: string;
  bookingId?: string;
  role: 'rider' | 'driver';
  rideType: InboxRideType;
  peerName: string;
  peerSubtitle: string;
  routeLabel: string;
  lastMessage: string;
  timeLabel: string;
  unreadCount: number;
  isOnline: boolean;
  avatarUri?: string;
  status?: 'OPEN' | 'CLOSED';
}

import { ROUTES } from '@/config';

import type { InboxRideType, InboxThread } from '../types';

export const INBOX_SCREEN = {
  title: 'Inbox',
  subtitleRiding: 'Chats with your drivers',
  subtitleDriving: 'Chats with your riders',
  emptyTitle: 'No conversations yet',
  emptyRiding:
    'Book an Outstation Carpool or Daily Office Commute ride to chat with your driver.',
  emptyDriving:
    'Publish a Carpool Ride and chat with riders who book seats on your trip.',
} as const;

export const INBOX_RIDE_TYPE_LABEL: Record<InboxRideType, string> = {
  outstation: 'Outstation',
  office: 'Office',
  published: 'Published',
};

/** @deprecated Mock threads removed — Inbox loads GET /chat/conversations. */
export const INBOX_MOCK_THREADS: readonly InboxThread[] = [];

export const getInboxChatPath = (thread: InboxThread) => ({
  pathname: ROUTES.rideSearchDriverChat,
  params: {
    conversationId: thread.conversationId || thread.id,
    bookingId: thread.bookingId || '',
    driverName: thread.peerName,
    carModel: thread.peerSubtitle,
    threadId: thread.conversationId || thread.id,
    perspective: thread.role === 'driver' ? 'driver' : 'rider',
    role: thread.role,
    rideType: thread.rideType,
    routeLabel: thread.routeLabel,
    avatarUri: thread.avatarUri || '',
  },
});

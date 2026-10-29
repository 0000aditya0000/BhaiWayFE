export type ChatNavigationPerspective = 'rider' | 'driver';

export const getChatConversationPath = (params: {
  conversationId?: string;
  bookingId?: string;
  peerName?: string;
  peerSubtitle?: string;
  routeLabel?: string;
  tripTimeLabel?: string;
  avatarUri?: string;
  perspective?: ChatNavigationPerspective;
}) => ({
  pathname: '/ride-search/driver-chat' as const,
  params: {
    conversationId: params.conversationId ?? '',
    bookingId: params.bookingId ?? '',
    driverName: params.peerName ?? '',
    carModel: params.peerSubtitle ?? '',
    threadId: params.conversationId || params.bookingId || '',
    perspective: params.perspective ?? 'rider',
    routeLabel: params.routeLabel ?? '',
    tripTimeLabel: params.tripTimeLabel ?? '',
    avatarUri: params.avatarUri ?? '',
  },
});

/** Backend NotificationType — OpenAPI / notifications module. */
export type InboxNotificationType =
  | 'BOOKING_RECEIVED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'COMMUTE_BOOKING_REQUESTED'
  | 'COMMUTE_BOOKING_CONFIRMED'
  | 'COMMUTE_BOOKING_CANCELLED'
  | 'ASSURED_RIDE_PUBLISHED'
  | 'WALLET_CREDITED'
  | 'AADHAAR_VERIFICATION_REWARD'
  | 'REFERRAL_REWARD_REFERRER'
  | 'REFERRAL_REWARD_REFERRED'
  | 'CHAT_MESSAGE'
  | 'WITHDRAWAL_INITIATED'
  | 'WITHDRAWAL_PROCESSING'
  | 'WITHDRAWAL_COMPLETED'
  | 'SUPPORT_TICKET_CREATED'
  | 'SUPPORT_TICKET_IN_PROGRESS'
  | 'SUPPORT_TICKET_RESOLVED'
  | 'SUPPORT_TICKET_COMMENT'
  | string;

/** Structured navigation payload from backend (NotificationDataPayload). */
export type InboxNotificationData = Record<string, string | number | boolean | null> & {
  type?: InboxNotificationType | string;
};

/** GET /notifications item — NotificationItemDto */
export interface InboxNotificationDto {
  id: string;
  title: string;
  body: string;
  type: InboxNotificationType;
  data: InboxNotificationData;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

/** GET /notifications — NotificationPageDto */
export interface InboxNotificationPageDto {
  items: InboxNotificationDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListInboxNotificationsQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

/** GET /notifications/unread-count — NotificationUnreadCountDto */
export interface InboxUnreadCountDto {
  count: number;
}

/** PATCH /notifications/read-all — MarkAllNotificationsReadDto */
export interface MarkAllInboxReadDto {
  updatedCount: number;
}

/** Backend push notification `data.type` values. */
export type PushNotificationType =
  | 'BOOKING_RECEIVED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'COMMUTE_BOOKING_REQUESTED'
  | 'COMMUTE_BOOKING_CONFIRMED'
  | 'COMMUTE_BOOKING_CANCELLED'
  | 'ASSURED_RIDE_PUBLISHED'
  | 'WALLET_CREDITED'
  | 'CHAT_MESSAGE'
  | 'SUPPORT_TICKET_CREATED'
  | 'SUPPORT_TICKET_IN_PROGRESS'
  | 'SUPPORT_TICKET_RESOLVED'
  | 'SUPPORT_TICKET_COMMENT'
  | 'SOS_TRIGGERED'
  | 'SOS_DRIVER_ALERT'
  | 'SOS_PASSENGER_ALERT'
  | 'SOS_RESOLVED'
  | 'SOS_FALSE_ALARM'
  | 'SOS_ACKNOWLEDGED'
  | 'SOS_RESPONDING'
  | string;

export type PushDevicePlatform = 'ANDROID' | 'IOS';

export interface RegisterPushDeviceDto {
  token: string;
  platform: PushDevicePlatform;
  deviceId?: string;
  appVersion?: string;
}

/** Flattened data payload from FCM `data` (all values are strings). */
export interface PushNotificationData {
  type?: PushNotificationType;
  bookingId?: string;
  rideId?: string;
  conversationId?: string;
  messageId?: string;
  transactionId?: string;
  bookingMode?: string;
  amount?: string;
  currency?: string;
  ticketId?: string;
  ticketReference?: string;
  commentId?: string;
  event?: string;
  sosId?: string;
  [key: string]: string | undefined;
}

export interface ParsedPushNotification {
  title: string;
  body: string;
  data: PushNotificationData;
}

import { noShowClaimStore } from '@/features/no-show/store/noShowClaimStore';

import type { PushNotificationData } from '../api/pushDevices.types';
import { getPushType } from './parsePushNotification';

export type PushNavigationTarget = {
  pathname: string;
  params?: Record<string, string>;
};

const chatPath = (conversationId: string, bookingId?: string): PushNavigationTarget => ({
  pathname: '/ride-search/driver-chat',
  params: {
    conversationId,
    bookingId: bookingId ?? '',
    driverName: '',
    carModel: '',
    threadId: conversationId || bookingId || '',
    perspective: 'rider',
    routeLabel: '',
    tripTimeLabel: '',
    avatarUri: '',
  },
});

const riderBookingPath = (
  bookingId: string,
  rideId?: string,
  claimId?: string,
): PushNavigationTarget => ({
  pathname: '/my-rides/rider-booking',
  params: {
    bookingId,
    rideId: rideId?.trim() || '',
    claimId: claimId?.trim() || '',
  },
});

const tripDetailsPath = (
  rideId: string,
  rideType?: 'assured' | 'regular' | 'commute',
): PushNavigationTarget => ({
  pathname: '/my-rides/trip-details',
  params: {
    rideId,
    ...(rideType ? { rideType } : {}),
  },
});

const commuteBookedPath = (
  rideId: string,
  bookingId: string | undefined,
  status?: string,
): PushNavigationTarget => ({
  pathname: '/office-commute/booked',
  params: {
    rideId,
    bookingId: bookingId ?? '',
    origin: '',
    destination: '',
    driverName: '',
    carModel: '',
    price: '',
    seats: '',
    status: status ?? '',
  },
});

const readPushId = (data: PushNotificationData, ...keys: string[]): string => {
  for (const key of keys) {
    const value = String(data[key] ?? '').trim();
    if (value) {
      return value;
    }
  }
  return '';
};

/** Driver commute pending-request UI — same screen as My Rides → Ride Details. */
const driverCommuteRequestPath = (rideId: string): PushNavigationTarget => ({
  pathname: '/my-rides/track',
  params: {
    rideId,
    rideType: 'commute',
  },
});

const commuteBookingRequestsPath = (): PushNavigationTarget => ({
  pathname: '/my-rides/booking-requests',
});

const resolveCommuteDriverRequestTarget = (rideId: string): PushNavigationTarget =>
  rideId ? driverCommuteRequestPath(rideId) : commuteBookingRequestsPath();

const isCommuteBookingRequestType = (type: string, bookingMode: string): boolean =>
  type === 'COMMUTE_BOOKING_REQUESTED' ||
  type === 'COMMUTE_BOOKING_REQUEST' ||
  (type === 'BOOKING_RECEIVED' && bookingMode === 'COMMUTE');

const SUPPORT_TICKET_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const supportTicketDetailPath = (ticketId: string): PushNavigationTarget => ({
  pathname: '/support-ticket-detail',
  params: { ticketId },
});

/**
 * Map FCM data.type → existing app routes.
 * Missing required IDs fall back to a safe list/home screen (never crash).
 */
export const resolvePushNavigationTarget = (
  data: PushNotificationData,
): PushNavigationTarget => {
  const type = getPushType(data) || readPushId(data, 'event').toUpperCase();
  const bookingId = readPushId(data, 'bookingId', 'booking_id', 'bookingID');
  const rideId = readPushId(data, 'rideId', 'ride_id', 'rideID');
  const conversationId = readPushId(data, 'conversationId', 'conversation_id');
  const bookingMode = readPushId(data, 'bookingMode', 'booking_mode').toUpperCase();
  const ticketId = data.ticketId?.trim() || '';
  const claimId = data.claimId?.trim() || '';
  const noShowKind = String(data.kind ?? '').trim().toUpperCase();

  if (claimId && rideId) {
    noShowClaimStore.rememberFromPayload({
      claimId,
      rideId,
      bookingId,
      kind: noShowKind,
    });
  }

  switch (type) {
    case 'CHAT_MESSAGE': {
      if (conversationId) {
        return chatPath(conversationId, bookingId || undefined);
      }
      return { pathname: '/inbox' };
    }

    case 'WALLET_CREDITED':
      return { pathname: '/wallet' };

    case 'COMMUTE_BOOKING_REQUESTED':
    case 'COMMUTE_BOOKING_REQUEST':
      return resolveCommuteDriverRequestTarget(rideId);

    case 'COMMUTE_BOOKING_CONFIRMED':
    case 'COMMUTE_BOOKING_CANCELLED': {
      if (rideId || bookingId) {
        return commuteBookedPath(
          rideId || bookingId,
          bookingId || undefined,
          type === 'COMMUTE_BOOKING_CONFIRMED' ? 'CONFIRMED' : 'CANCELLED',
        );
      }
      return { pathname: '/my-rides' };
    }

    case 'BOOKING_RECEIVED': {
      if (isCommuteBookingRequestType(type, bookingMode)) {
        return resolveCommuteDriverRequestTarget(rideId);
      }
      if (rideId) {
        return tripDetailsPath(rideId, bookingMode === 'ASSURED' ? 'assured' : 'regular');
      }
      return commuteBookingRequestsPath();
    }

    case 'ASSURED_RIDE_PUBLISHED': {
      if (rideId) {
        return tripDetailsPath(rideId, 'assured');
      }
      return { pathname: '/my-rides' };
    }

    case 'BOOKING_CONFIRMED':
    case 'BOOKING_CANCELLED': {
      if (bookingMode === 'COMMUTE') {
        if (rideId || bookingId) {
          return commuteBookedPath(rideId || bookingId, bookingId || undefined);
        }
      }
      if (bookingId) {
        return riderBookingPath(bookingId, rideId || undefined);
      }
      if (rideId) {
        return tripDetailsPath(rideId);
      }
      return { pathname: '/my-rides' };
    }

    case 'SUPPORT_TICKET_CREATED':
    case 'SUPPORT_TICKET_IN_PROGRESS':
    case 'SUPPORT_TICKET_RESOLVED':
    case 'SUPPORT_TICKET_COMMENT': {
      if (SUPPORT_TICKET_UUID_RE.test(ticketId)) {
        return supportTicketDetailPath(ticketId);
      }
      return { pathname: '/support-tickets' };
    }

    case 'SOS_TRIGGERED':
    case 'SOS_DRIVER_ALERT':
    case 'SOS_PASSENGER_ALERT':
    case 'SOS_RESOLVED':
    case 'SOS_FALSE_ALARM':
    case 'SOS_ACKNOWLEDGED':
    case 'SOS_RESPONDING': {
      if (type === 'SOS_DRIVER_ALERT' && rideId) {
        return {
          pathname: '/my-rides/active-trip',
          params: { rideId, rideType: 'regular' },
        };
      }
      if (bookingId && rideId) {
        return {
          pathname: '/ride-search/live-tracking',
          params: { rideId, bookingId, rideType: 'regular' },
        };
      }
      if (rideId) {
        return { pathname: '/home' };
      }
      return { pathname: '/my-rides' };
    }

    case 'NO_SHOW_CLAIM_OPENED':
    case 'NO_SHOW_CLAIM_APPROVED':
    case 'NO_SHOW_CLAIM_REJECTED':
    case 'NO_SHOW_CLAIM_TIMEOUT': {
      if (claimId) {
        return {
          pathname: '/no-show-claim',
          params: {
            claimId,
            rideId,
            bookingId,
            kind: noShowKind,
          },
        };
      }
      if (bookingId) {
        return riderBookingPath(bookingId, rideId || undefined);
      }
      return { pathname: '/my-rides' };
    }

    default: {
      if (isCommuteBookingRequestType(type, bookingMode) || bookingMode === 'COMMUTE') {
        if (type.includes('CONFIRM') || type.includes('CANCEL')) {
          if (rideId || bookingId) {
            return commuteBookedPath(rideId || bookingId, bookingId || undefined);
          }
        }
        return resolveCommuteDriverRequestTarget(rideId);
      }
      if (conversationId) {
        return chatPath(conversationId, bookingId || undefined);
      }
      if (bookingId) {
        return riderBookingPath(bookingId, rideId || undefined);
      }
      if (rideId) {
        return tripDetailsPath(rideId);
      }
      return { pathname: '/home' };
    }
  }
};

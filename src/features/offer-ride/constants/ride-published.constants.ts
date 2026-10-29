import { BHAIWAY_COIN_NAME, formatBhaiWayCoins } from '@/shared/utils';

export const RIDE_PUBLISHED_SCREEN = {
  brandName: 'BhaiWay',
  title: 'Ride Published Successfully!',
  subtitle: 'Your ride is now live for others to join.',
  assuredTitle: 'Ride Submitted Successfully',
  assuredSubtitle:
    'Your Assured Ride is being processed. We\'ll update its status once it is approved.',
  pickupLabel: 'Pickup',
  dropLabel: 'Drop-off',
  dateTimeLabel: 'Date & Time',
  availabilityLabel: 'Availability',
  seatsAvailableSuffix: 'Seats Available',
  fareLabel: 'Fare per seat',
  manageRidesLabel: 'Manage My Rides',
  shareRideLabel: 'Share Ride',
  refundableTitle: (amount: string) => `${formatBhaiWayCoins(Number(amount), { spaced: false, minimumFractionDigits: 2 })} Refundable Amount`,
  refundableBody: 'Will be refunded after trip ends.',
  assuredNote:
    'You have published an assured ride. If you cancel, the amount will not be refunded.',
  assuredNotePrefix: 'Note:',
  defaultRefundableAmount: '50.00',
  fallbackPickup: 'Pickup location',
  fallbackDrop: 'Drop-off location',
  shareMessage: (pickup: string, dropoff: string, when: string, price: string) =>
    `I've published a BhaiWay carpool ride!\n${pickup} → ${dropoff}\n${when}\n${formatBhaiWayCoins(Number(price), { spaced: false })} per seat\nJoin me on BhaiWay with ${BHAIWAY_COIN_NAME}!`,
} as const;

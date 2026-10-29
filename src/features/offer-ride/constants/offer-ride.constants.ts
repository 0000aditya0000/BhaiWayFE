import type { OutstationRideTypeOption } from '../types';

export const OUTSTATION_RIDE_SCREEN = {
  title: 'Publish Carpool Ride',
} as const;

export const OUTSTATION_RIDE_INTRO = {
  title: 'Choose your ride type',
  subtitle: 'Compare plans and pick what fits this trip.',
} as const;

export const OUTSTATION_INCENTIVE = {
  message: 'Assured rides help you earn 1.5× more',
} as const;

export const OUTSTATION_HERO_IMAGE = require('../../../../assets/images/offer-ride/outstation-hero.png');

export const OUTSTATION_RIDE_TYPES: readonly OutstationRideTypeOption[] = [
  {
    id: 'regular',
    title: 'Regular Ride',
    icon: 'car-outline',
    iconVariant: 'muted',
    description: 'Flexible intercity sharing for everyday trips.',
    buttonLabel: 'Select Regular',
    buttonVariant: 'accent',
    perks: ['No deposit required', 'Flexible cancel', 'Standard payout'],
  },
  {
    id: 'assured',
    title: 'Assured Ride',
    icon: 'shield-checkmark',
    iconVariant: 'dark',
    description: 'Guaranteed seats with premium upfront earnings.',
    buttonLabel: 'Select Assured',
    buttonVariant: 'primary',
    highlighted: true,
    badge: 'Recommended',
    note: 'Cancellation fees apply',
    perks: ['1.5× earnings', 'Premium booking fee', 'Priority listing'],
  },
] as const;

export {
  DEFAULT_PUBLISH_DRAFT,
  PUBLISH_RIDE_SCREEN,
  SELECT_LOCATION_SCREEN,
  PUBLISH_SEAT_LIMITS,
  getPublishRidePath,
  getSelectLocationPath,
  getRidePreferencesPath,
  formatTimeLabel,
  parseTimeLabel,
} from './publish-ride.constants';

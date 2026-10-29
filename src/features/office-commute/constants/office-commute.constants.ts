import { ROUTES } from '@/config';

import type { CommuteOption } from '../types';

export const OFFICE_COMMUTE_INTRO = {
  title: 'Office Commute',
  subtitle: 'Publish your office ride or book a seat with verified colleagues.',
} as const;

export const VERIFICATION_BANNER = {
  title: 'Verified Identity Required',
  description:
    'To ensure safety, all BhaiWay commuters are recommended to verify their corporate identity before publishing or booking rides for smooth onboarding.',
  actionLabel: 'Complete Verification',
} as const;

export const VERIFIED_BANNER = {
  title: 'Corporate Identity Verified',
  description:
    'Your workspace email is verified. You can publish and book office rides with verified colleagues.',
} as const;

export const OFFICE_COMMUTE_OPTIONS: readonly CommuteOption[] = [
  {
    id: 'publish',
    badge: 'EARN PER TRIP',
    badgeVariant: 'primary',
    title: 'Publish Office Commute',
    icon: 'car-outline',
    description:
      'Are you driving to work? Offer your empty seats to colleagues and reduce travel costs while helping the community.',
    actionLabel: 'Create a ride',
    image: require('../../../../assets/images/home/publish-carpool-ride.png'),
    route: ROUTES.officeCommutePublish,
    searchMode: 'publish',
  },
  {
    id: 'book',
    badge: 'RELIABLE & SAFE',
    badgeVariant: 'light',
    title: 'Book Ride for Office Commute',
    icon: 'people-outline',
    description:
      'Looking for a comfortable ride to work? Find colleagues driving your way and book a seat in a few simple taps.',
    actionLabel: 'Find a ride',
    image: require('../../../../assets/images/home/daily-commute.png'),
    route: ROUTES.officeCommuteSearch,
    searchMode: 'office',
  },
] as const;

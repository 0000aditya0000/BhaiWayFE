import type { HomeCategory, HomeLocation, ServiceCardData } from '../types';

export const HOME_GREETING = {
  prefix: 'Hi',
  hint: 'Where are you headed?',
} as const;

export const HOME_HIGHLIGHTS = [
  { id: 'verified', icon: 'shield-checkmark-outline', label: 'Verified riders' },
  { id: 'split', icon: 'wallet-outline', label: 'Split costs' },
  { id: 'eco', icon: 'leaf-outline', label: 'Eco-friendly' },
] as const;

export const HOME_FOOTER = {
  madeWithPrefix: 'Made with',
  atPrefix: 'at',
  brand: 'Kodenzo Labs',
  websiteUrl: 'https://kodenzolabs.in',
} as const;

export const DEFAULT_HOME_LOCATION: HomeLocation = {
  label: 'Locating…',
  city: '',
};

/** Category cards on Home — each nests Publish + Book actions. */
export const HOME_CATEGORIES: readonly HomeCategory[] = [
  {
    id: 'outstation',
    title: 'Outstation',
    subtitle: 'Share the road across cities — publish a trip or hop into one.',
    badge: 'Intercity',
    badgeIcon: 'car-sport-outline',
    enabled: true,
    actions: [
      {
        id: 'outstation-publish',
        title: 'Publish Ride',
        subtitle: 'Offer seats & earn',
        icon: 'navigate-circle-outline',
        cta: 'Start',
      },
      {
        id: 'outstation-book',
        title: 'Book Ride',
        subtitle: 'Find a carpool',
        icon: 'search-outline',
        cta: 'Explore',
      },
    ],
  },
  {
    id: 'office',
    title: 'Office Commute',
    subtitle: 'Your weekday route with verified colleagues — offer or join.',
    badge: 'Daily',
    badgeIcon: 'briefcase-outline',
    enabled: true,
    actions: [
      {
        id: 'office-publish',
        title: 'Publish Ride',
        subtitle: 'Share office seats',
        icon: 'car-outline',
        cta: 'Start',
      },
      {
        id: 'office-book',
        title: 'Book Ride',
        subtitle: 'Ride with coworkers',
        icon: 'people-outline',
        cta: 'Explore',
      },
    ],
  },
] as const;

/** @deprecated Flat cards — prefer HOME_CATEGORIES. Kept for mapper / legacy. */
export const HOME_SERVICE_CARDS: readonly ServiceCardData[] = [
  {
    id: 'outstation-carpool',
    variant: 'outstation',
    badge: 'Intercity',
    badgeIcon: 'car-sport-outline',
    title: 'Outstation Carpool',
    subtitle: 'Share rides, split costs, and travel comfortably across cities.',
    compactSubtitle: 'Intercity rides, shared costs',
    actionLabel: 'Book Now',
    enabled: true,
  },
  {
    id: 'daily-office-commute',
    variant: 'office',
    badge: 'Office',
    badgeIcon: 'briefcase-outline',
    title: 'Office Commute',
    subtitle:
      'Find trusted companions for your daily office routes. Build connections while saving on travel.',
    compactSubtitle: 'Trusted daily office routes',
    actionLabel: 'Book Now',
    enabled: true,
  },
  {
    id: 'publish-carpool-ride',
    variant: 'publish',
    badge: 'Driver',
    badgeIcon: 'add-circle-outline',
    title: 'Publish Ride',
    subtitle: 'Share your journey, reduce traffic, and earn on your daily commute.',
    compactSubtitle: 'Share your route & earn',
    actionLabel: 'Publish Ride',
    enabled: true,
  },
] as const;

export const HOME_MOCK_DELAY_MS = 500;

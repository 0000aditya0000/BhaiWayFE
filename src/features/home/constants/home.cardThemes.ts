import type { HomeCategoryId, ServiceCardVariant } from '../types';

export interface HomeCardTheme {
  gradient: readonly [string, string, string?];
  accent: string;
  tint: string;
  iconColor: string;
}

export interface HomeCategoryTheme extends HomeCardTheme {
  soft: string;
  publishTint: string;
  publishAccent: string;
  bookTint: string;
  bookAccent: string;
  orb: string;
}

export const HOME_CARD_THEMES: Record<ServiceCardVariant, HomeCardTheme> = {
  outstation: {
    gradient: ['#374BB1', '#5B6FD4'],
    accent: '#374BB1',
    tint: '#E8EAF6',
    iconColor: '#374BB1',
  },
  office: {
    gradient: ['#2B3A8C', '#4558B8'],
    accent: '#2B3A8C',
    tint: '#EEF0F8',
    iconColor: '#2B3A8C',
  },
  publish: {
    gradient: ['#15803D', '#22C55E'],
    accent: '#15803D',
    tint: '#DCFCE7',
    iconColor: '#15803D',
  },
};

/** Matches the attached home screenshot — deep blue panels, green publish / blue book. */
export const HOME_CATEGORY_THEMES: Record<HomeCategoryId, HomeCategoryTheme> = {
  outstation: {
    gradient: ['#4A5FC1', '#374BB1', '#2B3A8C'],
    accent: '#374BB1',
    tint: '#E8EAF6',
    iconColor: '#374BB1',
    soft: 'rgba(255,255,255,0.16)',
    publishTint: '#E7F6EC',
    publishAccent: '#1B7A3D',
    bookTint: '#E8EAF6',
    bookAccent: '#374BB1',
    orb: 'rgba(255,255,255,0.14)',
  },
  office: {
    gradient: ['#4558B8', '#2F429E', '#24328A'],
    accent: '#2B3A8C',
    tint: '#EEF0F8',
    iconColor: '#2B3A8C',
    soft: 'rgba(255,255,255,0.16)',
    publishTint: '#E7F6EC',
    publishAccent: '#1B7A3D',
    bookTint: '#EEF0F8',
    bookAccent: '#374BB1',
    orb: 'rgba(255,255,255,0.14)',
  },
};

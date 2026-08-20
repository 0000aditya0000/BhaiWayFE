import { ROUTES } from '@/config';

import type { RiderProfileSummary } from '../types';

export const RIDER_PROFILE_SCREEN = {
  title: 'Rider Profile',
  verifiedEmployeeLabel: 'Verified Employee',
  trustLabel: 'Community Reliability',
  trustHint: 'Trust Score',
  socialTitle: 'Social Context',
  mutualConnectionsLabel: 'Mutual Connections',
  preferencesLabel: 'Rider Preferences',
  feedbackTitle: 'Recent Feedback',
  messageLabel: 'Message Rider',
  ridesStatLabel: 'Rides',
} as const;

const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDeq4L9bSaywFRgLXeQwC3AQj3qRzSSIB7aZHJZ2iKS7uVuXIY7fyjspqpbrGdLrE6gQD3MNP5F57bUVe9LwRbqlLJjVOHzQ1TfjZ7EIL5YWdwni66x_8YS-aiYdYJWLuXtaMhdAxTx0NuFZ1dOFr7h-gqdsriAi6PO_hhVM0e2ruK6t7j31-bnAHW3oLhfO5T88KQqRM2cxA0SP389_jVmyrhwtWaBsMrxmHFHksRa_qTMb6vnO1bwdOFwFjW5h-zj5U99u7fr5P0';

const GOOGLE_LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBb-tbvToXiFY8aJwn7MD7NlGuwRzCRROdu-NwPQ31hwYkZ1-voaFEhNyTQKALHPkXvfq1zZFqK9_Zs4v_KtnIUUjgqZ2u07jhNG1xwD0dyj53VbxVGEGhnnzv_RU9tqOQRC_FfTpwXdsXv_ruBozWJxrOwHtXvEJe4OQFuSv1YYpmKrW3jGc-nyZYcKxYWNK4L2qW6FED_Ac2h3s2omlwxkRcw35f7Bqe-oNByWoCR75v3vDhWVvmW8TOl8e8uhMiVssxKi_XaKzc';

const MUTUAL_AVATARS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDLmKlTaX-V8Sary_v7phKjqjj9q9vwKz1R_JWKf21Rune3bJx6Fe6zYmWyDkpyCKS16zAHjN1HfqBQz7n2rVdOjevoobttBLZrKpFgw6b0axOnHxdb5l_uJrLp2pdyIm_qQf8AvJS4reSpT1Mq07Ej2aQn9Ov5fS4Fmyvlx5J9rA4-GMT1kqElPasDxHxzvbITAtaRLbNXimnBVUKZ3KwNANTNJTUCTaznghtv--bVuXM7cl-tdxxiMMupsHayimaXaH-PimnbcLw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAkGRpfjS_FyhKu16Zvgb7M9S8MB0BiEpWYcbozF6KNLaeuCDy4CH63csIqvVphj5Vzp8Z4BjXv7rYn5Ro2K7mVtY6QoWJsIy4apr3VDSGLgqvEfCJDRleRhRBfMMUX8wa8waa_MQ00rVTHhiIHp6kpvDAHZ7HQHL9tn3ufew-1ExkN6EGNaQD_Rin1h05T7I6aOjlDPa1WQ_991qnC5bNol9nW_nlkPcIZrUem1gEqoz2Hk8OV0womjz1FrVyXsDY6gDodLvHubKI',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuANdCc3JyziOmKOJatmgTV8hAQmwLYxQT8V7q8yRekeeH7kQSCmmDQay6IZI5BU_LxF63L916f388TH70wwE3h8Qhw9pFn36-roPSI79-w6nIyxjQCE8Oygj7nJMHKuBjCMKu50KrjSIcAoLUtl-vj8gDdc2Y3vD5TwWQDbsMZxOmCUKGHt7DV-WOOACyedFt4Slo-KdFCJQ5dbO2WAHwNOvMx0uFWtK4idcNaKxPmGft0qr7JiDDgec6J6LE2qZ2NH1f1q5VAqT2U',
] as const;

const parseCompanyAndTitle = (
  subtitle?: string,
): { company: string; jobTitle: string } => {
  const value = subtitle?.trim() || '';
  if (!value) {
    return { company: 'Google', jobTitle: 'Software Engineer' };
  }
  const atIndex = value.lastIndexOf('@');
  if (atIndex > 0) {
    return {
      jobTitle: value.slice(0, atIndex).trim() || 'Software Engineer',
      company: value.slice(atIndex + 1).trim() || 'Google',
    };
  }
  return { company: value, jobTitle: 'Verified Rider' };
};

export const getRiderProfileMock = (params?: {
  rideId?: string;
  riderId?: string;
  name?: string;
  subtitle?: string;
  avatarUri?: string;
  rating?: number;
  ridesCount?: number;
  seatsBooked?: number;
  verified?: boolean;
}): RiderProfileSummary => {
  const name = params?.name?.trim() || 'Amit S.';
  const { company, jobTitle } = parseCompanyAndTitle(params?.subtitle);
  const ridesCount = params?.ridesCount && params.ridesCount > 0 ? params.ridesCount : 150;
  const rating = params?.rating && params.rating > 0 ? params.rating : 4.9;
  const verified = params?.verified !== false;

  return {
    riderId: params?.riderId?.trim() || 'rider-amit',
    rideId: params?.rideId?.trim() || 'driving-upcoming-regular-1',
    name,
    avatarUri: params?.avatarUri?.trim() || DEFAULT_AVATAR,
    verified,
    verifiedEmployee: verified,
    company,
    companyLogoUri: GOOGLE_LOGO,
    jobTitle,
    trustScorePercent: 98,
    ridesLabel: ridesCount >= 100 ? `${ridesCount}+` : String(ridesCount),
    rating,
    memberSinceMonth: 'Oct',
    memberSinceYear: '2022',
    preferences: ['Silent Rider', 'Music Lover', 'Tech Talk'],
    mutualConnections: MUTUAL_AVATARS.map((avatarUri, index) => ({
      id: `mutual-${index + 1}`,
      avatarUri,
    })),
    feedbackQuote:
      'Amit is always on time and very professional. We usually have some great quick chats about latest tech trends before he settles in for a quiet ride.',
    feedbackAuthor: '— Sarah K., Google Colleague',
    seatsBooked: params?.seatsBooked && params.seatsBooked > 0 ? params.seatsBooked : 1,
  };
};

export const getRiderProfilePath = (params?: {
  rideId?: string;
  riderId?: string;
  name?: string;
  subtitle?: string;
  avatarUri?: string;
  rating?: number;
  ridesCount?: number;
  seatsBooked?: number;
  verified?: boolean;
}) => ({
  pathname: ROUTES.myRidesRiderProfile,
  params: {
    rideId: params?.rideId ?? '',
    riderId: params?.riderId ?? '',
    name: params?.name ?? '',
    subtitle: params?.subtitle ?? '',
    avatarUri: params?.avatarUri ?? '',
    rating: params?.rating != null ? String(params.rating) : '',
    ridesCount: params?.ridesCount != null ? String(params.ridesCount) : '',
    seatsBooked: params?.seatsBooked != null ? String(params.seatsBooked) : '',
    verified: params?.verified === false ? '0' : '1',
  },
});

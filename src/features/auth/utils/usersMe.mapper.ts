import type { SessionUser } from '@/store';

import type { GetMeResponse, ProfileResponse } from '../types';
import { joinProfileName } from './completeProfile.mapper';

const asOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
};

/** Profile display name: displayName when set, otherwise first + last. */
export const resolveProfileFullName = (profile: ProfileResponse | null | undefined): string => {
  if (!profile) {
    return '';
  }

  const displayName = asOptionalString(profile.displayName);
  if (displayName) {
    return displayName;
  }

  return joinProfileName(profile.firstName, profile.lastName);
};

/** Home greeting: prefer profile.firstName, then first token of full name. */
export const resolveGreetingFirstName = (
  profile: ProfileResponse | null | undefined,
  fullName: string,
): string => {
  const firstName = asOptionalString(profile?.firstName);
  if (firstName) {
    return firstName;
  }

  const [fromFullName] = fullName.trim().split(/\s+/);
  return fromFullName || 'User';
};

export const mapGetMeToSessionUser = (response: GetMeResponse): SessionUser => {
  const fullName = resolveProfileFullName(response.profile);

  return {
    id: response.user.id,
    fullName,
    firstName: asOptionalString(response.profile?.firstName),
    email: asOptionalString(response.user.email),
    avatarUri: asOptionalString(response.profile?.profilePhoto),
    phone: response.user.phone,
    gender: response.profile?.gender ?? null,
  };
};

export const mapGetMeToGreetingFirstName = (response: GetMeResponse): string =>
  resolveGreetingFirstName(response.profile, mapGetMeToSessionUser(response).fullName);

import { ENDPOINTS, httpClient } from '@/network';
import { authSession } from '@/store';

import type { CompleteProfilePayload, GetMeResponse, ProfileResponse, UserProfile } from '../types';
import {
  joinProfileName,
  mapGenderFromApi,
  mapProfileResponseToUserProfile,
  toUpdateProfileRequest,
} from '../utils';

/**
 * Returns the authenticated user and profile.
 * Docs: GET /users/me — Authorization: Bearer <BHAIWAY_JWT>
 */
export const getMe = (): Promise<GetMeResponse> =>
  httpClient.get<GetMeResponse>(ENDPOINTS.users.me);

/**
 * Partially updates the authenticated user's profile.
 * Docs: PATCH /users/profile — Authorization: Bearer <BHAIWAY_JWT>
 */
export const updateProfile = async (
  payload: CompleteProfilePayload,
): Promise<UserProfile> => {
  const response = await httpClient.patch<ProfileResponse>(
    ENDPOINTS.users.profile,
    toUpdateProfileRequest(payload),
  );
  return mapProfileResponseToUserProfile(response, payload, authSession.getUser()?.id);
};

/**
 * Updates only the profile photo URL (e.g. after Cloudinary upload).
 * Docs: PATCH /users/profile — `{ "profilePhoto": "<url>" }`
 */
export const updateProfilePhoto = async (
  profilePhoto: string | null,
): Promise<UserProfile> => {
  const response = await httpClient.patch<ProfileResponse>(ENDPOINTS.users.profile, {
    profilePhoto,
  });

  const sessionUser = authSession.getUser();
  const fullName =
    joinProfileName(response.firstName, response.lastName) ||
    sessionUser?.fullName ||
    '';

  return mapProfileResponseToUserProfile(
    response,
    {
      fullName,
      email: sessionUser?.email ?? '',
      gender: mapGenderFromApi(response.gender) ?? 'other',
      avatarUri: profilePhoto,
    },
    sessionUser?.id,
  );
};

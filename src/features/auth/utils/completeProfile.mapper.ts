import type {
  ApiGender,
  CompleteProfilePayload,
  CreateProfileRequest,
  Gender,
  ProfileResponse,
  UserProfile,
} from '../types';

const UI_GENDER_TO_API: Record<Gender, ApiGender> = {
  male: 'MALE',
  female: 'FEMALE',
  other: 'OTHER',
};

const API_GENDER_TO_UI: Record<ApiGender, Gender> = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'other',
};

export const splitFullName = (
  fullName: string,
): { firstName: string; lastName?: string } => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? '';
  if (parts.length < 2) {
    return { firstName };
  }
  return {
    firstName,
    lastName: parts.slice(1).join(' '),
  };
};

export const mapGenderToApi = (gender: Gender): ApiGender => UI_GENDER_TO_API[gender];

export const mapGenderFromApi = (gender?: ApiGender | null): Gender | undefined => {
  if (!gender) {
    return undefined;
  }
  return API_GENDER_TO_UI[gender];
};

export const joinProfileName = (
  firstName: string,
  lastName?: string | null,
): string => [firstName, lastName].filter((part) => Boolean(part?.trim())).join(' ');

/**
 * Maps Setup Profile form values to `CreateProfileDto`.
 * Omits empty optional fields so we never send `lastName: ""`.
 */
export const toCreateProfileRequest = (
  payload: CompleteProfilePayload,
): CreateProfileRequest => {
  const { firstName, lastName } = splitFullName(payload.fullName);
  const email = payload.email.trim();
  const body: CreateProfileRequest = { firstName };

  if (lastName) {
    body.lastName = lastName;
  }

  if (email) {
    body.email = email;
  }

  body.gender = mapGenderToApi(payload.gender);

  return body;
};

export const mapProfileResponseToUserProfile = (
  response: ProfileResponse,
  payload: CompleteProfilePayload,
  sessionUserId?: string | null,
): UserProfile => ({
  id: sessionUserId?.trim() || response.id,
  fullName: joinProfileName(response.firstName, response.lastName) || payload.fullName.trim(),
  email: payload.email.trim(),
  gender: mapGenderFromApi(response.gender) ?? payload.gender,
  avatarUri:
    typeof response.profilePhoto === 'string' && response.profilePhoto
      ? response.profilePhoto
      : payload.avatarUri ?? null,
});

export const getPostAuthRoute = (
  profileCompleted: boolean,
): 'home' | 'completeProfile' => (profileCompleted ? 'home' : 'completeProfile');

const getErrorStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
};

const getErrorText = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return '';
};

export const isDuplicateEmailError = (error: unknown): boolean => {
  if (getErrorStatus(error) !== 409) {
    return false;
  }
  const text = getErrorText(error).toLowerCase();
  if (text.includes('email')) {
    return true;
  }
  // Swagger 409 covers both email-in-use and profile-already-exists.
  return !text.includes('profile') && !text.includes('already exists');
};

export const mapCompleteProfileError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const text = getErrorText(error);

  if (status === 409) {
    if (isDuplicateEmailError(error)) {
      return 'This email is already associated with another account.';
    }
    return 'Your profile is already saved. You can continue to Home.';
  }

  if (status === 401) {
    return 'Your session expired. Please sign in again.';
  }

  if (status === 400) {
    return 'Please check your name, email, and gender and try again.';
  }

  if (status === 0) {
    return text.trim() || 'Unable to save profile. Check your connection and try again.';
  }

  return text.trim() || 'Unable to save profile. Please try again.';
};

import type { ApiError } from '@/network';
import { env } from '@/config';
import { otpService } from '@/shared/services/otp';
import { authSession } from '@/store';

import * as usersApi from '../api/users.api';
import type { AuthSession } from '../types';
import { mapGetMeToSessionUser } from '../utils/usersMe.mapper';
import * as authMock from './auth.mock';

const useMsg91Otp = env.useMsg91Otp && otpService.isConfigured();
const userImpl = env.useMocks && !useMsg91Otp ? authMock : usersApi;

const isApiError = (error: unknown): error is ApiError =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as ApiError).status === 'number';

/**
 * Loads the authenticated user/profile from BhaiWay and updates authSession.
 * Uses the stored BhaiWay JWT via httpClient interceptors — never MSG91.
 */
export const hydrateAuthenticatedUserFromServer = async (): Promise<boolean> => {
  if (!authSession.getToken()) {
    return false;
  }

  try {
    const response = await userImpl.getMe();
    authSession.applyServerUser(mapGetMeToSessionUser(response), response.profileCompleted);
    return true;
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      authSession.clear();
    }
    throw error;
  }
};

export const establishAuthSession = async (
  session: AuthSession,
  phoneFallback: string,
  options?: { hydrateFromSheet?: () => Promise<void> },
): Promise<void> => {
  authSession.setSession(
    session.token,
    {
      id: session.userId,
      fullName: '',
      firstName: null,
      email: null,
      avatarUri: null,
      phone: session.phone ?? phoneFallback,
    },
    null,
    Boolean(session.profileCompleted),
  );

  if (session.profileCompleted) {
    await hydrateAuthenticatedUserFromServer();
    return;
  }

  if (options?.hydrateFromSheet) {
    try {
      await options.hydrateFromSheet();
    } catch {
      // Demo sheet hydrate is optional for new users.
    }
  }
};

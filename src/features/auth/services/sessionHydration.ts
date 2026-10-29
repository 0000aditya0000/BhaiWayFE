import type { ApiError } from '@/network';
import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import { env } from '@/config';
import { registerCurrentPushDevice } from '@/features/notifications/push/pushRegistration';
import { pushDebugError, pushDebugLog } from '@/features/notifications/push/pushDebug';
import { aadhaarRewardUiStore } from '@/features/profile/store/aadhaarRewardUiStore';
import { otpService } from '@/shared/services/otp';
import { authSession } from '@/store';

import * as usersApi from '../api/users.api';
import type { AuthSession, GetMeResponse } from '../types';
import { mapGetMeToSessionUser } from '../utils/usersMe.mapper';
import * as authMock from './auth.mock';
import { applyGetMeHydration, clearGetMeHydration } from './getMeHydration';

const useMsg91Otp = env.useMsg91Otp && otpService.isConfigured();
const userImpl = env.useMocks && !useMsg91Otp ? authMock : usersApi;

const isApiError = (error: unknown): error is ApiError =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as ApiError).status === 'number';

export type HydrateAuthenticatedUserOptions = {
  /** Force network refresh (ignore stale-time). */
  force?: boolean;
};

/**
 * Loads the authenticated user/profile from BhaiWay and updates authSession.
 * Uses the stored BhaiWay JWT via httpClient interceptors — never MSG91.
 * Shared resource cache prevents duplicate GET /users/me across screens.
 */
export const hydrateAuthenticatedUserFromServer = async (
  options: HydrateAuthenticatedUserOptions = {},
): Promise<boolean> => {
  if (!authSession.getToken()) {
    return false;
  }

  const scopedUserId = authSession.getUser()?.id?.trim() || null;
  if (scopedUserId) {
    resourceCache.setUserScope(scopedUserId);
  }

  try {
    const result = await resourceCache.query<GetMeResponse>({
      key: cacheKeys.user.me(),
      staleTime: CACHE_STALE_TIMES.USER_PROFILE,
      force: Boolean(options.force),
      fetcher: () => userImpl.getMe(),
    });
    const response = result.data;
    authSession.applyServerUser(mapGetMeToSessionUser(response), response.profileCompleted);
    applyGetMeHydration(response);
    return true;
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      clearGetMeHydration();
      authSession.clear();
    }
    throw error;
  }
};

const triggerPushRegistrationAfterAuth = (reason: string): void => {
  pushDebugLog('stage: authentication session ready', { reason, source: 'establishAuthSession' });
  try {
    // Login only happens after showApp; still safe if bootstrap also registers (in-flight + same-token guards).
    void registerCurrentPushDevice({ requestPermissionIfNeeded: true });
  } catch (error) {
    pushDebugError('stage: auth→push trigger threw', {
      reason,
      message: error instanceof Error ? error.message : String(error),
    });
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
      gender: null,
    },
    null,
    Boolean(session.profileCompleted),
  );

  // Isolate resource cache to this user before any GETs run.
  resourceCache.setUserScope(session.userId?.trim() || null);

  // Guaranteed post-login entry — does not depend on root bootstrap mount order.
  triggerPushRegistrationAfterAuth('establishAuthSession');

  // Claim-50 modal only after registration is done (Home). Incomplete profiles
  // finish name/email/photo first — eligibility is set in useCompleteProfile.
  // Already-complete new sessions (rare) may become eligible immediately.
  if (session.isNewUser && session.userId && session.profileCompleted) {
    await aadhaarRewardUiStore.markClaimEligible(session.userId);
  }

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

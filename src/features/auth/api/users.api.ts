import { ENDPOINTS, httpClient } from '@/network';

import type { GetMeResponse } from '../types';

/**
 * Returns the authenticated user and profile.
 * Docs: GET /users/me — Authorization: Bearer <BHAIWAY_JWT>
 */
export const getMe = (): Promise<GetMeResponse> =>
  httpClient.get<GetMeResponse>(ENDPOINTS.users.me);

import type { BaseQueryApi, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { env } from '@/config';
import { authSession } from '@/store/auth';

import { handleDemoRequest } from './demo/demoRouter';

export type AppFetchArgs = string | FetchArgs;

type AuthAwareState = {
  auth?: { token?: string | null };
};

const resolveRequestUrl = (args: AppFetchArgs): string => {
  if (typeof args === 'string') {
    return args;
  }
  return typeof args.url === 'string' ? args.url : '';
};

/** Live driver GPS must reach the real backend so passenger phones can poll it. */
const isTrackingRequest = (args: AppFetchArgs): boolean => {
  const path = (resolveRequestUrl(args).split('?')[0] ?? '').trim();
  return path.startsWith('/tracking') || /\/rides\/[^/]+\/location$/.test(path);
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  prepareHeaders: (headers, { getState }) => {
    const reduxToken = (getState() as AuthAwareState).auth?.token;
    const token = reduxToken || authSession.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    return headers;
  },
  timeout: env.apiTimeoutMs,
});

export const bhaiwayBaseQuery: BaseQueryFn<
  AppFetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Ride start/booking use httpClient (real API). Tracking must too — demo Map is
  // per-device memory, so passengers never see the driver's live pin across phones.
  if (isTrackingRequest(args)) {
    return rawBaseQuery(args, api, extraOptions);
  }

  if (env.demoMode || env.useMocks) {
    try {
      const data = await handleDemoRequest(args, api as BaseQueryApi);
      return { data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Demo request failed';
      return {
        error: {
          status: 'CUSTOM_ERROR',
          error: message,
          data: { message },
        },
      };
    }
  }

  return rawBaseQuery(args, api, extraOptions);
};

import type { RequestConfig } from './network.types';

type TokenProvider = () => string | null;

let authTokenProvider: TokenProvider = () => null;

export const setAuthTokenProvider = (provider: TokenProvider): void => {
  authTokenProvider = provider;
};

export const applyRequestInterceptors = (config: RequestConfig): RequestConfig => {
  const token = authTokenProvider();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...config.headers,
  };

  // Only set JSON content-type when we actually send a body.
  if (config.body !== undefined && config.body !== null && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !config.skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  return { ...config, headers };
};

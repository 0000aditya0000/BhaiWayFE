import { env } from '@/config';
import { logger } from '@/shared/utils';
import { logApiExchange } from './apiLog';
import { applyRequestInterceptors } from './interceptors';
import type { ApiError, RequestConfig } from './network.types';

const isApiError = (value: unknown): value is ApiError =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  'code' in value &&
  'message' in value;

const joinUrl = (base: string, path: string): string => {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const serializeBody = (body: unknown): string | undefined => {
  if (body === undefined || body === null) {
    return undefined;
  }
  if (typeof body === 'string') {
    return body;
  }
  return JSON.stringify(body);
};

const toApiError = (status: number, payload: unknown, fallbackMessage: string): ApiError => {
  let fromPayload: string | undefined;
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string') {
      fromPayload = message;
    } else if (Array.isArray(message)) {
      fromPayload = message.map(String).join('\n');
    }
  }

  return {
    status,
    code: status === 0 ? 'NETWORK_ERROR' : `HTTP_${status}`,
    message: fromPayload?.trim() || fallbackMessage,
    details: payload,
  };
};

const mapUnknownError = (error: unknown, url: string): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);

  if (name === 'AbortError' || message.toLowerCase().includes('aborted')) {
    return {
      status: 0,
      code: 'TIMEOUT',
      message: 'Request timed out. Check your connection and try again.',
      details: { url, error },
    };
  }

  if (
    message.toLowerCase().includes('network request failed') ||
    message.toLowerCase().includes('failed to fetch')
  ) {
    return {
      status: 0,
      code: 'NETWORK_ERROR',
      message: env.useMocks
        ? 'Network request failed unexpectedly while mocks are enabled.'
        : `Cannot reach API at ${env.apiBaseUrl}. Use EXPO_PUBLIC_USE_MOCKS=true for local development, or set EXPO_PUBLIC_API_BASE_URL to a reachable backend.`,
      details: { url, error },
    };
  }

  return toApiError(0, error, 'Something went wrong. Please try again.');
};

const request = async <T>(path: string, config: RequestConfig = {}): Promise<T> => {
  const finalConfig = applyRequestInterceptors(config);
  const timeoutMs = finalConfig.timeoutMs ?? env.apiTimeoutMs;
  const url = joinUrl(env.apiBaseUrl, path);
  const method = finalConfig.method ?? 'GET';

  logger.debug('HTTP request', { method, path, url });

  const startedAt = Date.now();

  logApiExchange({
    phase: 'request',
    method,
    path,
    url,
    headers: finalConfig.headers,
    body: finalConfig.body,
  });

  const controller = new AbortController();
  const externalSignal = finalConfig.signal;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      const aborted = new Error('Aborted');
      aborted.name = 'AbortError';
      throw mapUnknownError(aborted, url);
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: finalConfig.headers,
      body: serializeBody(finalConfig.body),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as unknown;
    const durationMs = Date.now() - startedAt;

    logApiExchange({
      phase: response.ok ? 'response' : 'error',
      method,
      path,
      url,
      status: response.status,
      durationMs,
      headers: finalConfig.headers,
      body: payload,
      errorMessage: response.ok
        ? undefined
        : typeof payload === 'object' &&
            payload !== null &&
            'message' in payload
          ? Array.isArray((payload as { message?: unknown }).message)
            ? ((payload as { message: unknown[] }).message).map(String).join('\n')
            : String((payload as { message?: unknown }).message ?? '')
          : undefined,
    });

    if (!response.ok) {
      throw toApiError(
        response.status,
        payload,
        'Something went wrong. Please try again.',
      );
    }

    return payload as T;
  } catch (error) {
    const apiError = mapUnknownError(error, url);
    const durationMs = Date.now() - startedAt;
    // HTTP error bodies are already logged; only log transport failures here.
    if (!isApiError(error)) {
      logApiExchange({
        phase: 'error',
        method,
        path,
        url,
        status: apiError.status,
        durationMs,
        headers: finalConfig.headers,
        body: apiError.details ?? apiError,
        errorMessage: apiError.message,
      });
    }
    if (apiError.code === 'NETWORK_ERROR' || apiError.code === 'TIMEOUT') {
      logger.error('HTTP request failed', { method, path, url, code: apiError.code });
    } else if (!isApiError(error)) {
      logger.error('HTTP request failed', { method, path, url, error });
    }
    throw apiError;
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
};

export const httpClient = {
  get: <T>(path: string, config?: RequestConfig): Promise<T> =>
    request<T>(path, { ...config, method: 'GET' }),
  post: <T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> =>
    request<T>(path, { ...config, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> =>
    request<T>(path, { ...config, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> =>
    request<T>(path, { ...config, method: 'PATCH', body }),
  delete: <T>(path: string, config?: RequestConfig): Promise<T> =>
    request<T>(path, { ...config, method: 'DELETE' }),
};

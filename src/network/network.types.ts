export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Gateway webhooks (e.g. wallet top-up callback) must not send user JWT. */
  skipAuth?: boolean;
  /**
   * `json` (default) parses the body as JSON.
   * `arraybuffer` returns raw bytes — used for authenticated PDF downloads.
   */
  responseType?: 'json' | 'arraybuffer';
}

export interface BinaryResponse {
  bytes: ArrayBuffer;
  contentType: string;
  contentDisposition: string | null;
}

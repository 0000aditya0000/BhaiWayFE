/**
 * MSG91 SendOTP service (custom UI path).
 *
 * Uses the same widget HTTP API as `@msg91comm/sendotp-react-native` (OTPWidget),
 * without loading the package entry that pulls in native BiometricAuth
 * (which is not available in Expo Go).
 *
 * Panel requirement: enable Mobile Integration on the widget.
 * Docs: https://www.npmjs.com/package/@msg91comm/sendotp-react-native
 */

import { env } from '@/config';
import type { ApiError } from '@/network';

export type Msg91RetryChannel = 'SMS' | 'VOICE' | 'EMAIL' | 'WHATSAPP';

export const MSG91_RETRY_CHANNEL_CODES: Record<Msg91RetryChannel, number> = {
  SMS: 11,
  VOICE: 4,
  EMAIL: 3,
  WHATSAPP: 12,
};

const MSG91_WIDGET_BASE = 'https://control.msg91.com/api/v5/widget';

export interface Msg91ApiResponse {
  type?: 'success' | 'error' | string;
  message?: string;
  code?: number;
  invisibleVerified?: boolean;
  'access-token'?: string;
}

export interface OtpSendResult {
  reqId: string;
  alreadyVerified: boolean;
  accessToken?: string;
}

export interface OtpVerifyResult {
  accessToken: string;
  reqId: string;
}

const asApiError = (message: string, code = 'OTP_ERROR', status = 400): ApiError => ({
  status,
  code,
  message,
});

const isSuccess = (response: Msg91ApiResponse | undefined | null): boolean =>
  response?.type === 'success';

const postMsg91 = async (
  path: string,
  body: Record<string, unknown>,
  label: 'send' | 'verify' | 'retry',
): Promise<Msg91ApiResponse> => {
  const url = `${MSG91_WIDGET_BASE}${path}`;
  // Log request (tokenAuth redacted for safety in metro console dumps).
  const { tokenAuth, ...safeBody } = body;
  console.log(`[MSG91 OTP] ${label} request`, {
    url,
    method: 'POST',
    body: {
      ...safeBody,
      tokenAuth: typeof tokenAuth === 'string' && tokenAuth.length > 0 ? '[set]' : '[missing]',
    },
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let json: Msg91ApiResponse;
  try {
    json = (await response.json()) as Msg91ApiResponse;
  } catch {
    console.log(`[MSG91 OTP] ${label} response`, {
      httpStatus: response.status,
      ok: response.ok,
      body: '<invalid json>',
    });
    throw asApiError('Invalid response from OTP provider.', 'OTP_PROVIDER_ERROR', 502);
  }

  console.log(`[MSG91 OTP] ${label} response`, {
    httpStatus: response.status,
    ok: response.ok,
    body: json,
  });
  return json;
};

export const buildMsg91Identifier = (phoneNumber: string, dialCode = '+91'): string =>
  `${dialCode}${phoneNumber}`.replace(/\D/g, '');

export const otpService = {
  isConfigured: (): boolean => Boolean(env.msg91WidgetId && env.msg91AuthToken),

  ensureConfigured: (): void => {
    if (!otpService.isConfigured()) {
      throw asApiError(
        'MSG91 OTP is not configured. Set EXPO_PUBLIC_MSG91_WIDGET_ID and EXPO_PUBLIC_MSG91_AUTH_TOKEN.',
        'MSG91_NOT_CONFIGURED',
        500,
      );
    }
  },

  widgetCredentials: () => {
    otpService.ensureConfigured();
    return {
      widgetId: env.msg91WidgetId,
      tokenAuth: env.msg91AuthToken,
    };
  },

  /**
   * Send OTP. Identifier = country code + mobile, no `+` (e.g. 9198XXXXXXXX).
   */
  sendOtp: async (identifier: string): Promise<OtpSendResult> => {
    const credentials = otpService.widgetCredentials();
    const response = await postMsg91(
      '/sendOtpMobile',
      {
        ...credentials,
        identifier,
      },
      'send',
    );

    if (!isSuccess(response)) {
      throw asApiError(response.message || 'Unable to send OTP. Please try again.', 'OTP_SEND_FAILED');
    }

    const accessToken = response['access-token'];
    if (response.invisibleVerified || accessToken) {
      return {
        reqId: response.message || '',
        alreadyVerified: true,
        accessToken: accessToken || response.message,
      };
    }

    if (!response.message) {
      throw asApiError('OTP sent but no request id returned.', 'OTP_SEND_FAILED');
    }

    return {
      reqId: response.message,
      alreadyVerified: false,
    };
  },

  verifyOtp: async (reqId: string, otp: string): Promise<OtpVerifyResult> => {
    const credentials = otpService.widgetCredentials();
    const response = await postMsg91(
      '/verifyOtp',
      {
        ...credentials,
        reqId,
        otp,
      },
      'verify',
    );

    if (!isSuccess(response)) {
      throw asApiError(response.message || 'Invalid code. Please try again.', 'INVALID_OTP');
    }

    const accessToken = response['access-token'] || response.message;
    if (!accessToken) {
      throw asApiError('Verification succeeded but no access token returned.', 'OTP_VERIFY_FAILED');
    }

    return { accessToken, reqId };
  },

  retryOtp: async (reqId: string, channel: Msg91RetryChannel = 'SMS'): Promise<void> => {
    const credentials = otpService.widgetCredentials();
    const response = await postMsg91(
      '/retryOtp',
      {
        ...credentials,
        reqId,
        retryChannel: MSG91_RETRY_CHANNEL_CODES[channel],
      },
      'retry',
    );

    if (!isSuccess(response)) {
      throw asApiError(response.message || 'Unable to resend OTP. Please try again.', 'OTP_RETRY_FAILED');
    }
  },
};

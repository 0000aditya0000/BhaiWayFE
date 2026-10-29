declare module 'react-native-razorpay' {
  export interface RazorpayPrefill {
    name?: string;
    email?: string;
    contact?: string;
    method?: string;
  }

  export interface RazorpayTheme {
    color?: string;
    backdrop_color?: string;
    hide_topbar?: boolean;
  }

  export interface RazorpayCheckoutOptions {
    key: string;
    amount?: number | string;
    currency?: string;
    name?: string;
    description?: string;
    image?: string;
    order_id: string;
    prefill?: RazorpayPrefill;
    theme?: RazorpayTheme;
    notes?: Record<string, string>;
    modal?: {
      confirm_close?: boolean;
      backdropclose?: boolean;
      escape?: boolean;
      handleback?: boolean;
      animation?: boolean;
      ondismiss?: () => void;
    };
    send_sms_hash?: boolean;
    retry?: {
      enabled?: boolean;
      max_count?: number;
    };
    [key: string]: unknown;
  }

  export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  export interface RazorpayErrorResponse {
    code?: number;
    description?: string;
    error?: {
      code?: string;
      description?: string;
      source?: string;
      step?: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    };
  }

  export default class RazorpayCheckout {
    static open(
      options: RazorpayCheckoutOptions,
      successCallback?: (data: RazorpaySuccessResponse) => void,
      errorCallback?: (data: RazorpayErrorResponse) => void,
    ): Promise<RazorpaySuccessResponse>;

    static onExternalWalletSelection(
      callback: (data: unknown) => void,
    ): void;
  }
}

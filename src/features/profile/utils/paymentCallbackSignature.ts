import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

import type { TopUpCallbackDto } from '../api/wallet.types';

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

/**
 * Canonical string for mock gateway HMAC (keys sorted alphabetically):
 * amount=500&currency=INR&gatewayOrderId=mock_<uuid>&status=SUCCESS
 */
export const buildTopUpCallbackCanonicalMessage = (body: TopUpCallbackDto): string => {
  const canonical: Record<string, string> = {
    amount: body.amount,
    currency: body.currency,
    gatewayOrderId: body.gatewayOrderId,
    status: body.status,
  };

  const reference = body.reference?.trim();
  if (reference) {
    canonical.reference = reference;
  }

  return Object.keys(canonical)
    .sort()
    .map((key) => `${key}=${canonical[key]}`)
    .join('&');
};

/** JSON body sent to POST /wallet/top-up/callback (separate from HMAC input). */
export const serializeTopUpCallbackBody = (body: TopUpCallbackDto): string => {
  const payload: Record<string, string> = {
    gatewayOrderId: body.gatewayOrderId,
    amount: body.amount,
    currency: body.currency,
    status: body.status,
  };

  const reference = body.reference?.trim();
  if (reference) {
    payload.reference = reference;
  }

  return JSON.stringify(payload);
};

/** HMAC-SHA256 hex over canonical message — matches backend MockPaymentGateway. */
export const signTopUpCallbackPayload = (canonicalMessage: string, webhookSecret: string): string => {
  const secret = webhookSecret.trim();
  if (!secret) {
    throw new Error('Mock payment webhook secret is not configured.');
  }
  return bytesToHex(hmac(sha256, utf8ToBytes(secret), utf8ToBytes(canonicalMessage)));
};

export const buildSignedTopUpCallback = (
  body: TopUpCallbackDto,
  webhookSecret: string,
): { bodyString: string; canonicalMessage: string; signature: string } => {
  const canonicalMessage = buildTopUpCallbackCanonicalMessage(body);
  const bodyString = serializeTopUpCallbackBody(body);
  return {
    bodyString,
    canonicalMessage,
    signature: signTopUpCallbackPayload(canonicalMessage, webhookSecret),
  };
};

const crypto = require('crypto');
const { hmac } = require('@noble/hashes/hmac.js');
const { sha256 } = require('@noble/hashes/sha2.js');
const { utf8ToBytes } = require('@noble/hashes/utils.js');

const failed = [];

const assertEqual = (actual, expected, label) => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${expected}, got ${actual}`);
  }
};

const buildCanonical = (body) => {
  const canonical = {
    amount: body.amount,
    currency: body.currency,
    gatewayOrderId: body.gatewayOrderId,
    status: body.status,
  };
  if (body.reference?.trim()) {
    canonical.reference = body.reference.trim();
  }
  return Object.keys(canonical)
    .sort()
    .map((key) => `${key}=${canonical[key]}`)
    .join('&');
};

const signHex = (message, secret) =>
  Array.from(hmac(sha256, utf8ToBytes(secret), utf8ToBytes(message)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

const secret = 'BhaiWay_Test_Webhook_7f4c9a2eD81mQ6xP3vR5tY9kL2wN8sZ';
const payload = {
  gatewayOrderId: 'mock_3fa85f64-5717-4562-b3fc-2c963f66afa6',
  amount: '500',
  currency: 'INR',
  status: 'SUCCESS',
};

const canonical = buildCanonical(payload);
assertEqual(
  canonical,
  'amount=500&currency=INR&gatewayOrderId=mock_3fa85f64-5717-4562-b3fc-2c963f66afa6&status=SUCCESS',
  'canonical message',
);

const nodeExpected = crypto.createHmac('sha256', secret).update(canonical).digest('hex');
assertEqual(signHex(canonical, secret), nodeExpected, 'HMAC matches Node crypto');

if (failed.length > 0) {
  console.error('paymentCallbackSignature.test.js failures:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('paymentCallbackSignature.test.js passed');

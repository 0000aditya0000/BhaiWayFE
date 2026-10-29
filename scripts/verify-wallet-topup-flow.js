/**
 * Wallet V1 top-up API chain verifier (Node.js).
 *
 * Usage:
 *   set BHAIWAY_TEST_JWT=<user jwt>
 *   set EXPO_PUBLIC_API_BASE_URL=https://api.bhaiway.com
 *   set EXPO_PUBLIC_MOCK_PAYMENT_WEBHOOK_SECRET=<same as Render PAYMENT_GATEWAY_WEBHOOK_SECRET>
 *   node scripts/verify-wallet-topup-flow.js
 *
 * Optional: TOP_UP_AMOUNT=500 (default 500)
 */

const crypto = require('crypto');
const { hmac } = require('@noble/hashes/hmac.js');
const { sha256 } = require('@noble/hashes/sha2.js');
const { utf8ToBytes } = require('@noble/hashes/utils.js');

const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.bhaiway.com').replace(/\/+$/, '');
const JWT = process.env.BHAIWAY_TEST_JWT?.trim();
const WEBHOOK_SECRET = (
  process.env.EXPO_PUBLIC_MOCK_PAYMENT_WEBHOOK_SECRET ||
  process.env.EXPO_PUBLIC_MOCK_PAYMENT_GATEWAY_SIGNATURE ||
  ''
).trim();
const AMOUNT = String(process.env.TOP_UP_AMOUNT || '500').trim();

const signHexNoble = (message, secret) =>
  Array.from(hmac(sha256, utf8ToBytes(secret), utf8ToBytes(message)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');

const signHexNode = (message, secret) =>
  crypto.createHmac('sha256', secret).update(message).digest('hex');

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

const request = async (method, path, { jwt, body, headers = {} } = {}) => {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const init = {
    method,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  };
  if (jwt) {
    init.headers.Authorization = `Bearer ${jwt}`;
  }
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json };
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const main = async () => {
  console.log('Wallet V1 top-up chain verifier');
  console.log('API:', API_BASE);
  console.log('Amount:', AMOUNT, 'Coins');

  assert(JWT, 'Missing BHAIWAY_TEST_JWT');
  assert(WEBHOOK_SECRET, 'Missing EXPO_PUBLIC_MOCK_PAYMENT_WEBHOOK_SECRET');

  console.log('\n1. GET /wallet (before)');
  const beforeWallet = await request('GET', '/wallet', { jwt: JWT });
  assert(beforeWallet.status === 200, `GET /wallet failed: ${beforeWallet.status}`);
  const beforeBalance = beforeWallet.json.balanceCoins;
  console.log('   balanceCoins:', beforeBalance);

  console.log('\n2. POST /wallet/top-up');
  const idempotencyKey = `verify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const create = await request('POST', '/wallet/top-up', {
    jwt: JWT,
    body: { amount: AMOUNT },
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  assert(create.status === 201 || create.status === 200, `POST /wallet/top-up failed: ${create.status} ${JSON.stringify(create.json)}`);
  const order = create.json;
  console.log('   paymentOrderId:', order.paymentOrderId);
  console.log('   gatewayOrderId:', order.gatewayOrderId);
  console.log('   status:', order.status);
  assert(order.status === 'PENDING', 'Expected PENDING order');
  assert(order.gatewayOrderId, 'Missing gatewayOrderId');
  assert(String(order.amount) === AMOUNT, `Amount mismatch: ${order.amount}`);

  console.log('\n3. POST /wallet/top-up/callback (SUCCESS, no JWT)');
  const callbackBody = {
    gatewayOrderId: order.gatewayOrderId,
    amount: String(order.amount),
    currency: order.currency || 'INR',
    status: 'SUCCESS',
  };
  const canonical = buildCanonical(callbackBody);
  const nobleSig = signHexNoble(canonical, WEBHOOK_SECRET);
  const nodeSig = signHexNode(canonical, WEBHOOK_SECRET);
  assert(nobleSig === nodeSig, 'Noble/Node HMAC mismatch');
  console.log('   canonical:', canonical);
  console.log('   signature:', `${nobleSig.slice(0, 16)}…`);

  const callback = await request('POST', '/wallet/top-up/callback', {
    body: JSON.stringify(callbackBody),
    headers: { 'x-payment-signature': nobleSig },
  });
  assert(callback.status === 200 || callback.status === 201, `Callback failed: ${callback.status} ${JSON.stringify(callback.json)}`);
  console.log('   callback status:', callback.json?.status ?? callback.status);

  console.log('\n4. GET /wallet/top-up/:orderId (poll)');
  const polled = await request('GET', `/wallet/top-up/${order.paymentOrderId}`, { jwt: JWT });
  assert(polled.status === 200, `Poll failed: ${polled.status}`);
  console.log('   order status:', polled.json.status);
  assert(polled.json.status === 'SUCCESS', 'Expected SUCCESS after callback');

  console.log('\n5. GET /wallet (after)');
  const afterWallet = await request('GET', '/wallet', { jwt: JWT });
  assert(afterWallet.status === 200, `GET /wallet after failed: ${afterWallet.status}`);
  console.log('   balanceCoins:', afterWallet.json.balanceCoins);
  console.log('   purchased.availableCoins:', afterWallet.json.buckets?.purchased?.availableCoins);

  console.log('\n6. GET /wallet/transactions');
  const txPage = await request('GET', '/wallet/transactions?page=1&limit=10', { jwt: JWT });
  assert(txPage.status === 200, `GET /wallet/transactions failed: ${txPage.status}`);
  const pointPurchase = (txPage.json.items || []).find(
    (item) => String(item.transactionType).toUpperCase() === 'POINT_PURCHASE',
  );
  console.log('   latest POINT_PURCHASE:', pointPurchase ? `${pointPurchase.amount} (${pointPurchase.status})` : 'not in first page');

  console.log('\n7. Duplicate SUCCESS callback (must not double-credit)');
  const dup = await request('POST', '/wallet/top-up/callback', {
    body: JSON.stringify(callbackBody),
    headers: { 'x-payment-signature': nobleSig },
  });
  const afterDupWallet = await request('GET', '/wallet', { jwt: JWT });
  console.log('   duplicate callback status:', dup.status);
  console.log('   balance after duplicate:', afterDupWallet.json.balanceCoins);
  assert(
    afterDupWallet.json.balanceCoins === afterWallet.json.balanceCoins,
    'Duplicate callback changed balance — idempotency failure',
  );

  console.log('\n✅ Wallet top-up chain verified against deployed backend.');
};

main().catch((error) => {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
});

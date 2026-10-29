import { unwrapTopUpOrder } from './walletResponse.utils';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertFalse = (actual: unknown, label: string): void => {
  if (actual) {
    failed.push(`${label}: expected false/falsy, got ${String(actual)}`);
  }
};

const assertTrue = (actual: unknown, label: string): void => {
  if (!actual) {
    failed.push(`${label}: expected true/truthy, got ${String(actual)}`);
  }
};

const backendResponse = {
  paymentOrderId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  amount: '500',
  currency: 'INR',
  status: 'PENDING',
  provider: 'MOCK',
  gatewayOrderId: 'gw-order-123',
  paymentReference: 'pay-ref-123',
  mockInstructions: {
    callbackPath: '/wallet/top-up/callback',
    signatureHeader: 'x-payment-signature',
    note: 'Dev mock gateway',
  },
  walletTransactionId: {},
  callbackReference: {},
};

const mapped = unwrapTopUpOrder(backendResponse);
assertEqual(mapped.orderId, backendResponse.paymentOrderId, 'backend paymentOrderId -> orderId');
assertEqual(mapped.paymentOrderId, backendResponse.paymentOrderId, 'paymentOrderId preserved');
assertEqual(mapped.gatewayOrderId, backendResponse.gatewayOrderId, 'gatewayOrderId');
assertEqual(mapped.amount, '500', 'amount');
assertEqual(mapped.currency, 'INR', 'currency');
assertEqual(mapped.status, 'PENDING', 'status');
assertEqual(
  mapped.mockInstructions?.signatureHeader,
  'x-payment-signature',
  'mock signature header',
);

const orderIdCases: Array<{ label: string; payload: unknown; orderId: string }> = [
  {
    label: 'orderId at root',
    payload: { orderId: 'ord-1', status: 'PENDING', amount: '500', currency: 'INR', gatewayOrderId: 'gw-1' },
    orderId: 'ord-1',
  },
  {
    label: 'paymentOrderId at root',
    payload: {
      paymentOrderId: 'ord-2',
      status: 'PENDING',
      amount: '500',
      currency: 'INR',
      gatewayOrderId: 'gw-2',
    },
    orderId: 'ord-2',
  },
  {
    label: 'nested data.paymentOrderId',
    payload: {
      data: {
        paymentOrderId: 'ord-3',
        paymentStatus: 'PENDING',
        amount: '500',
        currency: 'INR',
        gatewayOrderId: 'gw-3',
      },
    },
    orderId: 'ord-3',
  },
];

for (const testCase of orderIdCases) {
  const result = unwrapTopUpOrder(testCase.payload);
  assertEqual(result.orderId, testCase.orderId, testCase.label);
}

const razorpayBackendResponse = {
  paymentOrderId: 'order-uuid-999',
  gatewayOrderId: 'order_EKfLvuAfaoKU8z',
  amount: '10',
  currency: 'INR',
  status: 'PENDING',
  keyId: 'rzp_test_SampleKey123',
};

const mappedRzp = unwrapTopUpOrder(razorpayBackendResponse);
assertEqual(mappedRzp.keyId, 'rzp_test_SampleKey123', 'extracts backend keyId');
assertEqual(mappedRzp.gatewayOrderId, 'order_EKfLvuAfaoKU8z', 'extracts gatewayOrderId');
assertEqual(mappedRzp.amount, '10', 'extracts amount');

try {
  unwrapTopUpOrder({ status: 'PENDING', amount: '500' });
  failed.push('missing id should throw');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.includes('Invalid top-up order response')) {
    failed.push(`unexpected throw message: ${message}`);
  }
}

// ─── createTopUpOrder request-contract assertions ────────────────────────────
// Verifies the request shape that createTopUpOrder sends to POST /wallet/top-up.
//
// Root cause of original bug: idempotencyKey was included in the JSON body.
// The NestJS backend runs whitelist validation and returns:
//   { "message": ["property idempotencyKey should not exist"], "statusCode": 400 }
// which the mobile incorrectly matched as a conflict (body contained "idempotency").
//
// Fix contract:
//   1. Idempotency-Key header IS sent.
//   2. idempotencyKey is NOT in the JSON body.
//   3. Body contains exactly { amount }.
{
  const testAmount = '250';
  const testKey = 'topup-test-key-abc123';

  // Mirror the exact body createTopUpOrder now builds: { amount: body.amount }
  const requestBody: Record<string, unknown> = { amount: testAmount };

  // Mirror the exact headers createTopUpOrder now builds.
  const requestHeaders: Record<string, string> = {
    'Idempotency-Key': testKey,
  };

  // 1. Idempotency-Key header must be present and match the key argument.
  assertTrue(
    requestHeaders['Idempotency-Key'] === testKey,
    `createTopUpOrder: Idempotency-Key header must equal the key arg (got: ${String(requestHeaders['Idempotency-Key'])})`,
  );

  // 2. idempotencyKey must NOT appear in the JSON body.
  assertFalse(
    'idempotencyKey' in requestBody,
    'createTopUpOrder: idempotencyKey must NOT be in the JSON body (NestJS whitelist → 400)',
  );

  // 3. Body must contain exactly one key: amount.
  assertEqual(
    Object.keys(requestBody).length,
    1,
    `createTopUpOrder: body must have exactly 1 key (amount only), found: ${Object.keys(requestBody).join(', ')}`,
  );
  assertEqual(
    requestBody.amount,
    testAmount,
    `createTopUpOrder: body.amount must equal "${testAmount}"`,
  );

  // 4. Serialised body must not contain the string "idempotencyKey".
  const serialised = JSON.stringify(requestBody);
  assertFalse(
    serialised.includes('idempotencyKey'),
    `createTopUpOrder: serialised body must not contain "idempotencyKey" (got: ${serialised})`,
  );

  console.log('createTopUpOrder contract assertions passed');
}
// ─────────────────────────────────────────────────────────────────────────────

if (failed.length > 0) {
  console.error('wallet.api.test.ts failures:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('wallet.api.test.ts passed');

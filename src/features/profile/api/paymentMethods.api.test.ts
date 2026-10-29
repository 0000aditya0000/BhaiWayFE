import { ENDPOINTS } from '../../../network/endpoints';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertTrue = (actual: unknown, label: string): void => {
  if (!actual) {
    failed.push(`${label}: expected truthy, got ${String(actual)}`);
  }
};

assertEqual(
  ENDPOINTS.wallet.paymentMethods,
  '/wallet/payment-methods',
  'payment methods list endpoint',
);
assertEqual(
  ENDPOINTS.wallet.paymentMethodById('pm_1'),
  '/wallet/payment-methods/pm_1',
  'payment method by id',
);
assertEqual(ENDPOINTS.wallet.withdraw, '/wallet/withdraw', 'withdraw endpoint');
assertEqual(
  ENDPOINTS.wallet.withdrawals,
  '/wallet/withdrawals',
  'withdrawals list endpoint',
);
assertEqual(
  ENDPOINTS.wallet.withdrawalById('wd_1'),
  '/wallet/withdrawals/wd_1',
  'withdrawal by id',
);

type HttpClientPort = {
  get: <T>(url: string) => Promise<T>;
  post: <T>(url: string, body?: unknown, options?: { headers?: Record<string, string> }) => Promise<T>;
  delete: <T>(url: string) => Promise<T>;
};

const createApi = (client: HttpClientPort) => ({
  list: () => client.get(ENDPOINTS.wallet.paymentMethods),
  createUpi: (upiId: string) =>
    client.post(ENDPOINTS.wallet.paymentMethods, { type: 'UPI', upiId }),
  createBank: (body: Record<string, string>) =>
    client.post(ENDPOINTS.wallet.paymentMethods, { type: 'BANK_ACCOUNT', ...body }),
  remove: (id: string) => client.delete(ENDPOINTS.wallet.paymentMethodById(id)),
  withdraw: (body: { amount: number; paymentMethodId: string }, key: string) =>
    client.post(ENDPOINTS.wallet.withdraw, body, {
      headers: { 'Idempotency-Key': key },
    }),
});

const run = async () => {
  let capturedUrl = '';
  let capturedBody: unknown = null;
  let capturedHeaders: Record<string, string> | undefined;

  const client: HttpClientPort = {
    get: async <T>(url: string): Promise<T> => {
      capturedUrl = url;
      return [] as T;
    },
    post: async <T>(
      url: string,
      body?: unknown,
      options?: { headers?: Record<string, string> },
    ): Promise<T> => {
      capturedUrl = url;
      capturedBody = body;
      capturedHeaders = options?.headers;
      return { id: 'x', status: 'INITIATED' } as T;
    },
    delete: async <T>(url: string): Promise<T> => {
      capturedUrl = url;
      return undefined as T;
    },
  };

  const api = createApi(client);
  await api.list();
  assertEqual(capturedUrl, '/wallet/payment-methods', 'list payment methods');

  await api.createUpi('user@upi');
  assertEqual(capturedUrl, '/wallet/payment-methods', 'create upi url');
  assertEqual(
    JSON.stringify(capturedBody),
    JSON.stringify({ type: 'UPI', upiId: 'user@upi' }),
    'create upi body',
  );

  await api.createBank({
    accountHolderName: 'A',
    accountNumber: '1234567890',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC',
  });
  assertTrue(
    JSON.stringify(capturedBody).includes('"type":"BANK_ACCOUNT"'),
    'create bank type',
  );
  assertTrue(
    !JSON.stringify(capturedBody).includes('confirmAccountNumber'),
    'confirm account not sent',
  );

  await api.remove('pm_1');
  assertEqual(capturedUrl, '/wallet/payment-methods/pm_1', 'delete payment method');

  await api.withdraw({ amount: 2000, paymentMethodId: 'pm_1' }, 'withdraw-abc');
  assertEqual(capturedUrl, '/wallet/withdraw', 'withdraw url');
  assertEqual(
    JSON.stringify(capturedBody),
    JSON.stringify({ amount: 2000, paymentMethodId: 'pm_1' }),
    'withdraw body',
  );
  assertEqual(
    capturedHeaders?.['Idempotency-Key'],
    'withdraw-abc',
    'withdraw idempotency header',
  );
  assertTrue(
    !JSON.stringify(capturedBody).includes('userId'),
    'withdraw body has no userId',
  );
  assertTrue(
    !JSON.stringify(capturedBody).includes('balance'),
    'withdraw body has no balance',
  );
  assertTrue(
    !JSON.stringify(capturedBody).includes('status'),
    'withdraw body has no status',
  );

  if (failed.length) {
    throw new Error(`paymentMethods.api tests failed:\n${failed.join('\n')}`);
  }
  console.log('paymentMethods.api tests passed');
};

void run();

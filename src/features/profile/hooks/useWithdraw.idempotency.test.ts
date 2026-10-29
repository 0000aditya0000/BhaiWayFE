/**
 * Ensures withdraw retry reuses the same idempotency key for one logical attempt,
 * and a brand-new attempt generates a fresh key.
 */

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

const createController = () => {
  let key: string | null = null;
  const sentKeys: string[] = [];

  const makeKey = () =>
    `withdraw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  return {
    get sentKeys() {
      return sentKeys;
    },
    startNew() {
      key = makeKey();
      return key;
    },
    async submit(reuse: boolean) {
      if (!reuse || !key) {
        key = makeKey();
      }
      sentKeys.push(key);
      return key;
    },
    changeAmount() {
      key = null;
    },
  };
};

const run = async () => {
  const ctrl = createController();
  const first = ctrl.startNew();
  const retryKey = await ctrl.submit(true);
  assertEqual(retryKey, first, 'retry reuses same key');
  assertEqual(ctrl.sentKeys[0], first, 'first sent key');

  ctrl.changeAmount();
  const second = await ctrl.submit(false);
  assertTrue(second !== first, 'new attempt gets new key');

  if (failed.length) {
    throw new Error(`useWithdraw.idempotency tests failed:\n${failed.join('\n')}`);
  }
  console.log('useWithdraw.idempotency tests passed');
};

void run();

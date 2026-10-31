/**
 * Focused resource-cache unit tests (no React Native runtime).
 */
import { cacheKeys } from './cacheKeys';
import { CACHE_STALE_TIMES } from './cachePolicy';
import {
  invalidateTrustedContactsCache,
  invalidateUserProfileCache,
  invalidateVehiclesCache,
  invalidateWalletCache,
  invalidateAfterAadhaarVerification,
  mergeVehicleIntoListCache,
  patchVehicleInListCache,
} from './invalidateResources';
import { resourceCache } from './resourceCache';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async (): Promise<void> => {
  resourceCache.__debug.reset();

  let fetchCount = 0;
  const fetcher = async () => {
    fetchCount += 1;
    await wait(20);
    return { value: fetchCount };
  };

  // 1–3. First request fetches; second consumer shares; dedupe simultaneous
  fetchCount = 0;
  const [a, b] = await Promise.all([
    resourceCache.query({
      key: cacheKeys.user.me(),
      staleTime: CACHE_STALE_TIMES.USER_PROFILE,
      fetcher,
    }),
    resourceCache.query({
      key: cacheKeys.user.me(),
      staleTime: CACHE_STALE_TIMES.USER_PROFILE,
      fetcher,
    }),
  ]);
  assertEqual(fetchCount, 1, 'simultaneous requests deduplicated to one fetch');
  assertEqual(a.data.value, 1, 'first consumer data');
  assertEqual(b.data.value, 1, 'second consumer same data');

  // 4. Fresh cache prevents network request
  fetchCount = 0;
  const fresh = await resourceCache.query({
    key: cacheKeys.user.me(),
    staleTime: CACHE_STALE_TIMES.USER_PROFILE,
    fetcher,
  });
  assertEqual(fetchCount, 0, 'fresh cache prevents network request');
  assertEqual(fresh.status, 'fresh', 'status is fresh');
  assertEqual(fresh.data.value, 1, 'fresh returns cached');

  // 5–6. Stale returns cache immediately + background refresh
  resourceCache.__debug.reset();
  fetchCount = 0;
  const deferred: { resolve: ((value: { value: number }) => void) | null } = {
    resolve: null,
  };
  const slowFetcher = () =>
    new Promise<{ value: number }>((resolve) => {
      fetchCount += 1;
      deferred.resolve = (value) => resolve(value);
    });

  resourceCache.setData(cacheKeys.wallet.balance(), { value: 10 });
  await wait(5);
  const staleResult = await resourceCache.query({
    key: cacheKeys.wallet.balance(),
    staleTime: 1,
    fetcher: slowFetcher,
  });
  assertEqual(staleResult.status, 'stale', 'stale returns cached immediately');
  assertEqual(staleResult.data.value, 10, 'stale shows previous data');
  assertTrue(fetchCount >= 1, 'stale triggers background refresh');
  deferred.resolve?.({ value: 20 });
  await wait(30);
  assertEqual(
    resourceCache.peek<{ value: number }>(cacheKeys.wallet.balance())?.value,
    20,
    'background refresh updates cache',
  );

  // 7. Failed refresh keeps cached data
  resourceCache.__debug.reset();
  resourceCache.setData(cacheKeys.vehicles.list(), [{ id: 'v1' }]);
  await wait(5);
  const keep = await resourceCache.query({
    key: cacheKeys.vehicles.list(),
    staleTime: 1,
    force: true,
    fetcher: async () => {
      throw new Error('network down');
    },
  });
  assertEqual((keep.data as { id: string }[])[0]?.id, 'v1', 'failed refresh keeps cached data');

  // 8. Mutation invalidates
  resourceCache.setData(cacheKeys.user.me(), { id: 'u1' });
  invalidateUserProfileCache();
  assertEqual(resourceCache.peek(cacheKeys.user.me()), undefined, 'profile invalidate clears me');

  // 9. Force refresh
  fetchCount = 0;
  resourceCache.setData(cacheKeys.wallet.balance(), { coins: '1' });
  await resourceCache.query({
    key: cacheKeys.wallet.balance(),
    staleTime: CACHE_STALE_TIMES.WALLET,
    force: true,
    fetcher: async () => {
      fetchCount += 1;
      return { coins: '2' };
    },
  });
  assertEqual(fetchCount, 1, 'pull-to-refresh force fetches');
  assertEqual(
    resourceCache.peek<{ coins: string }>(cacheKeys.wallet.balance())?.coins,
    '2',
    'force updates cache',
  );

  // 10–11. Logout / user isolation
  resourceCache.setUserScope('user-a');
  resourceCache.setData(cacheKeys.user.me(), { id: 'a' });
  resourceCache.setData(cacheKeys.wallet.balance(), { coins: '100' });
  assertEqual(resourceCache.peek<{ id: string }>(cacheKeys.user.me())?.id, 'a', 'user A cache set');

  resourceCache.clearAll();
  assertEqual(resourceCache.peek(cacheKeys.user.me()), undefined, 'logout clears user cache');
  assertEqual(resourceCache.peek(cacheKeys.wallet.balance()), undefined, 'logout clears wallet');

  resourceCache.setUserScope('user-a');
  resourceCache.setData(cacheKeys.user.me(), { id: 'a' });
  resourceCache.setUserScope('user-b');
  assertEqual(
    resourceCache.peek(cacheKeys.user.me()),
    undefined,
    'different user cannot see previous user cache',
  );

  // 13. Pagination keys remain separate
  resourceCache.setUserScope('user-b');
  resourceCache.setData(cacheKeys.withdrawals.list({ page: 1, limit: 20 }), { page: 1 });
  resourceCache.setData(cacheKeys.withdrawals.list({ page: 2, limit: 20 }), { page: 2 });
  assertEqual(
    resourceCache.peek<{ page: number }>(cacheKeys.withdrawals.list({ page: 1, limit: 20 }))?.page,
    1,
    'page 1 key',
  );
  assertEqual(
    resourceCache.peek<{ page: number }>(cacheKeys.withdrawals.list({ page: 2, limit: 20 }))?.page,
    2,
    'page 2 key separate',
  );

  // 14–18. Invalidation helpers
  resourceCache.setData(cacheKeys.wallet.balance(), { coins: '5' });
  resourceCache.setData(cacheKeys.wallet.transactions({ page: 1 }), { items: [] });
  invalidateWalletCache();
  assertEqual(resourceCache.peek(cacheKeys.wallet.balance()), undefined, 'wallet invalidate');
  assertEqual(
    resourceCache.peek(cacheKeys.wallet.transactions({ page: 1 })),
    undefined,
    'wallet transactions invalidate',
  );

  resourceCache.setData(cacheKeys.trustedContacts.list({ page: 1, limit: 50 }), { items: [] });
  invalidateTrustedContactsCache();
  assertEqual(
    resourceCache.peek(cacheKeys.trustedContacts.list({ page: 1, limit: 50 })),
    undefined,
    'trusted contacts invalidate',
  );

  resourceCache.setData(cacheKeys.vehicles.list(), []);
  invalidateVehiclesCache();
  assertEqual(resourceCache.peek(cacheKeys.vehicles.list()), undefined, 'vehicles invalidate');

  resourceCache.setData(cacheKeys.vehicles.list(), [
    { id: 'veh-a', make: 'Honda' },
    { id: 'veh-b', make: 'Tata' },
  ]);
  mergeVehicleIntoListCache({ id: 'veh-c', make: 'Hyundai' });
  const mergedList = resourceCache.peek<Array<{ id: string; make: string }>>(
    cacheKeys.vehicles.list(),
  );
  assertEqual(mergedList?.length, 3, 'merge appends created vehicle');
  assertEqual(mergedList?.[2]?.id, 'veh-c', 'created vehicle is last');
  mergeVehicleIntoListCache({ id: 'veh-c', make: 'Hyundai i20' });
  assertEqual(
    resourceCache.peek<Array<{ id: string; make: string }>>(cacheKeys.vehicles.list())?.length,
    3,
    'merge does not duplicate same vehicle id',
  );
  patchVehicleInListCache('veh-a', { make: 'Honda City' });
  patchVehicleInListCache('veh-b', { make: 'Tata' });
  assertEqual(
    resourceCache.peek<Array<{ id: string; make: string }>>(cacheKeys.vehicles.list())?.[0]?.make,
    'Honda City',
    'patch updates only the targeted vehicle',
  );
  assertEqual(
    resourceCache.peek<Array<{ id: string; make: string }>>(cacheKeys.vehicles.list())?.[1]?.make,
    'Tata',
    'patch leaves other vehicles unchanged',
  );

  resourceCache.setData(cacheKeys.user.me(), {});
  resourceCache.setData(cacheKeys.verification.me(), {});
  resourceCache.setData(cacheKeys.wallet.balance(), {});
  invalidateAfterAadhaarVerification();
  assertEqual(resourceCache.peek(cacheKeys.user.me()), undefined, 'aadhaar clears profile');
  assertEqual(resourceCache.peek(cacheKeys.verification.me()), undefined, 'aadhaar clears verification');
  assertEqual(resourceCache.peek(cacheKeys.wallet.balance()), undefined, 'aadhaar clears wallet');

  resourceCache.__debug.reset();
};

run()
  .then(() => {
    if (failed.length > 0) {
      throw new Error(`resourceCache tests failed:\n${failed.join('\n')}`);
    }
    console.log('resourceCache tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

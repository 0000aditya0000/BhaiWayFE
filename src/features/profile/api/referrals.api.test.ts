import { ENDPOINTS } from '../../../network/endpoints';
import {
  buildReferralShareMessage,
  isReferralCodeAuthError,
  mapReferralError,
  mapReferralListItem,
  mapReferralSummary,
  normalizeOptionalReferralCode,
  normalizeReferralPage,
  normalizeReferralSummary,
  REFERRAL_ERROR_MESSAGES,
} from '../utils/referrals.mapper';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertTrue = (actual: unknown, label: string): void => {
  if (!actual) {
    failed.push(`${label}: expected truthy`);
  }
};

const assertFalse = (actual: unknown, label: string): void => {
  if (actual) {
    failed.push(`${label}: expected falsy`);
  }
};

assertEqual(ENDPOINTS.referrals.summary, '/referrals/summary', 'summary endpoint');
assertEqual(ENDPOINTS.referrals.list, '/referrals', 'list endpoint');

type HttpClientPort = {
  get: <T>(url: string) => Promise<T>;
};

const createApi = (client: HttpClientPort) => ({
  summary: () => client.get(ENDPOINTS.referrals.summary),
  list: (page: number, limit: number) =>
    client.get(`${ENDPOINTS.referrals.list}?page=${page}&limit=${limit}`),
});

const run = async () => {
  let capturedUrl = '';
  const client: HttpClientPort = {
    get: async <T>(url: string): Promise<T> => {
      capturedUrl = url;
      if (url.includes('summary')) {
        return {
          referralCode: 'BHW7K4P9',
          totalReferrals: 5,
          totalCoinsEarned: '250',
        } as T;
      }
      return {
        items: [
          {
            id: 'r1',
            referredUser: { id: 'u1', name: 'Rahul', profilePhoto: null },
            rewardCoins: '50',
            status: 'REWARDED',
            createdAt: '2026-10-12T10:00:00.000Z',
            rewardedAt: '2026-10-12T10:01:00.000Z',
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
      } as T;
    },
  };

  const api = createApi(client);
  const summaryRaw = await api.summary();
  assertEqual(capturedUrl, '/referrals/summary', 'summary request url');
  const summary = mapReferralSummary(normalizeReferralSummary(summaryRaw));
  assertEqual(summary.referralCode, 'BHW7K4P9', 'summary code');
  assertEqual(summary.totalReferrals, 5, 'summary total referrals');
  assertEqual(summary.totalCoinsEarned, '250', 'summary coins');

  const listRaw = await api.list(2, 10);
  assertEqual(capturedUrl, '/referrals?page=2&limit=10', 'list pagination params');
  const page = normalizeReferralPage(listRaw, { page: 2, limit: 10 });
  assertEqual(page.items.length, 1, 'list items');
  const row = mapReferralListItem(page.items[0]!);
  assertEqual(row.name, 'Rahul', 'list name');
  assertTrue(row.amountLabel.includes('50'), 'list amount');
  assertEqual(row.statusLabel, 'Rewarded', 'list status');

  assertEqual(normalizeOptionalReferralCode('  bhw7k4p9  '), 'BHW7K4P9', 'normalize code');
  assertEqual(normalizeOptionalReferralCode('   '), undefined, 'omit empty code');
  assertEqual(normalizeOptionalReferralCode(''), undefined, 'omit blank code');

  const share = buildReferralShareMessage('BHW7K4P9');
  assertTrue(share.includes('BHW7K4P9'), 'share contains backend code');
  assertFalse(share.includes('ARJUN2023'), 'share has no hard-coded demo code');

  assertEqual(
    mapReferralError({ code: 'REFERRAL_CODE_INVALID', status: 400 }),
    REFERRAL_ERROR_MESSAGES.REFERRAL_CODE_INVALID,
    'invalid mapped',
  );
  assertEqual(
    mapReferralError({ code: 'SELF_REFERRAL_NOT_ALLOWED', status: 400 }),
    REFERRAL_ERROR_MESSAGES.SELF_REFERRAL_NOT_ALLOWED,
    'self referral mapped',
  );
  assertTrue(
    isReferralCodeAuthError({ code: 'REFERRAL_CODE_INVALID', status: 400 }),
    'invalid is referral auth error',
  );

  // No frontend reward credit — mappers only transform backend DTOs.
  assertTrue(typeof summary.totalCoinsEarned === 'string', 'coins from backend string');

  if (failed.length) {
    throw new Error(`referrals.api tests failed:\n${failed.join('\n')}`);
  }
  console.log('referrals.api tests passed');
};

void run();

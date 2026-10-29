import {
  decideAadhaarRewardUiMode,
  findAadhaarRewardTransaction,
  isAadhaarRewardTransaction,
  mergeAadhaarRewardUiFlags,
  shouldShowAadhaarRewardClaimOnRoute,
  type AadhaarRewardUiFlags,
} from './aadhaarReward.utils';
import { AADHAAR_REWARD_DISPLAY_TITLE } from '../constants/aadhaar-reward.constants';

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

const baseFlags = (partial?: Partial<AadhaarRewardUiFlags>): AadhaarRewardUiFlags =>
  mergeAadhaarRewardUiFlags({
    claimEligible: true,
    claimModalDismissed: false,
    celebrationSeen: false,
    ...partial,
  });

// 1. New user eligible → claim
assertEqual(
  decideAadhaarRewardUiMode({
    flags: baseFlags({ claimEligible: true }),
    identityVerified: false,
    rewardConfirmed: false,
  }),
  'claim',
  'new user eligible shows claim',
);

assertTrue(
  shouldShowAadhaarRewardClaimOnRoute({
    mode: 'claim',
    profileCompleted: true,
    pathname: '/home',
    segments: ['home'],
  }),
  'claim allowed on home after registration',
);
assertFalse(
  shouldShowAadhaarRewardClaimOnRoute({
    mode: 'claim',
    profileCompleted: false,
    pathname: '/home',
    segments: ['home'],
  }),
  'claim blocked before profile completed',
);
assertFalse(
  shouldShowAadhaarRewardClaimOnRoute({
    mode: 'claim',
    profileCompleted: true,
    pathname: '/login/profile',
    segments: ['login', 'profile'],
  }),
  'claim blocked on complete-profile registration screen',
);
assertFalse(
  shouldShowAadhaarRewardClaimOnRoute({
    mode: 'claim',
    profileCompleted: true,
    pathname: '/login/otp',
    segments: ['login', 'otp'],
  }),
  'claim blocked on login/OTP',
);
assertFalse(
  shouldShowAadhaarRewardClaimOnRoute({
    mode: 'claim',
    profileCompleted: true,
    pathname: '/profile',
    segments: ['login', 'profile'],
  }),
  'claim blocked when segments still on login even if pathname is odd',
);
assertTrue(
  shouldShowAadhaarRewardClaimOnRoute({
    mode: 'claim',
    profileCompleted: true,
    pathname: '/home',
    segments: ['(app)', 'home'],
  }),
  'claim allowed on home with group segments',
);

// 2. Existing user (not eligible) → no claim
assertEqual(
  decideAadhaarRewardUiMode({
    flags: baseFlags({ claimEligible: false }),
    identityVerified: false,
    rewardConfirmed: false,
  }),
  'none',
  'existing user no claim',
);

// 4. Dismissing claim does not mark celebration / reward
assertEqual(
  decideAadhaarRewardUiMode({
    flags: baseFlags({ claimModalDismissed: true }),
    identityVerified: false,
    rewardConfirmed: false,
  }),
  'none',
  'dismissed claim hidden',
);
assertFalse(
  baseFlags({ claimModalDismissed: true }).celebrationSeen,
  'dismiss does not set celebrationSeen',
);

// 5. Verification failure (not verified) → no celebration
assertEqual(
  decideAadhaarRewardUiMode({
    flags: baseFlags({ claimModalDismissed: true }),
    identityVerified: false,
    rewardConfirmed: false,
  }),
  'none',
  'failed verification no celebration',
);

// 6. Pending verification → no celebration
assertEqual(
  decideAadhaarRewardUiMode({
    flags: baseFlags(),
    identityVerified: false,
    rewardConfirmed: false,
  }),
  'claim',
  'pending still claim-eligible until dismissed',
);

// 7. VERIFIED but reward not yet available → no celebration
assertEqual(
  decideAadhaarRewardUiMode({
    flags: baseFlags({ claimModalDismissed: true }),
    identityVerified: true,
    rewardConfirmed: false,
  }),
  'none',
  'verified without reward not celebration',
);

// 8. VERIFIED + reward confirmed → celebration
assertEqual(
  decideAadhaarRewardUiMode({
    flags: baseFlags({ claimModalDismissed: true }),
    identityVerified: true,
    rewardConfirmed: true,
  }),
  'celebration',
  'verified + reward shows celebration',
);

// 11 / 13. Celebration only once
assertEqual(
  decideAadhaarRewardUiMode({
    flags: baseFlags({ celebrationSeen: true }),
    identityVerified: true,
    rewardConfirmed: true,
  }),
  'none',
  'celebration acknowledged once',
);

// 12. Crash recovery: reward exists, celebration not seen
assertEqual(
  decideAadhaarRewardUiMode({
    flags: baseFlags({
      claimEligible: false,
      claimModalDismissed: true,
      celebrationSeen: false,
    }),
    identityVerified: true,
    rewardConfirmed: true,
  }),
  'celebration',
  'crash recovery celebration',
);

// Reward detection by displayTitle
assertTrue(
  isAadhaarRewardTransaction({
    displayTitle: AADHAAR_REWARD_DISPLAY_TITLE,
    transactionType: 'PROMOTIONAL_CREDIT',
    direction: 'CREDIT',
    amount: '50',
    pointSource: 'PROMOTIONAL',
  }),
  'displayTitle match',
);

assertFalse(
  isAadhaarRewardTransaction({
    displayTitle: null,
    transactionType: 'PROMOTIONAL_CREDIT',
    direction: 'CREDIT',
    amount: '50',
    pointSource: 'PROMOTIONAL',
  }),
  'bare promotional 50 is NOT aadhaar (could be referral)',
);

assertFalse(
  isAadhaarRewardTransaction({
    displayTitle: 'Referral signup bonus',
    transactionType: 'PROMOTIONAL_CREDIT',
    direction: 'CREDIT',
    amount: '50',
    pointSource: 'PROMOTIONAL',
  }),
  'referral credit must not trigger aadhaar celebration',
);

assertTrue(
  isAadhaarRewardTransaction({
    displayTitle: 'Aadhaar verification reward',
    transactionType: 'PROMOTIONAL_CREDIT',
    direction: 'CREDIT',
    amount: '50',
    pointSource: 'PROMOTIONAL',
  }),
  'aadhaar-titled promotional 50 still matches',
);

assertFalse(
  isAadhaarRewardTransaction({
    displayTitle: 'Wallet top-up',
    transactionType: 'TOP_UP',
    direction: 'CREDIT',
    amount: '50',
    pointSource: 'PURCHASED',
  }),
  'top-up is not aadhaar reward',
);

assertFalse(
  shouldShowAadhaarRewardClaimOnRoute({
    mode: 'celebration',
    profileCompleted: false,
    pathname: '/login/profile',
    segments: ['login', 'profile'],
  }),
  'celebration blocked on setup profile (referral signup path)',
);

assertTrue(
  shouldShowAadhaarRewardClaimOnRoute({
    mode: 'celebration',
    profileCompleted: true,
    pathname: '/home',
    segments: ['home'],
  }),
  'celebration allowed on home after registration',
);

const found = findAadhaarRewardTransaction([
  {
    transactionId: '1',
    transactionType: 'TOP_UP',
    direction: 'CREDIT',
    amount: '100',
    balanceBefore: '0',
    balanceAfter: '100',
    pointSource: 'PURCHASED',
    status: 'POSTED',
    displayTitle: 'Top up',
    displayCategory: 'TOP_UP',
    referenceType: null,
    referenceId: null,
    createdAt: '2026-01-01',
  },
  {
    transactionId: '2',
    transactionType: 'PROMOTIONAL_CREDIT',
    direction: 'CREDIT',
    amount: '50',
    balanceBefore: '100',
    balanceAfter: '150',
    pointSource: 'PROMOTIONAL',
    status: 'POSTED',
    displayTitle: AADHAAR_REWARD_DISPLAY_TITLE,
    displayCategory: 'BONUS',
    referenceType: null,
    referenceId: null,
    createdAt: '2026-01-02',
  },
]);
assertEqual(found?.transactionId, '2', 'find reward in history');

// 14. Frontend never credits — decision helpers only return UI modes
assertTrue(
  ['none', 'claim', 'celebration'].includes(
    decideAadhaarRewardUiMode({
      flags: baseFlags(),
      identityVerified: false,
      rewardConfirmed: false,
    }),
  ),
  'modes are UI-only',
);

if (failed.length) {
  throw new Error(`aadhaarReward.utils tests failed:\n${failed.join('\n')}`);
}
console.log('aadhaarReward.utils tests passed');

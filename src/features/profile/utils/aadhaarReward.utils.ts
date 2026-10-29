import type { WalletTransactionDto } from '../api/wallet.types';
import {
  AADHAAR_REWARD_AMOUNT_COINS,
  AADHAAR_REWARD_DISPLAY_TITLE,
} from '../constants/aadhaar-reward.constants';

export interface AadhaarRewardUiFlags {
  /** Set when backend marks the auth session as a new / incomplete-profile registration. */
  claimEligible: boolean;
  /** User dismissed or started claim CTA — do not re-show claim modal. */
  claimModalDismissed: boolean;
  /** Local acknowledgment that the celebration modal was shown. Not a financial flag. */
  celebrationSeen: boolean;
}

export type AadhaarRewardUiMode = 'none' | 'claim' | 'celebration';

export const DEFAULT_AADHAAR_REWARD_UI_FLAGS: AadhaarRewardUiFlags = {
  claimEligible: false,
  claimModalDismissed: false,
  celebrationSeen: false,
};

const normalizeTitle = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

/**
 * Detects the backend Aadhaar Verification Reward ledger row.
 *
 * Must NOT match referral signup credits (also 50 promotional Coins) — that false
 * positive opened the Aadhaar celebration modal on Setup Profile during referral
 * registration.
 */
export const isAadhaarRewardTransaction = (
  tx: Pick<
    WalletTransactionDto,
    'displayTitle' | 'transactionType' | 'direction' | 'amount' | 'pointSource'
  >,
): boolean => {
  const title = normalizeTitle(tx.displayTitle);
  if (title === normalizeTitle(AADHAAR_REWARD_DISPLAY_TITLE)) {
    return true;
  }
  // Require an Aadhaar signal in the title — never match bare "50 Coins" promos.
  if (title.includes('aadhaar') && (title.includes('reward') || title.includes('verif'))) {
    return true;
  }

  const type = String(tx.transactionType ?? '').trim().toUpperCase();
  const direction = String(tx.direction ?? '').trim().toUpperCase();
  const amount = String(tx.amount ?? '').trim();
  const source = String(tx.pointSource ?? '').trim().toUpperCase();
  const titleHasAadhaar = title.includes('aadhaar');

  if (
    titleHasAadhaar &&
    type === 'PROMOTIONAL_CREDIT' &&
    direction === 'CREDIT' &&
    amount === AADHAAR_REWARD_AMOUNT_COINS
  ) {
    return true;
  }

  if (
    titleHasAadhaar &&
    source === 'PROMOTIONAL' &&
    direction === 'CREDIT' &&
    amount === AADHAAR_REWARD_AMOUNT_COINS
  ) {
    return true;
  }

  return false;
};

export const findAadhaarRewardTransaction = (
  transactions: readonly WalletTransactionDto[],
): WalletTransactionDto | null =>
  transactions.find((tx) => isAadhaarRewardTransaction(tx)) ?? null;

/**
 * Pure UI mode decision. Celebration wins over claim.
 * Never credits coins — only chooses which modal (if any) to show.
 */
export const decideAadhaarRewardUiMode = (input: {
  flags: AadhaarRewardUiFlags;
  identityVerified: boolean;
  rewardConfirmed: boolean;
}): AadhaarRewardUiMode => {
  const { flags, identityVerified, rewardConfirmed } = input;

  if (rewardConfirmed && !flags.celebrationSeen) {
    return 'celebration';
  }

  if (
    flags.claimEligible &&
    !flags.claimModalDismissed &&
    !identityVerified &&
    !rewardConfirmed &&
    !flags.celebrationSeen
  ) {
    return 'claim';
  }

  return 'none';
};

/**
 * Claim + celebration modals must wait until registration is done and Home is visible.
 * Never show over OTP / complete-profile / login screens (including referral signup).
 *
 * Prefer Expo Router `segments` (reliable for nested stacks) with pathname fallback.
 */
export const shouldShowAadhaarRewardClaimOnRoute = (input: {
  mode: AadhaarRewardUiMode;
  profileCompleted: boolean;
  pathname: string;
  segments?: readonly string[];
}): boolean => {
  if (
    (input.mode !== 'claim' && input.mode !== 'celebration') ||
    !input.profileCompleted
  ) {
    return false;
  }

  const segments = (input.segments ?? [])
    .map((segment) => String(segment ?? '').trim())
    .filter(Boolean);
  // Strip Expo Router group segments like "(tabs)".
  const routeSegments = segments.filter((segment) => !segment.startsWith('('));

  if (routeSegments[0] === 'login' || routeSegments.includes('verify-aadhaar')) {
    return false;
  }

  const path = String(input.pathname ?? '')
    .trim()
    .replace(/\/+$/, '');

  if (
    path.includes('/login') ||
    path.includes('complete-profile') ||
    path.includes('verify-aadhaar') ||
    path.endsWith('/profile') ||
    path.endsWith('/otp')
  ) {
    return false;
  }

  if (routeSegments[0] === 'home') {
    return true;
  }

  return path === '/home' || path.endsWith('/home');
};

export const mergeAadhaarRewardUiFlags = (
  partial?: Partial<AadhaarRewardUiFlags> | null,
): AadhaarRewardUiFlags => ({
  claimEligible: Boolean(partial?.claimEligible),
  claimModalDismissed: Boolean(partial?.claimModalDismissed),
  celebrationSeen: Boolean(partial?.celebrationSeen),
});

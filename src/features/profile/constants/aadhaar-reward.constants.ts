/** Copy + timing for the Aadhaar verification promotional reward UX (display only). */

export const AADHAAR_REWARD_SCREEN = {
  claimTitle: 'Claim 50 BhaiWay Coins',
  claimMessage:
    'Complete your Aadhaar verification and get 50 Coins instantly in your BhaiWay wallet.',
  claimHint: 'Verify your Aadhaar to unlock your reward.',
  claimCta: 'Claim 50 Coins',
  claimLater: 'Maybe Later',
  celebrationTitle: 'Congratulations! 🎉',
  celebrationMessage: '50 Coins have been credited to your BhaiWay wallet.',
  celebrationSubtitle: 'Happy riding! 🚗💨',
  celebrationCta: 'Start Riding',
} as const;

/** Backend display title for the promotional ledger credit. */
export const AADHAAR_REWARD_DISPLAY_TITLE = 'Aadhaar Verification Reward';

/** Promotional reward amount in Coins (integer string). Backend owns the credit. */
export const AADHAAR_REWARD_AMOUNT_COINS = '50';

/** Bounded wallet refresh attempts after Aadhaar VERIFIED before giving up on celebration. */
export const AADHAAR_REWARD_POLL_ATTEMPTS = 4;

/** Delay between reward transaction polls (ms). */
export const AADHAAR_REWARD_POLL_INTERVAL_MS = 1500;

/** Short delay before showing claim modal after auth lands (lets navigation settle). */
export const AADHAAR_REWARD_CLAIM_SHOW_DELAY_MS = 700;

export const AADHAAR_REWARD_STORAGE_KEY_PREFIX = '@bhaiway/aadhaar-reward-ui:';

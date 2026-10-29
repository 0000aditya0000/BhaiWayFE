/**
 * Temporary Play Store reviewer phone routing.
 *
 * Used ONLY to choose the `/auth/msg91/verify` payload shape for the
 * Google Play review account. No OTP value lives in the mobile app.
 *
 * TODO: Remove Play Store review phone payload routing after Play Store
 * verification is complete. After approval, always use MSG91 accessToken.
 */
export const PLAY_REVIEW_PHONE = '9761454075';

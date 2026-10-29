/**
 * Integer-string coin utilities — never use floating point for wallet amounts.
 * All backend wallet fields are integer strings where 1 Coin = ₹1.
 */

const INTEGER_PATTERN = /^\d+$/;

/** Returns true when value is a non-empty integer string (digits only). */
export const isIntegerCoinString = (value: string | null | undefined): boolean => {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0 && INTEGER_PATTERN.test(trimmed);
};

/** Parse integer coin string; returns null for invalid values. */
export const parseIntegerCoinString = (value: string | null | undefined): string | null => {
  const trimmed = String(value ?? '').trim();
  if (!isIntegerCoinString(trimmed)) {
    return null;
  }
  return trimmed.replace(/^0+(?=\d)/, '') || '0';
};

/** Compare two integer coin strings. Returns -1 | 0 | 1. */
export const compareCoinStrings = (left: string, right: string): number => {
  const a = parseIntegerCoinString(left) ?? '0';
  const b = parseIntegerCoinString(right) ?? '0';
  if (a.length !== b.length) {
    return a.length > b.length ? 1 : -1;
  }
  if (a === b) {
    return 0;
  }
  return a > b ? 1 : -1;
};

export const isZeroCoins = (value: string | null | undefined): boolean =>
  (parseIntegerCoinString(value) ?? '0') === '0';

export const isPositiveCoins = (value: string | null | undefined): boolean =>
  compareCoinStrings(parseIntegerCoinString(value) ?? '0', '0') > 0;

/** Format integer coin string with Indian grouping — no decimals. */
export const formatCoinString = (value: string | null | undefined): string => {
  const parsed = parseIntegerCoinString(value);
  if (!parsed) {
    return '0';
  }
  return BigInt(parsed).toLocaleString('en-IN');
};

/** Format as "1,000 Coins" for display. */
export const formatCoinsLabel = (value: string | null | undefined): string =>
  `${formatCoinString(value)} Coins`;

/** Format as signed amount for transactions: "+ 500" or "- 200" */
export const formatSignedCoinString = (
  value: string | null | undefined,
  direction: 'CREDIT' | 'DEBIT' | string,
): string => {
  const parsed = parseIntegerCoinString(value);
  if (!parsed || parsed === '0') {
    return '0';
  }
  const sign = String(direction).toUpperCase() === 'DEBIT' ? '-' : '+';
  return `${sign} ${formatCoinString(parsed)}`;
};

/** Format rupee label for top-up UI (1 Coin = ₹1). */
export const formatRupeeFromCoins = (value: string | null | undefined): string =>
  `₹${formatCoinString(value)}`;

/** Sanitize user input to digits-only integer string. */
export const sanitizeCoinInput = (raw: string): string => raw.replace(/\D/g, '');

/** Validate top-up amount string — must be positive integer. */
export const validateTopUpAmount = (
  value: string,
): { ok: true; amount: string } | { ok: false; message: string } => {
  const sanitized = sanitizeCoinInput(value);
  if (!sanitized || sanitized === '0') {
    return { ok: false, message: 'Enter an amount greater than zero.' };
  }
  if (!isIntegerCoinString(sanitized)) {
    return { ok: false, message: 'Enter a valid whole number of Coins.' };
  }
  return { ok: true, amount: parseIntegerCoinString(sanitized)! };
};

export const generateIdempotencyKey = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `topup-${time}-${random}`;
};

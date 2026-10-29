export interface RazorpayErrorCandidate {
  code?: number;
  description?: string;
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Integer-safe conversion of rupee string/number to paise.
 * E.g. "10" -> 1000, "500" -> 50000.
 */
export const convertRupeesToPaise = (rupees: string | number): number => {
  const numeric = typeof rupees === 'string' ? parseFloat(rupees.trim()) : rupees;
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`Invalid top-up amount: ${rupees}`);
  }
  return Math.round(numeric * 100);
};

/**
 * Detects whether an error returned from Razorpay Checkout represents
 * a user cancellation / back-press / dismissal rather than a hard failure.
 */
export const isRazorpayCancellation = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as RazorpayErrorCandidate;
  const description = (err.description || '').toLowerCase();
  const reason = (err.error?.reason || '').toLowerCase();
  const code = err.code;

  // Razorpay Android/iOS SDK error codes:
  // 0: Network error or dismissed
  // 2: User cancelled / dismissed payment
  return (
    code === 0 ||
    code === 2 ||
    description.includes('cancelled') ||
    description.includes('canceled') ||
    description.includes('dismissed') ||
    description.includes('back pressed') ||
    reason.includes('cancelled') ||
    reason.includes('canceled')
  );
};

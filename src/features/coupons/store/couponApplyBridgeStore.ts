import type { CouponActorContext, CouponChargeScope } from '../api/coupons.types';

/**
 * One-shot bridge: Available Coupons screen → Review booking screens.
 * Consumed on focus so booking draft state stays in the review hook.
 */
export type CouponApplyBridgePayload = {
  code: string;
  chargeScope: Exclude<CouponChargeScope, 'BOTH'>;
  discountAmount: number;
  title: string | null;
  benefitType: string | null;
  pointsCredit: number | null;
  /** Booking context key to ignore stale payloads from another ride. */
  contextKey: string;
};

type Listener = () => void;

let payload: CouponApplyBridgePayload | null = null;
const listeners = new Set<Listener>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

export const couponApplyBridgeStore = {
  set: (next: CouponApplyBridgePayload): void => {
    payload = next;
    emit();
  },
  /** Read without clearing. */
  peek: (): CouponApplyBridgePayload | null => payload,
  /** Read and clear once. */
  consume: (contextKey?: string): CouponApplyBridgePayload | null => {
    const current = payload;
    if (!current) {
      return null;
    }
    if (contextKey && current.contextKey !== contextKey) {
      return null;
    }
    payload = null;
    emit();
    return current;
  },
  clear: (): void => {
    if (payload == null) {
      return;
    }
    payload = null;
    emit();
  },
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: (): CouponApplyBridgePayload | null => payload,
};

export const buildCouponContextKey = (input: {
  actorContext?: CouponActorContext;
  rideId: string;
  rideType: string;
  seats: number;
  rideFare: number;
  assuredFee: number;
}): string =>
  [
    input.actorContext ?? 'RIDER',
    input.rideId.trim(),
    String(input.rideType).trim().toLowerCase(),
    String(Math.max(1, Math.floor(input.seats))),
    String(Math.max(0, Math.round(input.rideFare))),
    String(Math.max(0, Math.round(input.assuredFee))),
  ].join('|');

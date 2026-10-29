/** Backend NoShowClaimKind */
export type NoShowClaimKind = 'DRIVER_NO_SHOW' | 'PASSENGER_NO_SHOW';

/** Backend NoShowClaimStatus */
export type NoShowClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';

/** Backend NoShowDecisionSource */
export type NoShowDecisionSource = 'RESPONDENT' | 'TIMEOUT';

/** Backend NoShowClaimEffectKind — internal diagnostics, not shown in UI. */
export type NoShowClaimEffectKind = 'NOTIFY_RESOLVED' | 'OPEN_SUPPORT';

/** Backend NoShowClaimEffectStatus */
export type NoShowClaimEffectStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type NoShowRideType = 'REGULAR' | 'ASSURED' | 'COMMUTE' | string;

/** Nested `support` on rejected claims (NoShowSupportHintDto). */
export interface NoShowSupportHintDto {
  category: string;
  subcategory: string;
  message: string;
  ticketId: string | null;
}

/**
 * Effect outbox rows (NoShowClaimEffectDto).
 * Kept for typed mapping — never render as user-facing copy.
 */
export interface NoShowClaimEffectDto {
  kind: NoShowClaimEffectKind | string;
  status: NoShowClaimEffectStatus | string;
  attemptCount: number;
  nextAttemptAt: string | null;
  lastError: string | null;
  completedAt: string | null;
}

/**
 * HTTP 200 body of create/get/approve/reject.
 * Backend returns this DTO at the root (not wrapped in `data` / `claim`).
 * Mapper still unwraps those envelopes defensively.
 */
export interface NoShowClaimDto {
  id: string;
  rideId: string;
  bookingId: string | null;
  rideType: NoShowRideType;
  kind: NoShowClaimKind | string;
  claimantUserId: string;
  respondentUserId: string;
  status: NoShowClaimStatus | string;
  respondBy: string;
  respondedAt: string | null;
  respondedByUserId: string | null;
  decisionSource: NoShowDecisionSource | string | null;
  settledAt: string | null;
  settlementIdempotencyKey: string | null;
  supportTicketId: string | null;
  createdAt: string;
  updatedAt: string;
  alreadyOpen: boolean;
  support: NoShowSupportHintDto | null;
  effects: NoShowClaimEffectDto[];
  /**
   * Optional display name — not on the published DTO.
   * Mapped only when the payload actually includes it.
   */
  claimantName: string | null;
}

export interface NoShowApiErrorSupport {
  category: string | null;
  subcategory: string | null;
  message: string | null;
  ticketId: string | null;
}

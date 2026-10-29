/** Backend SupportTicketCategory */
export type SupportTicketCategory =
  | 'BOOKINGS_AND_RIDES'
  | 'PAYMENTS_AND_WALLETS'
  | 'OTHERS';

/** Backend SupportTicketStatus */
export type SupportTicketStatus = 'CREATED' | 'IN_PROGRESS' | 'RESOLVED';

export type SupportBookingsSubcategory =
  | 'VEHICLE_ISSUE'
  | 'DRIVER_BEHAVIOUR'
  | 'PAYMENT_FARE'
  | 'SAFETY_CONCERN'
  | 'APP_ISSUES'
  | 'OTHER';

export type SupportPaymentsSubcategory =
  | 'WALLET_ISSUE'
  | 'PAYMENT_FAILED'
  | 'REFUND_ISSUE'
  | 'FARE_DISPUTE'
  | 'WITHDRAWAL_ISSUE'
  | 'OTHER';

export type SupportOthersSubcategory =
  | 'ACCOUNT_ISSUE'
  | 'VERIFICATION_ISSUE'
  | 'APP_ISSUE'
  | 'SUGGESTION'
  | 'OTHER';

export type SupportTicketSubcategory =
  | SupportBookingsSubcategory
  | SupportPaymentsSubcategory
  | SupportOthersSubcategory
  | string;

export type SupportEligibleRidePeriod = 'active' | 'past';

export type SupportRideRelationRole = 'DRIVER' | 'PASSENGER';

export type SupportCommentAuthorType = 'USER' | 'ADMIN';

export interface SupportAttachmentDto {
  id: string;
  url: string;
  contentType: string;
  createdAt: string;
}

export interface SupportCommentDto {
  id: string;
  authorType: SupportCommentAuthorType | string;
  authorUserId: string;
  message: string;
  createdAt: string;
}

export interface SupportStatusHistoryDto {
  id: string;
  fromStatus: SupportTicketStatus | string | null;
  toStatus: SupportTicketStatus | string;
  changedByAdmin: boolean;
  createdAt: string;
}

export interface SupportRelatedRideSummaryDto {
  rideId: string;
  bookingId: string | null;
  source: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  rideStatus: string;
  role: SupportRideRelationRole | string | null;
}

export interface SupportTicketListItemDto {
  id: string;
  reference: string;
  category: SupportTicketCategory | string;
  subcategory: string;
  subject: string;
  status: SupportTicketStatus | string;
  relatedRideId: string | null;
  relatedBookingId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface SupportTicketDetailDto extends SupportTicketListItemDto {
  description: string;
  relatedWalletTransactionId: string | null;
  attachments: SupportAttachmentDto[];
  comments: SupportCommentDto[];
  statusHistory: SupportStatusHistoryDto[];
  relatedRide: SupportRelatedRideSummaryDto | null;
}

export interface SupportTicketPageDto {
  items: SupportTicketListItemDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EligibleSupportRideDto {
  rideId: string;
  bookingId: string | null;
  role: SupportRideRelationRole | string;
  source: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  rideStatus: string;
  bookingStatus: string | null;
  rideType: string;
}

export interface EligibleSupportRidePageDto {
  items: EligibleSupportRideDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateSupportTicketBody {
  category: SupportTicketCategory;
  subcategory: string;
  description: string;
  relatedRideId?: string;
  relatedWalletTransactionId?: string;
  attachmentUrls?: string[];
  idempotencyKey?: string;
}

export interface AddSupportCommentBody {
  message: string;
  idempotencyKey?: string;
}

export interface ListSupportTicketsQuery {
  page?: number;
  limit?: number;
  status?: SupportTicketStatus;
  category?: SupportTicketCategory;
}

export interface ListEligibleSupportRidesQuery {
  period: SupportEligibleRidePeriod;
  page?: number;
  limit?: number;
}

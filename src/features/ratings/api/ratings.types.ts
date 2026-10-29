/** Backend rating task role — who is being rated. */
export type RatingTaskRole = 'DRIVER' | 'PASSENGER';

export interface RatingTaskRideContext {
  rideId: string;
  source: string;
  destination: string;
  departureDate: string;
  departureTime: string;
}

/** One pending rating obligation from GET /ratings/pending. */
export interface PendingRatingTask {
  taskId: string;
  rideId: string;
  bookingId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  role: RatingTaskRole;
  skippedAt?: string | null;
  ride?: RatingTaskRideContext | null;
}

export interface PendingRatingsResponse {
  items: PendingRatingTask[];
}

export interface SubmitRatingRequest {
  taskId: string;
  rating: number;
  comment?: string;
}

export interface SubmitRatingResponse {
  id?: string;
  taskId?: string;
  rating?: number;
  comment?: string | null;
}

export interface SkipRatingResponse {
  taskId?: string;
  status?: string;
  skippedAt?: string | null;
}

export interface UserRatingParty {
  userId?: string;
  userName?: string;
  userPhoto?: string | null;
}

/** GET /ratings/user/:userId — one submitted rating row. */
export interface UserRatingItem {
  id: string;
  taskId?: string;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  rideId?: string;
  fromUser?: UserRatingParty;
  toUser?: UserRatingParty;
  reviewerName?: string;
  reviewerPhoto?: string;
  rideLabel?: string;
  role?: 'DRIVER' | 'PASSENGER';
}

export interface UserRatingsResponse {
  items?: UserRatingItem[];
  ratings?: UserRatingItem[];
  data?: UserRatingItem[];
  averageRating?: number;
  average?: number;
  total?: number;
  totalRatings?: number;
  direction?: 'RECEIVED' | 'GIVEN' | string;
}

export type UserRatingsDirection = 'received' | 'given';

export interface GetUserRatingsOptions {
  direction?: UserRatingsDirection;
}

export interface UserRatingsPage {
  items: UserRatingItem[];
  averageRating?: number;
  total?: number;
  totalRatings?: number;
  direction?: string;
}

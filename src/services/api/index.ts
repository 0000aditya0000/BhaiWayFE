export { bhaiwayApi, API_TAG_TYPES } from './apiSlice';
export { bhaiwayBaseQuery } from './baseQuery';

export {
  useSearchRidesQuery,
  useLazySearchRidesQuery,
  useGetRidesQuery,
  useGetRideQuery,
  useCreateRideMutation,
  useUpdateRideMutation,
  useDeleteRideMutation,
} from './ridesApi';
export type { SearchRidesParams, SearchRidesResponse, CreateRideBody } from './ridesApi';

export {
  useGetMeQuery,
  useGetUserQuery,
  useGetUserProfileQuery,
  useUpdateUserMutation,
} from './usersApi';

export {
  useGetBookingsQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useCancelBookingMutation,
  useAcceptBookingMutation,
  useRejectBookingMutation,
} from './bookingsApi';

export { useCreatePaymentMutation } from './paymentsApi';

export {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from './notificationsApi';

export { useGetRideTrackingQuery, usePostDriverLocationMutation } from './trackingApi';
export type { TrackingLocation } from './trackingApi';

export {
  useGetPendingRatingsQuery,
  useSubmitRatingMutation,
  useSkipRatingTaskMutation,
  useGetUserRatingsQuery,
  useCreateRatingMutation,
  useGetRideRatingsQuery,
} from './ratingsApi';

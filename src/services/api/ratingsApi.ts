import { bhaiwayApi } from './apiSlice';

import type { PendingRatingTask } from '@/features/ratings/api';

export const ratingsApi = bhaiwayApi.injectEndpoints({
  endpoints: (build) => ({
    getPendingRatings: build.query<{ items: PendingRatingTask[] }, void>({
      query: () => '/ratings/pending',
      providesTags: [{ type: 'Rating', id: 'PENDING' }],
    }),
    submitRating: build.mutation<
      Record<string, unknown>,
      { taskId: string; rating: number; comment?: string }
    >({
      query: (body) => ({
        url: '/ratings',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Rating', id: 'PENDING' }],
    }),
    skipRatingTask: build.mutation<Record<string, unknown>, string>({
      query: (taskId) => ({
        url: `/ratings/${taskId}/skip`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Rating', id: 'PENDING' }],
    }),
    getUserRatings: build.query<Record<string, unknown>, string>({
      query: (userId) => `/ratings/user/${userId}`,
      providesTags: (_result, _error, userId) => [{ type: 'Rating', id: userId }],
    }),
  }),
});

export const {
  useGetPendingRatingsQuery,
  useSubmitRatingMutation,
  useSkipRatingTaskMutation,
  useGetUserRatingsQuery,
} = ratingsApi;

/** Back-compat aliases for older imports. */
export const useCreateRatingMutation = useSubmitRatingMutation;
export const useGetRideRatingsQuery = useGetUserRatingsQuery;

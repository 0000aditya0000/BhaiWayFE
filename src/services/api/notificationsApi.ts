import { bhaiwayApi } from './apiSlice';

/**
 * RTK Query endpoints aligned with backend notification inbox + device APIs.
 * Prefer `@/features/notifications` httpClient helpers in screens/hooks.
 */
export const notificationsApi = bhaiwayApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<
      {
        items: unknown[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      },
      { page?: number; limit?: number; unreadOnly?: boolean } | void
    >({
      query: (args) => {
        const page = args?.page ?? 1;
        const limit = args?.limit ?? 20;
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (args?.unreadOnly === true) {
          params.set('unreadOnly', 'true');
        }
        return `/notifications?${params.toString()}`;
      },
      providesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    getNotificationUnreadCount: build.query<{ count: number }, void>({
      query: () => '/notifications/unread-count',
      providesTags: [{ type: 'Notification', id: 'UNREAD' }],
    }),
    markNotificationRead: build.mutation<unknown, string>({
      query: (id) => ({
        url: `/notifications/${encodeURIComponent(id)}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'UNREAD' },
      ],
    }),
    markAllNotificationsRead: build.mutation<{ updatedCount: number }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'UNREAD' },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;

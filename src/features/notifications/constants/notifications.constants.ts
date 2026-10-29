import type { AppNotification, NotificationCategory } from '../types';
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export const NOTIFICATIONS_SCREEN = {
  title: 'Notifications',
  markAllRead: 'Mark all as read',
  emptyTitle: "You're all caught up",
  emptyMessage: "You're all caught up. New notifications will appear here.",
  permissionTitle: 'Enable notifications',
  permissionBody: 'Get ride alerts, booking updates, and payment reminders.',
  permissionCta: 'Allow',
  permissionDeniedBody: 'Notifications are off. Enable them in system settings to stay updated.',
  permissionOpenSettingsCta: 'Open settings',
  sectionToday: 'Today',
  sectionEarlier: 'Earlier',
  loadingLabel: 'Loading notifications…',
  loadErrorTitle: 'Unable to load notifications',
  loadErrorBody: 'Could not load notifications. Check your connection and try again.',
  retryLabel: 'Retry',
  markReadErrorTitle: 'Unable to mark as read',
  markReadErrorBody: 'Could not update this notification. Please try again.',
  markAllSuccessTitle: 'All caught up',
  markAllSuccessBody: 'All notifications were marked as read.',
  markAllErrorTitle: 'Unable to mark all as read',
  markAllErrorBody: 'Could not mark all notifications as read. Please try again.',
  markingAllLabel: 'Updating…',
} as const;

type IconName = ComponentProps<typeof Ionicons>['name'];

export const NOTIFICATION_CATEGORY_ICON: Record<NotificationCategory, IconName> = {
  ride: 'car-outline',
  booking: 'calendar-outline',
  payment: 'wallet-outline',
  verification: 'shield-checkmark-outline',
  promo: 'gift-outline',
  system: 'notifications-outline',
};

/** Test fixtures only — never seeded into the production notification list. */
export const NOTIFICATIONS_MOCK: readonly AppNotification[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Booking confirmed',
    body: 'Your seat is confirmed.',
    timeLabel: '2m ago',
    createdAt: new Date().toISOString(),
    type: 'BOOKING_CONFIRMED',
    category: 'booking',
    section: 'today',
    unread: true,
    isRead: false,
    readAt: null,
    data: { type: 'BOOKING_CONFIRMED' },
  },
] as const;

import type { HomeLocation } from '../../types';

export interface HomeHeaderProps {
  brandName: string;
  location: HomeLocation;
  hasUnreadNotifications?: boolean;
  /** Server unread count for compact badge (e.g. 3, 99+). */
  notificationBadgeCount?: number | null;
  /** Session profile photo. Empty/null keeps the person icon. */
  avatarUri?: string | null;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

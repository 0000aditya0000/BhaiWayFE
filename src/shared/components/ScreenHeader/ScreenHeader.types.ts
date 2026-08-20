import type { ReactNode } from 'react';

export interface ScreenHeaderProps {
  title: string;
  /** Defaults to router.back() / home when omitted. */
  onBack?: () => void;
  /** Opens notifications. Defaults to `/notifications`. */
  onNotificationsPress?: () => void;
  right?: ReactNode;
  showBack?: boolean;
}

import { authSession } from '@/store';

import { userDetailsSheetStore } from '../userDetailsSheetStore';
import {
  NOTIFICATIONS_SHEET_ID_START,
  type NotificationsSheetRow,
} from '../notificationsSheet.types';
import { notificationsSheetStore } from '../notificationsSheetStore';

export interface RemoteNotificationRow {
  notificationId: number;
  userId: number;
  mobile: string;
  title: string;
  body: string;
  timeLabel: string;
  category: string;
  section: string;
  unread: boolean;
  createdAt: string;
}

export interface NotificationSyncResult {
  localRowSaved: boolean;
  remoteSynced: boolean;
  mode: 'insert' | 'update';
  notificationId: number;
  message: string;
}

const normalizeMobile = (value?: string | null): string =>
  (value ?? '').replace(/\D/g, '').slice(-10);

const resolveOwner = () => {
  const phone = normalizeMobile(authSession.getUser()?.phone);
  return (
    (phone ? userDetailsSheetStore.findByMobile(phone) : undefined) ||
    userDetailsSheetStore.getAll()[0]
  );
};

/** Local Notifications persistence (device store). */
export const notificationsSheetSync = {
  /** Hydrate the local Notifications store. */
  pullIntoLocal: async (): Promise<RemoteNotificationRow[]> => {
    await notificationsSheetStore.hydrate();
    return [];
  },

  upsertAndSync: async (
    input: Omit<Partial<RemoteNotificationRow>, 'notificationId'> & {
      notificationId?: number;
      title: string;
      body: string;
    },
  ): Promise<NotificationSyncResult> => {
    const owner = resolveOwner();
    const mobile =
      normalizeMobile(input.mobile) ||
      owner?.mobile ||
      normalizeMobile(authSession.getUser()?.phone) ||
      '';

    const existing =
      input.notificationId && input.notificationId > 0
        ? notificationsSheetStore.findByNotificationId(input.notificationId)
        : undefined;
    const mode: 'insert' | 'update' = existing ? 'update' : 'insert';
    const notificationId =
      existing?.notificationId && existing.notificationId > 0
        ? existing.notificationId
        : input.notificationId && input.notificationId >= NOTIFICATIONS_SHEET_ID_START
          ? input.notificationId
          : notificationsSheetStore.nextNotificationId();

    const saved = await notificationsSheetStore.upsert({
      notificationId,
      userId: input.userId || owner?.userId || 0,
      mobile,
      title: input.title,
      body: input.body,
      timeLabel: input.timeLabel,
      category: input.category as NotificationsSheetRow['category'],
      section: input.section as NotificationsSheetRow['section'],
      unread: input.unread,
      createdAt: input.createdAt,
    });

    return {
      localRowSaved: true,
      remoteSynced: false,
      mode,
      notificationId: saved.notificationId,
      message: `NotificationID ${saved.notificationId} saved locally.`,
    };
  },

  markReadAndSync: async (notificationId: number): Promise<NotificationSyncResult> => {
    const saved = await notificationsSheetStore.markRead(notificationId, false);
    if (!saved) {
      throw Object.assign(new Error('Notification not found.'), {
        code: 'NOTIFICATION_NOT_FOUND',
      });
    }
    return {
      localRowSaved: true,
      remoteSynced: false,
      mode: 'update',
      notificationId: saved.notificationId,
      message: `NotificationID ${saved.notificationId} marked read locally.`,
    };
  },

  markAllReadAndSync: async (): Promise<{ synced: number }> => {
    const rows = await notificationsSheetStore.markAllReadForCurrentUser();
    return { synced: rows.length };
  },
};

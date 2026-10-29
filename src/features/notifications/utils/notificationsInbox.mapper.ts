import type {
  InboxNotificationData,
  InboxNotificationDto,
  InboxNotificationPageDto,
  InboxUnreadCountDto,
  MarkAllInboxReadDto,
} from '../api/notificationsInbox.types';
import type { AppNotification, NotificationCategory } from '../types';
import type { PushNotificationData } from '../api/pushDevices.types';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asString = (value: unknown): string => {
  if (value == null) {
    return '';
  }
  return String(value).trim();
};

const asNullableString = (value: unknown): string | null => {
  const text = asString(value);
  return text.length > 0 ? text : null;
};

const asBool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true' || lower === '1') {
      return true;
    }
    if (lower === 'false' || lower === '0') {
      return false;
    }
  }
  return fallback;
};

const asInt = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }
  return fallback;
};

export const mapInboxTypeToCategory = (type: string): NotificationCategory => {
  const key = String(type ?? '')
    .trim()
    .toUpperCase();
  if (key.includes('BOOKING') || key.includes('COMMUTE') || key.includes('ASSURED')) {
    return key.includes('RIDE') || key.includes('ASSURED') ? 'ride' : 'booking';
  }
  if (key.includes('WALLET') || key.includes('WITHDRAWAL') || key.includes('PAYMENT')) {
    return 'payment';
  }
  if (key.includes('AADHAAR') || key.includes('VERIF')) {
    return 'verification';
  }
  if (key.includes('REFERRAL') || key.includes('REWARD') || key.includes('PROMO')) {
    return 'promo';
  }
  if (key.includes('CHAT')) {
    return 'system';
  }
  if (key.includes('SUPPORT_TICKET') || key.includes('SUPPORT')) {
    return 'system';
  }
  return 'system';
};

const startOfLocalDay = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const formatNotificationTimeLabel = (
  createdAt: string,
  now: Date = new Date(),
): string => {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return '';
  }

  const diffMs = Math.max(0, now.getTime() - created.getTime());
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) {
    return 'Just now';
  }
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24 && startOfLocalDay(created) === startOfLocalDay(now)) {
    return `${diffHr}h ago`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (startOfLocalDay(created) === startOfLocalDay(yesterday)) {
    return 'Yesterday';
  }

  return created.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

export const notificationSectionFor = (
  createdAt: string,
  now: Date = new Date(),
): 'today' | 'earlier' => {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return 'earlier';
  }
  return startOfLocalDay(created) === startOfLocalDay(now) ? 'today' : 'earlier';
};

export const normalizeInboxData = (raw: unknown, fallbackType?: string): InboxNotificationData => {
  const record = asRecord(raw) ?? {};
  const data: InboxNotificationData = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) {
      continue;
    }
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      data[key] = value;
    } else {
      data[key] = String(value);
    }
  }
  if (!data.type && fallbackType) {
    data.type = fallbackType;
  }
  return data;
};

export const normalizeInboxNotification = (raw: unknown): InboxNotificationDto | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const id = asString(row.id);
  if (!id) {
    return null;
  }
  const type = asString(row.type) || 'SYSTEM';
  const readAt = asNullableString(row.readAt ?? row.read_at);
  const isRead =
    typeof row.isRead === 'boolean'
      ? row.isRead
      : typeof row.is_read === 'boolean'
        ? row.is_read
        : readAt != null || asBool(row.isRead, false);

  return {
    id,
    title: asString(row.title) || 'Notification',
    body: asString(row.body ?? row.message),
    type,
    data: normalizeInboxData(row.data, type),
    isRead,
    createdAt: asString(row.createdAt ?? row.created_at) || new Date(0).toISOString(),
    readAt,
  };
};

export const normalizeInboxPage = (
  payload: unknown,
  fallback: { page: number; limit: number },
): InboxNotificationPageDto => {
  const root = asRecord(payload);
  const source = root && asRecord(root.data) ? (root.data as Record<string, unknown>) : root;
  const itemsRaw = Array.isArray(source?.items)
    ? source!.items
    : Array.isArray(source?.notifications)
      ? (source!.notifications as unknown[])
      : Array.isArray(payload)
        ? (payload as unknown[])
        : [];

  const items = itemsRaw
    .map(normalizeInboxNotification)
    .filter((item): item is InboxNotificationDto => item != null);

  const page = asInt(source?.page, fallback.page) || fallback.page;
  const limit = asInt(source?.limit, fallback.limit) || fallback.limit;
  const total = asInt(source?.total, items.length);
  const totalPages =
    asInt(source?.totalPages ?? source?.total_pages, 0) ||
    (total === 0 ? 0 : Math.ceil(total / Math.max(1, limit)));

  return { items, page, limit, total, totalPages };
};

export const normalizeUnreadCount = (payload: unknown): InboxUnreadCountDto => {
  const root = asRecord(payload);
  const source = root && asRecord(root.data) ? (root.data as Record<string, unknown>) : root;
  return {
    count: asInt(source?.count ?? source?.unreadCount ?? source?.unread_count, 0),
  };
};

export const normalizeMarkAllRead = (payload: unknown): MarkAllInboxReadDto => {
  const root = asRecord(payload);
  const source = root && asRecord(root.data) ? (root.data as Record<string, unknown>) : root;
  return {
    updatedCount: asInt(
      source?.updatedCount ?? source?.updated_count ?? source?.count,
      0,
    ),
  };
};

export const mapInboxToAppNotification = (
  dto: InboxNotificationDto,
  now: Date = new Date(),
): AppNotification => ({
  id: dto.id,
  title: dto.title,
  body: dto.body,
  timeLabel: formatNotificationTimeLabel(dto.createdAt, now),
  createdAt: dto.createdAt,
  type: dto.type,
  category: mapInboxTypeToCategory(dto.type),
  section: notificationSectionFor(dto.createdAt, now),
  unread: !dto.isRead,
  isRead: dto.isRead,
  readAt: dto.readAt,
  data: dto.data,
});

/** Convert inbox data → push navigation data (string values). */
export const inboxDataToPushData = (data: InboxNotificationData): PushNotificationData => {
  const out: PushNotificationData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue;
    }
    out[key] = String(value);
  }
  return out;
};

export const formatUnreadBadgeCount = (count: number): string | null => {
  const n = Math.max(0, Math.floor(count));
  if (n <= 0) {
    return null;
  }
  if (n > 99) {
    return '99+';
  }
  return String(n);
};

export const mergeInboxPagesWithoutDuplicates = (
  existing: readonly AppNotification[],
  incoming: readonly AppNotification[],
): AppNotification[] => {
  const seen = new Set(existing.map((item) => item.id));
  const merged = [...existing];
  for (const item of incoming) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
};

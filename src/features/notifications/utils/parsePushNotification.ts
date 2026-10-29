import type {
  ParsedPushNotification,
  PushNotificationData,
} from '../api/pushDevices.types';

const asStringRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object') {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (entry == null) {
      continue;
    }
    const text = String(entry).trim();
    if (text) {
      out[key] = text;
    }
  }
  return out;
};

/**
 * Normalize Expo notification content into title/body/data.
 * FCM data values are always strings.
 */
export const parsePushNotification = (raw: unknown): ParsedPushNotification => {
  const content =
    raw && typeof raw === 'object' && 'request' in (raw as object)
      ? ((raw as { request?: { content?: unknown } }).request?.content ?? {})
      : raw && typeof raw === 'object' && 'content' in (raw as object)
        ? ((raw as { content?: unknown }).content ?? {})
        : raw;

  const record =
    content && typeof content === 'object' ? (content as Record<string, unknown>) : {};
  const data = asStringRecord(record.data) as PushNotificationData;
  const title =
    (typeof record.title === 'string' && record.title.trim()) ||
    data.title ||
    'BhaiWay';
  const body =
    (typeof record.body === 'string' && record.body.trim()) ||
    data.body ||
    '';

  return { title, body, data };
};

export const getPushType = (data: PushNotificationData): string =>
  String(data.type ?? '').trim().toUpperCase();

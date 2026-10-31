import type { SosRecord, SosStatus, SosTriggerer } from './sos.types';

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
};

const readNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const readBool = (value: unknown): boolean =>
  value === true || value === 'true' || value === 1 || value === '1';

const unwrapRoot = (payload: unknown): Record<string, unknown> | null => {
  const root = asRecord(payload);
  if (!root) {
    return null;
  }
  const nested = asRecord(root.data) ?? asRecord(root.sos) ?? asRecord(root.emergency);
  return nested ?? root;
};

const readTriggerer = (raw: unknown): SosTriggerer | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const userId = readText(row.userId ?? row.id ?? row.passengerId);
  const name = readText(
    row.name ?? row.fullName ?? row.firstName ?? row.passengerName ?? row.displayName,
  );
  if (!userId && !name) {
    return null;
  }
  return {
    userId: userId || null,
    name: name || null,
  };
};

const ACTIVE_STATUSES = new Set(['ACTIVE', 'ACKNOWLEDGED', 'RESPONDING', 'TRIGGERED', 'OPEN']);

export const isActiveSosStatus = (status?: string | null): boolean =>
  ACTIVE_STATUSES.has(String(status ?? '').trim().toUpperCase());

export const unwrapSosRecord = (payload: unknown): SosRecord | null => {
  const root = unwrapRoot(payload);
  if (!root) {
    return null;
  }
  const id = readText(root.id ?? root.sosId ?? root.emergencyId);
  const rideId = readText(root.rideId ?? root.ride_id);
  if (!id || !rideId) {
    return null;
  }
  const status = (readText(root.status) || 'ACTIVE') as SosStatus;
  const triggerer =
    readTriggerer(root.triggerer) ??
    readTriggerer(root.triggeredBy) ??
    readTriggerer(root.passenger) ??
    (readText(root.passengerName ?? root.triggererName)
      ? {
          userId: readText(root.triggererUserId ?? root.passengerId) || null,
          name: readText(root.passengerName ?? root.triggererName),
        }
      : null);

  return {
    id,
    rideId,
    status,
    category: (readText(root.category) || 'EMERGENCY') as SosRecord['category'],
    triggeredAt:
      readText(
        root.triggeredAt ?? root.createdAt ?? root.timestamp ?? root.occurredAt,
      ) || null,
    triggerer,
    attachedToExisting: readBool(
      root.attachedToExisting ?? root.alreadyActive ?? root.duplicate,
    ),
    latitude: readNumber(root.latitude ?? asRecord(root.location)?.latitude),
    longitude: readNumber(root.longitude ?? asRecord(root.location)?.longitude),
  };
};

export const unwrapSosEvent = (
  eventName: string,
  payload: unknown,
): SosRecord | null => {
  const record = unwrapSosRecord(payload);
  if (!record) {
    return null;
  }
  const upper = eventName.toUpperCase();
  if (upper.includes('RESOLVED')) {
    return { ...record, status: 'RESOLVED' };
  }
  if (upper.includes('FALSE')) {
    return { ...record, status: 'FALSE_ALARM' };
  }
  if (upper.includes('ACKNOWLEDGED')) {
    return { ...record, status: 'ACKNOWLEDGED' };
  }
  if (upper.includes('RESPONDING')) {
    return { ...record, status: 'RESPONDING' };
  }
  if (upper.includes('ADDITIONAL')) {
    return { ...record, attachedToExisting: true };
  }
  return record;
};

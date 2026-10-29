/** Centralized labels for past ride / booking statuses. */

export const HISTORY_UNAVAILABLE_LABEL = '—';

export const normalizeHistoryStatus = (status: string | undefined): string =>
  String(status ?? '').trim().toUpperCase();

export const isCompletedHistoryStatus = (status: string | undefined): boolean =>
  normalizeHistoryStatus(status) === 'COMPLETED';

export const isCancelledHistoryStatus = (status: string | undefined): boolean =>
  normalizeHistoryStatus(status) === 'CANCELLED';

const firstNonEmpty = (
  ...values: Array<string | null | undefined>
): string | undefined => {
  for (const value of values) {
    if (value != null && String(value).trim()) {
      return String(value);
    }
  }
  return undefined;
};

/** Prefer nested GET /rides/history `{ ride }` fields. Never map CANCELLED → COMPLETED. */
export const resolveHistoryStatusFromDto = (dto: {
  status?: string | null;
  cancelledAt?: string | null;
  ride?: { status?: string | null; cancelledAt?: string | null } | null;
}): string => {
  const raw = firstNonEmpty(dto.status, dto.ride?.status);
  const cancelledAt = firstNonEmpty(dto.cancelledAt, dto.ride?.cancelledAt);
  const normalized = normalizeHistoryStatus(raw);
  if (normalized === 'CANCELLED') {
    return 'CANCELLED';
  }
  if (normalized === 'COMPLETED') {
    return 'COMPLETED';
  }
  if (cancelledAt) {
    return 'CANCELLED';
  }
  return normalized;
};

export const resolveHistoryCancelledAt = (dto: {
  cancelledAt?: string | null;
  ride?: { cancelledAt?: string | null } | null;
}): string | null => firstNonEmpty(dto.cancelledAt, dto.ride?.cancelledAt) ?? null;

/** Maps backend COMPLETED | CANCELLED (and variants) to UI labels. */
export const mapHistoryStatusLabel = (
  status: string | undefined,
  options?: { cancelledAt?: string | null },
): string => {
  const normalized = normalizeHistoryStatus(status);
  if (normalized === 'CANCELLED') {
    return 'Cancelled';
  }
  if (normalized === 'COMPLETED') {
    return 'Completed';
  }
  if (normalized === 'NO_SHOW') {
    return 'No Show';
  }
  if (options?.cancelledAt) {
    return 'Cancelled';
  }
  return status?.trim() || HISTORY_UNAVAILABLE_LABEL;
};

/** Rider invoice status chip copy. */
export const mapInvoiceStatusLabel = (status: string | undefined): string => {
  const normalized = normalizeHistoryStatus(status);
  if (normalized === 'CANCELLED') {
    return 'Ride Cancelled';
  }
  if (normalized === 'COMPLETED') {
    return 'Ride Completed';
  }
  return mapHistoryStatusLabel(status);
};

/** Driver trip details completed badge copy. */
export const mapTripDetailsBadgeLabel = (status: string | undefined): string => {
  const normalized = normalizeHistoryStatus(status);
  if (normalized === 'CANCELLED') {
    return 'Cancelled';
  }
  if (normalized === 'COMPLETED') {
    return 'Completed';
  }
  return mapHistoryStatusLabel(status);
};

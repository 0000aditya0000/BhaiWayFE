import type { ActiveRideItemDto } from './rides.types';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

/** Accept `{ items }`, `{ data: { items } }`, or a bare array. Never invent rides. */
export const unwrapActiveRideItems = (payload: unknown): ActiveRideItemDto[] => {
  if (Array.isArray(payload)) {
    return payload as ActiveRideItemDto[];
  }
  const root = asRecord(payload);
  if (!root) {
    return [];
  }
  if (Array.isArray(root.items)) {
    return root.items as ActiveRideItemDto[];
  }
  const nested = asRecord(root.data);
  if (nested && Array.isArray(nested.items)) {
    return nested.items as ActiveRideItemDto[];
  }
  if (Array.isArray(root.data)) {
    return root.data as ActiveRideItemDto[];
  }
  return [];
};

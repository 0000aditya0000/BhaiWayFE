const pendingKeys = new Map<string, string>();

export const generateSosIdempotencyKey = (rideId: string): string => {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `sos-${rideId.trim() || 'ride'}-${time}-${random}`;
};

/** Stable per ride until the attempt is confirmed or abandoned. */
export const getOrCreateSosIdempotencyKey = (rideId: string): string => {
  const id = rideId.trim();
  const existing = pendingKeys.get(id);
  if (existing) {
    return existing;
  }
  const next = generateSosIdempotencyKey(id);
  pendingKeys.set(id, next);
  return next;
};

export const peekSosIdempotencyKey = (rideId: string): string | null =>
  pendingKeys.get(rideId.trim()) ?? null;

export const clearSosIdempotencyKey = (rideId: string): void => {
  pendingKeys.delete(rideId.trim());
};

export const resetSosIdempotencyKeys = (): void => {
  pendingKeys.clear();
};

/**
 * Exclusive-submit gate used by No-Show report / respond actions.
 * Prevents duplicate POSTs from repeated taps while a request is in flight.
 */
export const acquireNoShowActionLock = (lock: { current: boolean }): boolean => {
  if (lock.current) {
    return false;
  }
  lock.current = true;
  return true;
};

export const releaseNoShowActionLock = (lock: { current: boolean }): void => {
  lock.current = false;
};

/**
 * Driver pickup stops use `stop.id` as the booking record id.
 * The empty placeholder stop must never be posted as a booking id.
 */
export const resolvePassengerNoShowBookingId = (
  stopId: string | null | undefined,
): string => {
  const id = String(stopId ?? '').trim();
  if (!id || id === 'empty') {
    return '';
  }
  return id;
};

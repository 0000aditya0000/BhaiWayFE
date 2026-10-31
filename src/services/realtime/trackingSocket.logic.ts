/** Pure Socket.IO tracking helpers — no React or socket.io-client. */

export const resolveTrackingEventRideId = (
  payloadRideId: string | null | undefined,
  joinedRideId: string | null | undefined,
): string => {
  const fromPayload = String(payloadRideId ?? '').trim();
  if (fromPayload) {
    return fromPayload;
  }
  return String(joinedRideId ?? '').trim();
};

export const shouldIgnoreLocationEvent = (args: {
  payloadRideId: string;
  joinedRideId: string | null;
}): boolean => {
  if (!args.payloadRideId) {
    return true;
  }
  if (!args.joinedRideId) {
    return false;
  }
  return args.payloadRideId !== args.joinedRideId;
};

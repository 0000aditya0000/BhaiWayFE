export type SosAlertSource = 'socket' | 'rest' | 'push';

export const shouldPresentDriverAlert = (args: {
  sosId: string;
  source: SosAlertSource;
  seenAlertSosIds: readonly string[];
}): boolean => {
  const sosId = args.sosId.trim();
  if (!sosId || args.source !== 'socket') {
    return false;
  }
  return !args.seenAlertSosIds.includes(sosId);
};

export const shouldPlayEmergencySound = (args: {
  sosId: string;
  source: SosAlertSource;
  seenSoundSosIds: readonly string[];
}): boolean =>
  shouldPresentDriverAlert({
    sosId: args.sosId,
    source: args.source,
    seenAlertSosIds: args.seenSoundSosIds,
  });

export const shouldNotifyCoPassenger = (args: {
  sosId: string;
  currentUserTriggered: boolean;
  currentUserId?: string | null;
  triggererUserId?: string | null;
  seenPassengerAlertSosIds: readonly string[];
}): boolean => {
  const sosId = args.sosId.trim();
  if (!sosId || args.currentUserTriggered) {
    return false;
  }
  const currentUserId = args.currentUserId?.trim() || '';
  const triggererUserId = args.triggererUserId?.trim() || '';
  if (currentUserId && triggererUserId && currentUserId === triggererUserId) {
    return false;
  }
  return !args.seenPassengerAlertSosIds.includes(sosId);
};

export const isTerminalSosStatus = (status?: string | null): boolean => {
  const value = String(status ?? '').trim().toUpperCase();
  return value === 'RESOLVED' || value === 'FALSE_ALARM' || value === 'CLOSED';
};

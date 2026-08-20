import type { DriverTrackConfirmedPassenger } from '../../types';

export interface ConfirmedPassengerCardProps {
  passenger: DriverTrackConfirmedPassenger;
  onCall: () => void;
  onChat: () => void;
  onPressProfile?: () => void;
}

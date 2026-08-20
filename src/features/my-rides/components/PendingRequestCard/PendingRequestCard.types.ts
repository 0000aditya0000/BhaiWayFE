import type { DriverTrackPendingRequest } from '../../types';

export interface PendingRequestCardProps {
  request: DriverTrackPendingRequest;
  onAccept: () => void;
  onDecline: () => void;
  onPressProfile?: () => void;
}

import type { DriverTrackPendingRequest } from '../../types';

export interface PendingRequestCardProps {
  request: DriverTrackPendingRequest;
  onAccept: () => void;
  onDecline: () => void;
  onPressProfile?: () => void;
  acceptLoading?: boolean;
  declineLoading?: boolean;
  disabled?: boolean;
}

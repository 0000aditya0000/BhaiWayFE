export type EmergencyContactAction = 'call' | 'alarm';

export interface EmergencyContact {
  id: string;
  label: string;
  number?: string;
  action: EmergencyContactAction;
  actionLabel: string;
  icon: 'shield' | 'medkit' | 'people';
  tone: 'error' | 'primary';
}

export interface EmergencyRideSummary {
  /** False when the user has no IN_PROGRESS ride/booking. */
  hasActiveRide: boolean;
  rideId: string | null;
  role: 'rider' | 'driver' | null;
  /** Counterpart name: driver (as rider) or passenger (as driver). */
  driverName: string;
  vehicleLabel: string;
  plateNumber: string;
  locationLabel: string;
  avatarUri: string;
  statusLabel: string;
}

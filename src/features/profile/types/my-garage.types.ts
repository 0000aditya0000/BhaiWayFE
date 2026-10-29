import type { VehicleOwnerMatchStatus, VehicleRcVerificationStatus } from '../api/vehicle.api';

/** UI RC verification state for garage cards (backend remains authoritative). */
export type VehicleRcStatus = 'verified' | 'required' | 'failed';

export interface GarageVehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  variant?: string | null;
  color: string;
  plateNumber: string;
  vehicleType: 'CAR' | 'BIKE';
  isActive: boolean;
  rcStatus: VehicleRcStatus;
  ownerMatchStatus?: VehicleOwnerMatchStatus | null;
  rcVerifiedAt?: string | null;
  lastRcVerificationStatus?: VehicleRcVerificationStatus | null;
}

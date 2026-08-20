export type VehicleRcStatus = 'approved' | 'pending';

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
}

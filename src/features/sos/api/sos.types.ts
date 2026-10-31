export type SosStatus =
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'RESPONDING'
  | 'RESOLVED'
  | 'FALSE_ALARM'
  | string;

export type SosCategory = 'EMERGENCY' | string;

export interface SosTriggerer {
  userId?: string | null;
  name?: string | null;
}

export interface SosRecord {
  id: string;
  rideId: string;
  status: SosStatus;
  category: SosCategory;
  triggeredAt: string | null;
  triggerer: SosTriggerer | null;
  attachedToExisting: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface TriggerSosRequest {
  idempotencyKey: string;
  category: SosCategory;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface SosLocationRequest {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
}

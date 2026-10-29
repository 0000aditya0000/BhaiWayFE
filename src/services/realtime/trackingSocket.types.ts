/**
 * Socket.IO events for Regular Ride live tracking.
 * REST GET /tracking/rides/:rideId remains the initial + fallback path.
 */
export const TRACKING_SOCKET_EVENTS = {
  /** Client → server: join ride room */
  RIDE_JOIN: 'tracking:join',
  /** Client → server: leave ride room */
  RIDE_LEAVE: 'tracking:leave',
  /** Client → server: driver GPS while ride is IN_PROGRESS */
  DRIVER_LOCATION_UPDATE: 'driver:location:update',
  /** Server → client: passenger receives live driver GPS */
  RIDE_LOCATION_UPDATED: 'ride:location:updated',
  /** Server → client: tracking session ended (complete / cancel) */
  RIDE_TRACKING_ENDED: 'ride:tracking:ended',
  /** Server → client: auth / room / validation errors */
  TRACKING_ERROR: 'tracking:error',
} as const;

export type TrackingConnectionStatus =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'OFFLINE'
  | 'LIVE'
  | 'STALE'
  | 'COMPLETED'
  | 'ERROR';

export interface DriverLocationPayload {
  rideId: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  heading?: number | null;
  speed?: number | null;
}

export interface RideLocationUpdatedPayload {
  rideId: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  updatedAt?: string;
  heading?: number | null;
  speed?: number | null;
}

export interface RideTrackingEndedPayload {
  rideId: string;
  reason?: string;
  status?: string;
}

export interface TrackingErrorPayload {
  message: string;
  code?: string;
}

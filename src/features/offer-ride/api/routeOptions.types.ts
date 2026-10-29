/**
 * Swagger: RequestRouteOptionsDto
 * Docs: POST /rides/route-options
 *
 * Place-name labels are optional and ignored for routing.
 */
export interface RequestRouteOptionsDto {
  sourceLatitude: number;
  sourceLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  source?: string;
  destination?: string;
}

/**
 * Swagger: RouteOptionDto
 * Each option includes a signed, expiring selectionToken.
 */
export interface RouteOptionDto {
  selectionToken: string;
  optionId: string;
  polyline: string;
  distanceMeters: number;
  durationSeconds: number | null;
  sourceLatitude: number;
  sourceLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
}

/** Swagger: RouteOptionsResponseDto — HTTP root, no data wrapper. */
export interface RouteOptionsResponseDto {
  options: RouteOptionDto[];
}

/** Exact endpoints used to request (and later publish) a selected option. */
export interface RouteEndpoints {
  sourceLatitude: number;
  sourceLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
}

/**
 * In-memory selection for the current publish/edit session.
 * Do not persist as a long-term route identifier — tokens expire.
 */
export interface SelectedDrivingRoute {
  selectionToken: string;
  optionId: string;
  polyline: string;
  distanceMeters: number;
  durationSeconds: number | null;
  sourceLatitude: number;
  sourceLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
}

export type SelectDrivingRouteMode = 'outstation' | 'commute' | 'commute-return' | 'modify';

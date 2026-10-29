import type {
  RouteEndpoints,
  RouteOptionDto,
  RouteOptionsResponseDto,
  SelectedDrivingRoute,
} from '../api/routeOptions.types';

const formatDistanceKm = (distanceKm: number): string =>
  distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m`
    : `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;

const formatDurationMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.max(1, Math.round(minutes))} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = Math.round(minutes % 60);
  return remainder > 0 ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

const toApiCoordinate = (value: unknown): number | null => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.round(numeric * 1e6) / 1e6;
};

export const ROUTE_SELECTION_USER_MESSAGES = {
  required: 'Select a driving route before publishing.',
  stale:
    'Pickup or drop-off changed. Select a driving route that matches the current locations.',
  missingCoords:
    'Select pickup and drop-off on the map so we can load driving routes.',
  noneReturned:
    'No driving routes were found for these locations. Change the endpoints and try again.',
  fetchFailed: 'Unable to load driving routes. Check your connection and try again.',
  expired: 'Your route selection expired. Please select a driving route again.',
  invalid: 'That route selection is no longer valid. Please select a driving route again.',
  mismatch:
    'The selected route does not match the current pickup or drop-off. Select a route again.',
  inProgress: 'Wait for driving routes to finish loading before publishing.',
} as const;

/** Increments so a slower response cannot overwrite a newer request. */
export class RouteOptionsSession {
  private generation = 0;

  next(): number {
    this.generation += 1;
    return this.generation;
  }

  isCurrent(requestId: number): boolean {
    return requestId === this.generation;
  }

  invalidate(): void {
    this.generation += 1;
  }

  current(): number {
    return this.generation;
  }
}

export const routeEndpointsKey = (endpoints: RouteEndpoints): string =>
  [
    endpoints.sourceLatitude,
    endpoints.sourceLongitude,
    endpoints.destinationLatitude,
    endpoints.destinationLongitude,
  ].join(',');

export const toRouteEndpoints = (
  originLatitude: unknown,
  originLongitude: unknown,
  destinationLatitude: unknown,
  destinationLongitude: unknown,
): RouteEndpoints | null => {
  const sourceLatitude = toApiCoordinate(originLatitude);
  const sourceLongitude = toApiCoordinate(originLongitude);
  const destLatitude = toApiCoordinate(destinationLatitude);
  const destLongitude = toApiCoordinate(destinationLongitude);
  if (
    sourceLatitude == null ||
    sourceLongitude == null ||
    destLatitude == null ||
    destLongitude == null
  ) {
    return null;
  }
  if (sourceLatitude === 0 && sourceLongitude === 0) {
    return null;
  }
  if (destLatitude === 0 && destLongitude === 0) {
    return null;
  }
  return {
    sourceLatitude,
    sourceLongitude,
    destinationLatitude: destLatitude,
    destinationLongitude: destLongitude,
  };
};

export const endpointsEqual = (
  left: RouteEndpoints | null | undefined,
  right: RouteEndpoints | null | undefined,
): boolean => {
  if (!left || !right) {
    return false;
  }
  return routeEndpointsKey(left) === routeEndpointsKey(right);
};

export const toSelectedDrivingRoute = (
  option: RouteOptionDto,
  endpoints: RouteEndpoints,
): SelectedDrivingRoute => ({
  selectionToken: option.selectionToken,
  optionId: option.optionId,
  polyline: option.polyline,
  distanceMeters: option.distanceMeters,
  durationSeconds: option.durationSeconds,
  sourceLatitude: endpoints.sourceLatitude,
  sourceLongitude: endpoints.sourceLongitude,
  destinationLatitude: endpoints.destinationLatitude,
  destinationLongitude: endpoints.destinationLongitude,
});

export const selectionMatchesEndpoints = (
  selection: SelectedDrivingRoute | null | undefined,
  endpoints: RouteEndpoints | null | undefined,
): boolean => {
  if (!selection || !endpoints) {
    return false;
  }
  if (!selection.selectionToken.trim() || !selection.optionId.trim()) {
    return false;
  }
  return endpointsEqual(
    {
      sourceLatitude: selection.sourceLatitude,
      sourceLongitude: selection.sourceLongitude,
      destinationLatitude: selection.destinationLatitude,
      destinationLongitude: selection.destinationLongitude,
    },
    endpoints,
  );
};

export const isExplicitRouteSelection = (
  selection: SelectedDrivingRoute | null | undefined,
  endpoints: RouteEndpoints | null | undefined,
): selection is SelectedDrivingRoute => selectionMatchesEndpoints(selection, endpoints);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toFiniteNumber = (value: unknown): number | null => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toNullableDuration = (value: unknown): number | null => {
  if (value == null) {
    return null;
  }
  const numeric = toFiniteNumber(value);
  return numeric;
};

export const parseRouteOption = (value: unknown): RouteOptionDto | null => {
  if (!isRecord(value)) {
    return null;
  }
  const selectionToken =
    typeof value.selectionToken === 'string' ? value.selectionToken.trim() : '';
  const optionId = typeof value.optionId === 'string' ? value.optionId.trim() : '';
  const polyline = typeof value.polyline === 'string' ? value.polyline : '';
  const distanceMeters = toFiniteNumber(value.distanceMeters);
  const sourceLatitude = toFiniteNumber(value.sourceLatitude);
  const sourceLongitude = toFiniteNumber(value.sourceLongitude);
  const destinationLatitude = toFiniteNumber(value.destinationLatitude);
  const destinationLongitude = toFiniteNumber(value.destinationLongitude);
  if (
    !selectionToken ||
    !optionId ||
    !polyline.trim() ||
    distanceMeters == null ||
    sourceLatitude == null ||
    sourceLongitude == null ||
    destinationLatitude == null ||
    destinationLongitude == null
  ) {
    return null;
  }
  return {
    selectionToken,
    optionId,
    polyline,
    distanceMeters,
    durationSeconds: toNullableDuration(value.durationSeconds),
    sourceLatitude,
    sourceLongitude,
    destinationLatitude,
    destinationLongitude,
  };
};

/**
 * Unwrap POST /rides/route-options. Documented shape is `{ options }` at HTTP root.
 * A `data` wrapper is accepted only if it contains the same DTO.
 */
export const unwrapRouteOptionsResponse = (payload: unknown): RouteOptionDto[] => {
  if (Array.isArray(payload)) {
    return payload.map(parseRouteOption).filter((item): item is RouteOptionDto => item != null);
  }
  if (!isRecord(payload)) {
    return [];
  }
  const root = payload as Partial<RouteOptionsResponseDto> & { data?: unknown };
  const fromRoot = Array.isArray(root.options) ? root.options : null;
  if (fromRoot) {
    return fromRoot.map(parseRouteOption).filter((item): item is RouteOptionDto => item != null);
  }
  if (isRecord(root.data) && Array.isArray((root.data as { options?: unknown }).options)) {
    return ((root.data as { options: unknown[] }).options)
      .map(parseRouteOption)
      .filter((item): item is RouteOptionDto => item != null);
  }
  return [];
};

export const routeOptionLabel = (index: number, total: number): string => {
  if (total <= 1 || index === 0) {
    return `Route ${index + 1}`;
  }
  return `Alternative ${index + 1}`;
};

export const formatRouteDistanceLabel = (distanceMeters: number): string => {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    return '';
  }
  return formatDistanceKm(distanceMeters / 1000);
};

export const formatRouteDurationLabel = (
  durationSeconds: number | null | undefined,
): string => {
  if (durationSeconds == null || !Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return '';
  }
  return formatDurationMinutes(durationSeconds / 60);
};

export const resolveRouteStroke = (
  optionId: string,
  selectedOptionId: string | null,
): { strokeColor: string; strokeWidth: number; zIndex: number } => {
  const selected = selectedOptionId != null && optionId === selectedOptionId;
  return selected
    ? { strokeColor: '#374BB1', strokeWidth: 5, zIndex: 2 }
    : { strokeColor: '#9AA8D9', strokeWidth: 3, zIndex: 1 };
};

const errorTextOf = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return '';
};

export type RouteSelectionErrorKind =
  | 'expired'
  | 'invalid'
  | 'mismatch'
  | 'missing'
  | 'network'
  | null;

export const classifyRouteSelectionError = (error: unknown): RouteSelectionErrorKind => {
  const status =
    error && typeof error === 'object' && 'status' in error
      ? (error as { status?: unknown }).status
      : undefined;
  const text = errorTextOf(error).toLowerCase();
  if (status === 0) {
    return 'network';
  }
  if (text.includes('expired') && text.includes('route')) {
    return 'expired';
  }
  if (text.includes('does not match the supplied')) {
    return 'mismatch';
  }
  if (text.includes('selected driving route is required')) {
    return 'missing';
  }
  if (
    text.includes('route selection token is invalid') ||
    text.includes('route selection token is malformed') ||
    text.includes('returnrouteselectiontoken') ||
    text.includes('reverse-route') ||
    text.includes('reverse driving route')
  ) {
    return 'invalid';
  }
  return null;
};

export const mapRouteSelectionError = (error: unknown): string => {
  const kind = classifyRouteSelectionError(error);
  if (kind === 'expired') {
    return ROUTE_SELECTION_USER_MESSAGES.expired;
  }
  if (kind === 'invalid') {
    return ROUTE_SELECTION_USER_MESSAGES.invalid;
  }
  if (kind === 'mismatch') {
    return ROUTE_SELECTION_USER_MESSAGES.mismatch;
  }
  if (kind === 'missing') {
    return ROUTE_SELECTION_USER_MESSAGES.required;
  }
  if (kind === 'network') {
    return ROUTE_SELECTION_USER_MESSAGES.fetchFailed;
  }
  return errorTextOf(error).trim() || ROUTE_SELECTION_USER_MESSAGES.fetchFailed;
};

export const isRouteSelectionTokenError = (error: unknown): boolean => {
  const kind = classifyRouteSelectionError(error);
  return kind === 'expired' || kind === 'invalid' || kind === 'mismatch' || kind === 'missing';
};

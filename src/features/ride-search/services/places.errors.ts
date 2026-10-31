export type PlacesErrorCode =
  | 'NO_KEY'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'RATE_LIMIT'
  | 'DENIED'
  | 'INVALID_KEY'
  | 'EMPTY'
  | 'PERMISSION'
  | 'UNKNOWN';

export class PlacesError extends Error {
  readonly code: PlacesErrorCode;

  constructor(code: PlacesErrorCode, message: string) {
    super(message);
    this.name = 'PlacesError';
    this.code = code;
  }
}

export const placesErrorMessage = (error: unknown): string => {
  if (error instanceof PlacesError) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Something went wrong while searching. Please try again.';
};

export const mapHttpStatusToPlacesError = (status: number, body = ''): PlacesError => {
  const lower = body.toLowerCase();

  if (status === 401 || status === 403 || lower.includes('api_key') || lower.includes('api key')) {
    return new PlacesError(
      'INVALID_KEY',
      'Google Places API key is missing or invalid. Check EXPO_PUBLIC_GOOGLE_PLACES_API_KEY and enable Places API (New).',
    );
  }
  if (status === 429 || lower.includes('quota') || lower.includes('rate')) {
    return new PlacesError(
      'RATE_LIMIT',
      'Search limit reached. Please wait a moment and try again.',
    );
  }
  if (status >= 500) {
    return new PlacesError('NETWORK', 'Google Places is temporarily unavailable. Please try again.');
  }
  return new PlacesError('UNKNOWN', `Place search failed (${status}). Please try again.`);
};

export const cancelledPlacesError = (): PlacesError =>
  new PlacesError('CANCELLED', 'Search was cancelled.');

export const isPlacesCancelled = (error: unknown): boolean => {
  if (error instanceof PlacesError) {
    return error.code === 'CANCELLED';
  }
  return error instanceof Error && error.name === 'AbortError';
};

export const mapFetchFailureToPlacesError = (error: unknown): PlacesError => {
  if (error instanceof PlacesError) {
    return error;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return cancelledPlacesError();
  }
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('network') || message.includes('failed to fetch')) {
    return new PlacesError(
      'NETWORK',
      'No internet connection. Check your network and try again.',
    );
  }
  return new PlacesError('UNKNOWN', placesErrorMessage(error));
};

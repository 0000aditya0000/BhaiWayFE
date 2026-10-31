import {
  cancelledPlacesError,
  isPlacesCancelled,
  mapFetchFailureToPlacesError,
  PlacesError,
} from './places.errors';

const failed: string[] = [];

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const abortError = new Error('Aborted');
abortError.name = 'AbortError';

assertTrue(isPlacesCancelled(cancelledPlacesError()), 'CANCELLED PlacesError is cancelled');
assertTrue(isPlacesCancelled(abortError), 'AbortError is cancelled');
assertTrue(!isPlacesCancelled(new PlacesError('TIMEOUT', 'timed out')), 'timeout is not cancel');
assertEqual(mapFetchFailureToPlacesError(abortError).code, 'CANCELLED', 'AbortError maps to CANCELLED');
assertEqual(
  mapFetchFailureToPlacesError(new PlacesError('INVALID_KEY', 'bad key')).code,
  'INVALID_KEY',
  'preserves PlacesError codes',
);

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('places.errors tests passed');

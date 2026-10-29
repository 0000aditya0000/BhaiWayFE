import { ENDPOINTS } from '../../../network/endpoints';
import {
  RouteOptionsSession,
  classifyRouteSelectionError,
  endpointsEqual,
  formatRouteDistanceLabel,
  formatRouteDurationLabel,
  isExplicitRouteSelection,
  parseRouteOption,
  resolveRouteStroke,
  routeOptionLabel,
  selectionMatchesEndpoints,
  toRouteEndpoints,
  toSelectedDrivingRoute,
  unwrapRouteOptionsResponse,
} from './routeSelection';
import { decodeGooglePolyline } from '../../../shared/maps/decodeGooglePolyline';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const assertFalse = (value: boolean, label: string): void => {
  if (value) {
    failed.push(`${label}: expected false`);
  }
};

assertEqual(ENDPOINTS.rides.routeOptions, '/rides/route-options', 'POST /rides/route-options path');

const endpoints = toRouteEndpoints(28.5355123, 77.3910444, 28.6139444, 77.2090111);
assertTrue(endpoints != null, 'valid endpoints parse');
assertEqual(endpoints?.sourceLatitude, 28.535512, 'source lat rounded to 6 decimals');

const other = toRouteEndpoints(28.6, 77.2, 28.7, 77.3);
assertFalse(endpointsEqual(endpoints, other), 'different endpoints are not equal');
assertTrue(endpointsEqual(endpoints, endpoints), 'same endpoints equal');

const option = parseRouteOption({
  selectionToken: 'signed-token-1',
  optionId: 'opt-1',
  polyline: '_p~iF~ps|U',
  distanceMeters: 245000,
  durationSeconds: 15000,
  sourceLatitude: 28.535512,
  sourceLongitude: 77.391044,
  destinationLatitude: 28.613944,
  destinationLongitude: 77.209011,
  extraInvented: 'ignore-me',
});
assertTrue(option != null, 'valid option parses');
assertFalse(option != null && 'extraInvented' in option, 'unknown fields are not copied');

assertEqual(parseRouteOption({ optionId: 'x' }), null, 'malformed option rejected');

const unwrapped = unwrapRouteOptionsResponse({
  options: [option, { optionId: 'bad' }],
});
assertEqual(unwrapped.length, 1, 'unwrap keeps only valid options');

const fromDataWrapper = unwrapRouteOptionsResponse({
  data: { options: [option] },
});
assertEqual(fromDataWrapper.length, 1, 'data wrapper is accepted without inventing fields');

assertEqual(unwrapRouteOptionsResponse({ options: [] }).length, 0, 'empty options stay empty');

const decoded = decodeGooglePolyline('_p~iF~ps|U');
assertTrue(decoded.length >= 1, 'decodes google polyline');
assertEqual(Number(decoded[0].latitude.toFixed(1)), 38.5, 'decoded latitude');
assertEqual(Number(decoded[0].longitude.toFixed(1)), -120.2, 'decoded longitude');
assertEqual(decodeGooglePolyline('').length, 0, 'empty polyline does not invent geometry');

const selected = toSelectedDrivingRoute(option!, endpoints!);
assertEqual(selected.selectionToken, 'signed-token-1', 'token copied verbatim');
assertEqual(selected.sourceLatitude, endpoints!.sourceLatitude, 'token bound to request endpoints');
assertTrue(selectionMatchesEndpoints(selected, endpoints), 'selection matches request endpoints');
assertFalse(selectionMatchesEndpoints(selected, other), 'endpoint change invalidates selection');
assertFalse(isExplicitRouteSelection(null, endpoints), 'no silent selection');

assertEqual(routeOptionLabel(0, 1), 'Route 1', 'single option is still Route 1');
assertEqual(routeOptionLabel(0, 3), 'Route 1', 'first of many is Route 1');
assertEqual(routeOptionLabel(1, 3), 'Alternative 2', 'second is Alternative 2');

assertTrue(formatRouteDistanceLabel(245000).includes('km'), 'distance formatted from meters');
assertTrue(formatRouteDurationLabel(15000).includes('hr'), 'duration formatted from seconds');
assertEqual(formatRouteDurationLabel(null), '', 'missing duration is omitted');

const selectedStroke = resolveRouteStroke('opt-1', 'opt-1');
const altStroke = resolveRouteStroke('opt-2', 'opt-1');
assertTrue(selectedStroke.strokeWidth > altStroke.strokeWidth, 'selected route is thicker');
assertTrue(selectedStroke.zIndex > altStroke.zIndex, 'selected route draws on top');

const session = new RouteOptionsSession();
const first = session.next();
const second = session.next();
assertFalse(session.isCurrent(first), 'stale request is ignored');
assertTrue(session.isCurrent(second), 'latest request is current');
session.invalidate();
assertFalse(session.isCurrent(second), 'invalidate drops in-flight responses');

assertEqual(
  classifyRouteSelectionError({ status: 400, message: 'Route selection has expired' }),
  'expired',
  'expired token classified',
);
assertEqual(
  classifyRouteSelectionError({
    status: 400,
    message: 'Selected route does not match the supplied source coordinates',
  }),
  'mismatch',
  'mismatch classified',
);
assertEqual(
  classifyRouteSelectionError({ status: 0, message: 'network request failed' }),
  'network',
  'offline classified',
);

if (failed.length > 0) {
  throw new Error(`routeSelection tests failed:\n${failed.join('\n')}`);
}

console.log('routeSelection tests passed');

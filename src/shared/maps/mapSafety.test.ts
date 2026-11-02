import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { isValidMapCoordinate, parseMapCoordinate } from './map.utils';
import type { BhaiWayMapMarker, MapLatLng } from './map.types';

console.log('--- BhaiWay Map Safety & Coordinate Validation Tests ---');

// 1. Coordinate Validation Tests
assert.equal(isValidMapCoordinate(null), false, 'null coordinate must be invalid');
assert.equal(isValidMapCoordinate(undefined), false, 'undefined coordinate must be invalid');
assert.equal(isValidMapCoordinate({} as any), false, 'empty object must be invalid');
assert.equal(isValidMapCoordinate({ latitude: NaN, longitude: 77.2 }), false, 'NaN latitude must be invalid');
assert.equal(isValidMapCoordinate({ latitude: 28.6, longitude: NaN }), false, 'NaN longitude must be invalid');
assert.equal(isValidMapCoordinate({ latitude: Infinity, longitude: 77.2 }), false, 'Infinity latitude must be invalid');
assert.equal(isValidMapCoordinate({ latitude: 28.6, longitude: -Infinity }), false, '-Infinity longitude must be invalid');
assert.equal(isValidMapCoordinate({ latitude: 0, longitude: 0 }), false, '(0,0) coordinate must be invalid');
assert.equal(isValidMapCoordinate({ latitude: 91, longitude: 77.2 }), false, 'latitude > 90 must be invalid');
assert.equal(isValidMapCoordinate({ latitude: -91, longitude: 77.2 }), false, 'latitude < -90 must be invalid');
assert.equal(isValidMapCoordinate({ latitude: 28.6, longitude: 181 }), false, 'longitude > 180 must be invalid');
assert.equal(isValidMapCoordinate({ latitude: 28.6, longitude: -181 }), false, 'longitude < -180 must be invalid');
assert.equal(isValidMapCoordinate({ latitude: 28.6139, longitude: 77.2090 }), true, 'valid Delhi coordinate must be valid');
assert.equal(isValidMapCoordinate({ latitude: 12.9716, longitude: 77.5946 }), true, 'valid Bangalore coordinate must be valid');

// 2. parseMapCoordinate Tests
assert.deepEqual(parseMapCoordinate('28.6139', '77.2090'), { latitude: 28.6139, longitude: 77.2090 }, 'string coordinates should parse');
assert.equal(parseMapCoordinate('invalid', '77.2090'), null, 'unparseable string latitude should return null');
assert.equal(parseMapCoordinate(null, null), null, 'null inputs should return null');

// 3. Marker Sanitization Functionality
const testMarkers: any[] = [
  null,
  undefined,
  { id: '', coordinate: { latitude: 28.6, longitude: 77.2 }, kind: 'source' },
  { id: 123, coordinate: { latitude: 28.6, longitude: 77.2 }, kind: 'source' }, // invalid id type
  { id: 'bad-coord-1', coordinate: null, kind: 'source' },
  { id: 'bad-coord-2', coordinate: { latitude: NaN, longitude: 77.2 }, kind: 'source' },
  { id: 'bad-coord-3', coordinate: { latitude: 0, longitude: 0 }, kind: 'source' },
  { id: 'valid-source', coordinate: { latitude: 28.6139, longitude: 77.2090 }, kind: 'source', title: 'Pickup' },
  { id: 'valid-dest', coordinate: { latitude: 28.7041, longitude: 77.1025 }, kind: 'destination', title: 'Dropoff' },
];

const validMarkers = testMarkers.filter(
  (marker): marker is BhaiWayMapMarker =>
    marker != null &&
    typeof marker.id === 'string' &&
    marker.id.length > 0 &&
    isValidMapCoordinate(marker.coordinate),
);

assert.equal(validMarkers.length, 2, 'Only 2 valid markers should pass sanitization');
assert.equal(validMarkers[0].id, 'valid-source');
assert.equal(validMarkers[1].id, 'valid-dest');

// 4. Polyline Sanitization Functionality
const testPolylinePoints: any[] = [
  { latitude: 28.6139, longitude: 77.2090 },
  null,
  { latitude: NaN, longitude: 77.1025 },
  { latitude: 0, longitude: 0 },
  { latitude: 28.7041, longitude: 77.1025 },
];

const filteredPolyline = testPolylinePoints.filter(isValidMapCoordinate);
assert.equal(filteredPolyline.length, 2, 'Polyline must filter out null, NaN, and (0,0)');
assert.equal(filteredPolyline.length >= 2, true, 'Polyline with >= 2 points is valid to render');

const singlePointPolyline: MapLatLng[] = [{ latitude: 28.6139, longitude: 77.2090 }];
const filteredSingle = singlePointPolyline.filter(isValidMapCoordinate);
const shouldRenderSingle = filteredSingle.length >= 2;
assert.equal(shouldRenderSingle, false, 'Single point polyline must NOT be rendered');

// 5. Native react-native-maps Patch Verification
const rootDir = path.resolve(__dirname, '../../..');
const airMapPath = path.join(rootDir, 'node_modules', 'react-native-maps', 'ios', 'AirMaps', 'AIRMap.m');
const airGoogleMapPath = path.join(rootDir, 'node_modules', 'react-native-maps', 'ios', 'AirGoogleMaps', 'AIRGoogleMap.m');

if (fs.existsSync(airMapPath)) {
  const airMapContent = fs.readFileSync(airMapPath, 'utf8');
  assert.ok(
    airMapContent.includes('if (subview == nil) {\n        return;\n    }'),
    'AIRMap.m insertReactSubview must contain nil guard',
  );
  assert.ok(
    airMapContent.includes('NSUInteger safeIndex = atIndex < 0 ? 0 : MIN((NSUInteger)atIndex, _reactSubviews.count);'),
    'AIRMap.m insertReactSubview must contain bounds check for _reactSubviews',
  );
  assert.ok(
    airMapContent.includes('removeReactSubview:(id<RCTComponent>)subview {\n    if (subview == nil) {\n        return;\n    }'),
    'AIRMap.m removeReactSubview must contain nil guard',
  );
  console.log('✓ AIRMap.m native patch verified successfully');
} else {
  console.warn('AIRMap.m not found at path, skipping native content assertion');
}

if (fs.existsSync(airGoogleMapPath)) {
  const airGoogleMapContent = fs.readFileSync(airGoogleMapPath, 'utf8');
  assert.ok(
    airGoogleMapContent.includes('if (subview == nil) {\n    return;\n  }'),
    'AIRGoogleMap.m insertReactSubview must contain nil guard',
  );
  assert.ok(
    airGoogleMapContent.includes('NSUInteger safeIndex = atIndex < 0 ? 0 : MIN((NSUInteger)atIndex, _reactSubviews.count);'),
    'AIRGoogleMap.m insertReactSubview must contain bounds check for _reactSubviews',
  );
  console.log('✓ AIRGoogleMap.m native patch verified successfully');
} else {
  console.warn('AIRGoogleMap.m not found at path, skipping native content assertion');
}

console.log('✓ All BhaiWay Map Safety & Coordinate Validation Tests PASSED!');


import {
  applyRcVerificationToGarageVehicle,
  collectVehicleRcFailureMessages,
  mapVehicleRcVerificationError,
  ownerMatchLabel,
  resolveVehicleRcUiStatus,
  VEHICLE_RC_ERROR_MESSAGES,
} from './vehicleRcVerification.mapper';
import type { GarageVehicle } from '../types';
import {
  evaluatePublishVerificationReadiness,
  primaryPublishBlockMessage,
} from '../../offer-ride/utils/publishReadiness';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertTrue = (actual: unknown, label: string): void => {
  if (!actual) {
    failed.push(`${label}: expected truthy, got ${String(actual)}`);
  }
};

const assertFalse = (actual: unknown, label: string): void => {
  if (actual) {
    failed.push(`${label}: expected falsy, got ${String(actual)}`);
  }
};

const baseVehicle: GarageVehicle = {
  id: 'veh-1',
  name: 'Honda City',
  make: 'Honda',
  model: 'Honda City',
  color: 'White',
  plateNumber: 'DL01AB1234',
  vehicleType: 'CAR',
  isActive: true,
  rcStatus: 'required',
};

// Error mapping
assertEqual(
  mapVehicleRcVerificationError({
    status: 422,
    code: 'VEHICLE_RC_INVALID',
    message: 'invalid',
  }),
  VEHICLE_RC_ERROR_MESSAGES.VEHICLE_RC_INVALID,
  'VEHICLE_RC_INVALID maps',
);
assertEqual(
  mapVehicleRcVerificationError({
    status: 422,
    code: 'VEHICLE_NUMBER_MISMATCH',
    message: 'mismatch',
  }),
  VEHICLE_RC_ERROR_MESSAGES.VEHICLE_NUMBER_MISMATCH,
  'VEHICLE_NUMBER_MISMATCH maps',
);
assertEqual(
  mapVehicleRcVerificationError({
    status: 403,
    code: 'VEHICLE_ACCESS_DENIED',
    message: 'denied',
  }),
  VEHICLE_RC_ERROR_MESSAGES.VEHICLE_ACCESS_DENIED,
  'VEHICLE_ACCESS_DENIED maps',
);
assertEqual(
  mapVehicleRcVerificationError({ status: 0, code: 'NETWORK_ERROR', message: 'down' }),
  VEHICLE_RC_ERROR_MESSAGES.NETWORK,
  'network failure maps',
);
assertEqual(
  mapVehicleRcVerificationError({ status: 429, code: 'HTTP_429', message: 'rate' }),
  VEHICLE_RC_ERROR_MESSAGES.RATE_LIMITED,
  '429 maps',
);

// RC UI status
assertEqual(
  resolveVehicleRcUiStatus({
    verification: {
      vehicleId: 'veh-1',
      status: 'VERIFIED',
      vehicleNumber: 'DL01AB1234',
    },
  }),
  'verified',
  'RC status renders VERIFIED correctly',
);
assertEqual(
  resolveVehicleRcUiStatus({ response: null }),
  'required',
  'RC status renders unverified correctly',
);
assertEqual(
  resolveVehicleRcUiStatus({
    verification: { vehicleId: 'veh-1', status: 'PENDING', vehicleNumber: 'DL01AB1234' },
  }),
  'pending',
  'PENDING verification maps to pending',
);
assertEqual(
  resolveVehicleRcUiStatus({
    response: {
      id: 'veh-b',
      vehicleType: 'CAR',
      make: 'Honda',
      model: 'City',
      registrationNumber: 'DL01AB1234',
      seatingCapacity: 5,
      isActive: true,
    },
  }),
  'required',
  'missing per-vehicle RC status is not verified',
);

// Owner match
assertEqual(ownerMatchLabel('MATCHED'), 'Vehicle ownership verified', 'MATCHED wording');
assertEqual(
  ownerMatchLabel('NOT_MATCHED'),
  'Vehicle owner details could not be matched with your verified identity.',
  'NOT_MATCHED wording',
);
assertEqual(ownerMatchLabel('NOT_CHECKED'), null, 'NOT_CHECKED hidden');

const verified = applyRcVerificationToGarageVehicle(baseVehicle, {
  vehicleId: 'veh-1',
  status: 'VERIFIED',
  vehicleNumber: 'DL01AB1234',
  verifiedAt: '2026-09-18T01:54:45.000Z',
  ownerMatchStatus: 'MATCHED',
});
assertEqual(verified.rcStatus, 'verified', 'apply VERIFIED updates garage');
assertEqual(verified.ownerMatchStatus, 'MATCHED', 'apply keeps owner match');

const notVerifiedHttpOk = applyRcVerificationToGarageVehicle(baseVehicle, {
  vehicleId: 'veh-1',
  status: 'FAILED',
  vehicleNumber: 'MH12CD9999',
  failedChecks: [
    { code: 'VEHICLE_NAME_MISMATCH', entered: 'Hyundai i20', rcValue: 'Hyundai Grand i10' },
    { code: 'INSURANCE_EXPIRED', message: 'Insurance has expired.' },
  ],
  rcRecord: { vehicleName: 'Hyundai Grand i10', color: 'WHITE' },
});
assertEqual(notVerifiedHttpOk.rcStatus, 'failed', 'non-VERIFIED does not mark verified');
assertEqual(notVerifiedHttpOk.plateNumber, 'DL01AB1234', 'failed RC does not replace plate');
assertEqual(notVerifiedHttpOk.name, 'Honda City', 'failed RC does not replace user name');
assertTrue(
  (notVerifiedHttpOk.rcErrorMessages ?? []).includes(VEHICLE_RC_ERROR_MESSAGES.VEHICLE_NAME_MISMATCH),
  'name mismatch error collected',
);
assertTrue(
  (notVerifiedHttpOk.rcErrorMessages ?? []).includes(VEHICLE_RC_ERROR_MESSAGES.INSURANCE_EXPIRED),
  'insurance expired error collected',
);

const onlyA = applyRcVerificationToGarageVehicle(
  { ...baseVehicle, id: 'veh-a' },
  { vehicleId: 'veh-a', status: 'VERIFIED', vehicleNumber: 'UP16AB1234' },
);
const unchangedB = { ...baseVehicle, id: 'veh-b', rcStatus: 'required' as const };
assertEqual(onlyA.rcStatus, 'verified', 'vehicle A verified');
assertEqual(unchangedB.rcStatus, 'required', 'vehicle B stays unchanged');

assertTrue(
  collectVehicleRcFailureMessages({
    status: 'FAILED',
    failedChecks: [
      { code: 'VEHICLE_NAME_MISMATCH' },
      { code: 'INSURANCE_EXPIRED' },
      { code: 'REGISTRATION_STATUS_INVALID' },
    ],
  }).length >= 3,
  'multiple failed checks all surface',
);
assertEqual(
  mapVehicleRcVerificationError({ status: 422, code: 'VEHICLE_COLOR_MISMATCH', message: 'colour' }),
  VEHICLE_RC_ERROR_MESSAGES.VEHICLE_COLOR_MISMATCH,
  'colour mismatch maps',
);
assertEqual(
  mapVehicleRcVerificationError({ status: 503, code: 'RC_PROVIDER_UNAVAILABLE', message: 'down' }),
  VEHICLE_RC_ERROR_MESSAGES.PROVIDER_UNAVAILABLE,
  'provider unavailable maps',
);

// Publishing readiness — DL optional
const ready = evaluatePublishVerificationReadiness({
  identityStatus: 'VERIFIED',
  vehicleVerificationStatus: 'VERIFIED',
  drivingLicenseStatus: 'PENDING',
  vehicleIsActive: true,
  hasSelectedVehicle: true,
});
assertTrue(ready.ready, 'Aadhaar + RC verified + active vehicle → ready (DL optional)');
assertTrue(ready.drivingLicenseOptional, 'DL flagged optional');
assertFalse(
  ready.messages.some((m) => m.toLowerCase().includes('license') || m.toLowerCase().includes('licence')),
  'no DL required message when DL pending',
);

const missingRc = evaluatePublishVerificationReadiness({
  identityStatus: 'VERIFIED',
  vehicleVerificationStatus: 'PENDING',
  vehicleIsRcVerified: false,
  drivingLicenseStatus: 'VERIFIED',
  vehicleIsActive: true,
  hasSelectedVehicle: true,
});
assertFalse(missingRc.ready, 'Aadhaar verified but RC not → blocked');
assertEqual(
  primaryPublishBlockMessage(missingRc),
  'Vehicle RC verification is required before publishing a ride.',
  'RC required message',
);

const missingAadhaar = evaluatePublishVerificationReadiness({
  identityStatus: 'PENDING',
  vehicleVerificationStatus: 'VERIFIED',
  vehicleIsRcVerified: true,
  drivingLicenseStatus: 'VERIFIED',
  vehicleIsActive: true,
  hasSelectedVehicle: true,
});
assertFalse(missingAadhaar.ready, 'RC verified but Aadhaar not → blocked');
assertEqual(
  primaryPublishBlockMessage(missingAadhaar),
  'Aadhaar verification is required before publishing a ride.',
  'Aadhaar required message',
);

if (failed.length > 0) {
  throw new Error(`vehicleRcVerification tests failed:\n${failed.join('\n')}`);
}

console.log('vehicleRcVerification + publish readiness tests passed');

import {
  API_VEHICLE_TYPES,
  isDuplicateRegistrationError,
  mapAddVehicleFormToCreateDto,
  mapCategoryToVehicleType,
  mapCreateVehicleError,
  mapVehicleResponseToGarageVehicle,
  normalizeRegistrationNumber,
} from './vehicle.mapper';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

assertEqual(API_VEHICLE_TYPES, ['CAR', 'BIKE'], 'backend vehicle types');
assertEqual(mapCategoryToVehicleType('suv'), 'CAR', 'UI category maps to CAR');

const emptyList: ReturnType<typeof mapVehicleResponseToGarageVehicle>[] = [];
assertEqual(emptyList, [], 'empty vehicle list');

const singleVehicle = mapVehicleResponseToGarageVehicle({
  id: 'veh-1',
  vehicleType: 'CAR',
  make: 'Honda',
  model: 'City',
  variant: 'ZX',
  registrationNumber: 'up16ab1234',
  color: 'White',
  seatingCapacity: 5,
  isActive: true,
});
assertEqual(singleVehicle.plateNumber, 'UP16AB1234', 'registration normalized');
assertEqual(singleVehicle.isActive, true, 'active vehicle mapped from backend');
assertEqual(singleVehicle.make, 'Honda', 'make mapped');
assertEqual(singleVehicle.name, 'Honda City', 'name excludes color');
assertEqual(singleVehicle.color, 'White', 'color mapped separately');
assertEqual(singleVehicle.variant, 'ZX', 'variant mapped');
assertEqual(singleVehicle.rcStatus, 'required', 'default RC status is required');

const verifiedVehicle = mapVehicleResponseToGarageVehicle(
  {
    id: 'veh-verified',
    vehicleType: 'CAR',
    make: 'Honda',
    model: 'City',
    registrationNumber: 'DL01AB1234',
    seatingCapacity: 5,
    isActive: true,
    rcVerificationStatus: 'VERIFIED',
    ownerMatchStatus: 'MATCHED',
  },
  null,
);
assertEqual(verifiedVehicle.rcStatus, 'verified', 'per-vehicle VERIFIED maps to verified');
assertEqual(verifiedVehicle.ownerMatchStatus, 'MATCHED', 'owner match mapped');

const aggregateVerified = mapVehicleResponseToGarageVehicle(
  {
    id: 'veh-agg',
    vehicleType: 'CAR',
    make: 'Honda',
    model: 'City',
    registrationNumber: 'DL01AB1234',
    seatingCapacity: 5,
    isActive: true,
  },
  'VERIFIED',
);
assertEqual(aggregateVerified.rcStatus, 'verified', 'aggregate vehicle VERIFIED maps');

const inactiveVehicle = mapVehicleResponseToGarageVehicle({
  id: 'veh-2',
  vehicleType: 'CAR',
  make: 'Maruti',
  model: 'Swift',
  registrationNumber: 'DL3CAB1234',
  seatingCapacity: 5,
  isActive: false,
});
assertEqual(inactiveVehicle.isActive, false, 'inactive vehicle mapped');

const coloredVehicle = mapVehicleResponseToGarageVehicle({
  id: 'veh-3',
  vehicleType: 'CAR',
  make: 'Tata',
  model: 'Nexon',
  registrationNumber: 'DL1CA1234',
  color: 'Black',
  seatingCapacity: 5,
  isActive: true,
});
assertEqual(coloredVehicle.name, 'Tata Nexon', 'colored vehicle name excludes color');
assertEqual(coloredVehicle.color, 'Black', 'colored vehicle color field');

const createPayload = mapAddVehicleFormToCreateDto({
  category: 'sedan',
  model: 'Honda City',
  color: 'White',
  plateNumber: 'dl 3c ab 1234',
  documentUri: null,
  documentName: null,
  documentSecureUrl: null,
  documentPublicId: null,
});
assertEqual(createPayload.vehicleType, 'CAR', 'POST vehicleType');
assertEqual(createPayload.make, 'Honda', 'POST make');
assertEqual(createPayload.model, 'City', 'POST model');
assertEqual(createPayload.registrationNumber, 'DL 3C AB 1234', 'POST registrationNumber');
assertEqual(createPayload.seatingCapacity, 5, 'POST seatingCapacity');
assertEqual(createPayload.color, 'White', 'POST color');
assertEqual('userId' in createPayload, false, 'does not send userId');
assertEqual('isActive' in createPayload, false, 'does not send isActive');

const withDocument = mapAddVehicleFormToCreateDto({
  category: 'suv',
  model: 'Toyota Innova',
  color: '',
  plateNumber: 'UP32AB1234',
  documentUri: 'https://cdn.example.com/rc.jpg',
  documentName: 'rc.jpg',
  documentSecureUrl: 'https://cdn.example.com/rc.jpg',
  documentPublicId: 'rc/public-id',
});
assertEqual(withDocument.seatingCapacity, 7, 'suv seating capacity');
assertEqual(withDocument.documentUrl, 'https://cdn.example.com/rc.jpg', 'optional documentUrl');
assertEqual(withDocument.documentType, 'RC', 'optional documentType');

assertEqual(
  normalizeRegistrationNumber('  up16 ab 1234  '),
  'UP16 AB 1234',
  'registration normalization',
);

assertEqual(isDuplicateRegistrationError({ status: 409, message: 'Duplicate registration number' }), true, '409 duplicate');
assertEqual(
  mapCreateVehicleError({ status: 409, message: 'Duplicate registration number for this user' }),
  'This registration number is already saved to your garage.',
  '409 message',
);
assertEqual(
  mapCreateVehicleError({ status: 400, message: 'registrationNumber must be longer' }),
  'registrationNumber must be longer',
  '400 message passthrough',
);
assertEqual(
  mapCreateVehicleError({ status: 401, message: 'Unauthorized' }),
  'Your session expired. Please sign in again.',
  '401 message',
);

assertEqual(JSON.stringify(createPayload).includes('msg91'), false, 'no MSG91 in vehicle payload');
assertEqual(JSON.stringify(createPayload).includes('/auth/msg91/verify'), false, 'no auth verify in payload');

if (failed.length > 0) {
  throw new Error(`vehicle.mapper tests failed:\n${failed.join('\n')}`);
}

console.log('vehicle.mapper tests passed');

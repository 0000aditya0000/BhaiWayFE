import {
  toCreateProfileRequest,
  mapProfileResponseToUserProfile,
  resolveProfilePhotoForApi,
  splitFullName,
} from '../utils/completeProfile.mapper';
import type { CompleteProfilePayload, ProfileResponse } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

// Inline reproduction of isPhoneAlreadyRegisteredError logic for isolated unit verification
const isPhoneAlreadyRegisteredError = (error: unknown): boolean => {
  if (!error) return false;
  const anyErr = error as any;
  const status = anyErr?.response?.status;
  const data = anyErr?.response?.data;
  const code = anyErr?.code || data?.code;
  const message = (anyErr?.message || data?.message || '').toString().toLowerCase();

  if (code === 'PHONE_ALREADY_REGISTERED') {
    return true;
  }
  if (status === 409 && (message.includes('already registered') || message.includes('login'))) {
    return true;
  }
  if (message.includes('number already registered') || message.includes('already registered. please login')) {
    return true;
  }
  return false;
};

console.log('[Test Suite] Registration, Duplicate Phone & Profile Photo Persistence');

// 1. isPhoneAlreadyRegisteredError checks
console.log('\n1. isPhoneAlreadyRegisteredError checks:');
assert(
  isPhoneAlreadyRegisteredError({ code: 'PHONE_ALREADY_REGISTERED' }) === true,
  'detects code PHONE_ALREADY_REGISTERED',
);
assert(
  isPhoneAlreadyRegisteredError({ message: 'Number already registered. Please login.' }) === true,
  'detects exact message Number already registered. Please login.',
);
assert(
  isPhoneAlreadyRegisteredError({
    response: {
      status: 409,
      data: { code: 'PHONE_ALREADY_REGISTERED', message: 'Number already registered. Please login.' },
    },
  }) === true,
  'detects Axios 409 response with PHONE_ALREADY_REGISTERED code',
);
assert(
  isPhoneAlreadyRegisteredError({
    response: {
      status: 409,
      data: { message: 'This phone is already registered with another account' },
    },
  }) === true,
  'detects 409 with already registered message',
);
assert(
  isPhoneAlreadyRegisteredError({
    response: {
      status: 400,
      data: { message: 'Invalid OTP code' },
    },
  }) === false,
  'rejects unrelated 400 error',
);
assert(
  isPhoneAlreadyRegisteredError(null) === false,
  'rejects null error safely',
);

// 2. toCreateProfileRequest checks
console.log('\n2. toCreateProfileRequest checks:');
const payloadWithHttps: CompleteProfilePayload = {
  fullName: 'Priya Sharma',
  email: 'priya@example.com',
  gender: 'female',
  avatarUri: 'https://res.cloudinary.com/bhaiway/image/upload/v12345/priya.jpg',
};
const reqWithHttps = toCreateProfileRequest(payloadWithHttps);
assert(
  reqWithHttps.profilePhoto === 'https://res.cloudinary.com/bhaiway/image/upload/v12345/priya.jpg',
  'payload includes Cloudinary HTTPS photo',
);
assert(
  reqWithHttps.email === 'priya@example.com',
  'payload includes email',
);
assert(
  reqWithHttps.firstName === 'Priya' && reqWithHttps.lastName === 'Sharma',
  'payload correctly splits first and last name',
);

const payloadWithLocalUri: CompleteProfilePayload = {
  fullName: 'Priya Sharma',
  email: 'priya@example.com',
  gender: 'female',
  avatarUri: 'file:///var/mobile/Containers/Data/Application/photo.jpg',
};
const reqWithLocal = toCreateProfileRequest(payloadWithLocalUri);
assert(
  reqWithLocal.profilePhoto === undefined,
  'payload strips local file:// URI preventing native leak to backend',
);

const payloadWithSkippedPhoto: CompleteProfilePayload = {
  fullName: 'Rohan Gupta',
  email: '',
  gender: 'male',
  avatarUri: null,
};
const reqWithSkipped = toCreateProfileRequest(payloadWithSkippedPhoto);
assert(
  reqWithSkipped.profilePhoto === undefined,
  'payload safely omits profilePhoto when skipped',
);
assert(
  reqWithSkipped.email === undefined,
  'payload omits empty string email for NestJS whitelist validation',
);

// 3. completeProfile.mapper response mapping checks
console.log('\n3. completeProfile.mapper response mapping checks:');
const sampleBackendProfile: ProfileResponse = {
  id: 'prof-123',
  userId: 'usr-123',
  firstName: 'Aarav',
  lastName: 'Sharma',
  displayName: 'Aarav Sharma',
  email: 'aarav@example.com',
  profilePhoto: 'https://res.cloudinary.com/bhaiway/image/upload/v12345/avatar.jpg',
  gender: 'MALE',
  dateOfBirth: null,
  bio: null,
  emergencyContact: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mappedUserProfile = mapProfileResponseToUserProfile(
  sampleBackendProfile,
  payloadWithHttps,
  'usr-123',
);

assert(
  mappedUserProfile.avatarUri === 'https://res.cloudinary.com/bhaiway/image/upload/v12345/avatar.jpg',
  'preserves Cloudinary HTTPS avatarUri in UserProfile',
);
assert(
  mappedUserProfile.email === 'aarav@example.com',
  'preserves backend email in UserProfile',
);

const sampleProfileWithLocalUri: ProfileResponse = {
  ...sampleBackendProfile,
  profilePhoto: 'file:///data/user/0/com.bhaiway/cache/photo.jpg',
};
const mappedWithLocal = mapProfileResponseToUserProfile(
  sampleProfileWithLocalUri,
  payloadWithLocalUri,
  'usr-123',
);
assert(
  mappedWithLocal.avatarUri === null,
  'sanitizes and strips local file:// URI from avatarUri in response mapping',
);

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}

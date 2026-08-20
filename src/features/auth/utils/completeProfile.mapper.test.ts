import { ENDPOINTS } from '../../../network/endpoints';
import { profileValidationSchema } from '../validation/auth.validation';
import {
  getPostAuthRoute,
  isDuplicateEmailError,
  mapCompleteProfileError,
  mapGenderToApi,
  mapProfileResponseToUserProfile,
  splitFullName,
  toCreateProfileRequest,
} from './completeProfile.mapper';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const payload = {
  fullName: 'Aditya Gangwar',
  email: 'aditya@example.com',
  gender: 'male' as const,
};

assertEqual(getPostAuthRoute(false), 'completeProfile', 'new user goes to Setup Profile');
assertEqual(getPostAuthRoute(true), 'home', 'existing user goes to Home');

assertEqual(ENDPOINTS.users.profile, '/users/profile', 'profile endpoint');
assertEqual(splitFullName('Aditya Gangwar'), { firstName: 'Aditya', lastName: 'Gangwar' }, 'full name split');
assertEqual(splitFullName('Aditya'), { firstName: 'Aditya' }, 'single name has no lastName');
assertEqual(
  splitFullName('  Aditya   Kumar  Gangwar '),
  { firstName: 'Aditya', lastName: 'Kumar Gangwar' },
  'multi-part last name is preserved',
);

assertEqual(mapGenderToApi('male'), 'MALE', 'male enum');
assertEqual(mapGenderToApi('female'), 'FEMALE', 'female enum');
assertEqual(mapGenderToApi('other'), 'OTHER', 'other enum');

const body = toCreateProfileRequest(payload);
assertEqual(
  body,
  {
    firstName: 'Aditya',
    lastName: 'Gangwar',
    email: 'aditya@example.com',
    gender: 'MALE',
  },
  'request body mapping',
);
assertEqual('accessToken' in body, false, 'does not send MSG91/BhaiWay tokens');
assertEqual('fullName' in body, false, 'does not send UI fullName field');
assertEqual('avatarUri' in body, false, 'does not send extra avatar field');

const singleNameBody = toCreateProfileRequest({ ...payload, fullName: 'Aditya' });
assertEqual(singleNameBody.firstName, 'Aditya', 'single firstName');
assertEqual('lastName' in singleNameBody, false, 'omits empty lastName');

const mapped = mapProfileResponseToUserProfile(
  {
    id: 'profile-1',
    firstName: 'Aditya',
    lastName: 'Gangwar',
    gender: 'MALE',
  },
  payload,
  'user-42',
);
assertEqual(mapped.id, 'user-42', 'keeps session user id');
assertEqual(mapped.fullName, 'Aditya Gangwar', 'joins returned name');
assertEqual(mapped.email, 'aditya@example.com', 'keeps submitted email');
assertEqual(mapped.gender, 'male', 'maps gender back to UI');

const duplicateEmail = { status: 409, code: 'HTTP_409', message: 'Email is already in use' };
assertEqual(isDuplicateEmailError(duplicateEmail), true, 'detects duplicate email');
assertEqual(
  isDuplicateEmailError({ status: 409, message: 'Profile already exists' }),
  false,
  'profile-already-exists is not treated as duplicate email',
);
assertEqual(
  mapCompleteProfileError(duplicateEmail),
  'This email is already associated with another account.',
  'duplicate email message',
);
assertEqual(mapCompleteProfileError(duplicateEmail).includes('@'), false, 'does not leak email');

assertEqual(
  mapCompleteProfileError({ status: 400, message: 'firstName should not be empty' }),
  'Please check your name, email, and gender and try again.',
  '400 message',
);
assertEqual(
  mapCompleteProfileError({ status: 401, message: 'Unauthorized' }),
  'Your session expired. Please sign in again.',
  '401 message',
);
assertEqual(
  mapCompleteProfileError({
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Unable to save profile. Check your connection and try again.',
  }),
  'Unable to save profile. Check your connection and try again.',
  'network message',
);

assertEqual(
  profileValidationSchema.safeParse({ fullName: '', email: '', gender: undefined }).success,
  false,
  'empty form is invalid',
);
assertEqual(
  profileValidationSchema.safeParse({
    fullName: 'Ad',
    email: 'not-an-email',
    gender: 'male',
  }).success,
  false,
  'invalid name/email is rejected',
);
assertEqual(profileValidationSchema.safeParse(payload).success, true, 'valid form passes');

if (failed.length > 0) {
  throw new Error(`completeProfile tests failed:\n${failed.join('\n')}`);
}

console.log('completeProfile.mapper tests passed');

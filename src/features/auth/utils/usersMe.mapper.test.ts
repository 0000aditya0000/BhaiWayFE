import { ENDPOINTS } from '../../../network/endpoints';
import {
  mapGetMeToGreetingFirstName,
  mapGetMeToSessionUser,
  resolveGreetingFirstName,
  resolveProfileFullName,
} from './usersMe.mapper';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const getMeResponse = {
  user: {
    id: 'user-1',
    phone: '+919876543210',
    phoneVerified: true,
    email: 'aditya@example.com',
    emailVerified: false,
    status: 'ACTIVE' as const,
  },
  profile: {
    id: 'profile-1',
    firstName: 'Aditya',
    lastName: 'Gangwar',
    displayName: 'Aditya G',
    gender: 'MALE' as const,
    profilePhoto: 'https://cdn.example.com/photo.jpg',
  },
  profileCompleted: true,
};

assertEqual(ENDPOINTS.users.me, '/users/me', 'users/me endpoint');

assertEqual(
  resolveProfileFullName(getMeResponse.profile),
  'Aditya G',
  'profile display prefers displayName',
);
assertEqual(
  resolveGreetingFirstName(getMeResponse.profile, 'Aditya G'),
  'Aditya',
  'greeting prefers profile.firstName',
);
assertEqual(
  resolveGreetingFirstName(null, ''),
  'User',
  'greeting fallback is User',
);

const sessionUser = mapGetMeToSessionUser(getMeResponse);
assertEqual(sessionUser.id, 'user-1', 'session user id');
assertEqual(sessionUser.fullName, 'Aditya G', 'session full name');
assertEqual(sessionUser.firstName, 'Aditya', 'session firstName');
assertEqual(sessionUser.email, 'aditya@example.com', 'session email');
assertEqual(sessionUser.phone, '+919876543210', 'session phone');
assertEqual(sessionUser.avatarUri, 'https://cdn.example.com/photo.jpg', 'session avatar');

assertEqual(mapGetMeToGreetingFirstName(getMeResponse), 'Aditya', 'mapped greeting name');

const noProfile = mapGetMeToSessionUser({
  user: getMeResponse.user,
  profile: null,
  profileCompleted: false,
});
assertEqual(noProfile.fullName, '', 'empty profile leaves fullName blank');
assertEqual(noProfile.firstName, null, 'empty profile leaves firstName null');

if (failed.length > 0) {
  throw new Error(`usersMe tests failed:\n${failed.join('\n')}`);
}

console.log('usersMe.mapper tests passed');

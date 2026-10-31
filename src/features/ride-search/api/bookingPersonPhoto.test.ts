import { resolveDriverPhotoUrl, resolvePersonPhotoUrl } from './bookingPersonPhoto';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

assertEqual(
  resolvePersonPhotoUrl({ profilePhoto: 'https://cdn.example/rahul.jpg' }),
  'https://cdn.example/rahul.jpg',
  'profilePhoto string',
);

assertEqual(
  resolvePersonPhotoUrl({
    profilePhoto: { secureUrl: 'https://res.cloudinary.com/bhaiway/rahul.jpg' },
  }),
  'https://res.cloudinary.com/bhaiway/rahul.jpg',
  'Cloudinary secureUrl object',
);

assertEqual(
  resolvePersonPhotoUrl({
    profilePhoto: { url: 'http://res.cloudinary.com/bhaiway/rahul.jpg' },
  }),
  'http://res.cloudinary.com/bhaiway/rahul.jpg',
  'Cloudinary url object',
);

assertEqual(
  resolvePersonPhotoUrl({ profilePicture: 'https://cdn.example/pic.jpg' }),
  'https://cdn.example/pic.jpg',
  'profilePicture alias',
);

assertEqual(
  resolvePersonPhotoUrl({ avatarUrl: 'https://cdn.example/avatar.jpg' }),
  'https://cdn.example/avatar.jpg',
  'avatarUrl alias',
);

assertEqual(
  resolvePersonPhotoUrl({
    user: { profilePhoto: 'https://cdn.example/nested-user.jpg' },
  }),
  'https://cdn.example/nested-user.jpg',
  'nested user.profilePhoto',
);

assertEqual(
  resolvePersonPhotoUrl({
    profile: { photo: 'https://cdn.example/nested-profile.jpg' },
  }),
  'https://cdn.example/nested-profile.jpg',
  'nested profile.photo',
);

assertEqual(
  resolvePersonPhotoUrl({
    profilePhoto: 'file:///local/photo.jpg',
    profilePicture: 'https://cdn.example/remote.jpg',
  }),
  'https://cdn.example/remote.jpg',
  'skips local file uri and uses next alias',
);

assertEqual(resolvePersonPhotoUrl(null), '', 'null person');
assertEqual(resolvePersonPhotoUrl({ displayName: 'Rahul' }), '', 'missing photo');
assertEqual(
  resolvePersonPhotoUrl({ profilePhoto: { publicId: 'folder/rahul' } }),
  '',
  'Cloudinary object without url',
);

assertEqual(
  resolveDriverPhotoUrl(
    { profilePhoto: null },
    { profilePhoto: 'https://cdn.example/from-public.jpg' },
  ),
  'https://cdn.example/from-public.jpg',
  'falls back to public-ride driver',
);

assertEqual(
  resolveDriverPhotoUrl(
    { profilePicture: 'https://cdn.example/booking.jpg' },
    { profilePhoto: 'https://cdn.example/public.jpg' },
  ),
  'https://cdn.example/booking.jpg',
  'booking snapshot wins over public ride',
);

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('bookingPersonPhoto.test.ts passed');

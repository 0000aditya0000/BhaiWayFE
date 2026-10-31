/**
 * Resolve a displayable http(s) photo URL from a driver/passenger snapshot.
 * Backend payloads vary: profilePhoto string, Cloudinary {url,secureUrl},
 * nested user/profile, or aliases like profilePicture / avatarUrl.
 */

type LooseRecord = Record<string, unknown>;

const PHOTO_KEYS = [
  'profilePhoto',
  'profilePhotoUrl',
  'profilePicture',
  'profileImage',
  'photoUrl',
  'photo',
  'avatarUrl',
  'avatarUri',
  'avatar',
  'imageUrl',
  'image',
  'picture',
  'thumbnailUrl',
  'thumbnail',
  'userPhoto',
] as const;

const OBJECT_URL_KEYS = [
  'secureUrl',
  'secure_url',
  'url',
  'uri',
  'href',
  'src',
  'path',
] as const;

const NESTED_PERSON_KEYS = ['profile', 'user', 'driver', 'passenger', 'owner'] as const;

const asRecord = (value: unknown): LooseRecord | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as LooseRecord;
  }
  return null;
};

const asHttpUrl = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('//') && trimmed.length > 4) {
    return `https:${trimmed}`;
  }
  return '';
};

const readUrlFromValue = (value: unknown): string => {
  const direct = asHttpUrl(value);
  if (direct) {
    return direct;
  }
  const nested = asRecord(value);
  if (!nested) {
    return '';
  }
  for (const key of OBJECT_URL_KEYS) {
    const fromObject = asHttpUrl(nested[key]);
    if (fromObject) {
      return fromObject;
    }
  }
  return '';
};

const readPhotoFromRecord = (record: LooseRecord | null): string => {
  if (!record) {
    return '';
  }
  for (const key of PHOTO_KEYS) {
    const photo = readUrlFromValue(record[key]);
    if (photo) {
      return photo;
    }
  }
  return '';
};

/** Photo URL from a driver/passenger snapshot. Empty when the backend omitted one. */
export const resolvePersonPhotoUrl = (person: unknown): string => {
  const root = asRecord(person);
  if (!root) {
    return '';
  }

  const direct = readPhotoFromRecord(root);
  if (direct) {
    return direct;
  }

  for (const key of NESTED_PERSON_KEYS) {
    const nested = readPhotoFromRecord(asRecord(root[key]));
    if (nested) {
      return nested;
    }
  }

  return '';
};

/** Prefer booking snapshot, then public-ride driver when the snapshot omitted a photo. */
export const resolveDriverPhotoUrl = (
  driver: unknown,
  fallbackDriver?: unknown,
): string => resolvePersonPhotoUrl(driver) || resolvePersonPhotoUrl(fallbackDriver);

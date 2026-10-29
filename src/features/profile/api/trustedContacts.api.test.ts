import { ENDPOINTS } from '../../../network/endpoints';
import {
  isPersistablePhotoUrl,
  mapTrustedContactDtoToUi,
  mapTrustedContactError,
  relationshipDisplayLabel,
  toCreatePayload,
  toTrustedContactPhoneNumber,
  TRUSTED_CONTACT_ERROR_MESSAGES,
  validateTrustedContactForm,
} from '../utils/trustedContacts.mapper';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertTrue = (actual: unknown, label: string): void => {
  if (!actual) {
    failed.push(`${label}: expected truthy`);
  }
};

const assertFalse = (actual: unknown, label: string): void => {
  if (actual) {
    failed.push(`${label}: expected falsy`);
  }
};

assertEqual(
  ENDPOINTS.safety.trustedContacts,
  '/safety/trusted-contacts',
  'list endpoint',
);
assertEqual(
  ENDPOINTS.safety.trustedContactById('abc'),
  '/safety/trusted-contacts/abc',
  'by id endpoint',
);

type HttpClientPort = {
  get: <T>(url: string) => Promise<T>;
  post: <T>(url: string, body?: unknown) => Promise<T>;
  patch: <T>(url: string, body?: unknown) => Promise<T>;
  delete: <T>(url: string) => Promise<T>;
};

const createApi = (client: HttpClientPort) => ({
  list: () => client.get(ENDPOINTS.safety.trustedContacts),
  get: (id: string) => client.get(ENDPOINTS.safety.trustedContactById(id)),
  create: (body: Record<string, unknown>) =>
    client.post(ENDPOINTS.safety.trustedContacts, body),
  update: (id: string, body: Record<string, unknown>) =>
    client.patch(ENDPOINTS.safety.trustedContactById(id), body),
  remove: (id: string) => client.delete(ENDPOINTS.safety.trustedContactById(id)),
});

const run = async () => {
  let capturedUrl = '';
  let capturedBody: unknown = null;

  const client: HttpClientPort = {
    get: async <T>(url: string): Promise<T> => {
      capturedUrl = url;
      if (url.includes('/abc')) {
        return {
          id: 'abc',
          name: 'Rahul',
          phoneNumber: '+919876543210',
          relationship: 'BROTHER',
          photoUrl: null,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        } as T;
      }
      return {
        items: [
          {
            id: 'abc',
            name: 'Rahul Gangwar',
            phoneNumber: '+919876543210',
            relationship: 'BROTHER',
            photoUrl: null,
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
      } as T;
    },
    post: async <T>(url: string, body?: unknown): Promise<T> => {
      capturedUrl = url;
      capturedBody = body;
      return { id: 'new', ...(body as object), createdAt: '', updatedAt: '' } as T;
    },
    patch: async <T>(url: string, body?: unknown): Promise<T> => {
      capturedUrl = url;
      capturedBody = body;
      return { id: 'abc', ...(body as object), createdAt: '', updatedAt: '' } as T;
    },
    delete: async <T>(url: string): Promise<T> => {
      capturedUrl = url;
      return undefined as T;
    },
  };

  const api = createApi(client);

  await api.list();
  assertEqual(capturedUrl, '/safety/trusted-contacts', 'GET list');

  await api.get('abc');
  assertEqual(capturedUrl, '/safety/trusted-contacts/abc', 'GET by id');

  const createBody = toCreatePayload({
    name: 'Rahul Gangwar',
    phoneNumber: '+919876543210',
    relationship: 'BROTHER',
  });
  await api.create(createBody as unknown as Record<string, unknown>);
  assertEqual(capturedUrl, '/safety/trusted-contacts', 'POST create');
  assertEqual(
    JSON.stringify(capturedBody),
    JSON.stringify({
      name: 'Rahul Gangwar',
      phoneNumber: '+919876543210',
      relationship: 'BROTHER',
    }),
    'create payload without photo',
  );
  assertTrue(!JSON.stringify(capturedBody).includes('userId'), 'never send userId');

  const withPhoto = toCreatePayload({
    name: 'Rahul',
    phoneNumber: '+919876543210',
    relationship: 'FRIEND',
    photoUrl: 'https://cdn.example.com/a.jpg',
  });
  assertTrue(Boolean(withPhoto.photoUrl), 'photoUrl optional when https');

  const withLocal = toCreatePayload({
    name: 'Rahul',
    phoneNumber: '+919876543210',
    relationship: 'FRIEND',
    photoUrl: 'file:///tmp/a.jpg',
  });
  assertTrue(withLocal.photoUrl === undefined, 'file uri not sent as photoUrl');

  await api.update('abc', { name: 'Rahul' });
  assertEqual(capturedUrl, '/safety/trusted-contacts/abc', 'PATCH');

  await api.remove('abc');
  assertEqual(capturedUrl, '/safety/trusted-contacts/abc', 'DELETE');

  assertEqual(relationshipDisplayLabel('BROTHER'), 'Brother', 'label map');
  assertFalse(isPersistablePhotoUrl(null), 'null photo');
  assertFalse(isPersistablePhotoUrl('file://x'), 'file not persistable');
  assertTrue(isPersistablePhotoUrl('https://cdn.example.com/x.jpg'), 'https ok');

  const ui = mapTrustedContactDtoToUi({
    id: '1',
    name: 'Rahul',
    phoneNumber: '+919876543210',
    relationship: 'BROTHER',
    photoUrl: null,
    createdAt: '',
    updatedAt: '',
  });
  assertEqual(ui.relation, 'Brother', 'ui relation');
  assertTrue(ui.phoneLabel.includes('987') && ui.phoneLabel.includes('3210'), 'phone label');

  assertEqual(toTrustedContactPhoneNumber('9876543210'), '+919876543210', 'phone normalize');
  assertEqual(toTrustedContactPhoneNumber('+91 98765 43210'), '+919876543210', 'phone +91');

  const badName = validateTrustedContactForm({
    name: 'A',
    phoneLabel: '9876543210',
    relationship: 'FRIEND',
  });
  assertFalse(badName.ok, 'invalid name');

  const badPhone = validateTrustedContactForm({
    name: 'Rahul',
    phoneLabel: '123',
    relationship: 'FRIEND',
  });
  assertFalse(badPhone.ok, 'invalid phone');

  const missingRel = validateTrustedContactForm({
    name: 'Rahul',
    phoneLabel: '9876543210',
    relationship: '',
  });
  assertFalse(missingRel.ok, 'missing relationship');

  assertEqual(
    mapTrustedContactError({ code: 'TRUSTED_CONTACT_LIMIT_REACHED', status: 400 }),
    TRUSTED_CONTACT_ERROR_MESSAGES.TRUSTED_CONTACT_LIMIT_REACHED,
    'limit error',
  );
  assertEqual(
    mapTrustedContactError({ code: 'DUPLICATE_TRUSTED_CONTACT', status: 400 }),
    TRUSTED_CONTACT_ERROR_MESSAGES.DUPLICATE_TRUSTED_CONTACT,
    'duplicate error',
  );
  assertEqual(
    mapTrustedContactError({ code: 'TRUSTED_CONTACT_NOT_FOUND', status: 404 }),
    TRUSTED_CONTACT_ERROR_MESSAGES.TRUSTED_CONTACT_NOT_FOUND,
    'not found',
  );
  assertEqual(
    mapTrustedContactError({ code: 'TRUSTED_CONTACT_ACCESS_DENIED', status: 403 }),
    TRUSTED_CONTACT_ERROR_MESSAGES.TRUSTED_CONTACT_ACCESS_DENIED,
    'access denied',
  );

  if (failed.length) {
    throw new Error(`trustedContacts.api tests failed:\n${failed.join('\n')}`);
  }
  console.log('trustedContacts.api tests passed');
};

void run();

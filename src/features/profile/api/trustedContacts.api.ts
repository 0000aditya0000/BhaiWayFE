import { ENDPOINTS, httpClient } from '@/network';

import type {
  CreateTrustedContactPayload,
  ListTrustedContactsQuery,
  TrustedContactDto,
  TrustedContactPageDto,
  UpdateTrustedContactPayload,
} from './trustedContacts.types';
import {
  normalizeTrustedContact,
  normalizeTrustedContactPage,
} from '../utils/trustedContacts.mapper';

export type {
  CreateTrustedContactPayload,
  ListTrustedContactsQuery,
  TrustedContactDto,
  TrustedContactPageDto,
  TrustedContactRelationship,
  UpdateTrustedContactPayload,
} from './trustedContacts.types';

/** GET /safety/trusted-contacts */
export const listTrustedContacts = async (
  query: ListTrustedContactsQuery = {},
): Promise<TrustedContactPageDto> => {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const limit = Math.max(1, Math.min(50, Math.floor(query.limit ?? 20)));
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  const payload = await httpClient.get<unknown>(
    `${ENDPOINTS.safety.trustedContacts}?${params.toString()}`,
  );
  return normalizeTrustedContactPage(payload, { page, limit });
};

/** GET /safety/trusted-contacts/:id */
export const getTrustedContact = async (id: string): Promise<TrustedContactDto> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.safety.trustedContactById(id));
  return normalizeTrustedContact(payload);
};

/** POST /safety/trusted-contacts — never send userId. */
export const createTrustedContact = async (
  body: CreateTrustedContactPayload,
): Promise<TrustedContactDto> => {
  const payload = await httpClient.post<unknown>(ENDPOINTS.safety.trustedContacts, body);
  return normalizeTrustedContact(payload);
};

/** PATCH /safety/trusted-contacts/:id */
export const updateTrustedContact = async (
  id: string,
  body: UpdateTrustedContactPayload,
): Promise<TrustedContactDto> => {
  const payload = await httpClient.patch<unknown>(
    ENDPOINTS.safety.trustedContactById(id),
    body,
  );
  return normalizeTrustedContact(payload);
};

/** DELETE /safety/trusted-contacts/:id */
export const deleteTrustedContact = async (id: string): Promise<void> => {
  await httpClient.delete<unknown>(ENDPOINTS.safety.trustedContactById(id));
};

/** Backend TrustedContactRelationship enum. */
export type TrustedContactRelationship =
  | 'PARENT'
  | 'MOTHER'
  | 'FATHER'
  | 'BROTHER'
  | 'SISTER'
  | 'SPOUSE'
  | 'PARTNER'
  | 'FRIEND'
  | 'RELATIVE'
  | 'COLLEAGUE'
  | 'OTHER';

/** GET/POST response — TrustedContactResponseDto */
export interface TrustedContactDto {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: TrustedContactRelationship;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrustedContactPayload {
  name: string;
  phoneNumber: string;
  relationship: TrustedContactRelationship;
  photoUrl?: string | null;
}

export interface UpdateTrustedContactPayload {
  name?: string;
  phoneNumber?: string;
  relationship?: TrustedContactRelationship;
  photoUrl?: string | null;
}

export interface TrustedContactPageDto {
  items: TrustedContactDto[];
  page: number;
  limit: number;
  total: number;
}

export interface ListTrustedContactsQuery {
  page?: number;
  limit?: number;
}

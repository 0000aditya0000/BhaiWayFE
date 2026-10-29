import type { TrustedContactRelationship } from '../api/trustedContacts.types';

export type ContactFormMode = 'add' | 'edit';

/** @deprecated Prefer TrustedContactRelationship — kept as alias for form relation values. */
export type ContactRelation = TrustedContactRelationship;

export interface EditContactForm {
  id: string | null;
  name: string;
  relation: TrustedContactRelationship;
  phoneLabel: string;
  /** Local preview and/or remote https URL. */
  avatarUri: string | null;
  /** Remote photo URL to send to backend (https only). */
  photoUrl: string | null;
}

export type EditContactSubmitState = 'idle' | 'submitting' | 'success';

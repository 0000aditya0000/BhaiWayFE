import type { TrustedContactRelationship } from '../api/trustedContacts.types';

export interface TrustedContact {
  id: string;
  name: string;
  /** Display label (e.g. Brother). */
  relation: string;
  /** Backend enum when known. */
  relationship?: TrustedContactRelationship;
  phoneLabel: string;
  phoneNumber?: string;
  avatarUri?: string;
  photoUrl?: string | null;
  initials?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SafetyReportOption {
  id: string;
  title: string;
  subtitle: string;
  icon: 'warning-outline';
}

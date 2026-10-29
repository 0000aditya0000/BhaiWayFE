import type { TrustedContactRelationship } from '../api/trustedContacts.types';
import { TRUSTED_CONTACT_RELATIONSHIPS } from '../utils/trustedContacts.mapper';

export const EDIT_CONTACT_SCREEN = {
  editTitle: 'Edit Trusted Contact',
  addTitle: 'Add Trusted Contact',
  subtitle: 'Update details for your trusted contact',
  addSubtitle: 'Add people you trust for Safety Hub features.',
  nameLabel: 'NAME',
  namePlaceholder: 'Enter full name',
  relationLabel: 'RELATIONSHIP',
  phoneLabel: 'PHONE NUMBER',
  phonePlaceholder: 'Enter mobile number',
  saveLabel: 'Save Changes',
  addSaveLabel: 'Save Contact',
  deleteLabel: 'Delete Contact',
  submittingLabel: 'Saving…',
  successLabel: 'Saved',
  validationTitle: 'Check details',
  validationMessage: 'Please enter a valid name and Indian mobile number.',
  deleteTitle: 'Delete trusted contact?',
  deleteMessage: (name: string) =>
    `Are you sure you want to remove ${name} from your trusted contacts?`,
  deleteConfirm: 'Delete',
  deleteCancel: 'Cancel',
  changePhotoTitle: 'Contact Photo',
  changePhotoSubtitle: 'Take a new photo or choose one from your gallery.',
  uploadFailedTitle: 'Photo upload failed',
  uploadFailedMessage: 'We could not upload the photo. You can still save the contact without it.',
} as const;

/** Backend enum values shown via relationshipDisplayLabel in the UI. */
export const CONTACT_RELATIONS: readonly TrustedContactRelationship[] =
  TRUSTED_CONTACT_RELATIONSHIPS;

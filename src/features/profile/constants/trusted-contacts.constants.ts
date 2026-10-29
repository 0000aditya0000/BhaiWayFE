export const TRUSTED_CONTACTS_SCREEN = {
  title: 'Trusted Contacts',
  subtitle: 'People you trust to contact in an emergency.',
  keepSafeLabel: 'Add trusted contacts',
  emptyTitle: 'Add trusted contacts',
  emptySubtitle:
    "Add people you trust so they can be used by BhaiWay's safety features.",
  addContactLabel: '+ Add Trusted Contact',
  loadingLabel: 'Loading contacts…',
  retryLabel: 'Retry',
  deleteTitle: 'Delete trusted contact?',
  deleteMessage: (name: string) =>
    `Are you sure you want to remove ${name} from your trusted contacts?`,
  deleteConfirm: 'Delete',
  deleteCancel: 'Cancel',
  deletedTitle: 'Removed',
  deletedMessage: 'Trusted contact removed.',
} as const;

/** @deprecated Demo seed removed — contacts come from GET /safety/trusted-contacts. */
export const TRUSTED_CONTACTS = [] as const;

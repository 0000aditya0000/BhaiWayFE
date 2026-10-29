import type { TrustedContact } from '../types';

type ContactsListener = (contacts: TrustedContact[]) => void;

let contacts: TrustedContact[] = [];
const listeners = new Set<ContactsListener>();

const notify = (): void => {
  listeners.forEach((listener) => listener(contacts.map((contact) => ({ ...contact }))));
};

/**
 * In-memory cache for trusted contacts after API fetch.
 * Backend remains source of truth — never seed demo contacts.
 */
export const trustedContactsStore = {
  get: (): TrustedContact[] => contacts.map((contact) => ({ ...contact })),

  subscribe: (listener: ContactsListener): (() => void) => {
    listeners.add(listener);
    listener(contacts.map((contact) => ({ ...contact })));
    return () => listeners.delete(listener);
  },

  setAll: (next: TrustedContact[]): void => {
    contacts = next.map((contact) => ({ ...contact }));
    notify();
  },

  upsert: (contact: TrustedContact): void => {
    const index = contacts.findIndex((item) => item.id === contact.id);
    if (index >= 0) {
      contacts = contacts.map((item, i) => (i === index ? { ...contact } : item));
    } else {
      contacts = [...contacts, { ...contact }];
    }
    notify();
  },

  remove: (id: string): void => {
    contacts = contacts.filter((item) => item.id !== id);
    notify();
  },

  getById: (id: string): TrustedContact | undefined =>
    contacts.find((item) => item.id === id),

  clear: (): void => {
    contacts = [];
    notify();
  },
};

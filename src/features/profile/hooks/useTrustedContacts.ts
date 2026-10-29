import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  CACHE_STALE_TIMES,
  cacheKeys,
  invalidateTrustedContactsCache,
  resourceCache,
} from '@/network/resourceCache';
import { triggerLightHaptic, triggerSuccessHaptic, showAppAlert } from '@/shared/utils';
import {
  deleteTrustedContact,
  listTrustedContacts,
} from '../api/trustedContacts.api';
import type { TrustedContactPageDto } from '../api/trustedContacts.types';
import { TRUSTED_CONTACTS_SCREEN } from '../constants';
import { trustedContactsStore } from '../store';
import type { TrustedContact } from '../types';
import {
  mapTrustedContactDtoToUi,
  mapTrustedContactError,
} from '../utils/trustedContacts.mapper';

const LIST_PARAMS = { page: 1, limit: 50 } as const;

export interface UseTrustedContactsResult {
  contacts: TrustedContact[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  deletingId: string | null;
  emptyTitle: string;
  emptySubtitle: string;
  addLabel: string;
  goBack: () => void;
  openProfile: () => void;
  editContact: (contact: TrustedContact) => void;
  deleteContact: (contact: TrustedContact) => void;
  addContact: () => void;
  refresh: () => Promise<void>;
  retry: () => void;
}

export const useTrustedContacts = (): UseTrustedContactsResult => {
  const router = useRouter();
  const [contacts, setContacts] = useState<TrustedContact[]>(() => trustedContactsStore.get());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inflightRef = useRef(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (inflightRef.current) {
      return;
    }
    inflightRef.current = true;
    const force = mode === 'refresh';
    if (force) {
      setRefreshing(true);
    } else if (!resourceCache.peek(cacheKeys.trustedContacts.list(LIST_PARAMS))) {
      setLoading(true);
    }
    try {
      const result = await resourceCache.query<TrustedContactPageDto>({
        key: cacheKeys.trustedContacts.list(LIST_PARAMS),
        staleTime: CACHE_STALE_TIMES.TRUSTED_CONTACTS,
        force,
        fetcher: () => listTrustedContacts({ page: 1, limit: 50 }),
      });
      const mapped = result.data.items.map(mapTrustedContactDtoToUi);
      trustedContactsStore.setAll(mapped);
      setContacts(mapped);
      setError(null);
    } catch (err) {
      const kept = resourceCache.peek<TrustedContactPageDto>(
        cacheKeys.trustedContacts.list(LIST_PARAMS),
      );
      if (kept) {
        const mapped = kept.items.map(mapTrustedContactDtoToUi);
        setContacts(mapped);
        setError(null);
      } else {
        setError(mapTrustedContactError(err));
        if (mode === 'initial') {
          setContacts([]);
        }
      }
    } finally {
      inflightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.safetyHub);
  }, [router]);

  const openProfile = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.profile);
  }, [router]);

  const editContact = useCallback(
    (contact: TrustedContact) => {
      triggerLightHaptic();
      router.push({
        pathname: ROUTES.editContact,
        params: { mode: 'edit', id: contact.id },
      });
    },
    [router],
  );

  const deleteContact = useCallback(
    (contact: TrustedContact) => {
      triggerLightHaptic();
      showAppAlert(
        TRUSTED_CONTACTS_SCREEN.deleteTitle,
        TRUSTED_CONTACTS_SCREEN.deleteMessage(contact.name),
        [
          { text: TRUSTED_CONTACTS_SCREEN.deleteCancel, style: 'cancel' },
          {
            text: TRUSTED_CONTACTS_SCREEN.deleteConfirm,
            style: 'destructive',
            onPress: () => {
              void (async () => {
                setDeletingId(contact.id);
                try {
                  await deleteTrustedContact(contact.id);
                  invalidateTrustedContactsCache();
                  trustedContactsStore.remove(contact.id);
                  setContacts((prev) => prev.filter((row) => row.id !== contact.id));
                  triggerSuccessHaptic();
                  showAppAlert(
                    TRUSTED_CONTACTS_SCREEN.deletedTitle,
                    TRUSTED_CONTACTS_SCREEN.deletedMessage,
                  );
                } catch (err) {
                  showAppAlert('Unable to delete', mapTrustedContactError(err));
                } finally {
                  setDeletingId(null);
                }
              })();
            },
          },
        ],
      );
    },
    [],
  );

  const addContact = useCallback(() => {
    triggerLightHaptic();
    router.push({
      pathname: ROUTES.editContact,
      params: { mode: 'add' },
    });
  }, [router]);

  return {
    contacts,
    loading,
    refreshing,
    error,
    deletingId,
    emptyTitle: TRUSTED_CONTACTS_SCREEN.emptyTitle,
    emptySubtitle: TRUSTED_CONTACTS_SCREEN.emptySubtitle,
    addLabel: TRUSTED_CONTACTS_SCREEN.addContactLabel,
    goBack,
    openProfile,
    editContact,
    deleteContact,
    addContact,
    refresh: () => load('refresh'),
    retry: () => {
      void load('initial');
    },
  };
};

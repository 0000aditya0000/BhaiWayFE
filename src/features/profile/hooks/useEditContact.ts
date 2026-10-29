import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { useUpload } from '@/hooks/useUpload';
import type { UploadedDocument } from '@/shared/components';
import {
  getSearchParam,
  triggerLightHaptic,
  triggerSuccessHaptic,
  showAppAlert,
} from '@/shared/utils';
import {
  createTrustedContact,
  deleteTrustedContact,
  getTrustedContact,
  updateTrustedContact,
} from '../api/trustedContacts.api';
import type { TrustedContactRelationship } from '../api/trustedContacts.types';
import {
  CONTACT_RELATIONS,
  EDIT_CONTACT_SCREEN,
} from '../constants/edit-contact.constants';
import { trustedContactsStore } from '../store';
import type {
  ContactFormMode,
  EditContactForm,
  EditContactSubmitState,
} from '../types';
import {
  asTrustedContactRelationship,
  isPersistablePhotoUrl,
  mapTrustedContactDtoToUi,
  mapTrustedContactError,
  toCreatePayload,
  toUpdatePayload,
  validateTrustedContactForm,
} from '../utils/trustedContacts.mapper';

export interface UseEditContactResult {
  mode: ContactFormMode;
  title: string;
  subtitle: string;
  form: EditContactForm;
  relations: readonly TrustedContactRelationship[];
  submitState: EditContactSubmitState;
  uploadSheetVisible: boolean;
  uploadingPhoto: boolean;
  loadingContact: boolean;
  saveLabel: string;
  setName: (value: string) => void;
  setRelation: (value: TrustedContactRelationship) => void;
  setPhone: (value: string) => void;
  openUpload: () => void;
  closeUpload: () => void;
  applyAvatar: (document: UploadedDocument) => void;
  save: () => Promise<void>;
  deleteContact: () => void;
  goBack: () => void;
}

export const useEditContact = (): UseEditContactResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; id?: string }>();
  const mode: ContactFormMode =
    getSearchParam(params.mode) === 'edit' ? 'edit' : 'add';
  const contactId = getSearchParam(params.id);

  const [form, setForm] = useState<EditContactForm>({
    id: null,
    name: '',
    relation: 'FRIEND',
    phoneLabel: '',
    avatarUri: null,
    photoUrl: null,
  });
  const [submitState, setSubmitState] = useState<EditContactSubmitState>('idle');
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [loadingContact, setLoadingContact] = useState(mode === 'edit');

  const { isUploading, uploadLocalFile } = useUpload({
    kind: 'generic',
    showAlerts: false,
  });

  useEffect(() => {
    if (mode !== 'edit' || !contactId) {
      setLoadingContact(false);
      return;
    }

    const cached = trustedContactsStore.getById(contactId);
    if (cached) {
      setForm({
        id: cached.id,
        name: cached.name,
        relation: asTrustedContactRelationship(cached.relationship) ?? 'FRIEND',
        phoneLabel: cached.phoneLabel,
        avatarUri: cached.avatarUri ?? null,
        photoUrl: isPersistablePhotoUrl(cached.photoUrl) ? cached.photoUrl! : null,
      });
    }

    let cancelled = false;
    void (async () => {
      setLoadingContact(true);
      try {
        const dto = await getTrustedContact(contactId);
        if (cancelled) {
          return;
        }
        const ui = mapTrustedContactDtoToUi(dto);
        trustedContactsStore.upsert(ui);
        setForm({
          id: ui.id,
          name: ui.name,
          relation: ui.relationship ?? 'FRIEND',
          phoneLabel: ui.phoneLabel,
          avatarUri: ui.avatarUri ?? null,
          photoUrl: isPersistablePhotoUrl(ui.photoUrl) ? ui.photoUrl! : null,
        });
      } catch (err) {
        if (!cancelled) {
          showAppAlert('Unable to load contact', mapTrustedContactError(err));
        }
      } finally {
        if (!cancelled) {
          setLoadingContact(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contactId, mode]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.trustedContacts);
  }, [router]);

  const setName = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, name: value }));
  }, []);

  const setRelation = useCallback((value: TrustedContactRelationship) => {
    setForm((prev) => ({ ...prev, relation: value }));
  }, []);

  const setPhone = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, phoneLabel: value }));
  }, []);

  const openUpload = useCallback(() => {
    triggerLightHaptic();
    setUploadSheetVisible(true);
  }, []);

  const closeUpload = useCallback(() => {
    setUploadSheetVisible(false);
  }, []);

  const applyAvatar = useCallback(
    (document: UploadedDocument) => {
      // Preview immediately; upload to Cloudinary before we persist photoUrl.
      setForm((prev) => ({ ...prev, avatarUri: document.uri }));
      void (async () => {
        try {
          const uploaded = await uploadLocalFile({
            uri: document.uri,
            fileName: document.fileName || 'contact-photo.jpg',
            mimeType: document.mimeType || 'image/jpeg',
          });
          if (uploaded?.secureUrl && isPersistablePhotoUrl(uploaded.secureUrl)) {
            setForm((prev) => ({
              ...prev,
              avatarUri: uploaded.secureUrl,
              photoUrl: uploaded.secureUrl,
            }));
            return;
          }
          showAppAlert(
            EDIT_CONTACT_SCREEN.uploadFailedTitle,
            EDIT_CONTACT_SCREEN.uploadFailedMessage,
          );
          setForm((prev) => ({ ...prev, avatarUri: prev.photoUrl, photoUrl: prev.photoUrl }));
        } catch {
          showAppAlert(
            EDIT_CONTACT_SCREEN.uploadFailedTitle,
            EDIT_CONTACT_SCREEN.uploadFailedMessage,
          );
          setForm((prev) => ({
            ...prev,
            avatarUri: isPersistablePhotoUrl(prev.photoUrl) ? prev.photoUrl : null,
          }));
        }
      })();
    },
    [uploadLocalFile],
  );

  const save = useCallback(async () => {
    if (submitState !== 'idle' || isUploading) {
      return;
    }

    triggerLightHaptic();
    const validated = validateTrustedContactForm({
      name: form.name,
      phoneLabel: form.phoneLabel,
      relationship: form.relation,
    });
    if (!validated.ok) {
      showAppAlert(EDIT_CONTACT_SCREEN.validationTitle, validated.message);
      return;
    }

    setSubmitState('submitting');
    try {
      const photoUrl = isPersistablePhotoUrl(form.photoUrl) ? form.photoUrl : undefined;
      const dto =
        mode === 'edit' && form.id
          ? await updateTrustedContact(
              form.id,
              toUpdatePayload({
                name: validated.name,
                phoneNumber: validated.phoneNumber,
                relationship: validated.relationship,
                photoUrl,
              }),
            )
          : await createTrustedContact(
              toCreatePayload({
                name: validated.name,
                phoneNumber: validated.phoneNumber,
                relationship: validated.relationship,
                photoUrl,
              }),
            );

      // Ensure payload never includes userId (API helpers only send DTO fields).
      const ui = mapTrustedContactDtoToUi(dto);
      trustedContactsStore.upsert(ui);
      setSubmitState('success');
      triggerSuccessHaptic();
      goBack();
    } catch (err) {
      setSubmitState('idle');
      showAppAlert('Unable to save', mapTrustedContactError(err));
    }
  }, [form, goBack, isUploading, mode, submitState]);

  const deleteContact = useCallback(() => {
    if (!form.id) {
      return;
    }
    triggerLightHaptic();
    showAppAlert(
      EDIT_CONTACT_SCREEN.deleteTitle,
      EDIT_CONTACT_SCREEN.deleteMessage(form.name || 'this contact'),
      [
        { text: EDIT_CONTACT_SCREEN.deleteCancel, style: 'cancel' },
        {
          text: EDIT_CONTACT_SCREEN.deleteConfirm,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              if (!form.id) {
                return;
              }
              try {
                await deleteTrustedContact(form.id);
                trustedContactsStore.remove(form.id);
                triggerSuccessHaptic();
                goBack();
              } catch (err) {
                showAppAlert('Unable to delete', mapTrustedContactError(err));
              }
            })();
          },
        },
      ],
    );
  }, [form.id, form.name, goBack]);

  return {
    mode,
    title: mode === 'edit' ? EDIT_CONTACT_SCREEN.editTitle : EDIT_CONTACT_SCREEN.addTitle,
    subtitle: mode === 'edit' ? EDIT_CONTACT_SCREEN.subtitle : EDIT_CONTACT_SCREEN.addSubtitle,
    form,
    relations: CONTACT_RELATIONS,
    submitState,
    uploadSheetVisible,
    uploadingPhoto: isUploading,
    loadingContact,
    saveLabel:
      mode === 'edit' ? EDIT_CONTACT_SCREEN.saveLabel : EDIT_CONTACT_SCREEN.addSaveLabel,
    setName,
    setRelation,
    setPhone,
    openUpload,
    closeUpload,
    applyAvatar,
    save,
    deleteContact,
    goBack,
  };
};

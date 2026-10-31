import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { authSession } from '@/store';
import { saveVehicleRcUrl } from '@/features/media';
import { createVehicle, getVehicleById, updateVehicle } from '@/features/profile/api';
import { mergeVehicleIntoListCache } from '@/network/resourceCache';
import { uploadFile } from '@/services/cloudinary';
import type { UploadedDocument } from '@/shared/components';
import { compressImage } from '@/utils/imageCompression';
import { CloudinaryUploadError } from '@/types/cloudinary';
import {
  getErrorMessage,
  getSearchParam,
  logger,
  triggerLightHaptic,
  triggerSuccessHaptic,
  showAppAlert,
} from '@/shared/utils';
import { ADD_VEHICLE_SCREEN, VEHICLE_CATEGORIES } from '../constants';
import type { AddVehicleForm, VehicleCategoryId, VehicleCategoryOption } from '../types';
import { mapAddVehicleFormToCreateDto, mapAddVehicleFormToUpdateDto, mapCreateVehicleError, mapUpdateVehicleError, mapVehicleResponseToAddVehicleForm } from '../utils';

const INITIAL_FORM: AddVehicleForm = {
  category: 'sedan',
  model: '',
  color: '',
  plateNumber: '',
  documentUri: null,
  documentName: null,
  documentSecureUrl: null,
  documentPublicId: null,
};

const isFolderRestrictionError = (error: unknown): boolean => {
  if (!(error instanceof CloudinaryUploadError)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('folder') ||
    message.includes('preset') ||
    message.includes('not allowed')
  );
};

export type AddVehicleSubmitState = 'idle' | 'submitting' | 'success';

export interface UseAddVehicleResult {
  form: AddVehicleForm;
  categories: readonly VehicleCategoryOption[];
  submitState: AddVehicleSubmitState;
  uploadSheetVisible: boolean;
  isUploadingDocument: boolean;
  uploadProgress: number;
  isEditMode: boolean;
  loadingVehicle: boolean;
  screenTitle: string;
  submitLabel: string;
  submittingLabel: string;
  successLabel: string;
  /** Latest Cloudinary HTTPS URL ready for the backend. */
  cloudinaryUrl: string | null;
  setCategory: (id: VehicleCategoryId) => void;
  setModel: (value: string) => void;
  setColor: (value: string) => void;
  setPlateNumber: (value: string) => void;
  openUpload: () => void;
  closeUpload: () => void;
  applyDocument: (document: UploadedDocument) => void;
  submit: () => Promise<void>;
  goBack: () => void;
}

export const useAddVehicle = (): UseAddVehicleResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string; vehicleId?: string }>();
  const returnTo = getSearchParam(params.returnTo);
  const vehicleId = getSearchParam(params.vehicleId);
  const isEditMode = Boolean(vehicleId);
  const [form, setForm] = useState<AddVehicleForm>(INITIAL_FORM);
  const [submitState, setSubmitState] = useState<AddVehicleSubmitState>('idle');
  const [loadingVehicle, setLoadingVehicle] = useState(isEditMode);
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadGenerationRef = useRef(0);
  const submittingRef = useRef(false);

  const leaveAfterSave = useCallback(() => {
    if (returnTo === 'offer-ride-preferences') {
      router.replace(ROUTES.offerRidePreferences);
      return;
    }
    if (returnTo === 'modify-ride') {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace(ROUTES.myRides);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myGarage);
  }, [returnTo, router]);

  useEffect(() => {
    if (!vehicleId || !authSession.getToken()) {
      setLoadingVehicle(false);
      return;
    }

    let active = true;
    void (async () => {
      setLoadingVehicle(true);
      try {
        const row = await getVehicleById(vehicleId);
        if (!active) {
          return;
        }
        setForm(mapVehicleResponseToAddVehicleForm(row));
      } catch (error) {
        if (!active) {
          return;
        }
        showAppAlert(ADD_VEHICLE_SCREEN.loadFailedTitle, mapUpdateVehicleError(error));
        leaveAfterSave();
      } finally {
        if (active) {
          setLoadingVehicle(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [leaveAfterSave, vehicleId]);

  const goBack = useCallback(() => {
    leaveAfterSave();
  }, [leaveAfterSave]);

  const setCategory = useCallback((id: VehicleCategoryId) => {
    triggerLightHaptic();
    setForm((prev) => ({ ...prev, category: id }));
  }, []);

  const setModel = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, model: value }));
  }, []);

  const setColor = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, color: value }));
  }, []);

  const setPlateNumber = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, plateNumber: value.toUpperCase() }));
  }, []);

  const openUpload = useCallback(() => {
    if (isUploadingDocument) {
      return;
    }
    triggerLightHaptic();
    setUploadSheetVisible(true);
  }, [isUploadingDocument]);

  const closeUpload = useCallback(() => {
    setUploadSheetVisible(false);
  }, []);

  const applyDocument = useCallback((document: UploadedDocument) => {
    const generation = ++uploadGenerationRef.current;
    const stamp = Date.now();
    const fileName = document.fileName?.trim() || `rc_${stamp}.jpg`;
    const mimeType = document.mimeType?.trim() || 'image/jpeg';

    setForm((prev) => ({
      ...prev,
      documentUri: document.uri,
      documentName: fileName,
      documentSecureUrl: null,
      documentPublicId: null,
    }));
    setIsUploadingDocument(true);
    setUploadProgress(0);

    void (async () => {
      try {
        const compressed = await compressImage(document.uri, {
          maxDimension: 1600,
          quality: 0.75,
          squareCrop: false,
        });

        if (generation !== uploadGenerationRef.current) {
          return;
        }

        let uploaded;
        try {
          uploaded = await uploadFile({
            uri: compressed.uri,
            kind: 'rc',
            fileName,
            mimeType: compressed.mimeType ?? mimeType,
            resourceType: 'image',
            onProgress: setUploadProgress,
          });
        } catch (firstError) {
          if (!isFolderRestrictionError(firstError)) {
            throw firstError;
          }
          logger.warn('RC folder rejected by preset — retrying without folder', firstError);
          uploaded = await uploadFile({
            uri: compressed.uri,
            fileName,
            mimeType: compressed.mimeType ?? mimeType,
            resourceType: 'image',
            publicId: `rc_${stamp}`,
            skipFolder: true,
            onProgress: setUploadProgress,
          });
        }

        if (generation !== uploadGenerationRef.current) {
          return;
        }

        await saveVehicleRcUrl(uploaded);

        setForm((prev) => ({
          ...prev,
          documentUri: uploaded.secureUrl,
          documentName: fileName,
          documentSecureUrl: uploaded.secureUrl,
          documentPublicId: uploaded.publicId,
        }));

        triggerSuccessHaptic();
      } catch (error) {
        if (generation !== uploadGenerationRef.current) {
          return;
        }
        logger.error('Vehicle RC Cloudinary upload failed', error);
        setForm((prev) => ({
          ...prev,
          documentUri: null,
          documentName: null,
          documentSecureUrl: null,
          documentPublicId: null,
        }));
        const status =
          typeof error === 'object' && error !== null && 'status' in error
            ? Number((error as { status?: unknown }).status)
            : undefined;
        if (status === 401) {
          showAppAlert(
            'Session expired',
            'Please sign in again to upload vehicle documents.',
          );
        } else {
          const message =
            error instanceof CloudinaryUploadError
              ? error.message
              : getErrorMessage(error, 'Unable to upload your RC document. Please try again.');
          showAppAlert('Upload failed', message);
        }
      } finally {
        if (generation === uploadGenerationRef.current) {
          setIsUploadingDocument(false);
          setUploadProgress(0);
        }
      }
    })();
  }, []);

  const submit = useCallback(async () => {
    if (submitState !== 'idle' || isUploadingDocument || submittingRef.current) {
      return;
    }

    const model = form.model.trim();
    const plateNumber = form.plateNumber.trim();
    if (!model || !plateNumber) {
      showAppAlert(ADD_VEHICLE_SCREEN.validationTitle, ADD_VEHICLE_SCREEN.validationMessage);
      return;
    }

    if (form.documentUri && !form.documentSecureUrl) {
      showAppAlert(
        'Document still uploading',
        'Please wait for the RC upload to finish, or re-upload the document.',
      );
      return;
    }

    if (!authSession.getToken()) {
      showAppAlert('Session expired', 'Please sign in again to add a vehicle.');
      return;
    }

    triggerLightHaptic();
    submittingRef.current = true;
    setSubmitState('submitting');

    try {
      if (isEditMode && vehicleId) {
        const payload = mapAddVehicleFormToUpdateDto(form);
        const updated = await updateVehicle(vehicleId, payload);
        mergeVehicleIntoListCache(updated);
        logger.info('Vehicle updated via PATCH /vehicles/:id', {
          vehicleId: updated.id,
          registrationNumber: updated.registrationNumber,
        });
      } else {
        const payload = mapAddVehicleFormToCreateDto(form);
        const created = await createVehicle(payload);
        mergeVehicleIntoListCache(created);
        logger.info('Vehicle created via POST /vehicles', {
          vehicleId: created.id,
          isActive: created.isActive,
          registrationNumber: created.registrationNumber,
        });
      }

      triggerSuccessHaptic();
      setSubmitState('success');

      setTimeout(() => {
        leaveAfterSave();
      }, 700);
    } catch (error) {
      setSubmitState('idle');
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? Number((error as { status?: unknown }).status)
          : undefined;
      if (status === 401) {
        authSession.clear();
        showAppAlert(
          'Session expired',
          isEditMode
            ? 'Please sign in again to update a vehicle.'
            : 'Please sign in again to add a vehicle.',
        );
        router.replace(ROUTES.welcome);
        return;
      }
      showAppAlert('Save failed', isEditMode ? mapUpdateVehicleError(error) : mapCreateVehicleError(error));
    } finally {
      submittingRef.current = false;
    }
  }, [form, isEditMode, isUploadingDocument, leaveAfterSave, router, submitState, vehicleId]);

  return {
    form,
    categories: VEHICLE_CATEGORIES,
    submitState,
    uploadSheetVisible,
    isUploadingDocument,
    uploadProgress,
    isEditMode,
    loadingVehicle,
    screenTitle: isEditMode ? ADD_VEHICLE_SCREEN.editTitle : ADD_VEHICLE_SCREEN.title,
    submitLabel: isEditMode ? ADD_VEHICLE_SCREEN.saveLabel : ADD_VEHICLE_SCREEN.submitLabel,
    submittingLabel: isEditMode
      ? ADD_VEHICLE_SCREEN.savingLabel
      : ADD_VEHICLE_SCREEN.submittingLabel,
    successLabel: isEditMode ? ADD_VEHICLE_SCREEN.savedLabel : ADD_VEHICLE_SCREEN.successLabel,
    cloudinaryUrl: form.documentSecureUrl,
    setCategory,
    setModel,
    setColor,
    setPlateNumber,
    openUpload,
    closeUpload,
    applyDocument,
    submit,
    goBack,
  };
};

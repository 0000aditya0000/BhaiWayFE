import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { saveVehicleRcUrl } from '@/features/media';
import { authSession } from '@/store';
import { uploadFile } from '@/services/cloudinary';
import type { UploadedDocument } from '@/shared/components';
import { compressImage } from '@/utils/imageCompression';
import { CloudinaryUploadError } from '@/types/cloudinary';
import {
  getErrorMessage,
  triggerLightHaptic,
  triggerSuccessHaptic,
  showAppAlert,
} from '@/shared/utils';
import {
  getMyVerifications,
  listVehicles,
  updateVehicle,
  deleteVehicleById,
  activateVehicle,
  type VerificationStatus,
} from '../api';
import { MY_GARAGE_SCREEN } from '../constants';
import type { GarageVehicle } from '../types';
import { mapUpdateVehicleError, mapVehicleResponseToGarageVehicle } from '../utils';

export interface UseMyGarageResult {
  vehicles: readonly GarageVehicle[];
  loading: boolean;
  refreshing: boolean;
  verifySheetVisible: boolean;
  verifyUploading: boolean;
  verifyProgress: number;
  togglingVehicleId: string | null;
  goBack: () => void;
  deleteVehicle: (vehicle: GarageVehicle) => void;
  addVehicle: () => void;
  editVehicle: (vehicle: GarageVehicle) => void;
  toggleVehicleActive: (vehicle: GarageVehicle, nextActive: boolean) => void;
  openVerifyVehicle: (vehicle: GarageVehicle) => void;
  closeVerifySheet: () => void;
  applyVerifyDocument: (document: UploadedDocument) => void;
}

const isApiError = (error: unknown): error is { status: number; message?: string } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as { status?: unknown }).status === 'number';

export const useMyGarage = (): UseMyGarageResult => {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<readonly GarageVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicleVerificationStatus, setVehicleVerificationStatus] =
    useState<VerificationStatus | null>(null);
  const [verifySheetVisible, setVerifySheetVisible] = useState(false);
  const [verifyUploading, setVerifyUploading] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifyTarget, setVerifyTarget] = useState<GarageVehicle | null>(null);
  const [togglingVehicleId, setTogglingVehicleId] = useState<string | null>(null);
  const verifyGenerationRef = useRef(0);

  const loadVehicles = useCallback(async (mode: 'initial' | 'refresh') => {
    if (!authSession.getToken()) {
      setVehicles([]);
      setVehicleVerificationStatus(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [rows, verifications] = await Promise.all([
        listVehicles(),
        getMyVerifications().catch(() => null),
      ]);
      const verificationStatus = verifications?.vehicle?.status ?? null;
      setVehicleVerificationStatus(verificationStatus);
      setVehicles(
        rows.map((row) => mapVehicleResponseToGarageVehicle(row, verificationStatus)),
      );
    } catch (error) {
      console.log('[My Garage] GET /vehicles failed', getErrorMessage(error));
      const status = isApiError(error) ? error.status : undefined;
      if (status === 401) {
        authSession.clear();
        showAppAlert('Session expired', 'Please sign in again to view your garage.');
        router.replace(ROUTES.welcome);
        return;
      }
      showAppAlert(
        'Unable to load vehicles',
        getErrorMessage(error, 'Please check your connection and try again.'),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadVehicles('initial');
    }, [loadVehicles]),
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [router]);

  const deleteVehicle = useCallback(
    (vehicle: GarageVehicle) => {
      triggerLightHaptic();
      showAppAlert(MY_GARAGE_SCREEN.deleteTitle, MY_GARAGE_SCREEN.deleteMessage(vehicle.name), [
        { text: MY_GARAGE_SCREEN.cancelLabel, style: 'cancel' },
        {
          text: MY_GARAGE_SCREEN.deleteConfirmLabel,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteVehicleById(vehicle.id);
                triggerSuccessHaptic();
                await loadVehicles('refresh');
              } catch (error) {
                if (isApiError(error) && error.status === 401) {
                  authSession.clear();
                  showAppAlert('Session expired', 'Please sign in again.');
                  router.replace(ROUTES.welcome);
                  return;
                }
                showAppAlert(MY_GARAGE_SCREEN.deleteFailedTitle, getErrorMessage(error));
              }
            })();
          },
        },
      ]);
    },
    [loadVehicles, router],
  );

  const addVehicle = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.addVehicle);
  }, [router]);

  const editVehicle = useCallback(
    (vehicle: GarageVehicle) => {
      triggerLightHaptic();
      router.push({
        pathname: ROUTES.addVehicle,
        params: { vehicleId: vehicle.id },
      });
    },
    [router],
  );

  const toggleVehicleActive = useCallback(
    (vehicle: GarageVehicle, nextActive: boolean) => {
      if (togglingVehicleId) {
        return;
      }

      if (!nextActive) {
        if (!vehicle.isActive) {
          return;
        }
        triggerLightHaptic();
        showAppAlert(
          MY_GARAGE_SCREEN.deactivateInfoTitle,
          MY_GARAGE_SCREEN.deactivateInfoMessage,
        );
        return;
      }

      if (vehicle.isActive) {
        return;
      }

      if (!authSession.getToken()) {
        showAppAlert('Session expired', 'Please sign in again to update your garage.');
        return;
      }

      triggerLightHaptic();
      setTogglingVehicleId(vehicle.id);

      void (async () => {
        try {
          await activateVehicle(vehicle.id);
          triggerSuccessHaptic();
          await loadVehicles('refresh');
        } catch (error) {
          if (isApiError(error) && error.status === 401) {
            authSession.clear();
            showAppAlert('Session expired', 'Please sign in again.');
            router.replace(ROUTES.welcome);
            return;
          }
          showAppAlert(
            MY_GARAGE_SCREEN.activateFailedTitle,
            mapUpdateVehicleError(error),
          );
        } finally {
          setTogglingVehicleId(null);
        }
      })();
    },
    [loadVehicles, router, togglingVehicleId],
  );

  const openVerifyVehicle = useCallback(
    (vehicle: GarageVehicle) => {
      if (vehicleVerificationStatus === 'VERIFIED') {
        showAppAlert(
          MY_GARAGE_SCREEN.verifySuccessTitle,
          'Your vehicle verification is already approved.',
        );
        return;
      }
      triggerLightHaptic();
      setVerifyTarget(vehicle);
      setVerifySheetVisible(true);
    },
    [vehicleVerificationStatus],
  );

  const closeVerifySheet = useCallback(() => {
    if (verifyUploading) {
      return;
    }
    setVerifySheetVisible(false);
    setVerifyTarget(null);
  }, [verifyUploading]);

  const applyVerifyDocument = useCallback(
    (document: UploadedDocument) => {
      const vehicle = verifyTarget;
      if (!vehicle || !authSession.getToken()) {
        showAppAlert('Session expired', 'Please sign in again to verify your vehicle.');
        return;
      }

      const generation = ++verifyGenerationRef.current;
      const stamp = Date.now();
      const fileName = document.fileName?.trim() || `rc_${vehicle.id}_${stamp}.jpg`;
      const mimeType = document.mimeType?.trim() || 'image/jpeg';

      setVerifySheetVisible(false);
      setVerifyUploading(true);
      setVerifyProgress(0);

      void (async () => {
        try {
          const compressed = await compressImage(document.uri, {
            maxDimension: 1600,
            quality: 0.75,
            squareCrop: false,
          });

          if (generation !== verifyGenerationRef.current) {
            return;
          }

          const uploaded = await uploadFile({
            uri: compressed.uri,
            kind: 'rc',
            fileName,
            mimeType: compressed.mimeType ?? mimeType,
            resourceType: 'image',
            onProgress: setVerifyProgress,
          });

          if (generation !== verifyGenerationRef.current) {
            return;
          }

          await saveVehicleRcUrl(uploaded);
          await updateVehicle(vehicle.id, {
            documentUrl: uploaded.secureUrl,
            documentType: 'RC',
            documentReference: uploaded.publicId,
          });

          triggerSuccessHaptic();
          showAppAlert(
            MY_GARAGE_SCREEN.verifySuccessTitle,
            MY_GARAGE_SCREEN.verifySuccessMessage,
          );
          await loadVehicles('refresh');
        } catch (error) {
          if (generation !== verifyGenerationRef.current) {
            return;
          }
          if (isApiError(error) && error.status === 401) {
            authSession.clear();
            showAppAlert('Session expired', 'Please sign in again.');
            router.replace(ROUTES.welcome);
            return;
          }
          const message =
            error instanceof CloudinaryUploadError
              ? error.message
              : mapUpdateVehicleError(error);
          showAppAlert(MY_GARAGE_SCREEN.verifyFailedTitle, message);
        } finally {
          if (generation === verifyGenerationRef.current) {
            setVerifyUploading(false);
            setVerifyProgress(0);
            setVerifyTarget(null);
          }
        }
      })();
    },
    [loadVehicles, router, verifyTarget],
  );

  return {
    vehicles,
    loading,
    refreshing,
    verifySheetVisible,
    verifyUploading,
    verifyProgress,
    togglingVehicleId,
    goBack,
    deleteVehicle,
    addVehicle,
    editVehicle,
    toggleVehicleActive,
    openVerifyVehicle,
    closeVerifySheet,
    applyVerifyDocument,
  };
};

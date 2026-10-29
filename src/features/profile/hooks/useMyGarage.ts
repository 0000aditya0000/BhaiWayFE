import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { useVehicleRcVerification } from '@/hooks/useVehicleRcVerification';
import { authSession } from '@/store';
import {
  getErrorMessage,
  triggerLightHaptic,
  triggerSuccessHaptic,
  showAppAlert,
} from '@/shared/utils';
import {
  CACHE_STALE_TIMES,
  cacheKeys,
  invalidateAfterVehicleRc,
  invalidateVehiclesCache,
  resourceCache,
} from '@/network/resourceCache';
import {
  getMyVerifications,
  listVehicles,
  deleteVehicleById,
  activateVehicle,
} from '../api';
import type { MyVerificationsResponse, VehicleResponse } from '../api';
import { MY_GARAGE_SCREEN } from '../constants';
import type { GarageVehicle } from '../types';
import {
  applyRcVerificationToGarageVehicle,
  formatRcVerifiedAt,
  mapUpdateVehicleError,
  mapVehicleRcVerificationError,
  mapVehicleResponseToGarageVehicle,
  ownerMatchLabel,
} from '../utils';

export interface UseMyGarageResult {
  vehicles: readonly GarageVehicle[];
  loading: boolean;
  refreshing: boolean;
  verifySheetVisible: boolean;
  verifyTarget: GarageVehicle | null;
  verifyUploading: boolean;
  verifyingVehicleId: string | null;
  togglingVehicleId: string | null;
  goBack: () => void;
  deleteVehicle: (vehicle: GarageVehicle) => void;
  addVehicle: () => void;
  editVehicle: (vehicle: GarageVehicle) => void;
  toggleVehicleActive: (vehicle: GarageVehicle, nextActive: boolean) => void;
  openVerifyVehicle: (vehicle: GarageVehicle) => void;
  closeVerifySheet: () => void;
  confirmVerifyRc: () => void;
  ownerMatchHint: (vehicle: GarageVehicle) => string | null;
  verifiedAtLabel: (vehicle: GarageVehicle) => string | null;
}

const isApiError = (error: unknown): error is { status: number; message?: string } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as { status?: unknown }).status === 'number';

export const useMyGarage = (): UseMyGarageResult => {
  const router = useRouter();
  const {
    verify,
    isVerifying,
    verifyingVehicleId,
    reset: resetVerify,
  } = useVehicleRcVerification();
  const [vehicles, setVehicles] = useState<readonly GarageVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifySheetVisible, setVerifySheetVisible] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<GarageVehicle | null>(null);
  const [togglingVehicleId, setTogglingVehicleId] = useState<string | null>(null);

  const loadVehicles = useCallback(async (mode: 'initial' | 'refresh') => {
    if (!authSession.getToken()) {
      setVehicles([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const force = mode === 'refresh';
    if (force) {
      setRefreshing(true);
    } else if (!resourceCache.peek(cacheKeys.vehicles.list())) {
      setLoading(true);
    }

    try {
      const [vehiclesResult, verificationsResult] = await Promise.all([
        resourceCache.query<VehicleResponse[]>({
          key: cacheKeys.vehicles.list(),
          staleTime: CACHE_STALE_TIMES.VEHICLES,
          force,
          fetcher: listVehicles,
        }),
        resourceCache
          .query<MyVerificationsResponse>({
            key: cacheKeys.verification.me(),
            staleTime: CACHE_STALE_TIMES.VERIFICATION,
            force,
            fetcher: getMyVerifications,
          })
          .catch(() => null),
      ]);
      const rows = vehiclesResult.data;
      const verifications = verificationsResult?.data ?? null;
      const verificationStatus = verifications?.vehicle?.status ?? null;
      setVehicles(
        rows.map((row) => mapVehicleResponseToGarageVehicle(row, verificationStatus)),
      );
    } catch (error) {
      console.log('[My Garage] GET /vehicles failed', getErrorMessage(error));
      const kept = resourceCache.peek<VehicleResponse[]>(cacheKeys.vehicles.list());
      if (kept) {
        setVehicles(kept.map((row) => mapVehicleResponseToGarageVehicle(row, null)));
        return;
      }
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
                invalidateVehiclesCache();
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
          invalidateVehiclesCache();
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
      if (vehicle.rcStatus === 'verified') {
        showAppAlert(
          MY_GARAGE_SCREEN.verifySuccessTitle,
          'This vehicle RC is already verified.',
        );
        return;
      }
      if (isVerifying) {
        return;
      }
      triggerLightHaptic();
      resetVerify();
      setVerifyTarget(vehicle);
      setVerifySheetVisible(true);
    },
    [isVerifying, resetVerify],
  );

  const closeVerifySheet = useCallback(() => {
    if (isVerifying) {
      return;
    }
    setVerifySheetVisible(false);
    setVerifyTarget(null);
    resetVerify();
  }, [isVerifying, resetVerify]);

  const confirmVerifyRc = useCallback(() => {
    const vehicle = verifyTarget;
    if (!vehicle || isVerifying) {
      return;
    }

    if (!authSession.getToken()) {
      showAppAlert('Session expired', 'Please sign in again to verify your vehicle.');
      return;
    }

    triggerLightHaptic();
    setVerifySheetVisible(false);

    void (async () => {
      const plate =
        vehicle.plateNumber && vehicle.plateNumber !== '—'
          ? vehicle.plateNumber
          : undefined;

      try {
        const verification = await verify(vehicle.id, plate);

        if (verification?.status === 'VERIFIED') {
          setVehicles((prev) =>
            prev.map((row) =>
              row.id === vehicle.id
                ? applyRcVerificationToGarageVehicle(row, verification)
                : row,
            ),
          );
          triggerSuccessHaptic();
          showAppAlert(
            MY_GARAGE_SCREEN.verifySuccessTitle,
            MY_GARAGE_SCREEN.verifySuccessMessage,
          );
          setVerifyTarget(null);
          invalidateAfterVehicleRc();
          await loadVehicles('refresh');
          return;
        }

        const message =
          verification?.status === 'INVALID'
            ? mapVehicleRcVerificationError({
                status: 422,
                code: 'VEHICLE_RC_INVALID',
                message: 'VEHICLE_RC_INVALID',
              })
            : mapVehicleRcVerificationError({
                status: 422,
                code: 'UNKNOWN',
                message: 'RC verification failed',
              });

        showAppAlert(MY_GARAGE_SCREEN.verifyFailedTitle, message);
        setVehicles((prev) =>
          prev.map((row) => {
            if (row.id !== vehicle.id) {
              return row;
            }
            if (!verification) {
              return {
                ...row,
                rcStatus: row.rcStatus === 'verified' ? 'verified' : 'failed',
              };
            }
            return applyRcVerificationToGarageVehicle(row, verification);
          }),
        );
        setVerifyTarget(null);
      } catch (error) {
        showAppAlert(
          MY_GARAGE_SCREEN.verifyFailedTitle,
          mapVehicleRcVerificationError(error),
        );
        setVehicles((prev) =>
          prev.map((row) =>
            row.id === vehicle.id && row.rcStatus !== 'verified'
              ? { ...row, rcStatus: 'failed' }
              : row,
          ),
        );
        setVerifyTarget(null);
      }
    })();
  }, [isVerifying, loadVehicles, verify, verifyTarget]);

  const ownerMatchHint = useCallback(
    (vehicle: GarageVehicle) => ownerMatchLabel(vehicle.ownerMatchStatus),
    [],
  );

  const verifiedAtLabel = useCallback(
    (vehicle: GarageVehicle) => formatRcVerifiedAt(vehicle.rcVerifiedAt),
    [],
  );

  return {
    vehicles,
    loading,
    refreshing,
    verifySheetVisible,
    verifyTarget,
    verifyUploading: isVerifying,
    verifyingVehicleId,
    togglingVehicleId,
    goBack,
    deleteVehicle,
    addVehicle,
    editVehicle,
    toggleVehicleActive,
    openVerifyVehicle,
    closeVerifySheet,
    confirmVerifyRc,
    ownerMatchHint,
    verifiedAtLabel,
  };
};

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
  patchVehicleInListCache,
  resourceCache,
} from '@/network/resourceCache';
import {
  listVehicles,
  deleteVehicleById,
  activateVehicle,
} from '../api';
import type { VehicleResponse } from '../api';
import { MY_GARAGE_SCREEN } from '../constants';
import type { GarageVehicle } from '../types';
import {
  applyRcVerificationToGarageVehicle,
  collectVehicleRcFailureMessages,
  formatRcVerifiedAt,
  mapUpdateVehicleError,
  mapVehicleRcVerificationError,
  mapVehicleResponseToGarageVehicle,
  mergeGarageVehiclesWithServer,
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
  viewVehicleRcDetails: (vehicle: GarageVehicle) => void;
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

const mapRows = (
  rows: readonly VehicleResponse[],
  previous: readonly GarageVehicle[],
): GarageVehicle[] => mergeGarageVehiclesWithServer(rows, previous);

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
    const cached = resourceCache.peek<VehicleResponse[]>(cacheKeys.vehicles.list());
    if (force) {
      setRefreshing(true);
    } else if (!cached) {
      setLoading(true);
    } else {
      setVehicles((prev) => mapRows(cached, prev));
      setLoading(false);
    }

    try {
      const vehiclesResult = await resourceCache.query<VehicleResponse[]>({
        key: cacheKeys.vehicles.list(),
        staleTime: CACHE_STALE_TIMES.VEHICLES,
        force,
        fetcher: listVehicles,
      });
      const rows = vehiclesResult.data;
      setVehicles((prev) => mapRows(rows, prev));
    } catch (error) {
      console.log('[My Garage] GET /vehicles failed', getErrorMessage(error));
      const kept = resourceCache.peek<VehicleResponse[]>(cacheKeys.vehicles.list());
      if (kept) {
        setVehicles((prev) => mapRows(kept, prev));
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
                const cached = resourceCache.peek<VehicleResponse[]>(cacheKeys.vehicles.list());
                if (cached) {
                  resourceCache.setData(
                    cacheKeys.vehicles.list(),
                    cached.filter((row) => row.id !== vehicle.id),
                  );
                }
                setVehicles((prev) => prev.filter((row) => row.id !== vehicle.id));
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
          const updated = await activateVehicle(vehicle.id);
          patchVehicleInListCache(updated.id, updated);
          const cached = resourceCache.peek<VehicleResponse[]>(cacheKeys.vehicles.list());
          if (cached) {
            resourceCache.setData(
              cacheKeys.vehicles.list(),
              cached.map((row) =>
                row.id === updated.id ? updated : { ...row, isActive: false },
              ),
            );
          }
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

  const viewVehicleRcDetails = useCallback((vehicle: GarageVehicle) => {
    triggerLightHaptic();
    const verifiedDate = formatRcVerifiedAt(vehicle.rcVerifiedAt);
    const matchHint = ownerMatchLabel(vehicle.ownerMatchStatus);
    const lines = [
      vehicle.name,
      vehicle.plateNumber !== '—' ? vehicle.plateNumber : null,
      vehicle.color ? `${MY_GARAGE_SCREEN.colorLabel}: ${vehicle.color}` : null,
      verifiedDate ? `Verified on ${verifiedDate}` : null,
      matchHint,
      ...(vehicle.rcFieldMatches ?? []).map((item) => {
        const status = item.matched ? 'Matched' : 'Mismatch';
        return `${item.fieldLabel}\nEntered: ${item.entered || '—'}\nRC record: ${item.rcRecord || '—'}\nStatus: ${status}`;
      }),
    ].filter((line): line is string => Boolean(line));
    showAppAlert(MY_GARAGE_SCREEN.rcDetailsTitle, lines.join('\n\n') || vehicle.name);
  }, []);

  const openVerifyVehicle = useCallback(
    (vehicle: GarageVehicle) => {
      if (vehicle.rcStatus === 'verified') {
        viewVehicleRcDetails(vehicle);
        return;
      }
      if (vehicle.rcStatus === 'pending') {
        showAppAlert(
          MY_GARAGE_SCREEN.verifyPendingTitle,
          MY_GARAGE_SCREEN.verifyPendingMessage,
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
    [isVerifying, resetVerify, viewVehicleRcDetails],
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

        if (!verification) {
          return;
        }

        const updated = applyRcVerificationToGarageVehicle(vehicle, verification);
        setVehicles((prev) =>
          prev.map((row) => (row.id === vehicle.id ? updated : row)),
        );
        patchVehicleInListCache<VehicleResponse>(vehicle.id, {
          rcVerificationStatus: verification.status,
          ownerMatchStatus: verification.ownerMatchStatus,
          rcVerifiedAt: verification.verifiedAt,
          isRcVerified: verification.status === 'VERIFIED',
        });

        if (verification.status === 'VERIFIED') {
          triggerSuccessHaptic();
          showAppAlert(
            MY_GARAGE_SCREEN.verifySuccessTitle,
            MY_GARAGE_SCREEN.verifySuccessMessage,
          );
          setVerifyTarget(null);
          await loadVehicles('refresh');
          return;
        }

        if (verification.status === 'PENDING') {
          showAppAlert(
            MY_GARAGE_SCREEN.verifyPendingTitle,
            MY_GARAGE_SCREEN.verifyPendingMessage,
          );
          setVerifyTarget(null);
          return;
        }

        const messages = collectVehicleRcFailureMessages(verification);
        showAppAlert(
          MY_GARAGE_SCREEN.verifyFailedTitle,
          messages.join('\n') || mapVehicleRcVerificationError({
            status: 422,
            code: 'VEHICLE_RC_INVALID',
            message: 'VEHICLE_RC_INVALID',
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
              ? {
                  ...row,
                  rcStatus: 'failed' as const,
                  rcErrorMessages: collectVehicleRcFailureMessages(error),
                }
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
    viewVehicleRcDetails,
    closeVerifySheet,
    confirmVerifyRc,
    ownerMatchHint,
    verifiedAtLabel,
  };
};

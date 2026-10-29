import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { driverRidesRefreshStore } from '@/features/my-rides/store/driverRidesRefreshStore';
import { getMyVerifications, listVehicles } from '@/features/profile/api';
import { formatBhaiWayCoins, getErrorMessage, showAppAlert, triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { authSession } from '@/store';
import { rideCoordsCache } from '@/shared/maps';
import { createRide } from '../api';
import {
  RIDE_PREFERENCE_OPTIONS,
  RIDE_PREFERENCES_SCREEN,
} from '../constants';
import { publishRideDraft, publishedRideStore } from '../store';
import type {
  PublishRideDraft,
  PublishRideVehicleOption,
  RidePreferenceId,
} from '../types';
import {
  computeAssuredDriverDepositCoins,
  validateAssuredDraftCoordinates,
} from '../utils/assuredPublish.utils';
import {
  evaluatePublishVerificationReadiness,
  isExplicitRouteSelection,
  isRouteSelectionTokenError,
  mapCreateRideError,
  mapDraftToCreateRideDto,
  mapRideResponseToPublishedSummary,
  mapVehicleResponseToPublishOption,
  primaryPublishBlockMessage,
  toRouteEndpoints,
} from '../utils';

export interface UseRidePreferencesResult {
  draft: PublishRideDraft;
  isAssured: boolean;
  preferenceOptions: typeof RIDE_PREFERENCE_OPTIONS;
  vehicles: readonly PublishRideVehicleOption[];
  notesLength: number;
  canPublish: boolean;
  publishing: boolean;
  refundableAmountLabel: string;
  totalToPayLabel: string;
  primaryCtaLabel: string;
  togglePreference: (id: RidePreferenceId) => void;
  setNotes: (notes: string) => void;
  selectVehicle: (vehicleId: string) => void;
  setPromoCode: (code: string) => void;
  applyPromo: () => void;
  addVehicle: () => void;
  publish: () => void;
  goBack: () => void;
}

const isApiError = (
  value: unknown,
): value is { status: number; code: string; message: string } =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  'code' in value &&
  'message' in value;

export const useRidePreferences = (): UseRidePreferencesResult => {
  const router = useRouter();
  const [draft, setDraft] = useState<PublishRideDraft>(() => publishRideDraft.get());
  const [vehicles, setVehicles] = useState<PublishRideVehicleOption[]>([]);
  const [publishing, setPublishing] = useState(false);
  const publishingRef = useRef(false);

  useEffect(() => publishRideDraft.subscribe(setDraft), []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void (async () => {
        if (!authSession.getToken()) {
          return;
        }

        try {
          const rows = await listVehicles();
          if (!active) {
            return;
          }
          const options = rows
            .filter((row) => row.isActive)
            .map(mapVehicleResponseToPublishOption);
          setVehicles(options);
          const current = publishRideDraft.get();
          const stillValid = options.some((item) => item.id === current.selectedVehicleId);
          if (!stillValid) {
            publishRideDraft.update({
              selectedVehicleId: options[0]?.id ?? null,
            });
          }
        } catch (error) {
          console.log('[Publish Ride] GET /vehicles failed', getErrorMessage(error));
          if (isApiError(error) && error.status === 401) {
            authSession.clear();
            showAppAlert('Session expired', 'Please sign in again to publish a ride.');
            router.replace(ROUTES.welcome);
          }
        }
      })();

      return () => {
        active = false;
      };
    }, [router]),
  );

  const isAssured = draft.rideType === 'assured';

  const refundableAmountLabel = useMemo(() => {
    if (!isAssured) {
      return formatBhaiWayCoins(0, { spaced: false, minimumFractionDigits: 0 });
    }
    const coins = computeAssuredDriverDepositCoins(draft);
    return coins
      ? formatBhaiWayCoins(Number(coins), { spaced: false, minimumFractionDigits: 0 })
      : '—';
  }, [draft, isAssured]);

  const totalToPayLabel = useMemo(() => {
    if (!isAssured) {
      return formatBhaiWayCoins(0, { spaced: false, minimumFractionDigits: 0 });
    }
    const coins = computeAssuredDriverDepositCoins(draft);
    return coins
      ? formatBhaiWayCoins(Number(coins), { spaced: false, minimumFractionDigits: 0 })
      : '—';
  }, [draft, isAssured]);

  const primaryCtaLabel = isAssured
    ? RIDE_PREFERENCES_SCREEN.confirmPayLabel
    : RIDE_PREFERENCES_SCREEN.publishLabel;

  const togglePreference = useCallback((id: RidePreferenceId) => {
    triggerLightHaptic();
    const current = publishRideDraft.get();
    publishRideDraft.update({
      preferences: {
        ...current.preferences,
        [id]: !current.preferences[id],
      },
    });
  }, []);

  const setNotes = useCallback((notes: string) => {
    const trimmed = notes.slice(0, RIDE_PREFERENCES_SCREEN.notesMaxLength);
    publishRideDraft.update({ notes: trimmed });
  }, []);

  const selectVehicle = useCallback((vehicleId: string) => {
    triggerLightHaptic();
    publishRideDraft.update({ selectedVehicleId: vehicleId });
  }, []);

  const setPromoCode = useCallback((code: string) => {
    publishRideDraft.update({
      promoCode: code,
      promoApplied: false,
    });
  }, []);

  const applyPromo = useCallback(() => {
    triggerLightHaptic();
    const current = publishRideDraft.get();
    const code = current.promoCode.trim();
    if (!code) {
      showAppAlert('Promo code', RIDE_PREFERENCES_SCREEN.promoInvalidMessage);
      return;
    }
    publishRideDraft.update({ promoApplied: true });
    showAppAlert('Promo code', RIDE_PREFERENCES_SCREEN.promoAppliedMessage);
  }, []);

  const addVehicle = useCallback(() => {
    triggerLightHaptic();
    router.push({
      pathname: ROUTES.addVehicle,
      params: { returnTo: 'offer-ride-preferences' },
    });
  }, [router]);

  const publish = useCallback(() => {
    const current = publishRideDraft.get();
    if (!current.selectedVehicleId) {
      showAppAlert(
        RIDE_PREFERENCES_SCREEN.missingVehicleTitle,
        RIDE_PREFERENCES_SCREEN.missingVehicleMessage,
      );
      return;
    }

    if (current.rideType === 'assured') {
      const coordCheck = validateAssuredDraftCoordinates(current);
      if (!coordCheck.ok) {
        showAppAlert('Location required', coordCheck.message);
        return;
      }

      const mappedAssured = mapDraftToCreateRideDto(current);
      if (!mappedAssured.ok) {
        if (mappedAssured.message.includes('driving route') || mappedAssured.message.includes('map')) {
          showAppAlert('Select a route', mappedAssured.message);
          router.push(ROUTES.offerRideSelectRoute);
          return;
        }
        showAppAlert('Check ride details', mappedAssured.message);
        return;
      }

      triggerLightHaptic();
      router.push(ROUTES.offerRidePayment);
      return;
    }

    if (publishingRef.current) {
      return;
    }

    const mapped = mapDraftToCreateRideDto(current);
    if (!mapped.ok) {
      if (mapped.message.includes('driving route') || mapped.message.includes('map')) {
        showAppAlert('Select a route', mapped.message);
        router.push(ROUTES.offerRideSelectRoute);
        return;
      }
      showAppAlert('Check ride details', mapped.message);
      return;
    }

    publishingRef.current = true;
    setPublishing(true);
    triggerLightHaptic();

    void (async () => {
      try {
        if (!authSession.getToken()) {
          showAppAlert('Session expired', 'Please sign in again to publish a ride.');
          return;
        }

        const selected =
          vehicles.find((item) => item.id === current.selectedVehicleId) ?? null;
        const verifications = await getMyVerifications().catch(() => null);
        const readiness = evaluatePublishVerificationReadiness({
          identityStatus: verifications?.identity.status,
          vehicleVerificationStatus: verifications?.vehicle.status,
          drivingLicenseStatus: verifications?.drivingLicense.status,
          vehicleIsRcVerified: selected?.isRcVerified,
          vehicleIsActive: selected?.isActive ?? true,
          hasSelectedVehicle: Boolean(current.selectedVehicleId),
        });
        const blockMessage = primaryPublishBlockMessage(readiness);
        if (blockMessage) {
          showAppAlert('Verification required', blockMessage);
          return;
        }

        const created = await createRide(mapped.payload);
        console.log('[Publish Ride] POST /rides response', created);

        const origin = current.originLocation;
        const destination = current.destinationLocation;
        await rideCoordsCache.save({
          rideId: created.id,
          origin:
            origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude)
              ? { latitude: origin.latitude!, longitude: origin.longitude! }
              : null,
          destination:
            destination &&
            Number.isFinite(destination.latitude) &&
            Number.isFinite(destination.longitude)
              ? { latitude: destination.latitude!, longitude: destination.longitude! }
              : null,
          originAddress: current.origin || origin?.address,
          destinationAddress: current.destination || destination?.address,
        });

        const vehicle =
          vehicles.find((item) => item.id === created.vehicleId) ??
          vehicles.find((item) => item.id === current.selectedVehicleId) ??
          null;

        publishedRideStore.set(
          mapRideResponseToPublishedSummary(created, vehicle, {
            music: current.preferences.music,
            notes: current.notes,
          }),
        );
        publishRideDraft.reset(current.rideType);
        driverRidesRefreshStore.bump();
        const { invalidateRidesMyCache } = await import('@/network/resourceCache');
        invalidateRidesMyCache();
        triggerSuccessHaptic();
        router.replace(ROUTES.offerRidePublished);
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          authSession.clear();
          showAppAlert('Session expired', mapCreateRideError(error));
          router.replace(ROUTES.welcome);
          return;
        }

        if (isRouteSelectionTokenError(error)) {
          publishRideDraft.update({ routeSelection: null });
          showAppAlert('Select a route', mapCreateRideError(error));
          router.push(ROUTES.offerRideSelectRoute);
          return;
        }

        const title = isApiError(error) && error.status === 403
          ? 'Unable to publish'
          : 'Unable to publish ride';
        showAppAlert(title, mapCreateRideError(error));
      } finally {
        publishingRef.current = false;
        setPublishing(false);
      }
    })();
  }, [router, vehicles]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.offerRidePublish);
  }, [router]);

  return {
    draft,
    isAssured,
    preferenceOptions: RIDE_PREFERENCE_OPTIONS,
    vehicles,
    notesLength: draft.notes.length,
    canPublish:
      Boolean(draft.selectedVehicleId) &&
      vehicles.length > 0 &&
      !publishing &&
      isExplicitRouteSelection(
        draft.routeSelection,
        toRouteEndpoints(
          draft.originLocation?.latitude,
          draft.originLocation?.longitude,
          draft.destinationLocation?.latitude,
          draft.destinationLocation?.longitude,
        ),
      ),
    publishing,
    refundableAmountLabel,
    totalToPayLabel,
    primaryCtaLabel,
    togglePreference,
    setNotes,
    selectVehicle,
    setPromoCode,
    applyPromo,
    addVehicle,
    publish,
    goBack,
  };
};

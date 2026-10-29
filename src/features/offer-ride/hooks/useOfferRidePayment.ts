import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getMyVerifications, listVehicles } from '@/features/profile/api';
import { useWalletBalance } from '@/features/profile/hooks/useWalletBalance';
import { formatCoinsLabel } from '@/features/profile/utils/walletCoin';
import { rideCoordsCache } from '@/shared/maps';
import {
  getErrorMessage,
  showAppAlert,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils';
import { authSession } from '@/store';
import { driverRidesRefreshStore } from '@/features/my-rides/store/driverRidesRefreshStore';
import type { PaymentMethodId } from '@/features/ride-search/types';
import { createRide } from '../api';
import { OFFER_RIDE_PAYMENT_SCREEN } from '../constants';
import { publishRideDraft, publishedRideStore } from '../store';
import type { PublishRideVehicleOption } from '../types';
import {
  computeAssuredDriverDepositCoins,
  generateAssuredPublishIdempotencyKey,
  isInsufficientWalletForAssuredPublish,
} from '../utils/assuredPublish.utils';
import {
  mapCreateRideError,
  mapDraftToCreateRideDto,
  mapRideResponseToPublishedSummary,
  mapVehicleResponseToPublishOption,
} from '../utils/createRide.mapper';
import { isRouteSelectionTokenError } from '../utils/routeSelection';
import {
  evaluatePublishVerificationReadiness,
  primaryPublishBlockMessage,
} from '../utils/publishReadiness';

export interface UseOfferRidePaymentResult {
  selectedId: PaymentMethodId;
  setSelectedId: (id: PaymentMethodId) => void;
  confirmAndPublish: () => void;
  publishing: boolean;
  depositCoins: string | null;
  walletAvailableCoins: string | null;
  onAddCoins: () => void;
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

export const useOfferRidePayment = (): UseOfferRidePaymentResult => {
  const router = useRouter();
  const { summary: walletSummary, refresh: refreshWallet } = useWalletBalance();
  const [selectedId, setSelectedId] = useState<PaymentMethodId>('wallet');
  const [publishing, setPublishing] = useState(false);
  const publishingRef = useRef(false);
  const idempotencyRef = useRef<{ key: string; draftHash: string } | null>(null);
  const [vehicles, setVehicles] = useState<PublishRideVehicleOption[]>([]);
  const [draft, setDraft] = useState(() => publishRideDraft.get());

  useEffect(() => publishRideDraft.subscribe(setDraft), []);

  const depositCoins = useMemo(() => computeAssuredDriverDepositCoins(draft), [draft]);

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
          setVehicles(rows.filter((row) => row.isActive).map(mapVehicleResponseToPublishOption));
        } catch (error) {
          console.log('[Assured Publish] GET /vehicles failed', getErrorMessage(error));
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const buildDraftHash = useCallback((current: ReturnType<typeof publishRideDraft.get>): string => {
    return [
      current.rideType,
      current.origin,
      current.destination,
      current.departureDate,
      current.departureTime,
      current.availableSeats,
      current.pricePerSeat,
      current.selectedVehicleId ?? '',
      current.originLocation?.latitude ?? '',
      current.originLocation?.longitude ?? '',
      current.destinationLocation?.latitude ?? '',
      current.destinationLocation?.longitude ?? '',
      current.routeSelection?.selectionToken ?? '',
    ].join('|');
  }, []);

  const resolvePublishIdempotencyKey = useCallback((): string => {
    const current = publishRideDraft.get();
    const draftHash = buildDraftHash(current);
    const existing = idempotencyRef.current;
    if (existing && existing.draftHash === draftHash) {
      return existing.key;
    }
    const key = generateAssuredPublishIdempotencyKey();
    idempotencyRef.current = { key, draftHash };
    return key;
  }, [buildDraftHash]);

  const clearPublishIdempotencyKey = useCallback(() => {
    idempotencyRef.current = null;
  }, []);

  const confirmAndPublish = useCallback(() => {
    if (publishingRef.current) {
      return;
    }

    const current = publishRideDraft.get();
    if (current.rideType !== 'assured') {
      showAppAlert('Unable to publish', 'This payment step is only for Assured rides.');
      return;
    }

    if (!current.selectedVehicleId) {
      showAppAlert(
        OFFER_RIDE_PAYMENT_SCREEN.missingVehicleTitle,
        OFFER_RIDE_PAYMENT_SCREEN.missingVehicleMessage,
      );
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

    const availableCoins = walletSummary?.availableCoins ?? null;
    if (isInsufficientWalletForAssuredPublish(availableCoins, depositCoins)) {
      showAppAlert(
        'Insufficient BhaiWay Coins',
        `You need ${formatCoinsLabel(depositCoins ?? '0')} available for the Assured driver deposit. Add coins to your wallet and try again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Coins', onPress: () => router.push(ROUTES.addMoney) },
        ],
      );
      return;
    }

    publishingRef.current = true;
    setPublishing(true);
    triggerLightHaptic();

    const idempotencyKey = resolvePublishIdempotencyKey();

    void (async () => {
      try {
        if (!authSession.getToken()) {
          showAppAlert('Session expired', 'Please sign in again to publish a ride.');
          router.replace(ROUTES.welcome);
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

        const created = await createRide(mapped.payload, { idempotencyKey });
        console.log('[Assured Publish] POST /rides response', created);

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
        clearPublishIdempotencyKey();
        driverRidesRefreshStore.bump();
        const { invalidateRidesMyCache, invalidateWalletCache } = await import(
          '@/network/resourceCache'
        );
        invalidateRidesMyCache();
        invalidateWalletCache();
        await refreshWallet();
        triggerSuccessHaptic();
        router.replace(ROUTES.offerRidePublished);
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          authSession.clear();
          showAppAlert('Session expired', mapCreateRideError(error));
          router.replace(ROUTES.welcome);
          return;
        }

        if (isApiError(error) && error.status === 409) {
          clearPublishIdempotencyKey();
        }

        if (isRouteSelectionTokenError(error)) {
          publishRideDraft.update({ routeSelection: null });
          showAppAlert('Select a route', mapCreateRideError(error));
          router.push(ROUTES.offerRideSelectRoute);
          return;
        }

        const message = mapCreateRideError(error);
        if (isApiError(error) && error.status === 422) {
          showAppAlert('Insufficient BhaiWay Coins', message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Coins', onPress: () => router.push(ROUTES.addMoney) },
          ]);
          return;
        }

        showAppAlert('Unable to publish ride', message);
      } finally {
        publishingRef.current = false;
        setPublishing(false);
      }
    })();
  }, [
    clearPublishIdempotencyKey,
    depositCoins,
    refreshWallet,
    resolvePublishIdempotencyKey,
    router,
    vehicles,
    walletSummary?.availableCoins,
  ]);

  const onAddCoins = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.addMoney);
  }, [router]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.offerRidePreferences);
  }, [router]);

  return {
    selectedId,
    setSelectedId,
    confirmAndPublish,
    publishing,
    depositCoins,
    walletAvailableCoins: walletSummary?.availableCoins ?? null,
    onAddCoins,
    goBack,
  };
};

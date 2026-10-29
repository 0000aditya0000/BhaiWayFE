import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { createRide } from '@/features/offer-ride/api';
import {
  evaluatePublishVerificationReadiness,
  formatRouteDistanceLabel,
  formatRouteDurationLabel,
  isRouteSelectionTokenError,
  mapCreateRideError,
  primaryPublishBlockMessage,
} from '@/features/offer-ride/utils';
import { COMMUTE_SERIES_COPY } from '../constants/commute-series.constants';
import {
  commutePublishIdempotencyStore,
  commutePublishRequiresIdempotency,
  isAmbiguousPublishNetworkError,
  isReturnRouteSelectionTokenError,
  summarizeCommutePublish,
} from '../utils/commuteSeries.utils';
import { driverRidesRefreshStore } from '@/features/my-rides/store/driverRidesRefreshStore';
import { getMyVerifications, listVehicles } from '@/features/profile/api';
import type { MapCoordinate } from '@/features/ride-search/types';
import {
  decodeGooglePolyline,
  isValidMapCoordinate,
  parseMapCoordinate,
} from '@/shared/maps';
import { parseSlashDate, showAppAlert } from '@/shared/utils';
import { authSession } from '@/store';
import {
  DEFAULT_OFFICE_LOCATION,
  DEFAULT_START_LOCATION,
  formatDisplayTime,
  formatEstimatedEarnings,
  WEEKDAY_OPTIONS,
} from '../constants';
import { publishCommuteDraft } from '../store';
import { useCorporateVerified } from './useCorporateVerified';
import { publishedCommuteStore } from '../store/publishedCommuteStore';
import type { PublishCommuteDraft } from '../types';
import { mapPublishCommuteDraftToCreateRide } from '../utils/createCommuteRide.mapper';

export interface UseReviewDriveResult {
  draft: PublishCommuteDraft;
  pickup: MapCoordinate | null;
  destination: MapCoordinate | null;
  routeCoordinates: MapCoordinate[];
  pickupLabel: string;
  destinationLabel: string;
  departureLabel: string;
  returnDepartureLabel: string;
  distanceLabel: string;
  durationLabel: string;
  routeLoading: boolean;
  estimatedEarnings: string;
  weekdays: typeof WEEKDAY_OPTIONS;
  publishing: boolean;
  canPublish: boolean;
  isCorporateVerified: boolean;
  corporateStatusReady: boolean;
  goBack: () => void;
  verifyIdentity: () => void;
  publishRide: () => void;
}

export const useReviewDrive = (): UseReviewDriveResult => {
  const router = useRouter();
  const [draft, setDraft] = useState<PublishCommuteDraft>(() => publishCommuteDraft.get());
  const [publishing, setPublishing] = useState(false);
  const { verified: isCorporateVerified, ready: corporateStatusReady } =
    useCorporateVerified();

  useEffect(() => publishCommuteDraft.subscribe(setDraft), []);

  const pickupDetail = draft.startLocationDetail ?? DEFAULT_START_LOCATION;
  const destinationDetail = draft.officeLocationDetail ?? DEFAULT_OFFICE_LOCATION;
  const selectedRoute = draft.routeSelection;

  const pickup = useMemo(
    () =>
      parseMapCoordinate(selectedRoute?.sourceLatitude, selectedRoute?.sourceLongitude) ??
      parseMapCoordinate(pickupDetail.latitude, pickupDetail.longitude),
    [
      pickupDetail.latitude,
      pickupDetail.longitude,
      selectedRoute?.sourceLatitude,
      selectedRoute?.sourceLongitude,
    ],
  );

  const destination = useMemo(
    () =>
      parseMapCoordinate(
        selectedRoute?.destinationLatitude,
        selectedRoute?.destinationLongitude,
      ) ?? parseMapCoordinate(destinationDetail.latitude, destinationDetail.longitude),
    [
      destinationDetail.latitude,
      destinationDetail.longitude,
      selectedRoute?.destinationLatitude,
      selectedRoute?.destinationLongitude,
    ],
  );

  const pickupLabel = draft.startLocation || pickupDetail.placeName || pickupDetail.address;
  const destinationLabel =
    draft.officeLocation || destinationDetail.placeName || destinationDetail.address;

  const departureLabel = [draft.departureDate.trim(), formatDisplayTime(draft.departureTime)]
    .filter(Boolean)
    .join(' · ');

  const returnDepartureLabel = draft.returningBack
    ? formatDisplayTime(draft.returnDepartureTime)
    : '';

  const routeCoordinates = useMemo(() => {
    const encoded = selectedRoute?.polyline?.trim() ?? '';
    let decoded: MapCoordinate[] = [];
    if (encoded) {
      try {
        decoded = decodeGooglePolyline(encoded).filter(isValidMapCoordinate);
      } catch {
        decoded = [];
      }
    }
    if (decoded.length >= 2) {
      return decoded;
    }
    if (pickup && destination) {
      return [pickup, destination];
    }
    return decoded;
  }, [destination, pickup, selectedRoute?.polyline]);
  const distanceLabel = selectedRoute
    ? formatRouteDistanceLabel(selectedRoute.distanceMeters)
    : '';
  const durationLabel = selectedRoute
    ? formatRouteDurationLabel(selectedRoute.durationSeconds)
    : '';
  const routeLoading = false;

  const estimatedEarnings = useMemo(
    () => formatEstimatedEarnings(draft.pricePerSeat, draft.seats),
    [draft.pricePerSeat, draft.seats],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.officeCommutePublish);
  }, [router]);

  const verifyIdentity = useCallback(() => {
    router.push(ROUTES.officeCommuteVerify);
  }, [router]);

  const publishRide = useCallback(() => {
    if (publishing) {
      return;
    }

    if (!authSession.getToken()) {
      showAppAlert('Session expired', 'Please sign in again to publish a commute ride.');
      router.replace(ROUTES.welcome);
      return;
    }

    setPublishing(true);

    void (async () => {
      try {
        const vehicles = await listVehicles();
        const activeVehicle = vehicles.find((row) => row.isActive) ?? vehicles[0];
        if (!activeVehicle?.id) {
          showAppAlert('Vehicle required', 'Add an active vehicle in My Garage before publishing.');
          return;
        }

        const verifications = await getMyVerifications().catch(() => null);
        const readiness = evaluatePublishVerificationReadiness({
          identityStatus: verifications?.identity.status,
          vehicleVerificationStatus: verifications?.vehicle.status,
          drivingLicenseStatus: verifications?.drivingLicense.status,
          vehicleIsRcVerified:
            activeVehicle.isRcVerified === true ||
            activeVehicle.isVerified === true ||
            String(activeVehicle.rcVerificationStatus ?? '')
              .trim()
              .toUpperCase() === 'VERIFIED',
          vehicleIsActive: activeVehicle.isActive,
          hasSelectedVehicle: true,
        });
        const blockMessage = primaryPublishBlockMessage(readiness);
        if (blockMessage) {
          showAppAlert('Verification required', blockMessage);
          return;
        }

        const departureDate = parseSlashDate(draft.departureDate);
        if (!departureDate) {
          showAppAlert('Missing schedule', 'Please select a departure date.');
          return;
        }

        const mapped = mapPublishCommuteDraftToCreateRide(
          draft,
          activeVehicle.id,
          departureDate,
        );
        if (!mapped.ok) {
          if (mapped.message === COMMUTE_SERIES_COPY.missingReturnRouteMessage) {
            showAppAlert(
              COMMUTE_SERIES_COPY.missingReturnRouteTitle,
              mapped.message,
            );
            router.push(ROUTES.officeCommuteSelectReturnRoute);
            return;
          }
          if (mapped.message.includes('driving route') || mapped.message.includes('map')) {
            showAppAlert('Select a route', mapped.message);
            router.push(ROUTES.officeCommuteSelectRoute);
            return;
          }
          showAppAlert('Unable to publish', mapped.message);
          return;
        }

        const needsKey = commutePublishRequiresIdempotency(mapped.payload);
        const idempotencyKey = needsKey
          ? commutePublishIdempotencyStore.resolve(mapped.payload)
          : undefined;

        const publishOnce = () =>
          createRide(
            mapped.payload,
            idempotencyKey ? { idempotencyKey } : undefined,
          );

        let created;
        try {
          created = await publishOnce();
        } catch (error) {
          if (needsKey && isAmbiguousPublishNetworkError(error)) {
            created = await publishOnce();
          } else {
            throw error;
          }
        }

        const occurrenceSummary = summarizeCommutePublish(created);
        commutePublishIdempotencyStore.clear();
        driverRidesRefreshStore.bump();
        publishedCommuteStore.set({
          pickupLabel,
          dropoffLabel: destinationLabel,
          departureLabel,
          seats: draft.seats,
          pricePerSeat: draft.pricePerSeat,
          recurringDays: [...draft.recurringDays],
          rideId: occurrenceSummary.rideId,
          seriesId: occurrenceSummary.seriesId,
          occurrenceSummary: occurrenceSummary.message,
          outboundCount: occurrenceSummary.outboundCount,
          returnCount: occurrenceSummary.returnCount,
        });
        publishCommuteDraft.reset();
        showAppAlert('Ride published', occurrenceSummary.message);
        router.replace(ROUTES.officeCommutePublished);
      } catch (error) {
        if (isReturnRouteSelectionTokenError(error)) {
          publishCommuteDraft.update({ returnRouteSelection: null });
          showAppAlert(
            COMMUTE_SERIES_COPY.missingReturnRouteTitle,
            mapCreateRideError(error),
          );
          router.push(ROUTES.officeCommuteSelectReturnRoute);
          return;
        }
        if (isRouteSelectionTokenError(error)) {
          publishCommuteDraft.update({ routeSelection: null });
          showAppAlert('Select a route', mapCreateRideError(error));
          router.push(ROUTES.officeCommuteSelectRoute);
          return;
        }
        showAppAlert('Unable to publish', mapCreateRideError(error));
      } finally {
        setPublishing(false);
      }
    })();
  }, [
    departureLabel,
    destinationLabel,
    draft,
    pickupLabel,
    publishing,
    router,
  ]);

  return {
    draft,
    pickup,
    destination,
    routeCoordinates,
    pickupLabel,
    destinationLabel,
    departureLabel,
    returnDepartureLabel,
    distanceLabel,
    durationLabel,
    routeLoading,
    estimatedEarnings,
    weekdays: WEEKDAY_OPTIONS,
    publishing,
    canPublish:
      Boolean(draft.routeSelection?.selectionToken) &&
      (!draft.returningBack || Boolean(draft.returnRouteSelection?.selectionToken)) &&
      !publishing,
    isCorporateVerified,
    corporateStatusReady,
    goBack,
    verifyIdentity,
    publishRide,
  };
};

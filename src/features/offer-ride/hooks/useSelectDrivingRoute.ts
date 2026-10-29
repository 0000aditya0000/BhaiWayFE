import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { modifyRideRouteSelectionStore } from '@/features/my-rides/store/modifyRideRouteSelectionStore';
import { publishCommuteDraft } from '@/features/office-commute/store';
import { ensureRideCoords, isValidMapCoordinate, type MapLatLng } from '@/shared/maps';
import { showAppAlert, triggerLightHaptic } from '@/shared/utils';

import type { SelectDrivingRouteMode, SelectedDrivingRoute } from '../api/routeOptions.types';
import { SELECT_DRIVING_ROUTE_SCREEN } from '../constants/select-route.constants';
import { publishRideDraft } from '../store';
import {
  ROUTE_SELECTION_USER_MESSAGES,
  toRouteEndpoints,
} from '../utils/routeSelection';
import { useRouteOptions } from './useRouteOptions';

export interface UseSelectDrivingRouteResult {
  title: string;
  subtitle: string;
  source: MapLatLng | null;
  destination: MapLatLng | null;
  sourceLabel: string;
  destinationLabel: string;
  resolvingEndpoints: boolean;
  continueLabel: string;
  retryLabel: string;
  goBack: () => void;
  confirm: () => void;
  options: ReturnType<typeof useRouteOptions>['options'];
  selectedOptionId: string | null;
  loading: boolean;
  errorMessage: string | null;
  selectOption: ReturnType<typeof useRouteOptions>['selectOption'];
  retry: () => void;
  canContinue: boolean;
}

const toMapPoint = (latitude?: number | null, longitude?: number | null): MapLatLng | null => {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !isValidMapCoordinate({ latitude, longitude })
  ) {
    return null;
  }
  return { latitude, longitude };
};

export const useSelectDrivingRoute = (
  mode: SelectDrivingRouteMode,
): UseSelectDrivingRouteResult => {
  const router = useRouter();
  const [outstationDraft, setOutstationDraft] = useState(() => publishRideDraft.get());
  const [commuteDraft, setCommuteDraft] = useState(() => publishCommuteDraft.get());
  const [modifySource, setModifySource] = useState<MapLatLng | null>(null);
  const [modifyDestination, setModifyDestination] = useState<MapLatLng | null>(null);
  const [modifyLabels, setModifyLabels] = useState(() => {
    const primed = modifyRideRouteSelectionStore.getPrime();
    return {
      source: primed?.origin ?? '',
      destination: primed?.destination ?? '',
    };
  });
  const [resolvingEndpoints, setResolvingEndpoints] = useState(mode === 'modify');
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => publishRideDraft.subscribe(setOutstationDraft), []);
  useEffect(() => publishCommuteDraft.subscribe(setCommuteDraft), []);

  useEffect(() => {
    if (mode !== 'modify') {
      return;
    }

    let cancelled = false;
    const primed = modifyRideRouteSelectionStore.getPrime();
    if (!primed) {
      setResolvingEndpoints(false);
      setResolveError('Missing ride details. Go back and try again.');
      return;
    }

    setModifyLabels({
      source: primed.origin,
      destination: primed.destination,
    });
    setResolvingEndpoints(true);
    setResolveError(null);

    void ensureRideCoords({
      rideId: primed.rideId,
      originAddress: primed.origin,
      destinationAddress: primed.destination,
    })
      .then((coords) => {
        if (cancelled) {
          return;
        }
        const origin = coords.origin;
        const destination = coords.destination;
        if (!isValidMapCoordinate(origin) || !isValidMapCoordinate(destination)) {
          setModifySource(null);
          setModifyDestination(null);
          setResolveError(
            'We could not find map coordinates for these addresses. Check the starting point and destination and try again.',
          );
          return;
        }
        setModifySource(origin);
        setModifyDestination(destination);
      })
      .catch(() => {
        if (!cancelled) {
          setResolveError(ROUTE_SELECTION_USER_MESSAGES.fetchFailed);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setResolvingEndpoints(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const isCommuteReturn = mode === 'commute-return';

  const source = useMemo(() => {
    if (mode === 'commute') {
      return toMapPoint(
        commuteDraft.startLocationDetail?.latitude,
        commuteDraft.startLocationDetail?.longitude,
      );
    }
    if (isCommuteReturn) {
      return toMapPoint(
        commuteDraft.officeLocationDetail?.latitude,
        commuteDraft.officeLocationDetail?.longitude,
      );
    }
    if (mode === 'modify') {
      return modifySource;
    }
    return toMapPoint(
      outstationDraft.originLocation?.latitude,
      outstationDraft.originLocation?.longitude,
    );
  }, [
    commuteDraft.officeLocationDetail?.latitude,
    commuteDraft.officeLocationDetail?.longitude,
    commuteDraft.startLocationDetail?.latitude,
    commuteDraft.startLocationDetail?.longitude,
    isCommuteReturn,
    mode,
    modifySource,
    outstationDraft.originLocation?.latitude,
    outstationDraft.originLocation?.longitude,
  ]);

  const destination = useMemo(() => {
    if (mode === 'commute') {
      return toMapPoint(
        commuteDraft.officeLocationDetail?.latitude,
        commuteDraft.officeLocationDetail?.longitude,
      );
    }
    if (isCommuteReturn) {
      return toMapPoint(
        commuteDraft.startLocationDetail?.latitude,
        commuteDraft.startLocationDetail?.longitude,
      );
    }
    if (mode === 'modify') {
      return modifyDestination;
    }
    return toMapPoint(
      outstationDraft.destinationLocation?.latitude,
      outstationDraft.destinationLocation?.longitude,
    );
  }, [
    commuteDraft.officeLocationDetail?.latitude,
    commuteDraft.officeLocationDetail?.longitude,
    commuteDraft.startLocationDetail?.latitude,
    commuteDraft.startLocationDetail?.longitude,
    isCommuteReturn,
    mode,
    modifyDestination,
    outstationDraft.destinationLocation?.latitude,
    outstationDraft.destinationLocation?.longitude,
  ]);

  const sourceLabel =
    mode === 'commute'
      ? commuteDraft.startLocation
      : isCommuteReturn
        ? commuteDraft.officeLocation
        : mode === 'modify'
          ? modifyLabels.source
          : outstationDraft.origin;
  const destinationLabel =
    mode === 'commute'
      ? commuteDraft.officeLocation
      : isCommuteReturn
        ? commuteDraft.startLocation
        : mode === 'modify'
          ? modifyLabels.destination
          : outstationDraft.destination;

  const endpoints = useMemo(
    () =>
      toRouteEndpoints(
        source?.latitude,
        source?.longitude,
        destination?.latitude,
        destination?.longitude,
      ),
    [destination?.latitude, destination?.longitude, source?.latitude, source?.longitude],
  );

  const existingSelection: SelectedDrivingRoute | null =
    mode === 'commute'
      ? commuteDraft.routeSelection
      : isCommuteReturn
        ? commuteDraft.returnRouteSelection
        : mode === 'modify'
          ? null
          : outstationDraft.routeSelection;

  const routeOptions = useRouteOptions(
    resolvingEndpoints ? null : endpoints,
    { source: sourceLabel, destination: destinationLabel },
    existingSelection,
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (mode === 'commute') {
      router.replace(ROUTES.officeCommutePublish);
      return;
    }
    if (isCommuteReturn) {
      router.replace(ROUTES.officeCommuteSelectRoute);
      return;
    }
    if (mode === 'modify') {
      router.replace(ROUTES.myRidesModifyRide);
      return;
    }
    router.replace(ROUTES.offerRidePublish);
  }, [isCommuteReturn, mode, router]);

  const confirm = useCallback(() => {
    if (!routeOptions.canContinue || !routeOptions.selected || !endpoints) {
      showAppAlert('Select a route', ROUTE_SELECTION_USER_MESSAGES.required);
      return;
    }
    if (routeOptions.loading || resolvingEndpoints) {
      showAppAlert('Please wait', ROUTE_SELECTION_USER_MESSAGES.inProgress);
      return;
    }

    triggerLightHaptic();
    const selection = routeOptions.selected;

    if (mode === 'commute') {
      publishCommuteDraft.update({ routeSelection: selection });
      if (commuteDraft.returningBack) {
        router.push(ROUTES.officeCommuteSelectReturnRoute);
        return;
      }
      router.push(ROUTES.officeCommuteReview);
      return;
    }

    if (isCommuteReturn) {
      publishCommuteDraft.update({ returnRouteSelection: selection });
      router.push(ROUTES.officeCommuteReview);
      return;
    }

    if (mode === 'modify') {
      if (!source || !destination) {
        showAppAlert('Locations required', ROUTE_SELECTION_USER_MESSAGES.missingCoords);
        return;
      }
      modifyRideRouteSelectionStore.setResult({
        origin: sourceLabel,
        destination: destinationLabel,
        originCoordinate: source,
        destinationCoordinate: destination,
        routeSelection: selection,
      });
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace(ROUTES.myRidesModifyRide);
      return;
    }

    publishRideDraft.update({ routeSelection: selection });
    router.push(ROUTES.offerRidePreferences);
  }, [
    commuteDraft.returningBack,
    destination,
    destinationLabel,
    endpoints,
    isCommuteReturn,
    mode,
    resolvingEndpoints,
    routeOptions.canContinue,
    routeOptions.loading,
    routeOptions.selected,
    router,
    source,
    sourceLabel,
  ]);

  const retry = useCallback(() => {
    if (mode === 'modify' && (!source || !destination)) {
      setResolvingEndpoints(true);
      setResolveError(null);
      const primed = modifyRideRouteSelectionStore.getPrime();
      if (!primed) {
        setResolvingEndpoints(false);
        setResolveError('Missing ride details. Go back and try again.');
        return;
      }
      void ensureRideCoords({
        rideId: primed.rideId,
        originAddress: primed.origin,
        destinationAddress: primed.destination,
      }).then((coords) => {
        if (isValidMapCoordinate(coords.origin) && isValidMapCoordinate(coords.destination)) {
          setModifySource(coords.origin);
          setModifyDestination(coords.destination);
          setResolveError(null);
        } else {
          setResolveError(
            'We could not find map coordinates for these addresses. Check the starting point and destination and try again.',
          );
        }
        setResolvingEndpoints(false);
      });
      return;
    }
    routeOptions.retry();
  }, [destination, mode, routeOptions, source]);

  return {
    title: isCommuteReturn
      ? SELECT_DRIVING_ROUTE_SCREEN.returnTitle
      : SELECT_DRIVING_ROUTE_SCREEN.title,
    subtitle: isCommuteReturn
      ? SELECT_DRIVING_ROUTE_SCREEN.returnSubtitle
      : SELECT_DRIVING_ROUTE_SCREEN.subtitle,
    source,
    destination,
    sourceLabel,
    destinationLabel,
    resolvingEndpoints,
    continueLabel: SELECT_DRIVING_ROUTE_SCREEN.continueLabel,
    retryLabel: SELECT_DRIVING_ROUTE_SCREEN.retryLabel,
    goBack,
    confirm,
    options: routeOptions.options,
    selectedOptionId: routeOptions.selected?.optionId ?? null,
    loading: resolvingEndpoints || routeOptions.loading,
    errorMessage: resolveError ?? routeOptions.errorMessage,
    selectOption: routeOptions.selectOption,
    retry,
    canContinue: routeOptions.canContinue && !resolvingEndpoints,
  };
};

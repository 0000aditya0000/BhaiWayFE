import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';

import { listMyActiveRides } from '@/features/offer-ride/api';
import { listDriverBookings } from '@/features/ride-search/api';
import { driverRidesRefreshStore } from '@/features/my-rides/store/driverRidesRefreshStore';
import { resolveDriverTripPhase } from '@/features/my-rides/utils/resolveDriverTripPhase';
import { driverLocationPublisher } from '@/services/location';
import { authSession } from '@/store';
import { getErrorMessage, logger, showAppAlert, triggerLightHaptic } from '@/shared/utils';

import { ACTIVE_RIDE_COPY, ACTIVE_RIDE_LAYOUT } from '../constants/active-ride.constants';
import { mapActiveRideItems, type ActiveRideView } from '../utils/activeRide.mapper';
import { resolveActiveRideNavigation } from '../utils/activeRide.navigation';
import {
  INITIAL_ACTIVE_RIDES_STATE,
  isActiveRideContainerVisible,
  reduceActiveRidesFailure,
  reduceActiveRidesSelect,
  reduceActiveRidesSuccess,
  selectedActiveRide,
  type ActiveRidesUiState,
} from '../utils/activeRide.state';

export interface UseActiveRidesResult {
  visible: boolean;
  expanded: boolean;
  items: readonly ActiveRideView[];
  selected: ActiveRideView | null;
  expand: () => void;
  collapse: () => void;
  toggleExpanded: () => void;
  selectRide: (key: string) => void;
  goToRide: () => void;
  refresh: () => Promise<void>;
}

export const useActiveRides = (): UseActiveRidesResult => {
  const router = useRouter();
  const [state, setState] = useState<ActiveRidesUiState>(INITIAL_ACTIVE_RIDES_STATE);
  const [expanded, setExpanded] = useState(false);
  const inFlightRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const mountedRef = useRef(true);
  const navigatingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<void> => {
    if (!authSession.getToken()) {
      return;
    }
    const now = Date.now();
    if (inFlightRef.current) {
      return;
    }
    if (now - lastFetchAtRef.current < ACTIVE_RIDE_LAYOUT.fetchDedupeMs) {
      return;
    }

    inFlightRef.current = true;
    lastFetchAtRef.current = now;
    try {
      const result = await listMyActiveRides();
      if (!mountedRef.current) {
        return;
      }
      const items = mapActiveRideItems(result.items);
      setState((current) => reduceActiveRidesSuccess(current, items));
      if (items.length === 0) {
        setExpanded(false);
      }
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }
      logger.error('GET /rides/my-active failed', getErrorMessage(error));
      setState((current) => reduceActiveRidesFailure(current, getErrorMessage(error)));
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        void load();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [load]);

  useEffect(
    () =>
      driverRidesRefreshStore.subscribe(() => {
        void load();
      }),
    [load],
  );

  const expand = useCallback(() => {
    setExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setExpanded(false);
  }, []);

  const toggleExpanded = useCallback(() => {
    triggerLightHaptic();
    setExpanded((current) => !current);
  }, []);

  const selectRide = useCallback((key: string) => {
    triggerLightHaptic();
    setState((current) => reduceActiveRidesSelect(current, key));
    setExpanded(true);
  }, []);

  const goToRide = useCallback(() => {
    if (navigatingRef.current) {
      return;
    }
    const ride = selectedActiveRide(state);
    if (!ride) {
      return;
    }

    const open = (driverPhase?: Parameters<typeof resolveActiveRideNavigation>[1]) => {
      const target = resolveActiveRideNavigation(ride, driverPhase);
      if (!target.ok) {
        showAppAlert(target.title, target.message);
        return;
      }
      try {
        router.push({
          pathname: target.pathname,
          params: target.params,
        } as Href);
      } catch (error) {
        logger.error('Active ride navigation failed', getErrorMessage(error));
        showAppAlert(
          ACTIVE_RIDE_COPY.navigationFailedTitle,
          ACTIVE_RIDE_COPY.navigationFailedMessage,
        );
      }
    };

    if (ride.role === 'DRIVER') {
      navigatingRef.current = true;
      void driverLocationPublisher.ensure(ride.rideId);
      void (async () => {
        try {
          const bookings = await listDriverBookings({
            rideId: ride.rideId,
            page: 1,
            limit: 50,
          });
          const phase = resolveDriverTripPhase('IN_PROGRESS', bookings);
          open({ driverPhase: phase });
        } catch (error) {
          logger.error('Active ride driver phase lookup failed', getErrorMessage(error));
          open({ driverPhase: 'PICKUP_PASSENGER' });
        } finally {
          navigatingRef.current = false;
        }
      })();
      return;
    }

    open();
  }, [router, state]);

  const selected = useMemo(() => selectedActiveRide(state), [state]);
  const refresh = useCallback(() => {
    lastFetchAtRef.current = 0;
    return load();
  }, [load]);

  return {
    visible: isActiveRideContainerVisible(state),
    expanded,
    items: state.items,
    selected,
    expand,
    collapse,
    toggleExpanded,
    selectRide,
    goToRide,
    refresh,
  };
};

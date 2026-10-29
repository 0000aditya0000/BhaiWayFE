import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchRouteOptions } from '../api/routeOptions.api';
import type {
  RouteEndpoints,
  RouteOptionDto,
  SelectedDrivingRoute,
} from '../api/routeOptions.types';
import {
  RouteOptionsSession,
  endpointsEqual,
  mapRouteSelectionError,
  routeEndpointsKey,
  selectionMatchesEndpoints,
  toSelectedDrivingRoute,
} from '../utils/routeSelection';

const CACHE_TTL_MS = 10 * 60 * 1000;

const optionsCache = new Map<
  string,
  { options: RouteOptionDto[]; savedAt: number }
>();

export interface UseRouteOptionsResult {
  options: RouteOptionDto[];
  selected: SelectedDrivingRoute | null;
  loading: boolean;
  errorMessage: string | null;
  selectOption: (option: RouteOptionDto) => void;
  retry: () => void;
  canContinue: boolean;
}

export const useRouteOptions = (
  endpoints: RouteEndpoints | null,
  labels: { source?: string; destination?: string },
  existingSelection: SelectedDrivingRoute | null,
): UseRouteOptionsResult => {
  const sessionRef = useRef(new RouteOptionsSession());
  const existingRef = useRef(existingSelection);
  const labelsRef = useRef(labels);
  existingRef.current = existingSelection;
  labelsRef.current = labels;

  const [options, setOptions] = useState<RouteOptionDto[]>([]);
  const [selected, setSelected] = useState<SelectedDrivingRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const endpointsKey = endpoints ? routeEndpointsKey(endpoints) : '';

  useEffect(() => {
    const session = sessionRef.current;
    if (!endpoints) {
      session.invalidate();
      setOptions([]);
      setSelected(null);
      setLoading(false);
      setErrorMessage(null);
      return;
    }

    const cached = optionsCache.get(endpointsKey);
    const cacheFresh =
      cached != null &&
      cached.options.length > 0 &&
      Date.now() - cached.savedAt < CACHE_TTL_MS;

    if (cacheFresh && reloadToken === 0) {
      const keep = selectionMatchesEndpoints(existingRef.current, endpoints);
      setOptions(cached.options);
      setSelected(keep ? existingRef.current : null);
      setLoading(false);
      setErrorMessage(null);
      return;
    }

    const requestId = session.next();
    setLoading(true);
    setErrorMessage(null);
    setSelected(null);
    setOptions([]);

    void fetchRouteOptions({
      ...endpoints,
      source: labelsRef.current.source,
      destination: labelsRef.current.destination,
    })
      .then((nextOptions) => {
        if (!session.isCurrent(requestId)) {
          return;
        }
        optionsCache.set(endpointsKey, { options: nextOptions, savedAt: Date.now() });
        setOptions(nextOptions);
        setSelected(null);
        if (nextOptions.length === 0) {
          setErrorMessage(
            'No driving routes were found for these locations. Change the endpoints and try again.',
          );
        }
      })
      .catch((error: unknown) => {
        if (!session.isCurrent(requestId)) {
          return;
        }
        setOptions([]);
        setSelected(null);
        setErrorMessage(mapRouteSelectionError(error));
      })
      .finally(() => {
        if (session.isCurrent(requestId)) {
          setLoading(false);
        }
      });
  }, [endpoints, endpointsKey, reloadToken]);

  const selectOption = useCallback(
    (option: RouteOptionDto) => {
      if (!endpoints || loading) {
        return;
      }
      setSelected(toSelectedDrivingRoute(option, endpoints));
    },
    [endpoints, loading],
  );

  const retry = useCallback(() => {
    if (endpointsKey) {
      optionsCache.delete(endpointsKey);
    }
    setReloadToken((value) => value + 1);
  }, [endpointsKey]);

  const canContinue = useMemo(() => {
    if (loading || !endpoints || !selected) {
      return false;
    }
    const belongsToOptions = options.some(
      (option) =>
        option.optionId === selected.optionId &&
        option.selectionToken === selected.selectionToken,
    );
    return belongsToOptions && endpointsEqual(selected, endpoints);
  }, [endpoints, loading, options, selected]);

  return {
    options,
    selected,
    loading,
    errorMessage,
    selectOption,
    retry,
    canContinue,
  };
};

export const clearRouteOptionsCache = (): void => {
  optionsCache.clear();
};

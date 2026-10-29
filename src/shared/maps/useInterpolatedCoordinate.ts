import { useCallback, useEffect, useRef, useState } from 'react';

import type { MapLatLng } from './map.types';
import { isValidMapCoordinate } from './map.utils';


const DEFAULT_DURATION_MS = 900;

export interface UseInterpolatedCoordinateOptions {
  /** Animation duration between real GPS samples. */
  durationMs?: number;
  enabled?: boolean;
}

export interface UseInterpolatedCoordinateResult {
  /** Smooth coordinate for the map marker (never invented — only between real points). */
  animatedCoordinate: MapLatLng | null;
  heading: number | null;
}

/**
 * Interpolates marker movement between successive real GPS points (A → B).
 * Does not invent locations; holds last point when target is cleared.
 */
export const useInterpolatedCoordinate = (
  target: MapLatLng | null,
  heading: number | null = null,
  options: UseInterpolatedCoordinateOptions = {},
): UseInterpolatedCoordinateResult => {
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
  const enabled = options.enabled !== false;

  const [animatedCoordinate, setAnimatedCoordinate] = useState<MapLatLng | null>(
    isValidMapCoordinate(target) ? target : null,
  );
  const [displayHeading, setDisplayHeading] = useState<number | null>(heading);

  const fromRef = useRef<MapLatLng | null>(null);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef(0);

  const cancelFrame = useCallback(() => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (heading != null && Number.isFinite(heading)) {
      setDisplayHeading(heading);
    }
  }, [heading]);

  useEffect(() => {
    if (!enabled) {
      cancelFrame();
      if (isValidMapCoordinate(target)) {
        setAnimatedCoordinate(target);
        fromRef.current = target;
      }
      return;
    }

    if (!isValidMapCoordinate(target)) {
      return;
    }

    const from = fromRef.current;
    if (!from || !isValidMapCoordinate(from)) {
      fromRef.current = target;
      setAnimatedCoordinate(target);
      return;
    }

    if (
      Math.abs(from.latitude - target.latitude) < 1e-7 &&
      Math.abs(from.longitude - target.longitude) < 1e-7
    ) {
      return;
    }

    cancelFrame();
    startRef.current = Date.now();
    const origin = { ...from };
    const destination = { ...target };

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      // Ease-out quad
      const eased = 1 - (1 - t) * (1 - t);
      const next: MapLatLng = {
        latitude: origin.latitude + (destination.latitude - origin.latitude) * eased,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * eased,
      };
      setAnimatedCoordinate(next);
      fromRef.current = next;
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = destination;
        setAnimatedCoordinate(destination);
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return cancelFrame;
  }, [cancelFrame, durationMs, enabled, target?.latitude, target?.longitude]);

  useEffect(() => () => cancelFrame(), [cancelFrame]);

  return {
    animatedCoordinate,
    heading: displayHeading,
  };
};

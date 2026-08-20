import { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getSearchParam, showAppAlert, triggerLightHaptic } from '@/shared/utils';
import { TRIP_DETAILS_SCREEN, getTripDetailsMock } from '../constants';
import type { TripDetailsSummary } from '../types';
import { buildDriverTripInvoiceText, shareInvoiceDocument } from '../utils';
import { useDriverRideKind } from './useDriverRideKind';

export interface UseTripDetailsResult {
  trip: TripDetailsSummary;
  downloadInvoice: () => void;
  goBack: () => void;
}

export const useTripDetails = (): UseTripDetailsResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rideId?: string;
    origin?: string;
    destination?: string;
  }>();
  const rideType = useDriverRideKind();
  const [sharing, setSharing] = useState(false);

  const trip = useMemo(
    () =>
      getTripDetailsMock({
        rideId: getSearchParam(params.rideId) || undefined,
        origin: getSearchParam(params.origin) || undefined,
        destination: getSearchParam(params.destination) || undefined,
        rideType,
      }),
    [params.destination, params.origin, params.rideId, rideType],
  );

  const downloadInvoice = useCallback(() => {
    if (sharing) {
      return;
    }
    triggerLightHaptic();
    setSharing(true);
    void (async () => {
      try {
        const body = buildDriverTripInvoiceText(trip);
        await shareInvoiceDocument({
          fileBaseName: `bhaiway-driver-invoice-${trip.rideId || trip.rideType}`,
          body,
          dialogTitle: TRIP_DETAILS_SCREEN.downloadInvoiceTitle,
        });
      } catch {
        showAppAlert(
          TRIP_DETAILS_SCREEN.downloadInvoiceTitle,
          'Unable to share the invoice right now. Please try again.',
        );
      } finally {
        setSharing(false);
      }
    })();
  }, [sharing, trip]);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  return {
    trip,
    downloadInvoice,
    goBack,
  };
};

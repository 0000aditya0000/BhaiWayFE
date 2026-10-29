import { useCallback, useMemo, useState } from 'react';
import { Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  getSearchParam,
  resetTo,
  showAppAlert,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils';
import {
  ISSUE_REPORTED_SCREEN,
  getRideInvoicePath,
} from '../constants';

export interface UseIssueReportedResult {
  referenceNumber: string;
  copied: boolean;
  copyReference: () => Promise<void>;
  goHome: () => void;
  backToRideDetails: () => void;
  close: () => void;
}

export const useIssueReported = (): UseIssueReportedResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rideId?: string;
    referenceNumber?: string;
    pickupLabel?: string;
    dropoffLabel?: string;
    dateLabel?: string;
  }>();
  const [copied, setCopied] = useState(false);

  const rideId = getSearchParam(params.rideId) || undefined;
  const pickupLabel = getSearchParam(params.pickupLabel) || undefined;
  const dropoffLabel = getSearchParam(params.dropoffLabel) || undefined;
  const dateLabel = getSearchParam(params.dateLabel) || undefined;

  const referenceNumber = useMemo(
    () => getSearchParam(params.referenceNumber) || ISSUE_REPORTED_SCREEN.defaultReference,
    [params.referenceNumber],
  );

  const copyReference = useCallback(async () => {
    triggerLightHaptic();
    try {
      await Share.share({ message: referenceNumber });
      setCopied(true);
      triggerSuccessHaptic();
      showAppAlert(ISSUE_REPORTED_SCREEN.copiedTitle, ISSUE_REPORTED_SCREEN.copiedMessage);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showAppAlert(ISSUE_REPORTED_SCREEN.referenceLabel, referenceNumber);
    }
  }, [referenceNumber]);

  const goHome = useCallback(() => {
    triggerLightHaptic();
    resetTo(router, ROUTES.home);
  }, [router]);

  const backToRideDetails = useCallback(() => {
    triggerLightHaptic();
    router.replace(
      getRideInvoicePath({
        bookingId: rideId,
      }),
    );
  }, [dateLabel, dropoffLabel, pickupLabel, rideId, router]);

  const close = useCallback(() => {
    triggerLightHaptic();
    resetTo(router, ROUTES.myRides);
  }, [router]);

  return {
    referenceNumber,
    copied,
    copyReference,
    goHome,
    backToRideDetails,
    close,
  };
};

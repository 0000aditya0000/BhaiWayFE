import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getBookingById, getPublicRideById } from '@/features/ride-search/api';
import { resolvePersonPhotoUrl } from '@/features/ride-search/api/bookingPersonPhoto';
import { getDriverChatPath, getLiveTrackingPath } from '@/features/ride-search/constants';
import { resolveDriverContactPhone } from '@/features/ride-search/utils/bookingContactPhone';
import { triggerLightHaptic, showAppAlert, openPhoneCall } from '@/shared/utils';
import { getCommuteCancelRidePath } from '../constants/commute-cancel-ride.constants';
import { COMMUTE_RIDE_BOOKED_SCREEN } from '../constants/commute-ride-booked.constants';
import { commuteBookedStore } from '../store/commuteBookedStore';

const BOOKING_POLL_MS = 5000;

export interface UseCommuteRideBookedParams {
  rideId: string;
  bookingId?: string;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  price?: number;
  seats?: number;
  status?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

export interface CommuteBookedDetails {
  rideId: string;
  bookingId: string;
  status: string;
  isPending: boolean;
  isConfirmed: boolean;
  isCancelled: boolean;
  driverName: string;
  driverRating: number;
  driverAvatarUri: string;
  vehicleLabel: string;
  dateLabel: string;
  timeLabel: string;
  seats: number;
  paidAmount: number;
  pickupTitle: string;
  pickupAddress: string;
  dropoffTitle: string;
  dropoffAddress: string;
  etaMinutes: number;
  mapImageUri: string;
}

export interface UseCommuteRideBookedResult {
  details: CommuteBookedDetails;
  openNotifications: () => void;
  messageDriver: () => void;
  callDriver: () => void;
  trackRide: () => void;
  openRideOptions: () => void;
}

export const useCommuteRideBooked = (
  params: UseCommuteRideBookedParams,
): UseCommuteRideBookedResult => {
  const router = useRouter();
  const [bookingStatus, setBookingStatus] = useState(
    String(params.status ?? commuteBookedStore.get()?.booking.status ?? 'PENDING').toUpperCase(),
  );
  const [driverPhone, setDriverPhone] = useState<string | null>(null);
  const [driverAvatarUri, setDriverAvatarUri] = useState(
    () => resolvePersonPhotoUrl(commuteBookedStore.get()?.booking.driver),
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyDriverPhoto = useCallback((photo: string) => {
    const next = photo.trim();
    if (!next) {
      return;
    }
    setDriverAvatarUri((prev) => prev || next);
  }, []);

  const refreshBookingStatus = useCallback(async () => {
    const bookingId = params.bookingId?.trim();
    if (!bookingId) {
      return;
    }
    try {
      const booking = await getBookingById(bookingId);
      setBookingStatus(String(booking.status ?? 'PENDING').toUpperCase());
      setDriverPhone(resolveDriverContactPhone(booking) || null);
      applyDriverPhoto(resolvePersonPhotoUrl(booking.driver));
    } catch {
      // Keep last known status.
    }
  }, [applyDriverPhoto, params.bookingId]);

  useEffect(() => {
    void refreshBookingStatus();
  }, [refreshBookingStatus]);

  useEffect(() => {
    const rideId = params.rideId?.trim();
    if (!rideId || driverAvatarUri) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const ride = await getPublicRideById(rideId);
        if (cancelled) {
          return;
        }
        applyDriverPhoto(resolvePersonPhotoUrl(ride.driver));
      } catch {
        // Keep last known photo.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyDriverPhoto, driverAvatarUri, params.rideId]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    const normalized = bookingStatus.toUpperCase();
    if (normalized !== 'PENDING') {
      return;
    }

    pollRef.current = setInterval(() => {
      void refreshBookingStatus();
    }, BOOKING_POLL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [bookingStatus, refreshBookingStatus]);

  const details = useMemo<CommuteBookedDetails>(() => {
    const snapshot = commuteBookedStore.get();
    const pickupTitle =
      params.origin?.trim() || COMMUTE_RIDE_BOOKED_SCREEN.defaultPickupTitle;
    const dropoffTitle =
      params.destination?.trim() || COMMUTE_RIDE_BOOKED_SCREEN.defaultDropoffTitle;
    const paidFromStore = snapshot?.booking.totalAmount
      ? Number(String(snapshot.booking.totalAmount).replace(/[^\d.]/g, ''))
      : 0;
    const normalizedStatus = bookingStatus.toUpperCase();

    return {
      rideId: params.rideId,
      bookingId: params.bookingId?.trim() || snapshot?.booking.id || '',
      status: normalizedStatus,
      isPending: normalizedStatus === 'PENDING',
      isConfirmed: normalizedStatus === 'CONFIRMED' || normalizedStatus === 'PICKED_UP',
      isCancelled: normalizedStatus === 'CANCELLED',
      driverName: params.driverName?.trim() || COMMUTE_RIDE_BOOKED_SCREEN.defaultDriverName,
      driverRating: COMMUTE_RIDE_BOOKED_SCREEN.defaultDriverRating,
      driverAvatarUri,
      vehicleLabel: params.carModel?.trim() || COMMUTE_RIDE_BOOKED_SCREEN.defaultVehicle,
      dateLabel: COMMUTE_RIDE_BOOKED_SCREEN.defaultDateLabel,
      timeLabel: COMMUTE_RIDE_BOOKED_SCREEN.defaultTimeLabel,
      seats: params.seats ?? snapshot?.booking.seats ?? 1,
      paidAmount:
        params.price ??
        (Number.isFinite(paidFromStore) && paidFromStore > 0 ? paidFromStore : 0),
      pickupTitle,
      pickupAddress: COMMUTE_RIDE_BOOKED_SCREEN.defaultPickupAddress,
      dropoffTitle,
      dropoffAddress: COMMUTE_RIDE_BOOKED_SCREEN.defaultDropoffAddress,
      etaMinutes: COMMUTE_RIDE_BOOKED_SCREEN.driverEtaMinutes,
      mapImageUri: COMMUTE_RIDE_BOOKED_SCREEN.mapImageUri,
    };
  }, [bookingStatus, driverAvatarUri, params]);

  const openNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const messageDriver = useCallback(() => {
    triggerLightHaptic();
    router.push(
      getDriverChatPath({
        driverName: details.driverName,
        carModel: details.vehicleLabel,
        bookingId: details.bookingId || params.bookingId,
        perspective: 'rider',
        routeLabel:
          details.pickupTitle && details.dropoffTitle
            ? `${details.pickupTitle} → ${details.dropoffTitle}`
            : undefined,
      }),
    );
  }, [
    details.bookingId,
    details.driverName,
    details.dropoffTitle,
    details.pickupTitle,
    details.vehicleLabel,
    params.bookingId,
    router,
  ]);

  const callDriver = useCallback(() => {
    triggerLightHaptic();
    if (!driverPhone) {
      showAppAlert('Call', 'Driver phone number is not available on this booking yet.');
      return;
    }
    void openPhoneCall(driverPhone).then((started) => {
      if (!started) {
        showAppAlert('Call', 'Unable to start a call right now.');
      }
    });
  }, [driverPhone]);

  const trackRide = useCallback(() => {
    if (details.isPending) {
      showAppAlert(
        'Waiting for driver',
        COMMUTE_RIDE_BOOKED_SCREEN.subtitlePending,
      );
      return;
    }
    if (details.isCancelled) {
      showAppAlert('Booking cancelled', 'This commute booking was cancelled.');
      return;
    }
    triggerLightHaptic();
    router.push(
      getLiveTrackingPath({
        rideId: details.rideId,
        rideType: 'regular',
        origin: details.pickupTitle,
        destination: details.dropoffTitle,
        driverName: details.driverName,
        carModel: details.vehicleLabel,
        price: details.paidAmount,
        bookingId: details.bookingId,
        originLat: params.originLat,
        originLng: params.originLng,
        destinationLat: params.destinationLat,
        destinationLng: params.destinationLng,
      }),
    );
  }, [details, params, router]);

  const openRideOptions = useCallback(() => {
    if (!details.bookingId) {
      showAppAlert('Unable to cancel', 'Missing booking id. Please reopen your booking.');
      return;
    }
    triggerLightHaptic();
    router.push(
      getCommuteCancelRidePath({
        bookingId: details.bookingId,
        rideId: details.rideId,
        origin: details.pickupTitle,
        destination: details.dropoffTitle,
        dateLabel: details.dateLabel,
        timeLabel: details.timeLabel,
      }),
    );
  }, [details, router]);

  return {
    details,
    openNotifications,
    messageDriver,
    callDriver,
    trackRide,
    openRideOptions,
  };
};

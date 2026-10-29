import { useCallback, useEffect, useMemo, useState } from 'react';
import { showAppAlert } from '@/store';

import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getBookingById } from '../api';
import {
  BOOKED_SCREEN,
  getBookedRideMock,
  getDriverChatPath,
  getLiveTrackingPath,
} from '../constants';
import { getRiderBookedRidePath } from '@/features/my-rides/constants';
import { bookedRideStore } from '../store';
import type { BookedRideDetails, RideType } from '../types';
import { resolveDriverContactPhone } from '../utils/bookingContactPhone';
import { openPhoneCall } from '@/shared/utils';

export interface UseBookedRideParams {
  rideId: string;
  rideType: RideType;
  bookingId?: string;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  price?: number;
  seats?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

export interface UseBookedRideResult {
  details: BookedRideDetails;
  meetMessage: string;
  isAssured: boolean;
  isRegular: boolean;
  addToCalendar: () => void;
  trackRide: () => void;
  viewRideDetails: () => void;
  chatDriver: () => void;
  callDriver: () => void;
  goHome: () => void;
  goMyRides: () => void;
}

export const useBookedRide = (params: UseBookedRideParams): UseBookedRideResult => {
  const router = useRouter();
  const isRegular = params.rideType === 'regular';
  const [driverPhone, setDriverPhone] = useState<string | null>(null);

  const details = useMemo(() => {
    const stored = bookedRideStore.get();
    if (
      stored &&
      (stored.booking.id === params.bookingId ||
        stored.booking.rideId === params.rideId ||
        stored.details.rideId === params.rideId)
    ) {
      return stored.details;
    }

    const mock = getBookedRideMock({
      rideId: params.rideId,
      rideType: params.rideType,
      origin: params.origin,
      destination: params.destination,
      driverName: params.driverName,
      carModel: params.carModel,
    });

    if (isRegular) {
      return {
        ...mock,
        bookingId: params.bookingId,
        seats: params.seats,
        fareTotal: params.price,
        paymentMethod: 'PAY_LATER',
        paymentStatus: 'UNPAID',
        bookingStatus: 'CONFIRMED',
      };
    }

    return mock;
  }, [
    isRegular,
    params.bookingId,
    params.carModel,
    params.destination,
    params.driverName,
    params.origin,
    params.price,
    params.rideId,
    params.rideType,
    params.seats,
  ]);

  useEffect(() => {
    const bookingId = params.bookingId?.trim();
    if (!bookingId) {
      setDriverPhone(null);
      return;
    }
    let cancelled = false;
    void getBookingById(bookingId)
      .then((booking) => {
        if (!cancelled) {
          setDriverPhone(resolveDriverContactPhone(booking) || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDriverPhone(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.bookingId]);

  const meetMessage = useMemo(
    () => `${details.driverName.split(' ')[0]} will see you at ${details.meetTimeLabel}.`,
    [details.driverName, details.meetTimeLabel],
  );

  const addToCalendar = useCallback(() => {
    showAppAlert(BOOKED_SCREEN.addToCalendarLabel, 'Calendar sync will be available soon.');
  }, []);

  const trackRide = useCallback(() => {
    router.push(
      getLiveTrackingPath({
        rideId: details.rideId,
        rideType: details.rideType,
        origin: params.origin || details.pickup,
        destination: params.destination || details.dropoff,
        driverName: details.driverName,
        carModel: details.vehicle,
        plateNumber: details.plateNumber,
        price: params.price ?? details.fareTotal,
        originLat: params.originLat,
        originLng: params.originLng,
        destinationLat: params.destinationLat,
        destinationLng: params.destinationLng,
        bookingId: details.bookingId || params.bookingId,
      }),
    );
  }, [details, params, router]);

  const viewRideDetails = useCallback(() => {
    const bookingId = (details.bookingId || params.bookingId || '').trim();
    if (!bookingId) {
      showAppAlert('Ride Details', 'Booking ID is missing. Open this ride from My Rides.');
      return;
    }
    router.push(
      getRiderBookedRidePath({
        bookingId,
        rideId: details.rideId,
      }),
    );
  }, [details.bookingId, details.rideId, params.bookingId, router]);

  const chatDriver = useCallback(() => {
    router.push(
      getDriverChatPath({
        driverName: details.driverName,
        carModel: details.vehicle,
        bookingId: details.bookingId || params.bookingId,
        perspective: 'rider',
      }),
    );
  }, [details.bookingId, details.driverName, details.vehicle, params.bookingId, router]);

  const callDriver = useCallback(() => {
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

  const goHome = useCallback(() => {
    router.replace(ROUTES.home);
  }, [router]);

  const goMyRides = useCallback(() => {
    router.replace(ROUTES.myRides);
  }, [router]);

  return {
    details,
    meetMessage,
    isAssured: details.rideType === 'assured',
    isRegular,
    addToCalendar,
    trackRide,
    viewRideDetails,
    chatDriver,
    callDriver,
    goHome,
    goMyRides,
  };
};

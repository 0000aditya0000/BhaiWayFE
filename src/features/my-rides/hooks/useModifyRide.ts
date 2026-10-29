import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getRideById, updateRideById } from '@/features/offer-ride/api/rides.api';
import type { ApiSeriesScope } from '@/features/offer-ride/api/rides.types';
import { COMMUTE_SERIES_COPY } from '@/features/office-commute/constants/commute-series.constants';
import { isCommuteSeriesRide } from '@/features/office-commute/utils/commuteSeries.utils';
import { driverRidesRefreshStore } from '../store/driverRidesRefreshStore';
import type { PublishRideVehicleOption } from '@/features/offer-ride/types';
import {
  buildUpdateRidePayload,
  computeSeatBounds,
  didModifyRouteChange,
  isRideModifiable,
  isRouteSelectionTokenError,
  mapRideToModifyForm,
  mapUpdateRideError,
  mapVehicleResponseToPublishOption,
  resolveBookedSeats,
  ROUTE_SELECTION_USER_MESSAGES,
} from '@/features/offer-ride/utils';
import { modifyRideRouteSelectionStore } from '../store/modifyRideRouteSelectionStore';
import { listVehicles } from '@/features/profile/api/vehicle.api';
import { listDriverBookings } from '@/features/ride-search/api/bookings.api';
import {
  getSearchParam,
  showAppAlert,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils';
import {
  DEFAULT_MODIFY_RIDE_FORM,
  MODIFY_RIDE_PREFERENCE_OPTIONS,
  MODIFY_RIDE_SCREEN,
  type ModifyRideFormState,
  type ModifyRidePreferenceId,
} from '../constants';

export interface UseModifyRideResult {
  form: ModifyRideFormState;
  preferenceOptions: typeof MODIFY_RIDE_PREFERENCE_OPTIONS;
  vehicles: readonly PublishRideVehicleOption[];
  datePickerOpen: boolean;
  timePickerOpen: boolean;
  selectedDate: Date;
  selectedTime: Date;
  minimumDate: Date;
  loading: boolean;
  saving: boolean;
  loadError: string | null;
  tripDetailsLocked: boolean;
  canEdit: boolean;
  isAssuredRide: boolean;
  bookedSeats: number;
  totalSeats: number;
  minSeats: number;
  maxSeats: number;
  updateField: <K extends keyof ModifyRideFormState>(
    key: K,
    value: ModifyRideFormState[K],
  ) => void;
  togglePreference: (id: ModifyRidePreferenceId) => void;
  selectVehicle: (id: string) => void;
  openDatePicker: () => void;
  closeDatePicker: () => void;
  openTimePicker: () => void;
  closeTimePicker: () => void;
  selectDate: (date: Date) => void;
  selectTime: (date: Date) => void;
  addVehicle: () => void;
  updateRide: () => void;
  openRouteSelection: () => void;
  routeChangeRequiresSelection: boolean;
  didRouteChange: boolean;
  reload: () => void;
  goBack: () => void;
}

const formatDisplayDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDisplayTime = (date: Date) => {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${minutes} ${period}`;
};

const parseDisplayDate = (value: string): Date => {
  const parts = value.split('/');
  if (parts.length === 3) {
    const day = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const year = Number(parts[2]);
    if (Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)) {
      return new Date(year, month, day);
    }
  }
  return new Date();
};

const parseDisplayTime = (value: string, base: Date): Date => {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return base;
  }
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) {
    hours += 12;
  }
  if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  const next = new Date(base);
  next.setHours(hours, minutes, 0, 0);
  return next;
};

export const useModifyRide = (): UseModifyRideResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rideId?: string;
    pickupLabel?: string;
    dropoffLabel?: string;
    dateLabel?: string;
  }>();

  const rideId = getSearchParam(params.rideId);

  const [form, setForm] = useState<ModifyRideFormState>({
    ...DEFAULT_MODIFY_RIDE_FORM,
    rideId,
    origin: '',
    destination: '',
    availableSeats: 1,
    pricePerSeat: '',
    selectedVehicleId: '',
  });
  const [vehicles, setVehicles] = useState<PublishRideVehicleOption[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookedSeats, setBookedSeats] = useState(0);
  const [totalSeats, setTotalSeats] = useState(0);
  const [rideStatus, setRideStatus] = useState('');
  const [isAssuredRide, setIsAssuredRide] = useState(false);
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const appliedRouteSelectionRef = useRef(false);

  const reload = useCallback(async () => {
    if (!rideId) {
      setLoadError(MODIFY_RIDE_SCREEN.missingRideMessage);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const [ride, bookings, vehicleRows] = await Promise.all([
        getRideById(rideId),
        listDriverBookings({ rideId, page: 1, limit: 50 }).catch(() => []),
        listVehicles().catch(() => []),
      ]);

      const nextBooked = resolveBookedSeats(ride, bookings);
      const nextForm = mapRideToModifyForm(ride, {
        ...DEFAULT_MODIFY_RIDE_FORM,
        rideId: ride.id,
      });
      const options = vehicleRows.map(mapVehicleResponseToPublishOption);
      const vehicleStillValid = options.some((item) => item.id === nextForm.selectedVehicleId);

      setForm({
        ...nextForm,
        selectedVehicleId: vehicleStillValid
          ? nextForm.selectedVehicleId
          : options[0]?.id ?? nextForm.selectedVehicleId,
      });
      setVehicles(options);
      setBookedSeats(nextBooked);
      setTotalSeats(ride.totalSeats);
      setRideStatus(String(ride.status ?? ''));
      setIsAssuredRide(String(ride.rideType ?? '').toUpperCase() === 'ASSURED');
      setSeriesId(
        isCommuteSeriesRide(ride) ? String(ride.seriesId ?? '').trim() || null : null,
      );
    } catch (error) {
      setLoadError(mapUpdateRideError(error));
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useFocusEffect(
    useCallback(() => {
      const pending = modifyRideRouteSelectionStore.consumeResult();
      if (pending) {
        appliedRouteSelectionRef.current = true;
        setForm((prev) => ({
          ...prev,
          originLatitude: pending.originCoordinate.latitude,
          originLongitude: pending.originCoordinate.longitude,
          destinationLatitude: pending.destinationCoordinate.latitude,
          destinationLongitude: pending.destinationCoordinate.longitude,
          routeSelection: pending.routeSelection,
        }));
        return;
      }
      if (appliedRouteSelectionRef.current) {
        appliedRouteSelectionRef.current = false;
        return;
      }
      void reload();
    }, [reload]),
  );

  const seatBounds = useMemo(() => computeSeatBounds(bookedSeats), [bookedSeats]);
  const tripDetailsLocked = bookedSeats > 0;
  const canEdit = isRideModifiable(rideStatus) && !isAssuredRide;

  const minimumDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const selectedDate = useMemo(
    () => parseDisplayDate(form.departureDate),
    [form.departureDate],
  );
  const selectedTime = useMemo(
    () => parseDisplayTime(form.departureTime, selectedDate),
    [form.departureTime, selectedDate],
  );

  const updateField = useCallback(
    <K extends keyof ModifyRideFormState>(key: K, value: ModifyRideFormState[K]) => {
      if (!canEdit) {
        return;
      }
      if (tripDetailsLocked && key !== 'availableSeats') {
        return;
      }
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (key === 'origin' || key === 'destination') {
          next.routeSelection = null;
          next.originLatitude = null;
          next.originLongitude = null;
          next.destinationLatitude = null;
          next.destinationLongitude = null;
        }
        return next;
      });
    },
    [canEdit, tripDetailsLocked],
  );

  const togglePreference = useCallback(
    (id: ModifyRidePreferenceId) => {
      if (tripDetailsLocked || !canEdit) {
        return;
      }
      triggerLightHaptic();
      setForm((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [id]: !prev.preferences[id],
        },
      }));
    },
    [canEdit, tripDetailsLocked],
  );

  const selectVehicle = useCallback(
    (id: string) => {
      if (tripDetailsLocked || !canEdit) {
        return;
      }
      triggerLightHaptic();
      setForm((prev) => ({ ...prev, selectedVehicleId: id }));
    },
    [canEdit, tripDetailsLocked],
  );

  const openDatePicker = useCallback(() => {
    if (tripDetailsLocked || !canEdit) {
      return;
    }
    triggerLightHaptic();
    setDatePickerOpen(true);
  }, [canEdit, tripDetailsLocked]);

  const closeDatePicker = useCallback(() => setDatePickerOpen(false), []);

  const openTimePicker = useCallback(() => {
    if (tripDetailsLocked || !canEdit) {
      return;
    }
    triggerLightHaptic();
    setTimePickerOpen(true);
  }, [canEdit, tripDetailsLocked]);

  const closeTimePicker = useCallback(() => setTimePickerOpen(false), []);

  const selectDate = useCallback((date: Date) => {
    setForm((prev) => ({ ...prev, departureDate: formatDisplayDate(date) }));
    setDatePickerOpen(false);
  }, []);

  const selectTime = useCallback((date: Date) => {
    setForm((prev) => ({ ...prev, departureTime: formatDisplayTime(date) }));
    setTimePickerOpen(false);
  }, []);

  const addVehicle = useCallback(() => {
    if (tripDetailsLocked || !canEdit) {
      return;
    }
    triggerLightHaptic();
    router.push({
      pathname: ROUTES.addVehicle,
      params: { returnTo: 'modify-ride' },
    });
  }, [canEdit, router, tripDetailsLocked]);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  const openRouteSelection = useCallback(() => {
    modifyRideRouteSelectionStore.prime({
      rideId: form.rideId || rideId,
      origin: form.origin,
      destination: form.destination,
    });
    router.push(ROUTES.myRidesSelectRoute);
  }, [form.destination, form.origin, form.rideId, rideId, router]);

  const didRouteChange = didModifyRouteChange(form);
  const routeChangeRequiresSelection =
    canEdit && !tripDetailsLocked && didRouteChange && !form.routeSelection;

  const updateRide = useCallback(() => {
    if (saving) {
      return;
    }

    if (isAssuredRide) {
      triggerSuccessHaptic();
      showAppAlert(
        MODIFY_RIDE_SCREEN.updateSuccessTitle,
        MODIFY_RIDE_SCREEN.updateSuccessMessage,
      );
      router.replace(ROUTES.myRides);
      return;
    }

    if (!canEdit) {
      showAppAlert(
        MODIFY_RIDE_SCREEN.updateErrorTitle,
        MODIFY_RIDE_SCREEN.notEditableMessage,
      );
      return;
    }

    if (didModifyRouteChange(form) && !form.routeSelection) {
      showAppAlert('Select a route', ROUTE_SELECTION_USER_MESSAGES.required);
      openRouteSelection();
      return;
    }

    const submitUpdate = (seriesScope?: ApiSeriesScope) => {
      const mapped = buildUpdateRidePayload({
        form,
        hasBookings: tripDetailsLocked,
        bookedSeats,
        seriesScope,
      });
      if (!mapped.ok) {
        if (mapped.message.includes('driving route')) {
          showAppAlert('Select a route', mapped.message);
          openRouteSelection();
          return;
        }
        showAppAlert(MODIFY_RIDE_SCREEN.updateErrorTitle, mapped.message);
        return;
      }

      setSaving(true);
      void updateRideById(rideId, mapped.payload)
        .then(() => {
          triggerSuccessHaptic();
          driverRidesRefreshStore.bump();
          showAppAlert(
            MODIFY_RIDE_SCREEN.updateSuccessTitle,
            MODIFY_RIDE_SCREEN.updateSuccessMessage,
          );
          router.replace(ROUTES.myRides);
        })
        .catch(async (error) => {
          if (isRouteSelectionTokenError(error)) {
            setForm((prev) => ({ ...prev, routeSelection: null }));
            showAppAlert('Select a route', mapUpdateRideError(error));
            openRouteSelection();
            return;
          }
          showAppAlert(MODIFY_RIDE_SCREEN.updateErrorTitle, mapUpdateRideError(error));
          await reload();
        })
        .finally(() => {
          setSaving(false);
        });
    };

    if (seriesId) {
      showAppAlert(
        COMMUTE_SERIES_COPY.editScopeTitle,
        COMMUTE_SERIES_COPY.editScopeMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: COMMUTE_SERIES_COPY.editThisOnly,
            onPress: () => submitUpdate('THIS_OCCURRENCE'),
          },
          {
            text: COMMUTE_SERIES_COPY.editThisAndFuture,
            onPress: () => submitUpdate('THIS_AND_FUTURE'),
          },
        ],
      );
      return;
    }

    submitUpdate();
  }, [
    bookedSeats,
    canEdit,
    form,
    isAssuredRide,
    openRouteSelection,
    reload,
    rideId,
    router,
    saving,
    seriesId,
    tripDetailsLocked,
  ]);

  return {
    form,
    preferenceOptions: MODIFY_RIDE_PREFERENCE_OPTIONS,
    vehicles,
    datePickerOpen,
    timePickerOpen,
    selectedDate,
    selectedTime,
    minimumDate,
    loading,
    saving,
    loadError,
    tripDetailsLocked,
    canEdit,
    isAssuredRide,
    bookedSeats,
    totalSeats,
    minSeats: seatBounds.min,
    maxSeats: seatBounds.max,
    updateField,
    togglePreference,
    selectVehicle,
    openDatePicker,
    closeDatePicker,
    openTimePicker,
    closeTimePicker,
    selectDate,
    selectTime,
    addVehicle,
    updateRide,
    openRouteSelection,
    routeChangeRequiresSelection,
    didRouteChange,
    reload,
    goBack,
  };
};

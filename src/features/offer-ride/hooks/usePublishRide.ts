import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import type { MissingLocationKind } from '@/shared/components';
import { getSearchParam, formatSlashDate, parseSlashDate, startOfDay, showAppAlert } from '@/shared/utils';
import { getRouteTooCloseMessage } from '@/features/ride-search/utils';
import { formatTimeLabel, getSelectLocationPath, parseTimeLabel, PUBLISH_SEAT_LIMITS } from '../constants';
import { publishRideDraft } from '../store';
import type { LocationFieldType, OutstationRideTypeId, PublishRideDraft } from '../types';

const isRideType = (value: string): value is OutstationRideTypeId =>
  value === 'regular' || value === 'assured';

export const usePublishRide = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideType?: string }>();
  const rideTypeParam = getSearchParam(params.rideType);
  const minimumDate = useMemo(() => startOfDay(new Date()), []);

  const [draft, setDraft] = useState<PublishRideDraft>(() => publishRideDraft.get());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [missingLocationKind, setMissingLocationKind] = useState<MissingLocationKind | null>(
    null,
  );

  useEffect(() => {
    if (isRideType(rideTypeParam)) {
      publishRideDraft.reset(rideTypeParam);
      setDraft(publishRideDraft.get());
    }
    return publishRideDraft.subscribe(setDraft);
  }, [rideTypeParam]);

  const updateDraft = useCallback((partial: Partial<PublishRideDraft>) => {
    publishRideDraft.update(partial);
  }, []);

  const openLocationPicker = useCallback(
    (field: LocationFieldType) => {
      router.push(getSelectLocationPath(field));
    },
    [router],
  );

  const openDatePicker = useCallback(() => {
    setDatePickerOpen(true);
  }, []);

  const closeDatePicker = useCallback(() => {
    setDatePickerOpen(false);
  }, []);

  const selectDate = useCallback(
    (date: Date) => {
      updateDraft({ departureDate: formatSlashDate(date) });
    },
    [updateDraft],
  );

  const openTimePicker = useCallback(() => {
    setTimePickerOpen(true);
  }, []);

  const closeTimePicker = useCallback(() => {
    setTimePickerOpen(false);
  }, []);

  const selectTime = useCallback(
    (date: Date) => {
      updateDraft({ departureTime: formatTimeLabel(date) });
      setTimePickerOpen(false);
    },
    [updateDraft],
  );

  const submit = useCallback(() => {
    const hasOrigin = draft.origin.trim().length > 0;
    const hasDestination = draft.destination.trim().length > 0;

    if (!hasOrigin && !hasDestination) {
      setMissingLocationKind('both');
      return;
    }
    if (!hasOrigin) {
      setMissingLocationKind('origin');
      return;
    }
    if (!hasDestination) {
      setMissingLocationKind('destination');
      return;
    }
    if (!draft.departureDate || !draft.departureTime) {
      showAppAlert('Missing schedule', 'Please select departure date and time.');
      return;
    }

    if (
      !Number.isInteger(draft.availableSeats) ||
      draft.availableSeats < PUBLISH_SEAT_LIMITS.min ||
      draft.availableSeats > PUBLISH_SEAT_LIMITS.max
    ) {
      showAppAlert(
        'Check seats',
        `Available seats must be between ${PUBLISH_SEAT_LIMITS.min} and ${PUBLISH_SEAT_LIMITS.max}.`,
      );
      return;
    }

    const price = Number(draft.pricePerSeat);
    if (!Number.isFinite(price) || price < 0) {
      showAppAlert('Check price', 'Enter a valid price per seat.');
      return;
    }

    const originLocation = draft.originLocation;
    const destinationLocation = draft.destinationLocation;
    if (
      originLocation &&
      destinationLocation &&
      Number.isFinite(originLocation.latitude) &&
      Number.isFinite(originLocation.longitude) &&
      Number.isFinite(destinationLocation.latitude) &&
      Number.isFinite(destinationLocation.longitude)
    ) {
      const tooCloseMessage = getRouteTooCloseMessage(
        {
          latitude: originLocation.latitude!,
          longitude: originLocation.longitude!,
        },
        {
          latitude: destinationLocation.latitude!,
          longitude: destinationLocation.longitude!,
        },
        'outstation',
      );
      if (tooCloseMessage) {
        showAppAlert('Locations too close', tooCloseMessage);
        return;
      }
    }

    router.push(ROUTES.offerRidePreferences);
  }, [draft, router]);

  const closeMissingLocation = useCallback(() => {
    setMissingLocationKind(null);
  }, []);

  const resolveMissingLocation = useCallback(() => {
    const kind = missingLocationKind;
    setMissingLocationKind(null);
    if (kind === 'destination') {
      openLocationPicker('destination');
      return;
    }
    openLocationPicker('origin');
  }, [missingLocationKind, openLocationPicker]);

  const isValid =
    draft.origin.trim().length > 0 &&
    draft.destination.trim().length > 0 &&
    draft.departureDate.length > 0 &&
    draft.departureTime.length > 0 &&
    Number(draft.pricePerSeat) > 0;

  const selectedDate = parseSlashDate(draft.departureDate) ?? minimumDate;
  const selectedTime = useMemo(
    () => parseTimeLabel(draft.departureTime),
    [draft.departureTime],
  );

  return {
    draft,
    updateDraft,
    openLocationPicker,
    openDatePicker,
    closeDatePicker,
    datePickerOpen,
    selectedDate,
    minimumDate,
    selectDate,
    openTimePicker,
    closeTimePicker,
    timePickerOpen,
    selectedTime,
    selectTime,
    submit,
    isValid,
    missingLocationKind,
    closeMissingLocation,
    resolveMissingLocation,
  };
};

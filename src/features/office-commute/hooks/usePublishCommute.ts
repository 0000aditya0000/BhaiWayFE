import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { showAppAlert } from '@/store';

import { ROUTES } from '@/config';
import type { MissingLocationKind } from '@/shared/components';
import { ROUTE_SELECTION_USER_MESSAGES, toRouteEndpoints } from '@/features/offer-ride/utils/routeSelection';
import { getRouteTooCloseMessage } from '@/features/ride-search/utils';
import {
  formatSlashDate,
  parseSlashDate,
  startOfDay,
} from '@/shared/utils';
import { COMMUTE_SERIES_COPY } from '../constants/commute-series.constants';
import {
  formatEstimatedEarnings,
  formatTimeLabel,
  getSelectCommuteLocationPath,
  parseTimeLabel,
  PUBLISH_COMMUTE_SCREEN,
  WEEKDAY_OPTIONS,
} from '../constants';
import { publishCommuteDraft } from '../store';
import type { CommuteLocationField, PublishCommuteDraft, WeekdayId } from '../types';
import {
  isReturnTimeAfterOutbound,
  toggleRecurringDay,
  weekdayIdFromSlashDate,
} from '../utils/commuteSeries.utils';

export interface UsePublishCommuteResult {
  draft: PublishCommuteDraft;
  weekdays: typeof WEEKDAY_OPTIONS;
  estimatedEarnings: string;
  datePickerOpen: boolean;
  timePickerOpen: boolean;
  returnTimePickerOpen: boolean;
  selectedDate: Date;
  selectedTime: Date;
  selectedReturnTime: Date;
  minimumDate: Date;
  updateDraft: (patch: Partial<PublishCommuteDraft>) => void;
  incrementSeats: () => void;
  decrementSeats: () => void;
  toggleDay: (id: WeekdayId) => void;
  toggleReturningBack: () => void;
  openDatePicker: () => void;
  closeDatePicker: () => void;
  selectDate: (date: Date) => void;
  openTimePicker: () => void;
  closeTimePicker: () => void;
  selectTime: (date: Date) => void;
  openReturnTimePicker: () => void;
  closeReturnTimePicker: () => void;
  selectReturnTime: (date: Date) => void;
  openLocationPicker: (field: CommuteLocationField) => void;
  submit: () => void;
  goBack: () => void;
  openNotifications: () => void;
  missingLocationKind: MissingLocationKind | null;
  closeMissingLocation: () => void;
  resolveMissingLocation: () => void;
}

export const usePublishCommute = (): UsePublishCommuteResult => {
  const router = useRouter();
  const [draft, setDraft] = useState<PublishCommuteDraft>(() => publishCommuteDraft.get());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [returnTimePickerOpen, setReturnTimePickerOpen] = useState(false);
  const [missingLocationKind, setMissingLocationKind] = useState<MissingLocationKind | null>(
    null,
  );

  useEffect(() => publishCommuteDraft.subscribe(setDraft), []);

  const minimumDate = useMemo(() => startOfDay(new Date()), []);

  const updateDraft = useCallback((patch: Partial<PublishCommuteDraft>) => {
    publishCommuteDraft.update(patch);
  }, []);

  const incrementSeats = useCallback(() => {
    const current = publishCommuteDraft.get();
    publishCommuteDraft.update({
      seats: Math.min(PUBLISH_COMMUTE_SCREEN.maxSeats, current.seats + 1),
    });
  }, []);

  const decrementSeats = useCallback(() => {
    const current = publishCommuteDraft.get();
    publishCommuteDraft.update({
      seats: Math.max(PUBLISH_COMMUTE_SCREEN.minSeats, current.seats - 1),
    });
  }, []);

  const toggleDay = useCallback((id: WeekdayId) => {
    const current = publishCommuteDraft.get();
    const publishWeekday = weekdayIdFromSlashDate(current.departureDate);
    const result = toggleRecurringDay(current.recurringDays, id, publishWeekday);
    if (!result.ok) {
      showAppAlert(COMMUTE_SERIES_COPY.publishWeekdayTitle, result.message);
      return;
    }
    publishCommuteDraft.update({ recurringDays: result.next });
    if (result.explainedPublishWeekday) {
      showAppAlert(
        COMMUTE_SERIES_COPY.publishWeekdayTitle,
        COMMUTE_SERIES_COPY.publishWeekdayMessage,
      );
    }
  }, []);

  const toggleReturningBack = useCallback(() => {
    const current = publishCommuteDraft.get();
    publishCommuteDraft.update({ returningBack: !current.returningBack });
  }, []);

  const openDatePicker = useCallback(() => setDatePickerOpen(true), []);
  const closeDatePicker = useCallback(() => setDatePickerOpen(false), []);

  const selectDate = useCallback((date: Date) => {
    const current = publishCommuteDraft.get();
    const nextDate = formatSlashDate(date);
    const publishWeekday = weekdayIdFromSlashDate(nextDate);
    if (
      publishWeekday &&
      current.recurringDays.length > 0 &&
      !current.recurringDays.includes(publishWeekday)
    ) {
      publishCommuteDraft.update({
        departureDate: nextDate,
        recurringDays: [...current.recurringDays, publishWeekday],
      });
      showAppAlert(
        COMMUTE_SERIES_COPY.publishWeekdayTitle,
        COMMUTE_SERIES_COPY.publishWeekdayMessage,
      );
    } else {
      publishCommuteDraft.update({ departureDate: nextDate });
    }
    setDatePickerOpen(false);
  }, []);

  const openTimePicker = useCallback(() => setTimePickerOpen(true), []);
  const closeTimePicker = useCallback(() => setTimePickerOpen(false), []);

  const selectTime = useCallback((date: Date) => {
    publishCommuteDraft.update({ departureTime: formatTimeLabel(date) });
    setTimePickerOpen(false);
  }, []);

  const openReturnTimePicker = useCallback(() => setReturnTimePickerOpen(true), []);
  const closeReturnTimePicker = useCallback(() => setReturnTimePickerOpen(false), []);

  const selectReturnTime = useCallback((date: Date) => {
    publishCommuteDraft.update({ returnDepartureTime: formatTimeLabel(date) });
    setReturnTimePickerOpen(false);
  }, []);

  const openLocationPicker = useCallback(
    (field: CommuteLocationField) => {
      router.push(getSelectCommuteLocationPath(field));
    },
    [router],
  );

  const estimatedEarnings = useMemo(
    () => formatEstimatedEarnings(draft.pricePerSeat, draft.seats),
    [draft.pricePerSeat, draft.seats],
  );

  const selectedDate = useMemo(
    () => parseSlashDate(draft.departureDate) ?? minimumDate,
    [draft.departureDate, minimumDate],
  );

  const selectedTime = useMemo(
    () => parseTimeLabel(draft.departureTime),
    [draft.departureTime],
  );

  const selectedReturnTime = useMemo(
    () =>
      parseTimeLabel(
        draft.returnDepartureTime.trim() ? draft.returnDepartureTime : '18:00',
      ),
    [draft.returnDepartureTime],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.officeCommute);
  }, [router]);

  const openNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const submit = useCallback(() => {
    const hasStart = draft.startLocation.trim().length > 0;
    const hasOffice = draft.officeLocation.trim().length > 0;

    if (!hasStart && !hasOffice) {
      setMissingLocationKind('both');
      return;
    }
    if (!hasStart) {
      setMissingLocationKind('origin');
      return;
    }
    if (!hasOffice) {
      setMissingLocationKind('destination');
      return;
    }
    if (!draft.departureDate.trim()) {
      showAppAlert('Missing schedule', 'Please select a departure date.');
      return;
    }
    if (!draft.departureTime) {
      showAppAlert('Missing schedule', 'Please select a departure time.');
      return;
    }
    if (draft.returningBack) {
      if (!draft.returnDepartureTime.trim()) {
        showAppAlert(
          COMMUTE_SERIES_COPY.missingReturnTimeTitle,
          COMMUTE_SERIES_COPY.missingReturnTimeMessage,
        );
        return;
      }
      if (!isReturnTimeAfterOutbound(draft.departureTime, draft.returnDepartureTime)) {
        showAppAlert(
          COMMUTE_SERIES_COPY.returnTimeOrderTitle,
          COMMUTE_SERIES_COPY.returnTimeOrderMessage,
        );
        return;
      }
    }
    if (!(Number(draft.pricePerSeat) > 0)) {
      showAppAlert('Missing price', 'Please enter a price per seat.');
      return;
    }

    const start = draft.startLocationDetail;
    const office = draft.officeLocationDetail;
    const endpoints = toRouteEndpoints(
      start?.latitude,
      start?.longitude,
      office?.latitude,
      office?.longitude,
    );
    if (!endpoints) {
      showAppAlert('Map locations required', ROUTE_SELECTION_USER_MESSAGES.missingCoords);
      return;
    }

    const tooCloseMessage = getRouteTooCloseMessage(start!, office!, 'office');
    if (tooCloseMessage) {
      showAppAlert('Locations too close', tooCloseMessage);
      return;
    }

    router.push(ROUTES.officeCommuteSelectRoute);
  }, [draft, router]);

  const closeMissingLocation = useCallback(() => {
    setMissingLocationKind(null);
  }, []);

  const resolveMissingLocation = useCallback(() => {
    const kind = missingLocationKind;
    setMissingLocationKind(null);
    if (kind === 'destination') {
      openLocationPicker('office');
      return;
    }
    openLocationPicker('start');
  }, [missingLocationKind, openLocationPicker]);

  return {
    draft,
    weekdays: WEEKDAY_OPTIONS,
    estimatedEarnings,
    datePickerOpen,
    timePickerOpen,
    returnTimePickerOpen,
    selectedDate,
    selectedTime,
    selectedReturnTime,
    minimumDate,
    updateDraft,
    incrementSeats,
    decrementSeats,
    toggleDay,
    toggleReturningBack,
    openDatePicker,
    closeDatePicker,
    selectDate,
    openTimePicker,
    closeTimePicker,
    selectTime,
    openReturnTimePicker,
    closeReturnTimePicker,
    selectReturnTime,
    openLocationPicker,
    submit,
    goBack,
    openNotifications,
    missingLocationKind,
    closeMissingLocation,
    resolveMissingLocation,
  };
};

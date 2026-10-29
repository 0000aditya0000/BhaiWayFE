import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { styles } from './NativeDatePicker.styles';
import type { NativeDatePickerProps } from './NativeDatePicker.types';
import { AppText as Text } from '../AppText';
import {
  addMinutesTo12HourParts,
  addMonths,
  apply12HourParts,
  buildMonthCells,
  CALENDAR_WEEKDAY_LABELS,
  formatMonthTitle,
  formatTimePreview,
  isDayDisabled,
  isSameCalendarDay,
  startOfMonth,
  to12HourParts,
} from './calendar';

const MINUTE_ARROW_STEP = 15;

export const NativeDatePicker = ({
  visible,
  value,
  minimumDate,
  maximumDate,
  onChange,
  onClose,
  title = 'Select date',
  mode = 'date',
}: NativeDatePickerProps) => {
  const insets = useSafeAreaInsets();
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value));
  const [draftDate, setDraftDate] = useState(value);
  const [hour, setHour] = useState(() => to12HourParts(value).hour);
  const [minute, setMinute] = useState(() => to12HourParts(value).minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(() => to12HourParts(value).period);
  const timeRef = useRef({ hour, minute, period });
  timeRef.current = { hour, minute, period };

  useEffect(() => {
    if (!visible) {
      return;
    }
    setViewMonth(startOfMonth(value));
    setDraftDate(value);
    const parts = to12HourParts(value);
    setHour(parts.hour);
    setMinute(parts.minute);
    setPeriod(parts.period);
  }, [value, visible]);

  const cells = useMemo(() => buildMonthCells(viewMonth), [viewMonth]);
  const today = useMemo(() => new Date(), []);

  const handleConfirm = useCallback(() => {
    if (mode === 'time') {
      onChange(apply12HourParts(value, hour, minute, period));
    } else {
      onChange(draftDate);
    }
    onClose();
  }, [draftDate, hour, minute, mode, onChange, onClose, period, value]);

  const bumpHour = useCallback((delta: number) => {
    setHour((current) => {
      const next = current + delta;
      if (next < 1) {
        return 12;
      }
      if (next > 12) {
        return 1;
      }
      return next;
    });
  }, []);

  const bumpMinute = useCallback((delta: number) => {
    const next = addMinutesTo12HourParts(
      timeRef.current.hour,
      timeRef.current.minute,
      timeRef.current.period,
      delta,
    );
    timeRef.current = next;
    setHour(next.hour);
    setMinute(next.minute);
    setPeriod(next.period);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Close picker">
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name={mode === 'time' ? 'time' : 'calendar'}
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>

          {mode === 'date' ? (
            <>
              <View style={styles.monthNav}>
                <Pressable
                  style={styles.navButton}
                  onPress={() => setViewMonth((current) => addMonths(current, -1))}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                >
                  <Ionicons name="chevron-back" size={18} color={colors.primary} />
                </Pressable>
                <Text style={styles.monthTitle}>{formatMonthTitle(viewMonth)}</Text>
                <Pressable
                  style={styles.navButton}
                  onPress={() => setViewMonth((current) => addMonths(current, 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </Pressable>
              </View>

              <View style={styles.weekdayRow}>
                {CALENDAR_WEEKDAY_LABELS.map((label) => (
                  <View key={label} style={styles.weekdayCell}>
                    <Text style={styles.weekdayLabel}>{label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.grid}>
                {cells.map((cell) => {
                  const selected = isSameCalendarDay(cell.date, draftDate);
                  const todayMark = isSameCalendarDay(cell.date, today);
                  const disabled = isDayDisabled(cell.date, minimumDate, maximumDate);
                  return (
                    <View
                      key={cell.date.toISOString()}
                      style={styles.dayCell}
                    >
                      <Pressable
                        style={[
                          styles.dayButton,
                          todayMark && !selected && styles.dayToday,
                          selected && styles.daySelected,
                        ]}
                        onPress={() => {
                          if (disabled) {
                            return;
                          }
                          setDraftDate(cell.date);
                        }}
                        disabled={disabled}
                        accessibilityRole="button"
                        accessibilityState={{ selected, disabled }}
                        accessibilityLabel={cell.date.toDateString()}
                      >
                        <Text
                          style={[
                            styles.dayLabel,
                            (!cell.inMonth || disabled) && styles.dayLabelMuted,
                            selected && styles.dayLabelSelected,
                          ]}
                        >
                          {cell.date.getDate()}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <View style={styles.timeHero}>
                <Text style={styles.timePreview}>{formatTimePreview(hour, minute, period)}</Text>
                <View style={styles.periodRow}>
                  {(['AM', 'PM'] as const).map((item) => {
                    const selected = period === item;
                    return (
                      <Pressable
                        key={item}
                        style={[styles.periodChip, selected && styles.periodChipSelected]}
                        onPress={() => setPeriod(item)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={item}
                      >
                        <Text style={[styles.periodLabel, selected && styles.periodLabelSelected]}>
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.stepperRow}>
                <View style={styles.stepperCard}>
                  <Text style={styles.stepperCaption}>Hour</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => bumpHour(1)}
                    accessibilityRole="button"
                    accessibilityLabel="Increase hour"
                  >
                    <Ionicons name="chevron-up" size={20} color={colors.primary} />
                  </Pressable>
                  <Text style={styles.stepperValue}>{String(hour).padStart(2, '0')}</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => bumpHour(-1)}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease hour"
                  >
                    <Ionicons name="chevron-down" size={20} color={colors.primary} />
                  </Pressable>
                </View>
                <View style={styles.stepperCard}>
                  <Text style={styles.stepperCaption}>Minute</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => bumpMinute(MINUTE_ARROW_STEP)}
                    accessibilityRole="button"
                    accessibilityLabel="Increase minutes by 15"
                  >
                    <Ionicons name="chevron-up" size={20} color={colors.primary} />
                  </Pressable>
                  <Text style={styles.stepperValue}>{String(minute).padStart(2, '0')}</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => bumpMinute(-MINUTE_ARROW_STEP)}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease minutes by 15"
                  >
                    <Ionicons name="chevron-down" size={20} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            </>
          )}

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.confirmLabel}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export interface NativeDatePickerProps {
  visible: boolean;
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange: (date: Date) => void;
  /** Multi-select confirm. When set with `selectionMode="multiple"`, `onChange` is not called. */
  onChangeDates?: (dates: Date[]) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  mode?: 'date' | 'time';
  /** Office commute publish uses `"multiple"`. All other calendars stay single-select. */
  selectionMode?: 'single' | 'multiple';
  selectedDates?: Date[];
}

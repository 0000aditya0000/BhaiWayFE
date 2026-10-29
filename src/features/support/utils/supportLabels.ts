import {
  SUPPORT_CATEGORY_LABEL,
  SUPPORT_STATUS_LABEL,
  SUPPORT_SUBCATEGORY_LABEL,
} from '../constants/support.constants';
import type { SupportTicketCategory, SupportTicketStatus } from '../api/support.types';

const humanizeEnum = (value: string): string =>
  value
    .trim()
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

export const formatSupportCategoryLabel = (category: string): string => {
  const key = category.trim().toUpperCase() as SupportTicketCategory;
  return SUPPORT_CATEGORY_LABEL[key] ?? (humanizeEnum(category) || 'Support');
};

export const formatSupportSubcategoryLabel = (subcategory: string): string => {
  const key = subcategory.trim().toUpperCase();
  return SUPPORT_SUBCATEGORY_LABEL[key] ?? (humanizeEnum(subcategory) || subcategory);
};

export const formatSupportStatusLabel = (status: string): string => {
  const key = status.trim().toUpperCase() as SupportTicketStatus;
  return SUPPORT_STATUS_LABEL[key] ?? (humanizeEnum(status) || status);
};

export const formatSupportDateTime = (value?: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatSupportRideLabel = (input: {
  source?: string | null;
  destination?: string | null;
  departureDate?: string | null;
  departureTime?: string | null;
}): string => {
  const from = (input.source ?? '').trim() || 'Unknown';
  const to = (input.destination ?? '').trim() || 'Unknown';
  const date = (input.departureDate ?? '').trim();
  const time = (input.departureTime ?? '').trim();
  const when = [date, time].filter(Boolean).join(' · ');
  return when ? `${from} → ${to} · ${when}` : `${from} → ${to}`;
};

export const previewDescription = (value: string, max = 96): string => {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
};

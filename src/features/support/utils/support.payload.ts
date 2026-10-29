import type {
  CreateSupportTicketBody,
  SupportTicketCategory,
} from '../api/support.types';
import {
  SUPPORT_ATTACHMENT_MAX,
  SUPPORT_CATEGORY_SUBCATEGORIES,
  SUPPORT_DESCRIPTION_MAX,
} from '../constants/support.constants';
import { isSupportUuid } from './support.mapper';

export const generateSupportTicketIdempotencyKey = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `support-ticket-${time}-${random}`;
};

export const generateSupportCommentIdempotencyKey = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `support-comment-${time}-${random}`;
};

export const isHttpsImageUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed.toLowerCase().startsWith('https://')) {
    return false;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') {
      return false;
    }
    const path = url.pathname.toLowerCase();
    return (
      path.endsWith('.jpg') ||
      path.endsWith('.jpeg') ||
      path.endsWith('.png') ||
      path.endsWith('.webp') ||
      // Cloudinary delivery URLs often omit extension; still HTTPS and usable.
      path.includes('/image/upload/')
    );
  } catch {
    return false;
  }
};

export type CreateTicketFormInput = {
  category: SupportTicketCategory;
  subcategory: string;
  description: string;
  relatedRideId?: string | null;
  relatedWalletTransactionId?: string | null;
  attachmentUrls?: string[];
  idempotencyKey?: string;
};

export type CreateTicketValidationResult =
  | { ok: true; body: CreateSupportTicketBody }
  | { ok: false; field: 'category' | 'subcategory' | 'description' | 'relatedRideId' | 'attachments'; message: string };

export const validateAndBuildCreateTicketBody = (
  input: CreateTicketFormInput,
): CreateTicketValidationResult => {
  const category = input.category;
  const allowed = SUPPORT_CATEGORY_SUBCATEGORIES[category];
  const subcategory = input.subcategory.trim().toUpperCase();
  if (!subcategory || !allowed.includes(subcategory)) {
    return {
      ok: false,
      field: 'subcategory',
      message: 'Select an issue type.',
    };
  }

  const description = input.description.trim();
  if (!description) {
    return {
      ok: false,
      field: 'description',
      message: 'Please describe the issue.',
    };
  }
  if (description.length > SUPPORT_DESCRIPTION_MAX) {
    return {
      ok: false,
      field: 'description',
      message: `Description must be ${SUPPORT_DESCRIPTION_MAX} characters or fewer.`,
    };
  }

  if (category === 'BOOKINGS_AND_RIDES') {
    const rideId = (input.relatedRideId ?? '').trim();
    if (!isSupportUuid(rideId)) {
      return {
        ok: false,
        field: 'relatedRideId',
        message: 'Select an active or past ride to continue.',
      };
    }
  }

  const urls = (input.attachmentUrls ?? [])
    .map((url) => url.trim())
    .filter(Boolean);
  if (urls.length > SUPPORT_ATTACHMENT_MAX) {
    return {
      ok: false,
      field: 'attachments',
      message: `You can attach up to ${SUPPORT_ATTACHMENT_MAX} screenshots.`,
    };
  }
  for (const url of urls) {
    if (!isHttpsImageUrl(url)) {
      return {
        ok: false,
        field: 'attachments',
        message: 'Each screenshot must be a valid HTTPS image URL.',
      };
    }
  }

  const body: CreateSupportTicketBody = {
    category,
    subcategory,
    description,
  };

  if (category === 'BOOKINGS_AND_RIDES') {
    body.relatedRideId = (input.relatedRideId ?? '').trim();
  }

  if (category === 'PAYMENTS_AND_WALLETS') {
    const txnId = (input.relatedWalletTransactionId ?? '').trim();
    if (txnId) {
      if (!isSupportUuid(txnId)) {
        return {
          ok: false,
          field: 'category',
          message: 'Invalid wallet transaction reference.',
        };
      }
      body.relatedWalletTransactionId = txnId;
    }
  }

  if (urls.length > 0) {
    body.attachmentUrls = urls;
  }

  const idempotencyKey = (input.idempotencyKey ?? '').trim();
  if (idempotencyKey) {
    body.idempotencyKey = idempotencyKey.slice(0, 255);
  }

  return { ok: true, body };
};

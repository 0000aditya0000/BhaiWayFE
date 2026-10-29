import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { saveIssueReportUrl } from '@/features/media/api';
import type { ApiError } from '@/network';
import { resourceCache } from '@/network/resourceCache';
import { uploadFile } from '@/services/cloudinary';
import type { UploadedDocument } from '@/shared/components';
import {
  getErrorMessage,
  logger,
  showAppAlert,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils';
import { showUploadFeedback } from '@/shared/utils/feedback';
import { CloudinaryUploadError } from '@/types/cloudinary';
import { compressImage } from '@/utils/imageCompression';

import { createSupportTicket } from '../api/support.api';
import type { SupportTicketCategory } from '../api/support.types';
import {
  CREATE_SUPPORT_TICKET_SCREEN,
  SUPPORT_ATTACHMENT_MAX,
  SUPPORT_CATEGORY_SUBCATEGORIES,
} from '../constants/support.constants';
import {
  generateSupportTicketIdempotencyKey,
  validateAndBuildCreateTicketBody,
} from '../utils/support.payload';

export interface SupportAttachmentDraft {
  id: string;
  localUri: string;
  secureUrl?: string;
  uploading: boolean;
  error?: string;
}

export interface UseCreateSupportTicketResult {
  category: SupportTicketCategory;
  setCategory: (category: SupportTicketCategory) => void;
  subcategory: string;
  setSubcategory: (value: string) => void;
  subcategories: readonly string[];
  description: string;
  setDescription: (value: string) => void;
  relatedRideId: string | null;
  setRelatedRideId: (rideId: string | null) => void;
  attachments: SupportAttachmentDraft[];
  uploadSheetVisible: boolean;
  openUploadSheet: () => void;
  closeUploadSheet: () => void;
  applyUploadedDocument: (document: UploadedDocument) => Promise<void>;
  removeAttachment: (id: string) => void;
  fieldError: string | null;
  submitting: boolean;
  canSubmit: boolean;
  anyUploading: boolean;
  submit: () => Promise<void>;
  goBack: () => void;
}

const isFolderRestrictionError = (error: unknown): boolean => {
  if (!(error instanceof CloudinaryUploadError)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('folder') ||
    message.includes('preset') ||
    message.includes('not allowed')
  );
};

const mapCreateError = (err: unknown): string => {
  const apiErr = err as ApiError | undefined;
  const code = apiErr?.code;
  if (code === 'SUPPORT_RIDE_REQUIRED') {
    return CREATE_SUPPORT_TICKET_SCREEN.rideRequired;
  }
  if (code === 'SUPPORT_RIDE_INELIGIBLE' || code === 'SUPPORT_RIDE_FORBIDDEN') {
    return 'That ride isn’t eligible for a support ticket. Pick another ride.';
  }
  if (code === 'SUPPORT_ATTACHMENT_LIMIT' || code === 'SUPPORT_ATTACHMENT_INVALID') {
    return CREATE_SUPPORT_TICKET_SCREEN.uploadFailed;
  }
  if (code === 'SUPPORT_INVALID_CATEGORY') {
    return CREATE_SUPPORT_TICKET_SCREEN.subcategoryRequired;
  }
  if (apiErr?.status === 401) {
    return 'Your session expired. Please sign in again.';
  }
  return getErrorMessage(err);
};

export const useCreateSupportTicket = (
  initialCategory: SupportTicketCategory = 'BOOKINGS_AND_RIDES',
): UseCreateSupportTicketResult => {
  const router = useRouter();
  const [category, setCategoryState] = useState<SupportTicketCategory>(initialCategory);
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [relatedRideId, setRelatedRideId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<SupportAttachmentDraft[]>([]);
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef(generateSupportTicketIdempotencyKey());
  const submittingRef = useRef(false);
  const uploadGenerationRef = useRef(0);

  const subcategories = useMemo(
    () => SUPPORT_CATEGORY_SUBCATEGORIES[category],
    [category],
  );

  const anyUploading = attachments.some((item) => item.uploading);

  const setCategory = useCallback((next: SupportTicketCategory) => {
    setCategoryState(next);
    setSubcategory('');
    setRelatedRideId(null);
    setFieldError(null);
  }, []);

  const openUploadSheet = useCallback(() => {
    if (attachments.length >= SUPPORT_ATTACHMENT_MAX || submitting || anyUploading) {
      if (attachments.length >= SUPPORT_ATTACHMENT_MAX) {
        setFieldError(CREATE_SUPPORT_TICKET_SCREEN.maxAttachments);
      }
      return;
    }
    triggerLightHaptic();
    setUploadSheetVisible(true);
  }, [anyUploading, attachments.length, submitting]);

  const closeUploadSheet = useCallback(() => {
    setUploadSheetVisible(false);
  }, []);

  /**
   * Same Cloudinary pipeline as profile photo / report-issue:
   * local pick → compress → uploadFile → persist media URL → use secureUrl in API body.
   */
  const applyUploadedDocument = useCallback(async (document: UploadedDocument) => {
    if (attachments.length >= SUPPORT_ATTACHMENT_MAX) {
      setFieldError(CREATE_SUPPORT_TICKET_SCREEN.maxAttachments);
      setUploadSheetVisible(false);
      return;
    }

    const generation = ++uploadGenerationRef.current;
    const stamp = Date.now();
    const attachmentId = `att-${stamp}`;
    const fileName = document.fileName?.trim() || `support_ticket_${stamp}.jpg`;
    const mimeType = document.mimeType?.trim() || 'image/jpeg';

    setUploadSheetVisible(false);
    setAttachments((prev) => [
      ...prev,
      {
        id: attachmentId,
        localUri: document.uri,
        uploading: true,
      },
    ]);
    setFieldError(null);

    try {
      const compressed = await compressImage(document.uri, {
        maxDimension: 1600,
        quality: 0.75,
        squareCrop: false,
      });

      if (generation !== uploadGenerationRef.current) {
        return;
      }

      let uploaded;
      try {
        uploaded = await uploadFile({
          uri: compressed.uri,
          kind: 'issueReport',
          fileName,
          mimeType: compressed.mimeType ?? mimeType,
          resourceType: 'image',
        });
      } catch (firstError) {
        if (!isFolderRestrictionError(firstError)) {
          throw firstError;
        }
        logger.warn(
          'Support attachment folder rejected by preset — retrying without folder',
          firstError,
        );
        uploaded = await uploadFile({
          uri: compressed.uri,
          fileName,
          mimeType: compressed.mimeType ?? mimeType,
          resourceType: 'image',
          publicId: `support_ticket_${stamp}`,
          skipFolder: true,
        });
      }

      if (generation !== uploadGenerationRef.current) {
        return;
      }

      // Register asset the same way as other document uploads (optional backend media row).
      const secureUrl = await saveIssueReportUrl(uploaded);

      setAttachments((prev) =>
        prev.map((item) =>
          item.id === attachmentId
            ? {
                id: attachmentId,
                localUri: secureUrl || uploaded.secureUrl,
                secureUrl: secureUrl || uploaded.secureUrl,
                uploading: false,
              }
            : item,
        ),
      );

      logger.info('Support ticket Cloudinary URL ready for ticket API', {
        secureUrl: secureUrl || uploaded.secureUrl,
        publicId: uploaded.publicId,
        folder: uploaded.folder,
      });

      triggerSuccessHaptic();
    } catch (error) {
      if (generation !== uploadGenerationRef.current) {
        return;
      }
      logger.error('Support ticket Cloudinary upload failed', error);
      setAttachments((prev) =>
        prev.map((item) =>
          item.id === attachmentId
            ? {
                ...item,
                uploading: false,
                error: getErrorMessage(error) || CREATE_SUPPORT_TICKET_SCREEN.uploadFailed,
              }
            : item,
        ),
      );
      setFieldError(CREATE_SUPPORT_TICKET_SCREEN.uploadFailed);
      showUploadFeedback(error);
    }
  }, [attachments.length]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const canSubmit = useMemo(() => {
    if (submitting || anyUploading) {
      return false;
    }
    if (attachments.some((item) => item.error || !item.secureUrl)) {
      return false;
    }
    return true;
  }, [anyUploading, attachments, submitting]);

  const submit = useCallback(async () => {
    if (submittingRef.current || !canSubmit) {
      return;
    }
    // Only HTTPS Cloudinary URLs — never local file:// URIs.
    const urls = attachments
      .map((item) => item.secureUrl?.trim() ?? '')
      .filter((url) => url.toLowerCase().startsWith('https://'));
    const validation = validateAndBuildCreateTicketBody({
      category,
      subcategory,
      description,
      relatedRideId,
      attachmentUrls: urls,
      idempotencyKey: idempotencyKeyRef.current,
    });
    if (!validation.ok) {
      setFieldError(validation.message);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFieldError(null);
    triggerLightHaptic();

    try {
      const ticket = await createSupportTicket(validation.body);
      resourceCache.invalidate(['support', 'tickets']);
      showAppAlert(
        CREATE_SUPPORT_TICKET_SCREEN.successTitle,
        `Reference ${ticket.reference}`,
      );
      idempotencyKeyRef.current = generateSupportTicketIdempotencyKey();
      router.replace({
        pathname: ROUTES.supportTicketDetail,
        params: { ticketId: ticket.id },
      });
    } catch (err) {
      setFieldError(mapCreateError(err));
      showAppAlert(CREATE_SUPPORT_TICKET_SCREEN.errorTitle, mapCreateError(err));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [
    attachments,
    canSubmit,
    category,
    description,
    relatedRideId,
    router,
    subcategory,
  ]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.helpSupport);
  }, [router]);

  return {
    category,
    setCategory,
    subcategory,
    setSubcategory,
    subcategories,
    description,
    setDescription,
    relatedRideId,
    setRelatedRideId,
    attachments,
    uploadSheetVisible,
    openUploadSheet,
    closeUploadSheet,
    applyUploadedDocument,
    removeAttachment,
    fieldError,
    submitting,
    canSubmit,
    anyUploading,
    submit,
    goBack,
  };
};

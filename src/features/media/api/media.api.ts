import { ENDPOINTS, httpClient } from '@/network';
import { env } from '@/config';
import { authService } from '@/features/auth/services';
import { userDetailsSheetSync } from '@/DemoData';
import {
  DRIVING_LICENSE_DOCUMENT_TYPE,
  submitDrivingLicenseVerification,
} from '@/features/profile/api';
import { logger } from '@/shared/utils/logger';
import { authSession } from '@/store';
import type { CloudinaryUploadResponse, UploadKind } from '@/types/cloudinary';

export interface PersistMediaPayload {
  kind: UploadKind;
  secureUrl: string;
  publicId: string;
  format?: string;
  bytes?: number;
}

const syncUserDetailsMedia = async (patch: {
  profilePicture?: string;
  rc?: string;
  corporateIdUrl?: string;
}): Promise<void> => {
  const user = authSession.getUser();
  const mobile = user?.phone?.trim() || '';
  if (!mobile) {
    logger.warn('Skip UserDetails media sync — no session phone', patch);
    return;
  }

  try {
    await userDetailsSheetSync.validateAndSync({
      userName: user?.fullName?.trim() || 'User',
      email: user?.email || '',
      mobile,
      profilePicture: patch.profilePicture,
      rc: patch.rc,
      corporateIdUrl: patch.corporateIdUrl,
    });
  } catch (error) {
    logger.warn('UserDetails media sheet sync failed', { patch, error });
  }
};

/**
 * Example backend persistence after Cloudinary upload succeeds.
 * Backend should store only the Cloudinary URL / public_id — never re-upload the file.
 */
export const persistCloudinaryAsset = async (
  payload: PersistMediaPayload,
): Promise<PersistMediaPayload> => {
  if (env.useMocks) {
    logger.info('Mock persist Cloudinary asset (URL for backend)', {
      kind: payload.kind,
      secureUrl: payload.secureUrl,
      publicId: payload.publicId,
    });
    return payload;
  }

  try {
    await httpClient.post(ENDPOINTS.media.saveAsset, payload);
  } catch (error) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? Number((error as { status?: unknown }).status)
        : undefined;
    // Live API does not implement POST /media/assets. Cloudinary URL is already stored.
    if (status === 404 || status === 405) {
      logger.warn('POST /media/assets not available — keeping Cloudinary URL only', {
        kind: payload.kind,
        publicId: payload.publicId,
        status,
      });
      return payload;
    }
    throw error;
  }
  return payload;
};

export const saveProfilePhotoUrl = async (
  result: CloudinaryUploadResponse,
): Promise<string> => {
  const secureUrl = result.secureUrl;

  // Profile photos are stored on POST/PATCH /users/profile — not /media/assets.
  if (authSession.getToken() && authSession.getProfileCompleted()) {
    try {
      const profile = await authService.updateProfilePhoto(secureUrl);
      authSession.setUserFromProfile(profile);
    } catch (error) {
      logger.warn('PATCH /users/profile profilePhoto failed after Cloudinary upload', {
        secureUrl,
        error,
      });
    }
  }

  await syncUserDetailsMedia({ profilePicture: secureUrl });
  return secureUrl;
};

export const saveDrivingLicenseUrl = async (
  result: CloudinaryUploadResponse,
): Promise<string> => {
  const saved = await persistCloudinaryAsset({
    kind: 'dl',
    secureUrl: result.secureUrl,
    publicId: result.publicId,
    format: result.format,
    bytes: result.bytes,
  });

  // Docs: POST /verification/driving-license — Bearer JWT + SubmitVerificationDto
  try {
    await submitDrivingLicenseVerification({
      documentUrl: saved.secureUrl,
      documentType: DRIVING_LICENSE_DOCUMENT_TYPE,
      documentReference: saved.publicId,
    });
  } catch (error) {
    // 409 = active DL verification already exists — treat as success for save flow.
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? Number((error as { status?: unknown }).status)
        : undefined;
    if (status === 409) {
      logger.info('Driving license verification already submitted (409)', {
        publicId: saved.publicId,
      });
      return saved.secureUrl;
    }
    throw error;
  }

  return saved.secureUrl;
};

/**
 * Persist RC Cloudinary URL to backend + UserDetails sheet.
 * Does not start RC verification — that happens only on an explicit Verify RC tap.
 */
export const saveVehicleRcUrl = async (
  result: CloudinaryUploadResponse,
): Promise<string> => {
  const saved = await persistCloudinaryAsset({
    kind: 'rc',
    secureUrl: result.secureUrl,
    publicId: result.publicId,
    format: result.format,
    bytes: result.bytes,
  });
  await syncUserDetailsMedia({ rc: saved.secureUrl });
  return saved.secureUrl;
};

/** Persist Corporate ID Cloudinary URL to backend + UserDetails sheet (same as profile picture). */
export const saveCorporateIdUrl = async (
  result: CloudinaryUploadResponse,
): Promise<string> => {
  const saved = await persistCloudinaryAsset({
    kind: 'corporateId',
    secureUrl: result.secureUrl,
    publicId: result.publicId,
    format: result.format,
    bytes: result.bytes,
  });
  await syncUserDetailsMedia({ corporateIdUrl: saved.secureUrl });
  return saved.secureUrl;
};

/**
 * Support / issue screenshots are attached as Cloudinary HTTPS URLs on the
 * ticket or report API. There is no live POST /media/assets registry.
 */
export const saveIssueReportUrl = async (
  result: CloudinaryUploadResponse,
): Promise<string> => {
  const secureUrl = result.secureUrl?.trim();
  if (!secureUrl) {
    throw new Error('Cloudinary upload did not return a URL.');
  }
  logger.info('Issue report Cloudinary URL ready (no /media/assets persist)', {
    publicId: result.publicId,
  });
  return secureUrl;
};

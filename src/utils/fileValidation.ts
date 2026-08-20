import * as FileSystemLegacy from 'expo-file-system/legacy';

import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  UPLOAD_KIND_CONFIG,
} from '@/shared/constants/uploadTypes';
import { CloudinaryUploadError } from '@/types/cloudinary';
import type { FileMetadata, UploadKind } from '@/types/cloudinary';

const extensionFromName = (name?: string): string => {
  if (!name) {
    return '';
  }
  const parts = name.split('.');
  if (parts.length < 2) {
    return '';
  }
  return (parts.pop() ?? '').toLowerCase();
};

const extensionFromUri = (uri: string): string => {
  const clean = uri.split('?')[0] ?? uri;
  return extensionFromName(clean);
};

const mimeFromExtension = (ext: string): string | undefined => {
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'pdf') return 'application/pdf';
  return undefined;
};

export const isImageMimeType = (mimeType?: string): boolean => {
  if (!mimeType) {
    return false;
  }
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType.toLowerCase());
};

export const isPdfMimeType = (mimeType?: string): boolean =>
  (mimeType ?? '').toLowerCase() === 'application/pdf';

export const resolveMimeType = (file: FileMetadata): string | undefined => {
  if (file.mimeType) {
    return file.mimeType.toLowerCase();
  }
  const ext = extensionFromName(file.fileName) || extensionFromUri(file.uri);
  return mimeFromExtension(ext);
};

export const getFileSizeBytes = async (uri: string): Promise<number | undefined> => {
  try {
    const info = await FileSystemLegacy.getInfoAsync(uri);
    if (info.exists && 'size' in info && typeof info.size === 'number') {
      return info.size;
    }
  } catch {
    // Ignore — upload may still succeed; Cloudinary enforces size too.
  }
  return undefined;
};

export const validateFileForKind = async (
  file: FileMetadata,
  kind: UploadKind,
): Promise<FileMetadata> => {
  const config = UPLOAD_KIND_CONFIG[kind];
  let mimeType = resolveMimeType(file);
  let extension =
    extensionFromName(file.fileName) ||
    extensionFromUri(file.uri) ||
    (mimeType === 'image/jpeg'
      ? 'jpg'
      : mimeType === 'image/png'
        ? 'png'
        : mimeType === 'application/pdf'
          ? 'pdf'
          : '');

  // Camera / gallery picks frequently omit mime + filename. Treat as JPEG images
  // (UploadDocumentSheet / ImagePicker only return images for these flows).
  if (!mimeType && !extension && file.uri) {
    mimeType = 'image/jpeg';
    extension = 'jpg';
  }

  const mimeOk =
    mimeType && (config.allowedMimeTypes as readonly string[]).includes(mimeType);
  const extOk =
    extension && (config.allowedExtensions as readonly string[]).includes(extension);

  if (!mimeOk && !extOk) {
    throw new CloudinaryUploadError(
      'INVALID_FORMAT',
      kind === 'profile'
        ? 'Profile photo must be a JPG or PNG image.'
        : 'Document must be JPG, PNG, or PDF.',
    );
  }

  // Size limits are intentionally not enforced client-side so large
  // camera / gallery picks can upload; Cloudinary may still reject oversized files.
  const sizeBytes = file.sizeBytes ?? (await getFileSizeBytes(file.uri));

  return {
    ...file,
    fileName: file.fileName ?? (extension ? `upload.${extension}` : undefined),
    mimeType: mimeType ?? file.mimeType,
    sizeBytes,
  };
};

export const assertAllowedImage = (mimeType?: string, fileName?: string): void => {
  const mime = mimeType?.toLowerCase();
  const ext = extensionFromName(fileName);
  const ok =
    (mime && (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mime)) ||
    (ext && (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext));
  if (!ok) {
    throw new CloudinaryUploadError('INVALID_FORMAT', 'Only JPG and PNG images are allowed.');
  }
};

export const assertAllowedDocument = (mimeType?: string, fileName?: string): void => {
  const mime = mimeType?.toLowerCase();
  const ext = extensionFromName(fileName);
  const ok =
    (mime && (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(mime)) ||
    (ext && (ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext));
  if (!ok) {
    throw new CloudinaryUploadError(
      'INVALID_FORMAT',
      'Only JPG, PNG, and PDF files are allowed.',
    );
  }
};

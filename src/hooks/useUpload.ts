import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { showAppAlert } from '@/store';

import { UPLOAD_KIND_CONFIG } from '@/shared/constants/uploadTypes';
import { showUploadFeedback } from '@/shared/utils/feedback';
import { triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils/haptics';
import { deleteFile, uploadFile } from '@/services/cloudinary';
import {
  CloudinaryUploadError,
  type CloudinaryUploadResponse,
  type FileMetadata,
  type UploadKind,
  type UploadSource,
} from '@/types/cloudinary';
import {
  getFileSizeBytes,
  isImageMimeType,
  isPdfMimeType,
  resolveMimeType,
  validateFileForKind,
} from '@/utils/fileValidation';
import { compressImage } from '@/utils/imageCompression';

export interface UseUploadOptions {
  kind: UploadKind;
  /** Persist secure_url to backend after Cloudinary succeeds. */
  onUploaded?: (result: CloudinaryUploadResponse) => Promise<void> | void;
  showAlerts?: boolean;
}

export interface UseUploadResult {
  progress: number;
  isUploading: boolean;
  error: CloudinaryUploadError | null;
  result: CloudinaryUploadResponse | null;
  localPreviewUri: string | null;
  pickAndUpload: (source: UploadSource) => Promise<CloudinaryUploadResponse | null>;
  uploadLocalFile: (file: FileMetadata) => Promise<CloudinaryUploadResponse | null>;
  cancelUpload: () => void;
  deleteUploaded: (publicId: string) => Promise<void>;
  reset: () => void;
}

/** @deprecated Prefer `UseUploadOptions`. */
export type UseCloudinaryUploadOptions = UseUploadOptions;
/** @deprecated Prefer `UseUploadResult`. */
export type UseCloudinaryUploadResult = UseUploadResult;

const requestPermission = async (source: 'camera' | 'gallery'): Promise<boolean> => {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new CloudinaryUploadError(
        'PERMISSION_DENIED',
        'Camera access is required to capture a photo.',
      );
    }
    return true;
  }

  // Android: system Photo Picker (launchImageLibraryAsync) needs no READ_MEDIA_*.
  // iOS: photo-library permission may still be required.
  if (Platform.OS !== 'ios') {
    return true;
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new CloudinaryUploadError(
      'PERMISSION_DENIED',
      'Gallery access is required to choose a photo.',
    );
  }
  return true;
};

const pickFromCameraOrGallery = async (
  source: 'camera' | 'gallery',
  kind: UploadKind,
): Promise<FileMetadata | null> => {
  await requestPermission(source);
  const config = UPLOAD_KIND_CONFIG[kind];

  const options: ImagePicker.ImagePickerOptions = {
    // Profile / contact photos only — never videos or broad library access.
    mediaTypes: ['images'],
    allowsEditing: config.squareCrop,
    aspect: config.squareCrop ? [1, 1] : undefined,
    quality: 0.9,
  };

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets[0]) {
    throw new CloudinaryUploadError('CANCELLED', 'Selection cancelled.');
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? undefined,
    mimeType: asset.mimeType ?? undefined,
    width: asset.width,
    height: asset.height,
    sizeBytes: asset.fileSize,
  };
};

const pickFromFiles = async (): Promise<FileMetadata | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/jpeg', 'image/png', 'application/pdf'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    throw new CloudinaryUploadError('CANCELLED', 'Selection cancelled.');
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    fileName: asset.name,
    mimeType: asset.mimeType ?? undefined,
    sizeBytes: asset.size,
  };
};

export const useUpload = ({
  kind,
  onUploaded,
  showAlerts = true,
}: UseUploadOptions): UseUploadResult => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<CloudinaryUploadError | null>(null);
  const [result, setResult] = useState<CloudinaryUploadResponse | null>(null);
  const [localPreviewUri, setLocalPreviewUri] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setError(null);
    setResult(null);
    setLocalPreviewUri(null);
  }, []);

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsUploading(false);
  }, []);

  const uploadLocalFile = useCallback(
    async (input: FileMetadata): Promise<CloudinaryUploadResponse | null> => {
      const config = UPLOAD_KIND_CONFIG[kind];
      setError(null);
      setIsUploading(true);
      setProgress(0);

      try {
        let file = await validateFileForKind(input, kind);
        setLocalPreviewUri(file.uri);

        const mime = resolveMimeType(file);
        const shouldCompress = isImageMimeType(mime) && !isPdfMimeType(mime);
        const resourceType = isPdfMimeType(mime) ? 'raw' : config.resourceType;

        if (shouldCompress) {
          const compressed = await compressImage(file.uri, {
            maxDimension: config.compressTargetWidth,
            quality: kind === 'profile' ? 0.82 : 0.75,
            squareCrop: config.squareCrop,
          });
          const sizeBytes = await getFileSizeBytes(compressed.uri);
          file = await validateFileForKind(
            {
              ...compressed,
              sizeBytes,
            },
            kind,
          );
          setLocalPreviewUri(file.uri);
        }

        const controller = new AbortController();
        abortRef.current = controller;

        const uploaded = await uploadFile({
          uri: file.uri,
          kind,
          folder: config.folder,
          fileName: file.fileName,
          mimeType: file.mimeType,
          resourceType,
          onProgress: setProgress,
          signal: controller.signal,
        });

        if (onUploaded) {
          await onUploaded(uploaded);
        }

        setResult(uploaded);
        triggerSuccessHaptic();
        return uploaded;
      } catch (err) {
        const uploadError =
          err instanceof CloudinaryUploadError
            ? err
            : new CloudinaryUploadError('UNKNOWN', 'Upload failed. Please try again.', {
                details: err,
              });
        setError(uploadError);
        if (showAlerts) {
          showUploadFeedback(uploadError);
        }
        return null;
      } finally {
        abortRef.current = null;
        setIsUploading(false);
      }
    },
    [kind, onUploaded, showAlerts],
  );

  const pickAndUpload = useCallback(
    async (source: UploadSource): Promise<CloudinaryUploadResponse | null> => {
      triggerLightHaptic();
      const config = UPLOAD_KIND_CONFIG[kind];

      if (!(config.sources as readonly string[]).includes(source)) {
        const message = `Source "${source}" is not allowed for ${kind} uploads.`;
        const err = new CloudinaryUploadError('INVALID_FORMAT', message);
        setError(err);
        if (showAlerts) {
          showUploadFeedback(err);
        }
        return null;
      }

      try {
        const picked =
          source === 'files'
            ? await pickFromFiles()
            : await pickFromCameraOrGallery(source, kind);

        if (!picked) {
          return null;
        }

        return uploadLocalFile(picked);
      } catch (err) {
        const uploadError =
          err instanceof CloudinaryUploadError
            ? err
            : new CloudinaryUploadError('UNKNOWN', 'Could not open the file picker.', {
                details: err,
              });
        setError(uploadError);
        if (showAlerts && uploadError.code !== 'CANCELLED') {
          showUploadFeedback(uploadError);
        }
        return null;
      }
    },
    [kind, showAlerts, uploadLocalFile],
  );

  const deleteUploaded = useCallback(
    async (publicId: string) => {
      try {
        await deleteFile(publicId);
        showAppAlert('Deleted', 'The uploaded file was removed.');
        reset();
      } catch (err) {
        if (showAlerts) {
          showUploadFeedback(err);
        }
        throw err;
      }
    },
    [reset, showAlerts],
  );

  return {
    progress,
    isUploading,
    error,
    result,
    localPreviewUri,
    pickAndUpload,
    uploadLocalFile,
    cancelUpload,
    deleteUploaded,
    reset,
  };
};

/** @deprecated Prefer `useUpload`. */
export const useCloudinaryUpload = useUpload;

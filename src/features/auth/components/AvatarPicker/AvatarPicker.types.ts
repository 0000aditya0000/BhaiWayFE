export interface AvatarPickerProps {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  error?: string;
  onUploadingChange?: (uploading: boolean) => void;
  onUploadError?: (error: Error) => void;
}

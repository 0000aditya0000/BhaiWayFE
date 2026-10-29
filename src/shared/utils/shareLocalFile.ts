import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export interface ShareLocalFileOptions {
  path: string;
  mimeType: string;
  dialogTitle: string;
  uti?: string;
}

/**
 * Share a local file (PDF, text, etc.) via the system sheet.
 * React Native `Share.share` on Android is text-only and cannot attach a PDF.
 */
export const shareLocalFile = async (options: ShareLocalFileOptions): Promise<void> => {
  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(options.path, {
      mimeType: options.mimeType,
      dialogTitle: options.dialogTitle,
      UTI: options.uti,
    });
    return;
  }

  if (Platform.OS === 'ios') {
    await Share.share({
      title: options.dialogTitle,
      url: options.path,
    });
    return;
  }

  const contentUri = await FileSystem.getContentUriAsync(options.path);
  await Share.share({
    title: options.dialogTitle,
    url: contentUri,
  });
};

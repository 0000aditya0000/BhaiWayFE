import { Share } from 'react-native';

/**
 * Best-effort clipboard write without adding a native dependency.
 * Uses RN Clipboard when present; otherwise opens the share sheet with the text.
 * Throws `CANCELLED` when the user dismisses a share-sheet fallback.
 */
export const copyTextToClipboard = async (text: string): Promise<void> => {
  const value = String(text ?? '');
  try {
    // Legacy RN Clipboard (some Expo runtimes still expose it).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rn = require('react-native') as {
      Clipboard?: { setString?: (v: string) => void };
    };
    if (typeof rn.Clipboard?.setString === 'function') {
      rn.Clipboard.setString(value);
      return;
    }
  } catch {
    // Fall through.
  }

  const result = await Share.share({ message: value });
  if (result.action === Share.dismissedAction) {
    const cancelled = new Error('CANCELLED');
    cancelled.name = 'ShareCancelled';
    throw cancelled;
  }
};

export const isClipboardCancelled = (error: unknown): boolean =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: string }).name === 'ShareCancelled',
  );

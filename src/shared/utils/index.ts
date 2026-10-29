export { setupGlobalKeyboardDismiss } from './setupGlobalKeyboardDismiss';
export { logger } from './logger';
export { sanitizePhoneNumber, formatPhoneNumber, maskPhoneNumber } from './formatter';
export { toTelHref } from './telHref';
export { openPhoneCall } from './openPhoneCall';
export { delay, getErrorMessage, generateId, getSearchParam } from './helpers';
export {
  BHAIWAY_COIN_IMAGE,
  BHAIWAY_COIN_ICON,
  BHAIWAY_COIN_NAME,
  BHAIWAY_COINS_NAME,
  formatBhaiWayCoins,
  formatSignedBhaiWayCoins,
} from './bhaiwayCoin';
export {
  formatDisplayDate,
  formatSlashDate,
  startOfDay,
  isSameCalendarDay,
  parseSlashDate,
  getRelativeDateLabel,
} from './date';
export {
  isIOS,
  isAndroid,
  selectPlatform,
  keyboardAvoidingBehavior,
  keyboardVerticalOffset,
  scrollKeyboardDismissMode,
  stackAnimation,
  stackGestureOptions,
  NESTED_ROOT_SEGMENTS,
  isNestedRootSegment,
  createShadow,
  androidTextInputFix,
} from './platform';
export {
  triggerLightHaptic,
  triggerNotificationHaptic,
  triggerSelectionHaptic,
  triggerSuccessHaptic,
  triggerErrorHaptic,
} from './haptics';
export { resetTo } from './navigation';
export { useExitOnBack } from './useExitOnBack';
export { compressImage } from './imageCompressor';
export type { CompressImageOptions } from './imageCompressor';
export {
  isImageMimeType,
  isPdfMimeType,
  resolveMimeType,
  getFileSizeBytes,
  validateFileForKind,
  assertAllowedImage,
  assertAllowedDocument,
} from './fileValidator';
export {
  getUploadErrorMessage,
  showUploadFeedback,
  showSuccessFeedback,
} from './feedback';
export { showAppAlert } from '@/store';
export { copyTextToClipboard, isClipboardCancelled } from './clipboard';
export type { AppAlertButton, AppAlertPayload, AppAlertVariant } from '@/store';
export { UPI_ID_PATTERN, isValidUpiId } from './upi';
export { shareLocalFile } from './shareLocalFile';
export type { ShareLocalFileOptions } from './shareLocalFile';
export {
  WOMEN_ONLY_RIDE_ERROR_CODE,
  WOMEN_ONLY_RIDE_MESSAGE,
  WOMEN_ONLY_BADGE_LABEL,
  WOMEN_ONLY_FEATURE,
  resolveWomenOnly,
  canBookWomenOnlyRide,
  extractApiErrorCode,
  isWomenOnlyRideError,
  formatApiGenderLabel,
} from './womenOnlyRide';

export {
  asSupportTicketCategory,
  asSupportTicketStatus,
  isSupportUuid,
  mergeEligibleRidesWithoutDuplicates,
  mergeSupportTicketsWithoutDuplicates,
  normalizeEligibleSupportRide,
  normalizeEligibleSupportRidePage,
  normalizeSupportComment,
  normalizeSupportTicketDetail,
  normalizeSupportTicketListItem,
  normalizeSupportTicketPage,
} from './support.mapper';
export {
  generateSupportCommentIdempotencyKey,
  generateSupportTicketIdempotencyKey,
  isHttpsImageUrl,
  validateAndBuildCreateTicketBody,
} from './support.payload';
export type {
  CreateTicketFormInput,
  CreateTicketValidationResult,
} from './support.payload';
export {
  formatSupportCategoryLabel,
  formatSupportDateTime,
  formatSupportRideLabel,
  formatSupportStatusLabel,
  formatSupportSubcategoryLabel,
  previewDescription,
} from './supportLabels';

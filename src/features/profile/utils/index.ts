export {
  API_VEHICLE_TYPES,
  formatVehicleDisplayName,
  inferCategoryFromVehicle,
  isDuplicateRegistrationError,
  mapAddVehicleFormToCreateDto,
  mapAddVehicleFormToUpdateDto,
  mapCategoryToSeatingCapacity,
  mapCategoryToVehicleType,
  mapCreateVehicleError,
  mapUpdateVehicleError,
  mapVehicleResponseToAddVehicleForm,
  mapVehicleResponseToGarageVehicle,
  mapVerificationStatusToRcStatus,
  mergeGarageVehiclesWithServer,
  normalizeRegistrationNumber,
  splitVehicleModelInput,
} from './vehicle.mapper';

export {
  applyRcVerificationToGarageVehicle,
  buildRcFieldMatches,
  collectVehicleRcFailureMessages,
  formatRcVerifiedAt,
  isVehicleRcVerifiedStatus,
  mapVehicleRcVerificationError,
  ownerMatchLabel,
  resolveVehicleRcUiStatus,
  VEHICLE_RC_ERROR_MESSAGES,
} from './vehicleRcVerification.mapper';

export {
  EMAIL_OTP_LENGTH,
  EMAIL_RESEND_COOLDOWN_SECONDS,
  EMAIL_VERIFICATION_ERROR_MESSAGES,
  isValidEmailOtp,
  mapEmailVerificationError,
  normalizeEmailOtp,
} from './emailVerification.mapper';

export {
  EMAIL_CHANGE_COOLDOWN_SECONDS,
  EMAIL_CHANGE_ERROR_CODES,
  EMAIL_CHANGE_ERROR_MESSAGES,
  EMAIL_CHANGE_OTP_LENGTH,
  isValidChangeEmailOtp,
  isValidNewEmail,
  mapEmailChangeError,
  maskEmail,
  normalizeChangeEmailOtp,
  normalizeNewEmail,
  parseEmailChangeError,
} from './emailChange.mapper';
export type { ParsedEmailChangeError } from './emailChange.mapper';

export {
  CORPORATE_DOMAIN_POLICY_OWNER,
  CORPORATE_IDENTITY_ERROR_MESSAGES,
  CORPORATE_OTP_LENGTH,
  CORPORATE_RESEND_COOLDOWN_SECONDS,
  isCorporateOtpPendingStatus,
  isCorporateVerifiedStatus,
  isValidCorporateEmailSyntax,
  isValidCorporateOtp,
  mapCorporateIdentityError,
  normalizeCorporateEmail,
  normalizeCorporateOtp,
} from './corporateIdentity.mapper';

export {
  assertClientControlledVerificationPayload,
  buildIdentitySubmitPayload,
  isIdentityFailedStatus,
  isIdentityPendingStatus,
  isIdentityVerifiedStatus,
  mapIdentityVerificationError,
  resolveIdentityOutcomeMessage,
} from './verification.mapper';

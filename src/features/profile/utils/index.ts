export {
  API_VEHICLE_TYPES,
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
  normalizeRegistrationNumber,
  splitVehicleModelInput,
} from './vehicle.mapper';

export {
  assertClientControlledVerificationPayload,
  buildIdentitySubmitPayload,
  isIdentityFailedStatus,
  isIdentityPendingStatus,
  isIdentityVerifiedStatus,
  mapIdentityVerificationError,
  resolveIdentityOutcomeMessage,
} from './verification.mapper';

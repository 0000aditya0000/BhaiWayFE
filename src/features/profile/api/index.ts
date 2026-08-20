export {
  activateVehicle,
  createVehicle,
  deleteVehicleById,
  getVehicleById,
  listVehicles,
  updateVehicle,
} from './vehicle.api';
export type {
  ApiVehicleType,
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponse,
} from './vehicle.api';

export {
  getMyVerifications,
  submitIdentityVerification,
  submitDrivingLicenseVerification,
  submitVehicleVerification,
  IDENTITY_DOCUMENT_TYPE,
  DRIVING_LICENSE_DOCUMENT_TYPE,
  VEHICLE_DOCUMENT_TYPE,
} from './verification.api';
export type {
  MyVerificationsResponse,
  SubmitVerificationPayload,
  VerificationStatus,
  VerificationStatusView,
  VerificationType,
} from './verification.api';

export {
  activateVehicle,
  createVehicle,
  deleteVehicleById,
  getVehicleById,
  listVehicles,
  updateVehicle,
  verifyVehicleRc,
} from './vehicle.api';
export type {
  ApiVehicleType,
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleOwnerMatchStatus,
  VehicleRcVerification,
  VehicleRcVerificationStatus,
  VehicleResponse,
  VerifyVehicleRcRequest,
  VerifyVehicleRcResponse,
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
export {
  startAadhaarVerification,
  getAadhaarVerificationStatus,
  refreshAadhaarVerification,
} from '@/api/kyc.api';
export type {
  AadhaarVerificationStartResponse,
  AadhaarVerificationStatusResponse,
  AadhaarVerificationRefreshResponse,
} from '@/types/kyc';

export {
  getEmailVerificationStatus,
  sendEmailVerification,
  verifyEmail,
} from './emailVerification.api';
export type {
  EmailVerificationStatusResponse,
  SendEmailVerificationRequest,
  SendEmailVerificationResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from './emailVerification.api';

export {
  getCorporateIdentityStatus,
  sendCorporateIdentityOtp,
  verifyCorporateIdentityOtp,
} from './corporateIdentity.api';
export type {
  CorporateIdentityStatus,
  CorporateIdentityStatusResponse,
  SendCorporateIdentityRequest,
  SendCorporateIdentityResponse,
  VerifyCorporateIdentityRequest,
  VerifyCorporateIdentityResponse,
} from './corporateIdentity.api';

export {
  listPaymentMethods,
  getPaymentMethod,
  createUpiPaymentMethod,
  createBankPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from './paymentMethods.api';
export type {
  PaymentMethodDto,
  PaymentMethodType,
  CreatePaymentMethodPayload,
  CreateUpiPaymentMethodPayload,
  CreateBankPaymentMethodPayload,
  UpdatePaymentMethodPayload,
} from './paymentMethods.api';

export {
  createWithdrawal,
  listWithdrawals,
  getWithdrawal,
} from './withdrawals.api';
export type {
  WithdrawalDto,
  WithdrawalStatus,
  WithdrawalPaymentMethodSnapshot,
  WithdrawalsPageDto,
  CreateWithdrawalPayload,
  ListWithdrawalsQuery,
} from './withdrawals.api';

export { getReferralSummary, listReferrals } from './referrals.api';
export type {
  ReferralSummaryDto,
  ReferralPageDto,
  ReferralListItemDto,
  ReferralReferredUserDto,
  ReferralStatus,
  ListReferralsQuery,
} from './referrals.api';

export {
  listTrustedContacts,
  getTrustedContact,
  createTrustedContact,
  updateTrustedContact,
  deleteTrustedContact,
} from './trustedContacts.api';
export type {
  TrustedContactDto,
  TrustedContactRelationship,
  CreateTrustedContactPayload,
  UpdateTrustedContactPayload,
  TrustedContactPageDto,
  ListTrustedContactsQuery,
} from './trustedContacts.api';


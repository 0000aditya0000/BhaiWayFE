import { ENDPOINTS, httpClient } from '@/network';

import {
  unwrapVehicle,
  unwrapVehicleList,
  unwrapVerifyVehicleRcResponse,
} from './vehicle.unwrap';

export {
  unwrapVehicle,
  unwrapVehicleList,
  unwrapVerifyVehicleRcResponse,
} from './vehicle.unwrap';

/** Swagger: VehicleType */
export type ApiVehicleType = 'CAR' | 'BIKE';

/** Backend RC verification outcome for a vehicle. */
export type VehicleRcVerificationStatus =
  | 'VERIFIED'
  | 'INVALID'
  | 'FAILED'
  | 'PENDING'
  | 'NOT_VERIFIED';

/** Backend owner-name match vs verified Aadhaar identity. */
export type VehicleOwnerMatchStatus = 'MATCHED' | 'NOT_MATCHED' | 'NOT_CHECKED';

/**
 * Swagger: VehicleResponseDto
 * Docs: GET /vehicles, POST /vehicles (201)
 */
export interface VehicleResponse {
  id: string;
  vehicleType: ApiVehicleType;
  make: string;
  model: string;
  variant?: string | null;
  registrationNumber: string;
  registrationYear?: number | null;
  color?: string | null;
  seatingCapacity: number;
  isActive: boolean;
  /** Optional RC snapshot fields when backend includes them on list/detail. */
  rcVerificationStatus?: VehicleRcVerificationStatus | null;
  ownerMatchStatus?: VehicleOwnerMatchStatus | null;
  rcVerifiedAt?: string | null;
  verifiedAt?: string | null;
  isRcVerified?: boolean | null;
  isVerified?: boolean | null;
}

export interface VehicleRcRecordSnapshot {
  vehicleName?: string | null;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  registrationNumber?: string | null;
  insuranceExpiry?: string | null;
  registrationStatus?: string | null;
}

export interface VehicleRcCheck {
  code?: string | null;
  field?: string | null;
  message?: string | null;
  status?: string | null;
  matched?: boolean | null;
  entered?: string | null;
  expected?: string | null;
  rcValue?: string | null;
  rcRecord?: string | null;
}

export interface VehicleRcVerification {
  vehicleId: string;
  status: VehicleRcVerificationStatus;
  vehicleNumber: string;
  verifiedAt?: string;
  verificationId?: string;
  ownerMatchStatus?: VehicleOwnerMatchStatus;
  message?: string | null;
  errors?: Array<string | VehicleRcCheck> | null;
  failedChecks?: VehicleRcCheck[] | null;
  checks?: VehicleRcCheck[] | null;
  mismatches?: VehicleRcCheck[] | null;
  rcRecord?: VehicleRcRecordSnapshot | null;
  rcDetails?: VehicleRcRecordSnapshot | null;
}

export interface VerifyVehicleRcResponse {
  success: boolean;
  verification: VehicleRcVerification | null;
}

export interface VerifyVehicleRcRequest {
  vehicleNumber?: string;
}

/**
 * Swagger: CreateVehicleDto
 * Docs: POST /vehicles — Bearer JWT (ownership from token, never send userId)
 */
export interface CreateVehicleDto {
  vehicleType: ApiVehicleType;
  make: string;
  model: string;
  variant?: string | null;
  registrationNumber: string;
  registrationYear?: number | null;
  color?: string | null;
  seatingCapacity: number;
  documentUrl?: string | null;
  documentType?: string | null;
  documentReference?: string | null;
}

/** Swagger: UpdateVehicleDto — PATCH /vehicles/:id */
export interface UpdateVehicleDto {
  vehicleType?: ApiVehicleType;
  make?: string;
  model?: string;
  variant?: string | null;
  registrationNumber?: string;
  registrationYear?: number | null;
  color?: string | null;
  seatingCapacity?: number;
  documentUrl?: string | null;
  documentType?: string | null;
  documentReference?: string | null;
}

/**
 * Lists vehicles owned by the authenticated user.
 * Docs: GET /vehicles — Authorization: Bearer <BHAIWAY_JWT>
 */
export const listVehicles = async (): Promise<VehicleResponse[]> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.vehicles.list);
  return unwrapVehicleList<VehicleResponse>(payload);
};

/**
 * Creates a vehicle for the authenticated user.
 * Docs: POST /vehicles — 201 VehicleResponseDto
 * Does not verify RC. RC verification is POST /vehicles/:id/verify-rc only.
 */
export const createVehicle = async (payload: CreateVehicleDto): Promise<VehicleResponse> => {
  const created = await httpClient.post<unknown>(ENDPOINTS.vehicles.create, payload);
  return unwrapVehicle<VehicleResponse>(created);
};

/** Docs: GET /vehicles/:id */
export const getVehicleById = async (id: string): Promise<VehicleResponse> => {
  const row = await httpClient.get<unknown>(ENDPOINTS.vehicles.byId(id));
  return unwrapVehicle<VehicleResponse>(row);
};

/** Docs: PATCH /vehicles/:id */
export const updateVehicle = async (
  id: string,
  payload: UpdateVehicleDto,
): Promise<VehicleResponse> => {
  const updated = await httpClient.patch<unknown>(ENDPOINTS.vehicles.byId(id), payload);
  return unwrapVehicle<VehicleResponse>(updated);
};

/** Docs: DELETE /vehicles/:id — soft delete */
export const deleteVehicleById = (id: string): Promise<void> =>
  httpClient.delete<void>(ENDPOINTS.vehicles.byId(id));

/** Docs: POST /vehicles/:id/activate */
export const activateVehicle = async (id: string): Promise<VehicleResponse> => {
  const updated = await httpClient.post<unknown>(ENDPOINTS.vehicles.activate(id));
  return unwrapVehicle<VehicleResponse>(updated);
};

/**
 * Verifies vehicle RC via BhaiWay backend (Cashfree server-side only).
 * Docs: POST /vehicles/:id/verify-rc — Bearer JWT
 * Body optional: { vehicleNumber } — when omitted, backend uses registered registrationNumber.
 * Must be called only after an explicit Verify RC tap — never from add-vehicle or list refresh.
 */
export const verifyVehicleRc = async (
  vehicleId: string,
  vehicleNumber?: string,
): Promise<VerifyVehicleRcResponse> => {
  const trimmed = vehicleNumber?.replace(/\s+/g, '').trim().toUpperCase();
  const body: VerifyVehicleRcRequest =
    trimmed && trimmed.length > 0 ? { vehicleNumber: trimmed } : {};
  const payload = await httpClient.post<unknown>(
    ENDPOINTS.vehicles.verifyRc(vehicleId),
    body,
  );
  return unwrapVerifyVehicleRcResponse(payload) as VerifyVehicleRcResponse;
};

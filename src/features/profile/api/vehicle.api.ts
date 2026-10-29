import { ENDPOINTS, httpClient } from '@/network';

/** Swagger: VehicleType */
export type ApiVehicleType = 'CAR' | 'BIKE';

/** Backend RC verification outcome for a vehicle. */
export type VehicleRcVerificationStatus =
  | 'VERIFIED'
  | 'INVALID'
  | 'FAILED'
  | 'PENDING';

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

export interface VehicleRcVerification {
  vehicleId: string;
  status: VehicleRcVerificationStatus;
  vehicleNumber: string;
  verifiedAt?: string;
  verificationId?: string;
  ownerMatchStatus?: VehicleOwnerMatchStatus;
}

export interface VerifyVehicleRcResponse {
  success: boolean;
  verification: VehicleRcVerification;
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
  const rows = await httpClient.get<VehicleResponse[]>(ENDPOINTS.vehicles.list);
  return Array.isArray(rows) ? rows : [];
};

/**
 * Creates a vehicle for the authenticated user.
 * Docs: POST /vehicles — 201 VehicleResponseDto
 */
export const createVehicle = (payload: CreateVehicleDto): Promise<VehicleResponse> =>
  httpClient.post<VehicleResponse>(ENDPOINTS.vehicles.create, payload);

/** Docs: GET /vehicles/:id */
export const getVehicleById = (id: string): Promise<VehicleResponse> =>
  httpClient.get<VehicleResponse>(ENDPOINTS.vehicles.byId(id));

/** Docs: PATCH /vehicles/:id */
export const updateVehicle = (
  id: string,
  payload: UpdateVehicleDto,
): Promise<VehicleResponse> =>
  httpClient.patch<VehicleResponse>(ENDPOINTS.vehicles.byId(id), payload);

/** Docs: DELETE /vehicles/:id — soft delete */
export const deleteVehicleById = (id: string): Promise<void> =>
  httpClient.delete<void>(ENDPOINTS.vehicles.byId(id));

/** Docs: POST /vehicles/:id/activate */
export const activateVehicle = (id: string): Promise<VehicleResponse> =>
  httpClient.post<VehicleResponse>(ENDPOINTS.vehicles.activate(id));

/**
 * Verifies vehicle RC via BhaiWay backend (Cashfree server-side only).
 * Docs: POST /vehicles/:id/verify-rc — Bearer JWT
 * Body optional: { vehicleNumber } — when omitted, backend uses registered registrationNumber.
 */
export const verifyVehicleRc = (
  vehicleId: string,
  vehicleNumber?: string,
): Promise<VerifyVehicleRcResponse> => {
  const trimmed = vehicleNumber?.replace(/\s+/g, '').trim().toUpperCase();
  const body: VerifyVehicleRcRequest =
    trimmed && trimmed.length > 0 ? { vehicleNumber: trimmed } : {};
  return httpClient.post<VerifyVehicleRcResponse>(
    ENDPOINTS.vehicles.verifyRc(vehicleId),
    body,
  );
};

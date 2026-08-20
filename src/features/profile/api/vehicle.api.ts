import { ENDPOINTS, httpClient } from '@/network';

/** Swagger: VehicleType */
export type ApiVehicleType = 'CAR' | 'BIKE';

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

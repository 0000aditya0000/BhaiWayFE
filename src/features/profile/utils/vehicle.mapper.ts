import type { ApiError } from '@/network';

import type {
  ApiVehicleType,
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponse,
} from '../api/vehicle.api';
import type { VerificationStatus } from '../api/verification.types';
import type { AddVehicleForm, GarageVehicle, VehicleCategoryId, VehicleRcStatus } from '../types';
import { resolveVehicleRcUiStatus } from './vehicleRcVerification.mapper';

/** Swagger VehicleType enum */
export const API_VEHICLE_TYPES = ['CAR', 'BIKE'] as const;

const CATEGORY_SEATING: Record<VehicleCategoryId, number> = {
  sedan: 5,
  suv: 7,
  hatchback: 5,
  luxury: 5,
};

export const mapCategoryToVehicleType = (_category: VehicleCategoryId): ApiVehicleType => 'CAR';

export const mapCategoryToSeatingCapacity = (category: VehicleCategoryId): number =>
  CATEGORY_SEATING[category];

export const normalizeRegistrationNumber = (value: string): string =>
  value.replace(/\s+/g, ' ').trim().toUpperCase();

export const splitVehicleModelInput = (
  rawModel: string,
): { make: string; model: string } => {
  const trimmed = rawModel.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { make: trimmed, model: trimmed };
  }
  return {
    make: parts[0],
    model: parts.slice(1).join(' '),
  };
};

export const mapAddVehicleFormToCreateDto = (form: AddVehicleForm): CreateVehicleDto => {
  const { make, model } = splitVehicleModelInput(form.model);
  const dto: CreateVehicleDto = {
    vehicleType: mapCategoryToVehicleType(form.category),
    make,
    model,
    registrationNumber: normalizeRegistrationNumber(form.plateNumber),
    seatingCapacity: mapCategoryToSeatingCapacity(form.category),
  };

  const color = form.color.trim();
  if (color) {
    dto.color = color;
  }

  if (form.documentSecureUrl) {
    dto.documentUrl = form.documentSecureUrl;
    dto.documentType = 'RC';
    if (form.documentPublicId) {
      dto.documentReference = form.documentPublicId;
    }
  }

  return dto;
};

export const mapVerificationStatusToRcStatus = (
  status?: VerificationStatus | null,
): VehicleRcStatus => {
  if (status === 'VERIFIED') {
    return 'verified';
  }
  if (status === 'REJECTED') {
    return 'failed';
  }
  return 'required';
};

export const inferCategoryFromVehicle = (row: VehicleResponse): VehicleCategoryId => {
  if (row.seatingCapacity >= 7) {
    return 'suv';
  }
  return 'sedan';
};

export const mapVehicleResponseToAddVehicleForm = (row: VehicleResponse): AddVehicleForm => {
  const make = (row.make ?? '').trim();
  const modelName = (row.model ?? '').trim();
  const model =
    make && modelName && make.toLowerCase() !== modelName.toLowerCase()
      ? `${make} ${modelName}`
      : modelName || make;

  return {
    category: inferCategoryFromVehicle(row),
    model,
    color: typeof row.color === 'string' ? row.color : '',
    plateNumber: normalizeRegistrationNumber(row.registrationNumber ?? ''),
    documentUri: null,
    documentName: null,
    documentSecureUrl: null,
    documentPublicId: null,
  };
};

export const mapAddVehicleFormToUpdateDto = (form: AddVehicleForm): UpdateVehicleDto => {
  const { make, model } = splitVehicleModelInput(form.model);
  const dto: UpdateVehicleDto = {
    vehicleType: mapCategoryToVehicleType(form.category),
    make,
    model,
    registrationNumber: normalizeRegistrationNumber(form.plateNumber),
    seatingCapacity: mapCategoryToSeatingCapacity(form.category),
  };

  const color = form.color.trim();
  if (color) {
    dto.color = color;
  }

  if (form.documentSecureUrl) {
    dto.documentUrl = form.documentSecureUrl;
    dto.documentType = 'RC';
    if (form.documentPublicId) {
      dto.documentReference = form.documentPublicId;
    }
  }

  return dto;
};

export const mapVehicleResponseToGarageVehicle = (
  row: VehicleResponse,
  vehicleVerificationStatus?: VerificationStatus | null,
): GarageVehicle => {
  const plate = normalizeRegistrationNumber(row.registrationNumber ?? '');
  const make = (row.make ?? '').trim();
  const modelName = (row.model ?? '').trim();
  const variant = typeof row.variant === 'string' ? row.variant.trim() : '';
  const color = typeof row.color === 'string' ? row.color.trim() : '';
  const modelLabel = [make, modelName].filter(Boolean).join(' ');
  const name = modelLabel || modelName || make || plate || `Vehicle ${row.id}`;

  return {
    id: row.id,
    name,
    make,
    model: modelLabel || modelName || '—',
    variant: variant || null,
    color,
    plateNumber: plate || '—',
    vehicleType: row.vehicleType,
    isActive: row.isActive,
    rcStatus: resolveVehicleRcUiStatus({
      response: row,
      aggregateVehicleStatus: vehicleVerificationStatus,
    }),
    ownerMatchStatus: row.ownerMatchStatus ?? null,
    rcVerifiedAt: row.rcVerifiedAt ?? row.verifiedAt ?? null,
    lastRcVerificationStatus: row.rcVerificationStatus ?? null,
  };
};

const getErrorStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as ApiError).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
};

const getErrorText = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return '';
};

export const isDuplicateRegistrationError = (error: unknown): boolean => {
  if (getErrorStatus(error) !== 409) {
    return false;
  }
  const text = getErrorText(error).toLowerCase();
  return text.includes('registration') || text.includes('duplicate');
};

export const mapCreateVehicleError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const text = getErrorText(error);

  if (status === 409) {
    return 'This registration number is already saved to your garage.';
  }

  if (status === 401) {
    return 'Your session expired. Please sign in again.';
  }

  if (status === 400) {
    return text.trim() || 'Please check the vehicle details and try again.';
  }

  if (status === 0) {
    return text.trim() || 'Unable to save the vehicle. Check your connection and try again.';
  }

  return text.trim() || 'Unable to save the vehicle. Please try again.';
};

export const mapUpdateVehicleError = mapCreateVehicleError;

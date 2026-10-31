import type { ApiError } from '@/network';

import type {
  VehicleOwnerMatchStatus,
  VehicleRcCheck,
  VehicleRcRecordSnapshot,
  VehicleRcVerification,
  VehicleRcVerificationStatus,
  VehicleResponse,
} from '../api/vehicle.api';
import type { GarageRcFieldMatch, GarageVehicle, VehicleRcStatus } from '../types';

export const VEHICLE_RC_ERROR_MESSAGES = {
  VEHICLE_RC_INVALID:
    'RC verification could not be completed. Please check the vehicle details and try again.',
  VEHICLE_NUMBER_MISMATCH: 'Registration number does not match RC records.',
  VEHICLE_NAME_MISMATCH: 'Vehicle name does not match RC records.',
  VEHICLE_COLOR_MISMATCH: 'Vehicle colour does not match RC records.',
  INSURANCE_EXPIRED: 'Insurance has expired.',
  INSURANCE_UNAVAILABLE: 'Insurance details could not be retrieved.',
  REGISTRATION_STATUS_INVALID: 'Vehicle registration status is invalid.',
  PROVIDER_UNAVAILABLE: 'RC verification service is temporarily unavailable.',
  VEHICLE_NOT_FOUND: 'This vehicle could not be found.',
  VEHICLE_ACCESS_DENIED: "You don't have permission to verify this vehicle.",
  RATE_LIMITED: 'Too many verification attempts. Please try again later.',
  DUPLICATE: 'A verification request for this vehicle is already in progress.',
  TIMEOUT: 'RC verification timed out. Please try again.',
  NETWORK:
    'Unable to reach the verification service. Please check your internet connection and try again.',
  UNKNOWN: 'RC verification failed. Please try again.',
  SESSION: 'Your session expired. Please sign in again.',
} as const;

const FIELD_LABELS: Record<string, string> = {
  name: 'Vehicle name',
  vehiclename: 'Vehicle name',
  make: 'Make',
  model: 'Model',
  color: 'Colour',
  colour: 'Colour',
  registrationnumber: 'Registration number',
  vehiclenumber: 'Registration number',
  platenumber: 'Registration number',
  insurance: 'Insurance',
  insuranceexpiry: 'Insurance',
  registrationstatus: 'Registration status',
  vehiclestatus: 'Registration status',
};

const CODE_MESSAGES: Record<string, string> = {
  VEHICLE_RC_INVALID: VEHICLE_RC_ERROR_MESSAGES.VEHICLE_RC_INVALID,
  VEHICLE_NUMBER_MISMATCH: VEHICLE_RC_ERROR_MESSAGES.VEHICLE_NUMBER_MISMATCH,
  REGISTRATION_MISMATCH: VEHICLE_RC_ERROR_MESSAGES.VEHICLE_NUMBER_MISMATCH,
  VEHICLE_NAME_MISMATCH: VEHICLE_RC_ERROR_MESSAGES.VEHICLE_NAME_MISMATCH,
  NAME_MISMATCH: VEHICLE_RC_ERROR_MESSAGES.VEHICLE_NAME_MISMATCH,
  VEHICLE_COLOUR_MISMATCH: VEHICLE_RC_ERROR_MESSAGES.VEHICLE_COLOR_MISMATCH,
  VEHICLE_COLOR_MISMATCH: VEHICLE_RC_ERROR_MESSAGES.VEHICLE_COLOR_MISMATCH,
  COLOUR_MISMATCH: VEHICLE_RC_ERROR_MESSAGES.VEHICLE_COLOR_MISMATCH,
  COLOR_MISMATCH: VEHICLE_RC_ERROR_MESSAGES.VEHICLE_COLOR_MISMATCH,
  INSURANCE_EXPIRED: VEHICLE_RC_ERROR_MESSAGES.INSURANCE_EXPIRED,
  INSURANCE_NOT_FOUND: VEHICLE_RC_ERROR_MESSAGES.INSURANCE_UNAVAILABLE,
  INSURANCE_UNAVAILABLE: VEHICLE_RC_ERROR_MESSAGES.INSURANCE_UNAVAILABLE,
  INSURANCE_DETAILS_UNAVAILABLE: VEHICLE_RC_ERROR_MESSAGES.INSURANCE_UNAVAILABLE,
  REGISTRATION_STATUS_INVALID: VEHICLE_RC_ERROR_MESSAGES.REGISTRATION_STATUS_INVALID,
  VEHICLE_STATUS_INVALID: VEHICLE_RC_ERROR_MESSAGES.REGISTRATION_STATUS_INVALID,
  VEHICLE_REGISTRATION_INVALID: VEHICLE_RC_ERROR_MESSAGES.REGISTRATION_STATUS_INVALID,
  RC_PROVIDER_UNAVAILABLE: VEHICLE_RC_ERROR_MESSAGES.PROVIDER_UNAVAILABLE,
  SERVICE_UNAVAILABLE: VEHICLE_RC_ERROR_MESSAGES.PROVIDER_UNAVAILABLE,
  PROVIDER_UNAVAILABLE: VEHICLE_RC_ERROR_MESSAGES.PROVIDER_UNAVAILABLE,
  VEHICLE_NOT_FOUND: VEHICLE_RC_ERROR_MESSAGES.VEHICLE_NOT_FOUND,
  VEHICLE_ACCESS_DENIED: VEHICLE_RC_ERROR_MESSAGES.VEHICLE_ACCESS_DENIED,
  RATE_LIMITED: VEHICLE_RC_ERROR_MESSAGES.RATE_LIMITED,
  DUPLICATE_VERIFICATION: VEHICLE_RC_ERROR_MESSAGES.DUPLICATE,
  TIMEOUT: VEHICLE_RC_ERROR_MESSAGES.TIMEOUT,
  NETWORK_ERROR: VEHICLE_RC_ERROR_MESSAGES.NETWORK,
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const getErrorStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as ApiError).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
};

const getErrorCode = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as ApiError).code;
    if (typeof code === 'string') {
      return code.trim().toUpperCase();
    }
  }
  return '';
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
    if (Array.isArray(message)) {
      return message.map(String).join('\n');
    }
  }
  return '';
};

const normalizeCode = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

const messageForCode = (code: string): string | null => {
  if (!code) {
    return null;
  }
  return CODE_MESSAGES[code] ?? null;
};

const toUserFacingMessage = (raw: unknown): string | null => {
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const mapped = messageForCode(normalizeCode(trimmed));
  if (mapped) {
    return mapped;
  }
  const lower = trimmed.toLowerCase();
  if (
    lower === 'invalid' ||
    lower === 'failed' ||
    lower === 'error' ||
    lower === 'colour' ||
    lower === 'color' ||
    lower === 'down' ||
    lower === 'rc verification failed' ||
    lower === 'unknown' ||
    /^[A-Z0-9_]+$/.test(trimmed) ||
    (!trimmed.includes(' ') && trimmed.length < 16)
  ) {
    return null;
  }
  return trimmed;
};

const pushUnique = (bucket: string[], value: string): void => {
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }
  if (bucket.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
    return;
  }
  bucket.push(trimmed);
};

const collectFromCheck = (check: unknown, bucket: string[]): void => {
  if (typeof check === 'string') {
    const mapped = toUserFacingMessage(check) ?? messageForCode(normalizeCode(check));
    if (mapped) {
      pushUnique(bucket, mapped);
    }
    return;
  }
  const row = asRecord(check);
  if (!row) {
    return;
  }
  if (row.matched === true) {
    return;
  }
  const code = normalizeCode(row.code ?? row.status);
  const mapped = messageForCode(code);
  if (mapped) {
    pushUnique(bucket, mapped);
  }
  const fromMessage = toUserFacingMessage(row.message);
  if (fromMessage) {
    pushUnique(bucket, fromMessage);
  }
};

const collectFromUnknown = (value: unknown, bucket: string[]): void => {
  if (!value) {
    return;
  }
  if (typeof value === 'string') {
    const mapped = toUserFacingMessage(value);
    if (mapped) {
      pushUnique(bucket, mapped);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectFromCheck(item, bucket));
    return;
  }
  const row = asRecord(value);
  if (!row) {
    return;
  }
  collectFromUnknown(row.errors, bucket);
  collectFromUnknown(row.failedChecks, bucket);
  collectFromUnknown(row.checks, bucket);
  collectFromUnknown(row.mismatches, bucket);
  collectFromUnknown(row.details, bucket);
  if (Array.isArray(row.message)) {
    row.message.forEach((item) => collectFromUnknown(item, bucket));
  } else {
    const fromMessage = toUserFacingMessage(row.message);
    if (fromMessage) {
      pushUnique(bucket, fromMessage);
    }
  }
  const mappedCode = messageForCode(normalizeCode(row.code));
  if (mappedCode) {
    pushUnique(bucket, mappedCode);
  }
};

/** Map backend RC verification errors to safe user-facing copy (never Cashfree internals). */
export const mapVehicleRcVerificationError = (error: unknown): string => {
  const messages = collectVehicleRcFailureMessages(error);
  return messages.join('\n') || VEHICLE_RC_ERROR_MESSAGES.UNKNOWN;
};

export const collectVehicleRcFailureMessages = (source: unknown): string[] => {
  const bucket: string[] = [];
  const status = getErrorStatus(source);
  const code = getErrorCode(source);
  const text = getErrorText(source);
  const upper = text.toUpperCase();

  if (status === 401 || code === 'HTTP_401') {
    return [VEHICLE_RC_ERROR_MESSAGES.SESSION];
  }
  if (code === 'TIMEOUT' || upper.includes('TIMEOUT')) {
    return [VEHICLE_RC_ERROR_MESSAGES.TIMEOUT];
  }
  if (status === 0 || code === 'NETWORK_ERROR') {
    return [VEHICLE_RC_ERROR_MESSAGES.NETWORK];
  }
  if (
    status === 429 ||
    code === 'HTTP_429' ||
    code.includes('RATE') ||
    upper.includes('RATE LIMIT') ||
    upper.includes('TOO MANY')
  ) {
    return [VEHICLE_RC_ERROR_MESSAGES.RATE_LIMITED];
  }
  if (status === 403 || code === 'VEHICLE_ACCESS_DENIED' || upper.includes('VEHICLE_ACCESS_DENIED')) {
    return [VEHICLE_RC_ERROR_MESSAGES.VEHICLE_ACCESS_DENIED];
  }
  if (status === 404 || code === 'VEHICLE_NOT_FOUND' || code === 'HTTP_404') {
    pushUnique(bucket, VEHICLE_RC_ERROR_MESSAGES.VEHICLE_NOT_FOUND);
  }
  if (status === 409 || code === 'DUPLICATE_VERIFICATION') {
    return [VEHICLE_RC_ERROR_MESSAGES.DUPLICATE];
  }
  if (status === 503 || code === 'RC_PROVIDER_UNAVAILABLE' || code === 'SERVICE_UNAVAILABLE') {
    return [VEHICLE_RC_ERROR_MESSAGES.PROVIDER_UNAVAILABLE];
  }

  collectFromUnknown(source, bucket);
  if (source && typeof source === 'object' && 'details' in source) {
    collectFromUnknown((source as { details?: unknown }).details, bucket);
  }

  const mappedTextCodes = [
    'VEHICLE_NAME_MISMATCH',
    'NAME_MISMATCH',
    'VEHICLE_NUMBER_MISMATCH',
    'REGISTRATION_MISMATCH',
    'VEHICLE_COLOUR_MISMATCH',
    'VEHICLE_COLOR_MISMATCH',
    'COLOUR_MISMATCH',
    'COLOR_MISMATCH',
    'INSURANCE_EXPIRED',
    'INSURANCE_NOT_FOUND',
    'INSURANCE_UNAVAILABLE',
    'REGISTRATION_STATUS_INVALID',
    'VEHICLE_STATUS_INVALID',
    'VEHICLE_RC_INVALID',
    'RC_PROVIDER_UNAVAILABLE',
  ];
  for (const item of mappedTextCodes) {
    if (upper.includes(item)) {
      const mapped = messageForCode(item);
      if (mapped) {
        pushUnique(bucket, mapped);
      }
    }
  }

  if (bucket.length === 0) {
    const sourceStatus = normalizeCode(asRecord(source)?.status);
    if (
      sourceStatus === 'INVALID' ||
      sourceStatus === 'FAILED' ||
      code === 'VEHICLE_RC_INVALID' ||
      upper.includes('VEHICLE_RC_INVALID')
    ) {
      pushUnique(bucket, VEHICLE_RC_ERROR_MESSAGES.VEHICLE_RC_INVALID);
    }
  }

  return bucket.filter(
    (item) => item.toUpperCase() !== 'UNKNOWN' && item.toLowerCase() !== 'rc verification failed',
  );
};

export const isVehicleRcVerifiedStatus = (
  status?: VehicleRcVerificationStatus | string | null,
): boolean =>
  String(status ?? '')
    .trim()
    .toUpperCase() === 'VERIFIED';

const normalizeRcStatus = (status?: string | null): string =>
  String(status ?? '')
    .trim()
    .toUpperCase();

export const resolveVehicleRcUiStatus = (input: {
  response?: VehicleResponse | null;
  verification?: VehicleRcVerification | null;
}): VehicleRcStatus => {
  const fromVerification = normalizeRcStatus(input.verification?.status);
  if (fromVerification === 'VERIFIED') {
    return 'verified';
  }
  if (fromVerification === 'PENDING') {
    return 'pending';
  }
  if (fromVerification === 'INVALID' || fromVerification === 'FAILED') {
    return 'failed';
  }
  if (fromVerification === 'NOT_VERIFIED') {
    return 'required';
  }

  const rowStatus = normalizeRcStatus(input.response?.rcVerificationStatus);
  if (rowStatus === 'VERIFIED') {
    return 'verified';
  }
  if (rowStatus === 'PENDING') {
    return 'pending';
  }
  if (rowStatus === 'INVALID' || rowStatus === 'FAILED') {
    return 'failed';
  }
  if (rowStatus === 'NOT_VERIFIED') {
    return 'required';
  }

  if (rowStatus) {
    return 'required';
  }

  if (input.response?.isRcVerified === true || input.response?.isVerified === true) {
    return 'verified';
  }

  return 'required';
};

export const ownerMatchLabel = (
  status?: VehicleOwnerMatchStatus | null,
): string | null => {
  if (status === 'MATCHED') {
    return 'Vehicle ownership verified';
  }
  if (status === 'NOT_MATCHED') {
    return 'Vehicle owner details could not be matched with your verified identity.';
  }
  return null;
};

export const formatRcVerifiedAt = (iso?: string | null): string | null => {
  if (!iso?.trim()) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const fieldLabelFor = (field?: string | null, code?: string | null): string => {
  const key = String(field ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (key && FIELD_LABELS[key]) {
    return FIELD_LABELS[key];
  }
  const codeKey = normalizeCode(code);
  if (codeKey.includes('NAME')) {
    return 'Vehicle name';
  }
  if (codeKey.includes('COLOUR') || codeKey.includes('COLOR')) {
    return 'Colour';
  }
  if (codeKey.includes('NUMBER') || codeKey.includes('REGISTRATION')) {
    return 'Registration number';
  }
  if (codeKey.includes('INSURANCE')) {
    return 'Insurance';
  }
  return field?.trim() || 'Details';
};

const snapshotName = (snapshot?: VehicleRcRecordSnapshot | null): string => {
  if (!snapshot) {
    return '';
  }
  const composed = [snapshot.make, snapshot.model]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ');
  return (snapshot.vehicleName ?? '').trim() || composed;
};

export const buildRcFieldMatches = (
  vehicle: Pick<GarageVehicle, 'name' | 'color' | 'plateNumber'>,
  verification?: VehicleRcVerification | null,
): GarageRcFieldMatch[] => {
  if (!verification) {
    return [];
  }
  const snapshot = verification.rcRecord ?? verification.rcDetails ?? null;
  const checks = [
    ...(verification.checks ?? []),
    ...(verification.failedChecks ?? []),
    ...(verification.mismatches ?? []),
  ];
  const matches: GarageRcFieldMatch[] = [];

  const pushMatch = (item: GarageRcFieldMatch): void => {
    if (!item.entered && !item.rcRecord) {
      return;
    }
    const existing = matches.find(
      (row) => row.fieldLabel === item.fieldLabel && row.entered === item.entered,
    );
    if (existing) {
      existing.rcRecord = existing.rcRecord || item.rcRecord;
      existing.matched = existing.matched && item.matched;
      return;
    }
    matches.push(item);
  };

  const fromCheck = (check: VehicleRcCheck): void => {
    const entered = String(check.entered ?? '').trim();
    const rcRecord = String(check.rcRecord ?? check.rcValue ?? check.expected ?? '').trim();
    const matched = check.matched === true;
    if (!entered && !rcRecord && check.matched == null) {
      return;
    }
    pushMatch({
      fieldLabel: fieldLabelFor(check.field, check.code),
      entered,
      rcRecord,
      matched,
    });
  };
  checks.forEach(fromCheck);

  if (snapshot) {
    const rcName = snapshotName(snapshot);
    if (rcName) {
      pushMatch({
        fieldLabel: 'Vehicle name',
        entered: vehicle.name,
        rcRecord: rcName,
        matched: vehicle.name.trim().toLowerCase() === rcName.trim().toLowerCase(),
      });
    }
    const rcColor = (snapshot.color ?? '').trim();
    if (rcColor) {
      pushMatch({
        fieldLabel: 'Colour',
        entered: vehicle.color,
        rcRecord: rcColor,
        matched: vehicle.color.trim().toLowerCase() === rcColor.toLowerCase(),
      });
    }
    const rcPlate = (snapshot.registrationNumber ?? '').trim().toUpperCase();
    if (rcPlate) {
      pushMatch({
        fieldLabel: 'Registration number',
        entered: vehicle.plateNumber,
        rcRecord: rcPlate,
        matched: vehicle.plateNumber.replace(/\s+/g, '') === rcPlate.replace(/\s+/g, ''),
      });
    }
  }

  return matches;
};

export const applyRcVerificationToGarageVehicle = (
  vehicle: GarageVehicle,
  verification: VehicleRcVerification,
): GarageVehicle => {
  const status = resolveVehicleRcUiStatus({ verification });
  const messages =
    status === 'failed' ? collectVehicleRcFailureMessages(verification) : [];
  return {
    ...vehicle,
    rcStatus: status === 'required' && vehicle.rcStatus === 'verified' ? 'verified' : status,
    ownerMatchStatus: verification.ownerMatchStatus ?? vehicle.ownerMatchStatus,
    rcVerifiedAt:
      status === 'verified' ? verification.verifiedAt ?? vehicle.rcVerifiedAt : vehicle.rcVerifiedAt,
    lastRcVerificationStatus: verification.status,
    rcErrorMessages: messages.length > 0 ? messages : undefined,
    rcFieldMatches: buildRcFieldMatches(vehicle, verification),
  };
};

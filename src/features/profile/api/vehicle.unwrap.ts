type VehicleRow = { id: string };

export interface UnwrappedRcVerification {
  vehicleId: string;
  status: 'VERIFIED' | 'INVALID' | 'FAILED' | 'PENDING' | 'NOT_VERIFIED';
  vehicleNumber: string;
  [key: string]: unknown;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const isVehicleRow = (value: unknown): value is VehicleRow => {
  const row = asRecord(value);
  return Boolean(row && typeof row.id === 'string' && row.id.trim());
};

export const unwrapVehicle = <T extends VehicleRow = VehicleRow>(payload: unknown): T => {
  if (isVehicleRow(payload)) {
    return payload as T;
  }
  const root = asRecord(payload);
  const nested = root?.data ?? root?.vehicle;
  if (isVehicleRow(nested)) {
    return nested as T;
  }
  const nestedRecord = asRecord(nested);
  const inner = nestedRecord?.data ?? nestedRecord?.vehicle;
  if (isVehicleRow(inner)) {
    return inner as T;
  }
  return payload as T;
};

export const unwrapVehicleList = <T extends VehicleRow = VehicleRow>(
  payload: unknown,
): T[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isVehicleRow) as T[];
  }
  const root = asRecord(payload);
  if (!root) {
    return [];
  }
  const nested = root.data ?? root.vehicles ?? root.items ?? root.results;
  if (Array.isArray(nested)) {
    return nested.filter(isVehicleRow) as T[];
  }
  const nestedRecord = asRecord(nested);
  const inner = nestedRecord?.data ?? nestedRecord?.vehicles ?? nestedRecord?.items;
  if (Array.isArray(inner)) {
    return inner.filter(isVehicleRow) as T[];
  }
  return [];
};

const normalizeRcStatus = (
  value: unknown,
): UnwrappedRcVerification['status'] | null => {
  const status = String(value ?? '')
    .trim()
    .toUpperCase();
  if (
    status === 'VERIFIED' ||
    status === 'INVALID' ||
    status === 'FAILED' ||
    status === 'PENDING' ||
    status === 'NOT_VERIFIED'
  ) {
    return status;
  }
  return null;
};

export const unwrapVerifyVehicleRcResponse = (
  payload: unknown,
): { success: boolean; verification: UnwrappedRcVerification | null } => {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  const rawVerification = asRecord(data.verification) ?? (data.status ? data : null);
  if (!rawVerification) {
    return {
      success: data.success === true,
      verification: null,
    };
  }

  const vehicleId = String(rawVerification.vehicleId ?? rawVerification.id ?? '').trim();
  const status = normalizeRcStatus(rawVerification.status) ?? 'FAILED';
  const vehicleNumber = String(
    rawVerification.vehicleNumber ?? rawVerification.registrationNumber ?? '',
  ).trim();

  return {
    success: data.success === true || status === 'VERIFIED',
    verification: {
      ...rawVerification,
      vehicleId,
      status,
      vehicleNumber,
    },
  };
};

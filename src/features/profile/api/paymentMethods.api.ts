import { ENDPOINTS, httpClient } from '@/network';

import type {
  CreatePaymentMethodPayload,
  PaymentMethodDto,
  UpdatePaymentMethodPayload,
} from './paymentMethods.types';
import { asPaymentMethodType } from '../utils/paymentMethods.mapper';

export type {
  CreateBankPaymentMethodPayload,
  CreatePaymentMethodPayload,
  CreateUpiPaymentMethodPayload,
  PaymentMethodDto,
  PaymentMethodType,
  UpdatePaymentMethodPayload,
} from './paymentMethods.types';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asArray = (value: unknown): unknown[] | null =>
  Array.isArray(value) ? value : null;

const normalizePaymentMethod = (raw: unknown): PaymentMethodDto | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const id = String(row.id ?? row.paymentMethodId ?? '').trim();
  const type = asPaymentMethodType(row.type);
  if (!id || !type) {
    return null;
  }
  return {
    id,
    type,
    upiId: row.upiId != null ? String(row.upiId) : null,
    accountHolderName:
      row.accountHolderName != null ? String(row.accountHolderName) : null,
    accountNumberMasked:
      row.accountNumberMasked != null
        ? String(row.accountNumberMasked)
        : row.maskedAccountNumber != null
          ? String(row.maskedAccountNumber)
          : null,
    ifscCode: row.ifscCode != null ? String(row.ifscCode) : row.ifsc != null ? String(row.ifsc) : null,
    bankName: row.bankName != null ? String(row.bankName) : null,
    isActive: row.isActive !== false && row.status !== 'INACTIVE',
    createdAt: String(row.createdAt ?? ''),
    updatedAt: String(row.updatedAt ?? row.createdAt ?? ''),
  };
};

const unwrapPaymentMethods = (payload: unknown): PaymentMethodDto[] => {
  const direct = asArray(payload);
  if (direct) {
    return direct.map(normalizePaymentMethod).filter(Boolean) as PaymentMethodDto[];
  }
  const root = asRecord(payload);
  if (!root) {
    return [];
  }
  for (const key of ['items', 'paymentMethods', 'results', 'rows', 'data'] as const) {
    const list = asArray(root[key]);
    if (list) {
      return list.map(normalizePaymentMethod).filter(Boolean) as PaymentMethodDto[];
    }
  }
  const nested = asRecord(root.data);
  if (nested) {
    for (const key of ['items', 'paymentMethods', 'results', 'rows'] as const) {
      const list = asArray(nested[key]);
      if (list) {
        return list.map(normalizePaymentMethod).filter(Boolean) as PaymentMethodDto[];
      }
    }
  }
  const single = normalizePaymentMethod(payload);
  return single ? [single] : [];
};

const unwrapPaymentMethod = (payload: unknown): PaymentMethodDto => {
  const root = asRecord(payload);
  const nested = root ? asRecord(root.data) : null;
  const method = normalizePaymentMethod(nested ?? root ?? payload);
  if (!method) {
    throw new Error('Invalid payment method response');
  }
  return method;
};

/** GET /wallet/payment-methods */
export const listPaymentMethods = async (): Promise<PaymentMethodDto[]> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.wallet.paymentMethods);
  return unwrapPaymentMethods(payload);
};

/** GET /wallet/payment-methods/:id */
export const getPaymentMethod = async (id: string): Promise<PaymentMethodDto> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.wallet.paymentMethodById(id));
  return unwrapPaymentMethod(payload);
};

/** POST /wallet/payment-methods — UPI */
export const createUpiPaymentMethod = async (upiId: string): Promise<PaymentMethodDto> => {
  const payload = await httpClient.post<unknown>(ENDPOINTS.wallet.paymentMethods, {
    type: 'UPI',
    upiId: upiId.trim(),
  } satisfies CreatePaymentMethodPayload);
  return unwrapPaymentMethod(payload);
};

/** POST /wallet/payment-methods — Bank */
export const createBankPaymentMethod = async (input: {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}): Promise<PaymentMethodDto> => {
  const payload = await httpClient.post<unknown>(ENDPOINTS.wallet.paymentMethods, {
    type: 'BANK_ACCOUNT',
    accountHolderName: input.accountHolderName.trim(),
    accountNumber: input.accountNumber.trim(),
    ifscCode: input.ifscCode.trim().toUpperCase(),
    bankName: input.bankName.trim(),
  } satisfies CreatePaymentMethodPayload);
  return unwrapPaymentMethod(payload);
};

/** PATCH /wallet/payment-methods/:id */
export const updatePaymentMethod = async (
  id: string,
  body: UpdatePaymentMethodPayload,
): Promise<PaymentMethodDto> => {
  const payload = await httpClient.patch<unknown>(
    ENDPOINTS.wallet.paymentMethodById(id),
    body,
  );
  return unwrapPaymentMethod(payload);
};

/** DELETE /wallet/payment-methods/:id */
export const deletePaymentMethod = async (id: string): Promise<void> => {
  await httpClient.delete<unknown>(ENDPOINTS.wallet.paymentMethodById(id));
};

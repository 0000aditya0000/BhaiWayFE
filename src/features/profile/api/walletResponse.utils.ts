import type { TopUpOrderDto, TopUpOrderStatusDto } from './wallet.types';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const readStringField = (record: Record<string, unknown>, key: string): string | null => {
  const raw = record[key];
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(Math.trunc(raw));
  }
  return null;
};

const resolvePaymentOrderId = (record: Record<string, unknown> | null): string | null => {
  if (!record) {
    return null;
  }

  for (const key of ['paymentOrderId', 'orderId', 'id', '_id'] as const) {
    const value = readStringField(record, key);
    if (value) {
      return value;
    }
  }

  for (const nestedKey of ['paymentOrder', 'order', 'topUpOrder', 'result', 'data'] as const) {
    const nested = asRecord(record[nestedKey]);
    const nestedId = resolvePaymentOrderId(nested);
    if (nestedId) {
      return nestedId;
    }
  }

  return null;
};

const resolveMockInstructions = (
  record: Record<string, unknown>,
): TopUpOrderDto['mockInstructions'] | undefined => {
  const raw = asRecord(record.mockInstructions);
  if (!raw) {
    return undefined;
  }

  const callbackPath = readStringField(raw, 'callbackPath');
  const signatureHeader = readStringField(raw, 'signatureHeader');
  if (!callbackPath || !signatureHeader) {
    return undefined;
  }

  const note = readStringField(raw, 'note') ?? undefined;
  return { callbackPath, signatureHeader, note };
};

const mapTopUpOrderRecord = (record: Record<string, unknown>): TopUpOrderDto | null => {
  const paymentOrderId = resolvePaymentOrderId(record);
  if (!paymentOrderId) {
    return null;
  }

  const amount = readStringField(record, 'amount') ?? readStringField(record, 'amountCoins') ?? '0';
  const currency = readStringField(record, 'currency') ?? 'INR';
  const gatewayOrderId =
    readStringField(record, 'gatewayOrderId') ??
    readStringField(record, 'paymentReference') ??
    paymentOrderId;
  const status = readStringField(record, 'status') ?? 'PENDING';
  const provider = readStringField(record, 'provider') ?? undefined;
  const keyId = readStringField(record, 'keyId') ?? undefined;

  return {
    orderId: paymentOrderId,
    paymentOrderId,
    status,
    amount,
    currency,
    gatewayOrderId,
    keyId,
    provider,
    paymentReference: readStringField(record, 'paymentReference'),
    mockInstructions: resolveMockInstructions(record),
  };
};

const collectTopUpCandidates = (payload: unknown): Record<string, unknown>[] => {
  const candidates: Record<string, unknown>[] = [];
  const root = asRecord(payload);
  if (!root) {
    return candidates;
  }

  candidates.push(root);

  for (const key of ['data', 'result', 'paymentOrder', 'order', 'topUpOrder'] as const) {
    const nested = asRecord(root[key]);
    if (nested) {
      candidates.push(nested);
    }
  }

  return candidates;
};

export const unwrapTopUpOrder = (payload: unknown): TopUpOrderDto => {
  for (const candidate of collectTopUpCandidates(payload)) {
    const mapped = mapTopUpOrderRecord(candidate);
    if (mapped) {
      return mapped;
    }
  }

  const root = asRecord(payload);
  const keys = root ? Object.keys(root).join(', ') : 'non-object payload';
  throw new Error(`Invalid top-up order response (${keys})`);
};

export const unwrapTopUpOrderStatus = (payload: unknown): TopUpOrderStatusDto => {
  const order = unwrapTopUpOrder(payload);
  return {
    orderId: order.orderId,
    paymentOrderId: order.paymentOrderId,
    status: order.status,
    amount: order.amount,
    currency: order.currency,
    gatewayOrderId: order.gatewayOrderId,
  };
};

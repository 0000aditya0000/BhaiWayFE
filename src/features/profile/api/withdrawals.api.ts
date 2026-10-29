import { ENDPOINTS, httpClient } from '@/network';

import { asPaymentMethodType } from '../utils/paymentMethods.mapper';
import { asWithdrawalStatus } from '../utils/withdrawals.mapper';
import type {
  CreateWithdrawalPayload,
  ListWithdrawalsQuery,
  WithdrawalDto,
  WithdrawalPaymentMethodSnapshot,
  WithdrawalsPageDto,
} from './withdrawals.types';

export type {
  CreateWithdrawalPayload,
  ListWithdrawalsQuery,
  WithdrawalDto,
  WithdrawalPaymentMethodSnapshot,
  WithdrawalStatus,
  WithdrawalsPageDto,
} from './withdrawals.types';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asArray = (value: unknown): unknown[] | null =>
  Array.isArray(value) ? value : null;

const normalizeSnapshot = (raw: unknown): WithdrawalPaymentMethodSnapshot | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const type = asPaymentMethodType(row.type);
  if (!type) {
    return null;
  }
  return {
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
    ifscCode:
      row.ifscCode != null ? String(row.ifscCode) : row.ifsc != null ? String(row.ifsc) : null,
    bankName: row.bankName != null ? String(row.bankName) : null,
  };
};

const normalizeWithdrawal = (raw: unknown): WithdrawalDto | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const id = String(row.id ?? row.withdrawalId ?? '').trim();
  if (!id) {
    return null;
  }
  const amountRaw = row.amount ?? row.amountCoins ?? '0';
  const amount = String(amountRaw).trim();
  const snapshot =
    normalizeSnapshot(row.paymentMethod) ??
    normalizeSnapshot(row.paymentMethodSnapshot) ??
    null;

  return {
    id,
    amount,
    status: asWithdrawalStatus(row.status),
    reference:
      row.reference != null
        ? String(row.reference)
        : row.referenceNumber != null
          ? String(row.referenceNumber)
          : null,
    paymentMethodId:
      row.paymentMethodId != null ? String(row.paymentMethodId) : null,
    paymentMethod: snapshot,
    requestedAt:
      row.requestedAt != null
        ? String(row.requestedAt)
        : row.createdAt != null
          ? String(row.createdAt)
          : null,
    processingAt: row.processingAt != null ? String(row.processingAt) : null,
    completedAt: row.completedAt != null ? String(row.completedAt) : null,
    failedAt: row.failedAt != null ? String(row.failedAt) : null,
    cancelledAt: row.cancelledAt != null ? String(row.cancelledAt) : null,
    createdAt: String(row.createdAt ?? row.requestedAt ?? ''),
    updatedAt: row.updatedAt != null ? String(row.updatedAt) : null,
  };
};

const unwrapWithdrawals = (payload: unknown): WithdrawalDto[] => {
  const direct = asArray(payload);
  if (direct) {
    return direct.map(normalizeWithdrawal).filter(Boolean) as WithdrawalDto[];
  }
  const root = asRecord(payload);
  if (!root) {
    return [];
  }
  for (const key of ['items', 'withdrawals', 'results', 'rows'] as const) {
    const list = asArray(root[key]);
    if (list) {
      return list.map(normalizeWithdrawal).filter(Boolean) as WithdrawalDto[];
    }
  }
  const nested = asRecord(root.data);
  if (nested) {
    for (const key of ['items', 'withdrawals', 'results', 'rows'] as const) {
      const list = asArray(nested[key]);
      if (list) {
        return list.map(normalizeWithdrawal).filter(Boolean) as WithdrawalDto[];
      }
    }
  }
  const single = normalizeWithdrawal(payload);
  return single ? [single] : [];
};

const unwrapWithdrawal = (payload: unknown): WithdrawalDto => {
  const root = asRecord(payload);
  const nested = root ? asRecord(root.data) : null;
  const withdrawal = normalizeWithdrawal(nested ?? root ?? payload);
  if (!withdrawal) {
    throw new Error('Invalid withdrawal response');
  }
  return withdrawal;
};

const normalizePage = (
  payload: unknown,
  query: ListWithdrawalsQuery,
  items: WithdrawalDto[],
): WithdrawalsPageDto => {
  const limit = Math.max(1, Math.floor(query.limit ?? 20));
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const root = asRecord(payload);
  const nested = root ? asRecord(root.data) : null;
  const source = nested ?? root;
  const totalRaw = source?.total;
  const total =
    typeof totalRaw === 'number' && Number.isFinite(totalRaw) ? totalRaw : items.length;
  const totalPagesRaw = source?.totalPages;
  const totalPages =
    typeof totalPagesRaw === 'number' && Number.isFinite(totalPagesRaw)
      ? Math.max(1, totalPagesRaw)
      : Math.max(1, Math.ceil(total / limit));

  return {
    items,
    page: typeof source?.page === 'number' ? source.page : page,
    limit: typeof source?.limit === 'number' ? source.limit : limit,
    total,
    totalPages,
  };
};

/** POST /wallet/withdraw — amount + paymentMethodId only; Idempotency-Key header required. */
export const createWithdrawal = async (
  body: CreateWithdrawalPayload,
  idempotencyKey: string,
): Promise<WithdrawalDto> => {
  const amount =
    typeof body.amount === 'number' ? String(Math.trunc(body.amount)) : String(body.amount).trim();
  const payload = await httpClient.post<unknown>(
    ENDPOINTS.wallet.withdraw,
    {
      amount: Number.parseInt(amount, 10),
      paymentMethodId: body.paymentMethodId.trim(),
    },
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    },
  );
  return unwrapWithdrawal(payload);
};

/** GET /wallet/withdrawals */
export const listWithdrawals = async (
  query: ListWithdrawalsQuery = {},
): Promise<WithdrawalsPageDto> => {
  const params = new URLSearchParams();
  params.set('page', String(Math.max(1, Math.floor(query.page ?? 1))));
  params.set(
    'limit',
    String(Math.max(1, Math.min(50, Math.floor(query.limit ?? 20)))),
  );
  const payload = await httpClient.get<unknown>(
    `${ENDPOINTS.wallet.withdrawals}?${params.toString()}`,
  );
  const items = unwrapWithdrawals(payload);
  return normalizePage(payload, query, items);
};

/** GET /wallet/withdrawals/:id */
export const getWithdrawal = async (id: string): Promise<WithdrawalDto> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.wallet.withdrawalById(id));
  return unwrapWithdrawal(payload);
};

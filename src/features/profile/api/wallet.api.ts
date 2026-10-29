import { env } from '@/config';
import { ENDPOINTS, httpClient } from '@/network';
import { logger } from '@/shared/utils';

import type {
  CreateTopUpDto,
  ListWalletTransactionsQuery,
  TopUpCallbackDto,
  TopUpOrderDto,
  TopUpOrderStatusDto,
  VerifyTopUpDto,
  WalletBalanceDto,
  WalletTransactionDto,
  WalletTransactionsPageDto,
} from './wallet.types';
import { buildSignedTopUpCallback } from '../utils/paymentCallbackSignature';
import {
  normalizeWalletTransactionList,
} from './walletTransaction.utils';
import { unwrapTopUpOrder, unwrapTopUpOrderStatus } from './walletResponse.utils';

export { normalizeWalletTransactionDto, normalizeWalletTransactionList } from './walletTransaction.utils';
export { unwrapTopUpOrder, unwrapTopUpOrderStatus } from './walletResponse.utils';

export type {
  CreateTopUpDto,
  ListWalletTransactionsQuery,
  TopUpCallbackDto,
  TopUpOrderDto,
  TopUpOrderStatusDto,
  VerifyTopUpDto,
  WalletBalanceDto,
  WalletBucketDto,
  WalletBucketsDto,
  WalletDisplayCategory,
  WalletPointSource,
  WalletTransactionDirection,
  WalletTransactionDto,
  WalletTransactionStatus,
  WalletTransactionsPageDto,
  TopUpOrderStatus,
} from './wallet.types';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asItemArray = (value: unknown): unknown[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }
  return value;
};

export const unwrapWalletTransactions = (payload: unknown): WalletTransactionDto[] => {
  const direct = asItemArray(payload);
  if (direct) {
    return normalizeWalletTransactionList(direct);
  }

  const root = asRecord(payload);
  if (!root) {
    return [];
  }

  for (const key of ['items', 'transactions', 'results', 'rows'] as const) {
    const list = asItemArray(root[key]);
    if (list) {
      return normalizeWalletTransactionList(list);
    }
  }

  const nested = asRecord(root.data);
  if (nested) {
    for (const key of ['items', 'transactions', 'results', 'rows'] as const) {
      const list = asItemArray(nested[key]);
      if (list) {
        return normalizeWalletTransactionList(list);
      }
    }
  }

  return [];
};

export const unwrapWalletBalance = (payload: unknown): WalletBalanceDto => {
  const root = asRecord(payload);
  const nested = root ? asRecord(root.data) : null;
  const candidate = (nested ?? root) as WalletBalanceDto | null;
  if (!candidate || typeof candidate.balanceCoins !== 'string') {
    throw new Error('Invalid wallet balance response');
  }
  return candidate;
};

const normalizeTransactionsPage = (
  payload: unknown,
  query: ListWalletTransactionsQuery,
  items: WalletTransactionDto[],
): WalletTransactionsPageDto => {
  const limit = Math.max(1, Math.floor(query.limit ?? 20));
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const root = asRecord(payload);
  const nested = root ? asRecord(root.data) : null;
  const source = nested ?? root;

  const totalRaw = source?.total;
  const total =
    typeof totalRaw === 'number' && Number.isFinite(totalRaw)
      ? totalRaw
      : items.length;
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

const buildTransactionsQuery = (query: ListWalletTransactionsQuery): string => {
  const params = new URLSearchParams();
  params.set('page', String(Math.max(1, Math.floor(query.page ?? 1))));
  params.set('limit', String(Math.max(1, Math.min(50, Math.floor(query.limit ?? 20)))));
  if (query.transactionType?.trim()) {
    params.set('transactionType', query.transactionType.trim());
  }
  if (query.from?.trim()) {
    params.set('from', query.from.trim());
  }
  if (query.to?.trim()) {
    params.set('to', query.to.trim());
  }
  return `${ENDPOINTS.wallet.transactions}?${params.toString()}`;
};

/** GET /wallet */
export const getWalletBalance = async (): Promise<WalletBalanceDto> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.wallet.balance);
  return unwrapWalletBalance(payload);
};

/** GET /wallet/transactions */
export const listWalletTransactions = async (
  query: ListWalletTransactionsQuery = {},
): Promise<WalletTransactionsPageDto> => {
  const payload = await httpClient.get<unknown>(buildTransactionsQuery(query));
  const items = unwrapWalletTransactions(payload);
  return normalizeTransactionsPage(payload, query, items);
};

/** POST /wallet/top-up
 * Body: { amount } only — backend DTO rejects unknown properties (NestJS whitelist validation).
 * Idempotency key is sent exclusively via the Idempotency-Key request header.
 */
export const createTopUpOrder = async (
  body: CreateTopUpDto,
  idempotencyKey: string,
): Promise<TopUpOrderDto> => {
  const payload = await httpClient.post<unknown>(
    ENDPOINTS.wallet.topUp,
    { amount: body.amount },
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    },
  );
  return unwrapTopUpOrder(payload);
};

/** POST /wallet/top-up/verify — client verification endpoint after Razorpay checkout (Bearer JWT). */
export const verifyTopUpPayment = async (
  dto: VerifyTopUpDto,
): Promise<TopUpOrderDto> => {
  const payload = await httpClient.post<unknown>(ENDPOINTS.wallet.topUpVerify, dto);
  return unwrapTopUpOrder(payload);
};

/** GET /wallet/top-up/:orderId */
export const getTopUpOrderStatus = async (orderId: string): Promise<TopUpOrderStatusDto> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.wallet.topUpById(orderId));
  return unwrapTopUpOrderStatus(payload);
};

/** POST /wallet/top-up/callback — mock gateway webhook (HMAC only, no JWT). */
export const postTopUpCallback = async (
  body: TopUpCallbackDto,
  signatureHeader: string,
  webhookSecret: string,
): Promise<void> => {
  const { bodyString, canonicalMessage, signature } = buildSignedTopUpCallback(body, webhookSecret);
  const headerName = signatureHeader.trim() || 'x-payment-signature';
  if (env.enableLogging) {
    logger.debug('[Wallet] mock callback', {
      header: headerName,
      canonicalMessage,
      gatewayOrderId: body.gatewayOrderId,
      status: body.status,
      signaturePrefix: `${signature.slice(0, 12)}…`,
    });
  }
  await httpClient.post<unknown>(ENDPOINTS.wallet.topUpCallback, bodyString, {
    skipAuth: true,
    headers: {
      [headerName]: signature,
      'Content-Type': 'application/json',
    },
  });
};

export const mapWalletApiError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim();
    if (message) {
      return message;
    }
  }
  return 'Something went wrong. Please try again.';
};

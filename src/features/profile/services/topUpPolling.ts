import { getTopUpOrderStatus, type TopUpOrderStatusDto } from '../api/wallet.api';

export type TopUpPollResult =
  | { status: 'SUCCESS'; order: TopUpOrderStatusDto }
  | { status: 'FAILED'; order: TopUpOrderStatusDto }
  | { status: 'CANCELLED'; order: TopUpOrderStatusDto }
  | { status: 'TIMEOUT'; order: TopUpOrderStatusDto | null };

export interface PollTopUpOptions {
  orderId: string;
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

const TERMINAL = new Set(['SUCCESS', 'FAILED', 'CANCELLED']);

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new Error('Aborted'));
      },
      { once: true },
    );
  });

/** Poll GET /wallet/top-up/:orderId until terminal status or timeout. */
export const pollTopUpOrderStatus = async (
  options: PollTopUpOptions,
): Promise<TopUpPollResult> => {
  const intervalMs = options.intervalMs ?? 1500;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const startedAt = Date.now();
  let lastOrder: TopUpOrderStatusDto | null = null;

  while (Date.now() - startedAt < timeoutMs) {
    if (options.signal?.aborted) {
      return { status: 'TIMEOUT', order: lastOrder };
    }

    const order = await getTopUpOrderStatus(options.orderId);
    lastOrder = order;
    const status = String(order.status ?? '').toUpperCase();

    if (status === 'SUCCESS') {
      return { status: 'SUCCESS', order };
    }
    if (status === 'FAILED') {
      return { status: 'FAILED', order };
    }
    if (status === 'CANCELLED') {
      return { status: 'CANCELLED', order };
    }

    if (!TERMINAL.has(status) && status !== 'PENDING') {
      // Unknown non-terminal — keep polling briefly.
    }

    await sleep(intervalMs, options.signal);
  }

  return { status: 'TIMEOUT', order: lastOrder };
};

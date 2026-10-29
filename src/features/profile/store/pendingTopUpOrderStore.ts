import type { TopUpOrderDto } from '../api/wallet.types';

/** In-memory pending order between Add Coins and Top Up Payment (avoids route param loss). */
let pendingOrder: TopUpOrderDto | null = null;

export const pendingTopUpOrderStore = {
  set: (order: TopUpOrderDto): void => {
    pendingOrder = order;
  },

  getByPaymentOrderId: (paymentOrderId: string): TopUpOrderDto | null => {
    if (!pendingOrder || pendingOrder.paymentOrderId !== paymentOrderId) {
      return null;
    }
    return pendingOrder;
  },

  clear: (): void => {
    pendingOrder = null;
  },
};

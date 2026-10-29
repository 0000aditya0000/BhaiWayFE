import type { PaymentMethodType } from './paymentMethods.types';

export type WithdrawalStatus =
  | 'INITIATED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

/** Snapshot stored with the withdrawal — historical, not live payment method. */
export interface WithdrawalPaymentMethodSnapshot {
  type: PaymentMethodType;
  upiId?: string | null;
  accountHolderName?: string | null;
  accountNumberMasked?: string | null;
  ifscCode?: string | null;
  bankName?: string | null;
}

export interface WithdrawalDto {
  id: string;
  amount: string;
  status: WithdrawalStatus;
  reference?: string | null;
  paymentMethodId?: string | null;
  paymentMethod?: WithdrawalPaymentMethodSnapshot | null;
  requestedAt?: string | null;
  processingAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateWithdrawalPayload {
  amount: number | string;
  paymentMethodId: string;
}

export interface WithdrawalsPageDto {
  items: WithdrawalDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListWithdrawalsQuery {
  page?: number;
  limit?: number;
}

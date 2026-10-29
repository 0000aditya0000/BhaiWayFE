export type PaymentMethodType = 'UPI' | 'BANK_ACCOUNT';

export interface PaymentMethodDto {
  id: string;
  type: PaymentMethodType;
  upiId?: string | null;
  accountHolderName?: string | null;
  accountNumberMasked?: string | null;
  ifscCode?: string | null;
  bankName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUpiPaymentMethodPayload {
  type: 'UPI';
  upiId: string;
}

export interface CreateBankPaymentMethodPayload {
  type: 'BANK_ACCOUNT';
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export type CreatePaymentMethodPayload =
  | CreateUpiPaymentMethodPayload
  | CreateBankPaymentMethodPayload;

export interface UpdatePaymentMethodPayload {
  upiId?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  isActive?: boolean;
}

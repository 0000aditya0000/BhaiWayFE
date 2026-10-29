import { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  createBankPaymentMethod,
  createUpiPaymentMethod,
} from '../api/paymentMethods.api';
import { ADD_PAYMENT_METHOD_SCREEN } from '../constants/payment-methods.constants';
import {
  mapPaymentMethodError,
  validateBankForm,
  validateUpiForm,
} from '../utils/paymentMethods.mapper';
import { triggerLightHaptic, triggerSuccessHaptic, showAppAlert } from '@/shared/utils';

export type AddPaymentMethodStep = 'choose' | 'UPI' | 'BANK_ACCOUNT';

export interface UseAddPaymentMethodResult {
  title: string;
  step: AddPaymentMethodStep;
  upiId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  fieldError: string | null;
  submitting: boolean;
  setUpiId: (value: string) => void;
  setAccountHolderName: (value: string) => void;
  setBankName: (value: string) => void;
  setAccountNumber: (value: string) => void;
  setConfirmAccountNumber: (value: string) => void;
  setIfscCode: (value: string) => void;
  chooseUpi: () => void;
  chooseBank: () => void;
  goBack: () => void;
  submitUpi: () => void;
  submitBank: () => void;
}

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export const useAddPaymentMethod = (): UseAddPaymentMethodResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string | string[]; returnTo?: string | string[] }>();
  const initialType = getParam(params.type).toUpperCase();
  const returnTo = getParam(params.returnTo);

  const [step, setStep] = useState<AddPaymentMethodStep>(
    initialType === 'UPI' || initialType === 'BANK_ACCOUNT' ? initialType : 'choose',
  );
  const [upiId, setUpiIdState] = useState('');
  const [accountHolderName, setAccountHolderNameState] = useState('');
  const [bankName, setBankNameState] = useState('');
  const [accountNumber, setAccountNumberState] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumberState] = useState('');
  const [ifscCode, setIfscCodeState] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const successRoute = useMemo(() => {
    if (returnTo === 'withdraw') {
      return ROUTES.withdraw;
    }
    return ROUTES.paymentMethods;
  }, [returnTo]);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (step !== 'choose' && !initialType) {
      setStep('choose');
      setFieldError(null);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(successRoute);
  }, [initialType, router, step, successRoute]);

  const finishSuccess = useCallback(() => {
    triggerSuccessHaptic();
    showAppAlert(
      ADD_PAYMENT_METHOD_SCREEN.successTitle,
      ADD_PAYMENT_METHOD_SCREEN.successMessage,
    );
    router.replace(successRoute);
  }, [router, successRoute]);

  const chooseUpi = useCallback(() => {
    triggerLightHaptic();
    setFieldError(null);
    setStep('UPI');
  }, []);

  const chooseBank = useCallback(() => {
    triggerLightHaptic();
    setFieldError(null);
    setStep('BANK_ACCOUNT');
  }, []);

  const submitUpi = useCallback(() => {
    if (submitting) {
      return;
    }
    const validated = validateUpiForm(upiId);
    if (!validated.ok) {
      setFieldError(validated.message);
      return;
    }
    triggerLightHaptic();
    setSubmitting(true);
    setFieldError(null);
    void (async () => {
      try {
        await createUpiPaymentMethod(validated.upiId);
        finishSuccess();
      } catch (err) {
        setFieldError(mapPaymentMethodError(err));
      } finally {
        setSubmitting(false);
      }
    })();
  }, [finishSuccess, submitting, upiId]);

  const submitBank = useCallback(() => {
    if (submitting) {
      return;
    }
    const validated = validateBankForm({
      accountHolderName,
      bankName,
      accountNumber,
      confirmAccountNumber,
      ifscCode,
    });
    if (!validated.ok) {
      setFieldError(validated.message);
      return;
    }
    triggerLightHaptic();
    setSubmitting(true);
    setFieldError(null);
    void (async () => {
      try {
        await createBankPaymentMethod({
          accountHolderName: validated.accountHolderName,
          bankName: validated.bankName,
          accountNumber: validated.accountNumber,
          ifscCode: validated.ifscCode,
        });
        // Clear sensitive local form state after success.
        setAccountNumberState('');
        setConfirmAccountNumberState('');
        finishSuccess();
      } catch (err) {
        setFieldError(mapPaymentMethodError(err));
      } finally {
        setSubmitting(false);
      }
    })();
  }, [
    accountHolderName,
    accountNumber,
    bankName,
    confirmAccountNumber,
    finishSuccess,
    ifscCode,
    submitting,
  ]);

  return {
    title: ADD_PAYMENT_METHOD_SCREEN.title,
    step,
    upiId,
    accountHolderName,
    bankName,
    accountNumber,
    confirmAccountNumber,
    ifscCode,
    fieldError,
    submitting,
    setUpiId: (value) => {
      setFieldError(null);
      setUpiIdState(value);
    },
    setAccountHolderName: (value) => {
      setFieldError(null);
      setAccountHolderNameState(value);
    },
    setBankName: (value) => {
      setFieldError(null);
      setBankNameState(value);
    },
    setAccountNumber: (value) => {
      setFieldError(null);
      setAccountNumberState(value);
    },
    setConfirmAccountNumber: (value) => {
      setFieldError(null);
      setConfirmAccountNumberState(value);
    },
    setIfscCode: (value) => {
      setFieldError(null);
      setIfscCodeState(value.toUpperCase());
    },
    chooseUpi,
    chooseBank,
    goBack,
    submitUpi,
    submitBank,
  };
};

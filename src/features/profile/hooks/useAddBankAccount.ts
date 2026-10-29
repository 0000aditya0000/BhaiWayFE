import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { bankAccountsSheetStore, bankAccountsSheetSync } from '@/DemoData';
import { useSessionUser } from '@/shared/hooks';
import { delay, getSearchParam, triggerLightHaptic, triggerSuccessHaptic, showAppAlert } from '@/shared/utils';
import { DEFAULT_PROFILE_AVATAR } from '../constants/profile.constants';
import {
  ADD_BANK_ACCOUNT_SCREEN,
  IFSC_PATTERN,
} from '../constants/add-bank-account.constants';
import type {
  AddBankAccountForm,
  AddBankAccountSubmitState,
} from '../types';

const INITIAL_FORM: AddBankAccountForm = {
  holderName: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
};

export interface UseAddBankAccountResult {
  form: AddBankAccountForm;
  submitState: AddBankAccountSubmitState;
  avatarUri: string;
  isEditMode: boolean;
  screenTitle: string;
  screenSubtitle: string;
  setHolderName: (value: string) => void;
  setBankName: (value: string) => void;
  setAccountNumber: (value: string) => void;
  setIfsc: (value: string) => void;
  findIfsc: () => void;
  submit: () => Promise<void>;
  goBack: () => void;
  openProfile: () => void;
}

export const useAddBankAccount = (): UseAddBankAccountResult => {
  const router = useRouter();
  const user = useSessionUser();
  const params = useLocalSearchParams<{
    mode?: string;
    bankAccountId?: string;
    returnTo?: string;
  }>();
  const [form, setForm] = useState<AddBankAccountForm>(INITIAL_FORM);
  const [submitState, setSubmitState] = useState<AddBankAccountSubmitState>('idle');
  const [prefilled, setPrefilled] = useState(false);

  const isEditMode = getSearchParam(params.mode) === 'edit';
  const bankAccountId = Number(getSearchParam(params.bankAccountId) || '0');
  const returnToPaymentMethods = getSearchParam(params.returnTo) === 'payment-methods';

  const avatarUri = useMemo(
    () => user?.avatarUri ?? DEFAULT_PROFILE_AVATAR,
    [user?.avatarUri],
  );

  const screenTitle = isEditMode
    ? ADD_BANK_ACCOUNT_SCREEN.editTitle
    : ADD_BANK_ACCOUNT_SCREEN.title;

  const screenSubtitle = isEditMode
    ? ADD_BANK_ACCOUNT_SCREEN.editSubtitle
    : ADD_BANK_ACCOUNT_SCREEN.subtitle;

  useEffect(() => {
    if (!isEditMode || !bankAccountId || prefilled) {
      return;
    }

    const existing = bankAccountsSheetStore.findByBankAccountId(bankAccountId);
    if (!existing) {
      return;
    }

    setForm({
      holderName: existing.holderName,
      bankName: existing.bankName,
      accountNumber: existing.accountNumber,
      ifsc: existing.ifsc,
    });
    setPrefilled(true);
  }, [bankAccountId, isEditMode, prefilled]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (returnToPaymentMethods) {
      router.replace(ROUTES.paymentMethods);
      return;
    }
    router.replace(ROUTES.withdraw);
  }, [returnToPaymentMethods, router]);

  const openProfile = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.profile);
  }, [router]);

  const setHolderName = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, holderName: value }));
  }, []);

  const setBankName = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, bankName: value }));
  }, []);

  const setAccountNumber = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 18);
    setForm((prev) => ({ ...prev, accountNumber: cleaned }));
  }, []);

  const setIfsc = useCallback((value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11);
    setForm((prev) => ({ ...prev, ifsc: cleaned }));
  }, []);

  const findIfsc = useCallback(() => {
    triggerLightHaptic();
    showAppAlert(ADD_BANK_ACCOUNT_SCREEN.findTitle, ADD_BANK_ACCOUNT_SCREEN.findMessage);
  }, []);

  const submit = useCallback(async () => {
    if (submitState !== 'idle') {
      return;
    }

    triggerLightHaptic();

    const holderName = form.holderName.trim();
    const bankName = form.bankName.trim();
    const accountNumber = form.accountNumber.trim();
    const ifsc = form.ifsc.trim().toUpperCase();

    if (!holderName || !bankName || !accountNumber || !ifsc) {
      showAppAlert(
        ADD_BANK_ACCOUNT_SCREEN.validationTitle,
        ADD_BANK_ACCOUNT_SCREEN.validationMessage,
      );
      return;
    }

    if (accountNumber.length < 9) {
      showAppAlert(
        ADD_BANK_ACCOUNT_SCREEN.invalidAccountTitle,
        ADD_BANK_ACCOUNT_SCREEN.invalidAccountMessage,
      );
      return;
    }

    if (!IFSC_PATTERN.test(ifsc)) {
      showAppAlert(
        ADD_BANK_ACCOUNT_SCREEN.invalidIfscTitle,
        ADD_BANK_ACCOUNT_SCREEN.invalidIfscMessage,
      );
      return;
    }

    setSubmitState('submitting');
    try {
      const saved = await bankAccountsSheetSync.upsertAndSync({
        bankAccountId: isEditMode && bankAccountId > 0 ? bankAccountId : undefined,
        holderName,
        bankName,
        accountNumber,
        ifsc,
        accountType: 'Savings Account',
      });

      setSubmitState('success');
      triggerSuccessHaptic();
      await delay(600);

      if (isEditMode || returnToPaymentMethods) {
        router.replace(ROUTES.paymentMethods);
        return;
      }

      const maskedNumber = `•••• ${accountNumber.slice(-4)}`;
      router.replace({
        pathname: ROUTES.bankAccountAdded,
        params: {
          kind: 'bank-account-added',
          bankName,
          maskedNumber,
          bankAccountId: String(saved.bankAccountId),
        },
      });
    } catch (error) {
      setSubmitState('idle');
      showAppAlert(
        'Could not save',
        error instanceof Error ? error.message : 'Unable to save bank account. Please try again.',
      );
    }
  }, [
    bankAccountId,
    form,
    isEditMode,
    returnToPaymentMethods,
    router,
    submitState,
  ]);

  return {
    form,
    submitState,
    avatarUri,
    isEditMode,
    screenTitle,
    screenSubtitle,
    setHolderName,
    setBankName,
    setAccountNumber,
    setIfsc,
    findIfsc,
    submit,
    goBack,
    openProfile,
  };
};

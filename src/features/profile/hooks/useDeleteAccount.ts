import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { unregisterCurrentPushDevice } from '@/features/notifications/push/pushRegistration';
import { triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { authSession, showAppAlert } from '@/store';
import { DELETE_ACCOUNT_REASONS, DELETE_ACCOUNT_SCREEN } from '../constants';
import type { DeleteAccountReason, DeleteAccountReasonId } from '../types';

export interface UseDeleteAccountResult {
  reasons: readonly DeleteAccountReason[];
  selectedReason: DeleteAccountReasonId | null;
  feedback: string;
  selectReason: (id: DeleteAccountReasonId) => void;
  setFeedback: (value: string) => void;
  goBack: () => void;
  openNotifications: () => void;
  keepAccount: () => void;
  deleteAccount: () => void;
}

export const useDeleteAccount = (): UseDeleteAccountResult => {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState<DeleteAccountReasonId | null>(null);
  const [feedback, setFeedback] = useState('');

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.legalPolicies);
  }, [router]);

  const openNotifications = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.notifications);
  }, [router]);

  const selectReason = useCallback((id: DeleteAccountReasonId) => {
    triggerLightHaptic();
    setSelectedReason(id);
  }, []);

  const keepAccount = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const deleteAccount = useCallback(() => {
    triggerLightHaptic();
    showAppAlert(DELETE_ACCOUNT_SCREEN.confirmTitle, DELETE_ACCOUNT_SCREEN.confirmMessage, [
      { text: DELETE_ACCOUNT_SCREEN.confirmCancel, style: 'cancel' },
      {
        text: DELETE_ACCOUNT_SCREEN.confirmAction,
        style: 'destructive',
        onPress: () => {
          triggerSuccessHaptic();
          void (async () => {
            await unregisterCurrentPushDevice();
            authSession.clear();
            router.replace(ROUTES.accountDeleted);
          })();
        },
      },
    ]);
  }, [router]);

  return {
    reasons: DELETE_ACCOUNT_REASONS,
    selectedReason,
    feedback,
    selectReason,
    setFeedback,
    goBack,
    openNotifications,
    keepAccount,
    deleteAccount,
  };
};

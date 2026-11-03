import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { triggerLightHaptic } from '@/shared/utils';
import { DELETION_REASONS, type DeletionReasonItem } from '../constants';
import type { DeletionReason } from '../api/accountDeletion.types';

export interface UseDeleteAccountResult {
  reasons: readonly DeletionReasonItem[];
  selectedReasonId: string | null;
  selectedReason: DeletionReasonItem | null;
  feedback: string;
  canContinue: boolean;
  selectReason: (id: string) => void;
  setFeedback: (value: string) => void;
  goBack: () => void;
  continueToConfirm: () => void;
}

export const useDeleteAccount = (): UseDeleteAccountResult => {
  const router = useRouter();
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const selectedReason = useMemo(
    () => DELETION_REASONS.find((item) => item.id === selectedReasonId) ?? null,
    [selectedReasonId],
  );

  const canContinue = Boolean(selectedReason);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [router]);

  const selectReason = useCallback((id: string) => {
    triggerLightHaptic();
    setSelectedReasonId(id);
  }, []);

  const continueToConfirm = useCallback(() => {
    if (!selectedReason) {
      return;
    }
    triggerLightHaptic();
    router.push({
      pathname: ROUTES.deleteAccountConfirm,
      params: {
        reason: selectedReason.reason,
        reasonLabel: selectedReason.label,
        comment: feedback.trim(),
      },
    });
  }, [feedback, router, selectedReason]);

  return {
    reasons: DELETION_REASONS,
    selectedReasonId,
    selectedReason,
    feedback,
    canContinue,
    selectReason,
    setFeedback,
    goBack,
    continueToConfirm,
  };
};

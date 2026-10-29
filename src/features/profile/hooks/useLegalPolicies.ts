import { useCallback } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { triggerLightHaptic, showAppAlert } from '@/shared/utils';
import { LEGAL_POLICY_ITEMS, LEGAL_SCREEN } from '../constants';
import type { LegalPolicyId, LegalPolicyItem } from '../types';

export interface UseLegalPoliciesResult {
  items: readonly LegalPolicyItem[];
  goBack: () => void;
  openPolicy: (id: LegalPolicyId) => void;
}

export const useLegalPolicies = (): UseLegalPoliciesResult => {
  const router = useRouter();

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [router]);

  const openPolicy = useCallback((id: LegalPolicyId) => {
    triggerLightHaptic();
    const item = LEGAL_POLICY_ITEMS.find((policy) => policy.id === id);
    if (!item?.url) {
      return;
    }
    void Linking.openURL(item.url).catch(() => {
      showAppAlert(LEGAL_SCREEN.openFailedTitle, LEGAL_SCREEN.openFailedMessage);
    });
  }, []);

  return {
    items: LEGAL_POLICY_ITEMS,
    goBack,
    openPolicy,
  };
};

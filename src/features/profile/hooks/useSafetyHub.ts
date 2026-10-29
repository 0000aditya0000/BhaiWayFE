import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { triggerLightHaptic, showAppAlert } from '@/shared/utils';
import { listTrustedContacts } from '../api/trustedContacts.api';
import {
  SAFETY_HUB_SCREEN,
  SAFETY_REPORT_OPTIONS,
} from '../constants';
import { trustedContactsStore } from '../store';
import type { SafetyReportOption, TrustedContact } from '../types';
import { mapTrustedContactDtoToUi } from '../utils/trustedContacts.mapper';

export interface UseSafetyHubResult {
  contacts: readonly TrustedContact[];
  reportOptions: readonly SafetyReportOption[];
  goBack: () => void;
  openInfo: () => void;
  manageContacts: () => void;
  triggerSos: () => void;
  openReport: (id: string) => void;
}

export const useSafetyHub = (): UseSafetyHubResult => {
  const router = useRouter();
  const [contacts, setContacts] = useState<TrustedContact[]>(() => trustedContactsStore.get());

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = trustedContactsStore.subscribe(setContacts);
      void (async () => {
        try {
          const page = await listTrustedContacts({ page: 1, limit: 50 });
          const mapped = page.items.map(mapTrustedContactDtoToUi);
          trustedContactsStore.setAll(mapped);
        } catch {
          // Keep cached contacts if refresh fails; Safety Hub preview is non-blocking.
        }
      })();
      return unsubscribe;
    }, []),
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [router]);

  const openInfo = useCallback(() => {
    triggerLightHaptic();
    showAppAlert(SAFETY_HUB_SCREEN.infoTitle, SAFETY_HUB_SCREEN.infoMessage);
  }, []);

  const manageContacts = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.trustedContacts);
  }, [router]);

  const triggerSos = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.emergencyAssistance);
  }, [router]);

  const openReport = useCallback((_id: string) => {
    triggerLightHaptic();
    router.push(ROUTES.helpSupport);
  }, [router]);

  return {
    contacts,
    reportOptions: SAFETY_REPORT_OPTIONS,
    goBack,
    openInfo,
    manageContacts,
    triggerSos,
    openReport,
  };
};

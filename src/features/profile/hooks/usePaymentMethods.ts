import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  CACHE_STALE_TIMES,
  cacheKeys,
  invalidatePaymentMethodsCache,
  resourceCache,
} from '@/network/resourceCache';
import {
  deletePaymentMethod,
  listPaymentMethods,
  type PaymentMethodDto,
} from '../api/paymentMethods.api';
import {
  PAYMENT_METHODS_SCREEN,
  getAddPaymentMethodPath,
} from '../constants/payment-methods.constants';
import {
  mapPaymentMethodError,
  paymentMethodSubtitle,
  paymentMethodTitle,
} from '../utils/paymentMethods.mapper';
import { triggerLightHaptic, triggerSuccessHaptic, showAppAlert } from '@/shared/utils';

export interface UsePaymentMethodsResult {
  title: string;
  heroTitle: string;
  heroSubtitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  addLabel: string;
  methods: PaymentMethodDto[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  deletingId: string | null;
  goBack: () => void;
  refresh: () => Promise<void>;
  retry: () => void;
  addPaymentMethod: () => void;
  requestDelete: (method: PaymentMethodDto) => void;
  methodTitle: (method: PaymentMethodDto) => string;
  methodSubtitle: (method: PaymentMethodDto) => string;
}

export const usePaymentMethods = (): UsePaymentMethodsResult => {
  const router = useRouter();
  const [methods, setMethods] = useState<PaymentMethodDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    const force = mode === 'refresh';
    if (force) {
      setRefreshing(true);
    } else if (!resourceCache.peek(cacheKeys.paymentMethods.list())) {
      setLoading(true);
    }
    try {
      const result = await resourceCache.query<PaymentMethodDto[]>({
        key: cacheKeys.paymentMethods.list(),
        staleTime: CACHE_STALE_TIMES.PAYMENT_METHODS,
        force,
        fetcher: listPaymentMethods,
      });
      setMethods(result.data);
      setError(null);
    } catch (err) {
      const kept = resourceCache.peek<PaymentMethodDto[]>(cacheKeys.paymentMethods.list());
      if (kept) {
        setMethods(kept);
        setError(null);
      } else {
        setError(mapPaymentMethodError(err));
        if (mode === 'initial') {
          setMethods([]);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [router]);

  const addPaymentMethod = useCallback(() => {
    triggerLightHaptic();
    router.push(getAddPaymentMethodPath({ returnTo: 'payment-methods' }));
  }, [router]);

  const requestDelete = useCallback(
    (method: PaymentMethodDto) => {
      triggerLightHaptic();
      showAppAlert(
        PAYMENT_METHODS_SCREEN.removeTitle,
        PAYMENT_METHODS_SCREEN.removeMessage,
        [
          { text: PAYMENT_METHODS_SCREEN.removeCancel, style: 'cancel' },
          {
            text: PAYMENT_METHODS_SCREEN.removeConfirm,
            style: 'destructive',
            onPress: () => {
              void (async () => {
                setDeletingId(method.id);
                try {
                  await deletePaymentMethod(method.id);
                  invalidatePaymentMethodsCache();
                  triggerSuccessHaptic();
                  showAppAlert(
                    PAYMENT_METHODS_SCREEN.removedTitle,
                    PAYMENT_METHODS_SCREEN.removedMessage,
                  );
                  await load('refresh');
                } catch (err) {
                  showAppAlert('Unable to remove', mapPaymentMethodError(err));
                } finally {
                  setDeletingId(null);
                }
              })();
            },
          },
        ],
      );
    },
    [load],
  );

  return {
    title: PAYMENT_METHODS_SCREEN.title,
    heroTitle: PAYMENT_METHODS_SCREEN.heroTitle,
    heroSubtitle: PAYMENT_METHODS_SCREEN.heroSubtitle,
    emptyTitle: PAYMENT_METHODS_SCREEN.emptyTitle,
    emptySubtitle: PAYMENT_METHODS_SCREEN.emptySubtitle,
    addLabel: PAYMENT_METHODS_SCREEN.addLabel,
    methods,
    loading,
    refreshing,
    error,
    deletingId,
    goBack,
    refresh: () => load('refresh'),
    retry: () => {
      void load('initial');
    },
    addPaymentMethod,
    requestDelete,
    methodTitle: paymentMethodTitle,
    methodSubtitle: paymentMethodSubtitle,
  };
};

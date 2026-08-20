import { ROUTES } from '@/config';

import type { RatePassengersSummary } from '../types';

export const RATE_PASSENGERS_SCREEN = {
  brandName: 'BhaiWay',
  title: 'Review Your Passengers',
  subtitle: 'Your feedback helps maintain a safe and friendly community.',
  roleLabel: 'Co-Rider',
  submitLabel: 'Submit Reviews & Finish',
  submitHint: 'Ratings cannot be changed after submission',
  incompleteTitle: 'Rate all passengers',
  incompleteMessage: 'Please rate each passenger before submitting.',
  successTitle: 'Ratings submitted',
  successMessage: 'Thanks for helping keep the BhaiWay community safe.',
} as const;

export const getRatePassengersMock = (params?: {
  rideId?: string;
}): RatePassengersSummary => ({
  rideId: params?.rideId || 'driver-trip-1',
  passengers: [
    {
      id: 'p-amit',
      name: 'Amit R.',
      roleLabel: RATE_PASSENGERS_SCREEN.roleLabel,
      avatarUri:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBKDFb4_Mp3X12U306cLLAqIXNoDX1EKIf7q6XlnMGEAoxY6lDP3ApZqfaRkcHjxs1urjQPQ9Z0IUzYhMi5D51pyOei5axJ4FRprBlYe5oIfsoOekuiclYmNaKXwmaEHs6S3ivoMMxe_c65byisl2MIml2Om5xhl_hIut4fdJ5CwK_mfsqkMUd83sy1m8uVWFUfYxM4t1OVkamifBEw1hof8sZstZDeCdYWoZNkJ2j1EDHwNC_WG9SauI1lBfKmfklEOJEJOVBSxiA',
    },
    {
      id: 'p-priya',
      name: 'Priya S.',
      roleLabel: RATE_PASSENGERS_SCREEN.roleLabel,
      avatarUri:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD9IIkQCTfaOvcE2RCUf2nywXKHdxR8dO7UiK_3r41X6U4nRgEZyRPnkEHm-0zFsFpCrt19zxpVqqhxIPDBIlWxLxku_me8HGiwwZb7BEq66C3ipnL3hS_mqNj8BiHbvr_4o2UUThbxByq6cIoU0u1fvKfaAJj7gIPik39BC2eVXmGAyDpN7jne3klmHiGSPBlKPTpuAzwVFaTOBEmz2hACBKDLr3uw7pnrct7K_uIK-G0ZpREe2QzsucJ0f_a6cWdL_VSRXIIPKLI',
    },
    {
      id: 'p-rahul',
      name: 'Rahul K.',
      roleLabel: RATE_PASSENGERS_SCREEN.roleLabel,
      avatarUri: '',
    },
  ],
});

export const getRatePassengersPath = (params?: { rideId?: string }) => ({
  pathname: ROUTES.myRidesRatePassengers,
  params: {
    rideId: params?.rideId ?? '',
  },
});

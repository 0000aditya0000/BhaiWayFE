import React from 'react';

import { WarningCallout } from '@/shared/components';
import { RIDE_PREFERENCES_SCREEN } from '../../constants';
import { PaymentSummaryCard } from '../PaymentSummaryCard';
import { ScreenSection } from '../ScreenSection';
import type { AssuredPaymentBlockProps } from './AssuredPaymentBlock.types';

/**
 * Assured-only payment summary. Promo listing lives on the parent screen
 * so every publish flow can show driver coupons.
 */
export const AssuredPaymentBlock = ({
  refundableAmountLabel,
  totalToPayLabel,
}: AssuredPaymentBlockProps) => (
  <ScreenSection title={RIDE_PREFERENCES_SCREEN.paymentTitle}>
    <PaymentSummaryCard
      rows={[
        {
          label: RIDE_PREFERENCES_SCREEN.refundableLabel,
          value: refundableAmountLabel,
          hint: RIDE_PREFERENCES_SCREEN.refundableHint,
        },
      ]}
      totalLabel={RIDE_PREFERENCES_SCREEN.totalToPayLabel}
      totalValue={totalToPayLabel}
    />
    <WarningCallout
      prefix={RIDE_PREFERENCES_SCREEN.assuredNotePrefix}
      message={RIDE_PREFERENCES_SCREEN.assuredNote}
    />
  </ScreenSection>
);

import { ROUTES } from '@/config';
import { formatBhaiWayCoins } from '@/shared/utils';

import type { RideInvoiceSummary } from '../types';

export const RIDE_INVOICE_SCREEN = {
  title: 'Invoice',
  totalAmountLabel: 'Total Amount',
  invoiceIdLabel: 'Invoice ID:',
  dateLabel: 'Date:',
  tripDetailsTitle: 'Trip Details',
  pickupLabel: 'Pickup',
  dropoffLabel: 'Drop-off',
  driverDetailsTitle: 'Driver Details',
  verifiedLabel: 'VERIFIED',
  fareBreakdownTitle: 'Fare Breakdown',
  totalPaidLabel: 'Total Amount Paid',
  paymentMethodTitle: 'Payment Method',
  downloadPdfLabel: 'Download PDF',
  reportIssueLabel: 'Report Issue',
  downloadTitle: 'Download PDF',
  downloadMessage: 'Share or save your ride invoice.',
  reportTitle: 'Report Issue',
  reportMessage: 'Issue reporting will be available soon.',
} as const;

const RIDER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBl1XsTfgc4qK-1jg7A7Jz1gBvkFc5wQeGwbv1_-AepxHBwXA_UjSFcWPPNaf2EVlVF1Y2xJa60qqSlYp-LFVPnkXl0_9EdcvURASQRLQWA88-iC2rl_SFpF3cAw1VG4MvSUQt5hOdpt2OTfsfBJjhWrdvbRnseTtXR_H4k9BQfVHVGC9vKJjbnhenLvIAZ4R5CZgFHtfKKtM2eBP8ZcNAYsFYRot9j_JLZQx_782oQKL-WkwRO0LzGwUkvx657BiwV9VHfIerwZko';

const DRIVER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBGTHUIn7b-yyxS7ytJM-72_sV8czHP9HyAdhL1abpleCEWCpNDqHhZpGuKa_SyvAzUfViFZ7Jh7RSUmj5KHM7V5BMp6Q0WPm3FrPUk_a_PsOqWrneh7oebrvVnVL7SoRAmm3kooA-ecj1sfR0X8LfFKJNJxMbcd-Zh-gK6lfWqZ-KzzI9MaLruxYjOzkZwjXekpprjJgFZIfSVxerTTdqqywWnj9U4NyShM5vlpkR4ig4bTFwVhXSB3cypWcI6SklX2rJdvR94sqQ';

export const getRideInvoiceMock = (params?: {
  rideId?: string;
  pickupLabel?: string;
  dropoffLabel?: string;
  dateLabel?: string;
}): RideInvoiceSummary => {
  const pickupLabel = params?.pickupLabel?.trim() || 'Tech Park, Phase 1';
  const dropoffLabel = params?.dropoffLabel?.trim() || 'Greenwood Residency, Home';
  const dateLabel = params?.dateLabel?.trim() || 'Oct 22, 2023';

  return {
    id: params?.rideId?.trim() || 'invoice-1',
    invoiceId: 'INV-2023-1022',
    dateLabel,
    statusLabel: 'Ride Completed',
    totalAmountLabel: formatBhaiWayCoins(240, { spaced: false, minimumFractionDigits: 2 }),
    paidAmountLabel: formatBhaiWayCoins(210, { spaced: false, minimumFractionDigits: 2 }),
    pickupLabel,
    pickupTimeLabel: '09:15 AM',
    dropoffLabel,
    dropoffTimeLabel: '10:02 AM',
    driver: {
      name: 'Vikram Singh',
      vehicleLabel: 'White Maruti Suzuki Swift',
      plateNumber: 'KA 01 MG 1234',
      avatarUri: DRIVER_AVATAR,
      verified: true,
    },
    fareLines: [
      {
        id: 'fare',
        label: 'Ride Fare',
        amountLabel: formatBhaiWayCoins(210, { spaced: false, minimumFractionDigits: 2 }),
      },
      {
        id: 'platform',
        label: 'Platform Fee',
        amountLabel: formatBhaiWayCoins(15, { spaced: false, minimumFractionDigits: 2 }),
      },
      {
        id: 'gst',
        label: 'Taxes (GST)',
        amountLabel: formatBhaiWayCoins(15, { spaced: false, minimumFractionDigits: 2 }),
      },
      {
        id: 'promo',
        label: 'Promo Discount (WELCOME50)',
        amountLabel: `-${formatBhaiWayCoins(30, { spaced: false, minimumFractionDigits: 2 })}`,
        tone: 'discount',
      },
    ],
    paymentMethodLabel: 'BhaiWay Coins Wallet',
    avatarUri: RIDER_AVATAR,
  };
};

export const getRideInvoicePath = (params?: {
  rideId?: string;
  pickupLabel?: string;
  dropoffLabel?: string;
  dateLabel?: string;
}) => ({
  pathname: ROUTES.myRidesInvoice,
  params: {
    ...(params?.rideId ? { rideId: params.rideId } : {}),
    ...(params?.pickupLabel ? { pickupLabel: params.pickupLabel } : {}),
    ...(params?.dropoffLabel ? { dropoffLabel: params.dropoffLabel } : {}),
    ...(params?.dateLabel ? { dateLabel: params.dateLabel } : {}),
  },
});

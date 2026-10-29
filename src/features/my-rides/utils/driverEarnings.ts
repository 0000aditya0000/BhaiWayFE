import type { DriverRideKind, DriverTripCompletedFareLine } from '../types';
import { formatBhaiWayCoins, formatSignedBhaiWayCoins } from '@/shared/utils';
import { isAssuredRide } from './driverRideKind';

/** Shared Assured vs Regular earnings amounts (mock / display). */
export const DRIVER_EARNINGS = {
  rideFareAmount: 600,
  assuredBonusAmount: 50,
  rideFareLabel: 'Ride Fare',
  assuredBonusLabel: 'Assured Bonus',
  regularPassengerTag: 'Regular',
  assuredPassengerTag: 'Assured',
} as const;

export const formatInrAmount = (amount: number, options?: { spaced?: boolean }): string => {
  return formatBhaiWayCoins(amount, { spaced: options?.spaced ?? false });
};

export const formatInrBonus = (amount: number, options?: { spaced?: boolean }): string => {
  return formatSignedBhaiWayCoins(amount, {
    sign: '+',
    spaced: options?.spaced ?? false,
  });
};

export const getPassengerRideTag = (rideType: DriverRideKind): string => {
  if (rideType === 'assured') {
    return DRIVER_EARNINGS.assuredPassengerTag;
  }
  if (rideType === 'commute') {
    return 'Commute';
  }
  return DRIVER_EARNINGS.regularPassengerTag;
};

export const getDriverRideFareAmount = (): number => DRIVER_EARNINGS.rideFareAmount;

export const getDriverAssuredBonusAmount = (rideType: DriverRideKind): number =>
  isAssuredRide(rideType) ? DRIVER_EARNINGS.assuredBonusAmount : 0;

export const getDriverTotalEarningsAmount = (rideType: DriverRideKind): number =>
  getDriverRideFareAmount() + getDriverAssuredBonusAmount(rideType);

export const buildDriverCompletedFareLines = (
  rideType: DriverRideKind,
): DriverTripCompletedFareLine[] => {
  const lines: DriverTripCompletedFareLine[] = [
    {
      label: DRIVER_EARNINGS.rideFareLabel,
      amountLabel: formatInrAmount(DRIVER_EARNINGS.rideFareAmount, { spaced: true }),
    },
  ];

  if (isAssuredRide(rideType)) {
    lines.push({
      label: DRIVER_EARNINGS.assuredBonusLabel,
      amountLabel: formatInrBonus(DRIVER_EARNINGS.assuredBonusAmount, { spaced: true }),
      highlight: true,
    });
  }

  return lines;
};

export const getDriverCompletedEarningsLabels = (rideType: DriverRideKind) => {
  const total = getDriverTotalEarningsAmount(rideType);
  const bonus = getDriverAssuredBonusAmount(rideType);
  return {
    rideFareLabel: formatInrAmount(DRIVER_EARNINGS.rideFareAmount, { spaced: true }),
    assuredBonusLabel: bonus > 0 ? formatInrBonus(bonus, { spaced: true }) : '',
    earningsLabel: formatInrAmount(total, { spaced: true }),
    earningsAmount: total,
    hasAssuredBonus: isAssuredRide(rideType),
    totalEarningsLabelCompact: formatInrAmount(total),
    assuredBonusLabelCompact: bonus > 0 ? formatInrBonus(bonus) : '',
  };
};

/** Append Assured Bonus only for Assured rides. */
export const withOptionalAssuredBonusLine = <T extends { kind: string }>(
  lines: readonly T[],
  rideType: DriverRideKind,
  bonusLine: T,
): T[] => (isAssuredRide(rideType) ? [...lines, bonusLine] : [...lines]);

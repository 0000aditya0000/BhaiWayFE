import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getRideById, getRideHistoryById } from '@/features/offer-ride/api';
import { getVehicleById } from '@/features/profile/api';
import { listDriverBookings, parseMoneySnapshot } from '@/features/ride-search/api';
import { resolvePersonDisplayName } from '@/features/ride-search/api/bookingPersonName';
import { useSessionUser } from '@/shared/hooks';
import {
  ensureRideCoords,
  isValidMapCoordinate,
} from '@/shared/maps';
import {
  formatBhaiWayCoins,
  getErrorMessage,
  getSearchParam,
  showAppAlert,
  triggerLightHaptic,
} from '@/shared/utils';
import { DEFAULT_PROFILE_AVATAR, TRIP_DETAILS_SCREEN } from '../constants';
import type { DriverRideKind, TripDetailsEarningsLine, TripDetailsSummary } from '../types';
import {
  buildDriverTripInvoiceText,
  formatHistoryDateTimeLabel,
  getPassengerRideTag,
  HISTORY_UNAVAILABLE_LABEL,
  mapRideHistoryDetail,
  mapTripDetailsBadgeLabel,
  resolveDriverRideKindFromCard,
  shareInvoiceDocument,
} from '../utils';
const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
};

const resolveKindFromApiRideType = (rideType: string | null | undefined): DriverRideKind =>
  resolveDriverRideKindFromCard({
    assured: String(rideType ?? '').toUpperCase() === 'ASSURED',
    commute: String(rideType ?? '').toUpperCase() === 'COMMUTE',
  });

export interface UseTripDetailsResult {
  trip: TripDetailsSummary | null;
  loading: boolean;
  error: string | null;
  downloadInvoice: () => void;
  goBack: () => void;
  retry: () => void;
}

export const useTripDetails = (): UseTripDetailsResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const user = useSessionUser();
  const rideId = getSearchParam(params.rideId)?.trim() ?? '';

  const [trip, setTrip] = useState<TripDetailsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const avatarUri = user?.avatarUri ?? DEFAULT_PROFILE_AVATAR;

  useEffect(() => {
    if (!rideId) {
      setTrip(null);
      setLoading(false);
      setError('Ride not found.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        let mapped: TripDetailsSummary | null = null;

        try {
          const dto = await getRideHistoryById(rideId);
          mapped = mapRideHistoryDetail(dto, avatarUri);
        } catch (historyError) {
          console.log(
            '[Trip Details] GET /rides/history/:id failed — falling back to /rides/:id',
            getErrorMessage(historyError),
          );
          const [ride, bookings] = await Promise.all([
            getRideById(rideId),
            listDriverBookings({ rideId, page: 1, limit: 50 }),
          ]);
          const kind = resolveKindFromApiRideType(ride.rideType);
          const tag = getPassengerRideTag(kind);
          const passengers = bookings.filter((booking) => {
            const status = String(booking.status ?? '').toUpperCase();
            return status !== 'CANCELLED';
          });
          const earningsLines: TripDetailsEarningsLine[] = passengers.map((booking) => {
            const name = resolvePersonDisplayName(booking.passenger) || 'Passenger';
            const fareRaw = booking.totalAmount;
            const hasFare = fareRaw != null && fareRaw !== '';
            const amount = hasFare ? parseMoneySnapshot(fareRaw) : NaN;
            return {
              id: booking.id,
              name,
              initials: initialsFromName(name),
              tag,
              amountLabel:
                hasFare && Number.isFinite(amount)
                  ? formatBhaiWayCoins(amount)
                  : HISTORY_UNAVAILABLE_LABEL,
              kind: 'passenger' as const,
            };
          });
          const total = earningsLines.reduce((sum, line) => {
            if (line.amountLabel === HISTORY_UNAVAILABLE_LABEL) {
              return sum;
            }
            const cleaned = line.amountLabel.replace(/[^\d.-]/g, '');
            const value = Number(cleaned);
            return sum + (Number.isFinite(value) ? value : 0);
          }, 0);

          let vehicleName = HISTORY_UNAVAILABLE_LABEL;
          let plateNumber = HISTORY_UNAVAILABLE_LABEL;
          let vehicleVerified = false;
          if (ride.vehicleId?.trim()) {
            try {
              const vehicle = await getVehicleById(ride.vehicleId.trim());
              const label = [vehicle.color, vehicle.make, vehicle.model, vehicle.variant]
                .map((part) => (typeof part === 'string' ? part.trim() : ''))
                .filter(Boolean)
                .join(' ')
                .trim();
              if (label) {
                vehicleName = label;
              }
              if (vehicle.registrationNumber?.trim()) {
                plateNumber = vehicle.registrationNumber.trim();
              }
              vehicleVerified = Boolean(vehicle.isVerified ?? vehicle.isRcVerified);
            } catch {
              // Keep unavailable — never invent vehicle details.
            }
          }

          mapped = {
            rideId: ride.id,
            rideType: kind,
            origin: ride.source || 'Pickup',
            destination: ride.destination || 'Drop-off',
            dateLabel: formatHistoryDateTimeLabel(
              ride.departureDate,
              ride.departureTime,
              null,
              null,
            ),
            durationLabel: HISTORY_UNAVAILABLE_LABEL,
            distanceLabel: HISTORY_UNAVAILABLE_LABEL,
            statusLabel: mapTripDetailsBadgeLabel(ride.status),
            vehicle: {
              name: vehicleName,
              plateNumber,
              verified: vehicleVerified,
            },
            earningsLines,
            totalEarningsLabel:
              earningsLines.some((line) => line.amountLabel !== HISTORY_UNAVAILABLE_LABEL)
                ? formatBhaiWayCoins(total)
                : HISTORY_UNAVAILABLE_LABEL,
            avatarUri,
            pickup: null,
            dropoff: null,
          };
        }

        if (cancelled || !mapped) {
          return;
        }

        // API rideType is authoritative — never overwrite with route-param mock hints.

        const needsCoords =
          !isValidMapCoordinate(mapped.pickup) || !isValidMapCoordinate(mapped.dropoff);
        if (needsCoords) {
          try {
            const resolved = await ensureRideCoords({
              rideId,
              originAddress: mapped.origin,
              destinationAddress: mapped.destination,
            });
            if (!cancelled) {
              mapped = {
                ...mapped,
                pickup: isValidMapCoordinate(resolved.origin) ? resolved.origin : mapped.pickup,
                dropoff: isValidMapCoordinate(resolved.destination)
                  ? resolved.destination
                  : mapped.dropoff,
              };
            }
          } catch {
            // Keep null coords — never invent coordinates.
          }
        }

        if (!cancelled) {
          setTrip(mapped);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.log('[Trip Details] load failed', getErrorMessage(err));
          setTrip(null);
          setError(TRIP_DETAILS_SCREEN.loadErrorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [avatarUri, reloadToken, rideId]);

  const downloadInvoice = useCallback(() => {
    if (sharing || !trip) {
      return;
    }
    triggerLightHaptic();
    setSharing(true);
    void (async () => {
      try {
        const body = buildDriverTripInvoiceText(trip);
        await shareInvoiceDocument({
          fileBaseName: `bhaiway-driver-invoice-${trip.rideId || trip.rideType}`,
          body,
          dialogTitle: TRIP_DETAILS_SCREEN.downloadInvoiceTitle,
        });
      } catch {
        showAppAlert(
          TRIP_DETAILS_SCREEN.downloadInvoiceTitle,
          'Unable to share the invoice right now. Please try again.',
        );
      } finally {
        setSharing(false);
      }
    })();
  }, [sharing, trip]);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  const retry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  return useMemo(
    () => ({
      trip,
      loading,
      error,
      downloadInvoice,
      goBack,
      retry,
    }),
    [downloadInvoice, error, goBack, loading, retry, trip],
  );
};

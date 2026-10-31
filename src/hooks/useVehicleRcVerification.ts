import { useCallback, useRef, useState } from 'react';

import {
  verifyVehicleRc,
  type VehicleRcVerification,
} from '@/features/profile/api';
import {
  collectVehicleRcFailureMessages,
  mapVehicleRcVerificationError,
} from '@/features/profile/utils/vehicleRcVerification.mapper';

export interface UseVehicleRcVerificationResult {
  verify: (vehicleId: string, vehicleNumber?: string) => Promise<VehicleRcVerification | null>;
  isVerifying: boolean;
  verifyingVehicleId: string | null;
  error: string | null;
  result: VehicleRcVerification | null;
  reset: () => void;
}

/**
 * Vehicle RC verification via BhaiWay backend POST /vehicles/:id/verify-rc.
 * Backend is the only source of truth — treat as verified only when status === 'VERIFIED'.
 */
export const useVehicleRcVerification = (): UseVehicleRcVerificationResult => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingVehicleId, setVerifyingVehicleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VehicleRcVerification | null>(null);
  const inFlightRef = useRef(false);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  const verify = useCallback(
    async (
      vehicleId: string,
      vehicleNumber?: string,
    ): Promise<VehicleRcVerification | null> => {
      if (inFlightRef.current) {
        return null;
      }

      const id = vehicleId.trim();
      if (!id) {
        setError(mapVehicleRcVerificationError(new Error('Missing vehicle')));
        return null;
      }

      inFlightRef.current = true;
      setIsVerifying(true);
      setVerifyingVehicleId(id);
      setError(null);

      try {
        const response = await verifyVehicleRc(id, vehicleNumber);
        const verification = response?.verification ?? null;

        if (!verification || verification.status !== 'VERIFIED') {
          // HTTP success without VERIFIED must not be treated as verified.
          if (verification) {
            setResult(verification);
          }
          const messages = collectVehicleRcFailureMessages(
            verification ?? { status: 422, code: 'UNKNOWN', message: 'RC verification failed' },
          );
          setError(messages.join('\n') || mapVehicleRcVerificationError({
            status: 422,
            code: 'UNKNOWN',
            message: 'RC verification failed',
          }));
          return verification;
        }

        setResult(verification);
        setError(null);
        return verification;
      } catch (err) {
        setResult(null);
        const message = mapVehicleRcVerificationError(err);
        setError(message);
        throw Object.assign(err instanceof Error ? err : new Error(message), {
          userMessage: message,
        });
      } finally {
        inFlightRef.current = false;
        setIsVerifying(false);
        setVerifyingVehicleId(null);
      }
    },
    [],
  );

  return {
    verify,
    isVerifying,
    verifyingVehicleId,
    error,
    result,
    reset,
  };
};

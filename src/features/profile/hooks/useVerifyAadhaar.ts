import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { uploadFile } from '@/services/cloudinary';
import type { DashedUploadCardStatus, UploadedDocument } from '@/shared/components';
import { useSessionUser } from '@/shared/hooks';
import {
  compressImage,
  delay,
  getErrorMessage,
  triggerLightHaptic,
  triggerSuccessHaptic,
  showAppAlert,
} from '@/shared/utils';
import { CloudinaryUploadError } from '@/types/cloudinary';
import type { ApiError } from '@/network';
import { authSession } from '@/store';
import { DEFAULT_PROFILE_AVATAR } from '../constants/profile.constants';
import { VERIFY_AADHAAR_SCREEN } from '../constants/verify-aadhaar.constants';
import {
  getMyVerifications,
  submitIdentityVerification,
  type VerificationStatusView,
} from '../api';
import { verificationStore } from '../store/verificationStore';
import type {
  AadhaarCardSide,
  AadhaarVerifyForm,
  AadhaarVerifyStep,
  AadhaarVerifySubmitState,
} from '../types';
import {
  formatAadhaarNumber,
  formatDobInput,
  isValidAadhaarNumber,
  sanitizeAadhaarDigits,
} from '../utils/aadhaar';
import {
  assertClientControlledVerificationPayload,
  buildIdentitySubmitPayload,
  isIdentityVerifiedStatus,
  mapIdentityVerificationError,
  resolveIdentityOutcomeMessage,
} from '../utils/verification.mapper';

const INITIAL_FORM: AadhaarVerifyForm = {
  fullName: '',
  aadhaarNumber: '',
  dateOfBirth: '',
  consentAccepted: false,
  frontIdUri: null,
  frontFileName: null,
  frontSecureUrl: null,
  frontPublicId: null,
  backIdUri: null,
  backFileName: null,
  backSecureUrl: null,
  backPublicId: null,
};

const isApiError = (value: unknown): value is ApiError =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  'code' in value &&
  'message' in value;

const hydrateVerificationFromServer = async (): Promise<VerificationStatusView | null> => {
  const rows = await getMyVerifications();
  verificationStore.set(rows);
  return rows.identity;
};

const resolveIdentityStatusAfterSubmit = async (
  initial: VerificationStatusView,
): Promise<VerificationStatusView> => {
  if (isIdentityVerifiedStatus(initial.status)) {
    verificationStore.set({
      ...(verificationStore.get() ?? {
        identity: initial,
        drivingLicense: { status: 'PENDING' },
        vehicle: { status: 'PENDING' },
      }),
      identity: initial,
    });
    return initial;
  }

  const refreshed = await hydrateVerificationFromServer();
  return refreshed ?? initial;
};

export interface UseVerifyAadhaarResult {
  step: AadhaarVerifyStep;
  form: AadhaarVerifyForm;
  otpValue: string;
  otpError: string | null;
  submitState: AadhaarVerifySubmitState;
  frontStatus: DashedUploadCardStatus;
  backStatus: DashedUploadCardStatus;
  uploadSheetVisible: boolean;
  uploadSide: AadhaarCardSide;
  avatarUri: string;
  maskedMobile: string;
  formattedAadhaar: string;
  setFullName: (value: string) => void;
  setAadhaarNumber: (value: string) => void;
  setDateOfBirth: (value: string) => void;
  toggleConsent: () => void;
  openUpload: (side: AadhaarCardSide) => void;
  closeUpload: () => void;
  applyUploadedDocument: (document: UploadedDocument) => void;
  setOtpValue: (value: string) => void;
  continueToOtp: () => Promise<void>;
  verifyOtp: () => Promise<void>;
  resendOtp: () => void;
  resendModalVisible: boolean;
  closeResendModal: () => void;
  backToDetails: () => void;
  goBack: () => void;
  openProfile: () => void;
}

export const useVerifyAadhaar = (): UseVerifyAadhaarResult => {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthFlow = pathname.includes('/login');
  const user = useSessionUser();
  const uploadGenerationRef = useRef(0);
  const submittingRef = useRef(false);
  const [step, setStep] = useState<AadhaarVerifyStep>('details');
  const [form, setForm] = useState<AadhaarVerifyForm>(() => ({
    ...INITIAL_FORM,
    fullName: user?.fullName?.trim() ?? '',
  }));
  const [otpValue, setOtpValueState] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<AadhaarVerifySubmitState>('idle');
  const [frontStatus, setFrontStatus] = useState<DashedUploadCardStatus>('idle');
  const [backStatus, setBackStatus] = useState<DashedUploadCardStatus>('idle');
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [uploadSide, setUploadSide] = useState<AadhaarCardSide>('front');
  const [resendModalVisible, setResendModalVisible] = useState(false);

  const avatarUri = user?.avatarUri ?? DEFAULT_PROFILE_AVATAR;
  const maskedMobile = '******XXXX';
  const formattedAadhaar = formatAadhaarNumber(form.aadhaarNumber);

  useEffect(() => {
    let active = true;

    void (async () => {
      if (!authSession.getToken()) {
        return;
      }

      try {
        const identity = await hydrateVerificationFromServer();
        if (!active || !identity) {
          return;
        }

        if (isIdentityVerifiedStatus(identity.status)) {
          router.replace(
            isAuthFlow ? ROUTES.authVerifyAadhaarSuccess : ROUTES.verifyAadhaarSuccess,
          );
        }
      } catch (error) {
        console.log('[VerifyAadhaar] GET /verification/me failed', getErrorMessage(error));
      }
    })();

    return () => {
      active = false;
    };
  }, [isAuthFlow, router]);

  const goBack = useCallback(() => {
    if (step === 'otp') {
      setStep('details');
      setOtpValueState('');
      setOtpError(null);
      setSubmitState('idle');
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(isAuthFlow ? ROUTES.completeProfile : ROUTES.profile);
  }, [isAuthFlow, router, step]);

  const openProfile = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(isAuthFlow ? ROUTES.completeProfile : ROUTES.profile);
  }, [isAuthFlow, router]);

  const setFullName = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, fullName: value }));
  }, []);

  const setAadhaarNumber = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      aadhaarNumber: sanitizeAadhaarDigits(value),
    }));
  }, []);

  const setDateOfBirth = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, dateOfBirth: formatDobInput(value) }));
  }, []);

  const toggleConsent = useCallback(() => {
    triggerLightHaptic();
    setForm((prev) => ({ ...prev, consentAccepted: !prev.consentAccepted }));
  }, []);

  const openUpload = useCallback((side: AadhaarCardSide) => {
    triggerLightHaptic();
    setUploadSide(side);
    setUploadSheetVisible(true);
  }, []);

  const closeUpload = useCallback(() => {
    setUploadSheetVisible(false);
  }, []);

  const applyUploadedDocument = useCallback(
    (document: UploadedDocument) => {
      const generation = ++uploadGenerationRef.current;
      const side = uploadSide;
      const setStatus = side === 'front' ? setFrontStatus : setBackStatus;
      const stamp = Date.now();
      const fileName = document.fileName?.trim() || `aadhaar_${side}_${stamp}.jpg`;
      const mimeType = document.mimeType?.trim() || 'image/jpeg';

      setStatus('uploading');
      setUploadSheetVisible(false);

      setForm((prev) =>
        side === 'front'
          ? {
              ...prev,
              frontIdUri: document.uri,
              frontFileName: fileName,
              frontSecureUrl: null,
              frontPublicId: null,
            }
          : {
              ...prev,
              backIdUri: document.uri,
              backFileName: fileName,
              backSecureUrl: null,
              backPublicId: null,
            },
      );

      void (async () => {
        try {
          const compressed = await compressImage(document.uri, {
            maxDimension: 1600,
            quality: 0.75,
            squareCrop: false,
          });

          if (generation !== uploadGenerationRef.current) {
            return;
          }

          const uploaded = await uploadFile({
            uri: compressed.uri,
            kind: 'dl',
            fileName,
            mimeType: compressed.mimeType ?? mimeType,
            resourceType: 'image',
          });

          if (generation !== uploadGenerationRef.current) {
            return;
          }

          setForm((prev) =>
            side === 'front'
              ? {
                  ...prev,
                  frontIdUri: uploaded.secureUrl,
                  frontFileName: fileName,
                  frontSecureUrl: uploaded.secureUrl,
                  frontPublicId: uploaded.publicId,
                }
              : {
                  ...prev,
                  backIdUri: uploaded.secureUrl,
                  backFileName: fileName,
                  backSecureUrl: uploaded.secureUrl,
                  backPublicId: uploaded.publicId,
                },
          );
          setStatus('uploaded');
          triggerSuccessHaptic();
        } catch (error) {
          if (generation !== uploadGenerationRef.current) {
            return;
          }
          setForm((prev) =>
            side === 'front'
              ? {
                  ...prev,
                  frontIdUri: null,
                  frontFileName: null,
                  frontSecureUrl: null,
                  frontPublicId: null,
                }
              : {
                  ...prev,
                  backIdUri: null,
                  backFileName: null,
                  backSecureUrl: null,
                  backPublicId: null,
                },
          );
          setStatus('idle');
          const message =
            error instanceof CloudinaryUploadError
              ? error.message
              : 'Unable to upload your Aadhaar document. Please try again.';
          showAppAlert('Upload failed', message);
        }
      })();
    },
    [uploadSide],
  );

  const setOtpValue = useCallback((value: string) => {
    setOtpValueState(value.replace(/\D/g, '').slice(0, VERIFY_AADHAAR_SCREEN.otpLength));
    setOtpError(null);
  }, []);

  const continueToOtp = useCallback(async () => {
    if (submitState !== 'idle') {
      return;
    }

    triggerLightHaptic();

    if (!isValidAadhaarNumber(form.aadhaarNumber)) {
      showAppAlert(
        VERIFY_AADHAAR_SCREEN.validationTitle,
        form.aadhaarNumber.length === 12
          ? VERIFY_AADHAAR_SCREEN.aadhaarInvalid
          : VERIFY_AADHAAR_SCREEN.aadhaarRequired,
      );
      return;
    }

    setSubmitState('submitting');
    await delay(600);
    setSubmitState('idle');
    setOtpValueState('');
    setOtpError(null);
    setStep('otp');
  }, [
    form.aadhaarNumber,
    submitState,
  ]);

  const resendOtp = useCallback(() => {
    triggerLightHaptic();
    setOtpValueState('');
    setOtpError(null);
    setResendModalVisible(true);
  }, []);

  const closeResendModal = useCallback(() => {
    setResendModalVisible(false);
  }, []);

  const backToDetails = useCallback(() => {
    triggerLightHaptic();
    setStep('details');
    setOtpValueState('');
    setOtpError(null);
    setSubmitState('idle');
    setResendModalVisible(false);
  }, []);

  const navigateToSuccess = useCallback(() => {
    setSubmitState('success');
    triggerSuccessHaptic();
    router.replace(
      isAuthFlow ? ROUTES.authVerifyAadhaarSuccess : ROUTES.verifyAadhaarSuccess,
    );
  }, [isAuthFlow, router]);

  const submitIdentityToBackend = useCallback(async (): Promise<boolean> => {
    const payload = buildIdentitySubmitPayload(form);
    assertClientControlledVerificationPayload(payload);

    if (!authSession.getToken()) {
      showAppAlert('Session expired', 'Please sign in again to submit identity verification.');
      return false;
    }

    try {
      const submitted = await submitIdentityVerification(payload);
      const identity = await resolveIdentityStatusAfterSubmit(submitted);
      const outcome = resolveIdentityOutcomeMessage(identity);

      if (outcome.kind === 'verified') {
        navigateToSuccess();
        return true;
      }

      if (outcome.kind === 'pending') {
        showAppAlert('Verification submitted', outcome.message);
        return false;
      }

      showAppAlert('Verification failed', outcome.message);
      return false;
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        try {
          const identity = await hydrateVerificationFromServer();
          if (identity && isIdentityVerifiedStatus(identity.status)) {
            navigateToSuccess();
            return true;
          }
          showAppAlert(
            'Verification already submitted',
            mapIdentityVerificationError(error),
          );
          return false;
        } catch (refreshError) {
          showAppAlert('Verification already submitted', mapIdentityVerificationError(error));
          console.log('[VerifyAadhaar] refresh after 409 failed', getErrorMessage(refreshError));
          return false;
        }
      }

      if (isApiError(error) && error.status === 401) {
        authSession.clear();
        showAppAlert('Session expired', mapIdentityVerificationError(error));
        router.replace(ROUTES.welcome);
        return false;
      }

      showAppAlert('Verification failed', mapIdentityVerificationError(error));
      return false;
    }
  }, [form, navigateToSuccess, router]);

  const verifyOtp = useCallback(async () => {
    if (submitState !== 'idle' || submittingRef.current) {
      return;
    }

    triggerLightHaptic();

    if (otpValue.length !== VERIFY_AADHAAR_SCREEN.otpLength) {
      setOtpError(VERIFY_AADHAAR_SCREEN.otpInvalidMessage);
      return;
    }

    submittingRef.current = true;
    setSubmitState('submitting');

    // UI-only OTP gate simulating a future real Aadhaar provider OTP step.
    await delay(700);

    if (otpValue !== VERIFY_AADHAAR_SCREEN.demoOtp) {
      setSubmitState('idle');
      submittingRef.current = false;
      setOtpError(VERIFY_AADHAAR_SCREEN.otpInvalidMessage);
      return;
    }

    const verified = await submitIdentityToBackend();

    if (!verified) {
      setSubmitState('idle');
    }
    submittingRef.current = false;
  }, [otpValue, submitIdentityToBackend, submitState]);

  return {
    step,
    form,
    otpValue,
    otpError,
    submitState,
    frontStatus,
    backStatus,
    uploadSheetVisible,
    uploadSide,
    avatarUri,
    maskedMobile,
    formattedAadhaar,
    setFullName,
    setAadhaarNumber,
    setDateOfBirth,
    toggleConsent,
    openUpload,
    closeUpload,
    applyUploadedDocument,
    setOtpValue,
    continueToOtp,
    verifyOtp,
    resendOtp,
    resendModalVisible,
    closeResendModal,
    backToDetails,
    goBack,
    openProfile,
  };
};

import type {
  AadhaarVerificationRefreshResponse,
  AadhaarVerificationStartResponse,
  AadhaarVerificationState,
  AadhaarVerificationStatusResponse,
  DigiLockerFailureReason,
  VerificationStatus,
} from '@/types/kyc';

export const BACKEND_DIGILOCKER_CALLBACK_URL =
  'https://api.bhaiway.com/api/kyc/aadhaar/digilocker/callback';

export const CASHFREE_DIGILOCKER_DEFAULT_REDIRECT_URL =
  BACKEND_DIGILOCKER_CALLBACK_URL;

export const DEFAULT_POLLING_INTERVALS_MS: readonly number[] = [2000, 3000, 5000, 5000, 5000];

export interface DigiLockerNormalizedOutcome {
  reason: DigiLockerFailureReason;
  friendlyMessage: string;
  isCancellation: boolean;
}

/**
 * Maps raw SDK error strings, status codes, or cancellation events
 * into clean, user-friendly messages without exposing internal stack traces
 * or Cashfree technical details.
 */
export const normalizeDigiLockerError = (
  rawError?: unknown,
): DigiLockerNormalizedOutcome => {
  const errorText = typeof rawError === 'string'
    ? rawError
    : typeof rawError === 'object' && rawError !== null && 'message' in rawError
      ? String((rawError as { message?: unknown }).message)
      : typeof rawError === 'object' && rawError !== null && 'error' in rawError
        ? String((rawError as { error?: unknown }).error)
        : '';

  const lower = errorText.toLowerCase();

  if (
    lower.includes('cancel') ||
    lower.includes('dismiss') ||
    lower.includes('closed') ||
    lower === 'user cancelled'
  ) {
    return {
      reason: 'CANCELLED',
      friendlyMessage: 'Verification was cancelled.',
      isCancellation: true,
    };
  }

  if (lower.includes('consent_denied') || (lower.includes('consent') && lower.includes('denied'))) {
    return {
      reason: 'CONSENT_DENIED',
      friendlyMessage: 'Aadhaar verification was not completed because DigiLocker consent was denied.',
      isCancellation: false,
    };
  }

  if (lower.includes('consent_expired')) {
    return {
      reason: 'CONSENT_EXPIRED',
      friendlyMessage: 'Your DigiLocker consent request expired. Please try again.',
      isCancellation: false,
    };
  }

  if (lower.includes('expired') || lower.includes('session expired') || lower.includes('timeout')) {
    return {
      reason: 'EXPIRED',
      friendlyMessage: 'Your Aadhaar verification session expired. Please try again.',
      isCancellation: false,
    };
  }

  if (lower.includes('network') || lower.includes('connection') || lower.includes('offline')) {
    return {
      reason: 'NETWORK_ERROR',
      friendlyMessage: 'Unable to connect to DigiLocker. Please check your internet connection and try again.',
      isCancellation: false,
    };
  }

  return {
    reason: 'FAILED',
    friendlyMessage: "We couldn't complete Aadhaar verification. Please try again.",
    isCancellation: false,
  };
};

export interface DigiLockerLaunchConfig {
  url: string;
  redirectUrl?: string;
  userFlow?: 'signin' | 'signup';
  onSuccess: (data: unknown) => void;
  onError: (outcome: DigiLockerNormalizedOutcome) => void;
  onCancel: (outcome: DigiLockerNormalizedOutcome) => void;
}

export interface DigiLockerSdkPort {
  verify: (
    url: string,
    redirectUrl?: string,
    options?: {
      userFlow?: 'signin' | 'signup';
      onSuccess?: (data: unknown) => void;
      onError?: (error: string) => void;
      onCancel?: () => void;
    },
  ) => void;
}

/**
 * Encapsulates the execution of Cashfree DigiLocker SDK verification.
 */
export const launchDigiLockerVerification = (
  sdk: DigiLockerSdkPort,
  config: DigiLockerLaunchConfig,
): void => {
  const {
    url,
    redirectUrl = CASHFREE_DIGILOCKER_DEFAULT_REDIRECT_URL,
    userFlow = 'signin',
    onSuccess,
    onError,
    onCancel,
  } = config;

  sdk.verify(url, redirectUrl, {
    userFlow,
    onSuccess: (data: unknown) => {
      onSuccess(data);
    },
    onError: (rawError: string) => {
      const outcome = normalizeDigiLockerError(rawError);
      if (outcome.isCancellation) {
        onCancel(outcome);
      } else {
        onError(outcome);
      }
    },
    onCancel: () => {
      onCancel(normalizeDigiLockerError('User Cancelled'));
    },
  });
};

export interface AadhaarControllerApiPort {
  start: () => Promise<AadhaarVerificationStartResponse>;
  getStatus: (verificationId?: string) => Promise<AadhaarVerificationStatusResponse>;
  refresh: (verificationId?: string) => Promise<AadhaarVerificationRefreshResponse>;
}

export interface AadhaarVerificationControllerConfig {
  api: AadhaarControllerApiPort;
  sdk: DigiLockerSdkPort;
  initialStatus?: VerificationStatus;
  syncProfile: () => Promise<void>;
  onStateChange: (state: AadhaarVerificationState) => void;
  onVerified?: (data: { verifiedName?: string; verifiedGender?: string | null }) => void;
  redirectUrl?: string;
  pollingDelaysMs?: readonly number[];
}

/**
 * State machine and business controller managing:
 * - Double-tap protection
 * - Cashfree DigiLocker SDK lifecycle
 * - Authoritative backend status / refresh synchronization
 * - Bounded retry polling
 * - Profile and verification store refreshes
 */
export class AadhaarVerificationController {
  private state: AadhaarVerificationState;
  private destroyed = false;
  private pollingTimer: ReturnType<typeof setTimeout> | null = null;
  private pollingAttempt = 0;
  private activeVerificationId: string | null = null;
  private readonly config: AadhaarVerificationControllerConfig;
  private readonly delays: readonly number[];

  constructor(config: AadhaarVerificationControllerConfig) {
    this.config = config;
    this.delays = config.pollingDelaysMs ?? DEFAULT_POLLING_INTERVALS_MS;
    this.state = {
      status: config.initialStatus ?? 'NOT_VERIFIED',
      verificationId: null,
      verifiedName: null,
      verifiedGender: null,
      verifiedAt: null,
      isStarting: false,
      isRefreshing: false,
      error: null,
      userMessage: null,
    };
  }

  public getState(): AadhaarVerificationState {
    return { ...this.state };
  }

  public resetError(): void {
    this.updateState({ error: null, userMessage: null });
  }

  public clearPollingTimer(): void {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.pollingAttempt = 0;
  }

  public destroy(): void {
    this.destroyed = true;
    this.clearPollingTimer();
  }

  public async startVerification(): Promise<void> {
    if (this.destroyed || this.state.isStarting || this.state.isRefreshing) {
      return;
    }

    this.updateState({
      isStarting: true,
      error: null,
      userMessage: null,
    });

    try {
      const startRes = await this.config.api.start();
      const id = startRes.verificationId || null;
      this.activeVerificationId = id;

      if (!startRes.url) {
        throw new Error('DigiLocker verification URL was not returned by server.');
      }

      this.updateState({
        verificationId: id,
        status: 'VERIFICATION_IN_PROGRESS',
        userMessage: 'Complete the DigiLocker verification process.',
      });

      // Prefer the redirect_url Cashfree was given for this session (backend-authoritative).
      // Fallback keeps production api.bhaiway.com — never a retired Render host.
      const sessionRedirect =
        (typeof startRes.redirectUrl === 'string' && startRes.redirectUrl.trim()) ||
        this.config.redirectUrl ||
        CASHFREE_DIGILOCKER_DEFAULT_REDIRECT_URL;

      launchDigiLockerVerification(this.config.sdk, {
        url: startRes.url,
        redirectUrl: sessionRedirect,
        userFlow: 'signin',
        onSuccess: (_data: unknown) => {
          // Never trust SDK callback alone. Trigger backend authoritative refresh.
          void this.refreshStatus();
        },
        onError: (outcome) => {
          if (this.destroyed) return;
          this.clearPollingTimer();
          this.updateState({
            status: 'VERIFICATION_FAILED',
            error: outcome.friendlyMessage,
            userMessage: outcome.friendlyMessage,
          });
        },
        onCancel: (outcome) => {
          if (this.destroyed) return;
          this.clearPollingTimer();
          // User cancellation does NOT corrupt prior verified identity.
          this.updateState({
            status: this.state.status === 'VERIFIED' ? 'VERIFIED' : 'NOT_VERIFIED',
            error: null,
            userMessage: outcome.friendlyMessage,
          });
        },
      });
    } catch (err) {
      if (this.destroyed) return;
      this.clearPollingTimer();
      const outcome = normalizeDigiLockerError(err);
      this.updateState({
        status: 'VERIFICATION_FAILED',
        error: outcome.friendlyMessage,
        userMessage: outcome.friendlyMessage,
      });
    } finally {
      if (!this.destroyed) {
        this.updateState({ isStarting: false });
      }
    }
  }

  public async refreshStatus(): Promise<void> {
    if (this.destroyed || this.state.isRefreshing) {
      return;
    }

    this.updateState({ isRefreshing: true });

    try {
      const id = this.activeVerificationId ?? undefined;
      const res = await this.config.api.refresh(id);
      const isComplete = await this.processBackendResponse(res);
      if (!isComplete) {
        this.clearPollingTimer();
        this.scheduleNextPoll();
      }
    } catch (err) {
      if (this.destroyed) return;
      const outcome = normalizeDigiLockerError(err);
      this.updateState({
        error: outcome.friendlyMessage,
        userMessage: outcome.friendlyMessage,
      });
    } finally {
      if (!this.destroyed) {
        this.updateState({ isRefreshing: false });
      }
    }
  }

  public async checkStatus(): Promise<void> {
    if (this.destroyed) return;

    try {
      const id = this.activeVerificationId ?? undefined;
      const res = await this.config.api.getStatus(id);
      await this.processBackendResponse(res);
    } catch {
      // Background check failures are non-fatal
    }
  }

  public async onAppResume(): Promise<void> {
    if (
      this.state.status === 'VERIFICATION_IN_PROGRESS' &&
      !this.state.isStarting &&
      !this.state.isRefreshing
    ) {
      await this.checkStatus();
    }
  }

  private async processBackendResponse(
    res: AadhaarVerificationStatusResponse | AadhaarVerificationRefreshResponse,
  ): Promise<boolean> {
    if (this.destroyed) return true;
    const canonicalStatus = (res.status || '').toUpperCase();

    if (canonicalStatus === 'VERIFIED') {
      this.clearPollingTimer();
      this.updateState({
        status: 'VERIFIED',
        verifiedName: res.verifiedName || this.state.verifiedName,
        verifiedGender: res.verifiedGender ?? this.state.verifiedGender,
        verifiedAt: res.verifiedAt || new Date().toISOString(),
        error: null,
        userMessage: 'Your identity has been verified.',
      });

      await this.config.syncProfile().catch(() => undefined);
      this.config.onVerified?.({
        verifiedName: res.verifiedName,
        verifiedGender: res.verifiedGender,
      });
      return true;
    }

    if (canonicalStatus === 'VERIFICATION_IN_PROGRESS' || canonicalStatus === 'PENDING') {
      this.updateState({
        status: 'VERIFICATION_IN_PROGRESS',
        userMessage: 'Complete the DigiLocker verification process.',
      });
      return false;
    }

    // Failures (EXPIRED, CONSENT_DENIED, FAILED, REJECTED)
    this.clearPollingTimer();
    const outcome = normalizeDigiLockerError(res.rejectionReason || res.failureCode || canonicalStatus);
    this.updateState({
      status: 'VERIFICATION_FAILED',
      error: outcome.friendlyMessage,
      userMessage: outcome.friendlyMessage,
    });
    return false;
  }

  private scheduleNextPoll(): void {
    if (this.destroyed) return;
    const attempt = this.pollingAttempt;

    if (attempt >= this.delays.length) {
      this.clearPollingTimer();
      if (this.state.status === 'VERIFICATION_IN_PROGRESS') {
        this.updateState({
          userMessage: 'Verification is still processing. You can check again shortly.',
        });
      }
      return;
    }

    const delayMs = this.delays[attempt];
    this.pollingAttempt = attempt + 1;

    this.pollingTimer = setTimeout(async () => {
      if (this.destroyed) return;
      try {
        const id = this.activeVerificationId ?? undefined;
        const res = await this.config.api.getStatus(id);
        const isComplete = await this.processBackendResponse(res);
        if (!isComplete && this.state.status === 'VERIFICATION_IN_PROGRESS') {
          this.scheduleNextPoll();
        }
      } catch {
        if (!this.destroyed && this.state.status === 'VERIFICATION_IN_PROGRESS') {
          this.scheduleNextPoll();
        }
      }
    }, delayMs);
  }

  private updateState(partial: Partial<AadhaarVerificationState>): void {
    this.state = { ...this.state, ...partial };
    this.config.onStateChange(this.getState());
  }
}

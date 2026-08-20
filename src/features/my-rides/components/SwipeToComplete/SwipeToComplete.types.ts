export interface SwipeToCompleteProps {
  label: string;
  completedLabel: string;
  completed: boolean;
  onComplete: () => void;
  /**
   * Progress (0–1) at which `onThresholdReach` fires once.
   * Defaults to full swipe completion when omitted.
   */
  threshold?: number;
  /** Called once when the handle crosses `threshold` (e.g. open rider OTP at 60%). */
  onThresholdReach?: () => void;
  /** When true, keep the handle parked at the threshold until `completed`. */
  holdAtThreshold?: boolean;
}

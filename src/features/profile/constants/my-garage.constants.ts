import type { GarageVehicle } from '../types';

export const MY_GARAGE_SCREEN = {
  title: 'My Garage',
  heroEyebrow: 'Active Fleet',
  heroTitle: 'Manage Your Vehicles',
  heroSubtitle: 'Verify vehicle RC to publish rides and build passenger trust.',
  whyTitle: 'Why Verify RC?',
  whyBody:
    'Vehicle RC verification is required before publishing rides. Verification is completed instantly through BhaiWay’s secure checks.',
  addVehicleLabel: 'Add New Vehicle',
  editVehicleLabel: 'Edit',
  verifyVehicleLabel: 'Verify RC',
  verifyingVehicleLabel: 'Verifying RC...',
  tryAgainLabel: 'Retry Verification',
  viewDetailsLabel: 'View Details',
  pendingVerifyLabel: 'Verification pending',
  verifySuccessTitle: 'RC verified successfully',
  verifySuccessMessage: 'Your vehicle RC is verified. You can publish rides with this vehicle.',
  verifyFailedTitle: 'RC verification failed',
  verifyPendingTitle: 'Verification pending',
  verifyPendingMessage:
    'RC verification for this vehicle is still in progress. Please wait and try again shortly.',
  rcDetailsTitle: 'RC details',
  enteredLabel: 'Entered',
  rcRecordLabel: 'RC record',
  matchedLabel: 'Matched',
  mismatchLabel: 'Mismatch',
  verifyConfirmTitle: 'Confirm vehicle number',
  verifyConfirmSubtitle:
    'We will verify this registration number with the transport records. Only a successful backend result marks the vehicle as verified.',
  verifyConfirmCta: 'Verify RC',
  vehicleNumberLabel: 'Vehicle Number',
  emptyTitle: 'No vehicles yet',
  emptySubtitle:
    'Add one or more vehicles. They are saved to your garage and you can use the app as a driver and a rider.',
  cancelLabel: 'Cancel',
  deleteTitle: 'Delete vehicle?',
  deleteMessage: (name: string) => `Remove ${name} from your garage?`,
  deleteConfirmLabel: 'Delete',
  deleteFailedTitle: 'Unable to delete',
  colorLabel: 'Color',
  activeVehicleToggleLabel: 'Active vehicle',
  activateFailedTitle: 'Unable to update vehicle',
  deactivateInfoTitle: 'Activate another vehicle',
  deactivateInfoMessage:
    'To mark this vehicle inactive, turn on Active vehicle for another car in your garage.',
  requiredStatusHint: 'RC Verification Required',
  verifyingStatusHint: 'Verifying RC...',
} as const;

/** @deprecated Mock list removed — garage reads vehicles from the API. */
export const GARAGE_VEHICLES: readonly GarageVehicle[] = [];

export const VEHICLE_RC_STATUS_LABEL = {
  verified: 'Verified',
  required: 'Not Verified',
  pending: 'Pending',
  failed: 'Failed',
} as const;

export const VEHICLE_ACTIVE_LABEL = 'Active Vehicle';

export const GARAGE_WHY_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCkGxikjrNAGjb7uctQ_02cJ5W-_5wM1W9XyGhfNFI25_DdhIh0HEN1RevyiJx69IvhwXCzsFjCxOMZs61kb4gJjo3n4uZvOP2HYpQQ0T9uhfyZdkRwNZKEIcCHG_U_AaExwEYF463PAE8Q96qhSmW3y1KZksnCCLZYcVs6Rwq-Fi_02vEGLmcnjuJKNriMgHDfSlilZtUkj1jq8FPWfGT16JyFst33b-lssLrMj-Dg2xlIKT1-iY9c9690nS1pCQ7saxmygOJCOS8';

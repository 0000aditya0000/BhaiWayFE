import type { GarageVehicle } from '../types';

export const MY_GARAGE_SCREEN = {
  title: 'My Garage',
  heroEyebrow: 'Active Fleet',
  heroTitle: 'Manage Your Vehicles',
  heroSubtitle: 'Ensure your RC documents are verified for a seamless driving experience.',
  whyTitle: 'Why Verify RC?',
  whyBody:
    'Verified vehicles gain higher trust scores, attracting more passengers and ensuring compliance with regional transport regulations. Process typically takes 24-48 hours.',
  addVehicleLabel: 'Add New Vehicle',
  editVehicleLabel: 'Edit',
  verifyVehicleLabel: 'Verify RC',
  verifyingVehicleLabel: 'Submitting…',
  verifySuccessTitle: 'Verification submitted',
  verifySuccessMessage:
    'Your vehicle RC has been submitted for verification. This usually takes 24–48 hours.',
  verifyFailedTitle: 'Verification failed',
  emptyTitle: 'No vehicles yet',
  emptySubtitle:
    'Add one or more vehicles. They are saved to your garage and you can use the app as a driver and a rider.',
  cancelLabel: 'Cancel',
  deleteTitle: 'Delete vehicle?',
  deleteMessage: (name: string) => `Remove ${name} from your garage?`,
  deleteConfirmLabel: 'Delete',
  deleteFailedTitle: 'Unable to delete',
  verifyUploadTitle: 'Vehicle RC',
  verifyUploadSubtitle: 'Upload the RC document for this vehicle to start verification.',
  colorLabel: 'Color',
  activeVehicleToggleLabel: 'Active vehicle',
  activateFailedTitle: 'Unable to update vehicle',
  deactivateInfoTitle: 'Activate another vehicle',
  deactivateInfoMessage:
    'To mark this vehicle inactive, turn on Active vehicle for another car in your garage.',
} as const;

/** @deprecated Mock list removed — garage reads vehicles from the UserDetails sheet. */
export const GARAGE_VEHICLES: readonly GarageVehicle[] = [];

export const VEHICLE_RC_STATUS_LABEL = {
  approved: 'RC Approved',
  pending: 'RC Verification Pending',
} as const;

export const VEHICLE_ACTIVE_LABEL = 'Active Vehicle';

export const GARAGE_WHY_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCkGxikjrNAGjb7uctQ_02cJ5W-_5wM1W9XyGhfNFI25_DdhIh0HEN1RevyiJx69IvhwXCzsFjCxOMZs61kb4gJjo3n4uZvOP2HYpQQ0T9uhfyZdkRwNZKEIcCHG_U_AaExwEYF463PAE8Q96qhSmW3y1KZksnCCLZYcVs6Rwq-Fi_02vEGLmcnjuJKNriMgHDfSlilZtUkj1jq8FPWfGT16JyFst33b-lssLrMj-Dg2xlIKT1-iY9c9690nS1pCQ7saxmygOJCOS8';

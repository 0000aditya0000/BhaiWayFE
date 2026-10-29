import type {
  PublishRidePreferences,
  PublishRideVehicleOption,
  RidePreferenceId,
} from '../types';

export const DEFAULT_RIDE_PREFERENCES: PublishRidePreferences = {
  noSmoking: false,
  noPets: false,
  luggage: false,
  music: false,
};

export const RIDE_PREFERENCES_SCREEN = {
  title: 'Publish a Ride',
  preferencesTitle: 'Ride Preferences',
  detailsTitle: 'Additional Details',
  detailsPlaceholder: 'E.g., Pickup near the main gate. I will be wearing a blue cap.',
  notesMaxLength: 200,
  vehicleTitle: 'Select Vehicle',
  addVehicleLabel: '+ Add New',
  emptyVehiclesTitle: 'No vehicles in My Garage',
  emptyVehiclesMessage: 'Add a vehicle to publish this ride. You can manage it anytime from My Garage.',
  missingVehicleTitle: 'Select a vehicle',
  missingVehicleMessage: 'Please choose a vehicle from My Garage before publishing.',
  publishLabel: 'Publish Ride',
  confirmPayLabel: 'Confirm & Pay',
  promoTitle: 'Promo Code',
  promoPlaceholder: 'Enter promo code',
  promoApplyLabel: 'Apply',
  paymentTitle: 'Payment Summary',
  refundableLabel: 'Refundable Amount',
  refundableHint: 'Amount will be refunded after trip ends.',
  totalToPayLabel: 'Total to Pay',
  assuredRefundableAmount: '50.00',
  /** UX-only fallback % for driver deposit display/pre-check — backend admin % is authoritative. */
  assuredDriverDepositPercentUx: 5,
  assuredNote:
    'Assured ride amount will not be refunded if you cancel the trip.',
  assuredNotePrefix: 'Note:',
  promoAppliedMessage: 'Promo code applied.',
  promoInvalidMessage: 'Enter a valid promo code.',
  safetyPrefix: 'By publishing, you agree to our ',
  safetyLink: 'Safety Guidelines',
  safetyMessage:
    'Follow BhaiWay safety guidelines: verify rider identity, share trip details with a trusted contact, and avoid cash-only off-app deals.',
} as const;

/** UX-only — backend admin Assured driver deposit % is authoritative on POST /rides. */
export const ASSURED_DRIVER_DEPOSIT_PERCENT_UX =
  RIDE_PREFERENCES_SCREEN.assuredDriverDepositPercentUx;

export const RIDE_PREFERENCE_OPTIONS: readonly {
  id: RidePreferenceId;
  label: string;
  icon: 'ban' | 'paw' | 'bag-handle' | 'musical-notes';
}[] = [
  { id: 'noSmoking', label: 'No Smoking', icon: 'ban' },
  { id: 'noPets', label: 'No Pets', icon: 'paw' },
  { id: 'luggage', label: 'Luggage', icon: 'bag-handle' },
  { id: 'music', label: 'Music', icon: 'musical-notes' },
] as const;

export const PUBLISH_RIDE_VEHICLES: readonly PublishRideVehicleOption[] = [];

import type { VehicleCategoryOption } from '../types';

export const ADD_VEHICLE_SCREEN = {
  title: 'Add Vehicle',
  editTitle: 'Edit Vehicle',
  heroHint: 'Setup your profile to start earning',
  categoryHeading: 'Vehicle Category',
  modelLabel: 'Car Model',
  modelPlaceholder: 'e.g. Honda City',
  colorLabel: 'Color',
  colorPlaceholder: 'White',
  plateLabel: 'License Plate',
  platePlaceholder: 'DL 3C AB 1234',
  verificationHeading: 'Verification',
  documentTitle: 'Vehicle RC / Documents',
  documentSubtitle: 'Upload for quick background check',
  priorityLabel: 'Priority Processing',
  optionalLabel: 'Optional',
  documentUploadedLabel: 'Document attached',
  submitLabel: 'Add Vehicle',
  saveLabel: 'Save Changes',
  submittingLabel: 'Submitting vehicle verification...',
  savingLabel: 'Saving changes…',
  successLabel: 'Vehicle Added!',
  savedLabel: 'Changes Saved!',
  validationTitle: 'Missing details',
  validationMessage: 'Please enter car model and license plate to continue.',
  uploadTitle: 'Vehicle RC',
  uploadSubtitle: 'Take a photo or choose a document image from your gallery.',
  uploadingDocumentLabel: 'Submitting vehicle verification...',
  loadFailedTitle: 'Unable to load vehicle',
} as const;

export const VEHICLE_CATEGORIES: readonly VehicleCategoryOption[] = [
  { id: 'sedan', label: 'Sedan', icon: 'car-outline' },
  { id: 'suv', label: 'SUV', icon: 'car-sport-outline' },
  { id: 'hatchback', label: 'Hatchback', icon: 'car' },
  { id: 'luxury', label: 'Luxury', icon: 'diamond-outline' },
] as const;

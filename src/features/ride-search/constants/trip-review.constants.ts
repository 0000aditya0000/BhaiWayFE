import type { TripReviewData, TripReviewTag } from '../types';

export const TRIP_REVIEW_SCREEN = {
  heading: 'How was your trip?',
  subtitle: 'Your feedback helps us improve the BhaiWay experience.',
  driverBehaviorLabel: 'Driver Behavior',
  whatWentWellLabel: 'What went well?',
  vehicleConditionLabel: 'Vehicle Condition',
  reviewLabel: 'Write a review (Optional)',
  reviewPlaceholder: 'Tell others about your ride experience...',
  submitLabel: 'Submit Feedback',
  submittingLabel: 'Submitting...',
  skipLabel: 'Skip for now',
  skippingLabel: 'Skipping...',
  submittedTitle: 'Thank you!',
  submittedMessage: 'Thank you for your feedback!',
  ratingRequiredTitle: 'Rating required',
  ratingRequiredMessage: 'Please rate the driver before submitting.',
} as const;

export const DRIVER_FEEDBACK_TAGS: readonly TripReviewTag[] = [
  { id: 'professionalism', label: 'Professionalism' },
  { id: 'punctual', label: 'Punctual' },
  { id: 'safe-driving', label: 'Safe Driving' },
  { id: 'great-conversation', label: 'Great Conversation' },
  { id: 'clean-car', label: 'Clean Car' },
  { id: 'helpful', label: 'Helpful' },
] as const;

export const VEHICLE_FEEDBACK_TAGS: readonly TripReviewTag[] = [
  { id: 'cleanliness', label: 'Cleanliness' },
  { id: 'comfort', label: 'Comfort' },
  { id: 'ac-working', label: 'AC Working' },
  { id: 'fragrance', label: 'Fragrance' },
] as const;

export const getTripReviewMock = (params: {
  rideId: string;
  driverName?: string;
}): TripReviewData => ({
  rideId: params.rideId,
  driverName: (params.driverName || 'Vikram').split(' ')[0],
});

export const getTripReviewPath = (params: {
  rideId: string;
  driverName?: string;
}) => ({
  pathname: '/ride-search/trip-review' as const,
  params: {
    rideId: params.rideId,
    driverName: params.driverName ?? '',
  },
});

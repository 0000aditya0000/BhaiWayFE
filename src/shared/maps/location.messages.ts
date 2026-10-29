/**
 * BhaiWay-specific copy for location permission / GPS failures.
 * Keep messages product-facing — never crash the app on denial.
 */
export const BHAIWAY_LOCATION_MESSAGES = {
  permissionTitle: 'Location needed',
  permissionDenied:
    'BhaiWay needs your location to show the live trip map. You can enable it in system settings.',
  permissionDeniedForever:
    'Location access is blocked for BhaiWay. Open Settings → Apps → BhaiWay → Permissions and allow Location.',
  servicesOff:
    'Location services are turned off on this device. Turn them on to track your trip on the map.',
  unavailable: 'GPS is unavailable right now. Trip status still updates from BhaiWay servers.',
  timeout: 'Could not get your current location in time. Pull to refresh or try again.',
  liveUnavailable:
    'Live map location is unavailable. Your ride status still follows BhaiWay trip updates.',
  riderNoDriverLocation:
    'Driver live location is not available yet. Backend live-location sync is required for passenger-to-driver tracking.',
  driverBackgroundLimited:
    'Riders may stop seeing live updates if BhaiWay is sent to the background. Enable Always location for this trip in Settings.',
} as const;

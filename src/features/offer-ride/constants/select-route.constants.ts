import { ROUTES } from '@/config';

export const SELECT_DRIVING_ROUTE_SCREEN = {
  title: 'Select your route',
  subtitle: 'Choose the driving route you will take. You must select a route before publishing.',
  returnTitle: 'Select return route',
  returnSubtitle:
    'Choose the driving route from office back home. This is a separate route from the outbound trip.',
  continueLabel: 'Continue',
  retryLabel: 'Retry',
  loadingLabel: 'Loading driving routes…',
  emptyTitle: 'No routes available',
  selectedHint: 'Selected',
  unselectedHint: 'Tap to select this route',
  modifyHint: 'Changing pickup or drop-off requires a new driving route.',
} as const;

export const getOfferRideSelectRoutePath = () => ROUTES.offerRideSelectRoute;

export const getOfficeCommuteSelectRoutePath = () => ROUTES.officeCommuteSelectRoute;

export const getOfficeCommuteSelectReturnRoutePath = () =>
  ROUTES.officeCommuteSelectReturnRoute;

export const getModifyRideSelectRoutePath = () => ROUTES.myRidesSelectRoute;

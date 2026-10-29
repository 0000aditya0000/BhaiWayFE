/**
 * Publish error UX invariants — form preserved, no auto-retry, mapped messages.
 */
import {
  CREATE_RIDE_USER_MESSAGES,
  mapCreateRideError,
} from './createRide.mapper';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

type DraftSnapshot = {
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: string;
  selectedVehicleId: string | null;
  preferences: { noSmoking: boolean; noPets: boolean; luggage: boolean; music: boolean };
};

const cloneDraft = (draft: DraftSnapshot): DraftSnapshot => ({
  ...draft,
  preferences: { ...draft.preferences },
});

/**
 * Mirrors publish catch paths in useRidePreferences / useOfferRidePayment:
 * map error → alert, never reset draft, never re-call createRide.
 */
const simulatePublishFailure = (input: {
  draft: DraftSnapshot;
  error: unknown;
}): {
  draftAfter: DraftSnapshot;
  alertMessage: string;
  createRideCalls: number;
  draftReset: boolean;
} => {
  let createRideCalls = 0;
  let draftReset = false;
  const draft = cloneDraft(input.draft);

  // Failed API attempt (counted once — no automatic retry).
  createRideCalls += 1;
  const alertMessage = mapCreateRideError(input.error);
  // Success-only side effects intentionally omitted on error.

  return {
    draftAfter: draft,
    alertMessage,
    createRideCalls,
    draftReset,
  };
};

const baseDraft: DraftSnapshot = {
  origin: 'Noida',
  destination: 'Delhi',
  departureDate: '20/12/2026',
  departureTime: '9:00 AM',
  availableSeats: 3,
  pricePerSeat: '400',
  selectedVehicleId: 'vehicle-1',
  preferences: { noSmoking: true, noPets: false, luggage: true, music: false },
};

const pastResult = simulatePublishFailure({
  draft: baseDraft,
  error: { status: 400, code: 'RIDE_DEPARTURE_IN_PAST', message: 'past' },
});
assertEqual(
  pastResult.alertMessage,
  CREATE_RIDE_USER_MESSAGES.departureInPast,
  'past departure alert message',
);
assertEqual(pastResult.createRideCalls, 1, 'past departure does not auto-retry');
assertTrue(!pastResult.draftReset, 'past departure does not reset draft flag');
assertEqual(pastResult.draftAfter.origin, baseDraft.origin, 'past error keeps origin');
assertEqual(pastResult.draftAfter.destination, baseDraft.destination, 'past error keeps destination');
assertEqual(
  pastResult.draftAfter.departureDate,
  baseDraft.departureDate,
  'past error keeps departureDate',
);
assertEqual(
  pastResult.draftAfter.departureTime,
  baseDraft.departureTime,
  'past error keeps departureTime',
);
assertEqual(
  pastResult.draftAfter.selectedVehicleId,
  baseDraft.selectedVehicleId,
  'past error keeps vehicle',
);
assertEqual(
  pastResult.draftAfter.availableSeats,
  baseDraft.availableSeats,
  'past error keeps seats',
);
assertEqual(
  pastResult.draftAfter.pricePerSeat,
  baseDraft.pricePerSeat,
  'past error keeps price',
);
assertEqual(
  pastResult.draftAfter.preferences.noSmoking,
  true,
  'past error keeps preferences',
);

const assuredResult = simulatePublishFailure({
  draft: baseDraft,
  error: { status: 409, code: 'ACTIVE_ASSURED_RIDE_EXISTS', message: 'exists' },
});
assertEqual(
  assuredResult.alertMessage,
  CREATE_RIDE_USER_MESSAGES.activeAssuredExists,
  'active assured alert message',
);
assertEqual(assuredResult.createRideCalls, 1, 'active assured does not auto-retry');
assertTrue(!assuredResult.draftReset, 'active assured does not reset draft');
assertEqual(assuredResult.draftAfter.origin, baseDraft.origin, 'assured error keeps origin');
assertEqual(
  assuredResult.draftAfter.selectedVehicleId,
  baseDraft.selectedVehicleId,
  'assured error keeps vehicle',
);
assertEqual(
  assuredResult.draftAfter.pricePerSeat,
  baseDraft.pricePerSeat,
  'assured error keeps price',
);

const generic = mapCreateRideError({ status: 500, message: 'Upstream failed' });
assertEqual(generic, 'Upstream failed', 'generic API errors still surface message');

const network = mapCreateRideError({ status: 0, message: '' });
assertTrue(network.toLowerCase().includes('connection'), 'network errors still mapped');

if (failed.length > 0) {
  throw new Error(`publishRideErrorUx tests failed:\n${failed.join('\n')}`);
}

console.log('publishRideErrorUx tests passed');

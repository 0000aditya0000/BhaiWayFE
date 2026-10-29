import {
  mapRideSourceToPreferenceChips,
  mapRideSourceToPreferenceRules,
  resolveRidePreferenceFlags,
} from './mapRidePreferences';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const nested = resolveRidePreferenceFlags({
  preferences: {
    noSmoking: true,
    noPets: false,
    luggageAllowed: true,
    maxTwoInBackSeat: true,
  },
});
assertEqual(nested.noSmoking, true, 'nested noSmoking');
assertEqual(nested.noPets, false, 'nested noPets false');
assertEqual(nested.luggageAllowed, true, 'nested luggage');
assertEqual(nested.maxTwoInBackSeat, true, 'nested max two');

const topLevel = resolveRidePreferenceFlags({
  noSmoking: true,
  noPets: true,
  luggageAllowed: false,
  maxTwoInBackSeat: false,
});
assertEqual(topLevel.noSmoking, true, 'top-level noSmoking');
assertEqual(topLevel.noPets, true, 'top-level noPets');
assertEqual(topLevel.luggageAllowed, false, 'top-level luggage false');

const mixed = resolveRidePreferenceFlags({
  noSmoking: false,
  preferences: { noSmoking: true, noPets: true, luggageAllowed: false, maxTwoInBackSeat: false },
});
assertEqual(mixed.noSmoking, true, 'nested or top-level either true wins');

const rules = mapRideSourceToPreferenceRules({
  preferences: {
    noSmoking: true,
    noPets: true,
    luggageAllowed: true,
    maxTwoInBackSeat: true,
  },
});
assertEqual(rules.length, 4, 'all selected prefs become rules');
assertTrue(rules.some((rule) => rule.id === 'no-smoking'), 'no-smoking rule');
assertTrue(rules.some((rule) => rule.id === 'luggage'), 'luggage rule');

const chips = mapRideSourceToPreferenceChips({
  noSmoking: true,
  luggageAllowed: true,
});
assertEqual(chips.length, 2, 'top-level chips');

const empty = mapRideSourceToPreferenceRules({});
assertEqual(empty.length, 0, 'empty prefs → no rules');

if (failed.length > 0) {
  throw new Error(`mapRidePreferences tests failed:\n${failed.join('\n')}`);
}

console.log('mapRidePreferences tests passed');

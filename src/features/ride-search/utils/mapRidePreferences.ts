import type { RidePreference, RideRule } from '../types';

/** Preference flags as persisted on rides (publish / search / public). */
export interface RidePreferenceFlags {
  noSmoking: boolean;
  noPets: boolean;
  luggageAllowed: boolean;
  maxTwoInBackSeat: boolean;
}

type PreferencesBag = {
  noSmoking?: boolean | null;
  noPets?: boolean | null;
  luggageAllowed?: boolean | null;
  maxTwoInBackSeat?: boolean | null;
  preferences?: PreferencesBag | null;
} | null | undefined;

const asBool = (value: unknown): boolean => value === true;

/**
 * Resolve driver preference flags from either:
 * - nested `preferences.{noSmoking,...}` (search DTO), or
 * - top-level fields (RideResponseDto / some public payloads).
 */
export const resolveRidePreferenceFlags = (source: PreferencesBag): RidePreferenceFlags => {
  const nested = source?.preferences;
  return {
    noSmoking: asBool(nested?.noSmoking) || asBool(source?.noSmoking),
    noPets: asBool(nested?.noPets) || asBool(source?.noPets),
    luggageAllowed: asBool(nested?.luggageAllowed) || asBool(source?.luggageAllowed),
    maxTwoInBackSeat: asBool(nested?.maxTwoInBackSeat) || asBool(source?.maxTwoInBackSeat),
  };
};

/** Search result preference chips. */
export const mapPreferenceFlagsToChips = (
  flags: RidePreferenceFlags,
): RidePreference[] => {
  const items: RidePreference[] = [];
  if (flags.noSmoking) {
    items.push({ id: 'no-smoking', label: 'No smoking', icon: 'ban-outline' });
  }
  if (flags.noPets) {
    items.push({ id: 'no-pets', label: 'No pets', icon: 'paw-outline' });
  }
  if (flags.luggageAllowed) {
    items.push({ id: 'luggage', label: 'Luggage allowed', icon: 'briefcase-outline' });
  }
  if (flags.maxTwoInBackSeat) {
    items.push({ id: 'max-two-back', label: 'Max 2 in back', icon: 'people-outline' });
  }
  return items;
};

/** Ride details / booked details preference rows (RideRulesCard). */
export const mapPreferenceFlagsToRules = (flags: RidePreferenceFlags): RideRule[] => {
  const rules: RideRule[] = [];
  if (flags.noSmoking) {
    rules.push({
      id: 'no-smoking',
      label: 'No smoking inside the vehicle',
      icon: 'ban',
    });
  }
  if (flags.noPets) {
    rules.push({
      id: 'no-pets',
      label: 'Pets are not allowed',
      icon: 'paw',
    });
  }
  if (flags.luggageAllowed) {
    rules.push({
      id: 'luggage',
      label: 'Luggage allowed',
      icon: 'bag',
    });
  }
  if (flags.maxTwoInBackSeat) {
    rules.push({
      id: 'max-two-back',
      label: 'Maximum 2 passengers in the back seat',
      icon: 'people',
    });
  }
  return rules;
};

export const mapRideSourceToPreferenceRules = (source: PreferencesBag): RideRule[] =>
  mapPreferenceFlagsToRules(resolveRidePreferenceFlags(source));

export const mapRideSourceToPreferenceChips = (source: PreferencesBag): RidePreference[] =>
  mapPreferenceFlagsToChips(resolveRidePreferenceFlags(source));

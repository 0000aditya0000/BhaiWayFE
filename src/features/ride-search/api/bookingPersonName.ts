/**
 * Resolve a person display name from booking snapshot fields.
 * Supports displayName, name, fullName, or firstName + lastName.
 * Returns '' when no name fields are present (caller chooses fallback label).
 */
export const resolvePersonDisplayName = (
  person:
    | {
        displayName?: string | null;
        name?: string | null;
        fullName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
      }
    | null
    | undefined,
): string => {
  if (!person || typeof person !== 'object') {
    return '';
  }

  const asTrimmed = (value: unknown): string => {
    if (typeof value !== 'string') {
      return '';
    }
    return value.trim();
  };

  const displayName = asTrimmed(person.displayName);
  if (displayName) {
    return displayName;
  }

  const name = asTrimmed(person.name);
  if (name) {
    return name;
  }

  const fullName = asTrimmed(person.fullName);
  if (fullName) {
    return fullName;
  }

  const firstName = asTrimmed(person.firstName);
  const lastName = asTrimmed(person.lastName);
  const joined = [firstName, lastName].filter(Boolean).join(' ');
  return joined;
};

const MIN_PHONE_DIGITS = 8;

/** Build a `tel:` href from a backend-provided number. Does not invent digits. */
export const toTelHref = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const source = /^tel:/i.test(trimmed) ? trimmed.slice(4).trim() : trimmed;
  const normalized = source.replace(/[^\d+]/g, '');
  const digits = normalized.replace(/\D/g, '');
  if (digits.length < MIN_PHONE_DIGITS) {
    return null;
  }
  return `tel:${normalized}`;
};

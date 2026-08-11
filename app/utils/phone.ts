/**
 * Phone numbers, in one canonical shape.
 *
 * Sendlo spans France and Tunisia (and production already holds an Italian
 * number), so a number typed in national form — "06 12 34 56 78" — is
 * ambiguous on its own. WhatsApp deep links are unforgiving: wa.me needs the
 * full international number with no "+" and no leading zeros, and silently
 * shows "not on WhatsApp" for anything else. Storing whatever the user typed
 * is what produced dead contact buttons in production.
 *
 * Everything here converts to E.164 ("+33612345678") on the way in, and to
 * bare digits ("33612345678") on the way to WhatsApp.
 */

export type CountryCode = 'FR' | 'TN' | 'IT' | 'DE' | 'BE' | 'ES';

export type Country = {
  code: CountryCode;
  /** Dial prefix without "+". */
  dial: string;
  label: string;
  flag: string;
  /** Digits expected after the dial code, used for validation. */
  nationalLength: number[];
  example: string;
};

/**
 * France first: public signup is Sender-only and senders are typically the
 * France-side half of the corridor. Tunisia second for transporters.
 */
export const COUNTRIES: Country[] = [
  { code: 'FR', dial: '33',  label: 'France',   flag: '🇫🇷', nationalLength: [9],    example: '6 12 34 56 78' },
  { code: 'TN', dial: '216', label: 'Tunisie',  flag: '🇹🇳', nationalLength: [8],    example: '55 123 456' },
  { code: 'IT', dial: '39',  label: 'Italie',   flag: '🇮🇹', nationalLength: [9, 10], example: '352 081 9899' },
  { code: 'BE', dial: '32',  label: 'Belgique', flag: '🇧🇪', nationalLength: [9],    example: '470 12 34 56' },
  { code: 'DE', dial: '49',  label: 'Allemagne',flag: '🇩🇪', nationalLength: [10, 11], example: '151 23456789' },
  { code: 'ES', dial: '34',  label: 'Espagne',  flag: '🇪🇸', nationalLength: [9],    example: '612 34 56 78' },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES[0];

export function countryByCode(code: CountryCode): Country {
  return COUNTRIES.find((c) => c.code === code) ?? DEFAULT_COUNTRY;
}

/** Keep only what the user can legitimately type in the national part. */
export const onlyNationalDigits = (v: string) =>
  v.replace(/[^0-9\s]/g, '').replace(/\s{2,}/g, ' ').slice(0, 15);

/**
 * Combine a country and a locally-typed number into E.164.
 *
 * Drops the national trunk zero ("06…" → "6…"), which is the single most
 * common cause of a broken wa.me link.
 */
export function toE164(country: Country, national: string): string {
  let digits = (national || '').replace(/\D/g, '');
  // Trunk prefix: "0" in FR/IT/BE/DE/ES, also written before TN mobiles by some.
  digits = digits.replace(/^0+/, '');
  // If the user pasted the dial code into the national box, don't double it.
  if (digits.startsWith(country.dial)) {
    digits = digits.slice(country.dial.length).replace(/^0+/, '');
  }
  return digits ? `+${country.dial}${digits}` : '';
}

/** Is the national part plausible for this country? */
export function isValidNational(country: Country, national: string): boolean {
  const digits = (national || '').replace(/\D/g, '').replace(/^0+/, '');
  return country.nationalLength.includes(digits.length);
}

/**
 * Split a stored number back into a country + national part, so an existing
 * profile can be edited without the user retyping it.
 */
export function fromE164(stored?: string | null): { country: Country; national: string } {
  const raw = (stored || '').replace(/\s/g, '');
  if (!raw) return { country: DEFAULT_COUNTRY, national: '' };

  let digits = raw.replace(/\D/g, '');
  // "0033..." → "33..."
  digits = digits.replace(/^00/, '');

  // Longest dial code first, so "33" never shadows "216".
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dial)) {
      return { country: c, national: digits.slice(c.dial.length) };
    }
  }
  // No recognisable country code: treat as national in the default country.
  return { country: DEFAULT_COUNTRY, national: digits.replace(/^0+/, '') };
}

/**
 * Digits for a wa.me link, or null when the number cannot produce a working
 * one. Callers must hide the WhatsApp affordance on null rather than render a
 * button that does nothing — that was the production bug.
 */
export function toWhatsAppDigits(stored?: string | null): string | null {
  if (!stored) return null;

  let digits = stored.replace(/\D/g, '').replace(/^00/, '');
  if (!digits) return null;

  // A leading zero means a national number with no country code — we cannot
  // guess the country, and wa.me would fail.
  if (digits.startsWith('0')) return null;

  // Must begin with a dial code we recognise, otherwise the link is a guess.
  const known = COUNTRIES.some((c) => digits.startsWith(c.dial));
  if (!known) return null;

  // Shortest valid international number is ~10 digits (dial + national).
  if (digits.length < 10 || digits.length > 15) return null;

  return digits;
}

/** Pretty form for display: "+33 6 12 34 56 78". */
export function formatForDisplay(stored?: string | null): string {
  const digits = (stored || '').replace(/\D/g, '').replace(/^00/, '');
  if (!digits) return '';
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const c = sorted.find((x) => digits.startsWith(x.dial));
  if (!c) return `+${digits}`;
  const rest = digits.slice(c.dial.length);
  return `+${c.dial} ${rest.replace(/(\d{2})(?=\d)/g, '$1 ').trim()}`;
}

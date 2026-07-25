/**
 * Input sanitizers for form fields.
 *
 * `keyboardType` only *hints* the on-screen keyboard — on web (and with a
 * paired hardware keyboard) the user can still type anything. These helpers
 * are applied in onChangeText so the value itself can never become invalid.
 */

/** Digits only — quantities, counts. */
export const onlyDigits = (v: string, max = 6) => v.replace(/[^0-9]/g, '').slice(0, max);

/**
 * Positive decimal — weights, prices.
 * Accepts a comma as the decimal separator (French keyboards) and normalizes
 * it to a dot, keeps at most one separator and 2 decimals.
 */
export const onlyDecimal = (v: string, maxDecimals = 2) => {
  let s = v.replace(',', '.').replace(/[^0-9.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
    const [intPart, decPart = ''] = s.split('.');
    s = intPart.slice(0, 7) + '.' + decPart.slice(0, maxDecimals);
  } else {
    s = s.slice(0, 7);
  }
  return s;
};

/** Phone — digits plus a single leading +, spaces allowed for readability. */
export const onlyPhone = (v: string) => {
  const plus = v.trimStart().startsWith('+') ? '+' : '';
  const rest = v.replace(/\+/g, '').replace(/[^0-9\s]/g, '').replace(/\s{2,}/g, ' ');
  return (plus + rest).slice(0, 20);
};

/** Person name — letters (incl. accents), spaces, hyphen, apostrophe. */
export const onlyName = (v: string) =>
  v.replace(/[^\p{L}\s'’-]/gu, '').replace(/\s{2,}/g, ' ').slice(0, 60);

/** City / place name — letters, spaces, hyphen, apostrophe, comma (e.g. "Tunis, TN"). */
export const onlyCity = (v: string) =>
  v.replace(/[^\p{L}\s',’-]/gu, '').replace(/\s{2,}/g, ' ').slice(0, 60);

/** Email — no spaces, lowercase, sane length. */
export const cleanEmail = (v: string) => v.replace(/\s/g, '').slice(0, 100);

/** Free text with a length cap (bio, description, notes). */
export const cappedText = (v: string, max = 300) => v.slice(0, max);

/** Vehicle plate — letters, digits, dashes, spaces. */
export const onlyPlate = (v: string) =>
  v.replace(/[^\p{L}0-9\s-]/gu, '').toUpperCase().slice(0, 15);

/** True when the string is a number strictly greater than zero. */
export const isPositiveNumber = (v: string) => {
  const n = parseFloat(v);
  return !isNaN(n) && n > 0;
};

/** Basic email shape check (presence of user@domain.tld). */
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Phone must contain at least 8 digits to be dialable. */
export const isValidPhone = (v: string) => (v.replace(/[^0-9]/g, '').length >= 8);

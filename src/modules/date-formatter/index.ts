/**
 * Date Formatter and Normalization Utility
 *
 * Ensures date values strictly conform to the HTML5 standard "yyyy-MM-dd" specification
 * for <input type="date"> elements, preventing browser validation warnings such as:
 * 'The specified value "09-10-2026" does not conform to the required format, "yyyy-MM-dd".'
 *
 * Supports Indian/Commonwealth DD-MM-YYYY and DD/MM/YYYY formats, ISO timestamps,
 * and user text entries.
 */

/**
 * Normalizes any date value (DD-MM-YYYY, DD/MM/YYYY, YYYY/MM/DD, Date object, ISO)
 * into strict RFC 3339 "yyyy-MM-dd" format.
 * Returns empty string if the value cannot be parsed, preventing invalid value assignment
 * to native HTML5 <input type="date"> elements.
 */
export function normalizeDateToYMD(value: any): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' && !(value instanceof Date)) return '';

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const trimmed = value.trim();
  if (!trimmed) return '';

  // 1. Strict YYYY-MM-DD check
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return trimmed;
    }
    return '';
  }

  // 2. YYYY/MM/DD or YYYY-M-D or YYYY/M/D
  const ymdMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    const mon = Number(m);
    const day = Number(d);
    if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) {
      return `${y}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return '';
  }

  // 3. DD-MM-YYYY or DD/MM/YYYY or D-M-YYYY or D/M/YYYY (Dominant civic format in India/Kerala)
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const day = Number(d);
    const mon = Number(m);
    if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) {
      return `${y}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    // In case month and day were entered as MM-DD-YYYY where day > 12
    if (day >= 1 && day <= 12 && mon >= 1 && mon <= 31) {
      return `${y}-${String(day).padStart(2, '0')}-${String(mon).padStart(2, '0')}`;
    }
    return '';
  }

  // 4. ISO Timestamps (e.g. 2026-10-09T00:00:00.000Z)
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const datePart = trimmed.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }

  // 5. Native Date.parse fallback
  const timestamp = Date.parse(trimmed);
  if (!isNaN(timestamp)) {
    const date = new Date(timestamp);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

/**
 * Formats a YYYY-MM-DD date string into human-friendly DD-MM-YYYY representation
 */
export function formatDateToDMY(ymd: string): string {
  if (!ymd || typeof ymd !== 'string') return '';
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return ymd;
  const [, y, m, d] = match;
  return `${d}-${m}-${y}`;
}

/**
 * ResumeFlow - Centralized Date, Time, and Field Formatting Utilities
 *
 * Ensures consistent Indian date formats (DD-MM-YYYY), Indian Standard Time (Asia/Kolkata),
 * safe Date-of-Birth parsing without UTC/timezone shift, and standardized NIL fallbacks
 * strictly for PDF and HR View rendering.
 */

/**
 * Display helper for PDF and HR View:
 * Converts null, undefined, empty strings, whitespace-only values,
 * and missing placeholders such as 'N/A', 'NA', 'None', 'NONE', '-' into 'NIL'.
 * Preserves all valid submitted candidate strings and numbers.
 */
export function formatNil(val: any): string {
  if (val === null || val === undefined) return 'NIL';
  const str = String(val).trim();
  if (
    !str ||
    str.toUpperCase() === 'N/A' ||
    str.toUpperCase() === 'NA' ||
    str.toUpperCase() === 'NONE' ||
    str === '-' ||
    str.toUpperCase() === 'NULL' ||
    str.toUpperCase() === 'UNDEFINED'
  ) {
    return 'NIL';
  }
  return str;
}

/**
 * Format a Date of Birth string or Date object into Indian format: DD-MM-YYYY.
 *
 * Prevents JavaScript UTC-to-local timezone shifting when parsing 'YYYY-MM-DD'
 * by extracting day, month, and year directly via regex.
 *
 * Example: '1998-08-05' -> '05-08-1998'
 * Example: '1998-5-8'   -> '08-05-1998'
 * Empty / Missing       -> 'NIL'
 */
export function formatDateOfBirth(dob: string | Date | null | undefined): string {
  if (!dob) return 'NIL';

  if (typeof dob === 'string') {
    const trimmed = dob.trim();
    if (!trimmed || trimmed === 'N/A' || trimmed === 'NA' || trimmed === 'NIL') return 'NIL';

    // Check if already in DD-MM-YYYY or DD/MM/YYYY format
    const ddmmyyyy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${day}-${month}-${year}`;
    }

    // Standard ISO YYYY-MM-DD or YYYY-M-D (with optional time portion)
    const yyyymmdd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (yyyymmdd) {
      const year = yyyymmdd[1];
      const month = yyyymmdd[2].padStart(2, '0');
      const day = yyyymmdd[3].padStart(2, '0');
      return `${day}-${month}-${year}`;
    }
  }

  if (dob instanceof Date && !isNaN(dob.getTime())) {
    try {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      return formatter.format(dob).replace(/\//g, '-');
    } catch {
      const day = String(dob.getDate()).padStart(2, '0');
      const month = String(dob.getMonth() + 1).padStart(2, '0');
      const year = String(dob.getFullYear());
      return `${day}-${month}-${year}`;
    }
  }

  return 'NIL';
}

/**
 * Format a submission timestamp into Indian date format: DD-MM-YYYY
 * using Asia/Kolkata timezone.
 *
 * Example: '2026-11-16T05:05:00.000Z' -> '16-11-2026'
 */
export function formatIndianDate(date: Date | string | number | null | undefined): string {
  if (!date) return 'NIL';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'NIL';

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return formatter.format(d).replace(/\//g, '-');
  } catch {
    return 'NIL';
  }
}

/**
 * Format a submission timestamp into Indian Standard Time (Asia/Kolkata):
 * 12-hour format with AM/PM (e.g. '10:35 AM').
 *
 * Ensures all whitespace is standard ASCII space to prevent PDF font encoding issues.
 */
export function formatIndianTime(date: Date | string | number | null | undefined): string {
  if (!date) return 'NIL';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'NIL';

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    // Replace non-breaking space (\u00a0) or narrow no-break space (\u202f) with regular space
    return formatter.format(d).replace(/[\u202f\u00a0]/g, ' ').trim();
  } catch {
    return 'NIL';
  }
}

/**
 * Format PAN number for display in PDF and HR View.
 *
 * When PAN is missing, null, undefined, empty, whitespace-only, or 'NA'/'N/A',
 * displays 'NIL'.
 * If a valid PAN was entered, displays the actual PAN in uppercase.
 */
export function formatPanNumber(pan?: string | null): string {
  if (!pan) return 'NIL';
  const trimmed = pan.trim();
  if (!trimmed || trimmed.toUpperCase() === 'NA' || trimmed.toUpperCase() === 'N/A' || trimmed.toUpperCase() === 'NIL') {
    return 'NIL';
  }
  return trimmed.toUpperCase();
}

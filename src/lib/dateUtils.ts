/**
 * src/lib/dateUtils.ts
 * Enterprise Date/Time Arithmetic and Serialization Suite.
 * Guarantees consistent wall-clock preservation and calendar duration arithmetic.
 */

export type DateOnly = string; // Format: YYYY-MM-DD
export type LocalDateTime = string; // Format: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
export type AbsoluteTimestamp = string; // Format: YYYY-MM-DDTHH:mm:ss.sssZ

export interface TimeTogether {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
}

export interface AnniversaryResult {
  daysLeft: number;
  isToday: boolean;
  nextDate: Date;
  formattedTarget: string;
}

// ============================================================================
// 1. PARSING UTILITIES
// ============================================================================

/**
 * Parses a calendar-only date string (YYYY-MM-DD) into a local Date instance at 00:00:00 local time.
 * Prevents UTC midnight shifts caused by naive `new Date("YYYY-MM-DD")`.
 */
export function parseDateOnly(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateStr.trim());
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);

  const d = new Date(year, month, day, 0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parses a local date-time string (YYYY-MM-DDTHH:mm[:ss]) into a local Date instance.
 * Preserves the exact user wall-clock hours and minutes without UTC interpretation.
 */
export function parseLocalDateTime(dateTimeStr: string | null | undefined): Date | null {
  if (!dateTimeStr) return null;
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(dateTimeStr.trim());
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = match[6] ? parseInt(match[6], 10) : 0;

  const d = new Date(year, month, day, hour, minute, second, 0);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parses an ISO-8601 timestamp with timezone/offset or UTC 'Z'.
 */
export function parseAbsoluteTimestamp(isoStr: string | null | undefined): Date | null {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Polymorphic parser that safely detects the date format and routes to the appropriate parser.
 */
export function parseDateInput(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : new Date(value.getTime());

  const str = value.trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    return parseDateOnly(str);
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}T\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(str)) {
    return parseLocalDateTime(str);
  }
  return parseAbsoluteTimestamp(str);
}

// Backward compatibility alias
export const parseLocalDate = parseDateInput;

// ============================================================================
// 2. INPUT FORMATTERS & SERIALIZERS
// ============================================================================

const pad = (n: number) => n.toString().padStart(2, '0');

/**
 * Formats a Date or date string to YYYY-MM-DD for <input type="date">.
 */
export function formatDateOnlyForInput(dateInput: Date | string | null | undefined): string {
  const d = parseDateInput(dateInput);
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Formats a Date or date string to YYYY-MM-DDTHH:mm for <input type="datetime-local">.
 */
export function formatLocalDateTimeForInput(dateInput: Date | string | null | undefined): string {
  const d = parseDateInput(dateInput);
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Serializes a Date instance to a canonical ISO-8601 UTC timestamp for Supabase timestamptz.
 */
export function serializeAbsoluteTimestamp(date: Date): AbsoluteTimestamp {
  return date.toISOString();
}

/**
 * Serializes a local Date to YYYY-MM-DD for date-only columns.
 */
export function serializeDateOnly(date: Date): DateOnly {
  return formatDateOnlyForInput(date);
}

// ============================================================================
// 3. CALENDAR ARITHMETIC (DURATION CALCULATOR)
// ============================================================================

/**
 * Safely adds/subtracts calendar months while clamping out-of-range days to month end.
 * E.g., Jan 31 + 1 month = Feb 28 (or Feb 29 in leap years).
 */
export function addMonthsClamped(date: Date, months: number): Date {
  const totalMonths = date.getFullYear() * 12 + date.getMonth() + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = totalMonths % 12;

  // Last day of target month: Date(year, month + 1, 0)
  const maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(date.getDate(), maxDaysInTargetMonth);

  const result = new Date(date.getTime());
  result.setFullYear(targetYear, targetMonth, targetDay);
  return result;
}

export function addYearsClamped(date: Date, years: number): Date {
  return addMonthsClamped(date, years * 12);
}

/**
 * Computes exact calendar duration between startDate and now.
 * Uses a forward-stepping calendar anchor algorithm to eliminate negative values,
 * DST artifacts, and month-length discrepancies.
 */
export function calculateTimeTogether(
  startDateStr: string | Date | null | undefined,
  nowInput?: Date
): TimeTogether {
  const fallback: TimeTogether = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 };
  if (!startDateStr) return fallback;

  const start = parseDateInput(startDateStr);
  if (!start) return fallback;

  const now = nowInput ? new Date(nowInput.getTime()) : new Date();
  if (now.getTime() < start.getTime()) {
    return fallback;
  }

  // 1. Advance completed calendar years
  let years = now.getFullYear() - start.getFullYear();
  let anchor = addYearsClamped(start, years);
  if (anchor.getTime() > now.getTime()) {
    years -= 1;
    anchor = addYearsClamped(start, years);
  }

  // 2. Advance completed calendar months
  let months = (now.getFullYear() - anchor.getFullYear()) * 12 + (now.getMonth() - anchor.getMonth());
  let monthAnchor = addMonthsClamped(anchor, months);
  if (monthAnchor.getTime() > now.getTime()) {
    months -= 1;
    monthAnchor = addMonthsClamped(anchor, months);
  }

  // 3. Calculate remaining days, hours, minutes, seconds from the last month anchor
  const diffFromMonthAnchorMs = now.getTime() - monthAnchor.getTime();
  const totalRemainingSeconds = Math.floor(diffFromMonthAnchorMs / 1000);

  const days = Math.floor(totalRemainingSeconds / 86400);
  const remSecondsAfterDays = totalRemainingSeconds % 86400;

  const hours = Math.floor(remSecondsAfterDays / 3600);
  const remSecondsAfterHours = remSecondsAfterDays % 3600;

  const minutes = Math.floor(remSecondsAfterHours / 60);
  const seconds = remSecondsAfterHours % 60;

  // Total continuous elapsed days
  const totalElapsedMs = now.getTime() - start.getTime();
  const totalDays = Math.floor(totalElapsedMs / (1000 * 60 * 60 * 24));

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds),
    totalDays: Math.max(0, totalDays),
  };
}

export const getRelationshipDuration = calculateTimeTogether;

// ============================================================================
// 4. ANNIVERSARY ENGINE
// ============================================================================

export function getDaysUntilAnniversary(
  dateStr: string | Date | null | undefined,
  recurrence: 'yearly' | 'monthly' | 'birthday' | 'custom' = 'yearly',
  nowInput?: Date
): AnniversaryResult {
  const now = nowInput ? new Date(nowInput.getTime()) : new Date();
  now.setHours(0, 0, 0, 0);

  const fallbackDate = new Date(now.getTime());
  if (!dateStr) {
    return { daysLeft: 0, isToday: true, nextDate: fallbackDate, formattedTarget: formatDateOnlyForInput(fallbackDate) };
  }

  const parsed = parseDateInput(dateStr);
  if (!parsed) {
    return { daysLeft: 0, isToday: true, nextDate: fallbackDate, formattedTarget: formatDateOnlyForInput(fallbackDate) };
  }

  const origMonth = parsed.getMonth();
  const origDay = parsed.getDate();
  const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

  let target: Date;

  if (recurrence === 'yearly' || recurrence === 'birthday') {
    let targetYear = now.getFullYear();
    let targetDay = origDay;

    // Feb 29 leap year anniversary handling
    if (origMonth === 1 && origDay === 29) {
      targetDay = isLeapYear(targetYear) ? 29 : 28;
    }

    target = new Date(targetYear, origMonth, targetDay, 0, 0, 0, 0);
    if (target.getTime() < now.getTime()) {
      targetYear += 1;
      if (origMonth === 1 && origDay === 29) {
        targetDay = isLeapYear(targetYear) ? 29 : 28;
      }
      target = new Date(targetYear, origMonth, targetDay, 0, 0, 0, 0);
    }
  } else if (recurrence === 'monthly') {
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth();

    const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
    target = new Date(targetYear, targetMonth, Math.min(origDay, maxDays), 0, 0, 0, 0);

    if (target.getTime() < now.getTime()) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
      const nextMaxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
      target = new Date(targetYear, targetMonth, Math.min(origDay, nextMaxDays), 0, 0, 0, 0);
    }
  } else {
    // Custom one-off target
    target = new Date(parsed.getFullYear(), origMonth, origDay, 0, 0, 0, 0);
  }

  const diffMs = target.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    daysLeft,
    isToday: daysLeft === 0,
    nextDate: target,
    formattedTarget: formatDateOnlyForInput(target),
  };
}

// ============================================================================
// 5. LOCALIZATION FORMATTER
// ============================================================================

export function formatDateLocale(
  dateInput: string | Date | null | undefined,
  lang: 'en' | 'vi' = 'vi',
  includeTime: boolean = false
): string {
  if (!dateInput) return '';
  const d = parseDateInput(dateInput);
  if (!d) return typeof dateInput === 'string' ? dateInput : '';

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: lang === 'vi' ? '2-digit' : 'short',
    day: '2-digit',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  };

  return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', options);
}
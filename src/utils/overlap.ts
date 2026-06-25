/**
 * Interval overlap detection utilities
 */

/**
 * Determines if two time intervals overlap.
 * 
 * Two intervals [aStart, aEnd) and [bStart, bEnd) overlap if:
 * aStart < bEnd && aEnd > bStart
 * 
 * This handles all cases including:
 * - Partial overlaps (start or end overlap)
 * - Full containment (one interval completely within another)
 * - Adjacent intervals (touching but not overlapping)
 * - Zero-length intervals (points)
 * 
 * @param aStart - Start time of first interval in epoch milliseconds
 * @param aEnd - End time of first interval in epoch milliseconds (exclusive)
 * @param bStart - Start time of second interval in epoch milliseconds
 * @param bEnd - End time of second interval in epoch milliseconds (exclusive)
 * @returns true if intervals overlap, false otherwise
 * 
 * @example
 * // Overlapping intervals
 * intervalsOverlap(1000, 2000, 1500, 2500) // true
 * 
 * @example
 * // Adjacent intervals (not overlapping)
 * intervalsOverlap(1000, 2000, 2000, 3000) // false
 * 
 * @example
 * // Zero-length interval (point)
 * intervalsOverlap(1000, 1000, 500, 1500) // false (point at boundary)
 * intervalsOverlap(1000, 1000, 500, 2000) // true (point inside interval)
 */
export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  // Validate inputs - check for null/undefined
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) {
    throw new Error('Invalid interval: all times must be defined');
  }

  // Validate inputs - check for invalid ranges
  if (aStart > aEnd || bStart > bEnd) {
    throw new Error('Invalid interval: start time must be <= end time');
  }

  // Two intervals overlap if: aStart < bEnd && aEnd > bStart
  // This handles all cases including adjacent intervals (which don't overlap)
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Determines if a timed event overlaps with an all-day event.
 * 
 * An all-day event is treated as covering the full day in local time.
 * For a timed event to overlap with an all-day event, the timed event
 * must occur on the same calendar day as the all-day event.
 * 
 * @param eventStartMs - Start time of timed event in epoch milliseconds
 * @param eventEndMs - End time of timed event in epoch milliseconds
 * @param allDayDateMs - Date of all-day event (midnight in local time) in epoch milliseconds
 * @returns true if the timed event overlaps with the all-day event
 * 
 * @example
 * // Timed event on same day as all-day event
 * overlapsWithAllDay(1000, 2000, 0) // true (assuming same day)
 */
export function overlapsWithAllDay(
  eventStartMs: number,
  eventEndMs: number,
  allDayDateMs: number
): boolean {
  // Get the start of the all-day event's day (midnight) in local time
  const allDayStart = new Date(allDayDateMs);
  allDayStart.setHours(0, 0, 0, 0);
  const allDayStartMs = allDayStart.getTime();
  
  // Get the end of the all-day event's day (next midnight) in local time
  const allDayEnd = new Date(allDayDateMs);
  allDayEnd.setDate(allDayEnd.getDate() + 1);
  allDayEnd.setHours(0, 0, 0, 0);
  const allDayEndMs = allDayEnd.getTime();
  
  // Validate intervals before checking overlap
  if (eventStartMs > eventEndMs) {
    console.warn('Invalid event interval: start > end', { eventStartMs, eventEndMs });
    return false;
  }
  
  if (allDayStartMs > allDayEndMs) {
    console.warn('Invalid all-day interval: start > end', { allDayStartMs, allDayEndMs });
    return false;
  }
  
  // Check if the timed event overlaps with the full day
  return intervalsOverlap(eventStartMs, eventEndMs, allDayStartMs, allDayEndMs);
}


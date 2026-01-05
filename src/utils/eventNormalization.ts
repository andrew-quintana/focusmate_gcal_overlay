/**
 * Google Calendar event normalization utilities
 */

import type { GCalEvent } from '../types/events';

/**
 * Google Calendar API event response structure (partial)
 * Based on Google Calendar API v3 documentation
 */
interface GoogleCalendarAPIEvent {
  id: string;
  summary?: string;
  start?: {
    date?: string; // ISO date string (YYYY-MM-DD) for all-day events
    dateTime?: string; // ISO 8601 datetime string for timed events
    timeZone?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  status?: string; // 'confirmed', 'tentative', 'cancelled'
  htmlLink?: string;
  [key: string]: unknown; // Allow other properties
}

/**
 * Normalizes a Google Calendar API event response to internal GCalEvent format.
 * 
 * Handles:
 * - All-day events (date vs dateTime)
 * - Timezone conversion to epoch milliseconds
 * - Excluding cancelled events
 * - Missing or invalid date fields
 * 
 * @param apiEvent - Raw event from Google Calendar API
 * @param calendarId - ID of the calendar this event belongs to
 * @returns Normalized GCalEvent, or null if event should be excluded (cancelled, invalid)
 * 
 * @throws {Error} If event has invalid date structure
 */
export function normalizeGCalEvent(
  apiEvent: GoogleCalendarAPIEvent,
  calendarId: string
): GCalEvent | null {
  // Exclude cancelled events
  if (apiEvent.status === 'cancelled') {
    return null;
  }

  // Determine if this is an all-day event
  // All-day events have 'date' field instead of 'dateTime'
  const isAllDay = !!(apiEvent.start?.date && !apiEvent.start?.dateTime);

  let startMs: number;
  let endMs: number;

  if (isAllDay) {
    // All-day events: use date field, treat as full day in local time
    const startDate = apiEvent.start?.date;
    const endDate = apiEvent.end?.date;

    if (!startDate) {
      throw new Error(`All-day event ${apiEvent.id} missing start date`);
    }

    // Parse date string (YYYY-MM-DD) and convert to midnight in local time
    const startDateObj = new Date(startDate + 'T00:00:00');
    startMs = startDateObj.getTime();

    // End date is exclusive (next day), so parse and subtract 1ms to get end of day
    if (endDate) {
      const endDateObj = new Date(endDate + 'T00:00:00');
      endMs = endDateObj.getTime();
    } else {
      // If no end date, assume same day (end of day)
      const endDateObj = new Date(startDate + 'T23:59:59.999');
      endMs = endDateObj.getTime() + 1;
    }
  } else {
    // Timed events: use dateTime field, convert to epoch milliseconds
    const startDateTime = apiEvent.start?.dateTime;
    const endDateTime = apiEvent.end?.dateTime;

    if (!startDateTime) {
      throw new Error(`Timed event ${apiEvent.id} missing start dateTime`);
    }

    // Parse ISO 8601 datetime string to epoch milliseconds
    startMs = new Date(startDateTime).getTime();

    if (endDateTime) {
      endMs = new Date(endDateTime).getTime();
    } else {
      // If no end time, default to 30 minutes after start
      startMs = new Date(startDateTime).getTime();
      endMs = startMs + 30 * 60 * 1000;
    }

    // Validate parsed dates
    if (isNaN(startMs) || isNaN(endMs)) {
      throw new Error(`Invalid date format for event ${apiEvent.id}`);
    }
  }

  // Validate interval
  if (startMs >= endMs) {
    throw new Error(`Event ${apiEvent.id} has invalid time range: start >= end`);
  }

  return {
    id: apiEvent.id,
    calendarId,
    summary: apiEvent.summary,
    startMs,
    endMs,
    allDay: isAllDay,
    htmlLink: apiEvent.htmlLink,
  };
}

/**
 * Normalizes an array of Google Calendar API events.
 * Filters out cancelled events and events that fail normalization.
 * 
 * @param apiEvents - Array of raw events from Google Calendar API
 * @param calendarId - ID of the calendar these events belong to
 * @returns Array of normalized GCalEvent objects
 */
export function normalizeGCalEvents(
  apiEvents: GoogleCalendarAPIEvent[],
  calendarId: string
): GCalEvent[] {
  const normalized: GCalEvent[] = [];

  for (const apiEvent of apiEvents) {
    try {
      const normalizedEvent = normalizeGCalEvent(apiEvent, calendarId);
      if (normalizedEvent) {
        normalized.push(normalizedEvent);
      }
    } catch (error) {
      // Log error but continue processing other events
      console.error(`Failed to normalize event ${apiEvent.id}:`, error);
    }
  }

  return normalized;
}


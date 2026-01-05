/**
 * Type definitions for calendar events and sessions
 */

/**
 * Google Calendar event normalized to internal format
 */
export interface GCalEvent {
  id: string;
  calendarId: string;
  summary?: string;
  startMs: number; // epoch milliseconds
  endMs: number;   // epoch milliseconds
  allDay: boolean;
  htmlLink?: string;
}

/**
 * Focusmate session normalized to internal format
 */
export interface FocusmateSession {
  id: string;
  startMs: number;
  endMs: number;
  title?: string;
  raw?: unknown;
}

/**
 * Conflict map: sessionKey -> array of conflicting event IDs
 */
export type ConflictMap = Record<string, string[]>;


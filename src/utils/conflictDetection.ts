/**
 * Conflict detection utilities
 */

import type { GCalEvent, FocusmateSession, ConflictMap } from '../types/events';
import { intervalsOverlap, overlapsWithAllDay } from './overlap';
import { generateSessionKey } from './sessionNormalization';

/**
 * Computes conflicts between Focusmate sessions and Google Calendar events.
 * 
 * Returns a map where each session key maps to an array of conflicting event IDs.
 * A conflict occurs when a session's time interval overlaps with an event's time interval.
 * 
 * Handles:
 * - Partial overlaps (any time intersection)
 * - All-day events (treated as full-day coverage)
 * - Multiple events conflicting with one session
 * 
 * @param sessions - Array of Focusmate sessions
 * @param events - Array of Google Calendar events
 * @returns Conflict map: sessionKey -> array of conflicting event IDs
 * 
 * @example
 * const conflicts = computeConflicts(sessions, events);
 * // conflicts = { "1000-2000-abc": ["event1", "event2"] }
 */
export function computeConflicts(
  sessions: FocusmateSession[],
  events: GCalEvent[]
): ConflictMap {
  const conflictMap: ConflictMap = {};

  // Generate session keys for all sessions
  const sessionKeys = new Map<FocusmateSession, string>();
  for (const session of sessions) {
    const key = generateSessionKey(session.startMs, session.endMs, session.title);
    sessionKeys.set(session, key);
  }

  // For each session, find all conflicting events
  for (const session of sessions) {
    const sessionKey = sessionKeys.get(session);
    if (!sessionKey) {
      continue;
    }

    const conflictingEventIds: string[] = [];

    for (const event of events) {
      // Skip events with invalid time ranges
      if (!event.startMs || (event.endMs === null || event.endMs === undefined)) {
        continue;
      }

      // Validate session time range
      if (session.startMs > session.endMs) {
        continue;
      }

      let overlaps = false;

      if (event.allDay) {
        // All-day event: check if session overlaps with the full day
        overlaps = overlapsWithAllDay(
          session.startMs,
          session.endMs,
          event.startMs
        );
      } else {
        // Timed event: use standard interval overlap
        // Validate event time range
        if (event.startMs > event.endMs) {
          continue;
        }
        
        try {
          overlaps = intervalsOverlap(
            session.startMs,
            session.endMs,
            event.startMs,
            event.endMs
          );
        } catch (error) {
          // Skip invalid intervals
          console.warn('Skipping invalid event interval:', event.id, error);
          continue;
        }
      }

      if (overlaps) {
        conflictingEventIds.push(event.id);
      }
    }

    // Only add to conflict map if there are conflicts
    if (conflictingEventIds.length > 0) {
      conflictMap[sessionKey] = conflictingEventIds;
    }
  }

  return conflictMap;
}

/**
 * Gets the session key for a given session.
 * 
 * @param session - Focusmate session
 * @returns Session key string
 */
export function getSessionKey(session: FocusmateSession): string {
  return generateSessionKey(session.startMs, session.endMs, session.title);
}


/**
 * Conflict computation coordination
 * Uses utility functions from Phase 2
 */

import type { GCalEvent, FocusmateSession, ConflictMap } from '../types/events';
import { computeConflicts } from '../utils/conflictDetection';

/**
 * ConflictComputer coordinates conflict computation
 * Handles empty sessions/events cases gracefully
 */
export class ConflictComputer {
  /**
   * Computes conflicts between Focusmate sessions and Google Calendar events.
   * 
   * @param sessions - Array of Focusmate sessions
   * @param events - Array of Google Calendar events
   * @returns Conflict map: sessionKey -> array of conflicting event IDs
   */
  compute(sessions: FocusmateSession[], events: GCalEvent[]): ConflictMap {
    // Handle empty cases
    if (sessions.length === 0 || events.length === 0) {
      return {};
    }

    // Use utility function from Phase 2
    return computeConflicts(sessions, events);
  }
}


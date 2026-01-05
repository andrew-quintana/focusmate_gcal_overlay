/**
 * Focusmate API client (optional)
 * Treats Focusmate API as fallback, not foundational
 * Prefer Google Calendar as source of truth, especially when sync is enabled
 */

import type { FocusmateSession } from '../types/events';
import { normalizeFocusmateSession, normalizeFocusmateSessions } from '../utils/sessionNormalization';

/**
 * Focusmate API base URL (if available)
 * Note: Focusmate API is user-scoped and not fully productized
 */
const FOCUSMATE_API_BASE = 'https://api.focusmate.com'; // Placeholder - actual URL may vary

/**
 * FocusmateClient handles optional Focusmate API integration
 * Important: Focusmate API is optional and not reliable for date ranges
 * Treat as fallback only, not foundational
 */
export class FocusmateClient {
  private apiKey: string | null;

  constructor(apiKey: string | null) {
    this.apiKey = apiKey;
  }

  /**
   * Updates the API key.
   * 
   * @param apiKey - New API key or null to disable
   */
  setApiKey(apiKey: string | null): void {
    this.apiKey = apiKey;
  }

  /**
   * Fetches Focusmate sessions for a date range.
   * 
   * **Important**: Focusmate API does not guarantee explicit date-range querying.
   * Date filtering may be coarse or implicit. This is a limitation of the API.
   * 
   * **Design Principle**: Prefer Google Calendar as source of truth, especially
   * when Focusmate→Google Calendar sync is enabled. Focusmate sessions will
   * appear as Google Calendar events in that case.
   * 
   * @param startMs - Start time in epoch milliseconds
   * @param endMs - End time in epoch milliseconds
   * @param debugLogging - If true, logs debug information
   * @returns Promise resolving to array of normalized FocusmateSession objects
   * @throws Error if API call fails or API key is invalid
   */
  async fetchSessions(
    startMs: number,
    endMs: number,
    debugLogging: boolean = false
  ): Promise<FocusmateSession[]> {
    // Validate API key format (basic check) - check before null check
    if (!FocusmateClient.validateApiKey(this.apiKey)) {
      throw new Error('Invalid Focusmate API key');
    }

    // If no API key, return empty array (graceful degradation)
    if (!this.apiKey) {
      if (debugLogging) {
        console.log('[FocusmateClient] No API key provided, skipping API call');
      }
      return [];
    }

    try {
      // Note: Actual Focusmate API endpoint and parameters may vary
      // This is a placeholder implementation based on typical API patterns
      // The actual endpoint, authentication method, and date range parameters
      // would need to be determined from Focusmate API documentation
      
      const url = new URL(`${FOCUSMATE_API_BASE}/sessions`); // Placeholder endpoint
      url.searchParams.set('start_time', new Date(startMs).toISOString());
      url.searchParams.set('end_time', new Date(endMs).toISOString());

      if (debugLogging) {
        console.log('[FocusmateClient] Fetching sessions', {
          start: new Date(startMs).toISOString(),
          end: new Date(endMs).toISOString(),
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid Focusmate API key or unauthorized');
        }
        if (response.status === 429) {
          throw new Error('Focusmate API rate limit exceeded');
        }
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Focusmate API error (${response.status}): ${errorText}`);
      }

      const data = await response.json().catch(() => {
        throw new Error('Failed to parse Focusmate API response');
      });

      // Handle various response formats
      const sessions = Array.isArray(data) ? data : (data.sessions || data.items || []);

      // Normalize sessions
      const normalizedSessions = normalizeFocusmateSessions(sessions);

      if (debugLogging) {
        console.log('[FocusmateClient] Fetched sessions', {
          rawCount: sessions.length,
          normalizedCount: normalizedSessions.length,
        });
      }

      return normalizedSessions;
    } catch (error) {
      // Graceful error handling - log but don't crash
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (debugLogging) {
        console.error('[FocusmateClient] Failed to fetch sessions:', errorMessage);
      }

      // Return empty array on error (graceful degradation)
      // The extension can still work with Google Calendar events only
      return [];
    }
  }

  /**
   * Validates the API key format (basic validation).
   * 
   * @param apiKey - API key to validate
   * @returns True if API key format appears valid
   */
  static validateApiKey(apiKey: string | null): boolean {
    if (apiKey === null) {
      return true; // null is valid (optional)
    }
    return typeof apiKey === 'string' && apiKey.trim().length > 0;
  }
}


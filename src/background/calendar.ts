/**
 * Google Calendar API client
 * Handles fetching events from Google Calendar API
 * Primary source of truth for calendar events and Focusmate sessions (when sync enabled)
 */

import type { GCalEvent } from '../types/events';
import { normalizeGCalEvent, normalizeGCalEvents } from '../utils/eventNormalization';

/**
 * Google Calendar API base URL
 */
const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Cache entry for calendar events
 */
interface CacheEntry {
  events: GCalEvent[];
  timestamp: number;
}

/**
 * GoogleCalendarClient handles Google Calendar API integration
 * Implements 60-second caching to reduce API calls
 */
export class GoogleCalendarClient {
  private authManager: import('./auth').GoogleAuthManager;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL = 60 * 1000; // 60 seconds

  constructor(authManager: import('./auth').GoogleAuthManager) {
    this.authManager = authManager;
  }

  /**
   * Fetches events for multiple calendars in a date range.
   * 
   * @param calendarIds - Array of calendar IDs to fetch from (supports multiple accounts)
   * @param timeMin - Start time in epoch milliseconds
   * @param timeMax - End time in epoch milliseconds
   * @param debugLogging - If true, logs debug information
   * @returns Promise resolving to array of normalized GCalEvent objects
   * @throws Error if API call fails or authentication fails
   */
  async fetchEvents(
    calendarIds: string[],
    timeMin: number,
    timeMax: number,
    debugLogging: boolean = false
  ): Promise<GCalEvent[]> {
    // Check cache first
    const cacheKey = this.getCacheKey(calendarIds, timeMin, timeMax);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      if (debugLogging) {
        console.log('[GoogleCalendarClient] Using cached events', {
          count: cached.events.length,
          age: Date.now() - cached.timestamp,
        });
      }
      return cached.events;
    }

    // Get auth token
    let token: string;
    try {
      token = await this.authManager.getAuthToken(true);
    } catch (error) {
      throw new Error(`Failed to authenticate: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Fetch events from all calendars
    const allEvents: GCalEvent[] = [];
    const errors: string[] = [];

    for (const calendarId of calendarIds) {
      try {
        const events = await this.fetchEventsForCalendar(
          token,
          calendarId,
          timeMin,
          timeMax,
          debugLogging
        );
        allEvents.push(...events);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Calendar ${calendarId}: ${errorMessage}`);
        
        // Handle 401 errors with token refresh
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          if (debugLogging) {
            console.log('[GoogleCalendarClient] 401 error, refreshing token');
          }
          try {
            token = await this.authManager.handle401Error(token);
            // Retry once with new token
            const events = await this.fetchEventsForCalendar(
              token,
              calendarId,
              timeMin,
              timeMax,
              debugLogging
            );
            allEvents.push(...events);
            // Remove error from list since retry succeeded
            errors.pop();
          } catch (retryError) {
            // Retry failed, keep error
            if (debugLogging) {
              console.error('[GoogleCalendarClient] Retry after 401 failed:', retryError);
            }
          }
        }
      }
    }

    // If all calendars failed, throw error
    if (allEvents.length === 0 && errors.length > 0) {
      throw new Error(`Failed to fetch events from all calendars: ${errors.join('; ')}`);
    }

    // Sort events by start time
    allEvents.sort((a, b) => a.startMs - b.startMs);

    // Update cache
    this.cache.set(cacheKey, {
      events: allEvents,
      timestamp: Date.now(),
    });

    if (debugLogging) {
      console.log('[GoogleCalendarClient] Fetched events', {
        count: allEvents.length,
        calendars: calendarIds.length,
      });
    }

    return allEvents;
  }

  /**
   * Fetches events for a single calendar.
   * 
   * @param token - OAuth token
   * @param calendarId - Calendar ID
   * @param timeMin - Start time in epoch milliseconds
   * @param timeMax - End time in epoch milliseconds
   * @param debugLogging - If true, logs debug information
   * @returns Promise resolving to array of normalized GCalEvent objects
   * @throws Error if API call fails
   */
  private async fetchEventsForCalendar(
    token: string,
    calendarId: string,
    timeMin: number,
    timeMax: number,
    debugLogging: boolean
  ): Promise<GCalEvent[]> {
    // Convert epoch milliseconds to ISO 8601 strings
    const timeMinISO = new Date(timeMin).toISOString();
    const timeMaxISO = new Date(timeMax).toISOString();

    // Build API URL
    const url = new URL(`${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.set('timeMin', timeMinISO);
    url.searchParams.set('timeMax', timeMaxISO);
    url.searchParams.set('singleEvents', 'true'); // Expand recurring events
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '2500'); // Safe cap

    if (debugLogging) {
      console.log('[GoogleCalendarClient] Fetching events', {
        calendarId,
        timeMin: timeMinISO,
        timeMax: timeMaxISO,
      });
    }

    // Make API request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Google Calendar API error (${response.status}): ${errorText}`);
    }

    // Parse response
    const data = await response.json().catch(() => {
      throw new Error('Failed to parse Google Calendar API response');
    });

    // Normalize events
    const apiEvents = data.items || [];
    const normalizedEvents = normalizeGCalEvents(apiEvents, calendarId);

    if (debugLogging) {
      console.log('[GoogleCalendarClient] Normalized events', {
        calendarId,
        rawCount: apiEvents.length,
        normalizedCount: normalizedEvents.length,
      });
    }

    return normalizedEvents;
  }

  /**
   * Gets available calendars from all Google accounts.
   * Supports multiple accounts and calendar groups.
   * 
   * @param debugLogging - If true, logs debug information
   * @returns Promise resolving to array of calendar info objects
   * @throws Error if API call fails
   */
  async getAvailableCalendars(
    debugLogging: boolean = false
  ): Promise<Array<{
    id: string;
    summary: string;
    accountId?: string;
    accountName?: string;
    groupId?: string;
    groupName?: string;
  }>> {
    // Get auth token
    let token: string;
    try {
      token = await this.authManager.getAuthToken(true);
    } catch (error) {
      throw new Error(`Failed to authenticate: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Fetch calendar list
    const url = new URL(`${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`);
    url.searchParams.set('minAccessRole', 'reader'); // Only calendars we can read

    if (debugLogging) {
      console.log('[GoogleCalendarClient] Fetching calendar list');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      
      // Handle 401 with token refresh
      if (response.status === 401) {
        try {
          token = await this.authManager.handle401Error(token);
          // Retry with new token
          const retryResponse = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!retryResponse.ok) {
            throw new Error(`Google Calendar API error (${retryResponse.status})`);
          }
          
          const retryData = await retryResponse.json().catch(() => {
            throw new Error('Failed to parse Google Calendar API response');
          });
          
          return this.parseCalendarList(retryData.items || []);
        } catch (retryError) {
          throw new Error(`Failed to fetch calendar list after token refresh: ${retryError instanceof Error ? retryError.message : String(retryError)}`);
        }
      }
      
      throw new Error(`Google Calendar API error (${response.status}): ${errorText}`);
    }

    const data = await response.json().catch(() => {
      throw new Error('Failed to parse Google Calendar API response');
    });

    return this.parseCalendarList(data.items || []);
  }

  /**
   * Parses calendar list API response into internal format.
   * 
   * @param items - Calendar list items from API
   * @returns Array of calendar info objects
   */
  private parseCalendarList(items: unknown[]): Array<{
    id: string;
    summary: string;
    accountId?: string;
    accountName?: string;
    groupId?: string;
    groupName?: string;
  }> {
    const calendars: Array<{
      id: string;
      summary: string;
      accountId?: string;
      accountName?: string;
      groupId?: string;
      groupName?: string;
    }> = [];

    for (const item of items) {
      if (typeof item !== 'object' || item === null) {
        continue;
      }

      const calendar = item as {
        id?: string;
        summary?: string;
        [key: string]: unknown;
      };

      if (!calendar.id || !calendar.summary) {
        continue;
      }

      calendars.push({
        id: calendar.id,
        summary: calendar.summary,
        // Note: Google Calendar API doesn't directly expose account/group info
        // These would need to be extracted from calendar ID format or additional API calls
        // For now, we'll leave them optional
      });
    }

    return calendars;
  }

  /**
   * Clears the event cache.
   * Useful when settings change or cache needs to be invalidated.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generates a cache key from calendar IDs and time range.
   * 
   * @param calendarIds - Array of calendar IDs
   * @param timeMin - Start time in epoch milliseconds
   * @param timeMax - End time in epoch milliseconds
   * @returns Cache key string
   */
  private getCacheKey(calendarIds: string[], timeMin: number, timeMax: number): string {
    const sortedIds = [...calendarIds].sort().join(',');
    return `${sortedIds}:${timeMin}:${timeMax}`;
  }
}


/**
 * Unit tests for GoogleCalendarClient
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleCalendarClient } from '../../../src/background/calendar';
import { GoogleAuthManager } from '../../../src/background/auth';
import { mockChrome } from '../../mocks/chrome-apis';
import eventsResponse from '../../fixtures/googleCalendar/events_response.json';

// Setup Chrome mocks
vi.stubGlobal('chrome', mockChrome);
vi.stubGlobal('fetch', vi.fn());

describe('GoogleCalendarClient', () => {
  let calendarClient: GoogleCalendarClient;
  let authManager: GoogleAuthManager;

  beforeEach(() => {
    authManager = new GoogleAuthManager();
    calendarClient = new GoogleCalendarClient(authManager);
    vi.clearAllMocks();
    
    // Mock getAuthToken to return a token
    mockChrome.identity.getAuthToken.mockImplementation((options, callback) => {
      callback('test-token-123');
    });
  });

  describe('fetchEvents', () => {
    it('should fetch and normalize events successfully', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => eventsResponse,
      } as Response);

      const events = await calendarClient.fetchEvents(
        ['primary'],
        new Date('2025-01-04T00:00:00-05:00').getTime(),
        new Date('2025-01-05T00:00:00-05:00').getTime(),
        false
      );

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('id');
      expect(events[0]).toHaveProperty('startMs');
      expect(events[0]).toHaveProperty('endMs');
      expect(events[0]).toHaveProperty('calendarId', 'primary');
    });

    it('should use cache for repeated requests', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => eventsResponse,
      } as Response);

      const timeMin = new Date('2025-01-04T00:00:00-05:00').getTime();
      const timeMax = new Date('2025-01-05T00:00:00-05:00').getTime();

      // First call
      await calendarClient.fetchEvents(['primary'], timeMin, timeMax, false);
      
      // Second call should use cache
      const events = await calendarClient.fetchEvents(['primary'], timeMin, timeMax, false);

      expect(events.length).toBeGreaterThan(0);
      // Should only call fetch once (second call uses cache)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle 401 errors with token refresh', async () => {
      const mockFetch = vi.mocked(global.fetch);
      
      // First call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response);

      // Mock token refresh
      let getAuthTokenCallCount = 0;
      mockChrome.identity.getAuthToken.mockImplementation((options, callback) => {
        getAuthTokenCallCount++;
        if (getAuthTokenCallCount === 1) {
          callback('old-token');
        } else {
          callback('new-token');
        }
      });

      mockChrome.identity.removeCachedAuthToken.mockImplementation((options, callback) => {
        callback();
      });

      // Retry call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => eventsResponse,
      } as Response);

      const events = await calendarClient.fetchEvents(
        ['primary'],
        new Date('2025-01-04T00:00:00-05:00').getTime(),
        new Date('2025-01-05T00:00:00-05:00').getTime(),
        false
      );

      expect(events.length).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors gracefully', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response);

      await expect(
        calendarClient.fetchEvents(
          ['primary'],
          new Date('2025-01-04T00:00:00-05:00').getTime(),
          new Date('2025-01-05T00:00:00-05:00').getTime(),
          false
        )
      ).rejects.toThrow();
    });
  });

  describe('getAvailableCalendars', () => {
    it('should fetch and parse calendar list', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { id: 'primary', summary: 'Primary Calendar' },
            { id: 'calendar1', summary: 'Calendar 1' },
          ],
        }),
      } as Response);

      const calendars = await calendarClient.getAvailableCalendars(false);

      expect(calendars.length).toBe(2);
      expect(calendars[0]).toHaveProperty('id', 'primary');
      expect(calendars[0]).toHaveProperty('summary', 'Primary Calendar');
    });

    it('should handle 401 errors with token refresh', async () => {
      const mockFetch = vi.mocked(global.fetch);
      
      // First call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response);

      // Mock token refresh
      let getAuthTokenCallCount = 0;
      mockChrome.identity.getAuthToken.mockImplementation((options, callback) => {
        getAuthTokenCallCount++;
        if (getAuthTokenCallCount === 1) {
          callback('old-token');
        } else {
          callback('new-token');
        }
      });

      mockChrome.identity.removeCachedAuthToken.mockImplementation((options, callback) => {
        callback();
      });

      // Retry call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ id: 'primary', summary: 'Primary Calendar' }],
        }),
      } as Response);

      const calendars = await calendarClient.getAvailableCalendars(false);

      expect(calendars.length).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => eventsResponse,
      } as Response);

      const timeMin = new Date('2025-01-04T00:00:00-05:00').getTime();
      const timeMax = new Date('2025-01-05T00:00:00-05:00').getTime();

      // First call
      await calendarClient.fetchEvents(['primary'], timeMin, timeMax, false);
      
      // Clear cache
      calendarClient.clearCache();
      
      // Second call should fetch again
      await calendarClient.fetchEvents(['primary'], timeMin, timeMax, false);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});


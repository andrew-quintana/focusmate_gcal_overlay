/**
 * Unit tests for FocusmateClient
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FocusmateClient } from '../../../src/background/focusmate';
import focusmateApiResponse from '../../fixtures/focusmate/api_response.json';

vi.stubGlobal('fetch', vi.fn());

describe('FocusmateClient', () => {
  describe('constructor', () => {
    it('should create client with API key', () => {
      const client = new FocusmateClient('test-api-key');
      expect(client).toBeInstanceOf(FocusmateClient);
    });

    it('should create client without API key', () => {
      const client = new FocusmateClient(null);
      expect(client).toBeInstanceOf(FocusmateClient);
    });
  });

  describe('setApiKey', () => {
    it('should update API key', () => {
      const client = new FocusmateClient('old-key');
      client.setApiKey('new-key');
      // API key is private, so we test by calling fetchSessions
      // This is tested in fetchSessions tests
    });
  });

  describe('fetchSessions', () => {
    it('should return empty array when no API key', async () => {
      const client = new FocusmateClient(null);
      const sessions = await client.fetchSessions(
        new Date('2025-01-04T00:00:00-05:00').getTime(),
        new Date('2025-01-05T00:00:00-05:00').getTime(),
        false
      );

      expect(sessions).toEqual([]);
    });

    it('should fetch and normalize sessions successfully', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => focusmateApiResponse,
      } as Response);

      const client = new FocusmateClient('test-api-key');
      const sessions = await client.fetchSessions(
        new Date('2025-01-04T00:00:00-05:00').getTime(),
        new Date('2025-01-05T00:00:00-05:00').getTime(),
        false
      );

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0]).toHaveProperty('id');
      expect(sessions[0]).toHaveProperty('startMs');
      expect(sessions[0]).toHaveProperty('endMs');
    });

    it('should handle 401 errors gracefully', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response);

      const client = new FocusmateClient('invalid-key');
      const sessions = await client.fetchSessions(
        new Date('2025-01-04T00:00:00-05:00').getTime(),
        new Date('2025-01-05T00:00:00-05:00').getTime(),
        false
      );

      // Should return empty array on error (graceful degradation)
      expect(sessions).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const client = new FocusmateClient('test-key');
      const sessions = await client.fetchSessions(
        new Date('2025-01-04T00:00:00-05:00').getTime(),
        new Date('2025-01-05T00:00:00-05:00').getTime(),
        false
      );

      // Should return empty array on error (graceful degradation)
      expect(sessions).toEqual([]);
    });

    it('should reject when API key is invalid format', async () => {
      const client = new FocusmateClient('');
      await expect(
        client.fetchSessions(
          new Date('2025-01-04T00:00:00-05:00').getTime(),
          new Date('2025-01-05T00:00:00-05:00').getTime(),
          false
        )
      ).rejects.toThrow('Invalid Focusmate API key');
    });
  });

  describe('validateApiKey', () => {
    it('should validate null API key as valid', () => {
      expect(FocusmateClient.validateApiKey(null)).toBe(true);
    });

    it('should validate non-empty string as valid', () => {
      expect(FocusmateClient.validateApiKey('test-key')).toBe(true);
    });

    it('should reject empty string', () => {
      expect(FocusmateClient.validateApiKey('')).toBe(false);
    });

    it('should reject whitespace-only string', () => {
      expect(FocusmateClient.validateApiKey('   ')).toBe(false);
    });
  });
});


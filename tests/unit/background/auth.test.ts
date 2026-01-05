/**
 * Unit tests for GoogleAuthManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleAuthManager } from '../../../src/background/auth';
import { mockChrome } from '../../mocks/chrome-apis';

// Setup Chrome mocks
vi.stubGlobal('chrome', mockChrome);

describe('GoogleAuthManager', () => {
  let authManager: GoogleAuthManager;

  beforeEach(() => {
    authManager = new GoogleAuthManager();
    vi.clearAllMocks();
  });

  describe('getAuthToken', () => {
    it('should return token when authentication succeeds', async () => {
      const mockToken = 'test-token-123';
      mockChrome.identity.getAuthToken.mockImplementation((options, callback) => {
        callback(mockToken);
      });

      const token = await authManager.getAuthToken(true);

      expect(token).toBe(mockToken);
      expect(mockChrome.identity.getAuthToken).toHaveBeenCalledWith(
        {
          interactive: true,
          scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        },
        expect.any(Function)
      );
    });

    it('should reject when Chrome API returns error', async () => {
      mockChrome.identity.getAuthToken.mockImplementation((options, callback) => {
        mockChrome.runtime.lastError = { message: 'Authentication failed' };
        callback(undefined);
      });

      await expect(authManager.getAuthToken(true)).rejects.toThrow('Failed to get auth token: Authentication failed');
    });

    it('should reject when user cancels authentication', async () => {
      mockChrome.identity.getAuthToken.mockImplementation((options, callback) => {
        mockChrome.runtime.lastError = { message: 'User canceled the sign-in flow' };
        callback(undefined);
      });

      await expect(authManager.getAuthToken(true)).rejects.toThrow('User cancelled OAuth authentication');
    });

    it('should reject when no token is returned', async () => {
      mockChrome.identity.getAuthToken.mockImplementation((options, callback) => {
        mockChrome.runtime.lastError = undefined;
        callback(undefined);
      });

      await expect(authManager.getAuthToken(true)).rejects.toThrow('No token returned from Chrome Identity API');
    });
  });

  describe('removeCachedToken', () => {
    it('should remove cached token successfully', async () => {
      const token = 'test-token-123';
      mockChrome.identity.removeCachedAuthToken.mockImplementation((options, callback) => {
        mockChrome.runtime.lastError = undefined;
        callback();
      });

      await authManager.removeCachedToken(token);

      expect(mockChrome.identity.removeCachedAuthToken).toHaveBeenCalledWith(
        { token },
        expect.any(Function)
      );
    });

    it('should reject when removal fails', async () => {
      const token = 'test-token-123';
      mockChrome.identity.removeCachedAuthToken.mockImplementation((options, callback) => {
        mockChrome.runtime.lastError = { message: 'Token not found' };
        callback();
      });

      await expect(authManager.removeCachedToken(token)).rejects.toThrow('Failed to remove cached token: Token not found');
    });
  });

  describe('refreshToken', () => {
    it('should remove old token and get new token', async () => {
      const oldToken = 'old-token-123';
      const newToken = 'new-token-456';

      // First call to getAuthToken (non-interactive) returns old token
      let getAuthTokenCallCount = 0;
      mockChrome.identity.getAuthToken.mockImplementation((options, callback) => {
        getAuthTokenCallCount++;
        mockChrome.runtime.lastError = undefined;
        if (getAuthTokenCallCount === 1) {
          // First call (non-interactive)
          callback(oldToken);
        } else {
          // Second call (interactive)
          callback(newToken);
        }
      });

      mockChrome.identity.removeCachedAuthToken.mockImplementation((options, callback) => {
        mockChrome.runtime.lastError = undefined;
        callback();
      });

      const token = await authManager.refreshToken();

      expect(token).toBe(newToken);
      expect(mockChrome.identity.removeCachedAuthToken).toHaveBeenCalledWith(
        { token: oldToken },
        expect.any(Function)
      );
      expect(mockChrome.identity.getAuthToken).toHaveBeenCalledTimes(2);
    });

    it('should handle case when no current token exists', async () => {
      const newToken = 'new-token-456';

      // First call fails (no token), second succeeds
      let getAuthTokenCallCount = 0;
      mockChrome.identity.getAuthToken.mockImplementation((options, callback) => {
        getAuthTokenCallCount++;
        if (getAuthTokenCallCount === 1) {
          mockChrome.runtime.lastError = { message: 'No token' };
          callback(undefined);
        } else {
          mockChrome.runtime.lastError = undefined;
          callback(newToken);
        }
      });

      mockChrome.identity.removeCachedAuthToken.mockImplementation((options, callback) => {
        mockChrome.runtime.lastError = undefined;
        callback();
      });

      const token = await authManager.refreshToken();

      expect(token).toBe(newToken);
      // Should not call removeCachedAuthToken if no token exists
      expect(mockChrome.identity.removeCachedAuthToken).not.toHaveBeenCalled();
    });
  });

  describe('handle401Error', () => {
    it('should remove token and refresh on 401 error', async () => {
      const invalidToken = 'invalid-token-123';
      const newToken = 'new-token-456';

      mockChrome.identity.removeCachedAuthToken.mockImplementation((options, callback) => {
        mockChrome.runtime.lastError = undefined;
        callback();
      });

      let getAuthTokenCallCount = 0;
      mockChrome.identity.getAuthToken.mockImplementation((options, callback) => {
        getAuthTokenCallCount++;
        mockChrome.runtime.lastError = undefined;
        if (getAuthTokenCallCount === 1) {
          // First call (non-interactive) returns invalid token
          callback(invalidToken);
        } else {
          // Second call (interactive) returns new token
          callback(newToken);
        }
      });

      const token = await authManager.handle401Error(invalidToken);

      expect(token).toBe(newToken);
      expect(mockChrome.identity.removeCachedAuthToken).toHaveBeenCalledWith(
        { token: invalidToken },
        expect.any(Function)
      );
    });
  });
});


/**
 * Google OAuth authentication manager
 * Handles token acquisition, refresh, and error recovery
 */

/**
 * Google OAuth scope for calendar read-only access
 */
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

/**
 * GoogleAuthManager handles Google OAuth token management
 * Supports multiple Google accounts
 */
export class GoogleAuthManager {
  /**
   * Gets an OAuth token for Google Calendar API access.
   * 
   * @param interactive - If true, shows OAuth prompt if needed. If false, fails silently.
   * @returns Promise resolving to OAuth token string
   * @throws Error if token acquisition fails
   */
  async getAuthToken(interactive: boolean = true): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken(
        {
          interactive,
          scopes: [GOOGLE_CALENDAR_SCOPE],
        },
        (token) => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message || 'Unknown error';
            
            // Handle user cancellation gracefully
            if (error.includes('canceled') || error.includes('user_cancelled')) {
              reject(new Error('User cancelled OAuth authentication'));
              return;
            }
            
            reject(new Error(`Failed to get auth token: ${error}`));
            return;
          }
          
          if (!token) {
            reject(new Error('No token returned from Chrome Identity API'));
            return;
          }
          
          resolve(token);
        }
      );
    });
  }

  /**
   * Refreshes the OAuth token by removing cached token and requesting a new one.
   * 
   * @returns Promise resolving to new OAuth token string
   * @throws Error if token refresh fails
   */
  async refreshToken(): Promise<string> {
    // First, try to get current token to identify which account
    let currentToken: string | undefined;
    try {
      currentToken = await this.getAuthToken(false);
    } catch {
      // No current token, proceed with removal
    }

    // Remove cached token
    if (currentToken) {
      await this.removeCachedToken(currentToken);
    }

    // Request new token (will trigger interactive prompt if needed)
    return this.getAuthToken(true);
  }

  /**
   * Removes a cached OAuth token.
   * Used for error recovery (e.g., on 401 errors).
   * 
   * @param token - Token to remove from cache
   * @returns Promise that resolves when token is removed
   */
  async removeCachedToken(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.identity.removeCachedAuthToken(
        { token },
        () => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message || 'Unknown error';
            reject(new Error(`Failed to remove cached token: ${error}`));
            return;
          }
          resolve();
        }
      );
    });
  }

  /**
   * Handles 401 errors by removing cached token and retrying.
   * 
   * @param token - Token that resulted in 401 error
   * @returns Promise resolving to new OAuth token string
   * @throws Error if token refresh fails
   */
  async handle401Error(token: string): Promise<string> {
    // Remove the invalid token
    try {
      await this.removeCachedToken(token);
    } catch (error) {
      // Log but continue - token might already be removed
      console.warn('Failed to remove cached token:', error);
    }

    // Request new token
    return this.refreshToken();
  }
}


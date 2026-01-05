/**
 * Background service worker for Chrome extension
 * Handles OAuth, API calls, conflict computation, and message passing
 */

import type {
  ContentToBackgroundMessage,
  BackgroundToContentMessage,
  FetchDataForRangeMessage,
  GetSettingsMessage,
  RangeDataResponse,
  SettingsResponse,
} from '../types/messages';
import type { ExtensionSettings } from '../types/storage';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../types/storage';
import { GoogleAuthManager } from './auth';
import { GoogleCalendarClient } from './calendar';
import { FocusmateClient } from './focusmate';
import { ConflictComputer } from './conflict';

/**
 * Main background service worker class
 */
class BackgroundServiceWorker {
  private authManager: GoogleAuthManager;
  private calendarClient: GoogleCalendarClient;
  private focusmateClient: FocusmateClient;
  private conflictComputer: ConflictComputer;
  private settings: ExtensionSettings = DEFAULT_SETTINGS;

  constructor() {
    this.authManager = new GoogleAuthManager();
    this.calendarClient = new GoogleCalendarClient(this.authManager);
    this.focusmateClient = new FocusmateClient(null);
    this.conflictComputer = new ConflictComputer();
  }

  /**
   * Initializes the service worker
   */
  async initialize(): Promise<void> {
    // Load settings from storage
    await this.loadSettings();

    // Set up message listeners
    chrome.runtime.onMessage.addListener(
      (message: ContentToBackgroundMessage, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Indicates we will send a response asynchronously
      }
    );

    // Listen for storage changes to update settings
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        this.handleStorageChange(changes);
      }
    });

    // Log initialization (only if debug logging enabled)
    if (this.settings.debugLogging) {
      console.log('[BackgroundServiceWorker] Initialized');
    }
  }

  /**
   * Loads settings from chrome.storage.local
   */
  private async loadSettings(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        Object.values(STORAGE_KEYS),
        (items) => {
          // Merge with defaults
          this.settings = {
            overlayEnabled: items[STORAGE_KEYS.OVERLAY_ENABLED] ?? DEFAULT_SETTINGS.overlayEnabled,
            conflictColor: items[STORAGE_KEYS.CONFLICT_COLOR] ?? DEFAULT_SETTINGS.conflictColor,
            calendarIds: items[STORAGE_KEYS.CALENDAR_IDS] ?? DEFAULT_SETTINGS.calendarIds,
            focusmateApiKey: items[STORAGE_KEYS.FOCUSMATE_API_KEY] ?? DEFAULT_SETTINGS.focusmateApiKey,
            debugLogging: items[STORAGE_KEYS.DEBUG_LOGGING] ?? DEFAULT_SETTINGS.debugLogging,
          };

          // Update focusmate client with API key
          this.focusmateClient.setApiKey(this.settings.focusmateApiKey);

          // Clear cache when settings change
          this.calendarClient.clearCache();

          if (this.settings.debugLogging) {
            console.log('[BackgroundServiceWorker] Settings loaded', this.settings);
          }

          resolve();
        }
      );
    });
  }

  /**
   * Handles storage changes
   */
  private handleStorageChange(changes: chrome.storage.StorageChange): void {
    let settingsChanged = false;

    if (changes[STORAGE_KEYS.OVERLAY_ENABLED]) {
      this.settings.overlayEnabled = changes[STORAGE_KEYS.OVERLAY_ENABLED].newValue ?? DEFAULT_SETTINGS.overlayEnabled;
      settingsChanged = true;
    }

    if (changes[STORAGE_KEYS.CONFLICT_COLOR]) {
      this.settings.conflictColor = changes[STORAGE_KEYS.CONFLICT_COLOR].newValue ?? DEFAULT_SETTINGS.conflictColor;
      settingsChanged = true;
    }

    if (changes[STORAGE_KEYS.CALENDAR_IDS]) {
      this.settings.calendarIds = changes[STORAGE_KEYS.CALENDAR_IDS].newValue ?? DEFAULT_SETTINGS.calendarIds;
      settingsChanged = true;
      // Clear cache when calendar selection changes
      this.calendarClient.clearCache();
    }

    if (changes[STORAGE_KEYS.FOCUSMATE_API_KEY]) {
      this.settings.focusmateApiKey = changes[STORAGE_KEYS.FOCUSMATE_API_KEY].newValue ?? DEFAULT_SETTINGS.focusmateApiKey;
      this.focusmateClient.setApiKey(this.settings.focusmateApiKey);
      settingsChanged = true;
    }

    if (changes[STORAGE_KEYS.DEBUG_LOGGING]) {
      this.settings.debugLogging = changes[STORAGE_KEYS.DEBUG_LOGGING].newValue ?? DEFAULT_SETTINGS.debugLogging;
      settingsChanged = true;
    }

    if (settingsChanged && this.settings.debugLogging) {
      console.log('[BackgroundServiceWorker] Settings updated', this.settings);
    }
  }

  /**
   * Handles messages from content script
   */
  private async handleMessage(
    message: ContentToBackgroundMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: BackgroundToContentMessage) => void
  ): Promise<void> {
    try {
      if (message.type === 'FETCH_DATA_FOR_RANGE') {
        const response = await this.handleFetchDataForRange(message);
        sendResponse(response);
      } else if (message.type === 'GET_SETTINGS') {
        const response = await this.handleGetSettings(message);
        sendResponse(response);
      } else {
        sendResponse({
          ok: false,
          error: `Unknown message type: ${(message as { type: string }).type}`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (this.settings.debugLogging) {
        console.error('[BackgroundServiceWorker] Error handling message:', error);
      }

      sendResponse({
        ok: false,
        error: errorMessage,
      });
    }
  }

  /**
   * Handles FETCH_DATA_FOR_RANGE message
   */
  private async handleFetchDataForRange(
    message: FetchDataForRangeMessage
  ): Promise<RangeDataResponse> {
    const { range, sessionsFromDom } = message;

    if (this.settings.debugLogging) {
      console.log('[BackgroundServiceWorker] Fetching data for range', {
        start: new Date(range.startMs).toISOString(),
        end: new Date(range.endMs).toISOString(),
        sessionsFromDom: sessionsFromDom?.length ?? 0,
      });
    }

    try {
      // Fetch Google Calendar events (primary source of truth)
      const events = await this.calendarClient.fetchEvents(
        this.settings.calendarIds,
        range.startMs,
        range.endMs,
        this.settings.debugLogging
      );

      // Fetch Focusmate sessions (optional, fallback)
      // Note: If Focusmate→Google Calendar sync is enabled, sessions will appear in events
      let sessions = sessionsFromDom || [];

      // Try Focusmate API if API key is available
      if (this.settings.focusmateApiKey) {
        try {
          const apiSessions = await this.focusmateClient.fetchSessions(
            range.startMs,
            range.endMs,
            this.settings.debugLogging
          );
          // Merge with DOM sessions (avoid duplicates)
          const existingKeys = new Set(sessions.map(s => s.id));
          for (const session of apiSessions) {
            if (!existingKeys.has(session.id)) {
              sessions.push(session);
            }
          }
        } catch (error) {
          // Focusmate API failed, but continue with DOM sessions or events
          if (this.settings.debugLogging) {
            console.warn('[BackgroundServiceWorker] Focusmate API failed, continuing with other sources:', error);
          }
        }
      }

      // If no sessions from DOM or API, check if sessions are in Google Calendar events
      // (when Focusmate→Google Calendar sync is enabled)
      // This is the preferred source of truth
      if (sessions.length === 0 && this.settings.debugLogging) {
        console.log('[BackgroundServiceWorker] No Focusmate sessions found, using Google Calendar events as source of truth');
      }

      // Compute conflicts
      const conflicts = this.conflictComputer.compute(sessions, events);

      if (this.settings.debugLogging) {
        console.log('[BackgroundServiceWorker] Computed conflicts', {
          events: events.length,
          sessions: sessions.length,
          conflicts: Object.keys(conflicts).length,
        });
      }

      return {
        ok: true,
        events,
        sessions,
        conflicts,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (this.settings.debugLogging) {
        console.error('[BackgroundServiceWorker] Failed to fetch data:', error);
      }

      return {
        ok: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Handles GET_SETTINGS message
   */
  private async handleGetSettings(
    message: GetSettingsMessage
  ): Promise<SettingsResponse> {
    // Ensure settings are up to date
    await this.loadSettings();

    return {
      overlayEnabled: this.settings.overlayEnabled,
      conflictColor: this.settings.conflictColor,
      calendarIds: this.settings.calendarIds,
      focusmateApiKey: this.settings.focusmateApiKey,
      debugLogging: this.settings.debugLogging,
    };
  }
}

// Initialize service worker
const serviceWorker = new BackgroundServiceWorker();
serviceWorker.initialize().catch((error) => {
  console.error('[BackgroundServiceWorker] Failed to initialize:', error);
});

// Log installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Focusmate Calendar Extension installed');
});

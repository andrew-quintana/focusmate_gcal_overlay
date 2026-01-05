/**
 * Content script for Chrome extension
 * 
 * Main entry point for content script functionality:
 * - Detects Focusmate page and sessions
 * - Renders calendar overlay
 * - Applies conflict highlighting
 * - Handles DOM mutations and route changes
 */

import type {
  FetchDataForRangeMessage,
  GetSettingsMessage,
  RangeDataResponse,
  SettingsResponse,
} from '../types/messages';
import type { ExtensionSettings } from '../types/storage';
import { DEFAULT_SETTINGS } from '../types/storage';
import { FocusmateDOMDetector, type DetectedDateRange } from './domDetector';
import { CalendarOverlay } from './overlay';
import { ConflictStyler } from './conflictStyling';
import { generateSessionKey } from '../utils/sessionNormalization';

/**
 * Main content script controller
 */
class ContentScriptController {
  private detector: FocusmateDOMDetector;
  private overlay: CalendarOverlay | null = null;
  private conflictStyler: ConflictStyler | null = null;
  private settings: ExtensionSettings = DEFAULT_SETTINGS;
  private mutationObserver: MutationObserver | null = null;
  private debounceTimer: number | null = null;
  private isInitialized: boolean = false;
  private overlayContainer: HTMLElement | null = null;

  constructor() {
    this.detector = new FocusmateDOMDetector(false);
    this.loadSettings();
    this.setupStorageListener();
  }

  /**
   * Initializes the content script
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }

  /**
   * Main initialization logic
   */
  private async initialize(): Promise<void> {
    this.log('Initializing content script...');

    // Check if overlay is enabled
    if (!this.settings.overlayEnabled) {
      this.log('Overlay is disabled in settings');
      return;
    }

    // Initialize conflict styler
    this.conflictStyler = new ConflictStyler(
      this.settings.conflictColor,
      this.settings.debugLogging
    );

    // Create overlay container
    this.createOverlayContainer();

    // Set up MutationObserver
    this.setupMutationObserver();

    // Initial data fetch and render
    await this.updateData();

    this.isInitialized = true;
    this.log('Content script initialized');
  }

  /**
   * Creates the overlay container element
   */
  private createOverlayContainer(): void {
    // Remove existing container if present
    const existing = document.getElementById('fmcal-overlay-container');
    if (existing) {
      existing.remove();
    }

    // Create new container
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = 'fmcal-overlay-container';
    document.body.appendChild(this.overlayContainer);

    // Create overlay
    this.overlay = new CalendarOverlay(this.overlayContainer);
  }

  /**
   * Sets up MutationObserver to detect DOM changes
   */
  private setupMutationObserver(): void {
    // Find calendar grid container (try multiple selectors)
    const containerSelectors = [
      '[data-calendar-grid]',
      '.calendar-grid',
      '[role="grid"]',
      'main',
      'body',
    ];

    let target: Node | null = null;
    for (const selector of containerSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        target = element;
        break;
      }
    }

    // Fallback to body if no specific container found
    if (!target) {
      target = document.body;
    }

    // Create observer with debounced callback
    this.mutationObserver = new MutationObserver(() => {
      this.debounceUpdate();
    });

    // Start observing
    this.mutationObserver.observe(target, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    this.log('MutationObserver set up on:', target);
  }

  /**
   * Debounced update function (200ms delay)
   */
  private debounceUpdate(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.updateData().catch((error) => {
        this.log('Error in debounced update:', error);
      });
    }, 200);
  }

  /**
   * Updates data and re-renders overlay and conflicts
   */
  private async updateData(): Promise<void> {
    if (!this.overlay || !this.conflictStyler) {
      return;
    }

    try {
      // Detect date range
      const dateRange = this.detector.detectDateRange(document);
      if (!dateRange) {
        this.log('Could not detect date range');
        return;
      }

      // Update overlay date range
      this.overlay.updateDateRange({
        startMs: dateRange.startMs,
        endMs: dateRange.endMs,
      });

      // Extract sessions from DOM (if needed)
      const sessionsFromDom = this.detector.extractSessionsFromDOM(
        document,
        dateRange
      );

      // Request data from background
      const response = await this.fetchDataForRange(dateRange, sessionsFromDom);

      if (!response.ok) {
        this.log('Error fetching data:', response.error);
        // Show error in overlay or keep existing data
        return;
      }

      // Update overlay with events
      if (response.events) {
        this.overlay.render(response.events);
      }

      // Apply conflict styling
      if (response.conflicts && response.sessions) {
        await this.applyConflictStyling(response.conflicts, response.sessions);
      }
    } catch (error) {
      this.log('Error updating data:', error);
    }
  }

  /**
   * Applies conflict styling to session elements
   */
  private async applyConflictStyling(
    conflicts: Record<string, string[]>,
    sessions: Array<{ id: string; startMs: number; endMs: number; title?: string }>
  ): Promise<void> {
    if (!this.conflictStyler) {
      return;
    }

    // Find session elements and create map
    const sessionElements = new Map<string, HTMLElement>();
    const sessionElementsList = this.detector.findSessionElements(document);

    // Create session key map from sessions
    const sessionKeyMap = new Map<string, string>();
    for (const session of sessions) {
      const key = generateSessionKey(session.startMs, session.endMs, session.title);
      sessionKeyMap.set(session.id, key);
    }

    // Match elements to session keys
    for (const element of sessionElementsList) {
      const dateRange = this.detector.detectDateRange(document);
      if (!dateRange) {
        continue;
      }

      const sessionKey = this.detector.getSessionKey(element, dateRange);
      if (sessionKey) {
        sessionElements.set(sessionKey, element);
      }
    }

    // Also try to match by session IDs from the sessions array
    for (const session of sessions) {
      const sessionKey = generateSessionKey(
        session.startMs,
        session.endMs,
        session.title
      );

      // Try to find element by searching for time range
      if (!sessionElements.has(sessionKey)) {
        // Find element that matches this session's time range
        for (const element of sessionElementsList) {
          const elementKey = this.detector.getSessionKey(element, dateRange!);
          if (elementKey === sessionKey) {
            sessionElements.set(sessionKey, element);
            break;
          }
        }
      }
    }

    // Apply conflicts
    this.conflictStyler.applyConflicts(conflicts, sessionElements);
  }

  /**
   * Fetches data from background service worker
   */
  private async fetchDataForRange(
    dateRange: DetectedDateRange,
    sessionsFromDom: Array<{ id: string; startMs: number; endMs: number; title?: string }>
  ): Promise<RangeDataResponse> {
    const message: FetchDataForRangeMessage = {
      type: 'FETCH_DATA_FOR_RANGE',
      range: {
        startMs: dateRange.startMs,
        endMs: dateRange.endMs,
      },
      visibleView: dateRange.viewType,
      sessionsFromDom: sessionsFromDom.length > 0 ? sessionsFromDom : undefined,
    };

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response: RangeDataResponse) => {
        if (chrome.runtime.lastError) {
          resolve({
            ok: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          resolve(response || { ok: false, error: 'No response from background' });
        }
      });
    });
  }

  /**
   * Loads settings from storage
   */
  private async loadSettings(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(Object.values(DEFAULT_SETTINGS), (items) => {
        this.settings = {
          overlayEnabled: items.overlayEnabled ?? DEFAULT_SETTINGS.overlayEnabled,
          conflictColor: items.conflictColor ?? DEFAULT_SETTINGS.conflictColor,
          calendarIds: items.calendarIds ?? DEFAULT_SETTINGS.calendarIds,
          focusmateApiKey: items.focusmateApiKey ?? DEFAULT_SETTINGS.focusmateApiKey,
          debugLogging: items.debugLogging ?? DEFAULT_SETTINGS.debugLogging,
        };

        // Update detector debug logging
        this.detector = new FocusmateDOMDetector(this.settings.debugLogging);

        // Update conflict styler if it exists
        if (this.conflictStyler) {
          this.conflictStyler.updateConflictColor(this.settings.conflictColor);
        }

        resolve();
      });
    });
  }

  /**
   * Sets up storage change listener
   */
  private setupStorageListener(): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') {
        return;
      }

      this.log('Settings changed, reloading...');

      // Reload settings
      this.loadSettings().then(() => {
        // Re-initialize if overlay was toggled
        if (changes.overlayEnabled) {
          if (this.settings.overlayEnabled && !this.isInitialized) {
            this.initialize();
          } else if (!this.settings.overlayEnabled && this.isInitialized) {
            this.cleanup();
          }
        }

        // Update conflict color if changed
        if (changes.conflictColor && this.conflictStyler) {
          this.conflictStyler.updateConflictColor(this.settings.conflictColor);
        }

        // Update debug logging
        if (changes.debugLogging) {
          this.detector = new FocusmateDOMDetector(this.settings.debugLogging);
        }

        // Re-fetch data if calendar selection changed
        if (changes.calendarIds) {
          this.updateData();
        }
      });
    });
  }

  /**
   * Cleans up resources
   */
  private cleanup(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }

    if (this.overlayContainer) {
      this.overlayContainer.remove();
      this.overlayContainer = null;
    }

    if (this.conflictStyler) {
      this.conflictStyler.clearConflicts();
      this.conflictStyler = null;
    }

    this.isInitialized = false;
  }

  /**
   * Logging helper
   */
  private log(...args: unknown[]): void {
    if (this.settings.debugLogging) {
      console.log('[FocusmateCalendar]', ...args);
    }
  }
}

// Initialize content script
const controller = new ContentScriptController();
controller.init().catch((error) => {
  console.error('Failed to initialize content script:', error);
});

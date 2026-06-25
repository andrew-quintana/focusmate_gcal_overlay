/**
 * Content script for Chrome extension
 * 
 * Main entry point for content script functionality:
 * - Detects Focusmate page and sessions
 * - Renders calendar overlay
 * - Applies conflict highlighting
 * - Handles DOM mutations and route changes
 */

// Immediate logging to verify script is loaded
console.log('[FocusmateCalendar] Content script loaded', {
  hostname: window.location.hostname,
  url: window.location.href,
  readyState: document.readyState,
});

import type {
  FetchDataForRangeMessage,
  GetSettingsMessage,
  RangeDataResponse,
  SettingsResponse,
} from '../types/messages';
import type { ExtensionSettings } from '../types/storage';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../types/storage';
import { FocusmateDOMDetector, type DetectedDateRange } from './domDetector';
import { CalendarTimeSlotOverlay } from './calendarOverlay';
import { generateSessionKey } from '../utils/sessionNormalization';

/**
 * Main content script controller
 */
class ContentScriptController {
  private detector: FocusmateDOMDetector;
  private calendarOverlay: CalendarTimeSlotOverlay | null = null;
  private settings: ExtensionSettings = DEFAULT_SETTINGS;
  private mutationObserver: MutationObserver | null = null;
  private debounceTimer: number | null = null;
  private scrollTimer: number | null = null;
  private isInitialized: boolean = false;
  private calendarOverlayContainer: HTMLElement | null = null;
  private scrollHandler: (() => void) | null = null;

  constructor() {
    this.detector = new FocusmateDOMDetector(false);
    this.loadSettings();
    this.setupStorageListener();
  }

  /**
   * Initializes the content script
   */
  async init(): Promise<void> {
    console.log('[FocusmateCalendar] init() called', {
      isInitialized: this.isInitialized,
      readyState: document.readyState,
    });
    
    if (this.isInitialized) {
      console.log('[FocusmateCalendar] Already initialized, skipping');
      return;
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      console.log('[FocusmateCalendar] DOM still loading, waiting for DOMContentLoaded');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[FocusmateCalendar] DOMContentLoaded fired, calling initialize()');
        this.initialize();
      });
    } else {
      console.log('[FocusmateCalendar] DOM ready, calling initialize() immediately');
      this.initialize();
    }
  }

  /**
   * Checks if we're on Focusmate
   */
  private isFocusmate(): boolean {
    const isFM = window.location.hostname === 'app.focusmate.com';
    console.log('[FocusmateCalendar] isFocusmate check:', {
      hostname: window.location.hostname,
      isFocusmate: isFM,
      url: window.location.href,
    });
    return isFM;
  }

  /**
   * Main initialization logic
   */
  private async initialize(): Promise<void> {
    console.log('[FocusmateCalendar] Initializing content script...', {
      hostname: window.location.hostname,
      url: window.location.href,
      overlayEnabled: this.settings.overlayEnabled,
    });
    this.log('Initializing content script...');

    // Only run on Focusmate
    if (!this.isFocusmate()) {
      this.log('Not on Focusmate, not initializing');
      return;
    }

    // Check if overlay is enabled
    if (!this.settings.overlayEnabled) {
      console.log('[FocusmateCalendar] Overlay is disabled in settings');
      this.log('Overlay is disabled in settings');
      return;
    }

    // Aggressively remove any existing dropdown overlay (cleanup)
    this.removeDropdownOverlay();

    // Create calendar overlay container (no dropdown)
    this.createFocusmateCalendarOverlayContainer();
    
    // Set up continuous monitoring to prevent dropdown overlay from appearing
    this.setupDropdownOverlayPrevention();

    // Set up MutationObserver
    this.setupMutationObserver();

    // Set up scroll listeners
    this.setupScrollListeners();

    // Initial data fetch and render
    await this.updateData();

    this.isInitialized = true;
    this.log('Content script initialized for Focusmate');
  }

  /**
   * Removes dropdown overlay if it exists
   */
  private removeDropdownOverlay(): void {
    const existingDropdown = document.getElementById('fmcal-overlay-container');
    if (existingDropdown) {
      console.log('[FocusmateCalendar] Removing existing dropdown overlay');
      existingDropdown.remove();
    }
    
    // Also check for shadow DOM overlays
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      if (element.shadowRoot) {
        const shadowDropdown = element.shadowRoot.getElementById('fmcal-overlay-container');
        if (shadowDropdown) {
          console.log('[FocusmateCalendar] Removing dropdown overlay from shadow DOM');
          shadowDropdown.remove();
        }
      }
    }
  }

  /**
   * Sets up continuous monitoring to prevent dropdown overlay
   */
  private setupDropdownOverlayPrevention(): void {
    // Check every second for dropdown overlay and remove it
    setInterval(() => {
      this.removeDropdownOverlay();
    }, 1000);
    
    // Also watch for it in mutation observer
    const observer = new MutationObserver(() => {
      this.removeDropdownOverlay();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Creates the Focusmate calendar overlay container
   */
  private createFocusmateCalendarOverlayContainer(): void {
    // Remove existing container if present
    const existing = document.getElementById('fmcal-calendar-overlay-container');
    if (existing) {
      existing.remove();
    }

    // Find Focusmate calendar grid to position overlay relative to it
    const calendarGrid = this.findFocusmateCalendarGrid();
    if (!calendarGrid) {
      this.log('Focusmate calendar grid not found, calendar overlay disabled');
      return;
    }

    // Create new container positioned relative to calendar grid
    this.calendarOverlayContainer = document.createElement('div');
    this.calendarOverlayContainer.id = 'fmcal-calendar-overlay-container';
    this.calendarOverlayContainer.style.position = 'absolute';
    this.calendarOverlayContainer.style.pointerEvents = 'none';
    this.calendarOverlayContainer.style.zIndex = '1000';
    this.calendarOverlayContainer.style.overflow = 'visible';
    
    // Position container to match calendar grid
    this.updateCalendarOverlayPosition();
    
    // Insert container right after calendar grid or as child of body
    calendarGrid.parentElement?.appendChild(this.calendarOverlayContainer) || 
    document.body.appendChild(this.calendarOverlayContainer);

    // Create calendar overlay
    this.calendarOverlay = new CalendarTimeSlotOverlay(
      this.calendarOverlayContainer,
      this.settings.debugLogging
    );
  }

  /**
   * Finds the Focusmate calendar grid element
   */
  private findFocusmateCalendarGrid(): HTMLElement | null {
    // Try multiple selectors for Focusmate calendar
    // Based on the UI, the calendar is in the center with time slots
    const selectors = [
      // Look for elements with time slots (the calendar grid)
      '[class*="time-slot"]',
      '[class*="TimeSlot"]',
      '[class*="calendar-grid"]',
      '[class*="CalendarGrid"]',
      '[class*="calendar-view"]',
      '[class*="CalendarView"]',
      // Look for elements containing time labels like "06:00", "07:00"
      '[class*="time-column"]',
      '[class*="TimeColumn"]',
      // Look for the main calendar area
      '[data-calendar-grid]',
      '.calendar-grid',
      '[role="grid"]',
      '.calendar-container',
      '[class*="calendar"]',
      '[class*="Calendar"]',
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        // Verify it looks like a calendar (has time slots or day columns)
        if (this.looksLikeCalendar(element as HTMLElement)) {
          this.log(`Found calendar grid using selector: ${selector}`);
          return element as HTMLElement;
        }
      }
    }

    // Fallback: look for elements with calendar-like structure
    // Look for elements that contain both time labels and day columns
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      if (this.looksLikeCalendar(element as HTMLElement)) {
        // Prefer elements that are more likely to be the calendar grid
        const rect = (element as HTMLElement).getBoundingClientRect();
        // Calendar should be reasonably sized (not too small)
        if (rect.width > 400 && rect.height > 300) {
          this.log('Found calendar grid by size and structure');
          return element as HTMLElement;
        }
      }
    }

    this.log('Calendar grid not found');
    return null;
  }

  /**
   * Checks if an element looks like a calendar grid
   */
  private looksLikeCalendar(element: HTMLElement): boolean {
    // Check for time-related text or structure
    const text = element.textContent || '';
    // Match time patterns like "06:00", "6:00 AM", "06:30", etc.
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
    
    // Check if it has time slots (time labels)
    const hasTimeSlots = timePattern.test(text);
    
    // Check for day columns (day names or dates)
    const hasDayColumns = element.querySelectorAll(
      '[role="columnheader"], th, [data-day], [class*="day"], [class*="Day"], [class*="column"], [class*="Column"]'
    ).length > 0;
    
    // Check for day names in text
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hasDayNames = dayNames.some(day => text.includes(day));
    
    // Check for PST/EST timezone indicators (common in Focusmate)
    const hasTimezone = /PST|EST|CST|MST|UTC/i.test(text);
    
    // Must have time slots AND (day columns OR day names)
    return hasTimeSlots && (hasDayColumns || hasDayNames || hasTimezone);
  }

  /**
   * Sets up scroll event listeners
   */
  private setupScrollListeners(): void {
    this.scrollHandler = () => {
      this.handleScroll();
    };

    window.addEventListener('scroll', this.scrollHandler, true);
    window.addEventListener('resize', this.scrollHandler);
    
    // Also listen to calendar grid scroll
    const calendarGrid = this.findFocusmateCalendarGrid();
    if (calendarGrid) {
      calendarGrid.addEventListener('scroll', this.scrollHandler, true);
    }
  }

  /**
   * Updates calendar overlay container position
   */
  private updateCalendarOverlayPosition(): void {
    if (!this.calendarOverlayContainer) {
      return;
    }

    const calendarGrid = this.findFocusmateCalendarGrid();
    if (!calendarGrid) {
      return;
    }

    const gridRect = calendarGrid.getBoundingClientRect();
    
    // Position relative to grid's parent or use absolute positioning
    const parent = calendarGrid.parentElement;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      this.calendarOverlayContainer.style.position = 'absolute';
      this.calendarOverlayContainer.style.left = `${gridRect.left - parentRect.left}px`;
      this.calendarOverlayContainer.style.top = `${gridRect.top - parentRect.top}px`;
    } else {
      const scrollX = window.scrollX || 0;
      const scrollY = window.scrollY || 0;
      this.calendarOverlayContainer.style.position = 'fixed';
      this.calendarOverlayContainer.style.left = `${gridRect.left}px`;
      this.calendarOverlayContainer.style.top = `${gridRect.top}px`;
    }
    
    this.calendarOverlayContainer.style.width = `${gridRect.width}px`;
    this.calendarOverlayContainer.style.height = `${gridRect.height}px`;
  }

  /**
   * Handles scroll events and updates overlay
   */
  private handleScroll(): void {
    if (this.scrollTimer !== null) {
      clearTimeout(this.scrollTimer);
    }

    this.scrollTimer = window.setTimeout(() => {
      this.updateCalendarOverlayPosition();

      // Trigger re-render of boxes if calendar overlay exists
      if (this.calendarOverlay) {
        // The overlay will re-render itself using stored sessions/conflicts
        // But we can also trigger a full update if needed
        this.updateData().catch((error) => {
          this.log('Error updating calendar overlay on scroll:', error);
        });
      }
    }, 50);
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
   * Updates data and re-renders calendar overlay
   */
  private async updateData(): Promise<void> {
    try {
      // Only run on Focusmate
      if (!this.isFocusmate()) {
        return;
      }

      // Detect date range from Focusmate calendar
      const dateRange = this.detector.detectDateRange(document);
      if (!dateRange) {
        this.log('Could not detect date range');
        return;
      }

      // Extract sessions from DOM
      const sessionsFromDom = this.detector.extractSessionsFromDOM(document, dateRange);

      // Request data from background
      const response = await this.fetchDataForRange(dateRange, sessionsFromDom);

      // Handle errors
      if (!response.ok) {
        console.error('[FocusmateCalendar] Error fetching data:', response.error);
        this.log('Error fetching data:', response.error);
        // Clear overlay on error
        if (this.calendarOverlay) {
          this.calendarOverlay.clear();
        }
        return;
      }

      // Update calendar overlay with sessions and conflicts
      if (this.calendarOverlay) {
        console.log('[FocusmateCalendar] Processing response:', {
          ok: response.ok,
          sessionsCount: response.sessions?.length || 0,
          conflictsCount: Object.keys(response.conflicts || {}).length,
        });
        
        if (response.sessions && response.sessions.length > 0) {
          console.log(`[FocusmateCalendar] Updating calendar overlay with ${response.sessions.length} sessions and ${Object.keys(response.conflicts || {}).length} conflicts`);
          this.log(`Updating calendar overlay with ${response.sessions.length} sessions and ${Object.keys(response.conflicts || {}).length} conflicts`);
          this.calendarOverlay.update(
            response.sessions,
            response.conflicts || {}
          );
        } else {
          console.log('[FocusmateCalendar] No sessions to display, clearing overlay');
          this.log('No sessions to display, clearing overlay');
          this.calendarOverlay.clear();
        }
      }
    } catch (error) {
      this.log('Error updating data:', error);
    }
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
      // Explicitly create array of storage keys to avoid type issues
      const keys = [
        STORAGE_KEYS.OVERLAY_ENABLED,
        STORAGE_KEYS.CONFLICT_COLOR,
        STORAGE_KEYS.CALENDAR_IDS,
        STORAGE_KEYS.FOCUSMATE_API_KEY,
        STORAGE_KEYS.DEBUG_LOGGING,
      ];
      
      chrome.storage.local.get(keys, (items) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading settings:', chrome.runtime.lastError);
          // Use defaults on error
          this.settings = { ...DEFAULT_SETTINGS };
          resolve();
          return;
        }

        this.settings = {
          overlayEnabled: items[STORAGE_KEYS.OVERLAY_ENABLED] ?? DEFAULT_SETTINGS.overlayEnabled,
          conflictColor: items[STORAGE_KEYS.CONFLICT_COLOR] ?? DEFAULT_SETTINGS.conflictColor,
          calendarIds: items[STORAGE_KEYS.CALENDAR_IDS] ?? DEFAULT_SETTINGS.calendarIds,
          focusmateApiKey: items[STORAGE_KEYS.FOCUSMATE_API_KEY] ?? DEFAULT_SETTINGS.focusmateApiKey,
          debugLogging: items[STORAGE_KEYS.DEBUG_LOGGING] ?? DEFAULT_SETTINGS.debugLogging,
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

    if (this.scrollTimer !== null) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = null;
    }

    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
      window.removeEventListener('resize', this.scrollHandler);
      const calendarGrid = this.findFocusmateCalendarGrid();
      if (calendarGrid) {
        calendarGrid.removeEventListener('scroll', this.scrollHandler, true);
      }
      this.scrollHandler = null;
    }

    if (this.calendarOverlay) {
      this.calendarOverlay.destroy();
      this.calendarOverlay = null;
    }

    if (this.calendarOverlayContainer) {
      this.calendarOverlayContainer.remove();
      this.calendarOverlayContainer = null;
    }

    this.isInitialized = false;
  }

  /**
   * Converts technical error messages to user-friendly messages
   * 
   * @param error - Technical error message
   * @returns User-friendly error message
   */
  private getUserFriendlyErrorMessage(error: string): string {
    if (!error) {
      return 'Unable to load calendar events. Please try again later.';
    }

    const lowerError = error.toLowerCase();

    // Service worker errors
    if (lowerError.includes('message port closed') || lowerError.includes('receiving end does not exist') || lowerError.includes('extension context invalidated')) {
      return 'Extension connection lost. Please reload the page.';
    }

    // Authentication errors
    if (lowerError.includes('auth') || lowerError.includes('token') || lowerError.includes('oauth') || lowerError.includes('401')) {
      return 'Please sign in to Google Calendar. Click the extension icon to authenticate.';
    }

    // Network errors
    if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection') || lowerError.includes('failed to fetch')) {
      return 'Unable to connect to Google Calendar. Please check your internet connection.';
    }

    // Rate limit errors
    if (lowerError.includes('rate limit') || lowerError.includes('quota') || lowerError.includes('429')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // Permission errors
    if (lowerError.includes('permission') || lowerError.includes('unauthorized') || lowerError.includes('403') || lowerError.includes('forbidden')) {
      return 'Permission denied. Please check your Google Calendar access settings.';
    }

    // Calendar not found
    if (lowerError.includes('not found') || lowerError.includes('404')) {
      return 'Calendar not found. Please check your calendar selection in settings.';
    }

    // API errors
    if (lowerError.includes('google calendar api error') || lowerError.includes('500') || lowerError.includes('503')) {
      return 'Google Calendar service error. Please try again in a moment.';
    }

    // Show actual error if debug logging is enabled, otherwise generic message
    if (this.settings.debugLogging) {
      return `Error: ${error}`;
    }

    // Generic error
    return 'Unable to load calendar events. Please try again later.';
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
console.log('[FocusmateCalendar] Creating controller and initializing...');
const controller = new ContentScriptController();
controller.init().catch((error) => {
  console.error('[FocusmateCalendar] Failed to initialize content script:', error);
});

// Aggressively remove any existing dropdown overlay immediately
if (window.location.hostname === 'app.focusmate.com') {
  console.log('[FocusmateCalendar] On Focusmate - removing any existing dropdown');
  
  const removeDropdown = () => {
    const existingDropdown = document.getElementById('fmcal-overlay-container');
    if (existingDropdown) {
      console.log('[FocusmateCalendar] Found and removing dropdown overlay');
      existingDropdown.remove();
    }
    
    // Also check shadow DOMs
    document.querySelectorAll('*').forEach(element => {
      if (element.shadowRoot) {
        const shadowDropdown = element.shadowRoot.getElementById('fmcal-overlay-container');
        if (shadowDropdown) {
          console.log('[FocusmateCalendar] Removing dropdown overlay from shadow DOM');
          shadowDropdown.remove();
        }
      }
    });
  };
  
  // Remove immediately
  removeDropdown();
  
  // Remove after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeDropdown);
  }
  
  // Remove after a delay
  setTimeout(removeDropdown, 1000);
  setTimeout(removeDropdown, 3000);
  
  // Set up continuous monitoring
  setInterval(removeDropdown, 2000);
}

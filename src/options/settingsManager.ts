/**
 * Settings manager for options page
 * Handles loading, saving, and validating extension settings
 */

import type { ExtensionSettings } from '../types/storage';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../types/storage';

/**
 * Calendar information from Google Calendar API
 */
export interface CalendarInfo {
  id: string;
  summary: string;
  accountId?: string;
  accountName?: string;
  groupId?: string;
  groupName?: string;
}

/**
 * SettingsManager handles settings operations for the options page
 */
export class SettingsManager {
  /**
   * Loads settings from chrome.storage.local
   * 
   * @returns Promise resolving to ExtensionSettings object
   */
  async loadSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(
        Object.values(STORAGE_KEYS),
        (items) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message || 'Failed to load settings'));
            return;
          }

          const settings: ExtensionSettings = {
            overlayEnabled: items[STORAGE_KEYS.OVERLAY_ENABLED] ?? DEFAULT_SETTINGS.overlayEnabled,
            conflictColor: items[STORAGE_KEYS.CONFLICT_COLOR] ?? DEFAULT_SETTINGS.conflictColor,
            calendarIds: items[STORAGE_KEYS.CALENDAR_IDS] ?? DEFAULT_SETTINGS.calendarIds,
            focusmateApiKey: items[STORAGE_KEYS.FOCUSMATE_API_KEY] ?? DEFAULT_SETTINGS.focusmateApiKey,
            debugLogging: items[STORAGE_KEYS.DEBUG_LOGGING] ?? DEFAULT_SETTINGS.debugLogging,
          };

          resolve(settings);
        }
      );
    });
  }

  /**
   * Saves settings to chrome.storage.local
   * 
   * @param settings - Partial settings object to save
   * @returns Promise that resolves when settings are saved
   */
  async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    // Validate settings before saving
    this.validateSettings(settings);

    const items: Record<string, unknown> = {};

    if (settings.overlayEnabled !== undefined) {
      items[STORAGE_KEYS.OVERLAY_ENABLED] = settings.overlayEnabled;
    }

    if (settings.conflictColor !== undefined) {
      items[STORAGE_KEYS.CONFLICT_COLOR] = settings.conflictColor;
    }

    if (settings.calendarIds !== undefined) {
      items[STORAGE_KEYS.CALENDAR_IDS] = settings.calendarIds;
    }

    if (settings.focusmateApiKey !== undefined) {
      items[STORAGE_KEYS.FOCUSMATE_API_KEY] = settings.focusmateApiKey;
    }

    if (settings.debugLogging !== undefined) {
      items[STORAGE_KEYS.DEBUG_LOGGING] = settings.debugLogging;
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || 'Failed to save settings'));
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Gets available calendars from Google Calendar API
   * Supports multiple accounts and calendar groups
   * 
   * @returns Promise resolving to array of calendar info objects
   */
  async getAvailableCalendars(): Promise<CalendarInfo[]> {
    return new Promise((resolve, reject) => {
      // Send message to background service worker to fetch calendars
      chrome.runtime.sendMessage(
        { type: 'GET_CALENDARS' },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message || 'Failed to get calendars'));
            return;
          }

          if (!response || !response.ok) {
            reject(new Error(response?.error || 'Failed to get calendars'));
            return;
          }

          resolve(response.calendars || []);
        }
      );
    });
  }

  /**
   * Validates settings before saving
   * 
   * @param settings - Partial settings object to validate
   * @throws Error if validation fails
   */
  private validateSettings(settings: Partial<ExtensionSettings>): void {
    // Validate conflict color format
    if (settings.conflictColor !== undefined) {
      if (!this.isValidColor(settings.conflictColor)) {
        throw new Error('Invalid color format. Use hex (#rrggbb) or CSS color names.');
      }
    }

    // Validate calendar IDs
    if (settings.calendarIds !== undefined) {
      if (!Array.isArray(settings.calendarIds)) {
        throw new Error('calendarIds must be an array');
      }
      if (settings.calendarIds.length === 0) {
        throw new Error('At least one calendar must be selected');
      }
    }

    // Validate API key format (if provided)
    if (settings.focusmateApiKey !== undefined && settings.focusmateApiKey !== null) {
      if (typeof settings.focusmateApiKey !== 'string') {
        throw new Error('Focusmate API key must be a string');
      }
      if (settings.focusmateApiKey.trim().length === 0) {
        // Empty string is allowed (clears API key)
        settings.focusmateApiKey = null;
      }
    }
  }

  /**
   * Validates if a string is a valid CSS color
   * 
   * @param color - Color string to validate
   * @returns True if valid color, false otherwise
   */
  private isValidColor(color: string): boolean {
    // Check hex format (#rrggbb or #rgb)
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
      return true;
    }

    // Check CSS color names (basic check - create element and check if color is valid)
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  }
}


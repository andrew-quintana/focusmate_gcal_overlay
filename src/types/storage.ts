/**
 * Storage schema and keys for extension settings
 */

/**
 * Extension settings stored in chrome.storage.local
 */
export interface ExtensionSettings {
  overlayEnabled: boolean;        // default: true
  conflictColor: string;          // default: "#ff6b6b"
  calendarIds: string[];          // default: ["primary"]
  focusmateApiKey: string | null; // optional
  debugLogging: boolean;          // default: false
}

/**
 * Storage keys for extension settings
 */
export const STORAGE_KEYS = {
  OVERLAY_ENABLED: 'overlayEnabled',
  CONFLICT_COLOR: 'conflictColor',
  CALENDAR_IDS: 'calendarIds',
  FOCUSMATE_API_KEY: 'focusmateApiKey',
  DEBUG_LOGGING: 'debugLogging',
} as const;

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  overlayEnabled: true,
  conflictColor: '#ff6b6b',
  calendarIds: ['primary'],
  focusmateApiKey: null,
  debugLogging: false,
};


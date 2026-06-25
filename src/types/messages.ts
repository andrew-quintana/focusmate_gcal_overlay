/**
 * Message types for communication between content script and background service worker
 */

import type { FocusmateSession } from './events';

/**
 * Message sent from content script to background requesting data for a date range
 */
export interface FetchDataForRangeMessage {
  type: 'FETCH_DATA_FOR_RANGE';
  range: { startMs: number; endMs: number };
  timezone?: string;
  visibleView?: 'day' | 'week' | 'unknown';
  sessionsFromDom?: FocusmateSession[]; // only if DOM approach
}

/**
 * Response from background with events, sessions, and conflicts
 */
export interface RangeDataResponse {
  ok: boolean;
  error?: string;
  events?: import('./events').GCalEvent[];
  sessions?: FocusmateSession[];
  conflicts?: import('./events').ConflictMap;
}

/**
 * Message to request current settings
 */
export interface GetSettingsMessage {
  type: 'GET_SETTINGS';
}

/**
 * Message to request available calendars
 */
export interface GetCalendarsMessage {
  type: 'GET_CALENDARS';
}

/**
 * Message to check authentication status
 */
export interface CheckAuthMessage {
  type: 'CHECK_AUTH';
}

/**
 * Message to trigger authentication
 */
export interface AuthenticateMessage {
  type: 'AUTHENTICATE';
}

/**
 * Response for authentication status
 */
export interface AuthStatusResponse {
  authenticated: boolean;
  error?: string;
}

/**
 * Response for authentication request
 */
export interface AuthenticateResponse {
  ok: boolean;
  error?: string;
}

/**
 * Response with current extension settings
 */
export interface SettingsResponse {
  overlayEnabled: boolean;
  conflictColor: string;
  calendarIds: string[];
  focusmateApiKey: string | null;
  debugLogging: boolean;
}

/**
 * Response with available calendars
 */
export interface CalendarsResponse {
  ok: boolean;
  error?: string;
  calendars?: Array<{
    id: string;
    summary: string;
    accountId?: string;
    accountName?: string;
    groupId?: string;
    groupName?: string;
  }>;
}

/**
 * Union type for all messages from content script or options page
 */
export type ContentToBackgroundMessage = FetchDataForRangeMessage | GetSettingsMessage | GetCalendarsMessage | CheckAuthMessage | AuthenticateMessage;

/**
 * Union type for all messages from background
 */
export type BackgroundToContentMessage = RangeDataResponse | SettingsResponse | CalendarsResponse | AuthStatusResponse | AuthenticateResponse;


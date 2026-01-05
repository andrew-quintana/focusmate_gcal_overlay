/**
 * DOM detection utilities for Focusmate sessions
 * 
 * Critical: Focusmate DOM has no stable identifiers. This module uses
 * multiple selector strategies with fallbacks to detect sessions and date ranges.
 */

import type { FocusmateSession } from '../types/events';
import { generateSessionKey } from '../utils/sessionNormalization';

/**
 * Detected date range from Focusmate UI
 */
export interface DetectedDateRange {
  startMs: number;
  endMs: number;
  viewType: 'day' | 'week' | 'unknown';
}

/**
 * Focusmate DOM detector with multiple selector strategies
 */
export class FocusmateDOMDetector {
  private debugLogging: boolean;

  constructor(debugLogging = false) {
    this.debugLogging = debugLogging;
  }

  /**
   * Detects the visible date range from Focusmate UI
   * 
   * Strategies:
   * 1. Look for date indicators in the UI (e.g., "Today", "Jan 15", "Week of Jan 15")
   * 2. Look for calendar grid elements with date attributes
   * 3. Fallback to current day if unable to detect
   */
  detectDateRange(document: Document): DetectedDateRange | null {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Strategy 1: Look for date text in page
    const dateText = this.findDateText(document);
    if (dateText) {
      const parsed = this.parseDateText(dateText, now);
      if (parsed) {
        this.log('Detected date range from text:', parsed);
        return parsed;
      }
    }

    // Strategy 2: Look for calendar grid with date attributes
    const gridRange = this.detectFromCalendarGrid(document, now);
    if (gridRange) {
      this.log('Detected date range from calendar grid:', gridRange);
      return gridRange;
    }

    // Strategy 3: Look for week view indicators
    const weekRange = this.detectWeekView(document, now);
    if (weekRange) {
      this.log('Detected week view range:', weekRange);
      return weekRange;
    }

    // Fallback: Default to today
    this.log('Using fallback: today');
    return {
      startMs: today.getTime(),
      endMs: tomorrow.getTime(),
      viewType: 'day',
    };
  }

  /**
   * Extracts Focusmate sessions from DOM
   * 
   * Uses multiple selector strategies:
   * 1. Accessibility labels with time information
   * 2. Time text parsing (e.g., "10:00 AM - 10:25 AM")
   * 3. Data attributes (if available)
   * 4. Derived keys from observable attributes
   */
  extractSessionsFromDOM(
    document: Document,
    dateContext: DetectedDateRange
  ): FocusmateSession[] {
    const sessions: FocusmateSession[] = [];

    // Strategy 1: Find elements with accessibility labels containing time
    const accessibleSessions = this.findSessionsByAccessibilityLabels(
      document,
      dateContext
    );
    sessions.push(...accessibleSessions);

    // Strategy 2: Find elements with time text patterns
    const timeTextSessions = this.findSessionsByTimeText(
      document,
      dateContext
    );
    // Merge, avoiding duplicates based on time range
    for (const session of timeTextSessions) {
      const key = generateSessionKey(session.startMs, session.endMs, session.title);
      if (!sessions.some(s => {
        const sKey = generateSessionKey(s.startMs, s.endMs, s.title);
        return sKey === key;
      })) {
        sessions.push(session);
      }
    }

    // Strategy 3: Find elements with data attributes
    const dataAttrSessions = this.findSessionsByDataAttributes(
      document,
      dateContext
    );
    for (const session of dataAttrSessions) {
      const key = generateSessionKey(session.startMs, session.endMs, session.title);
      if (!sessions.some(s => {
        const sKey = generateSessionKey(s.startMs, s.endMs, s.title);
        return sKey === key;
      })) {
        sessions.push(session);
      }
    }

    this.log(`Extracted ${sessions.length} sessions from DOM`);
    return sessions;
  }

  /**
   * Finds session DOM elements that can be styled
   * 
   * Returns elements that likely represent Focusmate sessions
   */
  findSessionElements(document: Document): HTMLElement[] {
    const elements: HTMLElement[] = [];

    // Strategy 1: Look for elements with time text
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
    const allElements = document.querySelectorAll('*');
    
    for (const element of allElements) {
      const text = element.textContent || '';
      if (timePattern.test(text)) {
        // Check if this element or its parent looks like a session block
        const sessionElement = this.findSessionContainer(element as HTMLElement);
        if (sessionElement && !elements.includes(sessionElement)) {
          elements.push(sessionElement);
        }
      }
    }

    // Strategy 2: Look for elements with aria-labels containing time
    const ariaElements = document.querySelectorAll('[aria-label*="AM"], [aria-label*="PM"], [aria-label*=":"]');
    for (const element of ariaElements) {
      const label = element.getAttribute('aria-label') || '';
      if (timePattern.test(label)) {
        const sessionElement = this.findSessionContainer(element as HTMLElement);
        if (sessionElement && !elements.includes(sessionElement)) {
          elements.push(sessionElement);
        }
      }
    }

    this.log(`Found ${elements.length} session elements`);
    return elements;
  }

  /**
   * Gets or generates a session key from a DOM element
   * 
   * Uses derived keys from time range and optional label
   */
  getSessionKey(
    element: HTMLElement,
    dateContext: DetectedDateRange
  ): string | null {
    // Try to extract time range from element
    const timeRange = this.extractTimeRangeFromElement(element, dateContext);
    if (!timeRange) {
      return null;
    }

    // Extract label/title if available
    const label = this.extractLabelFromElement(element);

    return generateSessionKey(timeRange.startMs, timeRange.endMs, label);
  }

  // Private helper methods

  private findDateText(document: Document): string | null {
    // Look for common date indicators
    const selectors = [
      '[data-date]',
      '[aria-label*="day"]',
      '[aria-label*="week"]',
      '.date-indicator',
      '.calendar-header',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('aria-label') || '';
        if (text) {
          return text;
        }
      }
    }

    // Look for text containing date patterns
    const datePattern = /(today|tomorrow|yesterday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{1,2})/i;
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent || '';
      if (datePattern.test(text)) {
        return text;
      }
    }

    return null;
  }

  private parseDateText(text: string, now: Date): DetectedDateRange | null {
    const lowerText = text.toLowerCase();

    // Check for "today"
    if (lowerText.includes('today')) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        startMs: today.getTime(),
        endMs: tomorrow.getTime(),
        viewType: 'day',
      };
    }

    // Check for week indicators - will be handled separately
    // (Note: detectWeekView needs document parameter, so we skip it here)

    // Try to parse specific date
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1], 10) - 1;
      const day = parseInt(dateMatch[2], 10);
      const year = now.getFullYear();
      const date = new Date(year, month, day);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      return {
        startMs: date.getTime(),
        endMs: nextDay.getTime(),
        viewType: 'day',
      };
    }

    return null;
  }

  private detectFromCalendarGrid(document: Document, now: Date): DetectedDateRange | null {
    // Look for calendar grid elements
    const gridSelectors = [
      '[data-calendar-grid]',
      '.calendar-grid',
      '[role="grid"]',
    ];

    for (const selector of gridSelectors) {
      const grid = document.querySelector(selector);
      if (grid) {
        // Try to extract date range from grid
        const dateAttr = grid.getAttribute('data-start-date') || grid.getAttribute('data-date');
        if (dateAttr) {
          const date = new Date(dateAttr);
          if (!isNaN(date.getTime())) {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            return {
              startMs: date.getTime(),
              endMs: nextDay.getTime(),
              viewType: 'day',
            };
          }
        }
      }
    }

    return null;
  }

  private detectWeekView(document: Document, now: Date): DetectedDateRange | null {
    // Check for week view indicators
    const weekIndicators = document.querySelectorAll(
      '[aria-label*="week"], .week-view, [data-view="week"]'
    );

    if (weekIndicators.length > 0) {
      // Calculate week range (Monday to Sunday)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 7);
      return {
        startMs: monday.getTime(),
        endMs: sunday.getTime(),
        viewType: 'week',
      };
    }

    return null;
  }

  private findSessionsByAccessibilityLabels(
    document: Document,
    dateContext: DetectedDateRange
  ): FocusmateSession[] {
    const sessions: FocusmateSession[] = [];
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i;

    const elements = document.querySelectorAll('[aria-label]');
    for (const element of elements) {
      const label = element.getAttribute('aria-label') || '';
      const match = label.match(timePattern);
      if (match) {
        const timeRange = this.parseTimeRange(match, dateContext);
        if (timeRange) {
          const title = this.extractLabelFromElement(element as HTMLElement);
          sessions.push({
            id: generateSessionKey(timeRange.startMs, timeRange.endMs, title),
            startMs: timeRange.startMs,
            endMs: timeRange.endMs,
            title,
          });
        }
      }
    }

    return sessions;
  }

  private findSessionsByTimeText(
    document: Document,
    dateContext: DetectedDateRange
  ): FocusmateSession[] {
    const sessions: FocusmateSession[] = [];
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null
    );

    const processedElements = new Set<Element>();
    let node: Node | null;

    while ((node = walker.nextNode())) {
      let element: Element | null = null;

      if (node.nodeType === Node.TEXT_NODE) {
        element = node.parentElement;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        element = node as Element;
      }

      if (!element || processedElements.has(element)) {
        continue;
      }

      const text = element.textContent || '';
      const match = text.match(timePattern);
      if (match) {
        processedElements.add(element);
        const timeRange = this.parseTimeRange(match, dateContext);
        if (timeRange) {
          const title = this.extractLabelFromElement(element as HTMLElement);
          sessions.push({
            id: generateSessionKey(timeRange.startMs, timeRange.endMs, title),
            startMs: timeRange.startMs,
            endMs: timeRange.endMs,
            title,
          });
        }
      }
    }

    return sessions;
  }

  private findSessionsByDataAttributes(
    document: Document,
    dateContext: DetectedDateRange
  ): FocusmateSession[] {
    const sessions: FocusmateSession[] = [];

    // Look for elements with session-related data attributes
    const selectors = [
      '[data-session-time]',
      '[data-start-time]',
      '[data-session-id]',
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const timeAttr = element.getAttribute('data-session-time') ||
          element.getAttribute('data-start-time');
        if (timeAttr) {
          const timeRange = this.parseTimeString(timeAttr, dateContext);
          if (timeRange) {
            const title = this.extractLabelFromElement(element as HTMLElement);
            sessions.push({
              id: generateSessionKey(timeRange.startMs, timeRange.endMs, title),
              startMs: timeRange.startMs,
              endMs: timeRange.endMs,
              title,
            });
          }
        }
      }
    }

    return sessions;
  }

  private parseTimeRange(
    match: RegExpMatchArray,
    dateContext: DetectedDateRange
  ): { startMs: number; endMs: number } | null {
    try {
      const startHour = parseInt(match[1], 10);
      const startMin = parseInt(match[2], 10);
      const startPeriod = match[3]?.toUpperCase() || '';
      const endHour = parseInt(match[4], 10);
      const endMin = parseInt(match[6], 10);
      const endPeriod = match[7]?.toUpperCase() || '';

      // Convert to 24-hour format
      let startHour24 = startHour;
      if (startPeriod === 'PM' && startHour !== 12) {
        startHour24 += 12;
      } else if (startPeriod === 'AM' && startHour === 12) {
        startHour24 = 0;
      }

      let endHour24 = endHour;
      if (endPeriod === 'PM' && endHour !== 12) {
        endHour24 += 12;
      } else if (endPeriod === 'AM' && endHour === 12) {
        endHour24 = 0;
      }

      // Use the start of the detected date range as the date context
      const baseDate = new Date(dateContext.startMs);
      const startDate = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        startHour24,
        startMin
      );
      const endDate = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        endHour24,
        endMin
      );

      return {
        startMs: startDate.getTime(),
        endMs: endDate.getTime(),
      };
    } catch (error) {
      this.log('Error parsing time range:', error);
      return null;
    }
  }

  private parseTimeString(
    timeStr: string,
    dateContext: DetectedDateRange
  ): { startMs: number; endMs: number } | null {
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
    const match = timeStr.match(timePattern);
    if (match) {
      return this.parseTimeRange(match, dateContext);
    }
    return null;
  }

  private extractTimeRangeFromElement(
    element: HTMLElement,
    dateContext: DetectedDateRange
  ): { startMs: number; endMs: number } | null {
    // Try multiple strategies to extract time range
    const text = element.textContent || '';
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
    const match = text.match(timePattern);
    if (match) {
      return this.parseTimeRange(match, dateContext);
    }

    // Try aria-label
    const ariaLabel = element.getAttribute('aria-label') || '';
    const ariaMatch = ariaLabel.match(timePattern);
    if (ariaMatch) {
      return this.parseTimeRange(ariaMatch, dateContext);
    }

    // Try data attributes
    const dataTime = element.getAttribute('data-session-time') ||
      element.getAttribute('data-start-time');
    if (dataTime) {
      return this.parseTimeString(dataTime, dateContext);
    }

    return null;
  }

  private extractLabelFromElement(element: HTMLElement): string | undefined {
    // Try to find title/label in various places
    const titleSelectors = [
      '.session-title',
      '.title',
      '[data-title]',
      'h1, h2, h3, h4',
    ];

    for (const selector of titleSelectors) {
      const titleElement = element.querySelector(selector);
      if (titleElement) {
        const text = titleElement.textContent?.trim();
        if (text) {
          return text;
        }
      }
    }

    // Try aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      // Remove time information from label
      const cleaned = ariaLabel.replace(/\d{1,2}:\d{2}\s*(AM|PM)?/gi, '').trim();
      if (cleaned) {
        return cleaned;
      }
    }

    return undefined;
  }

  private findSessionContainer(element: HTMLElement): HTMLElement | null {
    // Look for parent element that looks like a session container
    let current: HTMLElement | null = element;

    for (let i = 0; i < 5 && current; i++) {
      const classes = current.className || '';
      const id = current.id || '';
      const role = current.getAttribute('role') || '';

      // Check if this looks like a session container
      if (
        classes.includes('session') ||
        classes.includes('block') ||
        id.includes('session') ||
        role === 'button' ||
        current.getAttribute('data-session-id') ||
        current.getAttribute('data-session-time')
      ) {
        return current;
      }

      current = current.parentElement;
    }

    // If no container found, return the element itself
    return element;
  }

  private log(...args: unknown[]): void {
    if (this.debugLogging) {
      console.log('[FocusmateDOMDetector]', ...args);
    }
  }
}


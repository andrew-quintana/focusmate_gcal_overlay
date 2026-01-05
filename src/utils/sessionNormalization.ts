/**
 * Focusmate session normalization utilities
 */

import type { FocusmateSession } from '../types/events';

/**
 * Focusmate API session response structure (partial)
 * Based on Focusmate API documentation (user-scoped, not fully productized)
 */
interface FocusmateAPISession {
  id?: string;
  session_id?: string;
  start_time?: string; // ISO 8601 datetime string
  end_time?: string; // ISO 8601 datetime string
  start?: string; // Alternative field name
  end?: string; // Alternative field name
  title?: string;
  partner_name?: string;
  [key: string]: unknown; // Allow other properties
}

/**
 * Generates a session key from time range and optional label.
 * 
 * Session keys are derived from observable attributes since Focusmate DOM
 * has no stable identifiers. Format: `${startMs}-${endMs}-${labelHash}`
 * 
 * @param startMs - Session start time in epoch milliseconds
 * @param endMs - Session end time in epoch milliseconds
 * @param label - Optional label/title to include in hash
 * @returns Derived session key
 */
export function generateSessionKey(
  startMs: number,
  endMs: number,
  label?: string
): string {
  // Simple hash function for label (djb2 algorithm)
  let labelHash = '0';
  if (label) {
    let hash = 5381;
    for (let i = 0; i < label.length; i++) {
      hash = ((hash << 5) + hash) + label.charCodeAt(i);
    }
    labelHash = Math.abs(hash).toString(36);
  }

  return `${startMs}-${endMs}-${labelHash}`;
}

/**
 * Normalizes a Focusmate API session response to internal FocusmateSession format.
 * 
 * Handles various field name variations in Focusmate API responses.
 * 
 * @param apiSession - Raw session from Focusmate API
 * @returns Normalized FocusmateSession, or null if invalid
 */
export function normalizeFocusmateSession(
  apiSession: FocusmateAPISession
): FocusmateSession | null {
  // Extract session ID (try multiple field names)
  const sessionId = apiSession.id || apiSession.session_id || '';
  if (!sessionId) {
    return null;
  }

  // Extract start time (try multiple field names)
  const startTimeStr = apiSession.start_time || apiSession.start;
  if (!startTimeStr) {
    return null;
  }

  // Extract end time (try multiple field names)
  const endTimeStr = apiSession.end_time || apiSession.end;
  if (!endTimeStr) {
    return null;
  }

  // Parse ISO 8601 datetime strings to epoch milliseconds
  const startMs = new Date(startTimeStr).getTime();
  const endMs = new Date(endTimeStr).getTime();

  // Validate parsed dates
  if (isNaN(startMs) || isNaN(endMs)) {
    return null;
  }

  // Validate interval
  if (startMs >= endMs) {
    return null;
  }

  return {
    id: sessionId,
    startMs,
    endMs,
    title: apiSession.title || apiSession.partner_name,
    raw: apiSession,
  };
}

/**
 * Extracts Focusmate sessions from DOM.
 * 
 * **Critical**: Focusmate DOM has no stable identifiers. This function uses
 * multiple selector strategies to find session elements and derives session
 * keys from time ranges and labels.
 * 
 * @param document - Document object to search in
 * @returns Array of normalized FocusmateSession objects
 */
export function extractSessionsFromDOM(document: Document): FocusmateSession[] {
  const sessions: FocusmateSession[] = [];

  // Strategy 1: Look for elements with time text patterns
  // Common patterns: "10:00 AM - 10:25 AM", "10:00-10:25", etc.
  const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
  
  // Strategy 2: Look for elements with data attributes (if available)
  // Note: Focusmate may not have stable data attributes, but we check anyway
  
  // Strategy 3: Look for elements with accessibility labels containing time
  
  // For now, implement a basic strategy that searches for time patterns
  // This is a simplified implementation - in production, multiple strategies
  // would be tried with fallbacks
  
  // Find all text nodes and elements that might contain session times
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        // Accept text nodes and elements that might contain time information
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (timePattern.test(text)) {
            return NodeFilter.FILTER_ACCEPT;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const text = element.textContent || '';
          if (timePattern.test(text)) {
            return NodeFilter.FILTER_ACCEPT;
          }
        }
        return NodeFilter.FILTER_SKIP;
      },
    }
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

    processedElements.add(element);

    // Try to extract time range from element
    const text = element.textContent || '';
    const match = text.match(timePattern);
    
    if (match) {
      // Parse time range
      // This is a simplified parser - production would need more robust parsing
      // For now, we'll create a placeholder implementation
      // In practice, this would need to:
      // 1. Parse the time strings
      // 2. Determine the date context (today, specific date)
      // 3. Convert to epoch milliseconds
      // 4. Extract session title/label if available
      
      // Placeholder: We'll need the current date context to parse times
      // For now, return empty array - this will be enhanced in Phase 4
      // when we have access to the visible date range
    }
  }

  // Note: This is a simplified implementation. In Phase 4, this will be enhanced
  // with proper date context and multiple selector strategies.
  // For now, return empty array as DOM scraping requires more context.
  
  return sessions;
}

/**
 * Normalizes an array of Focusmate API sessions.
 * Filters out invalid sessions.
 * 
 * @param apiSessions - Array of raw sessions from Focusmate API
 * @returns Array of normalized FocusmateSession objects
 */
export function normalizeFocusmateSessions(
  apiSessions: FocusmateAPISession[]
): FocusmateSession[] {
  const normalized: FocusmateSession[] = [];

  for (const apiSession of apiSessions) {
    const normalizedSession = normalizeFocusmateSession(apiSession);
    if (normalizedSession) {
      normalized.push(normalizedSession);
    }
  }

  return normalized;
}


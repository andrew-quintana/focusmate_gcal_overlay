/**
 * Conflict styling utilities
 * 
 * Applies visual styling to Focusmate sessions that conflict with Google Calendar events
 */

import type { ConflictMap, FocusmateSession } from '../types/events';
import { generateSessionKey } from '../utils/sessionNormalization';

/**
 * Conflict styler that applies CSS classes and styles to conflicting sessions
 */
export class ConflictStyler {
  private conflictColor: string;
  private styleElement: HTMLStyleElement | null = null;
  private appliedKeys: Set<string> = new Set();
  private debugLogging: boolean;

  constructor(conflictColor: string, debugLogging = false) {
    this.conflictColor = conflictColor;
    this.debugLogging = debugLogging;
    this.injectStyles();
  }

  /**
   * Applies conflict styling to session elements based on conflict map
   * 
   * @param conflicts - Map of sessionKey -> eventIds[]
   * @param sessionElements - Map of sessionKey -> HTMLElement
   */
  applyConflicts(
    conflicts: ConflictMap,
    sessionElements: Map<string, HTMLElement>
  ): void {
    // Clear previous conflicts
    this.clearConflicts();

    // Apply new conflicts
    for (const [sessionKey, eventIds] of Object.entries(conflicts)) {
      if (eventIds.length > 0) {
        const element = sessionElements.get(sessionKey);
        if (element) {
          element.classList.add('fmcal-conflict');
          this.appliedKeys.add(sessionKey);

          // Add tooltip with conflicting event info
          this.addTooltip(element, eventIds.length);

          this.log(`Applied conflict styling to session: ${sessionKey}`);
        } else {
          this.log(`Session element not found for key: ${sessionKey}`);
        }
      }
    }
  }

  /**
   * Clears all conflict styling
   */
  clearConflicts(): void {
    // Remove conflict class from all elements
    const conflictElements = document.querySelectorAll('.fmcal-conflict');
    for (const element of conflictElements) {
      element.classList.remove('fmcal-conflict');
      element.removeAttribute('data-fmcal-tooltip');
    }

    this.appliedKeys.clear();
  }

  /**
   * Updates the conflict color
   */
  updateConflictColor(color: string): void {
    this.conflictColor = color;
    // Re-inject styles with new color
    this.injectStyles();
    // Re-apply conflicts if any are active
    if (this.appliedKeys.size > 0) {
      // Note: We'd need to store the conflict map to re-apply
      // For now, just update the styles
      this.log('Conflict color updated, styles refreshed');
    }
  }

  /**
   * Gets the current conflict color
   */
  getConflictColor(): string {
    return this.conflictColor;
  }

  // Private helper methods

  private injectStyles(): void {
    // Remove existing style element if present
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }

    // Create new style element
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'fmcal-conflict-styles';
    this.styleElement.textContent = `
      .fmcal-conflict {
        position: relative;
        background-color: ${this.conflictColor}20 !important;
        border: 2px solid ${this.conflictColor} !important;
        border-radius: 4px;
        box-shadow: 0 0 8px ${this.conflictColor}40 !important;
      }

      .fmcal-conflict::before {
        content: '⚠';
        position: absolute;
        top: 4px;
        right: 4px;
        font-size: 16px;
        color: ${this.conflictColor};
        z-index: 1000;
      }

      .fmcal-conflict:hover::after {
        content: attr(data-fmcal-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 10001;
        margin-bottom: 4px;
        pointer-events: none;
      }

      .fmcal-conflict:hover::after {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    `;

    // Inject into document head
    document.head.appendChild(this.styleElement);
  }

  private addTooltip(element: HTMLElement, conflictCount: number): void {
    const tooltipText = conflictCount === 1
      ? 'Conflicts with 1 calendar event'
      : `Conflicts with ${conflictCount} calendar events`;
    element.setAttribute('data-fmcal-tooltip', tooltipText);
  }

  private log(...args: unknown[]): void {
    if (this.debugLogging) {
      console.log('[ConflictStyler]', ...args);
    }
  }
}


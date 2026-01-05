/**
 * Calendar overlay UI component
 * 
 * Renders Google Calendar events in a Shadow DOM overlay on the Focusmate page
 */

import type { GCalEvent } from '../types/events';

/**
 * Calendar overlay component with Shadow DOM isolation
 */
export class CalendarOverlay {
  private container: HTMLElement;
  private shadowRoot: ShadowRoot;
  private isCollapsed: boolean = false;
  private events: GCalEvent[] = [];
  private dateRange: { startMs: number; endMs: number } | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.shadowRoot = container.attachShadow({ mode: 'closed' });
    this.render();
  }

  /**
   * Renders events in the overlay
   */
  render(events: GCalEvent[] = this.events): void {
    this.events = events;
    this.shadowRoot.innerHTML = '';

    // Inject styles
    this.injectStyles();

    // Create overlay structure
    const overlay = document.createElement('div');
    overlay.className = 'fmcal-overlay';

    // Header
    const header = this.createHeader();
    overlay.appendChild(header);

    // Content (only if not collapsed)
    if (!this.isCollapsed) {
      const content = this.createContent();
      overlay.appendChild(content);
    }

    this.shadowRoot.appendChild(overlay);
  }

  /**
   * Updates the displayed date range
   */
  updateDateRange(range: { startMs: number; endMs: number }): void {
    this.dateRange = range;
    // Re-render to update date range indicator
    this.render();
  }

  /**
   * Toggles overlay visibility (collapse/expand)
   */
  toggleVisibility(): void {
    this.isCollapsed = !this.isCollapsed;
    this.render();
  }

  /**
   * Destroys the overlay and removes it from DOM
   */
  destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  /**
   * Gets the current collapsed state
   */
  getCollapsed(): boolean {
    return this.isCollapsed;
  }

  // Private helper methods

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'fmcal-header';

    // Title
    const title = document.createElement('div');
    title.className = 'fmcal-title';
    title.textContent = 'Calendar';

    // Date range indicator
    const dateIndicator = document.createElement('div');
    dateIndicator.className = 'fmcal-date-range';
    dateIndicator.textContent = this.formatDateRange();

    // Toggle button
    const toggle = document.createElement('button');
    toggle.className = 'fmcal-toggle';
    toggle.textContent = this.isCollapsed ? '▼' : '▲';
    toggle.setAttribute('aria-label', this.isCollapsed ? 'Expand overlay' : 'Collapse overlay');
    toggle.addEventListener('click', () => {
      this.toggleVisibility();
    });

    header.appendChild(title);
    header.appendChild(dateIndicator);
    header.appendChild(toggle);

    return header;
  }

  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'fmcal-content';

    if (this.events.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'fmcal-empty';
      empty.textContent = 'No events in this range';
      content.appendChild(empty);
      return content;
    }

    // Sort events by start time
    const sortedEvents = [...this.events].sort((a, b) => a.startMs - b.startMs);

    // Create event list
    const eventList = document.createElement('div');
    eventList.className = 'fmcal-event-list';

    for (const event of sortedEvents) {
      const eventElement = this.createEventElement(event);
      eventList.appendChild(eventElement);
    }

    content.appendChild(eventList);
    return content;
  }

  private createEventElement(event: GCalEvent): HTMLElement {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'fmcal-event';

    // Time range
    const time = document.createElement('div');
    time.className = 'fmcal-event-time';
    time.textContent = this.formatTimeRange(event);

    // Title
    const title = document.createElement('div');
    title.className = 'fmcal-event-title';
    title.textContent = event.summary || '(No title)';

    // All-day indicator
    if (event.allDay) {
      const allDayBadge = document.createElement('span');
      allDayBadge.className = 'fmcal-all-day';
      allDayBadge.textContent = 'All day';
      title.appendChild(allDayBadge);
    }

    // Calendar link (if available)
    if (event.htmlLink) {
      eventDiv.style.cursor = 'pointer';
      eventDiv.title = 'Click to open in Google Calendar';
      eventDiv.addEventListener('click', () => {
        window.open(event.htmlLink, '_blank');
      });
    }

    eventDiv.appendChild(time);
    eventDiv.appendChild(title);

    return eventDiv;
  }

  private formatDateRange(): string {
    if (!this.dateRange) {
      return 'Today';
    }

    const start = new Date(this.dateRange.startMs);
    const end = new Date(this.dateRange.endMs);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    // Check if it's today
    if (startDay.getTime() === today.getTime() && endDay.getTime() === tomorrow.getTime()) {
      return 'Today';
    }

    // Check if it's this week
    const daysDiff = Math.ceil((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 7) {
      return 'This Week';
    }

    // Format date range
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  }

  private formatTimeRange(event: GCalEvent): string {
    if (event.allDay) {
      return 'All day';
    }

    const start = new Date(event.startMs);
    const end = new Date(event.endMs);

    const startStr = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const endStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${startStr} - ${endStr}`;
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        max-height: 600px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }

      .fmcal-overlay {
        display: flex;
        flex-direction: column;
        height: 100%;
        max-height: 600px;
      }

      .fmcal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #e0e0e0;
        background: #f8f9fa;
        border-radius: 8px 8px 0 0;
      }

      .fmcal-title {
        font-weight: 600;
        font-size: 16px;
        color: #333;
      }

      .fmcal-date-range {
        font-size: 12px;
        color: #666;
        margin-left: 8px;
      }

      .fmcal-toggle {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 12px;
        color: #666;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .fmcal-toggle:hover {
        background-color: #e0e0e0;
      }

      .fmcal-content {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }

      .fmcal-empty {
        padding: 24px;
        text-align: center;
        color: #999;
        font-size: 13px;
      }

      .fmcal-event-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .fmcal-event {
        padding: 10px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        background: #fff;
        transition: background-color 0.2s, box-shadow 0.2s;
      }

      .fmcal-event:hover {
        background-color: #f8f9fa;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .fmcal-event-time {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
        font-weight: 500;
      }

      .fmcal-event-title {
        font-size: 14px;
        color: #333;
        font-weight: 500;
      }

      .fmcal-all-day {
        display: inline-block;
        margin-left: 8px;
        padding: 2px 6px;
        background: #e3f2fd;
        color: #1976d2;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
      }

      /* Scrollbar styling */
      .fmcal-content::-webkit-scrollbar {
        width: 6px;
      }

      .fmcal-content::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      .fmcal-content::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }

      .fmcal-content::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    `;
    this.shadowRoot.appendChild(style);
  }
}


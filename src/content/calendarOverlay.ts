/**
 * Calendar overlay for Focusmate Calendar
 * 
 * Renders transparent green/red boxes on calendar time slots
 * to indicate conflict status with Google Calendar events
 */

import type { FocusmateSession, ConflictMap } from '../types/events';
import { generateSessionKey } from '../utils/sessionNormalization';

interface TimeSlot {
  hour: number;
  minute: number;
  element: HTMLElement;
  top: number;
  height: number;
}

/**
 * Calendar overlay that positions conflict boxes on Focusmate Calendar
 */
export class CalendarTimeSlotOverlay {
  private container: HTMLElement;
  private boxes: Map<string, HTMLElement> = new Map();
  private scrollHandler: (() => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private mutationObserver: MutationObserver | null = null;
  private updateTimer: number | null = null;
  private debugLogging: boolean = false;
  private currentSessions: FocusmateSession[] = [];
  private currentConflicts: ConflictMap = {};

  constructor(container: HTMLElement, debugLogging = false) {
    this.container = container;
    this.debugLogging = debugLogging;
    this.setupStyles();
    this.setupEventListeners();
  }

  /**
   * Updates the overlay with sessions and conflicts
   */
  update(
    sessions: FocusmateSession[],
    conflicts: ConflictMap
  ): void {
    console.log('[CalendarTimeSlotOverlay] update called:', {
      sessionsCount: sessions?.length || 0,
      conflictsCount: Object.keys(conflicts || {}).length,
    });
    
    // Store for re-rendering on scroll
    this.currentSessions = sessions || [];
    this.currentConflicts = conflicts || {};
    
    this.clear();
    
    if (!sessions || sessions.length === 0) {
      console.log('[CalendarTimeSlotOverlay] No sessions provided');
      return;
    }

    // Debounce updates
    if (this.updateTimer !== null) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = window.setTimeout(() => {
      console.log('[CalendarTimeSlotOverlay] Rendering boxes...');
      this.renderBoxes(sessions, conflicts);
    }, 100);
  }

  /**
   * Clears all overlay boxes
   */
  clear(): void {
    for (const box of this.boxes.values()) {
      box.remove();
    }
    this.boxes.clear();
  }

  /**
   * Destroys the overlay
   */
  destroy(): void {
    this.clear();
    this.removeEventListeners();
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  /**
   * Renders boxes for all sessions
   */
  private renderBoxes(
    sessions: FocusmateSession[],
    conflicts: ConflictMap
  ): void {
    console.log('[CalendarTimeSlotOverlay] Rendering boxes:', {
      sessionsCount: sessions.length,
      conflictsCount: Object.keys(conflicts).length,
    });
    this.log(`Rendering ${sessions.length} sessions`);
    
    const calendarGrid = this.findCalendarGrid();
    if (!calendarGrid) {
      console.warn('[CalendarTimeSlotOverlay] Calendar grid not found');
      this.log('Calendar grid not found');
      return;
    }

    console.log('[CalendarTimeSlotOverlay] Found calendar grid:', {
      tagName: calendarGrid.tagName,
      className: calendarGrid.className,
      id: calendarGrid.id,
      rect: calendarGrid.getBoundingClientRect(),
    });

    const timeSlots = this.detectTimeSlots(calendarGrid);
    if (timeSlots.length === 0) {
      console.warn('[CalendarTimeSlotOverlay] No time slots detected');
      this.log('No time slots detected');
      return;
    }

    console.log(`[CalendarTimeSlotOverlay] Detected ${timeSlots.length} time slots:`, 
      timeSlots.map(s => `${s.hour}:${s.minute.toString().padStart(2, '0')}`).slice(0, 5)
    );
    this.log(`Detected ${timeSlots.length} time slots`);

    let boxesCreated = 0;
    for (const session of sessions) {
      const sessionKey = generateSessionKey(
        session.startMs,
        session.endMs,
        session.title
      );
      const hasConflict = conflicts[sessionKey] && conflicts[sessionKey].length > 0;
      
      const startDate = new Date(session.startMs);
      console.log(`[CalendarTimeSlotOverlay] Creating box for session:`, {
        title: session.title || sessionKey,
        start: startDate.toLocaleString(),
        conflict: hasConflict,
      });
      this.log(`Creating box for session: ${session.title || sessionKey}, conflict: ${hasConflict}`);
      
      const box = this.createBox(session, hasConflict, timeSlots, calendarGrid);
      if (box) {
        this.container.appendChild(box);
        this.boxes.set(sessionKey, box);
        boxesCreated++;
        console.log(`[CalendarTimeSlotOverlay] Box created successfully:`, {
          position: box.style.top,
          left: box.style.left,
          width: box.style.width,
          height: box.style.height,
        });
      } else {
        console.warn(`[CalendarTimeSlotOverlay] Failed to create box for session: ${session.title || sessionKey}`);
        this.log(`Failed to create box for session: ${session.title || sessionKey}`);
      }
    }
    
    console.log(`[CalendarTimeSlotOverlay] Created ${boxesCreated} overlay boxes out of ${sessions.length} sessions`);
    this.log(`Created ${boxesCreated} overlay boxes`);
  }

  /**
   * Creates a single overlay box for a session
   */
  private createBox(
    session: FocusmateSession,
    hasConflict: boolean,
    timeSlots: TimeSlot[],
    calendarGrid: HTMLElement
  ): HTMLElement | null {
    const startDate = new Date(session.startMs);
    const endDate = new Date(session.endMs);
    
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();

    // Find the day column for this session
    const dayColumn = this.findDayColumn(calendarGrid, startDate);
    if (!dayColumn) {
      console.warn(`[CalendarTimeSlotOverlay] Day column not found for ${startDate.toDateString()}`);
      this.log(`Day column not found for ${startDate.toDateString()}`);
      return null;
    }

    console.log(`[CalendarTimeSlotOverlay] Found day column:`, {
      tagName: dayColumn.tagName,
      className: dayColumn.className,
      rect: dayColumn.getBoundingClientRect(),
    });

    // Calculate position based on time slots
    const startSlot = this.findTimeSlot(timeSlots, startHour, startMinute);
    const endSlot = this.findTimeSlot(timeSlots, endHour, endMinute);

    if (!startSlot || !endSlot) {
      console.warn(`[CalendarTimeSlotOverlay] Time slot not found for ${startHour}:${startMinute} - ${endHour}:${endMinute}`);
      this.log(`Time slot not found for ${startHour}:${startMinute} - ${endHour}:${endMinute}`);
      return null;
    }

    console.log(`[CalendarTimeSlotOverlay] Found time slots:`, {
      startSlot: `${startSlot.hour}:${startSlot.minute.toString().padStart(2, '0')}`,
      endSlot: `${endSlot.hour}:${endSlot.minute.toString().padStart(2, '0')}`,
    });

    // Get positions relative to the calendar grid
    const gridRect = calendarGrid.getBoundingClientRect();
    const columnRect = dayColumn.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    // Calculate top position based on time slots
    // Time slots are detected with their top position relative to grid
    const startSlotTop = startSlot.top;
    const endSlotTop = endSlot.top;
    
    // Calculate offset within the slot for precise time
    const startOffset = this.calculateTimeOffset(startSlot, startHour, startMinute);
    const endOffset = this.calculateTimeOffset(endSlot, endHour, endMinute);
    
    // Position relative to container (which is positioned relative to grid)
    const top = startSlotTop + startOffset;
    const bottom = endSlotTop + endOffset;
    const height = Math.max(bottom - top, 4); // Minimum height of 4px
    
    // Calculate left position relative to container
    // The container is positioned at gridRect.left/top, so we need to account for that
    const left = columnRect.left - containerRect.left;
    const width = columnRect.width;
    
    console.log(`[CalendarTimeSlotOverlay] Box positioning:`, {
      top,
      left,
      width,
      height,
      gridRect: { left: gridRect.left, top: gridRect.top, width: gridRect.width, height: gridRect.height },
      containerRect: { left: containerRect.left, top: containerRect.top, width: containerRect.width, height: containerRect.height },
      columnRect: { left: columnRect.left, top: columnRect.top, width: columnRect.width, height: columnRect.height },
    });

    // Create box element
    const box = document.createElement('div');
    box.className = `fmcal-time-box ${hasConflict ? 'fmcal-conflict' : 'fmcal-no-conflict'}`;
    box.style.position = 'absolute';
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
    box.style.pointerEvents = 'none';
    box.style.zIndex = '1000';
    box.setAttribute('data-session-start', session.startMs.toString());
    box.setAttribute('data-session-end', session.endMs.toString());

    return box;
  }

  /**
   * Finds the Focusmate calendar grid element
   */
  private findCalendarGrid(): HTMLElement | null {
    // Try multiple selectors for Focusmate calendar
    const selectors = [
      '[data-calendar-grid]',
      '.calendar-grid',
      '[role="grid"]',
      '.calendar-container',
      '[class*="calendar"]',
      '[class*="Calendar"]',
      'main',
      '[role="main"]',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && this.looksLikeCalendar(element as HTMLElement)) {
        return element as HTMLElement;
      }
    }

    // Fallback: look for elements with calendar-like structure
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      const role = element.getAttribute('role');
      if ((role === 'grid' || role === 'table') && this.looksLikeCalendar(element as HTMLElement)) {
        return element as HTMLElement;
      }
    }

    return null;
  }

  /**
   * Checks if an element looks like a calendar grid
   */
  private looksLikeCalendar(element: HTMLElement): boolean {
    // Check for time-related text or structure
    const text = element.textContent || '';
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    
    // Check if it has time slots or day columns
    const hasTimeSlots = timePattern.test(text);
    const hasDayColumns = element.querySelectorAll('[role="columnheader"], th, [data-day], [class*="day"], [class*="Day"]').length > 0;
    
    return hasTimeSlots || hasDayColumns;
  }

  /**
   * Detects time slots from the Focusmate calendar grid
   */
  private detectTimeSlots(calendarGrid: HTMLElement): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const gridRect = calendarGrid.getBoundingClientRect();
    const scrollTop = calendarGrid.scrollTop || 0;
    
    // Look for time labels (e.g., "6:00 AM", "7:00 AM", "6 AM", "7 AM")
    const timePattern = /(\d{1,2}):?(\d{2})?\s*(AM|PM)/i;
    const allElements = calendarGrid.querySelectorAll('*');
    
    const timeElements = new Map<number, { element: HTMLElement; rect: DOMRect }>();
    
    for (const element of allElements) {
      const text = element.textContent || '';
      const match = text.match(timePattern);
      if (match) {
        let hour = parseInt(match[1], 10);
        const minute = match[2] ? parseInt(match[2], 10) : 0;
        const period = match[3]?.toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hour !== 12) {
          hour += 12;
        } else if (period === 'AM' && hour === 12) {
          hour = 0;
        }
        
        const timeKey = hour * 60 + minute;
        if (!timeElements.has(timeKey)) {
          const rect = (element as HTMLElement).getBoundingClientRect();
          timeElements.set(timeKey, { element: element as HTMLElement, rect });
        }
      }
    }

    // Also look for time slot rows (grid rows that represent time slots)
    // Try to find rows that represent time slots
    const rows = calendarGrid.querySelectorAll('[role="row"], tr, [data-hour], [class*="time"], [class*="Time"], [class*="slot"], [class*="Slot"]');
    
    for (const row of rows) {
      const rect = (row as HTMLElement).getBoundingClientRect();
      const relativeTop = rect.top - gridRect.top + scrollTop;
      
      // Check if this row has time information
      const timeAttr = (row as HTMLElement).getAttribute('data-hour');
      if (timeAttr) {
        const hour = parseInt(timeAttr, 10);
        slots.push({
          hour,
          minute: 0,
          element: row as HTMLElement,
          top: relativeTop,
          height: rect.height,
        });
      } else {
        // Try to extract time from text
        const text = row.textContent || '';
        const match = text.match(timePattern);
        if (match) {
          let hour = parseInt(match[1], 10);
          const minute = match[2] ? parseInt(match[2], 10) : 0;
          const period = match[3]?.toUpperCase();
          
          if (period === 'PM' && hour !== 12) {
            hour += 12;
          } else if (period === 'AM' && hour === 12) {
            hour = 0;
          }
          
          slots.push({
            hour,
            minute,
            element: row as HTMLElement,
            top: relativeTop,
            height: rect.height,
          });
        }
      }
    }

    // If we found time elements, use their positions
    if (timeElements.size > 0 && slots.length === 0) {
      for (const [timeKey, { element, rect }] of timeElements.entries()) {
        const hour = Math.floor(timeKey / 60);
        const minute = timeKey % 60;
        const relativeTop = rect.top - gridRect.top + scrollTop;
        
        slots.push({
          hour,
          minute,
          element,
          top: relativeTop,
          height: 30, // Default height if not determinable
        });
      }
    }

    // Sort by time
    slots.sort((a, b) => {
      const aTime = a.hour * 60 + a.minute;
      const bTime = b.hour * 60 + b.minute;
      return aTime - bTime;
    });

    // If we still don't have slots, try to infer from grid structure
    if (slots.length === 0) {
      return this.inferTimeSlots(calendarGrid);
    }

    return slots;
  }

  /**
   * Infers time slots from calendar grid structure
   */
  private inferTimeSlots(calendarGrid: HTMLElement): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const gridRect = calendarGrid.getBoundingClientRect();
    const scrollTop = calendarGrid.scrollTop || 0;
    
    // Look for rows or cells that might represent time slots
    // Google Calendar typically has 30-minute or 15-minute slots
    const rows = calendarGrid.querySelectorAll('[role="row"], tr');
    
    if (rows.length > 0) {
      // Assume first visible row is around 6 AM
      const firstRow = rows[0] as HTMLElement;
      const firstRect = firstRow.getBoundingClientRect();
      const firstTop = firstRect.top - gridRect.top + scrollTop;
      const rowHeight = firstRect.height;
      
      // Estimate time slots (assuming 30-minute intervals starting at 6 AM)
      let currentHour = 6;
      let currentMinute = 0;
      let currentTop = firstTop;
      
      for (let i = 0; i < 48; i++) { // 24 hours * 2 (30-min intervals)
        slots.push({
          hour: currentHour,
          minute: currentMinute,
          element: firstRow,
          top: currentTop,
          height: rowHeight,
        });
        
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentMinute = 0;
          currentHour++;
        }
        currentTop += rowHeight;
      }
    }
    
    return slots;
  }

  /**
   * Finds the time slot closest to the given time
   */
  private findTimeSlot(
    slots: TimeSlot[],
    hour: number,
    minute: number
  ): TimeSlot | null {
    if (slots.length === 0) {
      return null;
    }

    const targetTime = hour * 60 + minute;
    
    // Find closest slot
    let closest = slots[0];
    let minDiff = Math.abs((closest.hour * 60 + closest.minute) - targetTime);
    
    for (const slot of slots) {
      const slotTime = slot.hour * 60 + slot.minute;
      const diff = Math.abs(slotTime - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = slot;
      }
    }
    
    return closest;
  }

  /**
   * Calculates the offset within a time slot for a specific time
   */
  private calculateTimeOffset(
    slot: TimeSlot,
    hour: number,
    minute: number
  ): number {
    const slotTime = slot.hour * 60 + slot.minute;
    const targetTime = hour * 60 + minute;
    const diff = targetTime - slotTime;
    
    // Assume 30-minute slots (can be adjusted)
    const slotDuration = 30; // minutes
    const offsetRatio = diff / slotDuration;
    
    return offsetRatio * slot.height;
  }

  /**
   * Finds the day column for a given date in Focusmate calendar
   */
  private findDayColumn(
    calendarGrid: HTMLElement,
    date: Date
  ): HTMLElement | null {
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    // Try to find column by date attribute
    const dateStr = date.toISOString().split('T')[0];
    
    // Try multiple date formats
    const dateFormats = [
      dateStr,
      `${year}-${month.toString().padStart(2, '0')}-${dayOfMonth.toString().padStart(2, '0')}`,
      `${month}/${dayOfMonth}`,
      `${month}/${dayOfMonth}/${year}`,
      dayOfMonth.toString(),
    ];
    
    for (const dateFormat of dateFormats) {
      const columns = calendarGrid.querySelectorAll(
        `[data-date="${dateFormat}"], [data-day="${dateFormat}"], [aria-label*="${dateFormat}"]`
      );
      
      if (columns.length > 0) {
        // Prefer columns that are actually in the grid body, not headers
        for (const col of columns) {
          const element = col as HTMLElement;
          const role = element.getAttribute('role');
          if (role === 'gridcell' || role === 'columnheader' || element.tagName === 'TD' || element.tagName === 'TH') {
            return element;
          }
        }
        return columns[0] as HTMLElement;
      }
    }

    // Try to find by day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    const dayColumns = calendarGrid.querySelectorAll(
      `[aria-label*="${dayName}"], [data-day-name="${dayName}"], [class*="${dayName.toLowerCase()}"]`
    );
    
    if (dayColumns.length > 0) {
      // Find the column that matches the date
      for (const col of dayColumns) {
        const label = col.getAttribute('aria-label') || '';
        const text = col.textContent || '';
        if (label.includes(dayOfMonth.toString()) || text.includes(dayOfMonth.toString())) {
          return col as HTMLElement;
        }
      }
      // If no exact match, try to find by position
      const dayIndex = date.getDay();
      if (dayColumns.length > dayIndex) {
        return dayColumns[dayIndex] as HTMLElement;
      }
      return dayColumns[0] as HTMLElement;
    }

    // Try to find by class names that might indicate day columns
    const dayClassColumns = calendarGrid.querySelectorAll(
      '[class*="day"], [class*="Day"], [class*="column"], [class*="Column"]'
    );
    
    if (dayClassColumns.length > 0) {
      // Try to match by day of month in text
      for (const col of dayClassColumns) {
        const text = col.textContent || '';
        if (text.includes(dayOfMonth.toString())) {
          return col as HTMLElement;
        }
      }
      // Fallback: use day index
      const dayIndex = date.getDay();
      if (dayClassColumns.length > dayIndex) {
        return dayClassColumns[dayIndex] as HTMLElement;
      }
    }

    // Fallback: try to find columns by structure
    // Look for grid cells in the first row (day headers) or columns
    const headerRow = calendarGrid.querySelector('[role="row"]:first-child, tr:first-child, [class*="header"]');
    if (headerRow) {
      const cells = headerRow.querySelectorAll('[role="columnheader"], th, [role="gridcell"], td, [class*="day"], [class*="Day"]');
      const dayIndex = date.getDay();
      if (cells.length > dayIndex) {
        // Now find the corresponding column in the grid body
        const columnIndex = Array.from(cells).indexOf(cells[dayIndex]);
        const gridCells = calendarGrid.querySelectorAll('[role="gridcell"], td, [class*="time-slot"], [class*="slot"]');
        if (gridCells.length > columnIndex) {
          // Return first cell in that column (or we could return the header)
          return gridCells[columnIndex] as HTMLElement;
        }
      }
    }

    // Last resort: find all columns and try to match by position
    const allColumns = calendarGrid.querySelectorAll('[role="columnheader"], th, [role="gridcell"], [class*="day"], [class*="Day"]');
    const dayIndex = date.getDay();
    
    // Try to find columns in order (assuming week view)
    if (allColumns.length > dayIndex) {
      return allColumns[dayIndex] as HTMLElement;
    }

    return null;
  }

  /**
   * Sets up CSS styles
   */
  private setupStyles(): void {
    const style = document.createElement('style');
    style.id = 'fmcal-time-overlay-styles';
    style.textContent = `
      .fmcal-time-box {
        border-radius: 4px;
        pointer-events: none;
        transition: opacity 0.2s;
      }
      
      .fmcal-time-box.fmcal-no-conflict {
        background-color: rgba(76, 175, 80, 0.3); /* Green with transparency */
        border: 2px solid rgba(76, 175, 80, 0.5);
      }
      
      .fmcal-time-box.fmcal-conflict {
        background-color: rgba(244, 67, 54, 0.3); /* Red with transparency */
        border: 2px solid rgba(244, 67, 54, 0.5);
      }
    `;
    
    if (!document.head.querySelector('#fmcal-time-overlay-styles')) {
      document.head.appendChild(style);
    }
  }

  /**
   * Sets up event listeners for scroll and resize
   */
  private setupEventListeners(): void {
    this.scrollHandler = () => {
      this.debouncedUpdate();
    };
    
    this.resizeHandler = () => {
      this.debouncedUpdate();
    };

    window.addEventListener('scroll', this.scrollHandler, true);
    window.addEventListener('resize', this.resizeHandler);
    
    // Also observe calendar grid scroll
    const calendarGrid = this.findCalendarGrid();
    if (calendarGrid) {
      calendarGrid.addEventListener('scroll', this.scrollHandler, true);
    }

    // Observe DOM changes
    this.mutationObserver = new MutationObserver(() => {
      this.debouncedUpdate();
    });

    if (calendarGrid) {
      this.mutationObserver.observe(calendarGrid, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
    }
  }

  /**
   * Removes event listeners
   */
  private removeEventListeners(): void {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
      this.scrollHandler = null;
    }
    
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (this.updateTimer !== null) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Debounced update function - triggers full re-render
   */
  private debouncedUpdate(): void {
    if (this.updateTimer !== null) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = window.setTimeout(() => {
      // Update container position
      this.updateContainerPosition();
      
      // Re-render boxes with stored sessions/conflicts
      // Only re-render if we have sessions and the calendar grid is still available
      if (this.currentSessions.length > 0) {
        const calendarGrid = this.findCalendarGrid();
        if (calendarGrid) {
          this.clear();
          this.renderBoxes(this.currentSessions, this.currentConflicts);
        } else {
          this.log('Calendar grid not found during update, keeping existing boxes');
        }
      }
    }, 100);
  }

  /**
   * Updates the overlay container position to match calendar grid
   */
  private updateContainerPosition(): void {
    const calendarGrid = this.findCalendarGrid();
    if (!calendarGrid || !this.container) {
      return;
    }

    const gridRect = calendarGrid.getBoundingClientRect();
    const scrollX = window.scrollX || 0;
    const scrollY = window.scrollY || 0;
    
    this.container.style.left = `${gridRect.left + scrollX}px`;
    this.container.style.top = `${gridRect.top + scrollY}px`;
    this.container.style.width = `${gridRect.width}px`;
    this.container.style.height = `${gridRect.height}px`;
  }

  private log(...args: unknown[]): void {
    if (this.debugLogging) {
      console.log('[CalendarTimeSlotOverlay]', ...args);
    }
  }
}


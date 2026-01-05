/**
 * Unit tests for ConflictComputer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConflictComputer } from '../../../src/background/conflict';
import type { GCalEvent, FocusmateSession } from '../../../src/types/events';

describe('ConflictComputer', () => {
  let conflictComputer: ConflictComputer;

  beforeEach(() => {
    conflictComputer = new ConflictComputer();
  });

  it('should compute conflicts correctly', () => {
    const sessions: FocusmateSession[] = [
      {
        id: 'session1',
        startMs: new Date('2025-01-04T10:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T10:25:00-05:00').getTime(),
        title: 'Morning Session',
      },
    ];

    const events: GCalEvent[] = [
      {
        id: 'event1',
        calendarId: 'primary',
        summary: 'Meeting',
        startMs: new Date('2025-01-04T10:10:00-05:00').getTime(),
        endMs: new Date('2025-01-04T10:30:00-05:00').getTime(),
        allDay: false,
      },
    ];

    const conflicts = conflictComputer.compute(sessions, events);

    expect(Object.keys(conflicts).length).toBeGreaterThan(0);
  });

  it('should return empty map when no sessions', () => {
    const sessions: FocusmateSession[] = [];
    const events: GCalEvent[] = [
      {
        id: 'event1',
        calendarId: 'primary',
        summary: 'Meeting',
        startMs: new Date('2025-01-04T10:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T11:00:00-05:00').getTime(),
        allDay: false,
      },
    ];

    const conflicts = conflictComputer.compute(sessions, events);

    expect(conflicts).toEqual({});
  });

  it('should return empty map when no events', () => {
    const sessions: FocusmateSession[] = [
      {
        id: 'session1',
        startMs: new Date('2025-01-04T10:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T10:25:00-05:00').getTime(),
        title: 'Morning Session',
      },
    ];
    const events: GCalEvent[] = [];

    const conflicts = conflictComputer.compute(sessions, events);

    expect(conflicts).toEqual({});
  });

  it('should return empty map when no conflicts', () => {
    const sessions: FocusmateSession[] = [
      {
        id: 'session1',
        startMs: new Date('2025-01-04T10:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T10:25:00-05:00').getTime(),
        title: 'Morning Session',
      },
    ];

    const events: GCalEvent[] = [
      {
        id: 'event1',
        calendarId: 'primary',
        summary: 'Meeting',
        startMs: new Date('2025-01-04T14:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T15:00:00-05:00').getTime(),
        allDay: false,
      },
    ];

    const conflicts = conflictComputer.compute(sessions, events);

    expect(conflicts).toEqual({});
  });
});


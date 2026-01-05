/**
 * Unit tests for conflict detection utilities
 */

import { describe, it, expect } from 'vitest';
import { computeConflicts, getSessionKey } from '../../../src/utils/conflictDetection';
import type { GCalEvent, FocusmateSession } from '../../../src/types/events';

describe('computeConflicts', () => {
  it('should detect no conflicts when sessions and events do not overlap', () => {
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
        summary: 'Afternoon Meeting',
        startMs: new Date('2025-01-04T14:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T15:00:00-05:00').getTime(),
        allDay: false,
      },
    ];

    const conflicts = computeConflicts(sessions, events);

    expect(Object.keys(conflicts)).toHaveLength(0);
  });

  it('should detect conflict when session overlaps with event', () => {
    const sessions: FocusmateSession[] = [
      {
        id: 'session1',
        startMs: new Date('2025-01-04T14:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T14:25:00-05:00').getTime(),
        title: 'Focus Session',
      },
    ];

    const events: GCalEvent[] = [
      {
        id: 'event1',
        calendarId: 'primary',
        summary: 'Team Meeting',
        startMs: new Date('2025-01-04T14:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T15:00:00-05:00').getTime(),
        allDay: false,
      },
    ];

    const conflicts = computeConflicts(sessions, events);

    expect(Object.keys(conflicts)).toHaveLength(1);
    const sessionKey = getSessionKey(sessions[0]);
    expect(conflicts[sessionKey]).toContain('event1');
  });

  it('should detect conflict with partial overlap', () => {
    const sessions: FocusmateSession[] = [
      {
        id: 'session1',
        startMs: new Date('2025-01-04T13:30:00-05:00').getTime(),
        endMs: new Date('2025-01-04T13:55:00-05:00').getTime(),
        title: 'Focus Session',
      },
    ];

    const events: GCalEvent[] = [
      {
        id: 'event1',
        calendarId: 'primary',
        summary: 'Team Meeting',
        startMs: new Date('2025-01-04T13:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T14:00:00-05:00').getTime(),
        allDay: false,
      },
    ];

    const conflicts = computeConflicts(sessions, events);

    expect(Object.keys(conflicts)).toHaveLength(1);
    const sessionKey = getSessionKey(sessions[0]);
    expect(conflicts[sessionKey]).toContain('event1');
  });

  it('should detect multiple events conflicting with one session', () => {
    const sessions: FocusmateSession[] = [
      {
        id: 'session1',
        startMs: new Date('2025-01-04T14:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T14:25:00-05:00').getTime(),
        title: 'Focus Session',
      },
    ];

    const events: GCalEvent[] = [
      {
        id: 'event1',
        calendarId: 'primary',
        summary: 'Meeting 1',
        startMs: new Date('2025-01-04T13:30:00-05:00').getTime(),
        endMs: new Date('2025-01-04T14:15:00-05:00').getTime(),
        allDay: false,
      },
      {
        id: 'event2',
        calendarId: 'primary',
        summary: 'Meeting 2',
        startMs: new Date('2025-01-04T14:10:00-05:00').getTime(),
        endMs: new Date('2025-01-04T15:00:00-05:00').getTime(),
        allDay: false,
      },
    ];

    const conflicts = computeConflicts(sessions, events);

    expect(Object.keys(conflicts)).toHaveLength(1);
    const sessionKey = getSessionKey(sessions[0]);
    expect(conflicts[sessionKey]).toHaveLength(2);
    expect(conflicts[sessionKey]).toContain('event1');
    expect(conflicts[sessionKey]).toContain('event2');
  });

  it('should detect conflicts with all-day events', () => {
    const sessions: FocusmateSession[] = [
      {
        id: 'session1',
        startMs: new Date('2025-01-04T10:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T10:25:00-05:00').getTime(),
        title: 'Focus Session',
      },
    ];

    const events: GCalEvent[] = [
      {
        id: 'allday1',
        calendarId: 'primary',
        summary: 'Holiday',
        startMs: new Date('2025-01-04T00:00:00').getTime(),
        endMs: new Date('2025-01-05T00:00:00').getTime(),
        allDay: true,
      },
    ];

    const conflicts = computeConflicts(sessions, events);

    expect(Object.keys(conflicts)).toHaveLength(1);
    const sessionKey = getSessionKey(sessions[0]);
    expect(conflicts[sessionKey]).toContain('allday1');
  });

  it('should not detect conflict with all-day event on different day', () => {
    const sessions: FocusmateSession[] = [
      {
        id: 'session1',
        startMs: new Date('2025-01-05T10:00:00-05:00').getTime(),
        endMs: new Date('2025-01-05T10:25:00-05:00').getTime(),
        title: 'Focus Session',
      },
    ];

    const events: GCalEvent[] = [
      {
        id: 'allday1',
        calendarId: 'primary',
        summary: 'Holiday',
        startMs: new Date('2025-01-04T00:00:00').getTime(),
        endMs: new Date('2025-01-05T00:00:00').getTime(),
        allDay: true,
      },
    ];

    const conflicts = computeConflicts(sessions, events);

    // Session is on 2025-01-05, all-day event ends at start of 2025-01-05
    // So they don't overlap (all-day event is exclusive end)
    expect(Object.keys(conflicts)).toHaveLength(0);
  });

  it('should handle multiple sessions with different conflicts', () => {
    const sessions: FocusmateSession[] = [
      {
        id: 'session1',
        startMs: new Date('2025-01-04T10:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T10:25:00-05:00').getTime(),
        title: 'Morning Session',
      },
      {
        id: 'session2',
        startMs: new Date('2025-01-04T14:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T14:25:00-05:00').getTime(),
        title: 'Afternoon Session',
      },
    ];

    const events: GCalEvent[] = [
      {
        id: 'event1',
        calendarId: 'primary',
        summary: 'Morning Meeting',
        startMs: new Date('2025-01-04T09:30:00-05:00').getTime(),
        endMs: new Date('2025-01-04T10:15:00-05:00').getTime(),
        allDay: false,
      },
      {
        id: 'event2',
        calendarId: 'primary',
        summary: 'Afternoon Meeting',
        startMs: new Date('2025-01-04T14:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T15:00:00-05:00').getTime(),
        allDay: false,
      },
    ];

    const conflicts = computeConflicts(sessions, events);

    expect(Object.keys(conflicts)).toHaveLength(2);
    const session1Key = getSessionKey(sessions[0]);
    const session2Key = getSessionKey(sessions[1]);
    expect(conflicts[session1Key]).toContain('event1');
    expect(conflicts[session2Key]).toContain('event2');
  });

  it('should handle empty sessions array', () => {
    const sessions: FocusmateSession[] = [];
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

    const conflicts = computeConflicts(sessions, events);

    expect(Object.keys(conflicts)).toHaveLength(0);
  });

  it('should handle empty events array', () => {
    const sessions: FocusmateSession[] = [
      {
        id: 'session1',
        startMs: new Date('2025-01-04T14:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T14:25:00-05:00').getTime(),
        title: 'Focus Session',
      },
    ];
    const events: GCalEvent[] = [];

    const conflicts = computeConflicts(sessions, events);

    expect(Object.keys(conflicts)).toHaveLength(0);
  });

  it('should handle sessions without titles', () => {
    const sessions: FocusmateSession[] = [
      {
        id: 'session1',
        startMs: new Date('2025-01-04T14:00:00-05:00').getTime(),
        endMs: new Date('2025-01-04T14:25:00-05:00').getTime(),
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

    const conflicts = computeConflicts(sessions, events);

    expect(Object.keys(conflicts)).toHaveLength(1);
    const sessionKey = getSessionKey(sessions[0]);
    expect(conflicts[sessionKey]).toContain('event1');
  });
});

describe('getSessionKey', () => {
  it('should generate session key from session', () => {
    const session: FocusmateSession = {
      id: 'session1',
      startMs: 1000,
      endMs: 2000,
      title: 'Test Session',
    };

    const key = getSessionKey(session);

    expect(key).toMatch(/^1000-2000-/);
  });

  it('should generate consistent keys for same session', () => {
    const session: FocusmateSession = {
      id: 'session1',
      startMs: 1000,
      endMs: 2000,
      title: 'Test Session',
    };

    const key1 = getSessionKey(session);
    const key2 = getSessionKey(session);

    expect(key1).toBe(key2);
  });
});


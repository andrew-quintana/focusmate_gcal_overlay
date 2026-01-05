/**
 * Unit tests for event normalization utilities
 */

import { describe, it, expect, vi } from 'vitest';
import { normalizeGCalEvent, normalizeGCalEvents } from '../../../src/utils/eventNormalization';
import type { GCalEvent } from '../../../src/types/events';

describe('normalizeGCalEvent', () => {
  it('should normalize a timed event correctly', () => {
    const apiEvent = {
      id: 'event1',
      summary: 'Team Meeting',
      status: 'confirmed',
      htmlLink: 'https://www.google.com/calendar/event?eid=event1',
      start: {
        dateTime: '2025-01-04T14:00:00-05:00',
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: '2025-01-04T15:00:00-05:00',
        timeZone: 'America/New_York',
      },
    };

    const normalized = normalizeGCalEvent(apiEvent, 'primary');

    expect(normalized).not.toBeNull();
    expect(normalized?.id).toBe('event1');
    expect(normalized?.calendarId).toBe('primary');
    expect(normalized?.summary).toBe('Team Meeting');
    expect(normalized?.allDay).toBe(false);
    expect(normalized?.htmlLink).toBe('https://www.google.com/calendar/event?eid=event1');
    expect(normalized?.startMs).toBe(new Date('2025-01-04T14:00:00-05:00').getTime());
    expect(normalized?.endMs).toBe(new Date('2025-01-04T15:00:00-05:00').getTime());
  });

  it('should normalize an all-day event correctly', () => {
    const apiEvent = {
      id: 'allday1',
      summary: 'Holiday',
      status: 'confirmed',
      start: {
        date: '2025-01-04',
      },
      end: {
        date: '2025-01-05',
      },
    };

    const normalized = normalizeGCalEvent(apiEvent, 'primary');

    expect(normalized).not.toBeNull();
    expect(normalized?.id).toBe('allday1');
    expect(normalized?.allDay).toBe(true);
    
    // All-day events should span from midnight to next midnight in local time
    const expectedStart = new Date('2025-01-04T00:00:00').getTime();
    const expectedEnd = new Date('2025-01-05T00:00:00').getTime();
    
    expect(normalized?.startMs).toBe(expectedStart);
    expect(normalized?.endMs).toBe(expectedEnd);
  });

  it('should exclude cancelled events', () => {
    const apiEvent = {
      id: 'cancelled1',
      summary: 'Cancelled Meeting',
      status: 'cancelled',
      start: {
        dateTime: '2025-01-04T14:00:00-05:00',
      },
      end: {
        dateTime: '2025-01-04T15:00:00-05:00',
      },
    };

    const normalized = normalizeGCalEvent(apiEvent, 'primary');

    expect(normalized).toBeNull();
  });

  it('should handle events without end time (default to 30 minutes)', () => {
    const apiEvent = {
      id: 'noend1',
      summary: 'Quick Call',
      status: 'confirmed',
      start: {
        dateTime: '2025-01-04T10:00:00-05:00',
      },
    };

    const normalized = normalizeGCalEvent(apiEvent, 'primary');

    expect(normalized).not.toBeNull();
    const startMs = new Date('2025-01-04T10:00:00-05:00').getTime();
    expect(normalized?.startMs).toBe(startMs);
    expect(normalized?.endMs).toBe(startMs + 30 * 60 * 1000);
  });

  it('should handle all-day events without end date', () => {
    const apiEvent = {
      id: 'allday2',
      summary: 'Single Day Event',
      status: 'confirmed',
      start: {
        date: '2025-01-04',
      },
    };

    const normalized = normalizeGCalEvent(apiEvent, 'primary');

    expect(normalized).not.toBeNull();
    expect(normalized?.allDay).toBe(true);
    
    const expectedStart = new Date('2025-01-04T00:00:00').getTime();
    // Should default to end of day
    const expectedEnd = new Date('2025-01-04T23:59:59.999').getTime() + 1;
    
    expect(normalized?.startMs).toBe(expectedStart);
    expect(normalized?.endMs).toBe(expectedEnd);
  });

  it('should handle events without summary', () => {
    const apiEvent = {
      id: 'nosummary1',
      status: 'confirmed',
      start: {
        dateTime: '2025-01-04T14:00:00-05:00',
      },
      end: {
        dateTime: '2025-01-04T15:00:00-05:00',
      },
    };

    const normalized = normalizeGCalEvent(apiEvent, 'primary');

    expect(normalized).not.toBeNull();
    expect(normalized?.summary).toBeUndefined();
  });

  it('should handle events without htmlLink', () => {
    const apiEvent = {
      id: 'nolink1',
      summary: 'No Link Event',
      status: 'confirmed',
      start: {
        dateTime: '2025-01-04T14:00:00-05:00',
      },
      end: {
        dateTime: '2025-01-04T15:00:00-05:00',
      },
    };

    const normalized = normalizeGCalEvent(apiEvent, 'primary');

    expect(normalized).not.toBeNull();
    expect(normalized?.htmlLink).toBeUndefined();
  });

  it('should throw error for all-day event without start date', () => {
    const apiEvent = {
      id: 'invalid1',
      summary: 'Invalid Event',
      status: 'confirmed',
      start: {},
      end: {
        date: '2025-01-05',
      },
    };

    expect(() => normalizeGCalEvent(apiEvent, 'primary')).toThrow();
  });

  it('should throw error for timed event without start dateTime', () => {
    const apiEvent = {
      id: 'invalid2',
      summary: 'Invalid Event',
      status: 'confirmed',
      start: {},
      end: {
        dateTime: '2025-01-04T15:00:00-05:00',
      },
    };

    expect(() => normalizeGCalEvent(apiEvent, 'primary')).toThrow();
  });

  it('should handle UTC timezone correctly', () => {
    const apiEvent = {
      id: 'utc1',
      summary: 'UTC Event',
      status: 'confirmed',
      start: {
        dateTime: '2025-01-04T14:00:00Z',
      },
      end: {
        dateTime: '2025-01-04T15:00:00Z',
      },
    };

    const normalized = normalizeGCalEvent(apiEvent, 'primary');

    expect(normalized).not.toBeNull();
    expect(normalized?.startMs).toBe(new Date('2025-01-04T14:00:00Z').getTime());
    expect(normalized?.endMs).toBe(new Date('2025-01-04T15:00:00Z').getTime());
  });

  it('should handle multi-day all-day events', () => {
    const apiEvent = {
      id: 'multiday1',
      summary: 'Multi-day Event',
      status: 'confirmed',
      start: {
        date: '2025-01-03',
      },
      end: {
        date: '2025-01-06',
      },
    };

    const normalized = normalizeGCalEvent(apiEvent, 'primary');

    expect(normalized).not.toBeNull();
    expect(normalized?.allDay).toBe(true);
    
    const expectedStart = new Date('2025-01-03T00:00:00').getTime();
    const expectedEnd = new Date('2025-01-06T00:00:00').getTime();
    
    expect(normalized?.startMs).toBe(expectedStart);
    expect(normalized?.endMs).toBe(expectedEnd);
  });
});

describe('normalizeGCalEvents', () => {
  it('should normalize multiple events', () => {
    const apiEvents = [
      {
        id: 'event1',
        summary: 'Event 1',
        status: 'confirmed',
        start: { dateTime: '2025-01-04T10:00:00-05:00' },
        end: { dateTime: '2025-01-04T11:00:00-05:00' },
      },
      {
        id: 'event2',
        summary: 'Event 2',
        status: 'confirmed',
        start: { dateTime: '2025-01-04T14:00:00-05:00' },
        end: { dateTime: '2025-01-04T15:00:00-05:00' },
      },
    ];

    const normalized = normalizeGCalEvents(apiEvents, 'primary');

    expect(normalized).toHaveLength(2);
    expect(normalized[0].id).toBe('event1');
    expect(normalized[1].id).toBe('event2');
  });

  it('should filter out cancelled events', () => {
    const apiEvents = [
      {
        id: 'event1',
        summary: 'Event 1',
        status: 'confirmed',
        start: { dateTime: '2025-01-04T10:00:00-05:00' },
        end: { dateTime: '2025-01-04T11:00:00-05:00' },
      },
      {
        id: 'cancelled1',
        summary: 'Cancelled',
        status: 'cancelled',
        start: { dateTime: '2025-01-04T14:00:00-05:00' },
        end: { dateTime: '2025-01-04T15:00:00-05:00' },
      },
    ];

    const normalized = normalizeGCalEvents(apiEvents, 'primary');

    expect(normalized).toHaveLength(1);
    expect(normalized[0].id).toBe('event1');
  });

  it('should continue processing after invalid events', () => {
    const apiEvents = [
      {
        id: 'event1',
        summary: 'Event 1',
        status: 'confirmed',
        start: { dateTime: '2025-01-04T10:00:00-05:00' },
        end: { dateTime: '2025-01-04T11:00:00-05:00' },
      },
      {
        id: 'invalid1',
        summary: 'Invalid',
        status: 'confirmed',
        start: {}, // Missing dateTime
        end: { dateTime: '2025-01-04T15:00:00-05:00' },
      },
      {
        id: 'event2',
        summary: 'Event 2',
        status: 'confirmed',
        start: { dateTime: '2025-01-04T14:00:00-05:00' },
        end: { dateTime: '2025-01-04T15:00:00-05:00' },
      },
    ];

    // Mock console.error to avoid test output noise
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const normalized = normalizeGCalEvents(apiEvents, 'primary');

    expect(normalized).toHaveLength(2);
    expect(normalized[0].id).toBe('event1');
    expect(normalized[1].id).toBe('event2');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});


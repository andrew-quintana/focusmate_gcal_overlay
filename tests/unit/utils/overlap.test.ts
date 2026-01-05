/**
 * Unit tests for overlap detection utilities
 */

import { describe, it, expect } from 'vitest';
import { intervalsOverlap, overlapsWithAllDay } from '../../../src/utils/overlap';

describe('intervalsOverlap', () => {
  it('should return true for fully overlapping intervals', () => {
    expect(intervalsOverlap(1000, 2000, 1500, 2500)).toBe(true);
    expect(intervalsOverlap(1500, 2500, 1000, 2000)).toBe(true);
  });

  it('should return true for partial start overlap', () => {
    expect(intervalsOverlap(1000, 2000, 500, 1500)).toBe(true);
  });

  it('should return true for partial end overlap', () => {
    expect(intervalsOverlap(1000, 2000, 1500, 2500)).toBe(true);
  });

  it('should return true when one interval fully contains another', () => {
    expect(intervalsOverlap(1000, 5000, 2000, 3000)).toBe(true);
    expect(intervalsOverlap(2000, 3000, 1000, 5000)).toBe(true);
  });

  it('should return true for identical intervals', () => {
    expect(intervalsOverlap(1000, 2000, 1000, 2000)).toBe(true);
  });

  it('should return false for non-overlapping intervals', () => {
    expect(intervalsOverlap(1000, 2000, 2000, 3000)).toBe(false);
    expect(intervalsOverlap(2000, 3000, 1000, 2000)).toBe(false);
  });

  it('should return false for adjacent intervals', () => {
    expect(intervalsOverlap(1000, 2000, 2000, 3000)).toBe(false);
    expect(intervalsOverlap(2000, 3000, 1000, 2000)).toBe(false);
  });

  it('should return false for completely separate intervals', () => {
    expect(intervalsOverlap(1000, 2000, 3000, 4000)).toBe(false);
    expect(intervalsOverlap(3000, 4000, 1000, 2000)).toBe(false);
  });

  it('should handle zero-length intervals (points)', () => {
    // Point at start boundary - not overlapping
    expect(intervalsOverlap(1000, 1000, 1000, 2000)).toBe(false);
    // Point at end boundary - not overlapping
    expect(intervalsOverlap(1000, 2000, 2000, 2000)).toBe(false);
    // Point inside interval - overlapping
    expect(intervalsOverlap(1000, 1000, 500, 2000)).toBe(true);
    // Point outside interval - not overlapping
    expect(intervalsOverlap(1000, 1000, 2000, 3000)).toBe(false);
  });

  it('should handle very small intervals', () => {
    expect(intervalsOverlap(1000, 1001, 1000, 1001)).toBe(true);
    expect(intervalsOverlap(1000, 1001, 1001, 1002)).toBe(false);
  });

  it('should throw error for invalid intervals (start > end)', () => {
    expect(() => intervalsOverlap(2000, 1000, 1000, 2000)).toThrow();
    expect(() => intervalsOverlap(1000, 2000, 2000, 1000)).toThrow();
  });

  it('should handle large epoch timestamps', () => {
    const day1Start = 1735948800000; // 2025-01-04 00:00:00 UTC
    const day1End = 1736035200000;   // 2025-01-05 00:00:00 UTC
    const day2Start = 1736035200000; // 2025-01-05 00:00:00 UTC
    const day2End = 1736121600000;   // 2025-01-06 00:00:00 UTC

    expect(intervalsOverlap(day1Start, day1End, day2Start, day2End)).toBe(false);
    expect(intervalsOverlap(day1Start, day1End, day1Start + 3600000, day1End - 3600000)).toBe(true);
  });
});

describe('overlapsWithAllDay', () => {
  // Create a fixed date for testing: 2025-01-04
  const allDayDate = new Date('2025-01-04T00:00:00');
  const allDayDateMs = allDayDate.getTime();

  it('should return true when timed event is on the same day as all-day event', () => {
    // Event from 10:00 AM to 11:00 AM on 2025-01-04
    const eventStart = new Date('2025-01-04T10:00:00').getTime();
    const eventEnd = new Date('2025-01-04T11:00:00').getTime();
    
    expect(overlapsWithAllDay(eventStart, eventEnd, allDayDateMs)).toBe(true);
  });

  it('should return true when timed event spans midnight into all-day event day', () => {
    // Event from 11:00 PM on 2025-01-03 to 1:00 AM on 2025-01-04
    const eventStart = new Date('2025-01-03T23:00:00').getTime();
    const eventEnd = new Date('2025-01-04T01:00:00').getTime();
    
    expect(overlapsWithAllDay(eventStart, eventEnd, allDayDateMs)).toBe(true);
  });

  it('should return true when timed event spans midnight out of all-day event day', () => {
    // Event from 11:00 PM on 2025-01-04 to 1:00 AM on 2025-01-05
    const eventStart = new Date('2025-01-04T23:00:00').getTime();
    const eventEnd = new Date('2025-01-05T01:00:00').getTime();
    
    expect(overlapsWithAllDay(eventStart, eventEnd, allDayDateMs)).toBe(true);
  });

  it('should return false when timed event is on a different day', () => {
    // Event on 2025-01-05
    const eventStart = new Date('2025-01-05T10:00:00').getTime();
    const eventEnd = new Date('2025-01-05T11:00:00').getTime();
    
    expect(overlapsWithAllDay(eventStart, eventEnd, allDayDateMs)).toBe(false);
  });

  it('should return false when timed event is on previous day', () => {
    // Event on 2025-01-03
    const eventStart = new Date('2025-01-03T10:00:00').getTime();
    const eventEnd = new Date('2025-01-03T11:00:00').getTime();
    
    expect(overlapsWithAllDay(eventStart, eventEnd, allDayDateMs)).toBe(false);
  });

  it('should return true when timed event covers entire all-day event day', () => {
    // Event from midnight to midnight on 2025-01-04
    const eventStart = new Date('2025-01-04T00:00:00').getTime();
    const eventEnd = new Date('2025-01-05T00:00:00').getTime();
    
    expect(overlapsWithAllDay(eventStart, eventEnd, allDayDateMs)).toBe(true);
  });

  it('should handle all-day events correctly regardless of timezone', () => {
    // All-day event date - create using local time explicitly
    const allDayDate = new Date(2025, 0, 4); // January 4, 2025 in local time
    allDayDate.setHours(0, 0, 0, 0);
    const allDayDateMs = allDayDate.getTime();
    
    // Timed event on the same calendar day (in local time)
    const eventDate = new Date(2025, 0, 4); // January 4, 2025 in local time
    eventDate.setHours(10, 0, 0, 0);
    const eventStart = eventDate.getTime();
    eventDate.setHours(11, 0, 0, 0);
    const eventEnd = eventDate.getTime();
    
    // Should overlap (same calendar day in local time)
    expect(overlapsWithAllDay(eventStart, eventEnd, allDayDateMs)).toBe(true);
  });
});


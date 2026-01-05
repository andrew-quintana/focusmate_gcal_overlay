/**
 * Unit tests for session normalization utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeFocusmateSession,
  normalizeFocusmateSessions,
  generateSessionKey,
} from '../../../src/utils/sessionNormalization';
import type { FocusmateSession } from '../../../src/types/events';

describe('generateSessionKey', () => {
  it('should generate consistent keys for same inputs', () => {
    const key1 = generateSessionKey(1000, 2000, 'Test Session');
    const key2 = generateSessionKey(1000, 2000, 'Test Session');
    
    expect(key1).toBe(key2);
  });

  it('should generate different keys for different times', () => {
    const key1 = generateSessionKey(1000, 2000, 'Test Session');
    const key2 = generateSessionKey(2000, 3000, 'Test Session');
    
    expect(key1).not.toBe(key2);
  });

  it('should generate different keys for different labels', () => {
    const key1 = generateSessionKey(1000, 2000, 'Session A');
    const key2 = generateSessionKey(1000, 2000, 'Session B');
    
    expect(key1).not.toBe(key2);
  });

  it('should handle sessions without labels', () => {
    const key1 = generateSessionKey(1000, 2000);
    const key2 = generateSessionKey(1000, 2000);
    
    expect(key1).toBe(key2);
    expect(key1).toMatch(/^1000-2000-/);
  });

  it('should include label hash in key', () => {
    const key = generateSessionKey(1000, 2000, 'My Session');
    
    expect(key).toMatch(/^1000-2000-/);
    expect(key.split('-').length).toBeGreaterThan(2);
  });
});

describe('normalizeFocusmateSession', () => {
  it('should normalize session with start_time and end_time', () => {
    const apiSession = {
      id: 'session1',
      start_time: '2025-01-04T14:00:00-05:00',
      end_time: '2025-01-04T14:25:00-05:00',
      title: 'Focus Session',
    };

    const normalized = normalizeFocusmateSession(apiSession);

    expect(normalized).not.toBeNull();
    expect(normalized?.id).toBe('session1');
    expect(normalized?.title).toBe('Focus Session');
    expect(normalized?.startMs).toBe(new Date('2025-01-04T14:00:00-05:00').getTime());
    expect(normalized?.endMs).toBe(new Date('2025-01-04T14:25:00-05:00').getTime());
    expect(normalized?.raw).toBe(apiSession);
  });

  it('should normalize session with start and end (alternative field names)', () => {
    const apiSession = {
      session_id: 'session2',
      start: '2025-01-04T10:00:00-05:00',
      end: '2025-01-04T10:25:00-05:00',
      title: 'Morning Focus',
    };

    const normalized = normalizeFocusmateSession(apiSession);

    expect(normalized).not.toBeNull();
    expect(normalized?.id).toBe('session2');
    expect(normalized?.title).toBe('Morning Focus');
    expect(normalized?.startMs).toBe(new Date('2025-01-04T10:00:00-05:00').getTime());
    expect(normalized?.endMs).toBe(new Date('2025-01-04T10:25:00-05:00').getTime());
  });

  it('should use partner_name as title if title is missing', () => {
    const apiSession = {
      id: 'session3',
      start_time: '2025-01-04T16:00:00-05:00',
      end_time: '2025-01-04T16:25:00-05:00',
      partner_name: 'John Doe',
    };

    const normalized = normalizeFocusmateSession(apiSession);

    expect(normalized).not.toBeNull();
    expect(normalized?.title).toBe('John Doe');
  });

  it('should return null for session without id', () => {
    const apiSession = {
      start_time: '2025-01-04T14:00:00-05:00',
      end_time: '2025-01-04T14:25:00-05:00',
    };

    const normalized = normalizeFocusmateSession(apiSession);

    expect(normalized).toBeNull();
  });

  it('should return null for session without start time', () => {
    const apiSession = {
      id: 'session4',
      end_time: '2025-01-04T14:25:00-05:00',
    };

    const normalized = normalizeFocusmateSession(apiSession);

    expect(normalized).toBeNull();
  });

  it('should return null for session without end time', () => {
    const apiSession = {
      id: 'session5',
      start_time: '2025-01-04T14:00:00-05:00',
    };

    const normalized = normalizeFocusmateSession(apiSession);

    expect(normalized).toBeNull();
  });

  it('should return null for session with invalid date format', () => {
    const apiSession = {
      id: 'session6',
      start_time: 'invalid-date',
      end_time: '2025-01-04T14:25:00-05:00',
    };

    const normalized = normalizeFocusmateSession(apiSession);

    expect(normalized).toBeNull();
  });

  it('should return null for session with start >= end', () => {
    const apiSession = {
      id: 'session7',
      start_time: '2025-01-04T14:00:00-05:00',
      end_time: '2025-01-04T14:00:00-05:00',
    };

    const normalized = normalizeFocusmateSession(apiSession);

    expect(normalized).toBeNull();
  });

  it('should handle UTC timezone', () => {
    const apiSession = {
      id: 'session8',
      start_time: '2025-01-04T14:00:00Z',
      end_time: '2025-01-04T14:25:00Z',
    };

    const normalized = normalizeFocusmateSession(apiSession);

    expect(normalized).not.toBeNull();
    expect(normalized?.startMs).toBe(new Date('2025-01-04T14:00:00Z').getTime());
    expect(normalized?.endMs).toBe(new Date('2025-01-04T14:25:00Z').getTime());
  });

  it('should handle session without title or partner_name', () => {
    const apiSession = {
      id: 'session9',
      start_time: '2025-01-04T12:00:00-05:00',
      end_time: '2025-01-04T12:25:00-05:00',
    };

    const normalized = normalizeFocusmateSession(apiSession);

    expect(normalized).not.toBeNull();
    expect(normalized?.title).toBeUndefined();
  });
});

describe('normalizeFocusmateSessions', () => {
  it('should normalize multiple sessions', () => {
    const apiSessions = [
      {
        id: 'session1',
        start_time: '2025-01-04T10:00:00-05:00',
        end_time: '2025-01-04T10:25:00-05:00',
        title: 'Session 1',
      },
      {
        id: 'session2',
        start_time: '2025-01-04T14:00:00-05:00',
        end_time: '2025-01-04T14:25:00-05:00',
        title: 'Session 2',
      },
    ];

    const normalized = normalizeFocusmateSessions(apiSessions);

    expect(normalized).toHaveLength(2);
    expect(normalized[0].id).toBe('session1');
    expect(normalized[1].id).toBe('session2');
  });

  it('should filter out invalid sessions', () => {
    const apiSessions = [
      {
        id: 'session1',
        start_time: '2025-01-04T10:00:00-05:00',
        end_time: '2025-01-04T10:25:00-05:00',
        title: 'Valid Session',
      },
      {
        id: 'invalid1',
        // Missing start_time
        end_time: '2025-01-04T14:25:00-05:00',
      },
      {
        id: 'session2',
        start_time: '2025-01-04T14:00:00-05:00',
        end_time: '2025-01-04T14:25:00-05:00',
        title: 'Another Valid Session',
      },
    ];

    const normalized = normalizeFocusmateSessions(apiSessions);

    expect(normalized).toHaveLength(2);
    expect(normalized[0].id).toBe('session1');
    expect(normalized[1].id).toBe('session2');
  });

  it('should handle empty array', () => {
    const normalized = normalizeFocusmateSessions([]);

    expect(normalized).toHaveLength(0);
  });
});


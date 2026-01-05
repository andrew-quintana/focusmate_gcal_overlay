/**
 * Mock implementations of Chrome extension APIs for testing
 * Compatible with Vitest
 */

import { vi } from 'vitest';

export const mockChrome = {
  identity: {
    getAuthToken: vi.fn(),
    removeCachedAuthToken: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    lastError: undefined as { message: string } | undefined,
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
  },
};

// Make available globally for tests
if (typeof global !== 'undefined') {
  (global as typeof globalThis & { chrome: typeof mockChrome }).chrome = mockChrome;
}


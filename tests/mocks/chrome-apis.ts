/**
 * Mock implementations of Chrome extension APIs for testing
 */

export const mockChrome = {
  identity: {
    getAuthToken: jest.fn(),
    removeCachedAuthToken: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
};

// Make available globally for tests
if (typeof global !== 'undefined') {
  (global as any).chrome = mockChrome;
}


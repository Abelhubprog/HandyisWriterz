// Import testing utilities
import '@testing-library/jest-dom';
import 'jest-environment-jsdom';

// Mock global objects that might not be available in the test environment
global.process = {
  ...process,
  env: {
    ...process.env,
    // Add any environment variables needed for tests
    NODE_ENV: 'test',
    TELEGRAM_BOT_TOKEN: 'test-token',
    TELEGRAM_BOT_CHAT_ID: 'test-chat-id',
    TELEGRAM_WEBHOOK_SECRET: 'test-webhook-secret',
    STORAGE_BUCKET: 'test-bucket',
    STORAGE_REGION: 'test-region',
    STORAGE_ACCESS_KEY: 'test-access-key',
    STORAGE_SECRET_KEY: 'test-secret-key',
  },
};

// Mock Buffer if needed
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Setup any global test utilities
jest.setTimeout(30000); // 30 seconds timeout for tests

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
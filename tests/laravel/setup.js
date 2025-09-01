/**
 * Laravel Integration Test Setup
 * 
 * Sets up the testing environment for Laravel-specific functionality
 */

import { vi } from 'vitest';

// Mock import.meta.env for Laravel Vite environment
global.import = {
  meta: {
    env: {
      DEV: true,
      PROD: false,
      VITE_ONAIROS_API_KEY: 'test-api-key',
      VITE_ONAIROS_TEST_MODE: 'true',
      VITE_ONAIROS_BASE_URL: 'https://api2.onairos.uk'
    }
  }
};

// Mock window.open for OAuth popup tests
global.window.open = vi.fn(() => ({
  closed: false,
  close: vi.fn(),
  location: { href: '' }
}));

// Mock fetch for API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  })
);

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now())
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(() => {}),
  removeItem: vi.fn(() => {}),
  clear: vi.fn(() => {})
};
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true
  });
}
if (typeof global !== 'undefined') {
  global.localStorage = localStorageMock;
}

// Set up default viewport dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768
});

// Mock user agent for desktop by default
Object.defineProperty(window.navigator, 'userAgent', {
  writable: true,
  configurable: true,
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
});

// Clean up after each test
afterEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Reset window properties
  delete window.OnairosConfig;
  delete window.OnairosUtils;
  delete window.createOnairosButton;
  delete window.initializeOnairosForBlade;
}); 
// Test setup file for Jest
import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.ONAIROS_JWT_SECRET_KEY = 'test_jwt_secret_key';
process.env.ONAIROS_API_KEY = 'ona_test_api_key';
process.env.MONGO_URI = 'mongodb://localhost:27017/onairos_test';
process.env.ENOCH_MONGO_URI = 'mongodb://localhost:27017/enoch_test';

// Mock console methods in tests if needed
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn()
};

// Global test utilities
global.createMockUser = (overrides = {}) => ({
  _id: 'test_user_id',
  userName: 'test_user',
  email: 'test@example.com',
  userType: 'onairos',
  ...overrides
});

global.createMockConnection = (platform, overrides = {}) => ({
  platform,
  accessToken: `${platform}_access_token`,
  refreshToken: `${platform}_refresh_token`,
  tokenExpiry: new Date(Date.now() + 3600000),
  connectedAt: new Date(),
  hasRefreshToken: true,
  ...overrides
});

global.createMockHealthResult = (status = 'healthy', overrides = {}) => ({
  status,
  message: `Connection is ${status}`,
  lastChecked: new Date(),
  needsReauth: status === 'expired_no_refresh',
  canRefresh: status === 'expired_refreshable',
  ...overrides
});

// Mock fetch globally if needed
global.fetch = jest.fn();

// Setup and teardown hooks
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  if (global.fetch) {
    global.fetch.mockClear();
  }
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit the process
  // process.exit(1);
});

// Increase timeout for async tests
jest.setTimeout(30000);

// Add custom matchers
expect.extend({
  toBeValidRequestId(received) {
    const pass = typeof received === 'string' && received.length > 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid request ID`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid request ID`,
        pass: false
      };
    }
  },
  
  toBeValidTimestamp(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid timestamp`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid timestamp`,
        pass: false
      };
    }
  },
  
  toBeValidConnectionHealth(received) {
    const validStatuses = ['healthy', 'expired_refreshable', 'expired_no_refresh', 'invalid_token', 'not_connected', 'error'];
    const pass = received && 
                 typeof received === 'object' && 
                 validStatuses.includes(received.status) &&
                 typeof received.message === 'string';
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be valid connection health`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be valid connection health`,
        pass: false
      };
    }
  }
});

// Export test utilities
export const testUtils = {
  createMockUser: global.createMockUser,
  createMockConnection: global.createMockConnection,
  createMockHealthResult: global.createMockHealthResult,
  
  // Helper to create mock Express request
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {
      'x-api-key': 'ona_test_api_key',
      'authorization': 'Bearer test_jwt_token'
    },
    ...overrides
  }),
  
  // Helper to create mock Express response
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
  },
  
  // Helper to create mock Express next function
  createMockNext: () => jest.fn(),
  
  // Helper to wait for async operations
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create test JWT token
  createTestJWT: (payload = {}) => {
    const defaultPayload = {
      userId: 'test_user_id',
      username: 'test_user',
      email: 'test@example.com',
      userType: 'onairos',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    
    return Buffer.from(JSON.stringify({ ...defaultPayload, ...payload })).toString('base64');
  }
};

console.log('🧪 Test setup completed'); 
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import linkedinRoutes from '../../routes/linkedin-enhanced.js';

// Mock dependencies
jest.mock('../../utils/tokenManager.js');
jest.mock('../../utils/connectionHealth.js');
jest.mock('../../utils/databaseUtils.js');
jest.mock('../../middleware/unifiedApiKeyAuth.js');
jest.mock('node-fetch');

const app = express();
app.use(express.json());

// Mock middleware
const mockSmartAuth = (req, res, next) => {
  req.authMethod = 'api_key';
  req.apiKeyInfo = {
    keyId: 'test_key_id',
    permissions: ['oauth:linkedin']
  };
  next();
};

const mockAuthenticateApiKey = (req, res, next) => {
  req.apiKeyInfo = {
    keyId: 'test_key_id',
    permissions: ['oauth:linkedin']
  };
  next();
};

// Mock auth middleware
jest.mock('../../middleware/unifiedApiKeyAuth.js', () => ({
  smartAuth: mockSmartAuth,
  authenticateApiKey: mockAuthenticateApiKey
}));

app.use('/linkedin', linkedinRoutes);

describe('LinkedIn Enhanced Routes', () => {
  let mockDbUtils;
  let mockHealthMonitor;
  let mockTokenManager;
  let mockFetch;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock database utils
    mockDbUtils = {
      getUserWithSmartLookup: jest.fn(),
      updateUserConnection: jest.fn(),
      getUserConnections: jest.fn()
    };
    
    // Mock health monitor
    mockHealthMonitor = {
      checkConnectionHealth: jest.fn()
    };
    
    // Mock token manager
    mockTokenManager = {
      refreshAccessToken: jest.fn(),
      refreshTokenIfNeeded: jest.fn()
    };
    
    // Mock fetch
    mockFetch = jest.fn();
    
    // Apply mocks
    const { DatabaseUtils } = await import('../../utils/databaseUtils.js');
    const { ConnectionHealthMonitor } = await import('../../utils/connectionHealth.js');
    const { TokenManager } = await import('../../utils/tokenManager.js');
    const fetch = await import('node-fetch');
    
    DatabaseUtils.prototype.getUserWithSmartLookup = mockDbUtils.getUserWithSmartLookup;
    DatabaseUtils.prototype.updateUserConnection = mockDbUtils.updateUserConnection;
    DatabaseUtils.prototype.getUserConnections = mockDbUtils.getUserConnections;
    
    ConnectionHealthMonitor.prototype.checkConnectionHealth = mockHealthMonitor.checkConnectionHealth;
    
    TokenManager.prototype.refreshAccessToken = mockTokenManager.refreshAccessToken;
    TokenManager.prototype.refreshTokenIfNeeded = mockTokenManager.refreshTokenIfNeeded;
    
    fetch.default = mockFetch;
  });

  describe('POST /linkedin/native-auth', () => {
    it('should successfully authenticate LinkedIn connection', async () => {
      // Mock successful user lookup
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user',
          email: 'test@example.com'
        },
        userType: 'onairos'
      });

      // Mock successful LinkedIn API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'linkedin_profile_id',
          localizedFirstName: 'John',
          localizedLastName: 'Doe'
        })
      });

      // Mock successful database update
      mockDbUtils.updateUserConnection.mockResolvedValue(true);

      // Mock healthy connection
      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'healthy',
        message: 'Connection is healthy',
        lastChecked: new Date()
      });

      const response = await request(app)
        .post('/linkedin/native-auth')
        .send({
          accessToken: 'valid_linkedin_token',
          refreshToken: 'valid_refresh_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.userType).toBe('onairos');
      expect(response.body.connectionData.platform).toBe('linkedin');
      expect(response.body.connectionData.userName).toBe('John Doe');
      expect(response.body.connectionHealth.status).toBe('healthy');
    });

    it('should return error for missing access token', async () => {
      const response = await request(app)
        .post('/linkedin/native-auth')
        .send({
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing access token');
      expect(response.body.code).toBe('MISSING_ACCESS_TOKEN');
    });

    it('should return error for missing user account info', async () => {
      const response = await request(app)
        .post('/linkedin/native-auth')
        .send({
          accessToken: 'valid_linkedin_token'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing user account information');
      expect(response.body.code).toBe('MISSING_USER_INFO');
    });

    it('should return error for user not found', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: null,
        userType: null
      });

      const response = await request(app)
        .post('/linkedin/native-auth')
        .send({
          accessToken: 'valid_linkedin_token',
          userAccountInfo: {
            username: 'nonexistent_user',
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });

    it('should return error for invalid LinkedIn token', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user',
          email: 'test@example.com'
        },
        userType: 'onairos'
      });

      // Mock LinkedIn API error response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Invalid token'
      });

      const response = await request(app)
        .post('/linkedin/native-auth')
        .send({
          accessToken: 'invalid_linkedin_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid LinkedIn access token');
      expect(response.body.code).toBe('INVALID_ACCESS_TOKEN');
    });

    it('should handle LinkedIn profile with only ID', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user',
          email: 'test@example.com'
        },
        userType: 'onairos'
      });

      // Mock LinkedIn API response with only ID
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'linkedin_profile_id_only'
        })
      });

      mockDbUtils.updateUserConnection.mockResolvedValue(true);
      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'healthy',
        message: 'Connection is healthy'
      });

      const response = await request(app)
        .post('/linkedin/native-auth')
        .send({
          accessToken: 'valid_linkedin_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connectionData.userName).toBe('linkedin_profile_id_only');
      expect(response.body.connectionData.profileId).toBe('linkedin_profile_id_only');
    });

    it('should handle refresh token detection from multiple sources', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user',
          email: 'test@example.com'
        },
        userType: 'onairos'
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'linkedin_profile_id',
          localizedFirstName: 'John',
          localizedLastName: 'Doe'
        })
      });

      mockDbUtils.updateUserConnection.mockResolvedValue(true);
      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'healthy',
        message: 'Connection is healthy'
      });

      const response = await request(app)
        .post('/linkedin/native-auth')
        .send({
          accessToken: 'valid_linkedin_token',
          refresh_token: 'refresh_from_body',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com',
            refreshToken: 'refresh_from_userinfo'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connectionData.hasRefreshToken).toBe(true);
    });

    it('should warn about missing refresh token', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user',
          email: 'test@example.com'
        },
        userType: 'onairos'
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'linkedin_profile_id',
          localizedFirstName: 'John',
          localizedLastName: 'Doe'
        })
      });

      mockDbUtils.updateUserConnection.mockResolvedValue(true);
      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'healthy',
        message: 'Connection is healthy'
      });

      const response = await request(app)
        .post('/linkedin/native-auth')
        .send({
          accessToken: 'valid_linkedin_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connectionData.hasRefreshToken).toBe(false);
      expect(response.body.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'refresh_token_warning'
        })
      );
    });
  });

  describe('GET /linkedin/connection-status/:username', () => {
    it('should return connection status for valid user', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'healthy',
        message: 'Connection is healthy',
        lastChecked: new Date(),
        needsReauth: false
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        linkedin: {
          accessToken: 'token',
          userName: 'John Doe',
          profileId: 'linkedin_profile_id',
          connectedAt: new Date(),
          hasRefreshToken: true
        }
      });

      const response = await request(app)
        .get('/linkedin/connection-status/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.platform).toBe('linkedin');
      expect(response.body.username).toBe('test_user');
      expect(response.body.connectionHealth.status).toBe('healthy');
      expect(response.body.connectionDetails.connected).toBe(true);
      expect(response.body.connectionDetails.userName).toBe('John Doe');
    });

    it('should return error for non-existent user', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: null,
        userType: null
      });

      const response = await request(app)
        .get('/linkedin/connection-status/nonexistent_user');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });

    it('should include recommendations for re-authentication', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'expired_no_refresh',
        message: 'Token expired and no refresh token available',
        needsReauth: true
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        linkedin: {
          accessToken: 'expired_token',
          userName: 'John Doe',
          hasRefreshToken: false
        }
      });

      const response = await request(app)
        .get('/linkedin/connection-status/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'reauth_required',
          actionRequired: true
        })
      );
    });
  });

  describe('POST /linkedin/refresh-token', () => {
    it('should successfully refresh token', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        linkedin: {
          accessToken: 'old_token',
          refreshToken: 'valid_refresh_token'
        }
      });

      mockTokenManager.refreshAccessToken.mockResolvedValue({
        access_token: 'new_access_token'
      });

      mockDbUtils.updateUserConnection.mockResolvedValue(true);

      const response = await request(app)
        .post('/linkedin/refresh-token')
        .send({
          username: 'test_user'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('LinkedIn token refreshed successfully');
      expect(response.body.refreshedAt).toBeDefined();
      expect(response.body.newTokenExpiry).toBeDefined();
    });

    it('should return error for missing username', async () => {
      const response = await request(app)
        .post('/linkedin/refresh-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username is required');
      expect(response.body.code).toBe('MISSING_USERNAME');
    });

    it('should return error for connection not found', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        linkedin: null
      });

      const response = await request(app)
        .post('/linkedin/refresh-token')
        .send({
          username: 'test_user'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('LinkedIn connection not found');
      expect(response.body.code).toBe('CONNECTION_NOT_FOUND');
    });

    it('should return error for no refresh token', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        linkedin: {
          accessToken: 'token',
          refreshToken: null
        }
      });

      const response = await request(app)
        .post('/linkedin/refresh-token')
        .send({
          username: 'test_user'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No refresh token available');
      expect(response.body.code).toBe('NO_REFRESH_TOKEN');
      expect(response.body.guidance).toBe('User needs to reconnect their LinkedIn account to get a new refresh token');
    });
  });

  describe('POST /linkedin/validate-connection/:username', () => {
    it('should validate healthy connection', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        linkedin: {
          accessToken: 'valid_token',
          refreshToken: 'valid_refresh_token',
          userName: 'John Doe',
          profileId: 'linkedin_profile_id'
        }
      });

      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'healthy',
        message: 'Connection is healthy'
      });

      // Mock successful LinkedIn API call
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'linkedin_profile_id',
          localizedFirstName: 'John',
          localizedLastName: 'Doe'
        })
      });

      const response = await request(app)
        .post('/linkedin/validate-connection/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.platform).toBe('linkedin');
      expect(response.body.tokenValidation.isValid).toBe(true);
      expect(response.body.tokenValidation.canRefresh).toBe(true);
      expect(response.body.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'connection_healthy'
        })
      );
    });

    it('should detect expired token that needs reconnection', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        linkedin: {
          accessToken: 'expired_token',
          refreshToken: null,
          userName: 'John Doe'
        }
      });

      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'expired_no_refresh',
        message: 'Token expired and no refresh token available'
      });

      // Mock expired token response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Token expired'
      });

      const response = await request(app)
        .post('/linkedin/validate-connection/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tokenValidation.isValid).toBe(false);
      expect(response.body.tokenValidation.isExpired).toBe(true);
      expect(response.body.tokenValidation.canRefresh).toBe(false);
      expect(response.body.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'reconnection_required'
        })
      );
    });

    it('should handle no connection found', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        linkedin: null
      });

      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'not_connected',
        message: 'No connection found'
      });

      const response = await request(app)
        .post('/linkedin/validate-connection/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connectionDetails.connected).toBe(false);
      expect(response.body.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'no_connection'
        })
      );
    });
  });

  describe('POST /linkedin/test-auth', () => {
    it('should return successful authentication test', async () => {
      const response = await request(app)
        .post('/linkedin/test-auth');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('LinkedIn authentication test passed');
      expect(response.body.authMethod).toBe('api_key');
      expect(response.body.configuration.platform).toBe('linkedin');
      expect(response.body.configuration.enabled).toBeDefined();
    });

    it('should include API key information in test response', async () => {
      const response = await request(app)
        .post('/linkedin/test-auth');

      expect(response.status).toBe(200);
      expect(response.body.apiKeyInfo).toEqual({
        keyId: 'test_key_id',
        permissions: ['oauth:linkedin']
      });
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockDbUtils.getUserWithSmartLookup.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/linkedin/native-auth')
        .send({
          accessToken: 'valid_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error during LinkedIn authentication');
      expect(response.body.code).toBe('INTERNAL_ERROR');
      expect(response.body.requestId).toBeDefined();
    });

    it('should handle LinkedIn API network errors', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user',
          email: 'test@example.com'
        },
        userType: 'onairos'
      });

      // Mock network error
      mockFetch.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .post('/linkedin/native-auth')
        .send({
          accessToken: 'valid_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to validate LinkedIn access token');
      expect(response.body.code).toBe('TOKEN_VALIDATION_ERROR');
    });

    it('should include development error details in development mode', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockDbUtils.getUserWithSmartLookup.mockRejectedValue(
        new Error('Specific database error')
      );

      const response = await request(app)
        .post('/linkedin/native-auth')
        .send({
          accessToken: 'valid_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.details).toBe('Specific database error');

      process.env.NODE_ENV = originalNodeEnv;
    });
  });
}); 
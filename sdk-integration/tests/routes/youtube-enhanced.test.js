import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import youtubeRoutes from '../../routes/youtube-enhanced.js';

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
    permissions: ['oauth:youtube']
  };
  next();
};

const mockAuthenticateApiKey = (req, res, next) => {
  req.apiKeyInfo = {
    keyId: 'test_key_id',
    permissions: ['oauth:youtube']
  };
  next();
};

// Mock auth middleware
jest.mock('../../middleware/unifiedApiKeyAuth.js', () => ({
  smartAuth: mockSmartAuth,
  authenticateApiKey: mockAuthenticateApiKey
}));

app.use('/youtube', youtubeRoutes);

describe('YouTube Enhanced Routes', () => {
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

  describe('POST /youtube/native-auth', () => {
    it('should successfully authenticate YouTube connection', async () => {
      // Mock successful user lookup
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user',
          email: 'test@example.com'
        },
        userType: 'onairos'
      });

      // Mock successful YouTube API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'youtube_channel_id',
          snippet: {
            title: 'Test Channel',
            description: 'Test channel description'
          }
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
        .post('/youtube/native-auth')
        .send({
          accessToken: 'valid_youtube_token',
          refreshToken: 'valid_refresh_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com',
            channelName: 'Test Channel'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.userType).toBe('onairos');
      expect(response.body.connectionData.platform).toBe('youtube');
      expect(response.body.connectionHealth.status).toBe('healthy');
    });

    it('should return error for missing access token', async () => {
      const response = await request(app)
        .post('/youtube/native-auth')
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
        .post('/youtube/native-auth')
        .send({
          accessToken: 'valid_youtube_token'
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
        .post('/youtube/native-auth')
        .send({
          accessToken: 'valid_youtube_token',
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

    it('should return error for invalid YouTube token', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user',
          email: 'test@example.com'
        },
        userType: 'onairos'
      });

      // Mock YouTube API error response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Invalid token'
      });

      const response = await request(app)
        .post('/youtube/native-auth')
        .send({
          accessToken: 'invalid_youtube_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid YouTube access token');
      expect(response.body.code).toBe('INVALID_ACCESS_TOKEN');
    });

    it('should handle database update failure', async () => {
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
          id: 'youtube_channel_id',
          snippet: {
            title: 'Test Channel'
          }
        })
      });

      // Mock database update failure
      mockDbUtils.updateUserConnection.mockResolvedValue(false);

      const response = await request(app)
        .post('/youtube/native-auth')
        .send({
          accessToken: 'valid_youtube_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to update YouTube connection');
      expect(response.body.code).toBe('UPDATE_FAILED');
    });

    it('should handle refresh token sources correctly', async () => {
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
          id: 'youtube_channel_id',
          snippet: {
            title: 'Test Channel'
          }
        })
      });

      mockDbUtils.updateUserConnection.mockResolvedValue(true);
      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'healthy',
        message: 'Connection is healthy'
      });

      const response = await request(app)
        .post('/youtube/native-auth')
        .send({
          accessToken: 'valid_youtube_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com',
            refreshToken: 'refresh_from_userinfo'
          },
          session: {
            refreshToken: 'refresh_from_session'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connectionData.hasRefreshToken).toBe(true);
    });
  });

  describe('GET /youtube/connection-status/:username', () => {
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
        youtube: {
          accessToken: 'token',
          channelName: 'Test Channel',
          channelId: 'channel_id',
          connectedAt: new Date(),
          hasRefreshToken: true
        }
      });

      const response = await request(app)
        .get('/youtube/connection-status/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.platform).toBe('youtube');
      expect(response.body.username).toBe('test_user');
      expect(response.body.connectionHealth.status).toBe('healthy');
      expect(response.body.connectionDetails.connected).toBe(true);
    });

    it('should return error for non-existent user', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: null,
        userType: null
      });

      const response = await request(app)
        .get('/youtube/connection-status/nonexistent_user');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });

    it('should include recommendations for expired tokens', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'expired_refreshable',
        message: 'Token expired but can be refreshed',
        needsReauth: false
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: {
          accessToken: 'token',
          channelName: 'Test Channel',
          hasRefreshToken: true
        }
      });

      const response = await request(app)
        .get('/youtube/connection-status/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toHaveLength(1);
      expect(response.body.recommendations[0].type).toBe('token_refresh_available');
    });
  });

  describe('POST /youtube/refresh-token', () => {
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
        youtube: {
          accessToken: 'old_token',
          refreshToken: 'valid_refresh_token'
        }
      });

      mockTokenManager.refreshAccessToken.mockResolvedValue('new_access_token');
      mockDbUtils.updateUserConnection.mockResolvedValue(true);

      const response = await request(app)
        .post('/youtube/refresh-token')
        .send({
          username: 'test_user'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('YouTube token refreshed successfully');
      expect(response.body.refreshedAt).toBeDefined();
      expect(response.body.newTokenExpiry).toBeDefined();
    });

    it('should return error for missing username', async () => {
      const response = await request(app)
        .post('/youtube/refresh-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username is required');
      expect(response.body.code).toBe('MISSING_USERNAME');
    });

    it('should return error for user without refresh token', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: {
          accessToken: 'token',
          refreshToken: null
        }
      });

      const response = await request(app)
        .post('/youtube/refresh-token')
        .send({
          username: 'test_user'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No refresh token available');
      expect(response.body.code).toBe('NO_REFRESH_TOKEN');
    });

    it('should handle refresh token failure', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: {
          accessToken: 'token',
          refreshToken: 'invalid_refresh_token'
        }
      });

      mockTokenManager.refreshAccessToken.mockResolvedValue(null);

      const response = await request(app)
        .post('/youtube/refresh-token')
        .send({
          username: 'test_user'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Token refresh failed');
      expect(response.body.code).toBe('REFRESH_FAILED');
    });
  });

  describe('POST /youtube/validate-connection/:username', () => {
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
        youtube: {
          accessToken: 'valid_token',
          refreshToken: 'valid_refresh_token',
          channelName: 'Test Channel',
          channelId: 'channel_id'
        }
      });

      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'healthy',
        message: 'Connection is healthy'
      });

      // Mock successful YouTube API call
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'channel_id',
          snippet: { title: 'Test Channel' }
        })
      });

      const response = await request(app)
        .post('/youtube/validate-connection/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.platform).toBe('youtube');
      expect(response.body.tokenValidation.isValid).toBe(true);
      expect(response.body.tokenValidation.canRefresh).toBe(true);
      expect(response.body.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'connection_healthy'
        })
      );
    });

    it('should detect expired token with refresh capability', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: {
          accessToken: 'expired_token',
          refreshToken: 'valid_refresh_token',
          channelName: 'Test Channel'
        }
      });

      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'expired_refreshable',
        message: 'Token expired but can be refreshed'
      });

      // Mock expired token response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Token expired'
      });

      const response = await request(app)
        .post('/youtube/validate-connection/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tokenValidation.isValid).toBe(false);
      expect(response.body.tokenValidation.isExpired).toBe(true);
      expect(response.body.tokenValidation.canRefresh).toBe(true);
      expect(response.body.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'token_refresh_needed'
        })
      );
    });

    it('should detect missing refresh token', async () => {
      const mockUser = {
        _id: 'user_id',
        userName: 'test_user'
      };

      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: mockUser,
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: {
          accessToken: 'valid_token',
          refreshToken: null,
          channelName: 'Test Channel'
        }
      });

      mockHealthMonitor.checkConnectionHealth.mockResolvedValue({
        status: 'healthy',
        message: 'Connection is healthy'
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'channel_id',
          snippet: { title: 'Test Channel' }
        })
      });

      const response = await request(app)
        .post('/youtube/validate-connection/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tokenValidation.isValid).toBe(true);
      expect(response.body.tokenValidation.canRefresh).toBe(false);
      expect(response.body.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'missing_refresh_token'
        })
      );
    });
  });

  describe('POST /youtube/test-auth', () => {
    it('should return successful authentication test', async () => {
      const response = await request(app)
        .post('/youtube/test-auth');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('YouTube authentication test passed');
      expect(response.body.authMethod).toBe('api_key');
      expect(response.body.configuration.platform).toBe('youtube');
      expect(response.body.configuration.enabled).toBeDefined();
    });

    it('should include API key information in test response', async () => {
      const response = await request(app)
        .post('/youtube/test-auth');

      expect(response.status).toBe(200);
      expect(response.body.apiKeyInfo).toEqual({
        keyId: 'test_key_id',
        permissions: ['oauth:youtube']
      });
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockDbUtils.getUserWithSmartLookup.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/youtube/native-auth')
        .send({
          accessToken: 'valid_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error during YouTube authentication');
      expect(response.body.code).toBe('INTERNAL_ERROR');
      expect(response.body.requestId).toBeDefined();
    });

    it('should include development error details in development mode', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockDbUtils.getUserWithSmartLookup.mockRejectedValue(
        new Error('Specific database error')
      );

      const response = await request(app)
        .post('/youtube/native-auth')
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
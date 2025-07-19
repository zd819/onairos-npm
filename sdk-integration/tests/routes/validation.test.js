import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import validationRoutes from '../../routes/validation.js';

// Mock dependencies
jest.mock('../../utils/tokenManager.js');
jest.mock('../../utils/connectionHealth.js');
jest.mock('../../utils/databaseUtils.js');
jest.mock('../../middleware/unifiedApiKeyAuth.js');
jest.mock('../../config/sdk-config.js');

const app = express();
app.use(express.json());

// Mock middleware
const mockAuthenticateApiKey = (req, res, next) => {
  req.apiKeyInfo = {
    keyId: 'test_key_id',
    permissions: ['oauth:*']
  };
  next();
};

// Mock auth middleware
jest.mock('../../middleware/unifiedApiKeyAuth.js', () => ({
  authenticateApiKey: mockAuthenticateApiKey
}));

app.use('/validation', validationRoutes);

describe('Validation Routes', () => {
  let mockDbUtils;
  let mockHealthMonitor;
  let mockTokenManager;
  let mockSdkConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock database utils
    mockDbUtils = {
      getUserWithSmartLookup: jest.fn(),
      getUserConnections: jest.fn(),
      updateUserConnection: jest.fn()
    };
    
    // Mock health monitor
    mockHealthMonitor = {
      checkConnectionHealth: jest.fn()
    };
    
    // Mock token manager
    mockTokenManager = {
      refreshTokenIfNeeded: jest.fn()
    };
    
    // Mock SDK config
    mockSdkConfig = {
      platforms: {
        youtube: { enabled: true },
        linkedin: { enabled: true },
        reddit: { enabled: true }
      },
      features: {
        dualAuthentication: true,
        connectionHealthMonitoring: true
      }
    };
    
    // Apply mocks
    const { DatabaseUtils } = await import('../../utils/databaseUtils.js');
    const { ConnectionHealthMonitor } = await import('../../utils/connectionHealth.js');
    const { TokenManager } = await import('../../utils/tokenManager.js');
    const { sdkConfig } = await import('../../config/sdk-config.js');
    
    DatabaseUtils.prototype.getUserWithSmartLookup = mockDbUtils.getUserWithSmartLookup;
    DatabaseUtils.prototype.getUserConnections = mockDbUtils.getUserConnections;
    DatabaseUtils.prototype.updateUserConnection = mockDbUtils.updateUserConnection;
    
    ConnectionHealthMonitor.prototype.checkConnectionHealth = mockHealthMonitor.checkConnectionHealth;
    
    TokenManager.prototype.refreshTokenIfNeeded = mockTokenManager.refreshTokenIfNeeded;
    
    Object.assign(sdkConfig, mockSdkConfig);
  });

  describe('GET /validation/health-check/:username', () => {
    it('should return comprehensive health check for all platforms', async () => {
      // Mock user lookup
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      // Mock user connections
      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: {
          accessToken: 'youtube_token',
          hasRefreshToken: true
        },
        linkedin: {
          accessToken: 'linkedin_token',
          hasRefreshToken: false
        }
      });

      // Mock health check results
      mockHealthMonitor.checkConnectionHealth
        .mockResolvedValueOnce({
          status: 'healthy',
          message: 'YouTube connection is healthy'
        })
        .mockResolvedValueOnce({
          status: 'expired_refreshable',
          message: 'LinkedIn token is expired but can be refreshed'
        })
        .mockResolvedValueOnce({
          status: 'not_connected',
          message: 'Reddit is not connected'
        });

      const response = await request(app)
        .get('/validation/health-check/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.username).toBe('test_user');
      expect(response.body.userType).toBe('onairos');
      expect(response.body.summary.connectedPlatforms).toBe(2);
      expect(response.body.summary.healthyPlatforms).toBe(1);
      expect(response.body.platforms).toHaveProperty('youtube');
      expect(response.body.platforms).toHaveProperty('linkedin');
      expect(response.body.platforms).toHaveProperty('reddit');
      expect(response.body.recommendations).toBeInstanceOf(Array);
    });

    it('should return error for user not found', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: null,
        userType: null
      });

      const response = await request(app)
        .get('/validation/health-check/nonexistent_user');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });

    it('should calculate overall health score correctly', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: { accessToken: 'token' },
        linkedin: { accessToken: 'token' }
      });

      // Mock two healthy connections
      mockHealthMonitor.checkConnectionHealth
        .mockResolvedValueOnce({ status: 'healthy' })
        .mockResolvedValueOnce({ status: 'healthy' })
        .mockResolvedValueOnce({ status: 'not_connected' });

      const response = await request(app)
        .get('/validation/health-check/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary.overallScore).toBe(100);
      expect(response.body.summary.overallStatus).toBe('healthy');
    });

    it('should generate appropriate recommendations', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: { accessToken: 'token' }
      });

      mockHealthMonitor.checkConnectionHealth
        .mockResolvedValueOnce({ status: 'expired_refreshable' })
        .mockResolvedValueOnce({ status: 'not_connected' })
        .mockResolvedValueOnce({ status: 'not_connected' });

      const response = await request(app)
        .get('/validation/health-check/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'token_refresh_available',
          platform: 'youtube'
        })
      );
      expect(response.body.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'expand_connections'
        })
      );
    });

    it('should handle platform health check errors', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: { accessToken: 'token' }
      });

      // Mock health check error
      mockHealthMonitor.checkConnectionHealth
        .mockRejectedValueOnce(new Error('Health check failed'))
        .mockResolvedValueOnce({ status: 'not_connected' })
        .mockResolvedValueOnce({ status: 'not_connected' });

      const response = await request(app)
        .get('/validation/health-check/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.platforms.youtube.status).toBe('error');
      expect(response.body.platforms.youtube.error).toBe('Health check failed');
    });
  });

  describe('POST /validation/repair-connections/:username', () => {
    it('should repair connections successfully', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: {
          accessToken: 'youtube_token',
          hasRefreshToken: true
        },
        linkedin: {
          accessToken: 'linkedin_token',
          hasRefreshToken: false
        }
      });

      // Mock health check results
      mockHealthMonitor.checkConnectionHealth
        .mockResolvedValueOnce({ status: 'expired_refreshable' })
        .mockResolvedValueOnce({ status: 'expired_no_refresh' })
        .mockResolvedValueOnce({ status: 'healthy' });

      // Mock token refresh
      mockTokenManager.refreshTokenIfNeeded.mockResolvedValue({
        success: true,
        message: 'Token refreshed successfully',
        refreshed: true
      });

      const response = await request(app)
        .post('/validation/repair-connections/test_user')
        .send({
          platforms: ['youtube', 'linkedin']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary.successfulRepairs).toBe(1);
      expect(response.body.summary.failedRepairs).toBe(1);
      expect(response.body.successfulRepairs).toContain('youtube');
      expect(response.body.failedRepairs).toContain('linkedin');
    });

    it('should repair all connected platforms when no specific platforms provided', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: { accessToken: 'token' },
        linkedin: { accessToken: 'token' }
      });

      mockHealthMonitor.checkConnectionHealth
        .mockResolvedValue({ status: 'healthy' });

      const response = await request(app)
        .post('/validation/repair-connections/test_user')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary.totalPlatforms).toBe(2);
      expect(response.body.repairResults).toHaveProperty('youtube');
      expect(response.body.repairResults).toHaveProperty('linkedin');
    });

    it('should handle platforms that are already healthy', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: { accessToken: 'token' }
      });

      mockHealthMonitor.checkConnectionHealth
        .mockResolvedValue({ status: 'healthy' });

      const response = await request(app)
        .post('/validation/repair-connections/test_user')
        .send({
          platforms: ['youtube']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.repairResults.youtube.message).toBe('Platform is already healthy, no repair needed');
      expect(response.body.repairResults.youtube.repairAttempted).toBe(false);
      expect(response.body.successfulRepairs).toContain('youtube');
    });

    it('should handle token refresh failures', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: { accessToken: 'token' }
      });

      mockHealthMonitor.checkConnectionHealth
        .mockResolvedValue({ status: 'expired_refreshable' });

      mockTokenManager.refreshTokenIfNeeded.mockResolvedValue({
        success: false,
        error: 'Refresh token expired'
      });

      const response = await request(app)
        .post('/validation/repair-connections/test_user')
        .send({
          platforms: ['youtube']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.repairResults.youtube.repairSuccess).toBe(false);
      expect(response.body.repairResults.youtube.error).toBe('Refresh token expired');
      expect(response.body.failedRepairs).toContain('youtube');
    });

    it('should generate recommendations for failed repairs', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: { accessToken: 'token' }
      });

      mockHealthMonitor.checkConnectionHealth
        .mockResolvedValue({ status: 'expired_no_refresh' });

      const response = await request(app)
        .post('/validation/repair-connections/test_user')
        .send({
          platforms: ['youtube']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'manual_reconnection_required',
          platform: 'youtube'
        })
      );
    });
  });

  describe('GET /validation/migration-status/:username', () => {
    it('should return migration status for user', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: {
          accessToken: 'token',
          refreshToken: 'refresh_token',
          lastValidated: new Date()
        },
        linkedin: {
          accessToken: 'token',
          refreshToken: null,
          lastValidated: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
        }
      });

      const response = await request(app)
        .get('/validation/migration-status/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.migrationStatus.connectedPlatforms).toBe(2);
      expect(response.body.migrationStatus.platformsNeedingMigration).toBe(1);
      expect(response.body.migrationNeeded).toContain('linkedin');
      expect(response.body.platformStatuses.youtube.needsUpgrade).toBe(false);
      expect(response.body.platformStatuses.linkedin.needsUpgrade).toBe(true);
    });

    it('should detect legacy connections', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: {
          accessToken: 'token',
          refreshToken: 'refresh_token',
          lastValidated: oldDate
        }
      });

      const response = await request(app)
        .get('/validation/migration-status/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.platformStatuses.youtube.isLegacyConnection).toBe(true);
      expect(response.body.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'legacy_connection',
          platform: 'youtube'
        })
      );
    });

    it('should calculate migration progress correctly', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({
        youtube: {
          accessToken: 'token',
          refreshToken: 'refresh_token',
          lastValidated: new Date()
        },
        linkedin: {
          accessToken: 'token',
          refreshToken: 'refresh_token',
          lastValidated: new Date()
        }
      });

      const response = await request(app)
        .get('/validation/migration-status/test_user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.migrationStatus.status).toBe('completed');
      expect(response.body.migrationStatus.migrationProgress).toBe(100);
      expect(response.body.migrationNeeded).toHaveLength(0);
    });
  });

  describe('GET /validation/system-health', () => {
    it('should return system health status', async () => {
      const response = await request(app)
        .get('/validation/system-health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.overallHealth).toBeDefined();
      expect(response.body.healthChecks).toHaveProperty('configuration');
      expect(response.body.healthChecks).toHaveProperty('database');
      expect(response.body.healthChecks).toHaveProperty('platforms');
      expect(response.body.healthChecks).toHaveProperty('authentication');
      expect(response.body.systemInfo).toBeDefined();
    });

    it('should calculate overall health score', async () => {
      const response = await request(app)
        .get('/validation/system-health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.overallHealth.score).toBeGreaterThanOrEqual(0);
      expect(response.body.overallHealth.score).toBeLessThanOrEqual(100);
      expect(response.body.overallHealth.status).toMatch(/healthy|warning|error/);
    });

    it('should include system information', async () => {
      const response = await request(app)
        .get('/validation/system-health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.systemInfo).toHaveProperty('uptime');
      expect(response.body.systemInfo).toHaveProperty('nodeVersion');
      expect(response.body.systemInfo).toHaveProperty('environment');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDbUtils.getUserWithSmartLookup.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/validation/health-check/test_user');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to perform health check');
      expect(response.body.code).toBe('HEALTH_CHECK_ERROR');
    });

    it('should handle repair operation errors', async () => {
      mockDbUtils.getUserWithSmartLookup.mockRejectedValue(
        new Error('Repair operation failed')
      );

      const response = await request(app)
        .post('/validation/repair-connections/test_user');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to repair connections');
      expect(response.body.code).toBe('REPAIR_ERROR');
    });

    it('should handle system health check errors', async () => {
      // Mock SDK config to cause error
      const originalConfig = mockSdkConfig.features;
      mockSdkConfig.features = null;

      const response = await request(app)
        .get('/validation/system-health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.healthChecks.configuration.status).toBe('error');

      // Restore original config
      mockSdkConfig.features = originalConfig;
    });
  });

  describe('Request validation', () => {
    it('should validate username parameter', async () => {
      const response = await request(app)
        .get('/validation/health-check/');

      expect(response.status).toBe(404);
    });

    it('should validate repair request body', async () => {
      mockDbUtils.getUserWithSmartLookup.mockResolvedValue({
        user: {
          _id: 'user_id',
          userName: 'test_user'
        },
        userType: 'onairos'
      });

      mockDbUtils.getUserConnections.mockReturnValue({});

      const response = await request(app)
        .post('/validation/repair-connections/test_user')
        .send({
          platforms: 'invalid_format'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary.totalPlatforms).toBe(0);
    });
  });
}); 
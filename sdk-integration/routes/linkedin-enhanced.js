import express from 'express';
import { authenticateApiKey, smartAuth } from '../middleware/unifiedApiKeyAuth.js';
import { TokenManager } from '../utils/tokenManager.js';
import { ConnectionHealthMonitor } from '../utils/connectionHealth.js';
import { DatabaseUtils } from '../utils/databaseUtils.js';
import { oauthConfig } from '../config/oauth-config.js';
import { sdkConfig } from '../config/sdk-config.js';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { User } from '../../Mongoose/models.js';
import { getEnochModels } from '../../utils/enochDb.js';

const router = express.Router();
const tokenManager = new TokenManager();
const healthMonitor = new ConnectionHealthMonitor();
const dbUtils = new DatabaseUtils();

/**
 * Enhanced LinkedIn Native Authentication
 * 
 * This endpoint handles LinkedIn OAuth authentication with:
 * - Smart dual authentication (API key + JWT or JWT only)
 * - Cross-database user support (Enoch and Onairos)
 * - Connection health monitoring
 * - Automatic token management
 * - Comprehensive error handling
 * 
 * Authentication patterns:
 * 1. API key + User JWT: Headers: x-api-key + authorization
 * 2. User JWT only: Headers: authorization (for Enoch users)
 * 3. API key + User in body: Headers: x-api-key, Body: authToken
 */
router.post('/native-auth', smartAuth, async (req, res) => {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  console.log(`\n🔥 [LINKEDIN-ENHANCED-${requestId}] Starting LinkedIn native authentication`);
  
  try {
    const { 
      accessToken, 
      refreshToken, 
      idToken,
      userAccountInfo,
      session,
      ...additionalData 
    } = req.body;
    
    console.log(`🔍 [LINKEDIN-ENHANCED-${requestId}] Request data:`, {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasIdToken: !!idToken,
      hasUserAccountInfo: !!userAccountInfo,
      hasSession: !!session,
      additionalKeys: Object.keys(additionalData)
    });

    // Validate required fields
    if (!accessToken) {
      console.error(`❌ [LINKEDIN-ENHANCED-${requestId}] Missing access token`);
      return res.status(400).json({
        success: false,
        error: 'Missing access token',
        code: 'MISSING_ACCESS_TOKEN',
        requestId: requestId,
        guidance: 'LinkedIn access token is required for authentication'
      });
    }

    if (!userAccountInfo || !userAccountInfo.username) {
      console.error(`❌ [LINKEDIN-ENHANCED-${requestId}] Missing user account info`);
      return res.status(400).json({
        success: false,
        error: 'Missing user account information',
        code: 'MISSING_USER_INFO',
        requestId: requestId,
        guidance: 'userAccountInfo with username is required'
      });
    }

    const username = userAccountInfo.username;
    console.log(`🔍 [LINKEDIN-ENHANCED-${requestId}] Processing for user: ${username}`);

    // Get user from database with smart lookup
    const { user, userType } = await dbUtils.getUserWithSmartLookup(username);
    
    if (!user) {
      console.error(`❌ [LINKEDIN-ENHANCED-${requestId}] User not found: ${username}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        requestId: requestId,
        guidance: `User with identifier '${username}' not found in either database`
      });
    }

    console.log(`✅ [LINKEDIN-ENHANCED-${requestId}] Found user in ${userType} database`);

    // Validate LinkedIn access token
    console.log(`🔍 [LINKEDIN-ENHANCED-${requestId}] Validating LinkedIn access token`);
    
    let linkedinProfile;
    try {
      const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'cache-control': 'no-cache',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error(`❌ [LINKEDIN-ENHANCED-${requestId}] LinkedIn API error: ${profileResponse.status} - ${errorText}`);
        
        return res.status(401).json({
          success: false,
          error: 'Invalid LinkedIn access token',
          code: 'INVALID_ACCESS_TOKEN',
          requestId: requestId,
          guidance: 'The provided LinkedIn access token is invalid or expired'
        });
      }

      linkedinProfile = await profileResponse.json();
      console.log(`✅ [LINKEDIN-ENHANCED-${requestId}] Valid LinkedIn profile retrieved`);
      
    } catch (error) {
      console.error(`❌ [LINKEDIN-ENHANCED-${requestId}] Error validating LinkedIn token:`, error);
      return res.status(500).json({
        success: false,
        error: 'Failed to validate LinkedIn access token',
        code: 'TOKEN_VALIDATION_ERROR',
        requestId: requestId,
        guidance: 'Unable to validate the LinkedIn access token with LinkedIn API'
      });
    }

    // Extract LinkedIn user information
    const linkedinUserName = linkedinProfile.localizedFirstName && linkedinProfile.localizedLastName 
      ? `${linkedinProfile.localizedFirstName} ${linkedinProfile.localizedLastName}`
      : linkedinProfile.id;

    console.log(`🔍 [LINKEDIN-ENHANCED-${requestId}] LinkedIn user info:`, {
      id: linkedinProfile.id,
      name: linkedinUserName,
      firstName: linkedinProfile.localizedFirstName,
      lastName: linkedinProfile.localizedLastName
    });

    // Prepare refresh token
    let finalRefreshToken = refreshToken;
    
    // Check for refresh token in multiple sources
    const refreshTokenSources = [
      { name: 'refreshToken', value: refreshToken },
      { name: 'req.body.refresh_token', value: req.body.refresh_token },
      { name: 'userAccountInfo.refreshToken', value: userAccountInfo?.refreshToken },
      { name: 'session.refreshToken', value: session?.refreshToken }
    ];
    
    console.log('🔍 [LINKEDIN-REFRESH-TOKEN-DEBUG] Checking all possible sources:');
    refreshTokenSources.forEach(source => {
      if (source.value && typeof source.value === 'string' && source.value.trim().length > 0) {
        console.log(`✅ [LINKEDIN-REFRESH-TOKEN-DEBUG] ${source.name}: ${source.value.substring(0, 20)}... (length: ${source.value.length})`);
      } else {
        console.log(`❌ [LINKEDIN-REFRESH-TOKEN-DEBUG] ${source.name}: ${source.value || 'Missing/Null'}`);
      }
    });

    // Find the first non-null refresh token
    let extractionSource = null;
    for (const source of refreshTokenSources) {
      if (source.value && typeof source.value === 'string' && source.value.trim().length > 0) {
        finalRefreshToken = source.value.trim();
        extractionSource = source.name;
        console.log(`✅ [LINKEDIN-REFRESH-TOKEN-DEBUG] EXTRACTED from ${source.name}: ${finalRefreshToken.substring(0, 20)}...`);
        break;
      }
    }

    if (!finalRefreshToken) {
      console.warn(`⚠️ [LINKEDIN-ENHANCED-${requestId}] No refresh token found - user will need to reconnect when token expires`);
    }

    // Calculate token expiry (LinkedIn tokens typically expire in 60 days)
    const tokenExpiryTime = new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)); // 60 days from now
    
    // Update user's LinkedIn connection
    const connectionData = {
      accessToken: accessToken,
      refreshToken: finalRefreshToken,
      tokenExpiry: tokenExpiryTime,
      userName: linkedinUserName,
      profileId: linkedinProfile.id,
      connectedAt: new Date(),
      hasRefreshToken: !!finalRefreshToken
    };

    console.log(`🔄 [LINKEDIN-ENHANCED-${requestId}] Updating user connection data`);
    
    const updateSuccess = await dbUtils.updateUserConnection(user, userType, 'linkedin', connectionData);
    
    if (!updateSuccess) {
      console.error(`❌ [LINKEDIN-ENHANCED-${requestId}] Failed to update user connection`);
      return res.status(500).json({
        success: false,
        error: 'Failed to update LinkedIn connection',
        code: 'UPDATE_FAILED',
        requestId: requestId,
        guidance: 'Unable to save LinkedIn connection data to database'
      });
    }

    // Check connection health
    console.log(`🔍 [LINKEDIN-ENHANCED-${requestId}] Checking connection health`);
    const connectionHealth = await healthMonitor.checkConnectionHealth(username, 'linkedin');
    
    // Prepare response
    const response = {
      success: true,
      message: 'LinkedIn connection established successfully',
      requestId: requestId,
      userType: userType,
      connectionData: {
        platform: 'linkedin',
        userName: linkedinUserName,
        profileId: linkedinProfile.id,
        connectedAt: new Date(),
        hasRefreshToken: !!finalRefreshToken,
        tokenExpiry: tokenExpiryTime
      },
      connectionHealth: connectionHealth,
      recommendations: []
    };

    // Add recommendations based on connection health
    if (!finalRefreshToken) {
      response.recommendations.push({
        type: 'refresh_token_warning',
        message: 'No refresh token received - user will need to reconnect when token expires',
        severity: 'warning',
        actionRequired: false
      });
    }

    if (connectionHealth.status === 'healthy') {
      response.recommendations.push({
        type: 'connection_healthy',
        message: 'LinkedIn connection is healthy and ready for use',
        severity: 'info',
        actionRequired: false
      });
    }

    console.log(`✅ [LINKEDIN-ENHANCED-${requestId}] LinkedIn authentication completed successfully`);
    console.log(`📊 [LINKEDIN-ENHANCED-${requestId}] Response summary:`, {
      success: true,
      userType: userType,
      hasRefreshToken: !!finalRefreshToken,
      connectionHealth: connectionHealth.status,
      recommendationCount: response.recommendations.length
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error(`❌ [LINKEDIN-ENHANCED-${requestId}] Unexpected error:`, error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during LinkedIn authentication',
      code: 'INTERNAL_ERROR',
      requestId: requestId,
      guidance: 'An unexpected error occurred. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * LinkedIn Connection Status Check
 * 
 * Get real-time connection health status for a user's LinkedIn connection
 */
router.get('/connection-status/:username', authenticateApiKey, async (req, res) => {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  const { username } = req.params;

  console.log(`\n🔍 [LINKEDIN-STATUS-${requestId}] Checking LinkedIn connection status for: ${username}`);

  try {
    // Get user from database
    const { user, userType } = await dbUtils.getUserWithSmartLookup(username);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        requestId: requestId
      });
    }

    // Check connection health
    const connectionHealth = await healthMonitor.checkConnectionHealth(username, 'linkedin');
    
    // Get connection details
    const connectionData = dbUtils.getUserConnections(user, userType);
    const linkedinConnection = connectionData.linkedin || {};

    const response = {
      success: true,
      requestId: requestId,
      platform: 'linkedin',
      username: username,
      userType: userType,
      connectionHealth: connectionHealth,
      connectionDetails: {
        connected: !!linkedinConnection.accessToken,
        userName: linkedinConnection.userName,
        profileId: linkedinConnection.profileId,
        connectedAt: linkedinConnection.connectedAt,
        lastValidated: linkedinConnection.lastValidated,
        hasRefreshToken: !!linkedinConnection.refreshToken,
        tokenExpiry: linkedinConnection.tokenExpiry
      },
      recommendations: []
    };

    // Add recommendations based on health
    if (connectionHealth.needsReauth) {
      response.recommendations.push({
        type: 'reauth_required',
        message: 'LinkedIn connection requires re-authentication',
        severity: 'error',
        actionRequired: true,
        action: 'reconnect'
      });
    }

    if (connectionHealth.status === 'expired_refreshable') {
      response.recommendations.push({
        type: 'token_refresh_available',
        message: 'Token is expired but can be refreshed automatically',
        severity: 'warning',
        actionRequired: false,
        action: 'auto_refresh'
      });
    }

    console.log(`✅ [LINKEDIN-STATUS-${requestId}] Status check completed:`, {
      connected: response.connectionDetails.connected,
      health: connectionHealth.status,
      needsReauth: connectionHealth.needsReauth
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error(`❌ [LINKEDIN-STATUS-${requestId}] Error checking connection status:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check LinkedIn connection status',
      code: 'STATUS_CHECK_ERROR',
      requestId: requestId,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * LinkedIn Token Refresh
 * 
 * Refresh LinkedIn access token using refresh token
 */
router.post('/refresh-token', authenticateApiKey, async (req, res) => {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  const { username } = req.body;

  console.log(`\n🔄 [LINKEDIN-REFRESH-${requestId}] Starting token refresh for: ${username}`);

  try {
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required',
        code: 'MISSING_USERNAME',
        requestId: requestId
      });
    }

    // Get user from database
    const { user, userType } = await dbUtils.getUserWithSmartLookup(username);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        requestId: requestId
      });
    }

    // Get LinkedIn connection data
    const connectionData = dbUtils.getUserConnections(user, userType);
    const linkedinConnection = connectionData.linkedin || {};

    if (!linkedinConnection.accessToken) {
      return res.status(404).json({
        success: false,
        error: 'LinkedIn connection not found',
        code: 'CONNECTION_NOT_FOUND',
        requestId: requestId
      });
    }

    if (!linkedinConnection.refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'No refresh token available',
        code: 'NO_REFRESH_TOKEN',
        requestId: requestId,
        guidance: 'User needs to reconnect their LinkedIn account to get a new refresh token'
      });
    }

    // Attempt to refresh token
    console.log(`🔄 [LINKEDIN-REFRESH-${requestId}] Attempting token refresh`);
    
    const refreshResult = await tokenManager.refreshAccessToken('linkedin', username);
    
    if (!refreshResult || !refreshResult.access_token) {
      console.error(`❌ [LINKEDIN-REFRESH-${requestId}] Token refresh failed`);
      return res.status(500).json({
        success: false,
        error: 'Token refresh failed',
        code: 'REFRESH_FAILED',
        requestId: requestId,
        guidance: 'Unable to refresh LinkedIn token. User may need to reconnect.'
      });
    }

    // Update user with new token
    const newTokenExpiry = new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)); // 60 days
    
    const updateSuccess = await dbUtils.updateUserConnection(user, userType, 'linkedin', {
      accessToken: refreshResult.access_token,
      tokenExpiry: newTokenExpiry
    });

    if (!updateSuccess) {
      console.error(`❌ [LINKEDIN-REFRESH-${requestId}] Failed to update user with new token`);
      return res.status(500).json({
        success: false,
        error: 'Failed to update user with new token',
        code: 'UPDATE_FAILED',
        requestId: requestId
      });
    }

    console.log(`✅ [LINKEDIN-REFRESH-${requestId}] Token refresh completed successfully`);

    return res.status(200).json({
      success: true,
      message: 'LinkedIn token refreshed successfully',
      requestId: requestId,
      refreshedAt: new Date(),
      newTokenExpiry: newTokenExpiry
    });

  } catch (error) {
    console.error(`❌ [LINKEDIN-REFRESH-${requestId}] Error refreshing token:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh LinkedIn token',
      code: 'REFRESH_ERROR',
      requestId: requestId,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * LinkedIn Connection Validation
 * 
 * Validate LinkedIn connection and provide migration recommendations
 */
router.post('/validate-connection/:username', authenticateApiKey, async (req, res) => {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  const { username } = req.params;

  console.log(`\n🔍 [LINKEDIN-VALIDATE-${requestId}] Validating LinkedIn connection for: ${username}`);

  try {
    // Get user from database
    const { user, userType } = await dbUtils.getUserWithSmartLookup(username);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        requestId: requestId
      });
    }

    // Get connection details
    const connectionData = dbUtils.getUserConnections(user, userType);
    const linkedinConnection = connectionData.linkedin || {};

    // Check connection health
    const connectionHealth = await healthMonitor.checkConnectionHealth(username, 'linkedin');

    // Validate current token
    let tokenValidation = {
      isValid: false,
      isExpired: false,
      canRefresh: false,
      error: null
    };

    if (linkedinConnection.accessToken) {
      try {
        const testResponse = await fetch('https://api.linkedin.com/v2/me', {
          headers: {
            'Authorization': `Bearer ${linkedinConnection.accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        });

        tokenValidation.isValid = testResponse.ok;
        tokenValidation.isExpired = testResponse.status === 401;
        tokenValidation.canRefresh = !!linkedinConnection.refreshToken;

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          tokenValidation.error = `API call failed: ${testResponse.status} - ${errorText}`;
        }
      } catch (error) {
        tokenValidation.error = error.message;
      }
    }

    // Generate recommendations
    const recommendations = [];
    
    if (!linkedinConnection.accessToken) {
      recommendations.push({
        type: 'no_connection',
        message: 'No LinkedIn connection found',
        severity: 'error',
        actionRequired: true,
        action: 'connect'
      });
    } else if (tokenValidation.isExpired && tokenValidation.canRefresh) {
      recommendations.push({
        type: 'token_refresh_needed',
        message: 'Token is expired but can be refreshed',
        severity: 'warning',
        actionRequired: false,
        action: 'auto_refresh'
      });
    } else if (tokenValidation.isExpired && !tokenValidation.canRefresh) {
      recommendations.push({
        type: 'reconnection_required',
        message: 'Token is expired and no refresh token available',
        severity: 'error',
        actionRequired: true,
        action: 'reconnect'
      });
    } else if (!linkedinConnection.refreshToken) {
      recommendations.push({
        type: 'missing_refresh_token',
        message: 'Connection works but no refresh token - upgrade recommended',
        severity: 'warning',
        actionRequired: false,
        action: 'upgrade_connection'
      });
    }

    if (tokenValidation.isValid && linkedinConnection.refreshToken) {
      recommendations.push({
        type: 'connection_healthy',
        message: 'LinkedIn connection is healthy and future-proof',
        severity: 'info',
        actionRequired: false
      });
    }

    const response = {
      success: true,
      requestId: requestId,
      platform: 'linkedin',
      username: username,
      userType: userType,
      connectionHealth: connectionHealth,
      tokenValidation: tokenValidation,
      connectionDetails: {
        connected: !!linkedinConnection.accessToken,
        userName: linkedinConnection.userName,
        profileId: linkedinConnection.profileId,
        connectedAt: linkedinConnection.connectedAt,
        lastValidated: linkedinConnection.lastValidated,
        hasRefreshToken: !!linkedinConnection.refreshToken,
        tokenExpiry: linkedinConnection.tokenExpiry
      },
      recommendations: recommendations
    };

    console.log(`✅ [LINKEDIN-VALIDATE-${requestId}] Validation completed:`, {
      connected: response.connectionDetails.connected,
      tokenValid: tokenValidation.isValid,
      canRefresh: tokenValidation.canRefresh,
      recommendationCount: recommendations.length
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error(`❌ [LINKEDIN-VALIDATE-${requestId}] Error validating connection:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate LinkedIn connection',
      code: 'VALIDATION_ERROR',
      requestId: requestId,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * LinkedIn Test Authentication
 * 
 * Test endpoint for verifying authentication configuration
 */
router.post('/test-auth', authenticateApiKey, async (req, res) => {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  
  console.log(`\n🧪 [LINKEDIN-TEST-${requestId}] Testing LinkedIn authentication`);

  try {
    const authResult = {
      success: true,
      message: 'LinkedIn authentication test passed',
      requestId: requestId,
      timestamp: new Date(),
      authMethod: req.authMethod,
      userInfo: req.userInfo ? {
        userId: req.userInfo.userId,
        userType: req.userInfo.userType
      } : null,
      apiKeyInfo: req.apiKeyInfo ? {
        keyId: req.apiKeyInfo.keyId,
        permissions: req.apiKeyInfo.permissions
      } : null,
      configuration: {
        platform: 'linkedin',
        enabled: sdkConfig.platforms.linkedin.enabled,
        requiredScopes: sdkConfig.platforms.linkedin.requiredScopes,
        features: sdkConfig.platforms.linkedin.features
      }
    };

    console.log(`✅ [LINKEDIN-TEST-${requestId}] Authentication test completed successfully`);
    return res.status(200).json(authResult);

  } catch (error) {
    console.error(`❌ [LINKEDIN-TEST-${requestId}] Authentication test failed:`, error);
    return res.status(500).json({
      success: false,
      error: 'Authentication test failed',
      code: 'TEST_FAILED',
      requestId: requestId,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router; 
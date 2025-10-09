import express from 'express';
import { authenticateApiKey } from '../middleware/unifiedApiKeyAuth.js';
import { TokenManager } from '../utils/tokenManager.js';
import { DatabaseUtils } from '../utils/databaseUtils.js';

const router = express.Router();
const tokenManager = new TokenManager();
const dbUtils = new DatabaseUtils();

/**
 * Standardized API Key Validation Endpoint
 * POST /auth/validate-key
 * 
 * Implements the standardized validation as per SDK_API_KEY_VALIDATION.md
 */
router.post('/validate-key', async (req, res) => {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  
  try {
    console.log(`🔍 [${requestId}] API key validation request started`);
    
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization;
    const apiKey = authHeader?.replace('Bearer ', '') || req.headers['x-api-key'] || req.query.apikey;
    
    if (!apiKey) {
      console.log(`❌ [${requestId}] No API key provided`);
      return res.status(401).json({
        success: false,
        error: 'API key required',
        message: 'Provide API key in Authorization header as Bearer token',
        code: 'MISSING_API_KEY',
        keyType: 'invalid'
      });
    }

    // Validate API key format
    const isValidFormat = apiKey.length >= 32 && (
      apiKey.startsWith('ona_') || 
      apiKey.startsWith('dev_') || 
      apiKey.startsWith('pk_')
    );
    
    const isAdminKey = apiKey === 'OnairosIsAUnicorn2025';
    
    if (!isValidFormat && !isAdminKey) {
      console.log(`❌ [${requestId}] Invalid API key format`);
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format',
        message: 'Developer keys must be at least 32 characters and start with \'dev_\', \'pk_\', or \'ona_\'',
        code: 'INVALID_API_KEY_FORMAT',
        keyType: 'invalid'
      });
    }

    // Handle admin key
    if (isAdminKey) {
      console.log(`✅ [${requestId}] Admin API key validated`);
      return res.json({
        success: true,
        permissions: ['*'],
        rateLimits: {
          remaining: 999999,
          resetTime: Date.now() + 24 * 60 * 60 * 1000
        },
        keyType: 'admin',
        developer: {
          id: 'admin',
          name: 'Admin User',
          plan: 'admin'
        },
        apiKey: {
          id: 'admin_key',
          name: 'Admin Key',
          context: req.body.environment || 'production',
          totalRequests: 0
        }
      });
    }

    // For developer keys, use existing authentication middleware
    // Temporarily store original request data
    const originalBody = req.body;
    const originalHeaders = req.headers;
    
    // Set up request for middleware
    req.headers['x-api-key'] = apiKey;
    
    // Use existing authentication middleware
    await new Promise((resolve, reject) => {
      authenticateApiKey(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // If we get here, authentication was successful
    console.log(`✅ [${requestId}] Developer API key validated successfully`);
    
    // Extract information from middleware results
    const keyRecord = req.apiKey;
    const user = req.user;
    const rateLimits = req.rateLimits;

    // Return standardized response
    res.json({
      success: true,
      permissions: keyRecord.permissions || ['data:read', 'data:write'],
      rateLimits: {
        remaining: rateLimits.remaining || 100,
        resetTime: rateLimits.reset?.getTime() || (Date.now() + 15 * 60 * 1000)
      },
      keyType: 'developer',
      developer: {
        id: user.id || user.userName,
        name: user.userName || user.name,
        plan: user.plan || 'free'
      },
      apiKey: {
        id: keyRecord.id,
        name: keyRecord.name || 'Developer Key',
        context: originalBody.environment || 'production',
        totalRequests: keyRecord.usageCount || 0
      }
    });

  } catch (error) {
    console.error(`❌ [${requestId}] API key validation error:`, error);
    
    // Handle specific authentication errors
    if (error.message?.includes('API key not found')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: 'API key not found or has been revoked',
        code: 'INVALID_API_KEY',
        keyType: 'invalid'
      });
    }
    
    if (error.message?.includes('API key inactive')) {
      return res.status(401).json({
        success: false,
        error: 'API key inactive',
        message: 'This API key has been deactivated',
        code: 'API_KEY_INACTIVE',
        keyType: 'invalid'
      });
    }
    
    if (error.message?.includes('API key expired')) {
      return res.status(401).json({
        success: false,
        error: 'API key expired',
        message: 'API key has expired',
        code: 'API_KEY_EXPIRED',
        keyType: 'invalid'
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Error during API key validation',
      code: 'INTERNAL_ERROR',
      keyType: 'invalid'
    });
  }
});

/**
 * Simple GET validation endpoint for backward compatibility
 * GET /auth/validate-key?key=API_KEY
 */
router.get('/validate-key', async (req, res) => {
  const apiKey = req.query.key;
  
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      error: 'API key required',
      message: 'Provide API key as query parameter: ?key=your_api_key',
      code: 'MISSING_API_KEY'
    });
  }

  // Redirect to POST endpoint by setting up request
  req.headers.authorization = `Bearer ${apiKey}`;
  req.body = {
    environment: 'production',
    platform: 'web'
  };

  // Call the POST handler
  return router.handle(
    { ...req, method: 'POST', url: '/validate-key' },
    res
  );
});

/**
 * Health check endpoint
 * GET /auth/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth validation service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;

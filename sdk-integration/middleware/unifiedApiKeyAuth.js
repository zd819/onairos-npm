import jwt from 'jsonwebtoken';
import { User } from '../../Mongoose/models.js';
import { getEnochModels } from '../../utils/enochDb.js';
import { developerDb } from '../../utils/developerDb.js';
import rateLimit from 'express-rate-limit';

// Enhanced rate limiting per developer account
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // requests per window
    keyGenerator: (req) => {
      // Use API key for rate limiting if available
      if (req.apiKey) {
        return `apikey:${req.apiKey.id}`;
      }
      // Fallback to IP-based rate limiting
      return `ip:${req.ip}`;
    },
    message: {
      success: false,
      error: 'Too many requests',
      details: 'Rate limit exceeded for this API key',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(options.windowMs / 1000),
      suggestions: [
        'Wait before making more requests',
        'Consider upgrading your API key limits',
        'Implement exponential backoff in your client'
      ]
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.error(`🚨 Rate limit exceeded for API key: ${req.apiKey?.name || 'Unknown'}`);
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        details: `Too many requests for API key: ${req.apiKey?.name || 'Unknown'}`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(options.windowMs / 1000),
        rateLimits: {
          windowMs: options.windowMs,
          max: options.max,
          remaining: 0,
          reset: new Date(Date.now() + options.windowMs)
        }
      });
    }
  });
};

// Default rate limiter for API keys
export const defaultRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
});

// Strict rate limiter for sensitive operations
export const strictRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20 // requests per window
});

// API key authentication middleware
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apikey;
    
    if (!apiKey) {
      console.log('🔍 [AUTH] No API key provided');
      return res.status(401).json({
        success: false,
        error: 'API key required',
        details: 'Include x-api-key header or apikey query parameter',
        code: 'MISSING_API_KEY',
        suggestions: [
          'Add x-api-key header with your developer API key',
          'Format: x-api-key: ona_your_api_key',
          'Get API key from developer portal'
        ]
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
      console.error('❌ [AUTH] Invalid API key format:', apiKey.substring(0, 10) + '...');
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format',
        details: 'API key must be at least 32 characters and start with ona_, dev_, or pk_',
        code: 'INVALID_API_KEY_FORMAT',
        suggestions: [
          'Check your API key format',
          'Ensure it starts with ona_, dev_, or pk_',
          'Generate a new API key if needed'
        ]
      });
    }

    // Handle admin key
    if (isAdminKey) {
      console.log('🔑 [AUTH] Admin API key used');
      req.apiKey = {
        id: 'admin',
        name: 'Admin Key',
        permissions: ['*'],
        isAdmin: true,
        lastUsed: new Date(),
        usageCount: 0
      };
      req.user = {
        userName: 'Admin',
        email: 'admin@onairos.uk',
        isAdmin: true
      };
      req.rateLimits = {
        windowMs: 60000,
        max: 1000,
        remaining: 999,
        reset: new Date(Date.now() + 60000)
      };
      return next();
    }

    // Look up API key in developer database
    const keyRecord = await developerDb.findApiKey(apiKey);
    
    if (!keyRecord) {
      console.error('❌ [AUTH] API key not found in database');
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        details: 'API key not found or has been revoked',
        code: 'INVALID_API_KEY',
        suggestions: [
          'Verify your API key is correct',
          'Check if the API key has been revoked',
          'Generate a new API key if needed'
        ]
      });
    }

    // Check if API key is active
    if (!keyRecord.isActive) {
      console.error('❌ [AUTH] API key is inactive');
      return res.status(401).json({
        success: false,
        error: 'API key inactive',
        details: 'This API key has been deactivated',
        code: 'API_KEY_INACTIVE',
        suggestions: [
          'Contact support to reactivate your API key',
          'Generate a new API key'
        ]
      });
    }

    // Check expiry
    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      console.error('❌ [AUTH] API key expired');
      return res.status(401).json({
        success: false,
        error: 'API key expired',
        details: `API key expired on ${keyRecord.expiresAt.toISOString()}`,
        code: 'API_KEY_EXPIRED',
        suggestions: [
          'Generate a new API key',
          'Check your API key expiry settings'
        ]
      });
    }

    // Update usage statistics
    await developerDb.updateApiKeyUsage(apiKey);

    // Attach API key info to request
    req.apiKey = keyRecord;
    req.user = keyRecord.user;
    req.rateLimits = {
      windowMs: keyRecord.rateLimits?.windowMs || 15 * 60 * 1000,
      max: keyRecord.rateLimits?.max || 100,
      remaining: keyRecord.rateLimits?.remaining || 99,
      reset: new Date(Date.now() + (keyRecord.rateLimits?.windowMs || 15 * 60 * 1000))
    };

    console.log('✅ [AUTH] API key authenticated:', {
      keyName: keyRecord.name,
      user: keyRecord.user.userName,
      permissions: keyRecord.permissions?.length || 0
    });

    next();
  } catch (error) {
    console.error('❌ [AUTH] API key authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      details: 'Internal server error during API key validation',
      code: 'AUTH_ERROR'
    });
  }
};

// Permission checking middleware
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required for permission check',
        code: 'MISSING_API_KEY'
      });
    }

    // Admin keys have all permissions
    if (req.apiKey.isAdmin) {
      return next();
    }

    // Check if API key has the required permission
    const hasPermission = req.apiKey.permissions.includes(permission) || 
                         req.apiKey.permissions.includes('*');

    if (!hasPermission) {
      console.error(`❌ [AUTH] Permission denied: ${permission} for API key: ${req.apiKey.name}`);
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: `API key lacks required permission: ${permission}`,
        code: 'PERMISSION_DENIED',
        required: permission,
        available: req.apiKey.permissions,
        suggestions: [
          'Request permission upgrade for your API key',
          'Contact support to add required permissions',
          'Use a different API key with appropriate permissions'
        ]
      });
    }

    console.log(`✅ [AUTH] Permission granted: ${permission} for API key: ${req.apiKey.name}`);
    next();
  };
};

// User JWT authentication middleware
export const authenticateUserJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.body.userToken || req.body.authToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'User JWT token required',
        details: 'Include Authorization header with Bearer token',
        code: 'MISSING_USER_TOKEN',
        suggestions: [
          'Add Authorization header with JWT token',
          'Format: Authorization: Bearer your_jwt_token',
          'Ensure user is logged in'
        ]
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.ONAIROS_JWT_SECRET_KEY);
    
    // Determine user type and ID
    const userId = decoded.id || decoded.userId || decoded.sub;
    const userEmail = decoded.email;
    const username = decoded.username;
    const isEnochUser = decoded.id && !decoded.userId; // Enoch tokens have 'id', Onairos have 'userId'

    // Find user in appropriate database
    let user = null;
    if (isEnochUser) {
      try {
        const { EnochUser } = getEnochModels();
        user = await EnochUser.findById(userId);
      } catch (enochError) {
        console.warn('⚠️ [AUTH] Enoch database query failed:', enochError.message);
      }
    }

    // Fallback to Onairos database
    if (!user) {
      user = await User.findById(userId);
      if (!user && username) {
        user = await User.findOne({ userName: username });
      }
      if (!user && userEmail) {
        user = await User.findOne({ email: userEmail });
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        details: 'JWT token is valid but user not found in database',
        code: 'USER_NOT_FOUND',
        suggestions: [
          'Verify user account exists',
          'Check if user has been deleted',
          'Ensure JWT token is for correct environment'
        ]
      });
    }

    // Attach user info to request
    req.userJWT = {
      id: userId,
      email: userEmail,
      username: username,
      isEnochUser: isEnochUser,
      tokenType: isEnochUser ? 'Enoch' : 'Onairos',
      decoded: decoded
    };
    req.authenticatedUser = user;

    console.log('✅ [AUTH] User JWT authenticated:', {
      userId,
      email: userEmail,
      tokenType: isEnochUser ? 'Enoch' : 'Onairos'
    });

    next();
  } catch (jwtError) {
    console.error('❌ [AUTH] JWT authentication error:', jwtError.message);
    
    let errorCode = 'INVALID_JWT';
    let errorMessage = 'Invalid JWT token';
    
    if (jwtError.name === 'TokenExpiredError') {
      errorCode = 'JWT_EXPIRED';
      errorMessage = 'JWT token has expired';
    } else if (jwtError.name === 'JsonWebTokenError') {
      errorCode = 'MALFORMED_JWT';
      errorMessage = 'Malformed JWT token';
    }

    return res.status(401).json({
      success: false,
      error: errorMessage,
      details: jwtError.message,
      code: errorCode,
      suggestions: [
        'Verify JWT token format',
        'Check if token has expired',
        'Ensure correct signing key is used'
      ]
    });
  }
};

// Combined authentication middleware (API key + optional user JWT)
export const combinedAuth = async (req, res, next) => {
  try {
    // Step 1: Authenticate API key first
    await new Promise((resolve, reject) => {
      authenticateApiKey(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Step 2: Try to authenticate user JWT (optional)
    const authHeader = req.headers.authorization;
    const userToken = authHeader?.replace('Bearer ', '') || req.body.userToken || req.body.authToken;

    if (userToken) {
      try {
        await new Promise((resolve, reject) => {
          authenticateUserJWT(req, res, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
        req.hasUserContext = true;
      } catch (userError) {
        console.warn('⚠️ [AUTH] User JWT authentication failed, continuing with API key only');
        req.hasUserContext = false;
      }
    } else {
      req.hasUserContext = false;
    }

    req.authMethod = 'combined';
    console.log('✅ [AUTH] Combined authentication complete:', {
      apiKeyValid: true,
      userContextAvailable: req.hasUserContext
    });

    next();
  } catch (error) {
    console.error('❌ [AUTH] Combined authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      details: error.message,
      code: 'COMBINED_AUTH_ERROR'
    });
  }
};

// Smart authentication middleware (User JWT OR API key + User JWT)
export const smartAuth = async (req, res, next) => {
  try {
    console.log('🔍 [AUTH] Smart authentication check...');
    
    // Extract tokens
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] || req.query.apikey;
    const userToken = authHeader?.replace('Bearer ', '') || req.body.userToken || req.body.authToken;
    
    console.log('🔑 Auth Components:', {
      apiKey: apiKey ? 'Present' : 'Missing',
      userToken: userToken ? 'Present' : 'Missing'
    });

    // Step 1: Try user-only authentication (for Enoch users)
    if (userToken) {
      try {
        await new Promise((resolve, reject) => {
          authenticateUserJWT(req, res, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });

        // If user is Enoch user, allow without API key
        if (req.userJWT.isEnochUser) {
          req.authMethod = 'user-only';
          req.hasUserContext = true;
          req.user = {
            userName: req.userJWT.username || req.userJWT.email,
            email: req.userJWT.email,
            isEnochUser: true
          };
          
          console.log('✅ [AUTH] User-only authentication (Enoch user)');
          return next();
        }
      } catch (userError) {
        console.warn('⚠️ [AUTH] User JWT validation failed:', userError.message);
      }
    }

    // Step 2: Require API key for non-Enoch users
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
        details: userToken ? 
          'Invalid user token - API key required for developer SDK routes' :
          'Either provide a valid Enoch user token OR a developer API key',
        code: 'MISSING_API_KEY',
        suggestions: [
          'Option 1: Add x-api-key header with your developer API key',
          'Option 2: Provide a valid Enoch user JWT token in Authorization header',
          'Get API key from developer portal'
        ]
      });
    }

    // Step 3: Authenticate API key
    await new Promise((resolve, reject) => {
      authenticateApiKey(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Step 4: Optional user context
    if (userToken && req.userJWT) {
      req.hasUserContext = true;
    } else {
      req.hasUserContext = false;
    }

    req.authMethod = 'dual';
    console.log('✅ [AUTH] Dual authentication complete');

    next();
  } catch (error) {
    console.error('❌ [AUTH] Smart authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      details: error.message,
      code: 'SMART_AUTH_ERROR'
    });
  }
};

export default {
  authenticateApiKey,
  requirePermission,
  authenticateUserJWT,
  combinedAuth,
  smartAuth,
  defaultRateLimiter,
  strictRateLimiter
}; 
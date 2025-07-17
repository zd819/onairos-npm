import jwt from 'jsonwebtoken';
import { authenticateApiKey, requirePermission } from './unifiedApiKeyAuth.js';

// Smart authentication middleware specifically for YouTube endpoints
// Supports: User JWT OR API key + User JWT
export const youtubeAuthMiddleware = async (req, res, next) => {
  try {
    console.log('🔍 [YOUTUBE-AUTH] Smart authentication check...');
    
    // Step 1: Extract API key and user JWT token
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] || req.query.apikey;
    const userToken = authHeader?.replace('Bearer ', '') || req.body.userToken || req.body.authToken;
    
    console.log('🔑 Auth Components:');
    console.log('  - API Key (x-api-key):', apiKey ? `Present (${apiKey.substring(0, 10)}...)` : 'Missing');
    console.log('  - User JWT (Authorization):', userToken ? `Present (${userToken.substring(0, 10)}...)` : 'Missing');
    
    // Step 2: Validate user JWT token first (for all users)
    let userAuth = null;
    let canProceedWithUserOnly = false;
    
    if (userToken) {
      try {
        const decoded = jwt.verify(userToken, process.env.ONAIROS_JWT_SECRET_KEY);
        
        userAuth = {
          id: decoded.id || decoded.userId || decoded.sub,
          email: decoded.email,
          username: decoded.username,
          isEnochUser: decoded.id && !decoded.userId, // Enoch tokens have 'id', Onairos have 'userId'
          tokenType: decoded.id && !decoded.userId ? 'Enoch' : 'Onairos'
        };
        
        console.log('✅ User JWT validated:', {
          userId: userAuth.id,
          email: userAuth.email,
          tokenType: userAuth.tokenType
        });
        
        // Allow Enoch users to proceed without API key
        if (userAuth.isEnochUser) {
          canProceedWithUserOnly = true;
          console.log('✅ Enoch user detected - proceeding with user-only authentication');
        }
        
      } catch (jwtError) {
        console.warn('⚠️ User JWT validation failed:', jwtError.message);
        userAuth = null;
      }
    }
    
    // Step 3: If user-only auth succeeded, skip API key requirement
    if (canProceedWithUserOnly && userAuth) {
      req.authMethod = 'user-only'; // User JWT only (Enoch users)
      req.userContext = userAuth;
      req.hasUserContext = true;
      req.user = { 
        userName: userAuth.username || userAuth.email,
        email: userAuth.email,
        isEnochUser: true
      };
      
      console.log('✅ User-only authentication complete for Enoch user:', {
        userId: userAuth.id,
        email: userAuth.email
      });
      
      return next();
    }
    
    // Step 4: Fall back to API key requirement (for developer SDK usage)
    if (!apiKey) {
      console.error('❌ API key missing (required for non-Enoch users or invalid user tokens)');
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
          'Get API key from developer portal',
          'Use format: x-api-key: ona_your_api_key'
        ]
      });
    }
    
    // Validate API key format and permissions
    const isValidApiKey = apiKey.length >= 32 && (apiKey.startsWith('ona_') || apiKey.startsWith('dev_') || apiKey.startsWith('pk_'));
    const isAdminKey = apiKey === 'OnairosIsAUnicorn2025';
    
    if (!isValidApiKey && !isAdminKey) {
      console.error('❌ Invalid API key format');
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format',
        details: 'API key must be at least 32 characters and start with ona_, dev_, or pk_',
        code: 'INVALID_API_KEY_FORMAT'
      });
    }
    
    console.log('✅ API key validation passed');
    
    // Step 5: Authenticate API key through existing middleware
    await new Promise((resolve, reject) => {
      authenticateApiKey(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    // Step 6: Check API key permissions
    await new Promise((resolve, reject) => {
      requirePermission('oauth:youtube')(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    console.log('✅ API key authentication and permissions passed');
    
    // Step 7: Use already-validated user JWT token (from Step 2)
    const userContext = userAuth; // Reuse already-validated token
    
    if (userContext) {
      console.log('✅ Using previously validated user JWT:', {
        userId: userContext.id,
        email: userContext.email,
        tokenType: userContext.tokenType
      });
    } else {
      console.log('ℹ️ No valid user JWT provided - proceeding without user context');
    }
    
    // Step 8: Attach both contexts to request
    req.authMethod = 'dual'; // API key + optional user context
    req.userContext = userContext;
    req.hasUserContext = !!userContext;
    
    console.log('✅ Dual authentication complete:', {
      apiKeyValid: true,
      userContextAvailable: req.hasUserContext,
      developerAccount: req.user.userName || req.user.email,
      userType: userContext ? userContext.tokenType : 'None'
    });
    
    next();
    
  } catch (error) {
    console.error('❌ [YOUTUBE-AUTH] Smart authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication middleware error',
      details: error.message,
      code: 'AUTH_MIDDLEWARE_ERROR'
    });
  }
};

// Basic authentication middleware for simple endpoints
export const basicYoutubeAuth = async (req, res, next) => {
  try {
    console.log('🔍 [YOUTUBE-AUTH] Basic authentication check...');
    
    // Check for API key
    const apiKey = req.headers['x-api-key'] || req.query.apikey;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
        details: 'Include x-api-key header with your developer API key',
        code: 'MISSING_API_KEY',
        suggestions: [
          'Add x-api-key header with your developer API key',
          'Format: x-api-key: ona_your_api_key',
          'Get API key from developer portal'
        ]
      });
    }
    
    // Authenticate API key
    await new Promise((resolve, reject) => {
      authenticateApiKey(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    // Check permissions
    await new Promise((resolve, reject) => {
      requirePermission('oauth:youtube')(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    req.authMethod = 'api-key-only';
    req.hasUserContext = false;
    
    console.log('✅ Basic authentication complete');
    next();
    
  } catch (error) {
    console.error('❌ [YOUTUBE-AUTH] Basic authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      details: error.message,
      code: 'BASIC_AUTH_ERROR'
    });
  }
};

// Test authentication middleware for debugging
export const testYoutubeAuth = async (req, res, next) => {
  try {
    console.log('🔍 [YOUTUBE-AUTH] Test authentication check...');
    
    // Use basic auth for test endpoints
    await basicYoutubeAuth(req, res, next);
    
  } catch (error) {
    console.error('❌ [YOUTUBE-AUTH] Test authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Test authentication error',
      details: error.message,
      code: 'TEST_AUTH_ERROR'
    });
  }
};

export default {
  youtubeAuthMiddleware,
  basicYoutubeAuth,
  testYoutubeAuth
}; 
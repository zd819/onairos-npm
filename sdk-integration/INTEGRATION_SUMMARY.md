# Web Onairos SDK Integration - Migration Summary

## 🎯 Overview

This document provides a comprehensive guide for migrating to the new Web Onairos SDK integration package. The enhanced SDK provides unified authentication, improved token management, connection health monitoring, and seamless integration with both Enoch and Onairos backends.

## 📋 Table of Contents

1. [Key Features](#key-features)
2. [Migration Steps](#migration-steps)
3. [Authentication Patterns](#authentication-patterns)
4. [API Changes](#api-changes)
5. [Configuration Setup](#configuration-setup)
6. [Frontend Integration](#frontend-integration)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)

## 🌟 Key Features

### Enhanced Authentication
- **Dual Authentication Support**: API key + User JWT or User JWT only (for Enoch users)
- **Smart Authentication Middleware**: Automatically detects authentication method
- **Cross-Database User Support**: Seamless integration with both Enoch and Onairos databases
- **Advanced Rate Limiting**: Per-developer account rate limiting with tier-based limits

### Connection Health Monitoring
- **Real-time Connection Status**: Live monitoring of OAuth connection health
- **Automatic Token Refresh**: Intelligent token renewal using refresh tokens
- **Connection Validation**: API-level validation of platform connections
- **Health Insights**: Comprehensive analytics and optimization suggestions

### Token Management
- **Unified Token Manager**: Centralized token handling across all platforms
- **Token Expiry Prediction**: Proactive token refresh before expiry
- **Cross-Platform Support**: YouTube, LinkedIn, Reddit, Pinterest, Apple
- **Secure Token Storage**: Enhanced security with proper encryption

### Developer Experience
- **Comprehensive Error Handling**: Detailed error messages with specific guidance
- **Enhanced Debugging**: Extensive logging and monitoring capabilities
- **Documentation**: Complete API reference and integration examples
- **Migration Tools**: Automated migration scripts and validation

## 🔄 Migration Steps

### Step 1: Update Route Imports

Replace your existing route imports with the enhanced versions:

```javascript
// OLD
import youtubeRoutes from './routes/youtube.js';
import linkedinRoutes from './routes/linkedin.js';

// NEW
import youtubeRoutes from './sdk-integration/routes/youtube-enhanced.js';
import linkedinRoutes from './sdk-integration/routes/linkedin-enhanced.js';
```

### Step 2: Update Middleware

Replace authentication middleware with the unified version:

```javascript
// OLD
import { authenticateApiKey, requirePermission } from './middleware/unifiedApiKeyAuth.js';

// NEW
import { authenticateApiKey, requirePermission, smartAuth } from './sdk-integration/middleware/unifiedApiKeyAuth.js';
import { youtubeAuthMiddleware } from './sdk-integration/middleware/youtubeAuth.js';
```

### Step 3: Update Configuration

Add the new configuration files to your application:

```javascript
// Add to your main app.js
import { sdkConfig, validateSDKConfig } from './sdk-integration/config/sdk-config.js';
import { oauthConfig, checkEnvironmentVariables } from './sdk-integration/config/oauth-config.js';

// Validate configuration on startup
const configValidation = validateSDKConfig();
if (!configValidation.valid) {
  console.error('SDK Configuration errors:', configValidation.errors);
  process.exit(1);
}

const envCheck = checkEnvironmentVariables();
if (!envCheck.valid) {
  console.error('Environment variable errors:', envCheck.missing);
  process.exit(1);
}
```

### Step 4: Update Route Registration

Register the enhanced routes in your Express application:

```javascript
// Enhanced route registration
app.use('/youtube', youtubeRoutes);
app.use('/linkedin', linkedinRoutes);
app.use('/connection-health', connectionHealthRoutes);
app.use('/validation', validationRoutes);
```

### Step 5: Frontend Integration

Update your frontend authentication calls:

```javascript
// NEW: Enhanced authentication patterns
const authHeaders = {
  'x-api-key': 'ona_your_api_key',
  'authorization': `Bearer ${userJwtToken}`,
  'content-type': 'application/json'
};

// Make API calls with enhanced authentication
const response = await fetch('/youtube/native-auth', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    userAccountInfo: {
      username: username,
      email: email,
      channelName: channelName,
      channelId: channelId
    },
    accessToken: accessToken,
    refreshToken: refreshToken, // CRITICAL: Include refresh token
    idToken: idToken,
    googleUser: googleUser
  })
});
```

## 🔐 Authentication Patterns

### Pattern 1: API Key + User JWT (Recommended for SDK)
```javascript
// Headers
{
  "x-api-key": "ona_your_api_key",
  "authorization": "Bearer user_jwt_token"
}

// Use cases:
// - Developer SDK integrations
// - Third-party applications
// - Rate-limited access with user context
```

### Pattern 2: User JWT Only (Enoch Users)
```javascript
// Headers
{
  "authorization": "Bearer enoch_user_jwt_token"
}

// Use cases:
// - Enoch platform users
// - First-party applications
// - Direct user authentication
```

### Pattern 3: API Key + User Context in Body
```javascript
// Headers
{
  "x-api-key": "ona_your_api_key"
}

// Body
{
  "authToken": "user_jwt_token",
  "userAccountInfo": { ... }
}

// Use cases:
// - Backward compatibility
// - Legacy integrations
// - Mobile app integrations
```

## 🔄 API Changes

### Enhanced YouTube Routes

#### `/youtube/native-auth` (Enhanced)
- **New Features**: Smart authentication, dual database support, connection health monitoring
- **Enhanced Response**: Comprehensive connection status, token validation, recommendations
- **Critical Changes**: 
  - Requires refresh token for optimal functionality
  - Provides detailed error messages with specific guidance
  - Includes connection health assessment

#### `/youtube/connection-status/:username` (New)
- **Purpose**: Real-time connection health monitoring
- **Features**: Token validation, expiry checking, auto-refresh capability
- **Response**: Comprehensive health report with recommendations

#### `/youtube/validate-connection/:username` (New)
- **Purpose**: Validate connection and refresh token functionality
- **Features**: Migration detection, token status analysis
- **Response**: Detailed validation report with next steps

### Enhanced LinkedIn Routes

#### `/linkedin/native-auth` (Enhanced)
- **New Features**: Unified authentication, improved error handling
- **Enhanced Response**: Connection health monitoring, token management
- **Critical Changes**: Better API limitation handling, enhanced debugging

### New Validation Routes

#### `/validation/health-check/:username` (New)
- **Purpose**: Cross-platform health monitoring
- **Features**: All-platform status, repair recommendations
- **Response**: Comprehensive health report with actionable insights

#### `/validation/repair-connections/:username` (New)
- **Purpose**: Automated connection repair
- **Features**: Auto-refresh expired tokens, connection restoration
- **Response**: Repair status with success/failure details

## ⚙️ Configuration Setup

### Environment Variables

Add these required environment variables:

```bash
# Required
ONAIROS_JWT_SECRET_KEY=your_jwt_secret
MONGO_URI=mongodb://localhost:27017/onairos

# YouTube OAuth
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=https://api2.onairos.uk/youtube/callback
YOUTUBE_API_KEY=your_youtube_api_key

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://api2.onairos.uk/linkedin/callback

# Optional: Enoch Database
ENOCH_MONGO_URI=mongodb://localhost:27017/enoch

# Optional: Additional Platforms
REDDIT_CLIENT_ID=your_reddit_client_id
PINTEREST_CLIENT_ID=your_pinterest_client_id
APPLE_CLIENT_ID=your_apple_client_id
```

### Feature Flags

Configure features in `sdk-config.js`:

```javascript
// Enable/disable features
features: {
  dualAuthentication: true,
  crossDatabaseSync: true,
  connectionHealthMonitoring: true,
  autoTokenRefresh: true,
  youtubeEnhancedAuth: true,
  realTimeConnectionStatus: true
}
```

## 🔧 Frontend Integration

### Enhanced OAuth Configuration

Update your frontend OAuth configuration:

```javascript
// Google Sign-In Configuration
const googleConfig = {
  clientId: 'your_google_client_id',
  scopes: [
    'https://www.googleapis.com/auth/youtube.readonly',
    'openid',
    'profile', 
    'email'
  ],
  // CRITICAL: Required for refresh tokens
  offlineAccess: true,
  forceCodeForRefreshToken: true,
  prompt: 'consent'
};

// Initialize Google Sign-In
GoogleAuth.configure(googleConfig);
```

### Enhanced Authentication Flow

```javascript
// Enhanced authentication flow
const authenticateWithYouTube = async () => {
  try {
    // Step 1: Sign in with Google
    const result = await GoogleAuth.signIn();
    
    // Step 2: Extract tokens
    const userInfo = result.user;
    const accessToken = result.accessToken;
    const serverAuthCode = result.serverAuthCode; // This becomes refresh token
    const idToken = result.idToken;
    
    // Step 3: Send to backend with enhanced payload
    const response = await fetch('/youtube/native-auth', {
      method: 'POST',
      headers: {
        'x-api-key': 'ona_your_api_key',
        'authorization': `Bearer ${userJwtToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        userAccountInfo: {
          username: username,
          email: userInfo.email,
          channelName: channelName,
          channelId: channelId
        },
        accessToken: accessToken,
        refreshToken: serverAuthCode, // CRITICAL: Include this
        idToken: idToken,
        googleUser: userInfo
      })
    });
    
    const data = await response.json();
    
    // Step 4: Handle response
    if (data.success) {
      console.log('✅ YouTube connected successfully');
      console.log('Refresh token available:', data.hasRefreshToken);
      
      // Update UI with connection status
      updateConnectionStatus('youtube', data.connectionHealth);
    } else {
      console.error('❌ YouTube connection failed:', data.error);
      
      // Handle re-authentication if needed
      if (data.needsReauth) {
        handleReAuthentication(data.reAuthTrigger);
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
  }
};
```

### Connection Health Monitoring

```javascript
// Monitor connection health
const checkConnectionHealth = async (username) => {
  try {
    const response = await fetch(`/youtube/connection-status/${username}`, {
      headers: {
        'x-api-key': 'ona_your_api_key'
      }
    });
    
    const health = await response.json();
    
    if (health.needsReauth) {
      // Trigger re-authentication
      await handleReAuthentication(health.reAuthTrigger);
    } else {
      console.log('✅ Connection is healthy');
    }
    
    return health;
  } catch (error) {
    console.error('Health check failed:', error);
  }
};

// Auto-refresh health check
setInterval(() => {
  checkConnectionHealth(currentUsername);
}, 300000); // Check every 5 minutes
```

## 🧪 Testing Guide

### Testing Enhanced Authentication

```javascript
// Test API key authentication
const testApiKey = async () => {
  const response = await fetch('/youtube/test-auth', {
    method: 'POST',
    headers: {
      'x-api-key': 'ona_your_api_key'
    }
  });
  
  const result = await response.json();
  console.log('API Key Test:', result.success ? '✅ PASSED' : '❌ FAILED');
  return result;
};

// Test dual authentication
const testDualAuth = async () => {
  const response = await fetch('/youtube/test-auth', {
    method: 'POST',
    headers: {
      'x-api-key': 'ona_your_api_key',
      'authorization': `Bearer ${userJwtToken}`
    }
  });
  
  const result = await response.json();
  console.log('Dual Auth Test:', result.success ? '✅ PASSED' : '❌ FAILED');
  return result;
};
```

### Testing Connection Health

```javascript
// Test connection health
const testConnectionHealth = async () => {
  const response = await fetch('/validation/health-check/test-user', {
    headers: {
      'x-api-key': 'ona_your_api_key'
    }
  });
  
  const health = await response.json();
  console.log('Health Check:', health.success ? '✅ PASSED' : '❌ FAILED');
  console.log('Overall Score:', health.summary?.overallScore || 0);
  return health;
};
```

### Testing Token Refresh

```javascript
// Test token refresh
const testTokenRefresh = async () => {
  const response = await fetch('/youtube/refresh-token', {
    method: 'POST',
    headers: {
      'x-api-key': 'ona_your_api_key',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      username: 'test-user'
    })
  });
  
  const result = await response.json();
  console.log('Token Refresh:', result.success ? '✅ PASSED' : '❌ FAILED');
  return result;
};
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Missing Refresh Token
**Problem**: `refreshTokenWarning` in response indicates no refresh token
**Solution**: 
```javascript
// Update frontend OAuth config
const config = {
  offlineAccess: true,
  forceCodeForRefreshToken: true,
  prompt: 'consent'
};

// Ensure serverAuthCode is sent as refreshToken
body: JSON.stringify({
  refreshToken: serverAuthCode, // CRITICAL
  // ... other fields
})
```

#### 2. Authentication Failures
**Problem**: API key authentication fails
**Solution**:
```javascript
// Check API key format
const apiKey = 'ona_your_32_character_api_key';
if (!apiKey.startsWith('ona_') || apiKey.length < 32) {
  console.error('Invalid API key format');
}

// Verify headers
const headers = {
  'x-api-key': apiKey, // Correct header name
  'authorization': `Bearer ${userToken}` // Include Bearer prefix
};
```

#### 3. Cross-Database Issues
**Problem**: User not found in expected database
**Solution**:
```javascript
// Check user lookup logs
console.log('🔍 [USER-LOOKUP] User search results');

// Verify JWT token structure
const decoded = jwt.decode(userToken);
console.log('Token structure:', {
  hasUserId: !!decoded.userId,
  hasId: !!decoded.id,
  isEnochUser: decoded.id && !decoded.userId
});
```

#### 4. Connection Health Issues
**Problem**: Connection health shows as unhealthy
**Solution**:
```javascript
// Check connection status
const health = await fetch(`/youtube/connection-status/${username}`);
const status = await health.json();

if (status.needsReauth) {
  // Trigger re-authentication
  await handleReAuthentication(status.reAuthTrigger);
} else if (status.tokenDetails?.isExpired && status.tokenDetails?.hasRefreshToken) {
  // Token can be refreshed automatically
  await fetch('/youtube/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ username })
  });
}
```

### Debug Mode

Enable debug mode for detailed logging:

```javascript
// Enable debug mode
process.env.NODE_ENV = 'development';
process.env.LOG_LEVEL = 'debug';

// Check debug logs
console.log('🔍 [DEBUG] Authentication flow');
console.log('🔍 [DEBUG] Token validation');
console.log('🔍 [DEBUG] Database operations');
```

## 📞 Support

For additional support:

1. **Documentation**: Check the complete API reference in `/docs/`
2. **Examples**: Review integration examples in `/docs/INTEGRATION_EXAMPLES.md`
3. **Health Check**: Use `/validation/health-check/` endpoints for diagnostics
4. **Logs**: Enable debug logging for detailed troubleshooting

## 🎉 Migration Checklist

- [ ] Updated route imports to enhanced versions
- [ ] Updated middleware to unified authentication
- [ ] Added new configuration files
- [ ] Updated environment variables
- [ ] Enhanced frontend OAuth configuration
- [ ] Updated API calls to include refresh tokens
- [ ] Implemented connection health monitoring
- [ ] Added error handling for new authentication patterns
- [ ] Tested all authentication flows
- [ ] Validated token refresh functionality
- [ ] Implemented cross-database user support
- [ ] Added health check monitoring
- [ ] Updated documentation and examples

## 📈 Benefits After Migration

1. **Improved Reliability**: Automatic token refresh prevents connection failures
2. **Better User Experience**: Seamless authentication without manual reconnection
3. **Enhanced Security**: Proper token management and API key validation
4. **Comprehensive Monitoring**: Real-time connection health insights
5. **Developer Friendly**: Detailed error messages and debugging tools
6. **Scalable Architecture**: Support for multiple platforms and databases
7. **Future-Proof**: Extensible design for new platform integrations

---

**🚀 Ready to migrate? Start with the test endpoints to validate your setup before proceeding with the full migration.** 
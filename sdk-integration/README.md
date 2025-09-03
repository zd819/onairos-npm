# Web Onairos SDK Integration

This folder contains the enhanced authentication flows and routes for the new web Onairos SDK integration.

## 🚀 Features

- **Unified Authentication**: Supports both API keys and user JWT tokens
- **Enhanced YouTube Integration**: Native mobile app support with proper refresh token handling
- **Dual Database Support**: Works with both Enoch and Onairos databases
- **Connection Health Monitoring**: Comprehensive status checking and validation
- **Auto Token Refresh**: Automatic token renewal using refresh tokens
- **Developer-Friendly**: Rate limiting per developer account with detailed error messages

## 📁 Folder Structure

```
src/sdk-integration/
├── middleware/
│   ├── unifiedApiKeyAuth.js      # Unified API key authentication
│   ├── youtubeAuth.js            # Smart YouTube authentication middleware
│   └── rateLimiting.js           # Rate limiting middleware
├── routes/
│   ├── youtube-enhanced.js       # Enhanced YouTube routes
│   ├── linkedin-enhanced.js      # Enhanced LinkedIn routes
│   └── validation.js             # Connection validation endpoints
├── utils/
│   ├── tokenManager.js           # Token management utilities
│   ├── connectionHealth.js       # Connection health checking
│   └── databaseUtils.js          # Database interaction utilities
├── config/
│   ├── oauth-config.js           # OAuth configuration
│   └── sdk-config.js             # SDK-specific configuration
├── types/
│   └── auth-types.js             # Authentication type definitions
└── docs/
    ├── API_REFERENCE.md          # Complete API reference
    ├── AUTHENTICATION_GUIDE.md   # Authentication guide
    └── INTEGRATION_EXAMPLES.md   # Integration examples
```

## 🔧 Quick Setup

1. **Install Dependencies**: All existing dependencies are supported
2. **Environment Variables**: Use existing `.env` configuration
3. **Import Routes**: Replace existing routes with enhanced versions
4. **Update Frontend**: Use new authentication patterns

## 🔑 Authentication Patterns

### Pattern 1: API Key + User JWT (Recommended)
```javascript
// Headers
{
  "x-api-key": "ona_your_api_key",
  "authorization": "Bearer user_jwt_token"
}
```

### Pattern 2: User JWT Only (Enoch Users)
```javascript
// Headers
{
  "authorization": "Bearer enoch_user_jwt_token"
}
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
```

## 🌟 Key Enhancements

1. **Smart Authentication**: Automatically detects user type and authentication method
2. **Comprehensive Error Handling**: Detailed error messages with specific guidance
3. **Connection Validation**: Real-time connection health checking
4. **Token Management**: Automatic refresh token handling
5. **Database Flexibility**: Supports both Enoch and Onairos databases
6. **Developer Tools**: Enhanced debugging and monitoring capabilities

## 📖 Usage

Replace your existing route imports with the enhanced versions:

```javascript
// OLD
import youtubeRoutes from './routes/youtube.js';

// NEW
import youtubeRoutes from './sdk-integration/routes/youtube-enhanced.js';
```

## 🔍 Connection Health Monitoring

The SDK includes comprehensive connection health monitoring:

- **Real-time Validation**: Live API testing for each connection
- **Token Expiry Tracking**: Automatic detection of expired tokens
- **Refresh Token Management**: Automatic token renewal
- **Migration Detection**: Identifies users needing authentication upgrades

## 📚 Documentation

- [API Reference](./docs/API_REFERENCE.md) - Complete endpoint documentation
- [Authentication Guide](./docs/AUTHENTICATION_GUIDE.md) - Authentication implementation guide
- [Integration Examples](./docs/INTEGRATION_EXAMPLES.md) - Frontend integration examples

## 🚨 Important Notes

1. **Refresh Tokens**: Ensure frontend includes refresh tokens for uninterrupted service
2. **Rate Limiting**: API key-based rate limiting per developer account
3. **Database Compatibility**: Dual storage for Enoch users ensures full compatibility
4. **Error Handling**: All endpoints provide detailed error information and next steps

## 🤝 Support

For questions or issues:
1. Check the documentation in the `docs/` folder
2. Review error messages for specific guidance
3. Use the validation endpoints to diagnose connection issues 
# Onairos SDK API Reference

## Overview

This document provides a complete API reference for the Onairos SDK integration endpoints. The SDK provides enhanced authentication, connection health monitoring, and token management across multiple platforms.

## Base URL

- **Production**: `https://api2.onairos.uk`
- **Development**: `http://localhost:3000`

## Authentication

The SDK supports multiple authentication patterns:

### 1. API Key + User JWT (Recommended)
```http
x-api-key: ona_your_api_key
Authorization: Bearer user_jwt_token
```

### 2. User JWT Only (Enoch Users)
```http
Authorization: Bearer enoch_user_jwt_token
```

### 3. API Key + User Context in Body
```http
x-api-key: ona_your_api_key
Content-Type: application/json

{
  "authToken": "user_jwt_token",
  "userAccountInfo": { ... }
}
```

## Rate Limiting

All endpoints are subject to rate limiting based on API key tier:

| Tier | Requests/Minute | Requests/Hour | Requests/Day |
|------|-----------------|---------------|--------------|
| Standard (`ona_`) | 100 | 1,000 | 10,000 |
| Developer (`dev_`) | 200 | 2,000 | 20,000 |
| Public (`pk_`) | 50 | 500 | 5,000 |
| Admin | 1,000 | 10,000 | 100,000 |

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... },
  "guidance": "Specific guidance for resolution",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "unique_request_id"
}
```

## Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_API_KEY` | API key is invalid or missing |
| `INVALID_JWT` | JWT token is invalid or expired |
| `USER_NOT_FOUND` | User not found in database |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `PLATFORM_NOT_SUPPORTED` | Platform is not supported |
| `CONNECTION_NOT_FOUND` | Platform connection not found |
| `NO_REFRESH_TOKEN` | No refresh token available |

---

## YouTube Endpoints

### Enhanced YouTube Authentication

**POST** `/youtube/native-auth`

Enhanced YouTube OAuth authentication with cross-database support and connection health monitoring.

#### Request Headers
```http
x-api-key: ona_your_api_key
Authorization: Bearer user_jwt_token
Content-Type: application/json
```

#### Request Body
```json
{
  "accessToken": "string (required)",
  "refreshToken": "string (recommended)",
  "idToken": "string (optional)",
  "userAccountInfo": {
    "username": "string (required)",
    "email": "string (optional)",
    "channelName": "string (optional)",
    "channelId": "string (optional)"
  },
  "session": {
    "sessionId": "string (optional)",
    "deviceInfo": "object (optional)"
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "YouTube connection established successfully",
  "requestId": "unique_request_id",
  "userType": "enoch|onairos",
  "connectionData": {
    "platform": "youtube",
    "userName": "Channel Name",
    "channelId": "UCxxxxx",
    "connectedAt": "2024-01-01T00:00:00.000Z",
    "hasRefreshToken": true,
    "tokenExpiry": "2024-01-01T01:00:00.000Z"
  },
  "connectionHealth": {
    "status": "healthy",
    "message": "Connection is healthy",
    "lastChecked": "2024-01-01T00:00:00.000Z"
  },
  "recommendations": [
    {
      "type": "connection_healthy",
      "message": "YouTube connection is healthy and ready for use",
      "severity": "info",
      "actionRequired": false
    }
  ]
}
```

### YouTube Connection Status

**GET** `/youtube/connection-status/:username`

Get real-time connection health status for a user's YouTube connection.

#### Request Headers
```http
x-api-key: ona_your_api_key
```

#### Response
```json
{
  "success": true,
  "requestId": "unique_request_id",
  "platform": "youtube",
  "username": "username",
  "userType": "enoch|onairos",
  "connectionHealth": {
    "status": "healthy|expired_refreshable|expired_no_refresh|invalid_token|not_connected|error",
    "message": "Status message",
    "lastChecked": "2024-01-01T00:00:00.000Z",
    "needsReauth": false,
    "canRefresh": true
  },
  "connectionDetails": {
    "connected": true,
    "channelName": "Channel Name",
    "channelId": "UCxxxxx",
    "connectedAt": "2024-01-01T00:00:00.000Z",
    "lastValidated": "2024-01-01T00:00:00.000Z",
    "hasRefreshToken": true,
    "tokenExpiry": "2024-01-01T01:00:00.000Z"
  },
  "recommendations": []
}
```

### YouTube Token Refresh

**POST** `/youtube/refresh-token`

Refresh YouTube access token using refresh token.

#### Request Headers
```http
x-api-key: ona_your_api_key
Content-Type: application/json
```

#### Request Body
```json
{
  "username": "string (required)"
}
```

#### Response
```json
{
  "success": true,
  "message": "YouTube token refreshed successfully",
  "requestId": "unique_request_id",
  "refreshedAt": "2024-01-01T00:00:00.000Z",
  "newTokenExpiry": "2024-01-01T01:00:00.000Z"
}
```

### YouTube Connection Validation

**POST** `/youtube/validate-connection/:username`

Validate YouTube connection and provide migration recommendations.

#### Request Headers
```http
x-api-key: ona_your_api_key
```

#### Response
```json
{
  "success": true,
  "requestId": "unique_request_id",
  "platform": "youtube",
  "username": "username",
  "userType": "enoch|onairos",
  "connectionHealth": {
    "status": "healthy",
    "message": "Connection is healthy"
  },
  "tokenValidation": {
    "isValid": true,
    "isExpired": false,
    "canRefresh": true,
    "error": null
  },
  "connectionDetails": {
    "connected": true,
    "channelName": "Channel Name",
    "channelId": "UCxxxxx",
    "connectedAt": "2024-01-01T00:00:00.000Z",
    "lastValidated": "2024-01-01T00:00:00.000Z",
    "hasRefreshToken": true,
    "tokenExpiry": "2024-01-01T01:00:00.000Z"
  },
  "recommendations": []
}
```

---

## LinkedIn Endpoints

### Enhanced LinkedIn Authentication

**POST** `/linkedin/native-auth`

Enhanced LinkedIn OAuth authentication with cross-database support.

#### Request Headers
```http
x-api-key: ona_your_api_key
Authorization: Bearer user_jwt_token
Content-Type: application/json
```

#### Request Body
```json
{
  "accessToken": "string (required)",
  "refreshToken": "string (recommended)",
  "idToken": "string (optional)",
  "userAccountInfo": {
    "username": "string (required)",
    "email": "string (optional)",
    "firstName": "string (optional)",
    "lastName": "string (optional)"
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "LinkedIn connection established successfully",
  "requestId": "unique_request_id",
  "userType": "enoch|onairos",
  "connectionData": {
    "platform": "linkedin",
    "userName": "First Last",
    "profileId": "linkedin_profile_id",
    "connectedAt": "2024-01-01T00:00:00.000Z",
    "hasRefreshToken": true,
    "tokenExpiry": "2024-03-01T00:00:00.000Z"
  },
  "connectionHealth": {
    "status": "healthy",
    "message": "Connection is healthy",
    "lastChecked": "2024-01-01T00:00:00.000Z"
  },
  "recommendations": []
}
```

### LinkedIn Connection Status

**GET** `/linkedin/connection-status/:username`

Get real-time connection health status for LinkedIn.

#### Request Headers
```http
x-api-key: ona_your_api_key
```

#### Response
```json
{
  "success": true,
  "requestId": "unique_request_id",
  "platform": "linkedin",
  "username": "username",
  "userType": "enoch|onairos",
  "connectionHealth": {
    "status": "healthy",
    "message": "Connection is healthy",
    "lastChecked": "2024-01-01T00:00:00.000Z"
  },
  "connectionDetails": {
    "connected": true,
    "userName": "First Last",
    "profileId": "linkedin_profile_id",
    "connectedAt": "2024-01-01T00:00:00.000Z",
    "lastValidated": "2024-01-01T00:00:00.000Z",
    "hasRefreshToken": true,
    "tokenExpiry": "2024-03-01T00:00:00.000Z"
  },
  "recommendations": []
}
```

### LinkedIn Token Refresh

**POST** `/linkedin/refresh-token`

Refresh LinkedIn access token.

#### Request Headers
```http
x-api-key: ona_your_api_key
Content-Type: application/json
```

#### Request Body
```json
{
  "username": "string (required)"
}
```

#### Response
```json
{
  "success": true,
  "message": "LinkedIn token refreshed successfully",
  "requestId": "unique_request_id",
  "refreshedAt": "2024-01-01T00:00:00.000Z",
  "newTokenExpiry": "2024-03-01T00:00:00.000Z"
}
```

### LinkedIn Connection Validation

**POST** `/linkedin/validate-connection/:username`

Validate LinkedIn connection and provide recommendations.

#### Request Headers
```http
x-api-key: ona_your_api_key
```

#### Response
```json
{
  "success": true,
  "requestId": "unique_request_id",
  "platform": "linkedin",
  "username": "username",
  "userType": "enoch|onairos",
  "connectionHealth": {
    "status": "healthy",
    "message": "Connection is healthy"
  },
  "tokenValidation": {
    "isValid": true,
    "isExpired": false,
    "canRefresh": true,
    "error": null
  },
  "connectionDetails": {
    "connected": true,
    "userName": "First Last",
    "profileId": "linkedin_profile_id",
    "connectedAt": "2024-01-01T00:00:00.000Z",
    "lastValidated": "2024-01-01T00:00:00.000Z",
    "hasRefreshToken": true,
    "tokenExpiry": "2024-03-01T00:00:00.000Z"
  },
  "recommendations": []
}
```

---

## Validation Endpoints

### Cross-Platform Health Check

**GET** `/validation/health-check/:username`

Comprehensive health monitoring for all platform connections.

#### Request Headers
```http
x-api-key: ona_your_api_key
```

#### Response
```json
{
  "success": true,
  "requestId": "unique_request_id",
  "username": "username",
  "userType": "enoch|onairos",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "summary": {
    "overallStatus": "healthy|mostly_healthy|needs_attention|no_connections",
    "overallScore": 85,
    "overallMessage": "Most platforms are healthy",
    "connectedPlatforms": 2,
    "healthyPlatforms": 2,
    "totalPlatforms": 5,
    "needsAttention": 0
  },
  "platforms": {
    "youtube": {
      "status": "healthy",
      "connected": true,
      "message": "Connection is healthy"
    },
    "linkedin": {
      "status": "healthy",
      "connected": true,
      "message": "Connection is healthy"
    },
    "reddit": {
      "status": "not_connected",
      "connected": false,
      "message": "reddit is not connected"
    }
  },
  "recommendations": [
    {
      "type": "connection_healthy",
      "message": "All connected platforms are healthy",
      "severity": "info",
      "actionRequired": false
    }
  ],
  "nextActions": []
}
```

### Connection Repair

**POST** `/validation/repair-connections/:username`

Automated connection repair for expired tokens and other issues.

#### Request Headers
```http
x-api-key: ona_your_api_key
Content-Type: application/json
```

#### Request Body
```json
{
  "platforms": ["youtube", "linkedin"] // optional, defaults to all connected platforms
}
```

#### Response
```json
{
  "success": true,
  "requestId": "unique_request_id",
  "username": "username",
  "userType": "enoch|onairos",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "summary": {
    "totalPlatforms": 2,
    "successfulRepairs": 1,
    "failedRepairs": 1,
    "repairRate": 50
  },
  "repairResults": {
    "youtube": {
      "platform": "youtube",
      "beforeRepair": "expired_refreshable",
      "repairAttempted": true,
      "repairSuccess": true,
      "afterRepair": "healthy",
      "message": "Token refreshed successfully",
      "error": null
    },
    "linkedin": {
      "platform": "linkedin",
      "beforeRepair": "healthy",
      "repairAttempted": false,
      "repairSuccess": true,
      "afterRepair": "healthy",
      "message": "Platform is already healthy, no repair needed",
      "error": null
    }
  },
  "successfulRepairs": ["youtube", "linkedin"],
  "failedRepairs": [],
  "recommendations": []
}
```

### Platform Migration Status

**GET** `/validation/migration-status/:username`

Check migration status and provide upgrade recommendations.

#### Request Headers
```http
x-api-key: ona_your_api_key
```

#### Response
```json
{
  "success": true,
  "requestId": "unique_request_id",
  "username": "username",
  "userType": "enoch|onairos",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "migrationStatus": {
    "status": "completed|needed|recommended",
    "message": "All connections are up to date",
    "overallScore": 100,
    "connectedPlatforms": 2,
    "platformsNeedingMigration": 0,
    "migrationProgress": 100
  },
  "platformStatuses": {
    "youtube": {
      "connected": true,
      "hasRefreshToken": true,
      "needsUpgrade": false,
      "isLegacyConnection": false,
      "migrationScore": 100
    },
    "linkedin": {
      "connected": true,
      "hasRefreshToken": true,
      "needsUpgrade": false,
      "isLegacyConnection": false,
      "migrationScore": 100
    }
  },
  "migrationNeeded": [],
  "recommendations": []
}
```

### System Health Check

**GET** `/validation/system-health`

Check overall system health and configuration.

#### Request Headers
```http
x-api-key: ona_your_api_key
```

#### Response
```json
{
  "success": true,
  "requestId": "unique_request_id",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "overallHealth": {
    "status": "healthy|warning|error",
    "message": "All systems are healthy",
    "score": 100
  },
  "healthChecks": {
    "configuration": {
      "status": "healthy",
      "message": "Configuration is valid",
      "details": {
        "valid": true,
        "errors": [],
        "warnings": [],
        "enabledFeatures": ["dualAuthentication", "connectionHealthMonitoring"],
        "enabledPlatforms": ["youtube", "linkedin"]
      }
    },
    "database": {
      "status": "healthy",
      "message": "Database connections are healthy",
      "details": {
        "primaryDatabase": "connected",
        "secondaryDatabase": "connected",
        "dualDatabaseSupport": true
      }
    },
    "platforms": {
      "status": "healthy",
      "message": "2/2 platforms configured correctly",
      "details": {
        "enabledPlatforms": 2,
        "configuredPlatforms": 2
      }
    },
    "authentication": {
      "status": "healthy",
      "message": "Authentication system is functioning",
      "details": {
        "jwtEnabled": true,
        "apiKeyEnabled": true,
        "dualAuthEnabled": true,
        "mfaEnabled": false
      }
    }
  },
  "systemInfo": {
    "sdkVersion": "1.0.0",
    "environment": "production",
    "uptime": 86400,
    "nodeVersion": "v18.17.0"
  }
}
```

---

## Test Endpoints

### YouTube Test Authentication

**POST** `/youtube/test-auth`

Test endpoint for verifying YouTube authentication configuration.

#### Request Headers
```http
x-api-key: ona_your_api_key
```

#### Response
```json
{
  "success": true,
  "message": "YouTube authentication test passed",
  "requestId": "unique_request_id",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "authMethod": "api_key",
  "userInfo": {
    "userId": "user_id",
    "userType": "enoch|onairos"
  },
  "apiKeyInfo": {
    "keyId": "key_id",
    "permissions": ["oauth:youtube"]
  },
  "configuration": {
    "platform": "youtube",
    "enabled": true,
    "requiredScopes": ["https://www.googleapis.com/auth/youtube.readonly"],
    "features": {
      "likes": true,
      "dislikes": true,
      "comments": true,
      "subscriptions": true,
      "playlists": true
    }
  }
}
```

### LinkedIn Test Authentication

**POST** `/linkedin/test-auth`

Test endpoint for verifying LinkedIn authentication configuration.

#### Request Headers
```http
x-api-key: ona_your_api_key
```

#### Response
```json
{
  "success": true,
  "message": "LinkedIn authentication test passed",
  "requestId": "unique_request_id",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "authMethod": "api_key",
  "userInfo": {
    "userId": "user_id",
    "userType": "enoch|onairos"
  },
  "apiKeyInfo": {
    "keyId": "key_id",
    "permissions": ["oauth:linkedin"]
  },
  "configuration": {
    "platform": "linkedin",
    "enabled": true,
    "requiredScopes": ["r_liteprofile", "r_emailaddress"],
    "features": {
      "profile": true,
      "posts": true,
      "connections": false,
      "messaging": false
    }
  }
}
```

---

## Rate Limit Status

**GET** `/rate-limit-status`

Get current rate limit status for the requesting API key.

#### Request Headers
```http
x-api-key: ona_your_api_key
```

#### Response
```json
{
  "success": true,
  "rateLimitStatus": {
    "tier": "ona_",
    "tierName": "Standard",
    "limits": {
      "general": {
        "limit": 100,
        "used": 25,
        "remaining": 75,
        "resetAt": "2024-01-01T00:01:00.000Z"
      },
      "apiKey": {
        "limit": 100,
        "used": 25,
        "remaining": 75,
        "resetAt": "2024-01-01T00:01:00.000Z"
      },
      "platform": {
        "limit": 50,
        "used": 10,
        "remaining": 40,
        "resetAt": "2024-01-01T00:01:00.000Z"
      }
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## SDKs and Libraries

### JavaScript/TypeScript
```javascript
import { OnairosSDK } from '@onairos/web-sdk';

const sdk = new OnairosSDK({
  apiKey: 'ona_your_api_key',
  baseUrl: 'https://api2.onairos.uk'
});

// YouTube authentication
const youtubeResult = await sdk.youtube.authenticate({
  accessToken: 'youtube_access_token',
  refreshToken: 'youtube_refresh_token',
  userAccountInfo: {
    username: 'user123',
    email: 'user@example.com'
  }
});
```

### Python
```python
from onairos_sdk import OnairosSDK

sdk = OnairosSDK(
    api_key='ona_your_api_key',
    base_url='https://api2.onairos.uk'
)

# YouTube authentication
youtube_result = sdk.youtube.authenticate(
    access_token='youtube_access_token',
    refresh_token='youtube_refresh_token',
    user_account_info={
        'username': 'user123',
        'email': 'user@example.com'
    }
)
```

---

## Support

For additional support:

- **Documentation**: [https://docs.onairos.uk](https://docs.onairos.uk)
- **Support**: [https://support.onairos.uk](https://support.onairos.uk)
- **Issues**: Use the validation endpoints for diagnostics
- **Status**: [https://status.onairos.uk](https://status.onairos.uk)

---

**Last Updated**: 2024-01-01  
**Version**: 1.0.0 
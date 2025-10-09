# Onairos SDK API Key Validation - Standardized Documentation

## Overview

This document outlines the standardized API key validation system for all Onairos SDKs (React Native, Web, Mobile, etc.). The system provides a unified interface for initializing and validating developer API keys across all platforms.

## 🔑 API Key Format

### Developer API Keys
- **Format**: Must be at least 32 characters
- **Prefixes**: `dev_`, `pk_`, or `ona_`
- **Example**: `ona_1234567890abcdef1234567890abcdef12345678`

### Admin API Keys (Internal Use)
- **Format**: Special admin keys for internal testing
- **Permissions**: Full access (`*`)

## 🚀 SDK Initialization Standard

### Step 1: Initialize SDK (Required for all SDKs)

All SDKs should implement an `initializeApiKey` function that validates the API key before allowing SDK usage.

```typescript
import { initializeApiKey } from 'onairos';

// Initialize SDK with developer API key
try {
  await initializeApiKey({
    apiKey: 'ona_your_api_key_here', // Get from Onairos Dashboard
    environment: 'production', // 'production' | 'development'
    enableLogging: true,
    timeout: 30000,
    retryAttempts: 3
  });
  
  console.log('SDK initialized successfully!');
} catch (error) {
  console.error('SDK initialization failed:', error.message);
}
```

### Step 2: Use SDK Components

After successful initialization, all SDK components work automatically:

```typescript
import { OnairosButton } from 'onairos';

// Components automatically handle authentication internally
<OnairosButton
  requestData={{
    basic: { type: "basic", reward: "10 tokens" },
    personality: { type: "personality", reward: "25 tokens" }, 
    preferences: { type: "preferences", reward: "15 tokens" }
  }}
  webpageName="MyApp"
  testMode={false}
  autoFetch={true}
  onComplete={(result) => console.log(result)}
/>
```

## 🌐 API Endpoints

### Primary Validation Endpoint

**POST** `/auth/validate-key`

This is the main endpoint that all SDKs should use for API key validation.

#### Request Headers
```http
Authorization: Bearer ona_your_api_key_here
Content-Type: application/json
X-SDK-Platform: react-native|web|mobile (optional)
User-Agent: OnairosReactNative/3.1.10 (optional)
```

#### Request Body
```json
{
  "environment": "production",
  "sdk_version": "3.1.10",
  "platform": "react-native",
  "keyType": "developer",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "attempt": 1
}
```

#### Success Response (200)
```json
{
  "success": true,
  "permissions": ["data:read", "data:write"],
  "rateLimits": {
    "remaining": 999,
    "resetTime": 1640995200000
  },
  "keyType": "developer",
  "developer": {
    "id": "dev_123",
    "name": "Developer Name",
    "plan": "pro"
  },
  "apiKey": {
    "id": "key_456",
    "name": "My App Key",
    "context": "production",
    "totalRequests": 1234
  }
}
```

#### Error Response (401/400/500)
```json
{
  "success": false,
  "error": "Invalid API key format",
  "message": "Developer keys must be at least 32 characters and start with 'dev_', 'pk_', or 'ona_'",
  "code": "INVALID_API_KEY_FORMAT",
  "keyType": "invalid"
}
```

### Alternative Endpoints

#### Simple GET Validation
**GET** `/auth/validate-key?key=ona_your_api_key_here`

For simple validation without request body.

#### Legacy Developer Endpoints (Backward Compatibility)
- **POST** `/dev/validate-key` - Enhanced validation with backward compatibility
- **GET** `/dev/validate-key?key=API_KEY` - Simple validation

## 🛡️ Error Handling & Retry Logic

### Common Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `MISSING_API_KEY` | No API key provided | Provide API key in Authorization header |
| `INVALID_API_KEY_FORMAT` | Invalid key format | Check key format (32+ chars, correct prefix) |
| `INVALID_API_KEY` | Key not found/inactive | Verify key exists and is active |
| `API_KEY_EXPIRED` | Key has expired | Renew or generate new API key |
| `DEVELOPER_NOT_FOUND` | Developer account inactive | Contact support |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `INTERNAL_ERROR` | Server error | Retry with exponential backoff |

### Retry Strategy

```typescript
const validateApiKey = async (apiKey: string, config: Config): Promise<ValidationResult> => {
  const maxRetries = config.retryAttempts || 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/auth/validate-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-SDK-Platform': config.platform || 'unknown'
        },
        body: JSON.stringify({
          environment: config.environment || 'production',
          sdk_version: config.sdkVersion,
          platform: config.platform,
          timestamp: new Date().toISOString(),
          attempt
        }),
        signal: AbortSignal.timeout(config.timeout || 30000)
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }
      
      // Retry server errors (5xx)
      if (attempt === maxRetries) {
        throw new Error(`Server error after ${maxRetries} attempts`);
      }
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

## 📱 Platform-Specific Implementation

### React Native SDK

```typescript
export const validateApiKey = async (apiKey: string): Promise<ApiKeyValidationResult> => {
  // Check admin keys first
  if (isAdminKey(apiKey)) {
    return {
      isValid: true,
      permissions: ['*'],
      rateLimits: { remaining: 999999, resetTime: Date.now() + 24*60*60*1000 },
      keyType: ApiKeyType.ADMIN
    };
  }
  
  // Validate format
  const keyType = getApiKeyType(apiKey);
  if (keyType === ApiKeyType.INVALID) {
    return {
      isValid: false,
      error: 'Invalid API key format',
      keyType: ApiKeyType.INVALID
    };
  }
  
  // Make API call
  const response = await fetch(`${baseUrl}/auth/validate-key`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'OnairosReactNative/3.1.10'
    },
    body: JSON.stringify({
      environment: globalConfig?.environment || 'production',
      sdk_version: '3.1.10',
      platform: 'react-native'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    return {
      isValid: true,
      permissions: data.permissions,
      rateLimits: data.rateLimits,
      keyType: data.keyType
    };
  } else {
    return {
      isValid: false,
      error: data.error,
      keyType: data.keyType || ApiKeyType.INVALID
    };
  }
};
```

### Web SDK

```typescript
class OnairosSDK {
  private apiKey: string | null = null;
  private isInitialized: boolean = false;
  
  async initialize(config: InitConfig): Promise<void> {
    const validation = await this.validateApiKey(config.apiKey);
    
    if (!validation.isValid) {
      throw new Error(`SDK initialization failed: ${validation.error}`);
    }
    
    this.apiKey = config.apiKey;
    this.isInitialized = true;
    
    console.log('Onairos SDK initialized successfully');
  }
  
  private async validateApiKey(apiKey: string): Promise<ValidationResult> {
    // Similar implementation to React Native
    // ...
  }
}
```

## 🔧 Configuration Options

### InitConfig Interface

```typescript
interface InitConfig {
  apiKey: string;                    // Required: Developer API key
  environment?: 'production' | 'development'; // Default: 'production'
  enableLogging?: boolean;           // Default: false
  timeout?: number;                  // Default: 30000ms
  retryAttempts?: number;            // Default: 3
  baseUrl?: string;                  // Default: auto-detected
}
```

### ValidationResult Interface

```typescript
interface ValidationResult {
  isValid: boolean;
  permissions?: string[];
  rateLimits?: {
    remaining: number;
    resetTime: number;
  };
  keyType: 'admin' | 'developer' | 'invalid';
  error?: string;
}
```

## 🌍 Environment Configuration

### Base URLs

```typescript
const API_ENDPOINTS = {
  production: 'https://api.onairos.uk',
  development: 'https://dev-api.onairos.uk'
};
```

### Environment Detection

```typescript
const detectEnvironment = (): 'production' | 'development' => {
  if (typeof window !== 'undefined') {
    // Browser environment
    return window.location.hostname.includes('localhost') ? 'development' : 'production';
  } else {
    // Node.js/React Native environment
    return process.env.NODE_ENV === 'development' ? 'development' : 'production';
  }
};
```

## 🚀 Quick Start Examples

### React Native

```typescript
import { initializeApiKey, OnairosButton } from 'onairos-react-native';

// 1. Initialize SDK
await initializeApiKey({
  apiKey: 'ona_your_key_here',
  environment: 'production'
});

// 2. Use components
<OnairosButton requestData={{...}} onComplete={handleResult} />
```

### Web/JavaScript

```typescript
import { OnairosSDK } from 'onairos-web';

// 1. Initialize SDK
const sdk = new OnairosSDK();
await sdk.initialize({
  apiKey: 'ona_your_key_here',
  environment: 'production'
});

// 2. Use SDK methods
const result = await sdk.collectData({...});
```

### Node.js Backend

```typescript
import { OnairosAPI } from 'onairos-node';

// 1. Initialize API client
const api = new OnairosAPI({
  apiKey: 'ona_your_key_here',
  environment: 'production'
});

// 2. Make API calls
const validation = await api.validateKey();
```

## 🔍 Testing & Debugging

### Test API Key Validation

```bash
# Test with curl
curl -X POST https://api.onairos.uk/auth/validate-key \
  -H "Authorization: Bearer ona_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "production",
    "platform": "test"
  }'
```

### Debug Mode

Enable logging in SDK initialization:

```typescript
await initializeApiKey({
  apiKey: 'ona_your_key_here',
  enableLogging: true  // Shows detailed logs
});
```

## 📞 Support

- **Documentation**: https://docs.onairos.uk
- **Dashboard**: https://dashboard.onairos.uk
- **Support**: support@onairos.uk

---

*Last updated: October 2024*

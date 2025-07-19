# Onairos SDK Authentication Guide

## Overview

This guide provides detailed instructions for implementing authentication with the Onairos SDK. The SDK supports multiple authentication patterns designed to work with both new integrations and existing Enoch platform users.

## Table of Contents

1. [Authentication Patterns](#authentication-patterns)
2. [API Key Management](#api-key-management)
3. [JWT Token Handling](#jwt-token-handling)
4. [Implementation Examples](#implementation-examples)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Authentication Patterns

The Onairos SDK supports three primary authentication patterns:

### 1. API Key + User JWT (Recommended)

This is the **recommended** pattern for most integrations. It provides the highest level of security and functionality.

```http
x-api-key: ona_your_32_character_api_key
Authorization: Bearer user_jwt_token
Content-Type: application/json
```

**Use Cases:**
- Third-party applications
- SDK integrations
- Developer tools
- Mobile applications

**Benefits:**
- Rate limiting per developer account
- Full access to all SDK features
- Detailed analytics and monitoring
- Enhanced security

### 2. User JWT Only (Enoch Users)

This pattern is for existing Enoch platform users who have valid JWT tokens.

```http
Authorization: Bearer enoch_user_jwt_token
Content-Type: application/json
```

**Use Cases:**
- Enoch platform users
- First-party applications
- Legacy integrations
- Direct user authentication

**Benefits:**
- Seamless integration with existing Enoch auth
- No additional API key required
- Direct database access
- Simplified implementation

### 3. API Key + User Context in Body

This pattern provides backward compatibility for legacy integrations.

```http
x-api-key: ona_your_api_key
Content-Type: application/json

{
  "authToken": "user_jwt_token",
  "userAccountInfo": {
    "username": "user123",
    "email": "user@example.com"
  }
}
```

**Use Cases:**
- Legacy integrations
- Backward compatibility
- Custom authentication flows
- Mobile app integrations

## API Key Management

### Obtaining an API Key

1. **Register for a Developer Account**
   - Visit [https://developer.onairos.uk](https://developer.onairos.uk)
   - Create a developer account
   - Verify your email address

2. **Create an Application**
   - Log into the developer dashboard
   - Create a new application
   - Select the platforms you need access to

3. **Generate API Key**
   - Navigate to your application settings
   - Generate a new API key
   - Copy and securely store the key

### API Key Types

| Prefix | Type | Description | Rate Limit |
|--------|------|-------------|------------|
| `ona_` | Standard | Default API key for most applications | 100 req/min |
| `dev_` | Developer | Enhanced limits for active developers | 200 req/min |
| `pk_` | Public | Limited access for public applications | 50 req/min |

### API Key Security

**✅ Do:**
- Store API keys in environment variables
- Use different keys for different environments
- Rotate keys regularly (every 90 days)
- Monitor API key usage
- Implement proper access controls

**❌ Don't:**
- Hard-code API keys in source code
- Share API keys publicly
- Use the same key across multiple applications
- Store keys in client-side code
- Ignore security warnings

### Example: Secure API Key Storage

```javascript
// .env file
ONAIROS_API_KEY=ona_your_32_character_api_key_here
ONAIROS_BASE_URL=https://api2.onairos.uk

// Application code
const apiKey = process.env.ONAIROS_API_KEY;
const baseUrl = process.env.ONAIROS_BASE_URL;

if (!apiKey) {
  throw new Error('ONAIROS_API_KEY environment variable is required');
}
```

## JWT Token Handling

### JWT Token Structure

Onairos JWT tokens contain the following claims:

```json
{
  "userId": "user_id_or_null",
  "id": "enoch_user_id_or_null",
  "email": "user@example.com",
  "username": "user123",
  "userType": "enoch|onairos",
  "permissions": ["oauth:youtube", "oauth:linkedin"],
  "iat": 1640995200,
  "exp": 1641081600,
  "iss": "onairos.uk",
  "aud": "web-sdk"
}
```

### Token Validation

The SDK automatically validates JWT tokens, but you can also validate them manually:

```javascript
import jwt from 'jsonwebtoken';

function validateToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.ONAIROS_JWT_SECRET_KEY);
    
    // Check if token is expired
    if (decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    // Check issuer
    if (decoded.iss !== 'onairos.uk') {
      throw new Error('Invalid issuer');
    }
    
    return decoded;
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}
```

### Token Refresh

JWT tokens have a limited lifetime. Implement token refresh logic:

```javascript
async function refreshToken(currentToken) {
  try {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const { newToken } = await response.json();
    return newToken;
  } catch (error) {
    // Redirect to login
    window.location.href = '/login';
  }
}
```

## Implementation Examples

### Frontend Integration

#### React Example

```javascript
import React, { useState, useEffect } from 'react';

const OnairosAuth = () => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [apiKey] = useState(process.env.REACT_APP_ONAIROS_API_KEY);
  
  const authenticateWithYoutube = async () => {
    try {
      // Get Google OAuth tokens
      const googleAuth = await window.gapi.auth2.getAuthInstance().signIn();
      const accessToken = googleAuth.getAuthResponse().access_token;
      const idToken = googleAuth.getAuthResponse().id_token;
      
      // Send to Onairos SDK
      const response = await fetch('/youtube/native-auth', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'authorization': `Bearer ${authToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: accessToken,
          idToken: idToken,
          userAccountInfo: {
            username: 'user123',
            email: 'user@example.com'
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('YouTube connected successfully!');
        // Update UI to show connected state
      } else {
        console.error('YouTube connection failed:', result.error);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };
  
  return (
    <div>
      <button onClick={authenticateWithYoutube}>
        Connect YouTube
      </button>
    </div>
  );
};
```

#### Vue.js Example

```javascript
<template>
  <div>
    <button @click="connectYoutube" :disabled="connecting">
      {{ connecting ? 'Connecting...' : 'Connect YouTube' }}
    </button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      connecting: false,
      authToken: localStorage.getItem('authToken'),
      apiKey: process.env.VUE_APP_ONAIROS_API_KEY
    };
  },
  methods: {
    async connectYoutube() {
      this.connecting = true;
      
      try {
        // Implementation similar to React example
        const response = await this.$http.post('/youtube/native-auth', {
          accessToken: 'youtube_access_token',
          userAccountInfo: {
            username: this.$store.state.user.username,
            email: this.$store.state.user.email
          }
        }, {
          headers: {
            'x-api-key': this.apiKey,
            'authorization': `Bearer ${this.authToken}`
          }
        });
        
        if (response.data.success) {
          this.$emit('youtube-connected', response.data.connectionData);
        }
      } catch (error) {
        console.error('YouTube connection failed:', error);
      } finally {
        this.connecting = false;
      }
    }
  }
};
</script>
```

### Backend Integration

#### Node.js/Express Example

```javascript
import express from 'express';
import { OnairosSDK } from '@onairos/web-sdk';

const app = express();
const sdk = new OnairosSDK({
  apiKey: process.env.ONAIROS_API_KEY,
  baseUrl: process.env.ONAIROS_BASE_URL
});

// Middleware to validate authentication
const validateAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authToken = req.headers['authorization'];
  
  if (!apiKey || !authToken) {
    return res.status(401).json({
      success: false,
      error: 'Missing authentication credentials'
    });
  }
  
  // Attach to request for use in routes
  req.apiKey = apiKey;
  req.authToken = authToken.replace('Bearer ', '');
  
  next();
};

// YouTube authentication endpoint
app.post('/api/youtube/connect', validateAuth, async (req, res) => {
  try {
    const result = await sdk.youtube.authenticate({
      accessToken: req.body.accessToken,
      refreshToken: req.body.refreshToken,
      userAccountInfo: req.body.userAccountInfo
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health/:username', validateAuth, async (req, res) => {
  try {
    const result = await sdk.validation.healthCheck(req.params.username);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

#### Python/FastAPI Example

```python
from fastapi import FastAPI, HTTPException, Depends, Header
from onairos_sdk import OnairosSDK
import os

app = FastAPI()
sdk = OnairosSDK(
    api_key=os.getenv('ONAIROS_API_KEY'),
    base_url=os.getenv('ONAIROS_BASE_URL')
)

async def validate_auth(
    x_api_key: str = Header(...),
    authorization: str = Header(...)
):
    if not x_api_key or not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication credentials"
        )
    
    return {
        'api_key': x_api_key,
        'auth_token': authorization.replace('Bearer ', '')
    }

@app.post('/api/youtube/connect')
async def connect_youtube(
    request: dict,
    auth: dict = Depends(validate_auth)
):
    try:
        result = await sdk.youtube.authenticate(
            access_token=request['accessToken'],
            refresh_token=request.get('refreshToken'),
            user_account_info=request['userAccountInfo']
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/health/{username}')
async def health_check(
    username: str,
    auth: dict = Depends(validate_auth)
):
    try:
        result = await sdk.validation.health_check(username)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Mobile Integration

#### iOS/Swift Example

```swift
import Foundation

class OnairosSDK {
    private let apiKey: String
    private let baseUrl: String
    
    init(apiKey: String, baseUrl: String) {
        self.apiKey = apiKey
        self.baseUrl = baseUrl
    }
    
    func authenticateYoutube(
        accessToken: String,
        refreshToken: String?,
        userInfo: [String: Any],
        completion: @escaping (Result<[String: Any], Error>) -> Void
    ) {
        guard let url = URL(string: "\(baseUrl)/youtube/native-auth") else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("Bearer \(getAuthToken())", forHTTPHeaderField: "authorization")
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        
        let body = [
            "accessToken": accessToken,
            "refreshToken": refreshToken ?? "",
            "userAccountInfo": userInfo
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "No data", code: 0, userInfo: nil)))
                return
            }
            
            do {
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                completion(.success(json ?? [:]))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    private func getAuthToken() -> String {
        // Get stored auth token
        return UserDefaults.standard.string(forKey: "authToken") ?? ""
    }
}
```

#### Android/Kotlin Example

```kotlin
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

class OnairosSDK(
    private val apiKey: String,
    private val baseUrl: String
) {
    private val client = OkHttpClient()
    private val mediaType = "application/json".toMediaType()
    
    suspend fun authenticateYoutube(
        accessToken: String,
        refreshToken: String?,
        userInfo: Map<String, Any>
    ): Result<JSONObject> = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().apply {
                put("accessToken", accessToken)
                put("refreshToken", refreshToken ?: "")
                put("userAccountInfo", JSONObject(userInfo))
            }
            
            val request = Request.Builder()
                .url("$baseUrl/youtube/native-auth")
                .post(body.toString().toRequestBody(mediaType))
                .header("x-api-key", apiKey)
                .header("authorization", "Bearer ${getAuthToken()}")
                .header("content-type", "application/json")
                .build()
            
            val response = client.newCall(request).execute()
            val responseBody = response.body?.string()
            
            if (response.isSuccessful && responseBody != null) {
                Result.success(JSONObject(responseBody))
            } else {
                Result.failure(Exception("Request failed: ${response.code}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private fun getAuthToken(): String {
        // Get stored auth token from SharedPreferences
        return ""
    }
}
```

## Best Practices

### Security Best Practices

1. **API Key Security**
   - Never expose API keys in client-side code
   - Use environment variables for key storage
   - Implement key rotation policies
   - Monitor API key usage

2. **JWT Token Security**
   - Implement proper token refresh logic
   - Store tokens securely (not in localStorage for sensitive apps)
   - Validate tokens on both client and server
   - Use short-lived tokens with refresh mechanism

3. **Network Security**
   - Always use HTTPS in production
   - Implement request signing for sensitive operations
   - Use proper CORS policies
   - Implement rate limiting on your endpoints

### Performance Best Practices

1. **Caching**
   - Cache authentication responses
   - Implement connection status caching
   - Use appropriate cache headers

2. **Error Handling**
   - Implement exponential backoff for retries
   - Handle rate limit errors gracefully
   - Provide user-friendly error messages

3. **Monitoring**
   - Log authentication events
   - Monitor API key usage
   - Track connection health metrics
   - Set up alerts for failures

### User Experience Best Practices

1. **Connection Flow**
   - Provide clear instructions for OAuth flows
   - Show connection status in real-time
   - Implement automatic reconnection for expired tokens

2. **Error Messages**
   - Provide actionable error messages
   - Include links to documentation
   - Offer self-service troubleshooting

3. **Loading States**
   - Show loading indicators during authentication
   - Provide progress feedback for long operations
   - Implement timeout handling

## Troubleshooting

### Common Issues

#### 1. Invalid API Key

**Error**: `INVALID_API_KEY`

**Causes**:
- API key is missing or malformed
- API key has been revoked
- API key is for wrong environment

**Solutions**:
- Verify API key format (should start with `ona_`, `dev_`, or `pk_`)
- Check if API key is active in developer dashboard
- Ensure you're using the correct environment

#### 2. JWT Token Issues

**Error**: `INVALID_JWT` or `EXPIRED_JWT`

**Causes**:
- Token is expired
- Token is malformed
- Token signature is invalid
- Wrong JWT secret

**Solutions**:
- Implement token refresh logic
- Verify JWT secret configuration
- Check token expiration handling

#### 3. User Not Found

**Error**: `USER_NOT_FOUND`

**Causes**:
- User doesn't exist in either database
- Username/email mismatch
- Database connection issues

**Solutions**:
- Verify user exists in correct database
- Check username/email formatting
- Use the validation endpoints to debug

#### 4. Rate Limit Exceeded

**Error**: `RATE_LIMIT_EXCEEDED`

**Causes**:
- Too many requests in time window
- Incorrect API key tier
- Multiple applications using same key

**Solutions**:
- Implement exponential backoff
- Upgrade API key tier if needed
- Use separate keys for different applications

#### 5. Platform Connection Issues

**Error**: `CONNECTION_FAILED` or `INVALID_PLATFORM_TOKEN`

**Causes**:
- Platform token is invalid
- Platform API changes
- Network connectivity issues

**Solutions**:
- Verify platform token validity
- Check platform API documentation
- Implement proper retry logic

### Debugging Tools

#### 1. Validation Endpoints

Use the validation endpoints to debug authentication issues:

```bash
# Check connection health
curl -X GET "https://api2.onairos.uk/validation/health-check/username" \
  -H "x-api-key: ona_your_api_key"

# Check system health
curl -X GET "https://api2.onairos.uk/validation/system-health" \
  -H "x-api-key: ona_your_api_key"
```

#### 2. Test Endpoints

Use test endpoints to verify configuration:

```bash
# Test YouTube authentication
curl -X POST "https://api2.onairos.uk/youtube/test-auth" \
  -H "x-api-key: ona_your_api_key"

# Test LinkedIn authentication
curl -X POST "https://api2.onairos.uk/linkedin/test-auth" \
  -H "x-api-key: ona_your_api_key"
```

#### 3. Rate Limit Status

Check your current rate limit status:

```bash
curl -X GET "https://api2.onairos.uk/rate-limit-status" \
  -H "x-api-key: ona_your_api_key"
```

### Support Resources

- **Documentation**: [https://docs.onairos.uk](https://docs.onairos.uk)
- **Support**: [https://support.onairos.uk](https://support.onairos.uk)
- **Status Page**: [https://status.onairos.uk](https://status.onairos.uk)
- **Developer Forum**: [https://forum.onairos.uk](https://forum.onairos.uk)

---

**Last Updated**: 2024-01-01  
**Version**: 1.0.0 
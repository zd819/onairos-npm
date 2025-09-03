# SDK Quick Reference Guide

## 🚀 Essential Endpoints & Flows

### Base URL: `https://api2.onairos.uk`

---

## 🔐 Authentication Headers

```javascript
// Pattern 1: API Key + User JWT (Primary)
const headers = {
  'x-api-key': 'ona_your_32_character_api_key',
  'Authorization': `Bearer ${userJwtToken}`,
  'Content-Type': 'application/json'
};

// Pattern 2: User JWT Only (Enoch users)
const headers = {
  'Authorization': `Bearer ${userJwtToken}`,
  'Content-Type': 'application/json'
};

// Testing: Admin key bypasses validation
const adminKey = 'OnairosIsAUnicorn2025';
```

---

## 📧 Email Verification Flow

### Request Code
```http
POST /email/verification
{
  "email": "user@example.com",
  "action": "request"
}
```

### Verify Code & Get JWT
```http
POST /email/verification
{
  "email": "user@example.com", 
  "action": "verify",
  "code": "123456"
}
```

**Response (New User)**:
```json
{
  "success": true,
  "isNewUser": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userName": "user123",
  "enochInstructions": {
    "recommendedFlow": "onboarding"
  }
}
```

**Response (Existing User)**:
```json
{
  "success": true,
  "isNewUser": false,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "existingUserData": {
    "hasExistingData": true,
    "summary": {
      "connectionsCount": 3,
      "traitsCount": 5
    }
  },
  "enochInstructions": {
    "recommendedFlow": "dashboard"
  }
}
```

---

## 🔒 PIN Management

### Store PIN
```http
POST /store-pin/mobile
Authorization: Bearer {userJwtToken}
{
  "username": "user123",
  "pin": "MySecure1!"
}
```

**PIN Requirements**: 8+ chars, 1 uppercase, 1 symbol

### Check PIN Status
```http
GET /store-pin/status/{username}
→ {"success": true, "hasPinStored": true}
```

---

## 🔗 OAuth Connectors

### YouTube Native Auth
```http
POST /youtube/native-auth
x-api-key: {apiKey}
Authorization: Bearer {userJwt}
{
  "userAccountInfo": {
    "username": "user123",
    "email": "user@example.com",
    "channelName": "My Channel",
    "channelId": "UCxxxxx"
  },
  "accessToken": "ya29.a0AfH6SMC...",
  "refreshToken": "4/0AX4XfWi...",
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Critical OAuth Config**:
```javascript
{
  offlineAccess: true,
  forceCodeForRefreshToken: true,
  prompt: 'consent',
  scopes: ['https://www.googleapis.com/auth/youtube.readonly', 'openid', 'profile', 'email']
}
```

### Other Platforms
- **LinkedIn**: `POST /linkedin/authorize`
- **Reddit**: `POST /reddit/authorize`  
- **Pinterest**: `POST /pinterest/authorize`
- **Instagram**: `POST /instagram/authorize`

---

## 📊 Data Requests

### Get Data API URL
```http
POST /getAPIurlMobile
{
  "Info": {
    "storage": "local",
    "appId": "your_app_id",
    "confirmations": [{"data": "Large", "date": "2024-01-15T10:30:00Z"}],
    "EncryptedUserPin": "encrypted_pin_data",
    "account": "user123",
    "proofMode": false
  }
}
```

**Response**:
```json
{
  "apiUrl": "https://api2.onairos.uk/mobileInferenceNoProof",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Get Traits
```http
POST /traits
Authorization: Bearer {inferenceToken}
→ {"traits": {"openness": 0.75, "conscientiousness": 0.68}}
```

### Mobile Inference
```http
POST /mobileInferenceNoProof
Authorization: Bearer {inferenceToken}
{"Input": "text_to_analyze"}
```

---

## 👤 User Data

### Connected Accounts
```http
GET /connected-accounts?username={username}
→ {
  "connectedAccounts": [
    {
      "platform": "YouTube",
      "accountName": "My Channel", 
      "status": "active",
      "hasData": true
    }
  ]
}
```

### Connection Health
```http
GET /youtube/connection-status/{username}
→ {
  "success": true,
  "connectionStatus": "healthy",
  "needsReauth": false,
  "tokenDetails": {
    "hasRefreshToken": true,
    "isExpired": false
  }
}
```

---

## 🏋️ Training & Models

### Training Progress (WebSocket)
```javascript
socket.emit('startTraining', {
  username: 'user123',
  encryptionMode: true,
  platforms: ['youtube', 'linkedin']
});

// Receive updates
socket.on('trainingUpdate', (data) => {
  console.log(`Progress: ${data.progress}% - ${data.stage}`);
});
```

### Download Model
```http
POST /mobile-training/download-model
Authorization: Bearer {userJwt}
→ {
  "model": "base64_encoded_model_data",
  "encryption": {"iv": "base64_iv", "key": "base64_key"}
}
```

---

## 🚨 Error Codes

| Code | Description | Action |
|------|-------------|---------|
| `MISSING_API_KEY` | No API key provided | Add x-api-key header |
| `INVALID_CODE` | Wrong verification code | Ask user to re-enter |
| `USER_NOT_FOUND` | User doesn't exist | Create new account |
| `PIN_REQUIRED` | PIN not set | Redirect to PIN setup |
| `RATE_LIMITED` | Too many requests | Wait and retry |

---

## 💻 Actual Implementation Patterns

### Direct API Calls (Your Actual Pattern)

```javascript
// 1. Email Verification (Direct)
const verifyEmail = async (email, code, apiKey) => {
  const response = await fetch('https://api2.onairos.uk/email/verification', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      action: 'verify',
      code: code
    })
  });
  return await response.json();
};

// 2. YouTube Mobile Signin (Your Actual Pattern)
const connectYouTubeMobile = async (tokens, username, apiKey) => {
  const response = await fetch('https://api2.onairos.uk/youtube/mobileSignin', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      idToken: tokens.idToken,
      accessToken: tokens.accessToken,
      serverAuthCode: tokens.serverAuthCode,
      username: username
    })
  });
  return await response.json();
};

// 3. Mobile Training (WebSocket + HTTP)
const startMobileTraining = async (userJwt, socketId, platforms) => {
  const response = await fetch('https://api2.onairos.uk/mobile-training/clean', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userJwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      socketId: socketId,
      connectedPlatforms: platforms
    })
  });
  return await response.json();
};

// 4. Data Request (Your Info Pattern)
const requestDataAccess = async (userInfo) => {
  const response = await fetch('https://api2.onairos.uk/getAPIurlMobile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Info: {
        storage: "local",
        appId: userInfo.appId,
        confirmations: userInfo.confirmations,
        EncryptedUserPin: userInfo.encryptedPin,
        account: userInfo.username,
        proofMode: false
      }
    })
  });
  return await response.json();
};

// 5. Mobile Model Download (Your Actual Pattern)
const downloadModel = async (username) => {
  const response = await fetch('https://api2.onairos.uk/sendMobileModel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Info: {
        username: username
      }
    })
  });
  return await response.json();
};
```

---

## ✅ Implementation Checklist

- [ ] **Auth**: Email verification + JWT storage
- [ ] **PIN**: Secure PIN storage with validation
- [ ] **OAuth**: Proper refresh token handling
- [ ] **Data**: Training + inference flows
- [ ] **Errors**: Handle all error codes gracefully
- [ ] **Testing**: Use admin key for development

---

### WebSocket Training Pattern
```javascript
// Complete training flow example
const runMobileTraining = async (jwtToken, username, platforms) => {
  // 1. Connect to WebSocket
  const socket = io('https://api2.onairos.uk');
  
  // 2. Set up listeners
  socket.on('trainingUpdate', (data) => {
    console.log(`Progress: ${data.progress}% - ${data.stage}`);
    updateTrainingUI(data);
  });
  
  socket.on('trainingCompleted', (data) => {
    console.log('Training completed!', data);
    showTrainingComplete(data);
  });
  
  // 3. Start training via HTTP
  const response = await fetch('https://api2.onairos.uk/mobile-training/clean', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      socketId: socket.id,
      connectedPlatforms: platforms
    })
  });
  
  return await response.json();
};
```

**Key Implementation Points:**
1. **Use direct fetch calls** - no SDK wrapper needed
2. **Follow Info pattern** for data requests: `{Info: {username: "..."}}`  
3. **WebSocket + HTTP combo** for training with real-time updates
4. **serverAuthCode is refresh token** in OAuth flows
5. **Store JWT securely** (Keychain/Keystore)
6. **Test with admin key** (`OnairosIsAUnicorn2025`) before production 
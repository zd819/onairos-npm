# Email Verification API Schema

## Base URL
```
https://api2.onairos.uk
```

## Authentication
- **Developer API Key**: `Bearer ${API_KEY}` (required for all requests)
- **Admin API Key**: `Bearer OnairosIsAUnicorn2025` (bypasses email sending, accepts any 6-digit code)

---

## 1. Request Verification Code

### Endpoint
```
POST /email/verification
```

### Request
```json
{
  "email": "user@example.com",
  "action": "request"
}
```

### Response
```json
{
  "success": true,
  "message": "Email verification sent successfully",
  "requestId": "req-1641123456789-abc123xyz",
  
  // Admin mode only:
  "adminMode": true,
  "debugCode": "123456",
  "adminInstructions": {
    "message": "Admin mode is enabled",
    "verification": "Use any 6-digit code (e.g., 123456) to verify this email"
  }
}
```

---

## 2. Verify Code & Get JWT Token

### Endpoint
```
POST /email/verification
```

### Request
```json
{
  "email": "user@example.com",
  "action": "verify",
  "code": "123456"
}
```

### Response
```json
{
  "success": true,
  "message": "Email verified successfully",
  "existingUser": false,
  "accountInfo": null,  // null for new users
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "jwtToken": "eyJhbGciOiJIUzI1NiIs...",  // Same as token (backward compatibility)
  "userName": "user123",
  
  // Admin mode only:
  "adminMode": true,
  "userCreated": true,
  "accountDetails": {
    "userId": "341",
    "userName": "test44",
    "email": "test44@gmail.com",
    "verified": true,
    "creationDate": "2025-01-09T06:22:58.000Z",
    "lastLogin": "2025-01-09T06:22:58.000Z"
  }
}
```

### Response for Existing Users
```json
{
  "success": true,
  "message": "Email verified successfully",
  "existingUser": true,
  "accountInfo": {
    "existingUserData": {
      "summary": {
        "connectionsCount": 3,
        "traitsCount": 25,
        "hasPersonalityData": true,
        "hasTrainedModel": true,
        "hasAvatar": false
      },
      "connections": [
        {
          "platform": "YouTube",
          "status": "active", 
          "connectedAt": "2024-01-15T10:30:00.000Z",
          "hasData": true,
          "displayName": "YouTube"
        },
        {
          "platform": "LinkedIn",
          "status": "active",
          "connectedAt": "2024-02-20T14:22:00.000Z", 
          "hasData": true,
          "displayName": "LinkedIn"
        }
      ]
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "jwtToken": "eyJhbGciOiJIUzI1NiIs...",  // Same as token (backward compatibility)
  "userName": "john_doe"
}
```

---

## JWT Token Format

### Payload
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "userId": "123",
  "verified": true,
  "iat": 1641123456,
  "exp": 1641728256
}
```

### Properties
- **Expiration**: 7 days
- **Secret**: `ONAIROS_JWT_SECRET_KEY`
- **Algorithm**: HS256

---

## Usage Examples

### JavaScript/React Native
```javascript
// Step 1: Request code
const requestCode = await fetch('/email/verification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    email: 'user@example.com',
    action: 'request'
  })
});

// Step 2: Verify code and get JWT
const verifyCode = await fetch('/email/verification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    email: 'user@example.com',
    action: 'verify',
    code: '123456'
  })
});

const result = await verifyCode.json();
if (result.success) {
  // Store JWT token
  const jwtToken = result.token; // or result.jwtToken
  localStorage.setItem('onairos_jwt_token', jwtToken);
}
```

### Using JWT Token
```javascript
// Use JWT for authenticated requests
const response = await fetch('/store-pin/mobile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}` // User JWT token
  },
  body: JSON.stringify({
    username: 'user123',
    pin: '1234'
  })
});
```

---

## Error Responses

### Common Errors
```json
{
  "success": false,
  "error": "Invalid email address or verification failed"
}
```

### Rate Limiting
```json
{
  "success": false,
  "error": "Too many attempts. Please try again later."
}
```

### Invalid Code
```json
{
  "success": false,
  "error": "Invalid or expired verification code"
}
```

---

## Key Points

1. **Single Endpoint**: Use `/email/verification` with different `action` values
2. **JWT Returns**: Both `token` and `jwtToken` fields contain the same JWT
3. **Admin Mode**: Use `OnairosIsAUnicorn2025` API key, accept any 6-digit code
4. **Token Usage**: Include JWT in `Authorization: Bearer ${token}` for user requests
5. **Expiration**: JWT tokens last 7 days 
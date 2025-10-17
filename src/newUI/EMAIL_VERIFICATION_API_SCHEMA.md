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
POST /email/verify
```

### Request
```json
{
  "email": "user@example.com"
}
```

### Response
```json
{
  "success": true,
  "message": "Verification code generated (testing mode - check server logs)",
  "testingMode": true,
  "emailSent": false,
  "note": "Any code will be accepted for verification in testing mode",
  "expiresIn": "30 minutes"
}
```

---

## 2. Verify Code & Get JWT Token

### Endpoint
```
POST /email/verify/confirm
```

### Request
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

### Response (New User)
```json
{
  "success": true,
  "isNewUser": true,
  "userState": "new",
  "flowType": "onboarding",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "341",
    "userName": "test44",
    "email": "test44@gmail.com",
    "verified": true,
    "creationDate": "2025-01-09T06:22:58.000Z",
    "lastLogin": "2025-01-09T06:22:58.000Z"
  },
  "enochInstructions": {
    "recommendedFlow": "onboarding",
    "nextActionTitle": "Get Started"
  }
}
```

### Response (Existing User)
```json
{
  "success": true,
  "isNewUser": false,
  "userState": "returning", 
  "flowType": "returning_user",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "123",
    "userName": "existinguser",
    "email": "user@example.com",
    "verified": true,
    "creationDate": "2024-01-15T10:30:00.000Z",
    "lastLogin": "2025-01-09T06:22:58.000Z"
  },
  "existingUserData": {
    "hasExistingData": true,
    "summary": {
      "connectionsCount": 3,
      "traitsCount": 5,
      "hasPersonalityData": true
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
  },
  "enochInstructions": {
    "skipOnboarding": true,
    "recommendedFlow": "dashboard",
    "nextActionTitle": "View Your Data"
  }
}
```

```

### Error Responses
```json
// Wrong Code
{
  "success": false,
  "error": "Invalid verification code",
  "code": 400,
  "attemptsRemaining": 2
}

// Missing Data
{
  "success": false,
  "error": "Email and code are required",
  "code": 400
}

// Expired Code
{
  "success": false,
  "error": "Verification code has expired. Please request a new code.",
  "code": 400
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
const requestCode = await fetch('/email/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    email: 'user@example.com'
  })
});

// Step 2: Verify code and get JWT
const verifyCode = await fetch('/email/verify/confirm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    email: 'user@example.com',
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

1. **Two Endpoints**: Use `/email/verify` for requesting codes and `/email/verify/confirm` for verification
2. **New Response Format**: Returns `isNewUser`, `userState`, `flowType`, and `enochInstructions` for better flow control
3. **Testing Mode**: Use testing mode for development, accepts any 6-digit code
4. **Token Usage**: Include JWT in `Authorization: Bearer ${token}` for user requests
5. **Error Handling**: Includes `attemptsRemaining` for better UX
6. **Expiration**: JWT tokens last 7 days 
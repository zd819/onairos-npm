# Complete Authentication Flow Analysis

## 📋 All Authentication Flows - APIs, Responses, and Handling

### Overview
This document maps out all authentication flows for both new and existing users via email and Google sign-in.

---

## 🔐 Email Authentication Flow

### Flow 1: NEW User Email Authentication

#### Step 1: Request Verification Code
**API Call:**
```http
POST /email/verify
Headers:
  x-api-key: ona_xxx
  Authorization: Bearer ona_xxx
Body:
  {
    "email": "newuser@example.com"
  }
```

**Backend Response:**
```json
{
  "success": true,
  "message": "Verification code generated",
  "testingMode": true,
  "emailSent": false,
  "expiresIn": "30 minutes"
}
```

**Frontend Handling:**
- Displays code input screen
- Waits for user to enter 6-digit code

---

#### Step 2: Verify Code (NEW USER)
**API Call:**
```http
POST /email/verify/confirm
Headers:
  x-api-key: ona_xxx
  Authorization: Bearer ona_xxx
Body:
  {
    "email": "newuser@example.com",
    "code": "123456"
  }
```

**Backend Actions:**
1. ✅ Validates code
2. ✅ **CREATES NEW USER ACCOUNT** ← CRITICAL
3. ✅ Generates JWT token
4. ✅ Returns user data

**Backend Response:**
```json
{
  "success": true,
  "isNewUser": true,  ← TRUE for new users
  "userState": "new",
  "flowType": "onboarding",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "341",
    "userName": "newuser",
    "email": "newuser@example.com",
    "verified": true,
    "creationDate": "2025-12-14T07:00:00.000Z",
    "lastLogin": "2025-12-14T07:00:00.000Z"
  },
  "enochInstructions": {
    "recommendedFlow": "onboarding",
    "nextActionTitle": "Get Started"
  }
}
```

---

#### Step 3: Current BROKEN Code (My Fix)
**API Call (AFTER verification):**
```http
POST /getAccountInfo/email
Headers:
  x-api-key: ona_xxx
Body:
  {
    "Info": {
      "identifier": "newuser@example.com"
    }
  }
```

**Backend Response:**
```json
{
  "AccountInfo": {
    "email": "newuser@example.com",
    "userId": "341",
    // ... account data
  },
  "accountStatus": {
    "exists": true,  ← TRUE! Account was just created in Step 2!
    "hasTrainedModel": false,
    "hasPersonalityTraits": false,
    "connectedPlatforms": [],
    "needsDataConnection": true,
    "needsTraining": true,
    "canUseInference": false
  }
}
```

**Frontend Logic (BROKEN):**
```javascript
existingUser = accountStatus?.exists || false;  // TRUE (just created!)
isNewUser = !existingUser;                      // FALSE (WRONG!)
flowType = existingUser ? 'dataRequest' : 'onboarding'; // 'dataRequest' (WRONG!)
```

**Result:** NEW user incorrectly routed to dataRequest page ❌

---

### Flow 2: EXISTING User Email Authentication

#### Step 1: Request Verification Code
Same as new user (no difference at this stage)

#### Step 2: Verify Code (EXISTING USER)
**API Call:**
```http
POST /email/verify/confirm
Body:
  {
    "email": "existinguser@example.com",
    "code": "123456"
  }
```

**Backend Actions:**
1. ✅ Validates code
2. ✅ Finds EXISTING user account
3. ✅ Updates lastLogin
4. ✅ Generates JWT token
5. ✅ Returns user data with connections

**Backend Response:**
```json
{
  "success": true,
  "isNewUser": false,  ← FALSE for existing users
  "userState": "returning",
  "flowType": "returning_user",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "123",
    "userName": "existinguser",
    "email": "existinguser@example.com",
    "verified": true,
    "creationDate": "2024-01-15T10:30:00.000Z",
    "lastLogin": "2025-12-14T07:00:00.000Z"
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
        "connectedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "enochInstructions": {
    "skipOnboarding": true,
    "recommendedFlow": "dashboard"
  }
}
```

#### Step 3: Account Check (My Fix)
**API Call:**
```http
POST /getAccountInfo/email
```

**Backend Response:**
```json
{
  "AccountInfo": { /* existing user data */ },
  "accountStatus": {
    "exists": true,
    "hasTrainedModel": true,
    "hasPersonalityTraits": true,
    "connectedPlatforms": ["YouTube", "Twitter"],
    "needsDataConnection": false
  }
}
```

**Frontend Logic:**
```javascript
existingUser = accountStatus?.exists || false;  // TRUE (correct!)
isNewUser = !existingUser;                      // FALSE (correct!)
flowType = existingUser ? 'dataRequest' : 'onboarding'; // 'dataRequest' (correct!)
```

**Result:** EXISTING user correctly routed to dataRequest ✅

---

## 🔐 Google Sign-In Flow

### Flow 3: NEW User Google Authentication

#### Step 1: Google Sign-In (Frontend SDK)
**User Action:** Clicks "Continue with Google"

**Google Response:**
```javascript
{
  credential: "eyJhbGciOiJSUzI1NiIs...",  // JWT from Google
  clientId: "1030678346906-xxx.apps.googleusercontent.com"
}
```

**Frontend Decodes JWT:**
```javascript
{
  email: "newgoogleuser@gmail.com",
  name: "New User",
  picture: "https://...",
  email_verified: true
}
```

---

#### Step 2: Backend Notification (Optional)
**API Call:**
```http
POST /auth/google
Headers:
  x-api-key: ona_xxx
Body:
  {
    "credential": "eyJhbGciOiJSUzI1NiIs...",
    "email": "newgoogleuser@gmail.com",
    "userInfo": { /* Google user info */ }
  }
```

**Backend Actions:**
- Logs Google sign-in attempt
- Does NOT create user account (yet)
- May validate Google token

---

#### Step 3: Account Check (Before Account Creation)
**API Call:**
```http
POST /getAccountInfo/email
Body:
  {
    "Info": {
      "identifier": "newgoogleuser@gmail.com"
    }
  }
```

**Backend Response (NEW user):**
```json
{
  "AccountInfo": null,  ← No account found
  // OR
  // Empty response / 404
}
```

**Frontend Logic:**
```javascript
if (accountData.AccountInfo) {
  accountInfo = accountData.AccountInfo;
  accountStatus = accountData.accountStatus;
  existingUser = accountStatus?.exists || false;
} else {
  console.log('ℹ️ No existing account found - new user');
  existingUser = false;  // NEW USER!
}
```

---

#### Step 4: Frontend Routes User
```javascript
isNewUser = !existingUser;  // TRUE (correct!)
flowType = existingUser ? 'dataRequest' : 'onboarding'; // 'onboarding' (correct!)
```

**Result:** NEW Google user correctly routed to onboarding ✅

**Note:** User account will be created LATER during onboarding when they connect platforms.

---

### Flow 4: EXISTING User Google Authentication

#### Steps 1-2: Same as new user

#### Step 3: Account Check
**Backend Response (EXISTING user):**
```json
{
  "AccountInfo": {
    "email": "existinggoogleuser@gmail.com",
    "userId": "456",
    // ... existing account data
  },
  "accountStatus": {
    "exists": true,
    "hasTrainedModel": true,
    "hasPersonalityTraits": true,
    "connectedPlatforms": ["YouTube"],
    "needsDataConnection": false
  }
}
```

**Frontend Logic:**
```javascript
existingUser = accountStatus?.exists || false;  // TRUE (correct!)
isNewUser = !existingUser;                      // FALSE (correct!)
flowType = existingUser ? 'dataRequest' : 'onboarding'; // 'dataRequest' (correct!)
```

**Result:** EXISTING Google user correctly routed to dataRequest ✅

---

## 🐛 THE PROBLEM

### Why My Fix Broke New User Email Auth

**Timeline for NEW user:**
1. User enters email → `/email/verify` (request code)
2. User enters code → `/email/verify/confirm`
3. **Backend CREATES account** and returns `isNewUser: true`
4. **My code calls `/getAccountInfo/email`** ← PROBLEM!
5. Backend finds account (just created!) and returns `exists: true`
6. Frontend sees `exists: true` and routes to dataRequest ❌ WRONG!

**The Issue:**
- Email verification endpoint **CREATES** the account
- Account check happens **AFTER** account creation
- Account check always finds account exists (even for new users)
- New users incorrectly routed to dataRequest

### Why Google Sign-In Works

**Timeline for NEW Google user:**
1. User clicks Google sign-in
2. **My code calls `/getAccountInfo/email` BEFORE any account creation**
3. Backend returns null (account doesn't exist yet)
4. Frontend routes to onboarding ✅ CORRECT!
5. Account is created LATER during onboarding

**The Difference:**
- Google: Account check happens BEFORE account creation ✅
- Email: Account check happens AFTER account creation ❌

---

## ✅ THE SOLUTION

### Option 1: Trust the Verification Response (RECOMMENDED)

**For Email Auth:**
```javascript
// After /email/verify/confirm
const data = await verifyEmailCode({ baseUrl, apiKey, email, code });

// TRUST the backend's isNewUser field
const isNewUser = data.isNewUser;  // Backend knows if account was just created
const existingUser = !isNewUser;

// Optional: Only check account status for EXISTING users to get detailed data
if (!isNewUser) {
  // Call /getAccountInfo/email to get full account details
  const accountData = await fetch('/getAccountInfo/email', ...);
  accountInfo = accountData.AccountInfo;
  accountStatus = accountData.accountStatus;
} else {
  // New user - use data from verification response
  accountInfo = data.user;
  accountStatus = null;
}

onSuccess({
  email,
  verified: true,
  token: data.token,
  existingUser: existingUser,
  isNewUser: isNewUser,
  accountInfo: accountInfo,
  accountStatus: accountStatus,
  flowType: existingUser ? 'dataRequest' : 'onboarding'
});
```

### Option 2: Check Account Status BEFORE Verification (NOT RECOMMENDED)

This would require checking before sending the code, which adds complexity and doesn't align with the backend design.

---

## 📊 Complete Flow Matrix

| Flow | Step 1 | Step 2 | Step 3 | Routing | Status |
|------|--------|--------|--------|---------|--------|
| **New Email** | `/email/verify` | `/email/verify/confirm`<br>`isNewUser: true`<br>**Creates account** | `/getAccountInfo/email`<br>`exists: true` ❌ | dataRequest ❌ | **BROKEN** |
| **Existing Email** | `/email/verify` | `/email/verify/confirm`<br>`isNewUser: false` | `/getAccountInfo/email`<br>`exists: true` ✅ | dataRequest ✅ | **WORKS** |
| **New Google** | Google SDK | `/auth/google` (optional) | `/getAccountInfo/email`<br>`exists: false` ✅ | onboarding ✅ | **WORKS** |
| **Existing Google** | Google SDK | `/auth/google` (optional) | `/getAccountInfo/email`<br>`exists: true` ✅ | dataRequest ✅ | **WORKS** |

---

## 🎯 Key Takeaways

1. **Email verification creates the account** - The `/email/verify/confirm` endpoint creates new user accounts
2. **Backend knows best** - The `isNewUser` field in verification response is authoritative
3. **Timing matters** - Account check after creation will always find account exists
4. **Google is different** - Google sign-in checks account BEFORE any creation

---

## 🔧 Recommended Fix

**Trust the backend's `isNewUser` field from `/email/verify/confirm` response.**

Only call `/getAccountInfo/email` for existing users to get detailed account data (connections, traits, etc.).

This aligns with backend design and avoids the race condition.


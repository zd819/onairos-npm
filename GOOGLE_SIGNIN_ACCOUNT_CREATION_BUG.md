# 🐛 Google Sign-In Account Creation Bug

## Problem Summary

**New users signing in with Google are NOT getting their accounts created in the backend**, causing platform connection failures.

---

## 🔍 Root Cause Analysis

### Current Flow (BROKEN ❌)

```
1. User clicks "Sign in with Google"
   ↓
2. Google SDK returns user email (guglielmofonda@gmail.com)
   ↓
3. Frontend calls: POST /getAccountInfo/email
   Response: "No Account Found" (200 status, 240 bytes)
   ↓
4. ❌ Frontend marks user as new but DOES NOT create account
   ↓
5. User proceeds to onboarding (YouTube connection)
   ↓
6. Frontend calls: POST /youtube/authorize
   ↓
7. ❌ Backend checks for account in updateUserWithYoutubeConnection()
      → Account doesn't exist
      → Throws error: "Account doesn't exist"
   ↓
8. 💥 YouTube connection fails
```

### Backend Log Evidence

```
POST /getAccountInfo/email 200 151.678 ms - 240   ← "No Account Found"
... (health checks) ...
POST /youtube/authorize   ← Direct call without account creation!
```

**What's MISSING:**
- ❌ NO `/auth/google` call
- ❌ NO `/register/google-signup` call  
- ❌ NO account creation endpoint at all!

---

## 📂 Code Analysis

### Frontend: `src/components/EmailAuth.js`

**Lines 157-239: `handleOAuthSuccess` function**

```javascript
const handleOAuthSuccess = async (gmailEmail) => {
  try {
    setIsLoading(true);
    console.log('✅ Google OAuth completed successfully, email:', gmailEmail);

    // ✅ Step 1: Check if account exists
    const accountCheckResponse = await fetch(`${baseUrl}/getAccountInfo/email`, {
      method: 'POST',
      body: JSON.stringify({
        Info: { identifier: normalizedEmail }
      })
    });

    if (accountCheckResponse.ok) {
      const accountData = await accountCheckResponse.json();
      if (accountData.AccountInfo) {
        existingUser = accountStatus?.exists || false;
      } else {
        console.log('ℹ️ No existing account found - new user');
      }
    }

    // ❌ Step 2: MISSING - Should create account here if it doesn't exist!
    // Currently just calls onSuccess() without creating account

    setTimeout(() => {
      onSuccess({
        email: normalizedEmail,
        verified: true,
        token: null,  // ❌ No token because account was never created
        isNewUser: !existingUser,
        // ... other fields
      });
    }, 400);
    
  } catch (error) {
    console.error('❌ Error handling OAuth success:', error);
  }
};
```

**The Problem:**
- ✅ Checks if account exists
- ❌ If account doesn't exist, does NOT create it
- ❌ Does NOT call any backend endpoint to register the user
- ❌ Does NOT get a JWT token from the backend

### Backend: `sdk-integration/routes/youtube-enhanced.js`

**Lines 1679-1744: `updateUserWithYoutubeConnection` function**

```javascript
async function updateUserWithYoutubeConnection(OnairosUsername, youtubeChannelTitle, token, refresh_token, expiry_date_unix) {
    console.log(`[DEBUG] Starting updateUserWithYoutubeConnection with username: "${OnairosUsername}"`);
    
    // Try to find user by userName first, then by email
    let targetAccount = await User.findOne({ userName: OnairosUsername });
    
    if (!targetAccount) {
        targetAccount = await User.findOne({ email: OnairosUsername });
    }

    if (targetAccount) {
        // ✅ Update YouTube connection
        await User.updateOne(
            { _id: targetAccount._id },
            { $set: updateData }
        );
    } else {
        // ❌ Account doesn't exist - throws error
        console.error('[DEBUG] Account doesn\'t exist:', OnairosUsername);
        throw new Error('Account doesn\'t exist');  // 💥 This is what's failing
    }
}
```

**The Problem:**
- Backend EXPECTS the account to already exist
- If account doesn't exist, it throws an error
- Backend does NOT auto-create accounts during platform connections

---

## ✅ Solution: Add Account Creation Endpoint Call

### What Should Happen

After Google Sign-In, the frontend should call a backend endpoint to CREATE the account BEFORE proceeding to onboarding:

```javascript
// After Google Sign-In on client
const response = await fetch('https://api2.onairos.uk/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    credential: idToken  // The Google ID token from GoogleSignin.signIn()
  })
});

const data = await response.json();
// Returns: { success: true, token: 'jwt-token', userId: '...', email: '...' }
```

### Fixed Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Google SDK returns ID token + user email
   ↓
3. Frontend calls: POST /auth/google
   Body: { credential: idToken }
   ↓
4. ✅ Backend:
   - Verifies Google token
   - Creates account if doesn't exist
   - Returns JWT token
   ↓
5. Frontend saves JWT token and user data
   ↓
6. User proceeds to onboarding (YouTube connection)
   ↓
7. Frontend calls: POST /youtube/authorize
   ↓
8. ✅ Backend finds existing account
   ↓
9. ✅ YouTube connection succeeds
```

---

## 🔧 Required Changes

### Option 1: Frontend Calls `/auth/google` (RECOMMENDED)

**File:** `src/components/EmailAuth.js`

**Current code (lines 157-239):**
```javascript
const handleOAuthSuccess = async (gmailEmail) => {
  // ... check if account exists ...
  
  onSuccess({
    email: normalizedEmail,
    verified: true,
    token: null,  // ❌ No token
    isNewUser: !existingUser
  });
};
```

**Fixed code:**
```javascript
const handleOAuthSuccess = async (gmailEmail, googleIdToken) => {
  try {
    setIsLoading(true);
    
    // Step 1: Create/verify account with backend
    const authResponse = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        credential: googleIdToken,
        email: gmailEmail
      })
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with backend');
    }

    const authData = await authResponse.json();
    
    // Step 2: Check account status
    const accountCheckResponse = await fetch(`${baseUrl}/getAccountInfo/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        Info: { identifier: gmailEmail }
      })
    });

    let accountStatus = null;
    let existingUser = false;
    
    if (accountCheckResponse.ok) {
      const accountData = await accountCheckResponse.json();
      accountStatus = accountData.accountStatus;
      existingUser = accountStatus?.exists || false;
    }

    // Step 3: Return success with token
    setTimeout(() => {
      onSuccess({
        email: gmailEmail,
        verified: true,
        token: authData.token,  // ✅ JWT token from backend
        jwtToken: authData.token,
        isNewUser: !existingUser,
        existingUser: existingUser,
        accountStatus: accountStatus,
        userId: authData.userId
      });
    }, 400);
    
  } catch (error) {
    console.error('❌ Error handling OAuth success:', error);
    setError('Failed to continue with Google authentication. Please try again.');
    setIsLoading(false);
  }
};
```

**Also update the Google login handler:**
```javascript
const googleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });
      
      const userInfo = await userInfoResponse.json();
      
      // ✅ Pass both email AND the access token (can be used as credential)
      await handleOAuthSuccess(userInfo.email, tokenResponse.access_token);
      
    } catch (error) {
      console.error('❌ Error fetching Google user info:', error);
      setError('Failed to get your Google account information. Please try again.');
      setIsLoading(false);
    }
  },
  onError: (error) => {
    console.error('❌ Google Sign In failed:', error);
    setError('Failed to sign in with Google. Please try again.');
    setIsLoading(false);
  },
  scope: 'openid email profile',
  flow: 'implicit'
});
```

---

## 🎯 Backend Endpoint Needed

### Endpoint: `POST /auth/google`

**Request Body:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",  // Google ID token or access token
  "email": "user@gmail.com"  // Optional - can extract from token
}
```

**Response (Account Created):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // Onairos JWT token
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@gmail.com",
  "isNewUser": true,
  "accountCreated": true
}
```

**Response (Existing Account):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // Onairos JWT token
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@gmail.com",
  "isNewUser": false,
  "accountCreated": false
}
```

**Backend Implementation (Pseudo-code):**
```javascript
router.post('/auth/google', async (req, res) => {
  try {
    const { credential, email } = req.body;
    
    // Step 1: Verify Google token
    const googleUser = await verifyGoogleToken(credential);
    const userEmail = email || googleUser.email;
    
    // Step 2: Find or create user
    let user = await User.findOne({ 
      $or: [
        { email: userEmail },
        { userName: userEmail }
      ]
    });
    
    let isNewUser = false;
    
    if (!user) {
      // Create new user
      user = new User({
        email: userEmail,
        userName: userEmail,
        accounts: {},
        connections: {},
        createdAt: new Date(),
        ssoProvider: 'google',
        googleId: googleUser.sub
      });
      await user.save();
      isNewUser = true;
      console.log('✅ Created new user via Google Sign-In:', userEmail);
    } else {
      console.log('✅ Existing user logged in via Google:', userEmail);
    }
    
    // Step 3: Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        provider: 'google'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Step 4: Return response
    res.json({
      success: true,
      token: jwtToken,
      userId: user._id,
      email: user.email,
      isNewUser: isNewUser,
      accountCreated: isNewUser
    });
    
  } catch (error) {
    console.error('❌ Error in /auth/google:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## 📋 Testing Steps

### Test Case 1: New User

1. Clear database for test email: `guglielmofonda@gmail.com`
2. Click "Sign in with Google"
3. ✅ Should call `/auth/google` with Google credential
4. ✅ Backend should create account
5. ✅ Backend should return JWT token
6. ✅ Frontend should save token
7. User proceeds to onboarding
8. ✅ YouTube connection should succeed

### Test Case 2: Existing User

1. User `guglielmofonda@gmail.com` already exists in database
2. Click "Sign in with Google"
3. ✅ Should call `/auth/google` with Google credential
4. ✅ Backend should find existing account
5. ✅ Backend should return JWT token
6. ✅ Frontend should save token
7. ✅ Should skip onboarding and go to data request

---

## 🚦 Current Status

- ❌ Frontend does NOT call `/auth/google`
- ❌ No account creation after Google Sign-In
- ❌ Backend endpoint `/auth/google` may not exist
- ❌ YouTube connection fails for new Google users

---

## 📞 Backend Team Action Items

1. **Create `/auth/google` endpoint** that:
   - Accepts Google credential (ID token or access token)
   - Verifies the credential with Google
   - Creates account if it doesn't exist
   - Returns Onairos JWT token

2. **Alternative: Update YouTube connector** to auto-create accounts:
   - Modify `updateUserWithYoutubeConnection()` to create account if missing
   - This is a workaround - proper fix is option 1

---

## 💡 Why This Happened

The frontend Google Sign-In was migrated to use the frontend SDK (instead of backend OAuth redirect), but the account creation step was forgotten. The frontend now:

1. ✅ Gets email from Google (frontend SDK)
2. ✅ Checks if account exists (`/getAccountInfo/email`)
3. ❌ Assumes account creation happens somewhere else (it doesn't!)
4. ❌ Proceeds without creating account or getting JWT token

The old backend OAuth flow would have created the account during the OAuth callback. The new frontend SDK flow skipped this step.

---

## 🎯 Recommendation

**Option 1 (PROPER FIX):** Create `/auth/google` endpoint and update frontend to call it
- ✅ Clean architecture
- ✅ Proper authentication flow
- ✅ Works for all use cases
- ✅ Returns JWT token for session management

**Option 2 (WORKAROUND):** Update platform connectors to auto-create accounts
- ⚠️ Not ideal - connectors shouldn't create accounts
- ⚠️ Each platform would need the same fix
- ⚠️ No centralized authentication
- ❌ No JWT token returned

**Recommended: Option 1**


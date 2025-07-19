# Web OAuth Connectors Overview

## 🌐 Universal Web OAuth Pattern

All web OAuth connectors follow the same 2-step pattern:

### Step 1: Authorization Request
**Pattern**: `POST /{platform}/authorize`

**Request Format**:
```json
{
  "session": {
    "username": "user123"
  }
}
```

**Response Format**:
```json
{
  "{platform}URL": "https://platform.com/oauth/authorize?client_id=...&state=..."
}
```

### Step 2: OAuth Callback  
**Pattern**: `GET /{platform}/callback?code=...&state=...`

**Flow**: Code Exchange → User Info → Database Update → Redirect Home

---

## 🔗 Supported Platforms

### YouTube
```javascript
// Authorization
POST /youtube/authorize
{ "session": { "username": "user123" } }
→ { "youtubeURL": "https://accounts.google.com/oauth/v2/auth?..." }

// Callback Flow
GET /youtube/callback?code=AUTH_CODE&state=ENCODED_STATE
→ Exchange code for tokens
→ Fetch YouTube channel info
→ Update user.accounts.youtube
→ Redirect to https://onairos.uk/Home
```

### LinkedIn  
```javascript
// Authorization (OpenID Connect)
POST /linkedin/authorize
{ "session": { "username": "user123" } }
→ { "linkedinURL": "https://www.linkedin.com/oauth/v2/authorization?..." }

// Callback Flow
GET /linkedin/callback?code=AUTH_CODE&state=ENCODED_STATE
→ Exchange code for tokens
→ Fetch LinkedIn profile via /v2/userinfo
→ Update user.accounts.linkedin
→ Redirect to https://onairos.uk/Home
```

### Reddit
```javascript
// Authorization
POST /reddit/authorize  
{ "session": { "username": "user123" } }
→ { "redditURL": "https://www.reddit.com/api/v1/authorize?..." }

// Callback Flow
GET /reddit/callback?code=AUTH_CODE&state=ENCODED_STATE
→ Exchange code for tokens
→ Fetch Reddit user info via /api/v1/me
→ Update user.accounts.reddit
→ Redirect to https://onairos.uk/Home
```

### Pinterest
```javascript
// Authorization
POST /pinterest/authorize
{ "session": { "username": "user123" } }  
→ { "pinterestURL": "https://www.pinterest.com/oauth/?..." }

// Callback Flow
GET /pinterest/callback?code=AUTH_CODE&state=ENCODED_STATE
→ Exchange code for tokens via /v5/oauth/token
→ Fetch Pinterest username
→ Update user.accounts.pinterest
→ Redirect to https://onairos.uk/Home
```

### Instagram
```javascript
// Authorization
POST /instagram/authorize
{ "session": { "username": "user123" } }
→ { "instagramURL": "https://www.instagram.com/oauth/authorize?..." }

// Callback Flow  
GET /instagram/callback?code=AUTH_CODE&state=ENCODED_STATE
→ Exchange code for access_token
→ Fetch Instagram user info via /me
→ Update user.accounts.instagram
→ Redirect to https://onairos.uk/Home
```

### GitHub
```javascript
// Authorization
POST /github/authorize
{ "session": { "username": "user123" } }
→ { "githubURL": "https://github.com/login/oauth/authorize?..." }

// Callback Flow
GET /github/callback?code=AUTH_CODE&state=ENCODED_STATE
→ Exchange code for access_token
→ Fetch GitHub user info via /user
→ Update user.accounts.github
→ Redirect to https://onairos.uk/Home
```

### Facebook
```javascript
// Authorization
POST /facebook/authorize
{ "session": { "username": "user123" } }
→ { "facebookURL": "https://www.facebook.com/v15.0/dialog/oauth?..." }

// Callback Flow
GET /facebook/callback?code=AUTH_CODE&state=ENCODED_STATE
→ Exchange code for access_token
→ Fetch Facebook profile via /me
→ Update user.accounts.facebook
→ Redirect to https://onairos.uk/Home
```

### Gmail
```javascript
// Authorization
POST /gmail/authorize
{ "session": { "username": "user123" } }
→ { "gmailURL": "https://accounts.google.com/oauth/v2/auth?..." }

// Callback Flow
GET /gmail/callback?code=AUTH_CODE&state=ENCODED_STATE
→ Exchange code for tokens
→ Fetch Gmail profile via Google API
→ Update user.accounts.gmail
→ Redirect to https://onairos.uk/Home
```

### Notion
```javascript
// Authorization  
POST /notion/authorize
{ "session": { "username": "user123" } }
→ { "notionURL": "https://api.notion.com/v1/oauth/authorize?..." }

// Callback Flow
GET /notion/callback?code=AUTH_CODE&state=ENCODED_STATE
→ Exchange code for access_token via /v1/oauth/token
→ Update user.accounts.notion
→ Redirect to https://onairos.uk/Home
```

---

## 🔧 Technical Implementation

### State Object Pattern
```javascript
// All platforms use this state structure
const stateObject = {
  connectionType: 'youtube', // platform name
  timestamp: Date.now(),     // for expiry check
  username: req.body.session.username // user identifier
};

// Encoded as base64 for URL safety
const state = Buffer.from(JSON.stringify(stateObject)).toString('base64');
```

### Token Exchange Pattern
```javascript
// Common pattern across platforms
const tokenResponse = await fetch(PLATFORM_TOKEN_URL, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${base64Credentials}`, // or 'Bearer'
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}`
});

const { access_token, refresh_token, expires_in } = await tokenResponse.json();
```

### User Info Fetching
```javascript
// Fetch user details from platform API
const userResponse = await fetch(PLATFORM_USER_INFO_URL, {
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'User-Agent': 'Onairos/1.0.0' // Required for some platforms
  }
});

const userInfo = await userResponse.json();
```

### Database Update Pattern
```javascript
// Update user's account connections
await User.updateOne(
  { userName: onairosUsername },
  {
    $set: {
      [`accounts.${platform}`]: {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry: new Date(Date.now() + expires_in * 1000),
        userName: platformUsername,
        connectedAt: new Date()
      },
      [`connections.${platform}`]: new Date().toISOString()
    }
  }
);
```

---

## 🎯 Frontend Integration

### Step 1: Get Authorization URL
```javascript
const getAuthUrl = async (platform, username) => {
  const response = await fetch(`/api/${platform}/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session: { username: username }
    })
  });
  
  const data = await response.json();
  return data[`${platform}URL`]; // e.g., youtubeURL, linkedinURL
};

// Usage
const authUrl = await getAuthUrl('youtube', 'user123');
window.location.href = authUrl; // Redirect user to OAuth provider
```

### Step 2: Handle Callback (Automatic)
The callback is handled server-side and redirects to `https://onairos.uk/Home` automatically.

### Step 3: Check Connection Status
```javascript
const checkConnections = async (username) => {
  const response = await fetch(`/connected-accounts?username=${username}`);
  const data = await response.json();
  
  return data.connectedAccounts; // Array of connected platforms
};
```

---

## 🔍 Connection Verification

### Check Platform Connection
```javascript
// Get all connected accounts
GET /connected-accounts?username=user123
→ {
  "connectedAccounts": [
    {
      "platform": "YouTube",
      "accountName": "My Channel",
      "connectedAt": "2024-01-15T10:30:00Z",
      "status": "active",
      "hasData": true
    }
  ]
}

// Platform-specific health check
GET /youtube/connection-status/user123
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

## ⚙️ Environment Variables Required

```bash
# YouTube
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret  
YOUTUBE_REDIRECT_URI=https://api2.onairos.uk/youtube/callback

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://api2.onairos.uk/linkedin/callback

# Reddit
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_REDIRECT_URI=https://api2.onairos.uk/reddit/callback

# Pinterest
PINTEREST_CLIENT_ID=your_pinterest_client_id
PINTEREST_CLIENT_SECRET=your_pinterest_client_secret
PINTEREST_REDIRECT_URI=https://api2.onairos.uk/pinterest/callback

# Instagram
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
INSTAGRAM_REDIRECT_URI=https://api2.onairos.uk/instagram/callback

# GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=https://api2.onairos.uk/github/callback

# Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=https://api2.onairos.uk/facebook/callback

# Gmail/Google
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REDIRECT_URI=https://api2.onairos.uk/gmail/callback

# Notion
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
NOTION_REDIRECT_URI=https://api2.onairos.uk/notion/callback
```

---

## 🚨 Error Handling

### Common Errors
- **Missing Code/State**: OAuth provider didn't return required parameters
- **State Expired**: Authentication took too long (timeouts vary by platform)
- **Token Exchange Failed**: Invalid credentials or OAuth configuration
- **User Info Failed**: Platform API issues or insufficient permissions

### Debugging
1. Check environment variables are set correctly
2. Verify redirect URIs match exactly in OAuth app settings
3. Check platform-specific scopes and permissions
4. Monitor callback logs for specific error messages

---

## ✅ Key Points

- **Consistent Pattern**: All platforms follow the same authorize → callback flow
- **State Management**: Username encoded in state for user tracking
- **Automatic Redirects**: Callbacks redirect to home page automatically  
- **Token Storage**: Access/refresh tokens stored in `user.accounts.{platform}`
- **Connection Tracking**: Connection timestamps in `user.connections.{platform}`
- **Error Resilience**: Comprehensive error handling and timeouts
- **Platform Standards**: Follows each platform's OAuth 2.0 implementation 
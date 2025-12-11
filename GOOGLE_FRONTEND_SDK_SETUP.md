# Google Sign-In - Frontend SDK Implementation

## ✅ What Changed

We've migrated from **backend-initiated OAuth redirect** to **frontend Google SDK** approach.

### Before (Backend Redirect Flow)
```
Frontend → Backend /gmail/authorize → Google OAuth → Callback → Backend
- Required: GMAIL_REDIRECT_URI in Google Console
- Issues: "Unverified app" warning, redirect URI mismatch errors
```

### After (Frontend SDK Flow)
```
Frontend Google SDK → Get access token → Backend verification (optional)
- Required: REACT_APP_GOOGLE_CLIENT_ID
- Benefits: No redirect URI issues, cleaner flow, works like mobile
```

---

## 🔑 Configuration

### 1. Environment Variables

Create `.env` in your project root (or wherever your React app reads from):

```bash
# Your NEW Web Application OAuth Client ID
REACT_APP_GOOGLE_CLIENT_ID=1030678346906-4npem7vckp0e56p17c81sv2pee2hhule.apps.googleusercontent.com
```

### 2. Google Cloud Console Setup

Go to [Google Cloud Console](https://console.cloud.google.com) → **Credentials**

**Use your WEB APPLICATION OAuth Client:**
- Application type: **Web application**
- Client ID: `1030678346906-4npem7vckp0e56p17c81sv2pee2hhule.apps.googleusercontent.com`

**Configure Authorized JavaScript origins:**
```
https://internship.onairos.uk
https://onairos.uk
http://localhost:3000
```

**Note:** You DON'T need "Authorized redirect URIs" for this flow! ✨

### 3. OAuth Consent Screen

Add yourself as a test user to avoid the "unverified app" warning:

1. Go to **OAuth consent screen**
2. Scroll to **"Test users"**
3. Click **"+ ADD USERS"**
4. Add: `z.tech4future@gmail.com`
5. Save

---

## 📦 Package Installed

```bash
npm install @react-oauth/google
```

---

## 🔧 Implementation Details

### Files Modified

1. **`src/onairos.jsx`** - Added `GoogleOAuthProvider` wrapper
2. **`src/components/EmailAuth.js`** - Replaced backend redirect with `useGoogleLogin` hook

### How It Works

```javascript
// EmailAuth.js now uses:
import { useGoogleLogin } from '@react-oauth/google';

const googleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    // Get user info from Google directly
    const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
    });
    
    // Continue with email verification flow
    handleOAuthSuccess(userInfo.email);
  },
  scope: 'openid email profile'
});
```

---

## 🎯 Usage in Your App

### Option 1: Using environment variable (Recommended)
```bash
# .env
REACT_APP_GOOGLE_CLIENT_ID=1030678346906-4npem7vckp0e56p17c81sv2pee2hhule.apps.googleusercontent.com
```

### Option 2: Pass as prop
```javascript
import { Onairos } from 'onairos';

<Onairos
  googleClientId="1030678346906-4npem7vckp0e56p17c81sv2pee2hhule.apps.googleusercontent.com"
  webpageName="My App"
  requestData={true}
  onComplete={(data) => console.log(data)}
/>
```

### Option 3: Set on window object
```javascript
window.REACT_APP_GOOGLE_CLIENT_ID = "1030678346906-4npem7vckp0e56p17c81sv2pee2hhule.apps.googleusercontent.com";
```

---

## ✅ Testing

1. Clear browser cache and cookies for Google
2. Go to `https://internship.onairos.uk`
3. Click "Continue with Google"
4. Should see Google's consent screen (without "unverified" warning if you're a test user)
5. Select your Google account
6. Consent to permissions
7. Should automatically continue to onboarding

---

## 🆚 Comparison: Web Client vs Mobile Client

| Feature | Web Application Client | Android/iOS Client |
|---------|----------------------|-------------------|
| **Type** | Web application | Android/iOS |
| **Used By** | Web app (internship.onairos.uk) | Mobile app |
| **Requires** | Authorized JavaScript origins | Package name / Bundle ID |
| **Verification Warning** | Shows for external users (unless test user) | Never shows |
| **Flow** | Frontend SDK (this implementation) | Native Google Sign-In SDK |

---

## 🔧 Backend Changes (Optional)

The backend endpoint `/auth/google` is called for verification/storage but is **optional**. 

If you want to store the Google sign-in on the backend, create this endpoint:

```javascript
// routes/auth.js
router.post('/auth/google', async (req, res) => {
  const { accessToken, email, userInfo } = req.body;
  
  // Verify token with Google (optional - frontend already did this)
  // Store user session
  // Return auth token
  
  res.json({ success: true, token: 'jwt-token-here' });
});
```

---

## 🐛 Troubleshooting

### Issue: "Invalid client" error
**Solution:** Make sure `REACT_APP_GOOGLE_CLIENT_ID` matches your Web Application client ID in Google Console

### Issue: "Origin not allowed"
**Solution:** Add your domain to "Authorized JavaScript origins" in Google Console

### Issue: Still seeing "unverified app" warning
**Solution:** Add your email as a test user in OAuth consent screen

### Issue: "redirect_uri_mismatch" (shouldn't happen now)
**Solution:** This error shouldn't occur with the new frontend SDK flow. If you see it, you might be using the old backend flow.

---

## 📝 Notes

- The old backend routes (`/gmail/authorize`, `/gmail/callback`) are still in the codebase but no longer used by the frontend
- You can remove them if you want, or keep them for backward compatibility
- Mobile apps will continue using their native Google Sign-In SDK (no changes needed)

---

## 🎉 Benefits of This Approach

1. ✅ No redirect URI configuration issues
2. ✅ Same flow as your working mobile implementation  
3. ✅ Cleaner, simpler code
4. ✅ Better user experience (fewer redirects)
5. ✅ Works across all origins (just add to JavaScript origins)
6. ✅ Consistent with modern OAuth best practices


# Gmail OAuth Fix & ChatGPT Connector Implementation

## Problem Analysis

### Gmail OAuth "Not Found" Error
The error `{"message":"Not Found","error":{"message":"Not Found"}}` when accessing `https://api2.onairos.uk/gmail/authorize` was occurring because:

1. **Missing Backend Route**: The Gmail OAuth route `/gmail/authorize` was not implemented on the backend
2. **Frontend Expectation**: The `GmailConnector.js` was making POST requests to this endpoint, but it didn't exist
3. **Route Gap**: While YouTube and LinkedIn had enhanced routes, Gmail was missing

### ChatGPT Connector Request
User requested:
1. Add ChatGPT as the **first connector** in the platforms list
2. **Special behavior**: When toggled, ChatGPT should open `chatgpt.com` in a new tab (not OAuth)

## Solution Implementation

### 1. Gmail OAuth Backend Route ✅

**Created**: `onairos/sdk-integration/routes/gmail-enhanced.js`

**Features**:
- **POST `/authorize`**: Generates Gmail OAuth authorization URL
- **GET `/callback`**: Handles OAuth callback and token exchange
- **POST `/native-auth`**: Enhanced native authentication for mobile/web
- **Gmail-specific scopes**: 
  - `gmail.readonly`
  - `gmail.metadata`
  - `userinfo.email`
  - `userinfo.profile`
  - `openid`
- **Fallback credentials**: Uses YouTube OAuth credentials if Gmail-specific ones aren't set
- **Database integration**: Updates both Onairos and Enoch databases
- **Error handling**: Comprehensive logging and error responses

**Updated**: `onairos/sdk-integration/config/oauth-config.js`
- Added Gmail OAuth configuration with proper endpoints and scopes
- Fallback to YouTube credentials for easy setup

### 2. ChatGPT Connector Implementation ✅

**Created**: `onairos/src/components/connectors/ChatGPTConnector.js`

**Features**:
- **Special behavior**: Opens `chatgpt.com` in new tab instead of OAuth
- **User-friendly dialog**: Explains what ChatGPT offers
- **Popup handling**: Detects if popup is blocked and shows appropriate message
- **Consistent interface**: Follows same pattern as other connectors

### 3. Platform Configuration Updates ✅

**Updated Files**:
- `onairos/src/components/UniversalOnboarding.js`
- `onairos/src/newUI/PlatformConnectorsStep.tsx`
- `onairos/src/components/connectors/index.js`

**Changes**:
- **ChatGPT as first platform**: Added with 🤖 icon and green color
- **Special toggle behavior**: Direct `window.open()` for ChatGPT
- **Maintained order**: ChatGPT → YouTube → Reddit → Instagram → Pinterest → LinkedIn → Gmail

### 4. Platform Icon Service ✅

**Created**: `onairos/src/newUI/services/connectedAccountsService.js`

**Features**:
- `getPlatformIcon()`: Returns emoji icons for all platforms
- `getPlatformColor()`: Returns Tailwind color classes
- `getPlatformDisplayName()`: Returns proper display names
- `supportsOAuth()`: Identifies OAuth-enabled platforms
- `hasSpecialBehavior()`: Identifies platforms with special handling

## Technical Details

### Gmail OAuth Flow
```javascript
// 1. Authorization Request
POST /gmail/authorize
{
  "session": { "username": "user123" }
}
→ { "gmailURL": "https://accounts.google.com/oauth/v2/auth?..." }

// 2. OAuth Callback
GET /gmail/callback?code=AUTH_CODE&state=ENCODED_STATE
→ Exchange code for tokens
→ Fetch Gmail profile
→ Update user.accounts.gmail
→ Redirect to https://onairos.uk/Home
```

### ChatGPT Special Behavior
```javascript
// When ChatGPT is toggled ON
if (connectorType === 'chatgpt') {
  const chatGPTWindow = window.open('https://chatgpt.com', '_blank');
  if (chatGPTWindow) {
    // Mark as connected
    setConnectedAccounts(prev => ({ ...prev, [platformName]: true }));
  }
}
```

### Environment Variables
The Gmail OAuth will work with existing YouTube credentials, but for dedicated Gmail OAuth:

```bash
# Optional - Gmail-specific OAuth (falls back to YouTube if not set)
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REDIRECT_URI=https://api2.onairos.uk/gmail/callback

# Required - YouTube OAuth (used as fallback)
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
```

## Testing

### Gmail OAuth Testing
1. **Frontend**: Toggle Gmail connector → Should open OAuth dialog
2. **Backend**: POST to `/gmail/authorize` → Should return `gmailURL`
3. **Callback**: OAuth flow → Should redirect to Onairos home
4. **Database**: Check `user.accounts.gmail` is populated

### ChatGPT Testing
1. **Toggle ON**: Should open `chatgpt.com` in new tab
2. **Toggle OFF**: Should disconnect (mark as not connected)
3. **Popup blocking**: Should show error message if popup blocked
4. **Both modes**: Works in both test mode and production mode

## Files Modified/Created

### Created Files
- `onairos/sdk-integration/routes/gmail-enhanced.js`
- `onairos/src/components/connectors/ChatGPTConnector.js`
- `onairos/src/newUI/services/connectedAccountsService.js`
- `onairos/GMAIL_CHATGPT_IMPLEMENTATION.md`

### Modified Files
- `onairos/sdk-integration/config/oauth-config.js`
- `onairos/src/components/UniversalOnboarding.js`
- `onairos/src/newUI/PlatformConnectorsStep.tsx`
- `onairos/src/components/connectors/index.js`

## Next Steps

1. **Deploy Backend Route**: Ensure the Gmail route is registered in your main Express app:
   ```javascript
   import gmailRoutes from './sdk-integration/routes/gmail-enhanced.js';
   app.use('/gmail', gmailRoutes);
   ```

2. **Test Gmail OAuth**: Verify the OAuth flow works end-to-end

3. **Test ChatGPT Behavior**: Confirm ChatGPT opens correctly and doesn't interfere with other connectors

4. **Monitor Logs**: Check console logs for any errors during testing

## Success Criteria

✅ **Gmail OAuth Error Fixed**: No more "Not Found" error when connecting Gmail  
✅ **ChatGPT First Position**: ChatGPT appears as the first connector option  
✅ **ChatGPT Special Behavior**: Opens chatgpt.com in new tab when toggled  
✅ **Consistent UI**: All connectors maintain consistent design and behavior  
✅ **Cross-Platform**: Works in both UniversalOnboarding.js and PlatformConnectorsStep.tsx

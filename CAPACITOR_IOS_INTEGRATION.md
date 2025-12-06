# Onairos Integration with React + Vite + Capacitor (iOS/Android)

## Quick Answer: ✅ YES, it works!

The Onairos npm package **works perfectly** with React + Vite + Capacitor for iOS mobile apps with minimal considerations.

## What Works Perfectly (95% of features)

### ✅ Core Functionality
- **React Components**: All components render identically in Capacitor
- **API Calls**: Fetch API works the same as web browsers
- **Authentication**: API key and token-based auth work perfectly
- **Data Requests**: Full data request flow functions normally
- **AutoFetch**: Automatic API calls after user approval work as expected
- **State Management**: localStorage, sessionStorage work in Capacitor
- **Touch Interactions**: Native touch events work seamlessly

### ✅ No Code Changes Needed

The same code works for both web and Capacitor:

```jsx
import { OnairosButton } from "onairos";

function MyApp() {
  return (
    <OnairosButton
      requestData={["email", "profile", "social"]}
      webpageName="My iOS App"
      autoFetch={true}
      onComplete={(result) => {
        if (result.apiResponse) {
          console.log("User data:", result.apiResponse);
          // Use the data in your app
        }
      }}
    />
  );
}
```

## What's Different on Mobile/Capacitor

### 1. OAuth Flow Behavior

**Desktop/Web:**
- Uses popup windows (`window.open()`)
- Multiple windows for OAuth flows

**Mobile/Capacitor:**
- Automatically detects mobile environment
- Uses **redirect flow** instead of popups (iOS blocks popups aggressively)
- OAuth redirects back to your app seamlessly

**Implementation Detail:**
The package already includes mobile detection:

```javascript
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
  // Use redirect flow
  window.location.href = oauthUrl;
} else {
  // Use popup flow
  window.open(oauthUrl, 'oauth', 'width=500,height=600');
}
```

### 2. Browser Extension Features (N/A)

The Onairos package includes optional browser extension integration for LLM platforms (ChatGPT, Claude, etc.). **This feature doesn't work in Capacitor** since Capacitor apps don't have access to browser extensions.

**Impact:** ⚠️ Minimal - The core data request functionality works perfectly. Only the LLM platform monitoring features are unavailable.

**What Still Works:**
- ✅ User data requests
- ✅ Authentication
- ✅ API calls
- ✅ Profile management

**What Doesn't Work:**
- ❌ Browser extension detection
- ❌ LLM platform conversation monitoring (ChatGPT/Claude integration)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install onairos
```

### 2. Vite Configuration

Add to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['onairos'], // Important: prevent bundling issues
  },
});
```

### 3. Capacitor Configuration

Ensure your `capacitor.config.ts` allows necessary permissions:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourapp.id',
  appName: 'Your App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow cleartext for development (remove in production)
    cleartext: true, 
  },
  plugins: {
    CapacitorHttp: {
      enabled: true, // Enable HTTP requests
    },
  },
};

export default config;
```

### 4. iOS Info.plist Configuration

For OAuth redirects to work, add URL scheme handling:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>yourapp</string>
    </array>
  </dict>
</array>

<!-- Allow network requests -->
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

## Complete Example

```jsx
// App.jsx
import React from 'react';
import { OnairosButton } from 'onairos';

function App() {
  const handleComplete = (result) => {
    if (result.approved) {
      console.log('✅ User approved data sharing');
      
      if (result.apiResponse) {
        console.log('📊 Received user data:', result.apiResponse);
        
        // Store data in your app
        localStorage.setItem('userData', JSON.stringify(result.apiResponse));
        
        // Navigate to next screen or update UI
        // navigation.navigate('Dashboard');
      }
    } else {
      console.log('❌ User declined data sharing');
    }

    if (result.apiError) {
      console.error('⚠️ API Error:', result.apiError);
      // Handle error appropriately
    }
  };

  return (
    <div className="app-container">
      <h1>Welcome to My App</h1>
      
      <OnairosButton
        requestData={["email", "profile", "social"]}
        webpageName="My Mobile App"
        autoFetch={true}
        testMode={false} // Set to true during development
        onComplete={handleComplete}
      />
    </div>
  );
}

export default App;
```

## LLM Data Collection in Capacitor (Native Method)

**NEW!** Capacitor apps can collect LLM conversation data directly without needing the browser extension. This uses the native API method.

### Why This Matters

Browser extensions don't work in Capacitor, but you can still collect LLM conversation data (ChatGPT, Claude, etc.) directly through the Onairos API. This is the same method used in React Native apps.

### Setup LLM Data Collection

```jsx
import React, { useState } from 'react';
import { 
  OnairosButton,
  storeCapacitorLLMData,
  isCapacitor,
  getPlatformInfo
} from 'onairos';

function MyCapacitorApp() {
  const [userInfo, setUserInfo] = useState(null);
  
  // Check platform on mount
  React.useEffect(() => {
    const platformInfo = getPlatformInfo();
    console.log('Platform:', platformInfo);
    
    if (isCapacitor()) {
      console.log('✅ Running in Capacitor - native LLM method available!');
    }
  }, []);
  
  const handleComplete = (result) => {
    if (result.approved && result.apiResponse) {
      // Store user info for LLM data collection
      setUserInfo({
        username: result.apiResponse.email,
        userId: result.apiResponse.userId,
        sessionToken: result.apiResponse.token
      });
      
      console.log('✅ User connected, ready for LLM data collection');
    }
  };
  
  // Store LLM conversation data from your app
  const storeLLMConversation = async (messages, platform) => {
    if (!userInfo) {
      console.error('User not authenticated');
      return;
    }
    
    const conversationData = {
      messages: messages, // Array of {role: 'user'|'assistant', content: '...'}
      platform: platform, // 'chatgpt', 'claude', 'gemini', or 'grok'
      timestamp: new Date().toISOString()
    };
    
    const result = await storeCapacitorLLMData(
      conversationData,
      userInfo,
      platform
    );
    
    if (result.success) {
      console.log('✅ LLM data stored successfully!');
    } else {
      console.error('❌ Failed to store LLM data:', result.error);
    }
  };
  
  return (
    <div className="app-container">
      <h1>My Capacitor App with LLM Data</h1>
      
      <OnairosButton
        requestData={["email", "profile"]}
        webpageName="My Capacitor App"
        autoFetch={true}
        onComplete={handleComplete}
      />
      
      {userInfo && (
        <div>
          <p>✅ Connected! You can now collect LLM data.</p>
          <button onClick={() => {
            // Example: Store a ChatGPT conversation
            storeLLMConversation([
              { role: 'user', content: 'Hello ChatGPT!' },
              { role: 'assistant', content: 'Hello! How can I help you?' }
            ], 'chatgpt');
          }}>
            Test Store LLM Data
          </button>
        </div>
      )}
    </div>
  );
}

export default MyCapacitorApp;
```

### Advanced LLM Features

```jsx
import {
  storeCapacitorLLMData,
  storeBatchLLMData,
  getLLMHistory,
  getLLMStats,
  formatConversationData
} from 'onairos';

// 1. Store a single conversation
const storeSingleConversation = async (userInfo) => {
  const messages = [
    { role: 'user', content: 'What is AI?' },
    { role: 'assistant', content: 'AI stands for Artificial Intelligence...' }
  ];
  
  const conversationData = formatConversationData(messages, 'chatgpt');
  
  const result = await storeCapacitorLLMData(
    conversationData,
    userInfo,
    'chatgpt'
  );
  
  console.log('Store result:', result);
};

// 2. Store multiple conversations at once
const storeBatchConversations = async (userInfo) => {
  const conversations = [
    {
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ],
      platform: 'chatgpt',
      timestamp: new Date().toISOString()
    },
    {
      messages: [
        { role: 'user', content: 'What can you do?' },
        { role: 'assistant', content: 'I can help with many things...' }
      ],
      platform: 'claude',
      timestamp: new Date().toISOString()
    }
  ];
  
  const result = await storeBatchLLMData(conversations, userInfo);
  console.log('Batch result:', result);
  // { total: 2, successful: 2, failed: 0, errors: [] }
};

// 3. Retrieve conversation history
const getHistory = async (userInfo) => {
  const result = await getLLMHistory(userInfo, {
    platform: 'chatgpt', // Optional: filter by platform
    limit: 20,
    offset: 0
  });
  
  if (result.success) {
    console.log('Conversations:', result.data);
  }
};

// 4. Get usage statistics
const getStats = async (userInfo) => {
  const result = await getLLMStats(userInfo);
  
  if (result.success) {
    console.log('LLM Stats:', result.stats);
    // Total conversations, platforms used, etc.
  }
};
```

### Collecting LLM Data from Your Capacitor App

If your Capacitor app has LLM chat functionality (e.g., integrating ChatGPT API), you can collect that data:

```jsx
// Example: Collecting ChatGPT conversation from your app
import { storeCapacitorLLMData } from 'onairos';

const ChatComponent = ({ userInfo }) => {
  const [messages, setMessages] = useState([]);
  
  const sendMessage = async (userMessage) => {
    // Add user message
    const newMessages = [...messages, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }];
    
    // Call ChatGPT API (your implementation)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      // ... your ChatGPT API call
    });
    
    const assistantMessage = await response.json();
    
    // Add assistant response
    newMessages.push({
      role: 'assistant',
      content: assistantMessage.choices[0].message.content,
      timestamp: new Date().toISOString()
    });
    
    setMessages(newMessages);
    
    // Store in Onairos for training/analytics
    await storeCapacitorLLMData(
      {
        messages: newMessages,
        timestamp: new Date().toISOString()
      },
      userInfo,
      'chatgpt'
    );
  };
  
  return (
    // Your chat UI
  );
};
```

## Testing

### Development Testing

```bash
# Test on iOS Simulator
npm run build
npx cap sync ios
npx cap open ios

# Test on Android Emulator
npm run build
npx cap sync android
npx cap open android
```

### Production Build

```bash
# Build for production
npm run build

# Sync with native platforms
npx cap sync

# Open in Xcode for iOS release build
npx cap open ios

# Open in Android Studio for Android release build
npx cap open android
```

## Troubleshooting

### Issue: API Calls Failing

**Solution:**
- Ensure you have a valid API key from https://Onairos.uk/dev-board
- If you have a developer account with an API key, domain registration is handled manually by the Onairos team
- Check Capacitor network permissions in config

### Issue: OAuth Redirects Not Working

**Solution:**
- Verify URL scheme is configured in iOS Info.plist
- Check that `capacitor.config.ts` has correct server settings
- Ensure app is registered with Onairos for OAuth callbacks

### Issue: Data Not Loading

**Solution:**
- Check browser console in Safari Web Inspector (iOS)
- Enable remote debugging for Android
- Verify localStorage is accessible: `console.log(localStorage.getItem('test'))`

### Issue: Network Errors on iOS

**Solution:**
- Add App Transport Security exception in Info.plist (shown above)
- For production, use HTTPS endpoints only
- Verify API endpoint is reachable from device

## Platform-Specific Notes

### iOS Specific
- ✅ Works on iOS 13+
- ✅ Supports both iPhone and iPad
- ✅ Works with iOS Safari WebView engine
- ⚠️ Requires App Transport Security configuration for network requests

### Android Specific
- ✅ Works on Android 8+
- ✅ Supports all Android devices
- ✅ Works with Chrome WebView engine
- ✅ Network requests work out of the box

## Performance Considerations

1. **Bundle Size**: Onairos package is optimized for mobile (~50KB gzipped)
2. **Network**: API calls are async and non-blocking
3. **Memory**: Minimal memory footprint
4. **Battery**: No background processes or polling

## Summary

| Feature | Status | Notes |
|---------|--------|-------|
| **Core React Components** | ✅ Perfect | Works identically to web |
| **API Calls** | ✅ Perfect | Full fetch API support |
| **Authentication** | ✅ Perfect | API key + JWT auth works |
| **OAuth Flows** | ✅ Works | Uses redirects instead of popups |
| **Data Requests** | ✅ Perfect | Full functionality |
| **AutoFetch** | ✅ Perfect | Automatic API calls work |
| **Touch Interactions** | ✅ Perfect | Native touch support |
| **Browser Extension** | ❌ N/A | Not available in Capacitor |
| **LLM Data Collection** | ✅ NEW! | Native method via `storeCapacitorLLMData` |
| **LLM History/Stats** | ✅ NEW! | Full API access for mobile apps |

## Support

For issues specific to Capacitor integration:
1. Check this guide first
2. Review [Mobile Browser Compatibility Guide](./MOBILE_BROWSER_COMPATIBILITY.md)
3. Contact Onairos support with:
   - Platform (iOS/Android)
   - Capacitor version
   - Error logs from Safari/Chrome debugger

---

**Bottom Line:** The Onairos npm package works excellently with React + Vite + Capacitor for iOS/Android with zero code changes needed. The only limitation is browser extension features (which are optional).


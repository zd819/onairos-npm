# Capacitor Quick Start Guide

## TL;DR - What You Need to Know

### ✅ **YES, it works perfectly on iOS/Android via Capacitor**

The Onairos npm package works with React + Vite + Capacitor with **zero code changes** for core functionality.

### 🆕 **NEW: LLM Data Collection Without Browser Extension**

Capacitor apps can now collect LLM conversation data using the native API method - no browser extension required!

---

## Quick Setup (5 minutes)

### 1. Install

```bash
npm install onairos
```

### 2. Configure Vite

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['onairos']
  }
});
```

### 3. Use OnairosButton (Same as Web!)

```jsx
import { OnairosButton } from 'onairos';

function App() {
  return (
    <OnairosButton
      requestData={["email", "profile"]}
      webpageName="My iOS App"
      onComplete={(result) => {
        if (result.apiResponse) {
          console.log('User data:', result.apiResponse);
        }
      }}
    />
  );
}
```

That's it! You're done. 🎉

---

## LLM Data Collection (NEW!)

### What's Changed?

**Before:** Browser extension required (didn't work in Capacitor)  
**Now:** Direct API method available for Capacitor/mobile apps

### How to Use

```jsx
import { 
  OnairosButton,
  storeCapacitorLLMData,
  isCapacitor 
} from 'onairos';

function App() {
  const [userInfo, setUserInfo] = useState(null);
  
  // 1. Get user info from Onairos
  const handleComplete = (result) => {
    if (result.apiResponse) {
      setUserInfo({
        username: result.apiResponse.email,
        userId: result.apiResponse.userId,
        sessionToken: result.apiResponse.token
      });
    }
  };
  
  // 2. Collect LLM conversation data
  const collectLLMData = async (messages) => {
    const result = await storeCapacitorLLMData(
      {
        messages: messages,
        timestamp: new Date().toISOString()
      },
      userInfo,
      'chatgpt' // or 'claude', 'gemini', 'grok'
    );
    
    if (result.success) {
      console.log('✅ LLM data stored!');
    }
  };
  
  return (
    <div>
      <OnairosButton
        requestData={["email", "profile"]}
        webpageName="My App"
        onComplete={handleComplete}
      />
      
      {userInfo && (
        <button onClick={() => {
          collectLLMData([
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi!' }
          ]);
        }}>
          Store LLM Conversation
        </button>
      )}
    </div>
  );
}
```

### Available Functions

```jsx
import {
  // Platform detection
  isCapacitor,
  isMobileApp,
  getPlatformInfo,
  
  // LLM data collection
  storeCapacitorLLMData,    // Store single conversation
  storeBatchLLMData,        // Store multiple conversations
  getLLMHistory,            // Retrieve history
  getLLMStats,              // Get usage stats
  formatConversationData    // Helper to format data
} from 'onairos';
```

---

## What Works & What Doesn't

### ✅ Works Perfectly (No Changes Needed)

- All React components
- Data requests (email, profile, social, etc.)
- API calls and authentication
- OAuth flows (auto-converts popups to redirects)
- Touch interactions
- **NEW:** LLM data collection via native method

### ❌ Not Available in Capacitor

- Browser extension (web-only feature)
- Browser extension LLM monitoring (use native method instead)

---

## Changes Required

### For Core Functionality: **ZERO**

The same code works on web and Capacitor:

```jsx
// This exact code works on web AND Capacitor
<OnairosButton
  requestData={["email", "profile"]}
  webpageName="My App"
  onComplete={(result) => console.log(result)}
/>
```

### For LLM Data Collection: **Add One Function Call**

Instead of relying on browser extension (doesn't work in Capacitor), use the native method:

```jsx
// Import the Capacitor-specific LLM function
import { storeCapacitorLLMData } from 'onairos';

// Use it to store LLM data
await storeCapacitorLLMData(conversationData, userInfo, platform);
```

That's the only change needed!

---

## Example: Full Capacitor App with LLM

```jsx
import React, { useState, useEffect } from 'react';
import { 
  OnairosButton,
  storeCapacitorLLMData,
  isCapacitor,
  getPlatformInfo
} from 'onairos';

function MyCapacitorApp() {
  const [userInfo, setUserInfo] = useState(null);
  const [platform, setPlatform] = useState(null);
  
  useEffect(() => {
    // Check platform
    const info = getPlatformInfo();
    setPlatform(info);
    
    if (isCapacitor()) {
      console.log('✅ Running in Capacitor on', info.platform);
    }
  }, []);
  
  const handleOnairosComplete = (result) => {
    if (result.apiResponse) {
      // Save user info for later use
      const user = {
        username: result.apiResponse.email,
        userId: result.apiResponse.userId,
        sessionToken: result.apiResponse.token
      };
      
      setUserInfo(user);
      localStorage.setItem('userInfo', JSON.stringify(user));
    }
  };
  
  const storeChatConversation = async (messages, llmPlatform) => {
    if (!userInfo) {
      alert('Please connect with Onairos first');
      return;
    }
    
    const result = await storeCapacitorLLMData(
      {
        messages: messages,
        timestamp: new Date().toISOString()
      },
      userInfo,
      llmPlatform
    );
    
    if (result.success) {
      alert('✅ Conversation saved!');
    } else {
      alert('❌ Error: ' + result.error);
    }
  };
  
  return (
    <div className="app">
      <h1>My Capacitor App</h1>
      
      {platform && (
        <p>Platform: {platform.platform} | Capacitor: {platform.isCapacitor ? 'Yes' : 'No'}</p>
      )}
      
      <OnairosButton
        requestData={["email", "profile", "social"]}
        webpageName="My Capacitor App"
        autoFetch={true}
        onComplete={handleOnairosComplete}
      />
      
      {userInfo && (
        <div className="llm-section">
          <h2>LLM Data Collection</h2>
          <p>✅ Connected as: {userInfo.username}</p>
          
          <button onClick={() => {
            storeChatConversation([
              { role: 'user', content: 'What is AI?' },
              { role: 'assistant', content: 'AI is artificial intelligence...' }
            ], 'chatgpt');
          }}>
            Save ChatGPT Conversation
          </button>
          
          <button onClick={() => {
            storeChatConversation([
              { role: 'user', content: 'Hello Claude' },
              { role: 'assistant', content: 'Hello! How can I help?' }
            ], 'claude');
          }}>
            Save Claude Conversation
          </button>
        </div>
      )}
    </div>
  );
}

export default MyCapacitorApp;
```

---

## iOS Configuration

Add to `ios/App/App/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

---

## Testing

```bash
# iOS
npm run build
npx cap sync ios
npx cap open ios

# Android
npm run build
npx cap sync android
npx cap open android
```

---

## Common Questions

### Q: Do I need to change my code for Capacitor?
**A:** No, for core functionality. Only add `storeCapacitorLLMData` if you want LLM data collection.

### Q: Does the browser extension work in Capacitor?
**A:** No, but you don't need it. Use `storeCapacitorLLMData` instead for LLM data.

### Q: Can I use the same code on web and Capacitor?
**A:** Yes! The package automatically detects the environment and adapts.

### Q: How do I collect ChatGPT/Claude conversations?
**A:** Use `storeCapacitorLLMData` - see examples above.

### Q: What about OAuth popups?
**A:** Automatically converted to redirects on mobile. No code changes needed.

---

## What Your Developer Needs to Do

1. ✅ Install `onairos` via npm
2. ✅ Add Vite config (`exclude: ['onairos']`)
3. ✅ Use `OnairosButton` component (same as web)
4. ✅ **Optional:** Import `storeCapacitorLLMData` for LLM data collection

**Total changes:** ~5 lines of config + normal component usage

---

## More Help

- **Full Guide:** [CAPACITOR_IOS_INTEGRATION.md](./CAPACITOR_IOS_INTEGRATION.md)
- **Mobile Compatibility:** [MOBILE_BROWSER_COMPATIBILITY.md](./MOBILE_BROWSER_COMPATIBILITY.md)
- **Main README:** [README.md](./README.md)

---

**Bottom Line:** Everything works. LLM data collection now available via native method. Your developer is good to go! 🚀


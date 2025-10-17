# Browser Extension User Integration Guide

## Overview

This document explains how the Onairos browser extension should integrate with the NPM connector to receive and handle user identification information when users connect to LLM platforms.

## User Information Flow

### 1. **NPM Connector → LLM Platform**
When a user clicks to connect to an LLM platform (ChatGPT, Claude, Gemini, Grok), the NPM connector:

1. Detects if the Onairos browser extension is installed
2. If installed, opens the LLM platform with user information in URL parameters
3. Sends user context via postMessage to the extension

### 2. **URL Parameters Added**
The NPM connector adds these parameters to the LLM platform URL:

```
https://chatgpt.com/?onairos_user=john.doe@example.com&onairos_id=user_12345&onairos_session=sess_abc123xyz&onairos_platform=chatgpt&onairos_source=npm_connector&onairos_timestamp=1703123456789
```

**Parameters:**
- `onairos_user` - User's username/email (URL encoded)
- `onairos_id` - User's unique identifier (URL encoded)  
- `onairos_session` - Session token for authentication (URL encoded)
- `onairos_platform` - LLM platform name (`chatgpt`, `claude`, `gemini`, `grok`)
- `onairos_source` - Source identifier (`npm_connector`)
- `onairos_timestamp` - Connection timestamp

### 3. **PostMessage Communication**
The NPM connector also sends user information via postMessage:

```javascript
window.postMessage({
  source: 'onairos_npm_connector',
  type: 'USER_INFO',
  data: {
    username: 'john.doe@example.com',
    userId: 'user_12345',
    sessionToken: 'sess_abc123xyz',
    platform: 'chatgpt',
    timestamp: '2024-01-01T12:00:00.000Z',
    connectorVersion: '3.4.1'
  }
}, '*');
```

## Browser Extension Implementation

### 1. **URL Parameter Detection**
The extension should monitor for Onairos URL parameters on LLM platforms:

```javascript
// In your content script or inject script
function extractOnairosUserInfo() {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  
  // Check if this is an Onairos-initiated session
  if (!params.has('onairos_user') && !params.has('onairos_id')) {
    return null;
  }
  
  return {
    username: params.get('onairos_user') ? decodeURIComponent(params.get('onairos_user')) : null,
    userId: params.get('onairos_id') ? decodeURIComponent(params.get('onairos_id')) : null,
    sessionToken: params.get('onairos_session') ? decodeURIComponent(params.get('onairos_session')) : null,
    platform: params.get('onairos_platform') || null,
    source: params.get('onairos_source') || null,
    timestamp: params.get('onairos_timestamp') || null
  };
}

// Extract user info when page loads
const userInfo = extractOnairosUserInfo();
if (userInfo) {
  console.log('🎯 Onairos user detected:', userInfo);
  // Initialize user context for this session
  initializeUserSession(userInfo);
}
```

### 2. **PostMessage Listener**
Listen for user information from the NPM connector:

```javascript
// Listen for messages from the NPM connector
window.addEventListener('message', (event) => {
  if (event.data.source === 'onairos_npm_connector' && event.data.type === 'USER_INFO') {
    const userInfo = event.data.data;
    console.log('📨 Received user info from NPM connector:', userInfo);
    
    // Store user context
    storeUserContext(userInfo);
    
    // Initialize data collection for this user
    initializeDataCollection(userInfo);
  }
});
```

### 3. **User Session Management**
Manage user sessions and data association:

```javascript
class OnairosUserSession {
  constructor(userInfo) {
    this.username = userInfo.username;
    this.userId = userInfo.userId;
    this.sessionToken = userInfo.sessionToken;
    this.platform = userInfo.platform;
    this.startTime = new Date();
    this.interactions = [];
  }
  
  // Record user interactions with the LLM
  recordInteraction(type, data) {
    this.interactions.push({
      type: type,
      data: data,
      timestamp: new Date().toISOString(),
      platform: this.platform
    });
    
    // Send to Onairos backend
    this.sendToBackend({
      userId: this.userId,
      username: this.username,
      sessionToken: this.sessionToken,
      interaction: {
        type: type,
        data: data,
        timestamp: new Date().toISOString(),
        platform: this.platform
      }
    });
  }
  
  async sendToBackend(payload) {
    try {
      const response = await fetch('https://api2.onairos.uk/extension/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`,
          'X-Onairos-User': this.userId
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log('✅ Interaction sent to Onairos backend');
      } else {
        console.error('❌ Failed to send interaction to backend');
      }
    } catch (error) {
      console.error('❌ Error sending to backend:', error);
    }
  }
}

// Global user session
let currentUserSession = null;

function initializeUserSession(userInfo) {
  currentUserSession = new OnairosUserSession(userInfo);
  console.log('🚀 Initialized Onairos user session for:', userInfo.username);
  
  // Clean up URL parameters (optional)
  if (window.history && window.history.replaceState) {
    const url = new URL(window.location.href);
    url.searchParams.delete('onairos_user');
    url.searchParams.delete('onairos_id');
    url.searchParams.delete('onairos_session');
    url.searchParams.delete('onairos_platform');
    url.searchParams.delete('onairos_source');
    url.searchParams.delete('onairos_timestamp');
    window.history.replaceState({}, document.title, url.toString());
  }
}
```

### 4. **Data Collection Examples**

#### ChatGPT Integration:
```javascript
// Monitor ChatGPT conversations
function monitorChatGPT() {
  if (!currentUserSession) return;
  
  // Watch for new messages
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if this is a user message
          if (node.matches('[data-message-author-role="user"]')) {
            const messageText = node.textContent;
            currentUserSession.recordInteraction('user_message', {
              message: messageText,
              timestamp: new Date().toISOString()
            });
          }
          
          // Check if this is an AI response
          if (node.matches('[data-message-author-role="assistant"]')) {
            const responseText = node.textContent;
            currentUserSession.recordInteraction('ai_response', {
              response: responseText,
              timestamp: new Date().toISOString()
            });
          }
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

// Initialize monitoring when user session is active
if (window.location.hostname === 'chatgpt.com' && currentUserSession) {
  monitorChatGPT();
}
```

#### Claude Integration:
```javascript
// Monitor Claude conversations
function monitorClaude() {
  if (!currentUserSession) return;
  
  // Claude-specific selectors and monitoring logic
  // Similar pattern to ChatGPT but with Claude's DOM structure
}

if (window.location.hostname === 'claude.ai' && currentUserSession) {
  monitorClaude();
}
```

## Backend API Endpoints

The extension should send collected data to these Onairos backend endpoints:

### 1. **Record Interaction**
```
POST https://api2.onairos.uk/extension/interaction
Headers:
  Authorization: Bearer {sessionToken}
  X-Onairos-User: {userId}
  Content-Type: application/json

Body:
{
  "userId": "user_12345",
  "username": "john.doe@example.com",
  "sessionToken": "sess_abc123xyz",
  "interaction": {
    "type": "user_message",
    "data": {
      "message": "Hello, how are you?",
      "timestamp": "2024-01-01T12:00:00.000Z"
    },
    "platform": "chatgpt"
  }
}
```

### 2. **Session Summary**
```
POST https://api2.onairos.uk/extension/session-summary
Headers:
  Authorization: Bearer {sessionToken}
  X-Onairos-User: {userId}
  Content-Type: application/json

Body:
{
  "userId": "user_12345",
  "username": "john.doe@example.com",
  "sessionToken": "sess_abc123xyz",
  "session": {
    "platform": "chatgpt",
    "startTime": "2024-01-01T12:00:00.000Z",
    "endTime": "2024-01-01T12:30:00.000Z",
    "interactionCount": 15,
    "summary": "User had a conversation about AI ethics"
  }
}
```

## Security Considerations

1. **Token Validation**: Always validate session tokens with the backend
2. **Data Encryption**: Encrypt sensitive data before sending to backend
3. **User Consent**: Ensure user has consented to data collection
4. **Data Minimization**: Only collect necessary interaction data
5. **Secure Storage**: Store user context securely in extension storage

## Testing

Use the provided test file `test-llm-extension-detection.html` to:
1. Simulate extension detection
2. Test user information passing
3. Verify URL parameter extraction
4. Test postMessage communication

## Example Complete Flow

1. **User clicks ChatGPT in NPM connector**
2. **NPM connector detects extension is installed**
3. **Opens**: `https://chatgpt.com/?onairos_user=john.doe@example.com&onairos_id=user_12345&...`
4. **Extension extracts user info from URL**
5. **Extension initializes user session**
6. **Extension monitors ChatGPT interactions**
7. **Extension sends interaction data to Onairos backend**
8. **Backend associates data with user account**
9. **User gets personalized AI responses based on their data**

This creates a seamless flow where the NPM connector, browser extension, and backend work together to provide personalized AI experiences while maintaining user privacy and security.

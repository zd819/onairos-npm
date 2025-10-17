# Onairos User Storage System

## Overview

This document explains how user authentication tokens, user information, and session data are stored and accessed throughout the Onairos ecosystem, including how the browser extension can access this data.

## 📦 **localStorage Storage Keys**

### **Primary User Data Storage**

#### 1. **`onairosUser`** - Main User Data Object
**Location**: Stored after email verification and onboarding completion  
**Format**: JSON string  
**Contains**:
```javascript
{
  "email": "john.doe@example.com",
  "username": "john.doe@example.com", 
  "userId": "user_12345",
  "token": "jwt_token_here",
  "verified": true,
  "isNewUser": false,
  "onboardingComplete": true,
  "pinCreated": true,
  "accountInfo": { /* account details */ },
  "connectedAccounts": [
    { "platform": "chatgpt", "connected": true },
    { "platform": "youtube", "connected": true }
  ],
  "lastLogin": "2024-01-01T12:00:00.000Z",
  "createdAt": "2024-01-01T10:00:00.000Z"
}
```

#### 2. **`onairos_jwt_token`** - JWT Authentication Token
**Location**: Stored during email verification (SDK)  
**Format**: Raw JWT string  
**Usage**: Primary authentication token for API requests
```javascript
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 3. **`onairos_user_data`** - SDK User Data
**Location**: Stored by OnairosSDK during email verification  
**Format**: JSON string  
**Contains**: Complete API response from email verification
```javascript
{
  "success": true,
  "token": "jwt_token_here",
  "email": "john.doe@example.com",
  "userName": "john.doe@example.com",
  "existingUser": false,
  "accountInfo": { /* account details */ },
  "userCreated": true
}
```

### **Legacy/Alternative Storage**

#### 4. **`onairosToken`** - Legacy Authentication Token
**Location**: Stored during traditional login/signup  
**Format**: Raw token string  
**Usage**: Fallback authentication token

#### 5. **`username`** - Username Storage
**Location**: Stored during login/signup  
**Format**: Plain string  
**Usage**: Username identifier

### **Session & Context Storage**

#### 6. **`onairos_user_context`** - Extension Context
**Location**: Stored when extension is not available  
**Format**: JSON string  
**Usage**: Fallback user context for browser extension

#### 7. **`onairosCredentials`** - Saved Credentials
**Location**: Stored for biometric authentication  
**Format**: JSON string with username and token

## 🔍 **User Information Extraction**

### **Automatic Extraction Function**
The system provides `getUserInfoFromStorage()` that automatically extracts user information from all storage locations:

```javascript
import { getUserInfoFromStorage } from './utils/extensionDetection';

const userInfo = getUserInfoFromStorage();
console.log(userInfo);
// Returns comprehensive user object with all available data
```

### **Extraction Priority Order**
1. **`onairosUser`** (primary source)
2. **`onairos_user_data`** (SDK fallback)
3. **Individual keys** (`username`, tokens, etc.)

### **Extracted User Object Structure**
```javascript
{
  // User Identification
  username: "john.doe@example.com",
  userId: "user_12345", 
  email: "john.doe@example.com",
  
  // Authentication Tokens
  sessionToken: "jwt_token_here",
  jwtToken: "jwt_token_here",
  
  // User State
  isNewUser: false,
  verified: true,
  onboardingComplete: true,
  pinCreated: true,
  
  // Account Details
  accountInfo: { /* account details */ },
  connectedAccounts: [
    { platform: "chatgpt", connected: true }
  ],
  
  // Timestamps
  lastLogin: "2024-01-01T12:00:00.000Z",
  createdAt: "2024-01-01T10:00:00.000Z",
  
  // Metadata
  source: "localStorage_extraction",
  extractedAt: "2024-01-01T12:30:00.000Z"
}
```

## 🌐 **Browser Extension Access**

### **Method 1: Direct localStorage Access**
The browser extension can directly read localStorage on any domain:

```javascript
// In browser extension content script
function getOnairosUserData() {
  try {
    // Primary user data
    const onairosUser = localStorage.getItem('onairosUser');
    const userData = onairosUser ? JSON.parse(onairosUser) : null;
    
    // Authentication tokens
    const jwtToken = localStorage.getItem('onairos_jwt_token');
    const legacyToken = localStorage.getItem('onairosToken');
    
    // Username
    const username = localStorage.getItem('username');
    
    return {
      userData,
      jwtToken,
      legacyToken, 
      username,
      // Extract key fields
      userEmail: userData?.email || username,
      userId: userData?.userId || userData?.email || username,
      sessionToken: jwtToken || userData?.token || legacyToken
    };
  } catch (error) {
    console.error('Failed to extract Onairos user data:', error);
    return null;
  }
}

// Usage in extension
const userInfo = getOnairosUserData();
if (userInfo && userInfo.sessionToken) {
  console.log('✅ User authenticated:', userInfo.userEmail);
  // Initialize data collection for this user
  initializeUserSession(userInfo);
}
```

### **Method 2: URL Parameter Detection**
When users connect to LLM platforms, user info is passed via URL parameters:

```javascript
// Extract user info from URL (on LLM platforms like chatgpt.com)
function extractUserFromURL() {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  
  if (params.has('onairos_user')) {
    return {
      username: decodeURIComponent(params.get('onairos_user')),
      userId: decodeURIComponent(params.get('onairos_id')),
      sessionToken: decodeURIComponent(params.get('onairos_session')),
      platform: params.get('onairos_platform'),
      source: params.get('onairos_source'),
      timestamp: params.get('onairos_timestamp')
    };
  }
  return null;
}
```

### **Method 3: PostMessage Communication**
Listen for user context from NPM connector:

```javascript
// Listen for user info from NPM connector
window.addEventListener('message', (event) => {
  if (event.data.source === 'onairos_npm_connector' && 
      event.data.type === 'USER_INFO') {
    const userInfo = event.data.data;
    console.log('📨 Received user context:', userInfo);
    
    // Store user context in extension
    chrome.storage.local.set({ 'onairos_user_context': userInfo });
    
    // Initialize data collection
    initializeDataCollection(userInfo);
  }
});
```

## 🔐 **Authentication Flow**

### **Email Verification Flow**
1. **User enters email** → `EmailAuth.js`
2. **Email verification** → API call to `/email/verification`
3. **Success response** → Stores in multiple locations:
   ```javascript
   // SDK stores JWT token and user data
   localStorage.setItem('onairos_jwt_token', response.token);
   localStorage.setItem('onairos_user_data', JSON.stringify(response));
   
   // Component stores complete user object
   localStorage.setItem('onairosUser', JSON.stringify(userData));
   ```

### **Traditional Login Flow**
1. **User enters credentials** → `overlay.js`
2. **Login API call** → `/login`
3. **Success response** → Stores tokens:
   ```javascript
   localStorage.setItem('onairosToken', data.token);
   localStorage.setItem('username', formData.username);
   ```

## 🚀 **Browser Extension Implementation**

### **Complete Extension User Session Manager**
```javascript
class OnairosExtensionUserManager {
  constructor() {
    this.currentUser = null;
    this.initialize();
  }
  
  async initialize() {
    // Method 1: Check URL parameters (for LLM platforms)
    const urlUser = this.extractFromURL();
    if (urlUser) {
      this.currentUser = urlUser;
      console.log('👤 User detected from URL:', urlUser);
      return;
    }
    
    // Method 2: Check localStorage (for all domains)
    const storageUser = this.extractFromStorage();
    if (storageUser) {
      this.currentUser = storageUser;
      console.log('👤 User detected from storage:', storageUser);
      return;
    }
    
    // Method 3: Listen for postMessage
    this.listenForUserContext();
  }
  
  extractFromURL() {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    
    if (params.has('onairos_user')) {
      return {
        username: decodeURIComponent(params.get('onairos_user')),
        userId: decodeURIComponent(params.get('onairos_id')),
        sessionToken: decodeURIComponent(params.get('onairos_session')),
        platform: params.get('onairos_platform'),
        source: 'url_parameters'
      };
    }
    return null;
  }
  
  extractFromStorage() {
    try {
      // Try primary storage
      const onairosUser = localStorage.getItem('onairosUser');
      if (onairosUser) {
        const userData = JSON.parse(onairosUser);
        return {
          username: userData.email || userData.username,
          userId: userData.userId || userData.email,
          sessionToken: userData.token,
          email: userData.email,
          verified: userData.verified,
          source: 'localStorage_onairosUser'
        };
      }
      
      // Try JWT token + username
      const jwtToken = localStorage.getItem('onairos_jwt_token');
      const username = localStorage.getItem('username');
      if (jwtToken && username) {
        return {
          username: username,
          userId: username,
          sessionToken: jwtToken,
          source: 'localStorage_jwt'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to extract from storage:', error);
      return null;
    }
  }
  
  listenForUserContext() {
    window.addEventListener('message', (event) => {
      if (event.data.source === 'onairos_npm_connector' && 
          event.data.type === 'USER_INFO') {
        this.currentUser = event.data.data;
        console.log('📨 User context received via postMessage:', this.currentUser);
        
        // Store in extension storage
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ 'onairos_user': this.currentUser });
        }
      }
    });
  }
  
  // Send interaction data to Onairos backend
  async recordInteraction(type, data) {
    if (!this.currentUser || !this.currentUser.sessionToken) {
      console.warn('⚠️ No authenticated user for interaction recording');
      return false;
    }
    
    try {
      const response = await fetch('https://api2.onairos.uk/extension/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentUser.sessionToken}`,
          'X-Onairos-User': this.currentUser.userId
        },
        body: JSON.stringify({
          userId: this.currentUser.userId,
          username: this.currentUser.username,
          interaction: {
            type: type,
            data: data,
            timestamp: new Date().toISOString(),
            platform: window.location.hostname
          }
        })
      });
      
      if (response.ok) {
        console.log('✅ Interaction recorded successfully');
        return true;
      } else {
        console.error('❌ Failed to record interaction:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error recording interaction:', error);
      return false;
    }
  }
}

// Initialize in extension
const userManager = new OnairosExtensionUserManager();

// Usage example
if (window.location.hostname === 'chatgpt.com') {
  // Monitor ChatGPT interactions
  document.addEventListener('DOMContentLoaded', () => {
    // Record when user sends a message
    userManager.recordInteraction('chatgpt_message', {
      message: 'User sent a message',
      timestamp: new Date().toISOString()
    });
  });
}
```

## 📋 **Summary for Browser Extension**

### **Where User Data is Stored:**
1. **`localStorage.onairosUser`** - Complete user object (primary)
2. **`localStorage.onairos_jwt_token`** - JWT authentication token
3. **`localStorage.username`** - Username/email
4. **URL parameters** - When coming from NPM connector
5. **PostMessage events** - Real-time user context

### **What the Extension Should Access:**
- **User Identity**: `username`, `userId`, `email`
- **Authentication**: `sessionToken` (JWT token)
- **User State**: `verified`, `onboardingComplete`, `connectedAccounts`
- **Platform Context**: Current LLM platform being used

### **How to Access:**
1. **Use the provided utility**: `getUserInfoFromStorage()`
2. **Direct localStorage access**: Read the keys directly
3. **URL parameter extraction**: Parse `onairos_*` parameters
4. **PostMessage listener**: Listen for user context updates

The browser extension now has complete access to user identification and authentication data, enabling seamless data collection and backend integration! 🎯

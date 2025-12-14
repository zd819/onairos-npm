# Changelog

All notable changes to the Onairos SDK will be documented in this file.

## [4.2.2] - 2025-12-14

### 🐛 Fixed - Email Authentication Routing for Existing Users

#### Problem Resolved
- **Critical Bug**: Existing users authenticating via email verification were incorrectly routed to onboarding instead of dataRequest page
- **Root Cause**: Frontend was checking non-existent `data.existingUser` field instead of `data.isNewUser` returned by backend
- **Impact**: Existing users had to go through onboarding again instead of proceeding directly to data request

#### Solution Implemented
- Added explicit account status check via `/getAccountInfo/email` endpoint (matching Google sign-in behavior)
- Email verification flow now fetches complete account data after code verification
- Both Google OAuth and email authentication flows now return identical account data structures
- Uses `accountStatus.exists` field for consistent user routing logic

#### Technical Details
**Before Fix:**
```javascript
// Backend returns: { isNewUser: false }
// Frontend checked: data.existingUser (undefined)
// Result: existingUser = false (WRONG!)
// Route: onboarding (WRONG for existing users!)
```

**After Fix:**
```javascript
// Explicit account check via /getAccountInfo/email
// Gets: { accountStatus: { exists: true } }
// Result: existingUser = true (CORRECT!)
// Route: dataRequest (CORRECT for existing users!)
```

#### Files Changed
- `src/components/EmailAuth.js` - Added explicit account status check in `handleCodeSubmit()`
- Improved logging for account status verification
- Enhanced error handling and fallback logic

#### Benefits
- ✅ Existing users now correctly route to dataRequest page via email auth
- ✅ Consistent behavior between Google and email authentication
- ✅ Full account data available for both authentication flows
- ✅ Better user experience for returning users
- ✅ No breaking changes to existing functionality

For detailed technical analysis, see `EMAIL_AUTH_CONSISTENCY_FIX.md`

---

## [4.0.16] - 2025-12-01

### 🎉 Major Fix: Full Tailwind CSS v3 & v4 Compatibility

#### Fixed
- ✅ **RESOLVED**: Peer dependency conflict error with Tailwind CSS v3
- ✅ Package now works with **Tailwind v3.0+ and v4.0+** without any workarounds
- ✅ Brandon's issue with `tailwindcss@3.4.18` now resolved
- ✅ No need for `--force` or `--legacy-peer-deps` flags

#### Added
- `INSTALLATION_GUIDE.md` - Comprehensive installation guide for both Tailwind versions
- Automatic version compatibility detection
- Clear upgrade path documentation for developers who want to move to v4

#### Changed
- Peer dependency: `"tailwindcss": ">=3.0.0"` (supports all v3 and v4 versions)
- Version bumped to 4.0.16

#### Developer Instructions
**No configuration changes needed!** Just run:
```bash
npm install onairos@latest
```

Works automatically with:
- Tailwind CSS v3.4.x (Brandon's version with the error)
- Tailwind CSS v4.1.x
- All versions >=3.0.0

---

## [4.0.1] - 2025-11-14

### 🎯 TypeScript Enhancement: onComplete Callback

#### Enhanced Type Definitions
- **NEW**: Added comprehensive `OnairosCompleteData` interface with full type documentation
- **IMPROVED**: Specified `token: string` and `apiUrl: string` as core response properties
- **NEW**: Documented all optional fields with detailed comments
- **NEW**: Added enhanced formatting fields (`userDataSummary`, `prettyPrint`)

#### Bug Fixes
- **FIXED**: Test mode now includes mock `token` field for consistent data structure
- **FIXED**: Test mode returns identical structure to production mode

#### Developer Experience
- **NEW**: Added comprehensive logging for `onComplete` data structure validation
- **NEW**: Visual indicators (✅/❌) for presence of key fields in console
- **NEW**: Detailed logging shows token preview, apiUrl, and all returned keys
- **NEW**: Created `ONCOMPLETE_USAGE_EXAMPLE.md` with complete usage documentation

#### Documentation
- **NEW**: TypeScript interface examples with proper typing
- **NEW**: JavaScript usage examples with authentication patterns
- **NEW**: Complete field documentation with descriptions
- **NEW**: Test mode vs Production mode comparison
- **NEW**: Examples of authenticated API requests using token and apiUrl

#### Code Quality
- **IMPROVED**: Better console debugging output at all stages of data flow
- **IMPROVED**: DataRequest component logs token and apiUrl presence before callback
- **IMPROVED**: OnairosButton logs complete data structure before passing to parent

### Changes Summary
```typescript
// Now properly typed in TypeScript
interface OnairosCompleteData {
  token: string;        // ✅ JWT token for authenticated API calls
  apiUrl: string;       // ✅ Backend API endpoint URL
  // ... plus 20+ optional fields with full documentation
}

// Usage
const handleComplete = (data: OnairosCompleteData) => {
  const { token, apiUrl } = data; // TypeScript knows these are strings!
};
```

## [3.4.0] - 2024-10-09

### 🚀 Major Features

#### Standardized API Key Validation System
- **NEW**: Implemented comprehensive `initializeApiKey()` function following standardized documentation
- **NEW**: Added `validateApiKey()` utility with backend validation
- **NEW**: Created `/auth/validate-key` endpoint for standardized API key validation
- **NEW**: Added retry logic with exponential backoff for network resilience
- **NEW**: Comprehensive error handling with specific error codes and suggestions

#### Enhanced SDK Architecture
- **NEW**: Modular API key validation utilities (`apiKeyValidation.js`)
- **NEW**: Centralized SDK initialization system (`sdkInitialization.js`)
- **NEW**: Global SDK state management with proper lifecycle
- **NEW**: Authenticated request helper with automatic API key injection

#### ChatGPT Integration
- **NEW**: Added ChatGPT as first connector with special behavior
- **NEW**: ChatGPT connector opens `chatgpt.com` in new tab (no OAuth)
- **NEW**: Added OpenAI icon support with fallback to emoji
- **NEW**: Updated platform configurations across all components

#### Gmail OAuth Fix
- **NEW**: Created Gmail OAuth backend route (`gmail-enhanced.js`)
- **NEW**: Added Gmail configuration to OAuth config
- **NEW**: Fixed "Not Found" error for Gmail authorization
- **NEW**: Comprehensive Gmail OAuth flow with token exchange

### 🔧 Technical Improvements

#### API Key Validation
- **Format Validation**: Supports `ona_`, `dev_`, `pk_` prefixes (32+ characters)
- **Admin Key Support**: Special handling for admin keys with full permissions
- **Environment Detection**: Automatic production/development environment detection
- **Rate Limiting**: Built-in rate limit handling and reporting
- **Timeout Handling**: Configurable timeouts with abort controller

#### Error Handling
- **Standardized Error Codes**: `MISSING_API_KEY`, `INVALID_API_KEY_FORMAT`, etc.
- **Detailed Error Messages**: User-friendly error descriptions
- **Actionable Suggestions**: Specific suggestions for each error type
- **Retry Logic**: Automatic retry with exponential backoff for server errors

#### SDK Configuration
```typescript
interface InitConfig {
  apiKey: string;                    // Required: Developer API key
  environment?: 'production' | 'development'; // Default: auto-detected
  enableLogging?: boolean;           // Default: false
  timeout?: number;                  // Default: 30000ms
  retryAttempts?: number;            // Default: 3
  platform?: string;                // Default: 'web'
  sdkVersion?: string;               // Default: '3.4.0'
}
```

### 📡 API Endpoints

#### New Validation Endpoints
- **POST** `/auth/validate-key` - Primary validation endpoint
- **GET** `/auth/validate-key?key=API_KEY` - Simple validation
- **GET** `/auth/health` - Health check endpoint

#### Enhanced OAuth Endpoints
- **POST** `/gmail/authorize` - Gmail OAuth authorization
- **GET** `/gmail/callback` - Gmail OAuth callback
- **POST** `/gmail/native-auth` - Gmail native authentication

### 🎨 UI/UX Improvements

#### Platform Connectors
- **ChatGPT First**: ChatGPT appears as first connector option
- **Visual Icons**: OpenAI icon for ChatGPT with emoji fallback
- **Consistent Design**: Unified design across all connector components
- **Special Behaviors**: Platform-specific behaviors (ChatGPT opens new tab)

#### Error Feedback
- **User-Friendly Messages**: Clear error descriptions for users
- **Developer Guidance**: Detailed suggestions for developers
- **Visual Feedback**: Proper loading states and error indicators

### 🔒 Security Enhancements

#### API Key Security
- **Format Validation**: Strict format validation before network requests
- **Secure Storage**: Proper API key handling in global state
- **Token Management**: Automatic token refresh and management
- **Permission Checking**: Granular permission validation

#### Network Security
- **HTTPS Only**: All API calls use HTTPS endpoints
- **Request Signing**: Proper authorization headers
- **Timeout Protection**: Request timeout protection
- **Retry Limits**: Bounded retry attempts to prevent abuse

### 📚 Documentation

#### New Documentation Files
- `SDK_API_KEY_VALIDATION.md` - Comprehensive API key validation guide
- `GMAIL_CHATGPT_IMPLEMENTATION.md` - Gmail OAuth and ChatGPT implementation
- `CHATGPT_ICON_UPDATE.md` - ChatGPT icon implementation details
- `CHANGELOG.md` - This changelog

#### Code Documentation
- **JSDoc Comments**: Comprehensive function documentation
- **TypeScript Interfaces**: Proper type definitions
- **Usage Examples**: Clear usage examples in documentation
- **Error Handling**: Documented error codes and handling

### 🧪 Testing & Quality

#### Validation Testing
- **Format Validation**: Comprehensive API key format testing
- **Network Testing**: Retry logic and timeout testing
- **Error Scenarios**: All error code paths tested
- **Integration Testing**: End-to-end validation flow testing

#### Code Quality
- **ESLint Clean**: No linting errors
- **Modular Design**: Clean separation of concerns
- **Error Boundaries**: Proper error handling throughout
- **Performance**: Optimized network requests and state management

### 🔄 Migration Guide

#### From v3.3.0 to v3.4.0

**Before (v3.3.0)**:
```javascript
import { OnairosButton } from 'onairos';

// Components worked without explicit initialization
<OnairosButton requestData={{...}} />
```

**After (v3.4.0)**:
```javascript
import { initializeApiKey, OnairosButton } from 'onairos';

// 1. Initialize SDK first
await initializeApiKey({
  apiKey: 'ona_your_api_key_here',
  environment: 'production',
  enableLogging: true
});

// 2. Use components (they automatically use initialized API key)
<OnairosButton requestData={{...}} />
```

#### Breaking Changes
- **API Key Required**: `initializeApiKey()` must be called before using SDK components
- **Environment Detection**: Automatic environment detection (can be overridden)
- **Error Handling**: New error codes and error structure

#### Backward Compatibility
- **Component APIs**: All existing component APIs remain unchanged
- **Response Formats**: All response formats remain compatible
- **OAuth Flows**: Existing OAuth flows continue to work

### 🐛 Bug Fixes

#### Gmail OAuth
- **Fixed**: "Not Found" error when connecting Gmail
- **Fixed**: Missing Gmail OAuth backend route
- **Fixed**: Gmail OAuth callback handling
- **Fixed**: Gmail token exchange and user data storage

#### Platform Connectors
- **Fixed**: Platform icon loading and fallback behavior
- **Fixed**: Connector state management across components
- **Fixed**: Platform configuration consistency
- **Fixed**: Special behavior handling for different platforms

#### SDK Initialization
- **Fixed**: Race conditions in SDK initialization
- **Fixed**: Global state management and cleanup
- **Fixed**: Error propagation and handling
- **Fixed**: Network request timeout and retry logic

### 📦 Dependencies

#### Updated Dependencies
- Maintained compatibility with existing React versions
- No breaking dependency changes
- Added proper error handling utilities
- Enhanced network request capabilities

### 🚀 Deployment

#### NPM Package
- **Version**: 3.4.0
- **Size**: Optimized bundle size
- **Compatibility**: React 18+, Node.js 16+
- **Platforms**: Web, React Native, Node.js

#### Distribution Files
- `dist/onairos.bundle.js` - Browser bundle
- `dist/onairos.esm.js` - ES modules
- `dist/onairos.native.js` - React Native
- `dist/onairos.laravel.js` - Laravel integration

---

## [3.3.0] - Previous Release

### Features
- Basic OAuth connectors
- Component-based data collection
- Response formatting utilities

---

*For more details, see the [GitHub repository](https://github.com/zd819/onairos-npm) and [documentation](https://docs.onairos.uk).*
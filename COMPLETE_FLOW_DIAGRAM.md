# Complete Onairos SDK Flow with API Logging

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Opens Onairos SDK                      │
│                  (OnairosButton Component)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Welcome Screen │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Email Auth    │
                    │  (Enter Email) │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Enter Code    │
                    │  (6 digits)    │
                    └────────┬───────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │   API Response Analysis      │
              │  (handleEmailAuthSuccess)    │
              │                              │
              │  Checks:                     │
              │  - isNewUser                 │
              │  - existingUser              │
              │  - flowType                  │
              │  - accountInfo               │
              └──────────┬───────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌─────────────────┐
│   NEW USER      │            │ EXISTING USER   │
│   (First Time)  │            │  (Returning)    │
└────────┬────────┘            └────────┬────────┘
         │                               │
         ▼                               │
┌─────────────────┐                     │
│  Onboarding     │                     │
│  (Connect       │                     │
│   Accounts)     │                     │
└────────┬────────┘                     │
         │                               │
         ▼                               │
┌─────────────────┐                     │
│   PIN Setup     │                     │
└────────┬────────┘                     │
         │                               │
         ▼                               │
┌─────────────────┐                     │
│ Training Queue  │                     │
│  (Automatic)    │                     │
└────────┬────────┘                     │
         │                               │
         ▼                               │
┌─────────────────┐                     │
│ Loading Screen  │                     │
└────────┬────────┘                     │
         │                               │
         └───────────────┬───────────────┘
                         │
                         ▼
                ┌────────────────┐
                │  Data Request  │
                │  (Permissions) │
                └────────┬───────┘
                         │
                         ▼
                ┌────────────────┐
                │   API Call     │
                │  /inferenceTest│
                │      or        │
                │/getAPIurlMobile│
                └────────┬───────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │     API RESPONSE LOGGING       │
        │   (logOnairosResponse)         │
        │                                │
        │  📊 Content Preferences        │
        │  🧠 Personality Traits         │
        │  👤 Persona Info               │
        │  ℹ️  Metadata                  │
        │  💬 LLM Data                   │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │   onComplete   │
        │   Callback     │
        │  (App Receives │
        │     Data)      │
        └────────────────┘
```

## API Response Flow (Detailed)

```
Backend API
    │
    │ HTTP POST
    │ /inferenceTest or /getAPIurlMobile
    │
    ▼
┌─────────────────────────────────────────┐
│         API Response Received           │
│                                         │
│  {                                      │
│    InferenceResult: {                   │
│      output: [[0.95], [0.89], ...],    │
│      traits: {                          │
│        personality_traits: {...}        │
│      }                                  │
│    },                                   │
│    persona: {...},                      │
│    inference_metadata: {...},           │
│    llmData: {...}                       │
│  }                                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│    logOnairosResponse() Called          │
│    (apiResponseLogger.js)               │
└────────────┬────────────────────────────┘
             │
             ├──────────────────────────┐
             │                          │
             ▼                          ▼
    ┌────────────────┐        ┌────────────────┐
    │ Parse Content  │        │ Parse Traits   │
    │  Preferences   │        │  (Personality) │
    │                │        │                │
    │ 16 categories  │        │ Positive +     │
    │ 0.0 - 1.0      │        │ To Improve     │
    │                │        │ 0 - 100        │
    └────────┬───────┘        └────────┬───────┘
             │                          │
             ▼                          ▼
    ┌────────────────┐        ┌────────────────┐
    │ Format Scores  │        │ Format Traits  │
    │                │        │                │
    │ • Visual Bars  │        │ • Visual Bars  │
    │ • Emojis       │        │ • Emojis       │
    │ • Level Labels │        │ • Level Labels │
    └────────┬───────┘        └────────┬───────┘
             │                          │
             └──────────┬───────────────┘
                        │
                        ▼
            ┌────────────────────┐
            │   console.group()  │
            │   console.table()  │
            │   console.log()    │
            └────────┬───────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │   Browser DevTools      │
        │   Console Output        │
        │                         │
        │   🎯 Onairos Response   │
        │   ▼ 📊 Inference        │
        │   ▼ 🧠 Personality      │
        │   ▼ 👤 Persona          │
        │   ▼ ℹ️  Metadata        │
        │   ✅ Complete           │
        └─────────────────────────┘
```

## Data Flow with Logging

```
┌──────────────┐
│   User       │
│   Actions    │
└──────┬───────┘
       │
       │ 1. Opens SDK
       │ 2. Enters Email
       │ 3. Enters Code
       │ 4. Selects Permissions
       │
       ▼
┌──────────────────────────────────────┐
│         Frontend SDK                 │
│                                      │
│  ┌────────────────────────────┐     │
│  │  onairosButton.jsx         │     │
│  │  - Flow management         │     │
│  │  - User state tracking     │     │
│  └────────┬───────────────────┘     │
│           │                          │
│           ▼                          │
│  ┌────────────────────────────┐     │
│  │  DataRequest.js            │     │
│  │  - Permission UI           │     │
│  │  - API call                │     │
│  └────────┬───────────────────┘     │
│           │                          │
│           ▼                          │
│  ┌────────────────────────────┐     │
│  │  apiResponseLogger.js      │     │
│  │  - Parse response          │     │
│  │  - Format data             │     │
│  │  - Log to console          │     │
│  └────────┬───────────────────┘     │
└───────────┼──────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│      Backend API                     │
│      (api2.onairos.uk)               │
│                                      │
│  Endpoints:                          │
│  • /email/verify                     │
│  • /email/verify/confirm             │
│  • /auth/validate-key                │
│  • /inferenceTest (test)             │
│  • /getAPIurlMobile (prod)           │
│  • /training-queue/queue             │
└──────────────────────────────────────┘
```

## Console Output Structure

```
🎯 Onairos API Response
├── 📡 Endpoint Info
├── ⏰ Timestamp
│
├── 📊 Inference Result
│   ├── 🎯 Content Preferences
│   │   ├── Category 1: Technology (0.95) ██████████ 🔥
│   │   ├── Category 2: Entertainment (0.78) ████████░░ ⭐
│   │   ├── Category 3: Health (0.62) ██████░░░░ ⭐
│   │   └── ... (13 more categories)
│   │
│   └── 🧠 Personality Analysis
│       ├── ✨ Positive Traits
│       │   ├── Creativity (85.5) █████████░ 🔥
│       │   ├── Empathy (78.2) ████████░░ ⭐
│       │   └── ... (more traits)
│       │
│       └── 🎯 Traits to Improve
│           ├── Patience (45.2) █████░░░░░ 👍
│           └── ... (more traits)
│
├── 👤 Persona Information (optional)
│   ├── Name
│   ├── ID
│   └── Description
│
├── ℹ️  Metadata (optional)
│   ├── Model Size
│   ├── Total Outputs
│   └── Categories
│
└── 💬 LLM Data (optional)
    ├── Total Interactions
    ├── Platforms
    └── Recent Interactions
```

## File Relationships

```
src/
├── onairosButton.jsx
│   ├── Imports: EmailAuth, UniversalOnboarding, PinSetup, DataRequest
│   ├── Manages: User flow, state, session
│   └── Calls: handleEmailAuthSuccess() → determines flow
│
├── components/
│   ├── EmailAuth.js
│   │   ├── Handles: Email verification
│   │   ├── API: /email/verify, /email/verify/confirm
│   │   └── Returns: User state (isNewUser, existingUser, etc.)
│   │
│   ├── DataRequest.js
│   │   ├── Handles: Permission selection, API call
│   │   ├── API: /inferenceTest or /getAPIurlMobile
│   │   ├── Imports: apiResponseLogger
│   │   └── Logs: Complete API response with details
│   │
│   ├── UniversalOnboarding.jsx
│   │   └── Handles: Account connections (new users)
│   │
│   └── PinSetup.js
│       └── Handles: PIN creation, training queue
│
└── utils/
    ├── apiResponseLogger.js (NEW)
    │   ├── Exports: logOnairosResponse(), logOnairosResponseSimple()
    │   ├── Formats: Content scores, personality traits
    │   └── Outputs: Detailed console logs
    │
    ├── responseFormatter.js
    │   └── Converts: Arrays to dictionaries
    │
    ├── userDataFormatter.js
    │   └── Formats: User data for display
    │
    └── apiKeyValidation.js
        └── Validates: Developer API keys
```

## Test Mode vs Production Mode

```
┌─────────────────────────────────────────────────────────────┐
│                        TEST MODE                            │
│                    (testMode={true})                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Simulated API responses                                │
│  ✅ No real API calls                                      │
│  ✅ Instant results (1.2s delay)                           │
│  ✅ Always starts fresh (clears localStorage)              │
│  ✅ Same logging format as production                      │
│  ✅ Endpoint: "TEST_MODE"                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION MODE                         │
│                    (testMode={false})                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Real API calls to api2.onairos.uk                      │
│  ✅ Actual user data                                       │
│  ✅ Session persistence                                    │
│  ✅ Training job queueing                                  │
│  ✅ Same logging format as test mode                       │
│  ✅ Endpoint: /inferenceTest or /getAPIurlMobile           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

This diagram shows the complete flow from user interaction through API response logging. Key points:

1. **User Flow**: Welcome → Email → (Onboarding for new users) → PIN → Data Request
2. **API Integration**: Multiple endpoints for auth, validation, inference, and training
3. **Response Logging**: Comprehensive, detailed logging with visual indicators
4. **Consistent Experience**: Same logging in test and production modes
5. **Developer-Friendly**: Easy to understand console output with explanations

All components work together to provide a seamless experience for both users and developers! 🎉



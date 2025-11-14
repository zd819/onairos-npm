# OnComplete Callback Usage Guide

## Overview
The `onComplete` callback receives structured data after the Onairos flow completes, including **token** and **apiUrl** as core string properties.

## TypeScript Interface

```typescript
interface OnairosCompleteData {
  // Core response fields (REQUIRED)
  token: string;                    // JWT token for authenticated API calls
  apiUrl: string;                   // Backend API endpoint URL
  
  // Request metadata
  userHash?: string;
  appName?: string;
  approvedData?: string[];          // e.g., ['basic', 'personality', 'rawMemories']
  testMode?: boolean;
  timestamp?: string;
  
  // API response data
  apiResponse?: any;                // Personality/inference data from Onairos
  authorizedData?: any;
  usage?: any;
  
  // User data
  userData?: any;
  userDataSummary?: object;         // Formatted summary
  prettyPrint?: string;             // Console-friendly format
  
  // Status
  success?: boolean;
  simulated?: boolean;              // True in test mode
  error?: string;
  cancelled?: boolean;
}
```

## Basic Usage (JavaScript)

```javascript
import { OnairosButton } from 'onairos';

function MyApp() {
  const handleOnairosComplete = (data) => {
    console.log('Received data from Onairos!');
    
    // Core fields - always present on success
    console.log('Token:', data.token);           // JWT token string
    console.log('API URL:', data.apiUrl);        // API endpoint string
    
    // Use token and apiUrl to make authenticated requests
    if (data.success && data.token && data.apiUrl) {
      makeAuthenticatedRequest(data.token, data.apiUrl, data.approvedData);
    }
  };

  return (
    <OnairosButton
      requestData={['basic', 'personality']}
      webpageName="My App"
      onComplete={handleOnairosComplete}
      autoFetch={true}
    />
  );
}
```

## Usage with TypeScript

```typescript
import { OnairosButton, OnairosCompleteData } from 'onairos';

function MyApp() {
  const handleOnairosComplete = (data: OnairosCompleteData) => {
    // TypeScript now knows about token and apiUrl as strings
    const token: string = data.token;
    const apiUrl: string = data.apiUrl;
    
    // Type-safe access to optional fields
    if (data.apiResponse) {
      console.log('Personality traits:', data.apiResponse.persona);
    }
    
    // Make authenticated API call
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'your inference query'
      })
    })
    .then(res => res.json())
    .then(result => console.log('Inference result:', result));
  };

  return (
    <OnairosButton
      requestData={['basic', 'personality']}
      webpageName="My App"
      onComplete={handleOnairosComplete}
    />
  );
}
```

## Complete Example with All Fields

```javascript
const handleOnairosComplete = (data) => {
  // Check if user cancelled
  if (data.cancelled) {
    console.log('User cancelled the flow');
    return;
  }

  // Check for errors
  if (!data.success || data.error) {
    console.error('Error:', data.error);
    return;
  }

  // Core authentication data
  const { token, apiUrl } = data;
  console.log('Token:', token);         // JWT string
  console.log('API URL:', apiUrl);      // URL string

  // Request metadata
  console.log('User Hash:', data.userHash);
  console.log('App Name:', data.appName);
  console.log('Approved Data Types:', data.approvedData);
  console.log('Timestamp:', data.timestamp);
  console.log('Test Mode:', data.testMode);

  // API Response (personality, preferences, etc.)
  if (data.apiResponse) {
    console.log('Personality Data:', data.apiResponse.persona);
    console.log('Inference Result:', data.apiResponse.InferenceResult);
  }

  // User profile data
  if (data.userData) {
    console.log('User Email:', data.userData.email);
    console.log('Connected Accounts:', data.userData.connectedAccounts);
  }

  // Enhanced formatted data (added by formatter)
  if (data.userDataSummary) {
    console.log('User Profile Summary:', data.userDataSummary.userProfile);
    console.log('Connected Accounts:', data.userDataSummary.connectedAccounts);
    console.log('AI Data:', data.userDataSummary.aiData);
  }

  // Pretty-printed console output
  if (data.prettyPrint) {
    console.log(data.prettyPrint);
  }

  // Now use token and apiUrl to make authenticated requests
  makeInferenceRequest(token, apiUrl, data.approvedData);
};
```

## Making Authenticated Requests

```javascript
async function makeInferenceRequest(token, apiUrl, approvedData) {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataTypes: approvedData,
        query: {
          // Your inference query parameters
        }
      })
    });

    const result = await response.json();
    console.log('Inference successful:', result);
    return result;
  } catch (error) {
    console.error('Inference failed:', error);
    throw error;
  }
}
```

## Console Output

When `onComplete` is called, you'll see detailed logging:

```
🔥 DataRequest: Result structure:
{
  token: '✅ eyJhbGciOiJIUzI1Ni...',
  apiUrl: '✅ https://api2.onairos.uk/inferenceTest',
  hasApiResponse: true,
  success: true,
  testMode: true
}

🔥 onComplete data structure:
{
  token: '✅ Present (JWT string)',
  apiUrl: '✅ Present (URL string)',
  apiResponse: '✅ Present (object)',
  userData: '✅ Present (object)',
  success: true,
  testMode: true,
  allKeys: [
    'token', 'apiUrl', 'apiResponse', 'userData',
    'userHash', 'appName', 'approvedData', 'timestamp',
    'success', 'testMode', 'userDataSummary', 'prettyPrint'
  ]
}
```

## Test Mode vs Production Mode

### Test Mode (testMode: true)
- Returns simulated data
- `token`: Mock token string (e.g., `test_token_1699999999`)
- `apiUrl`: Test endpoint (https://api2.onairos.uk/inferenceTest)
- `simulated`: true
- Fast response (1.2s delay)

### Production Mode (testMode: false)
- Makes real API calls
- `token`: Real JWT from backend
- `apiUrl`: Production endpoint from backend response
- Real user data and personality analysis
- Response time depends on data processing

## Key Points

1. **token** and **apiUrl** are always present when `success: true`
2. **token** is a JWT string for authenticated API calls
3. **apiUrl** is the backend endpoint to use for inference requests
4. Use these together to make authenticated requests to Onairos APIs
5. Check `success` and `error` fields before using the data
6. In test mode, data is simulated but structure is identical
7. The formatter adds `userDataSummary` and `prettyPrint` without modifying original fields


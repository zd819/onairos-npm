## Onairos Developer Documentation v2.0.0

### 🚀 What's New in v2.0.0

- **Popup-based Data Requests**: No more cutoff issues with improved popup window implementation
- **AutoFetch by Default**: Automatic API calls after user approval - no manual handling required
- **Simplified Integration**: Much cleaner and easier to use
- **Enhanced UX**: Better positioning, loading states, and error handling

### 1. Create a Developer Account

Create a Developer account to access Onairos services. Register your domain to ensure secure API access.

https://Onairos.uk/dev-board

### 2. Installation

```bash
npm install onairos
```

### 3. Basic Usage

Import and use the OnairosButton component:

```jsx
import { OnairosButton } from 'onairos';

function MyApp() {
  return (
    <OnairosButton
      requestData={['email', 'profile', 'social']}
      webpageName="My Application"
      autoFetch={true} // Default - automatically makes API calls
      onComplete={(result) => {
        console.log('Data approved:', result.approved);
        console.log('API Response:', result.apiResponse); // Available when autoFetch is true
        
        if (result.apiResponse) {
          // Use the API response data directly
          console.log('User data:', result.apiResponse);
        }
      }}
    />
  );
}
```

### 4. Configuration Options

#### OnairosButton Props

- **`requestData`** (Array): Specific data types to request
  - Available types: `'email'`, `'profile'`, `'social'`, `'activity'`, `'preferences'`
- **`webpageName`** (String): Your application name displayed to users
- **`autoFetch`** (Boolean, default: `true`): Enable automatic API calls after approval
- **`onComplete`** (Function): Callback when data request completes
- **`proofMode`** (Boolean, default: `false`): Enable proof mode for verification

#### Response Format

When `autoFetch` is enabled (default), the `onComplete` callback receives:

```javascript
{
  approved: ['email', 'profile'], // Array of approved data types
  timestamp: "2024-01-15T10:30:00.000Z",
  userEmail: "user@example.com",
  appName: "My Application",
  apiResponse: { /* Your data here */ }, // API response (on success)
  apiError: "Error message", // Error message (on failure)
  apiUrl: "https://api2.onairos.uk/inferenceTest"
}
```

### 5. Advanced Usage Examples

#### Manual API Handling (AutoFetch Disabled)

```jsx
<OnairosButton
  requestData={['email', 'profile']}
  webpageName="My Application"
  autoFetch={false}
  onComplete={(result) => {
    if (result.approved) {
      // Handle approved data manually
      makeCustomApiCall(result.dataTypes);
    }
  }}
/>
```

#### With Custom Styling

```jsx
<OnairosButton
  requestData={['profile', 'social']}
  webpageName="Social Analytics App"
  textColor="black"
  textLayout="right"
  visualType="full"
  buttonType="pill"
  onComplete={handleDataResponse}
/>
```

### 6. Migration from v1.x

**Before (v1.x - Complex)**:
```jsx
// Old complex setup with manual event listeners
useEffect(() => {
  const handleMessage = (event) => {
    if (event.data?.source === 'content-script' && event.data?.type === 'API_URL_RESPONSE') {
      const { APIurl, accessToken } = event.data;
      // Manual API call handling
      fetch(APIurl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(InputData),
      });
    }
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);

<Onairos requestData={complexRequestObject} webpageName={webpageName} />
```

**After (v2.0 - Simple)**:
```jsx
// New simplified approach
<OnairosButton
  requestData={['email', 'profile']}
  webpageName="My App"
  onComplete={(result) => {
    // API call already made automatically
    console.log('User data:', result.apiResponse);
  }}
/>
```

### 7. Data Types Available

- **`email`**: Email address for account identification
- **`profile`**: Basic profile information and preferences  
- **`social`**: Connected social media accounts
- **`activity`**: Usage patterns and interactions
- **`preferences`**: User settings and customization choices

### 8. Error Handling

The component includes comprehensive error handling:

```jsx
<OnairosButton
  requestData={['email']}
  webpageName="My App"
  onComplete={(result) => {
    if (result.apiError) {
      console.error('API Error:', result.apiError);
      // Handle error appropriately
    } else if (result.apiResponse) {
      console.log('Success:', result.apiResponse);
      // Process data
    }
  }}
/>
```

### 9. Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### 10. Troubleshooting

**Popup Blocked**: Ensure popups are allowed for your domain in browser settings.

**API Calls Failing**: Verify your domain is registered in the developer console.

**Data Not Loading**: Check browser console for errors and ensure proper integration.

### 11. Support

For issues or questions:
- Check the [troubleshooting guide](./POPUP_IMPLEMENTATION_README.md)
- Review browser console for errors
- Contact support with detailed error information

---

## Legacy Documentation (v1.x)

*The following sections document the previous complex implementation for reference:*

### Legacy Request Object Format

Previously required complex request objects:
```json
"RequestObject":{ 
    "Small": {
      "type":"Personality",
      "descriptions":"Insight into your Interests",
      "reward":"10% Discount"
    },
    "Medium":{
      "type":"Personality",
      "descriptions":"Insight into your Interests",
      "reward":"2 USDC"
    },
    "Large":{
      "type":"Personality",
      "descriptions":"Insight into your Interests",
      "reward":"2 USDC"
    }
  }
```

### Legacy API Usage

Previously required manual event handling:
```jsx
export default async function UseAPIURL(event){
    if (event.data && event.data.source === 'content-script' && event.data.type === 'API_URL_RESPONSE') {
      const { APIurl, accessToken } = event.data;
      await fetch(APIurl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(InputData),
      }).then(async (data)=>{
            // process Onairos Data
      })
      .catch(error => console.error(error));
    }
}
```

*This manual approach is no longer needed with v2.0's autoFetch functionality.*

### Legacy Output Format

API still responds with the same format:
```json
{
  "output": [
    [[0.9998]],
    [[0.9999]],
    [[0.9922]],
    [[0.0013]]
  ]
}
```

### Integration Notes

When integrating the onairos package into your application, ensure your Webpack configuration handles dynamic imports correctly and serves the necessary chunk files from `node_modules/onairos/dist`.


# Onairos Popup Implementation & AutoFetch

## Overview

This document describes the redesigned iframe implementation that now uses a popup window approach to fix display cutoff issues and introduces automatic API fetching functionality.

## Problem Solved

**Previous Issue**: The iframe modal overlay was being cut off and not displaying properly, as shown in user feedback.

**Solution**: Replaced the modal overlay with a properly positioned popup window that:
- Opens in a separate window with optimal positioning
- Avoids being cut off by parent container constraints
- Provides better user experience with dedicated window space
- Automatically handles API calls when data is approved

## Key Features

### 1. Popup Window Implementation
- **Proper Positioning**: Centers popup on screen while ensuring it fits within screen bounds
- **Optimal Sizing**: 450x700px window size for comfortable data selection
- **Focus Management**: Automatically brings popup to focus when opened
- **Cross-browser Compatibility**: Works across different browsers and contexts

### 2. AutoFetch Functionality (Default: Enabled)
- **Automatic API Calls**: When `autoFetch` is `true` (default), API calls are made automatically after user approves data
- **Real-time Status**: Shows loading states and API response status
- **Error Handling**: Gracefully handles API failures with user-friendly messages
- **Configurable**: Can be disabled by setting `autoFetch: false`

### 3. Enhanced User Experience
- **Visual Feedback**: Loading spinners and status indicators
- **Selection Summary**: Shows count of selected data types
- **Smart Buttons**: Buttons adapt based on autoFetch setting
- **Responsive Design**: Works well on different screen sizes

## Implementation Details

### Files Modified/Created

1. **`src/iframe/dataRequestHandler.js`** - Updated popup handler with autoFetch support
2. **`src/onairosButton.jsx`** - Modified to use popup instead of modal overlay
3. **`src/components/DataRequest.js`** - Enhanced with autoFetch functionality
4. **`public/data_request_popup.html`** - New standalone popup HTML file
5. **`onairos.d.ts`** - Updated TypeScript definitions

### Key Functions

#### `openDataRequestPopup(data)`
```javascript
const popup = openDataRequestPopup({
  requestData: ['email', 'profile'],
  webpageName: 'My App',
  userData: { email: 'user@example.com' },
  autoFetch: true,
  proofMode: false
});
```

#### `listenForPopupMessages(callback, options)`
```javascript
const cleanup = listenForPopupMessages(
  handlePopupMessage,
  {
    autoFetch: true,
    onApiResponse: handleApiResponse
  }
);
```

## Usage Examples

### Basic Usage (AutoFetch Enabled)
```jsx
<OnairosButton
  requestData={['email', 'profile', 'social']}
  webpageName="My Application"
  autoFetch={true} // Default
  onComplete={(result) => {
    console.log('Data approved:', result.approved);
    console.log('API Response:', result.apiResponse);
  }}
/>
```

### Manual API Handling (AutoFetch Disabled)
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

## API Response Format

When `autoFetch` is enabled, the `onComplete` callback receives:

```javascript
{
  approved: ['email', 'profile'], // Array of approved data types
  timestamp: "2024-01-15T10:30:00.000Z",
  userEmail: "user@example.com",
  appName: "My Application",
  apiResponse: { /* API response data */ }, // Present on success
  apiError: "Error message", // Present on API failure
  apiUrl: "https://api2.onairos.uk/inferenceTest"
}
```

## Configuration Options

### OnairosButton Props
- `autoFetch` (boolean, default: `true`) - Enable automatic API calls
- `requestData` (array) - Specific data types to request
- `webpageName` (string) - Application name shown to user
- `onComplete` (function) - Callback when data request completes
- `proofMode` (boolean) - Enable proof mode for verification

### Popup Handler Options
- `autoFetch` (boolean) - Whether to make automatic API calls
- `onApiResponse` (function) - Callback for API responses

## Error Handling

The implementation includes comprehensive error handling:

1. **Popup Blocked**: Shows user-friendly message about enabling popups
2. **API Failures**: Displays error messages in the UI
3. **Network Issues**: Graceful degradation with retry logic
4. **Invalid Data**: Validation before API calls

## Testing

Use the provided test file to verify the implementation:

```bash
# Open the test file in a browser
open test-popup-implementation.html
```

The test demonstrates:
- Popup opening and positioning
- Data selection interface
- AutoFetch functionality
- API response handling
- Error scenarios

## Migration Guide

### From Modal to Popup

**Before (Modal)**:
```javascript
// Modal was embedded in page
setShowOverlay(true);
```

**After (Popup)**:
```javascript
// Popup opens in separate window
const popup = openDataRequestPopup(data);
```

### AutoFetch Integration

**Before (Manual API)**:
```javascript
onComplete={(result) => {
  if (result.approved) {
    fetch('/api/process', {
      method: 'POST',
      body: JSON.stringify(result.dataTypes)
    });
  }
}}
```

**After (AutoFetch)**:
```javascript
onComplete={(result) => {
  // API call already made automatically
  console.log('API Response:', result.apiResponse);
}}
```

## Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Security Considerations

1. **Cross-Origin Messaging**: Uses `postMessage` with origin validation
2. **Popup Blocking**: Graceful handling of popup blockers
3. **Data Validation**: Validates all data before API calls
4. **HTTPS Required**: API calls require secure connections

## Performance

- **Lazy Loading**: Popup HTML loaded only when needed
- **Efficient Messaging**: Minimal data transfer between windows
- **Memory Management**: Proper cleanup of event listeners
- **API Optimization**: Single API call per approval

## Troubleshooting

### Common Issues

1. **Popup Blocked**
   - Solution: Ensure popups are allowed for the domain
   - Check browser popup blocker settings

2. **API Calls Failing**
   - Verify network connectivity
   - Check API endpoint availability
   - Review CORS settings

3. **Data Not Passing**
   - Ensure popup loads completely before sending data
   - Check browser console for errors

### Debug Mode

Enable debug logging:
```javascript
localStorage.setItem('onairos-debug', 'true');
```

## Future Enhancements

- [ ] Offline support with request queuing
- [ ] Custom API endpoint configuration
- [ ] Batch API requests for multiple approvals
- [ ] Enhanced analytics and tracking
- [ ] Mobile-optimized popup sizing

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Test with the provided test file
4. Contact support with detailed error information 
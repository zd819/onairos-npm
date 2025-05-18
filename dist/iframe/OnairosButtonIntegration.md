# Onairos Button Integration Guide

This document provides guidance on how to integrate the new iframe-based data request system into the OnairosButton component when ready.

## Changes Required to OnairosButton.jsx

When you're ready to implement the iframe approach (replacing the window.message approach), you'll need to make the following changes to `onairosButton.jsx`:

### 1. Import the iframe handler module

```javascript
// Add this near the top of the file with other imports
import { openDataRequestIframe, closeDataRequestIframe, sendDataToIframe, listenForIframeMessages } from './iframe/dataRequestHandler.js';
```

### 2. Modify the `openTerminal` function in OnairosButton

Current implementation:
```javascript
const openTerminal = async () => {
  window.postMessage({ 
    action: 'terminalOpened',
    requestData: requestData, 
    webpageName: webpageName,
    activeModels: activeModels, 
    avatar: avatar,
    traits: traits
  }, '*');
}
```

New implementation using iframe:
```javascript
const openTerminal = async () => {
  // Open the iframe in a new window at the top-right corner
  const iframeWindow = openDataRequestIframe();
  
  // If the window opened successfully, send data to it
  if (iframeWindow) {
    // Store reference to the iframe window
    setIframeWindowRef(iframeWindow);
    
    // Wait for the iframe to initialize
    const initializeIframe = () => {
      // Send data to the iframe
      sendDataToIframe(iframeWindow, {
        type: 'initDataRequest',
        requestData: requestData,
        dataRequester: webpageName,
        activeModels: activeModels,
        avatar: avatar,
        traits: traits
      });
    };
    
    // Listen for messages from the iframe
    listenForIframeMessages((data) => {
      if (data.action === 'iframeReady') {
        // The iframe is ready to receive data
        initializeIframe();
      } else if (data.action === 'dataRequestConfirmed') {
        // Handle confirmed data request
        handleApprovedDataRequest(data.approvedRequests);
      } else if (data.action === 'dataRequestRejected') {
        // Handle rejected data request
        handleRejectedDataRequest();
      } else if (data.action === 'terminalClosed') {
        // Handle iframe closed event
        setIframeWindowRef(null);
      }
    });
  }
}
```

### 3. Add state for storing the iframe window reference

```javascript
// Add near other state declarations
const [iframeWindowRef, setIframeWindowRef] = useState(null);
```

### 4. Implement handlers for iframe responses

```javascript
// Add these new functions to handle responses from the iframe
const handleApprovedDataRequest = (approvedRequests) => {
  // This replaces the current handleAPIResponse logic
  // Process the approved requests from the iframe
  console.log('Approved data requests:', approvedRequests);
  
  // Continue with your existing flow to process the requests
  // e.g., call makeApiCall with the approved requests
  
  // Clear the iframe reference
  setIframeWindowRef(null);
}

const handleRejectedDataRequest = () => {
  console.log('Data request rejected by user');
  
  // Handle rejection - reset states if needed
  setSelectedRequests({});
  setGranted(0);
  
  // Clear the iframe reference
  setIframeWindowRef(null);
}
```

### 5. Clean up iframe when component unmounts

```javascript
// Modify your existing useEffect cleanup or add a new one
useEffect(() => {
  return () => {
    // Close the iframe if it's still open when the component unmounts
    if (iframeWindowRef) {
      closeDataRequestIframe(iframeWindowRef);
    }
  };
}, [iframeWindowRef]);
```

## Testing

When implementing this change:

1. Test the iframe opens correctly in the top right corner
2. Verify data flows correctly from the main app to the iframe
3. Confirm user selections in the iframe are properly sent back to the main app
4. Ensure the iframe closes properly after user action or when the component unmounts

## Progressive Implementation

You can implement this change gradually:

1. First, keep both systems in parallel (window.message and iframe)
2. Test the iframe approach with a feature flag
3. Once confirmed working, remove the old window.message implementation

## Build Configuration

Ensure your build process is configured to:

1. Copy the iframe HTML file to the correct location
2. Bundle the iframe JavaScript correctly
3. Update your manifest.json to include the new HTML file in web_accessible_resources

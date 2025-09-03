# New Onairos SDK Features

## 🎯 Overview

We've added two major developer experience improvements to the Onairos SDK:

1. **Programmatic Overlay Function** - Trigger the Onairos authentication and data request flow without the button component
2. **Dictionary Response Format** - Get personality data as named objects instead of remembering array indices

## 🚀 Feature 1: Programmatic Overlay Function

### Problem Solved
Previously, developers could only trigger the Onairos flow by using the `OnairosButton` component. Now you can integrate Onairos into any UI element or trigger it programmatically.

### New Exports Available

```javascript
import { 
  openOnairosOverlay,    // Function to open overlay programmatically
  useOnairosOverlay,     // React hook for overlay management
  getOnairosData         // Direct data access (placeholder for future)
} from 'onairos';
```

### Usage Examples

#### Basic Programmatic Usage
```javascript
import { openOnairosOverlay } from 'onairos';

const handleCustomButton = async () => {
  try {
    const cleanup = await openOnairosOverlay({
      webpageName: "My App",
      requestData: ['basic', 'personality'],
      autoFetch: true,
      onComplete: (result) => {
        console.log('User data received:', result);
        // Handle the result
      }
    });
    
    // Optional: Call cleanup() to close overlay programmatically
  } catch (error) {
    console.error('Failed to open overlay:', error);
  }
};

// Attach to any element
<button onClick={handleCustomButton}>Get My Data</button>
```

#### React Hook Usage
```javascript
import { useOnairosOverlay } from 'onairos';

function MyComponent() {
  const overlay = useOnairosOverlay({
    webpageName: "My App",
    requestData: ['personality'],
    onComplete: (result) => {
      // Handle result
    }
  });

  return (
    <button 
      onClick={() => overlay.open()}
      disabled={overlay.isLoading}
    >
      {overlay.isLoading ? 'Loading...' : 'Discover Personality'}
    </button>
  );
}
```

#### Vanilla JavaScript Integration
```javascript
// Works without React
window.addEventListener('click', async (e) => {
  if (e.target.id === 'my-onairos-btn') {
    const cleanup = await window.Onairos.openOnairosOverlay({
      webpageName: "Vanilla JS App",
      requestData: ['basic', 'personality'],
      onComplete: (result) => {
        document.getElementById('results').innerHTML = 
          JSON.stringify(result.apiResponse, null, 2);
      }
    });
  }
});
```

## 📊 Feature 2: Dictionary Response Format

### Problem Solved
Previously, developers had to remember that personality scores came as an array where index 0 = Analyst, index 1 = Diplomat, etc. This was error-prone and hard to maintain.

### Before (Array Format)
```javascript
onComplete: (result) => {
  const scores = result.apiResponse.InferenceResult.traits;
  
  // Hard to remember what each index means!
  const analystScore = scores[0];    // 😰 What was index 0 again?
  const diplomatScore = scores[1];   // 😰 And index 1?
  const sentinelScore = scores[2];   // 😰 This is confusing...
}
```

### After (Dictionary Format)
```javascript
onComplete: (result) => {
  const { traits, personalityDict } = result.apiResponse.InferenceResult;
  
  // Much clearer and less error-prone! 🎉
  const { Analyst, Diplomat, Sentinel, Explorer } = personalityDict;
  
  // Or access directly
  const analystScore = personalityDict.Analyst;
  const commanderScore = personalityDict.Commander;
}
```

### All 16 Personality Types Available
```javascript
const personalityTypes = [
  'Analyst', 'Diplomat', 'Sentinel', 'Explorer',
  'Architect', 'Logician', 'Commander', 'Debater',
  'Advocate', 'Mediator', 'Protagonist', 'Campaigner',
  'Logistician', 'Defender', 'Executive', 'Consul'
];
```

### Backward Compatibility
The array format is still available! You get both formats by default:

```javascript
onComplete: (result) => {
  const inference = result.apiResponse.InferenceResult;
  
  // Both formats available
  const arrayFormat = inference.traits;           // [0.8, 0.6, 0.4, ...]
  const dictFormat = inference.personalityDict;   // { Analyst: 0.8, Diplomat: 0.6, ... }
  
  // Use whichever you prefer!
}
```

### Control Response Formatting

#### Enable/Disable Dictionary Format
```javascript
<OnairosButton
  webpageName="My App"
  requestData={['personality']}
  formatResponse={true}  // Enable dictionary format (default: true)
  responseFormat={{
    includeDictionary: true,  // Include personalityDict
    includeArray: true        // Keep original array format too
  }}
  onComplete={handleResult}
/>
```

#### Manual Formatting
```javascript
import { formatPersonalityScores } from 'onairos';

// If you need to format manually
const personalityDict = formatPersonalityScores(scoresArray);
```

## 🔧 Configuration Options

### openOnairosOverlay() Parameters
```javascript
{
  requestData: ['basic', 'personality', 'preferences'],  // Data types to request
  webpageName: 'My App',                                 // Your app name
  onComplete: (result) => {},                            // Completion callback
  autoFetch: true,                                       // Auto-fetch data
  testMode: false,                                       // Use test endpoints
  appIcon: 'https://myapp.com/icon.png',                // Your app icon
  formatResponse: true,                                  // Enable dictionary format
  responseFormat: {                                      // Formatting options
    includeDictionary: true,
    includeArray: true
  }
}
```

### OnairosButton New Props
```javascript
<OnairosButton
  // ... existing props ...
  formatResponse={true}                    // Enable automatic formatting
  responseFormat={{                        // Formatting options
    includeDictionary: true,
    includeArray: true
  }}
/>
```

## 📁 File Structure
```
src/
├── utils/
│   ├── overlayHandler.js         # New overlay functions
│   └── responseFormatter.js      # New response formatting
├── onairos.jsx                   # Updated main export
└── onairosButton.jsx             # Updated with formatting
```

## 🔄 Migration Guide

### For Existing Users
- **No breaking changes!** Your existing code continues to work exactly as before
- The array format is still available alongside the new dictionary format
- All existing props and functions work the same way

### To Use New Features
1. **Dictionary Format**: It's enabled by default! Just access `result.apiResponse.InferenceResult.personalityDict`
2. **Programmatic Overlay**: Import `openOnairosOverlay` and use it with your custom UI elements

### Example Migration
```javascript
// Before
onComplete: (result) => {
  const scores = result.apiResponse.InferenceResult.traits;
  if (scores[0] > 0.7) { // Analyst
    enableAnalyticsMode();
  }
}

// After (both work!)
onComplete: (result) => {
  const { traits, personalityDict } = result.apiResponse.InferenceResult;
  
  // Old way still works
  if (traits[0] > 0.7) {
    enableAnalyticsMode();
  }
  
  // New way is clearer
  if (personalityDict.Analyst > 0.7) {
    enableAnalyticsMode();
  }
}
```

## 🎉 Benefits Summary

### For Developers
- ✅ **More flexible integration** - Use any UI element to trigger Onairos
- ✅ **Clearer code** - No more remembering array indices for personality types
- ✅ **Better maintainability** - Named properties are self-documenting
- ✅ **Backward compatible** - Existing code continues to work
- ✅ **Type safety ready** - Dictionary format works better with TypeScript

### For End Users
- ✅ **Same great experience** - The Onairos flow UI remains unchanged
- ✅ **Works everywhere** - Can be triggered from any button or interaction

## 📞 Support

If you have any questions about these new features:
- Check the updated examples in `example-usage-updated.js`
- Refer to existing documentation for the core Onairos functionality
- The new features are additive - your existing integration continues to work! 
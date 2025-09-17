# Onairos responseFormat Guide

## Overview

The `responseFormat` parameter in Onairos allows developers to control how personality and trait data is formatted in API responses. This provides both array-based and dictionary-based access to the same data for maximum flexibility.

## Parameters

### `responseFormat` Object
```javascript
responseFormat = {
  includeDictionary: true,  // Add named dictionary format
  includeArray: true        // Keep original array format
}
```

### `includeDictionary` (boolean, default: true)
When `true`, adds a `personalityDict` object to responses that contains personality scores mapped to human-readable names instead of array indices.

### `includeArray` (boolean, default: true)  
When `true`, preserves the original array format (`traits`) alongside the dictionary format.

## How It Works

### Without Dictionary Format (Legacy)
```javascript
// API returns personality scores as an array
const result = {
  apiResponse: {
    InferenceResult: {
      traits: [0.85, 0.72, 0.61, 0.43, 0.91, 0.67, 0.55, 0.78, 0.82, 0.64, 0.71, 0.89, 0.56, 0.73, 0.68, 0.81]
      //      ↑     ↑     ↑     ↑     ↑
      //   Analyst Diplomat Sentinel Explorer Architect...
    }
  }
}

// Developers had to remember array positions
const analystScore = result.apiResponse.InferenceResult.traits[0];    // 0.85
const diplomatScore = result.apiResponse.InferenceResult.traits[1];   // 0.72
const sentinelScore = result.apiResponse.InferenceResult.traits[2];   // 0.61
```

### With Dictionary Format (New & Improved)
```javascript
// Same API response, but now formatted with both array and dictionary
const result = {
  apiResponse: {
    InferenceResult: {
      traits: [0.85, 0.72, 0.61, 0.43, 0.91, 0.67, 0.55, 0.78, 0.82, 0.64, 0.71, 0.89, 0.56, 0.73, 0.68, 0.81],
      personalityDict: {
        Analyst: 0.85,
        Diplomat: 0.72,
        Sentinel: 0.61,
        Explorer: 0.43,
        Architect: 0.91,
        Logician: 0.67,
        Commander: 0.55,
        Debater: 0.78,
        Advocate: 0.82,
        Mediator: 0.64,
        Protagonist: 0.71,
        Campaigner: 0.89,
        Logistician: 0.56,
        Defender: 0.73,
        Executive: 0.68,
        Consul: 0.81
      }
    }
  }
}

// Much easier access by name!
const { Analyst, Diplomat, Sentinel } = result.apiResponse.InferenceResult.personalityDict;
```

## Usage Examples

### Example 1: Default Behavior (Both Formats)
```javascript
<OnairosButton
  webpageName="My App"
  requestData={['personality']}
  formatResponse={true}  // Enables formatting (default: true)
  responseFormat={{
    includeDictionary: true,  // Add dictionary (default: true) 
    includeArray: true        // Keep array (default: true)
  }}
  onComplete={(result) => {
    const inference = result.apiResponse.InferenceResult;
    
    // Access by array index (legacy way)
    const analystByIndex = inference.traits[0];
    
    // Access by name (new way) 
    const analystByName = inference.personalityDict.Analyst;
    
    console.log('Same value:', analystByIndex === analystByName); // true
  }}
/>
```

### Example 2: Dictionary Only (Cleaner Response)
```javascript
<OnairosButton
  webpageName="My App"
  requestData={['personality']}
  responseFormat={{
    includeDictionary: true,  // Add dictionary
    includeArray: false       // Remove array to clean up response
  }}
  onComplete={(result) => {
    const inference = result.apiResponse.InferenceResult;
    
    // Only dictionary format available
    const { Analyst, Diplomat, Architect } = inference.personalityDict;
    
    // inference.traits is undefined (removed)
    console.log('traits array:', inference.traits); // undefined
  }}
/>
```

### Example 3: Array Only (Legacy Compatibility)
```javascript
<OnairosButton
  webpageName="My App" 
  requestData={['personality']}
  responseFormat={{
    includeDictionary: false, // No dictionary
    includeArray: true        // Keep original array
  }}
  onComplete={(result) => {
    const inference = result.apiResponse.InferenceResult;
    
    // Only array format (original behavior)
    const analystScore = inference.traits[0];
    
    // inference.personalityDict is undefined
    console.log('personalityDict:', inference.personalityDict); // undefined
  }}
/>
```

### Example 4: Programmatic Overlay Usage
```javascript
import { openOnairosOverlay } from 'onairos';

async function requestUserData() {
  const cleanup = await openOnairosOverlay({
    requestData: ['personality', 'preferences'],
    webpageName: 'My App',
    formatResponse: true,
    responseFormat: {
      includeDictionary: true,
      includeArray: false  // Only dictionary for cleaner data
    },
    onComplete: (result) => {
      const { personalityDict } = result.apiResponse.InferenceResult;
      
      // Use personality data in your app
      updateUserProfile(personalityDict);
      displayPersonalityInsights(personalityDict);
    }
  });
}
```

## Personality Types Reference

The dictionary format uses these 16 standard personality type names:

```javascript
const PERSONALITY_TYPES = [
  'Analyst',      // Index 0
  'Diplomat',     // Index 1  
  'Sentinel',     // Index 2
  'Explorer',     // Index 3
  'Architect',    // Index 4
  'Logician',     // Index 5
  'Commander',    // Index 6
  'Debater',      // Index 7
  'Advocate',     // Index 8
  'Mediator',     // Index 9
  'Protagonist',  // Index 10
  'Campaigner',   // Index 11
  'Logistician',  // Index 12
  'Defender',     // Index 13
  'Executive',    // Index 14
  'Consul'        // Index 15
];
```

## Trait Categories (for preference data)

```javascript
const TRAIT_CATEGORIES = [
  'Openness',         // Index 0
  'Conscientiousness', // Index 1
  'Extraversion',     // Index 2 
  'Agreeableness',    // Index 3
  'Neuroticism'       // Index 4
];
```

## Manual Formatting

If you need to format responses manually:

```javascript
import { formatOnairosResponse, formatPersonalityScores } from 'onairos';

// Format full API response
const formatted = formatOnairosResponse(apiResponse, {
  includeDictionary: true,
  includeArray: false
});

// Format just personality scores array  
const personalityDict = formatPersonalityScores(scoresArray);
```

## Migration Guide

### Existing Code (No Changes Needed)
Your existing code continues to work exactly as before:

```javascript
// This still works perfectly
onComplete: (result) => {
  const scores = result.apiResponse.InferenceResult.traits;
  const analystScore = scores[0]; // Still works
}
```

### Enhanced Code (Using New Features)
```javascript
// Enhanced with dictionary access
onComplete: (result) => {
  const inference = result.apiResponse.InferenceResult;
  
  // Old way still works
  const analystScore = inference.traits[0];
  
  // New way is easier
  const { Analyst, Diplomat, Architect } = inference.personalityDict;
  
  // Use whichever you prefer!
}
```

## Best Practices

1. **Use Dictionary Format**: Much easier to read and maintain than array indices
2. **Keep Array Format**: Set `includeArray: true` if you have existing code that uses array indices
3. **Clean Responses**: Set `includeArray: false` in new projects to keep responses cleaner
4. **Type Safety**: The dictionary keys are consistent and predictable across all API calls

## Troubleshooting

### Q: Why is `personalityDict` undefined?
A: Either `formatResponse` is `false` or `includeDictionary` is `false`

### Q: Why is `traits` array undefined? 
A: You set `includeArray: false` in responseFormat

### Q: Can I use both formats together?
A: Yes! By default both are included. Access the same data via array index or dictionary key.

### Q: Will this break my existing code?
A: No! All existing code continues to work. The dictionary format is additional, not a replacement.



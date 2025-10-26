# API Response Logging - Console Output Example

This document shows exactly what you'll see in the browser console when the API response is logged.

## Example 1: Test Mode Response

When running in test mode (`testMode={true}`), you'll see:

```
🧪 Test Mode: Simulated API Response

🎯 Onairos API Response
  📡 Endpoint: TEST_MODE
  ⏰ Timestamp: 2025-10-26T15:30:45.123Z
  ═══════════════════════════════════════════════════════════════════════
  
  ▼ 📊 Inference Result
    ▼ 🎯 Content Preferences
         📊 Content Preference Scores (0.0 = Not Interested, 1.0 = Highly Interested)
         ─────────────────────────────────────────────────────────────────────
         
         ┌─────────┬───────────────────────────┬─────────┬─────────────────────┬─────────────────┐
         │ (index) │         Category          │  Score  │       Visual        │ Interest Level  │
         ├─────────┼───────────────────────────┼─────────┼─────────────────────┼─────────────────┤
         │    0    │ 'Technology & Innovation' │ '0.873' │ '█████████░ 🔥'     │  'Very High'    │
         │    1    │ 'Entertainment & Media'   │ '0.654' │ '███████░░░ ⭐'     │     'High'      │
         │    2    │ 'Health & Wellness'       │ '0.432' │ '████░░░░░░ 👍'     │   'Moderate'    │
         │    3    │ 'Business & Finance'      │ '0.789' │ '████████░░ ⭐'     │     'High'      │
         │    4    │ 'Education & Learning'    │ '0.912' │ '█████████░ 🔥'     │  'Very High'    │
         │    5    │ 'Travel & Adventure'      │ '0.567' │ '██████░░░░ ⭐'     │     'High'      │
         │    6    │ 'Food & Cooking'          │ '0.345' │ '███░░░░░░░ 👍'     │   'Moderate'    │
         │    7    │ 'Sports & Fitness'        │ '0.234' │ '██░░░░░░░░ 📊'     │      'Low'      │
         │    8    │ 'Art & Creativity'        │ '0.823' │ '████████░░ 🔥'     │  'Very High'    │
         │    9    │ 'Science & Research'      │ '0.701' │ '███████░░░ ⭐'     │     'High'      │
         │   10    │ 'Fashion & Style'         │ '0.412' │ '████░░░░░░ 👍'     │   'Moderate'    │
         │   11    │ 'Gaming & Esports'        │ '0.598' │ '██████░░░░ ⭐'     │     'High'      │
         │   12    │ 'Music & Audio'           │ '0.756' │ '████████░░ ⭐'     │     'High'      │
         │   13    │ 'News & Politics'         │ '0.289' │ '███░░░░░░░ 📊'     │      'Low'      │
         │   14    │ 'Home & Garden'           │ '0.445' │ '████░░░░░░ 👍'     │   'Moderate'    │
         │   15    │ 'Automotive & Transport'  │ '0.523' │ '█████░░░░░ ⭐'     │     'High'      │
         └─────────┴───────────────────────────┴─────────┴─────────────────────┴─────────────────┘
         
         📈 Summary: Avg 0.584 | Max 0.912 (Education & Learning) | Min 0.234 (Sports & Fitness)
    
    ▼ 🧠 Personality Analysis
         ✨ Positive Traits (Strengths) - Scale: 0-100
         ─────────────────────────────────────────────────────────────────────
         
         ┌─────────┬──────────────────────┬─────────┬─────────────────────┬──────────────┐
         │ (index) │        Trait         │  Score  │       Visual        │    Level     │
         ├─────────┼──────────────────────┼─────────┼─────────────────────┼──────────────┤
         │    0    │    'Creativity'      │ '85.5'  │ '█████████░ 🔥'     │ 'Exceptional'│
         │    1    │      'Empathy'       │ '78.2'  │ '████████░░ ⭐'     │   'Strong'   │
         │    2    │    'Leadership'      │ '72.8'  │ '███████░░░ ⭐'     │   'Strong'   │
         │    3    │'Analytical Thinking' │ '88.9'  │ '█████████░ 🔥'     │ 'Exceptional'│
         │    4    │  'Communication'     │ '81.3'  │ '████████░░ 🔥'     │ 'Exceptional'│
         └─────────┴──────────────────────┴─────────┴─────────────────────┴──────────────┘
         
         🎯 Traits to Improve (Growth Areas) - Scale: 0-100
         ─────────────────────────────────────────────────────────────────────
         
         ┌─────────┬───────────────────┬─────────┬─────────────────────┬──────────────────┐
         │ (index) │       Trait       │  Score  │       Visual        │     Priority     │
         ├─────────┼───────────────────┼─────────┼─────────────────────┼──────────────────┤
         │    0    │    'Patience'     │ '45.2'  │ '█████░░░░░ 👍'     │ 'Low Priority'   │
         │    1    │'Time Management'  │ '52.7'  │ '█████░░░░░ ⭐'     │'Medium Priority' │
         │    2    │   'Delegation'    │ '38.9'  │ '████░░░░░░ 👍'     │ 'Low Priority'   │
         └─────────┴───────────────────┴─────────┴─────────────────────┴──────────────────┘
  
  ▼ 👤 Persona Information
       👤 Applied Persona
       ─────────────────────────────────────────────────────────────────────
       Name: Test Persona
       ID: 1
       Description: Simulated persona for testing
  
  ▼ ℹ️  Metadata
       ℹ️  Inference Metadata
       ─────────────────────────────────────────────────────────────────────
       Model Size: Large
       Total Outputs: 16
       Persona Applied: Test Persona
  
  ═══════════════════════════════════════════════════════════════════════
  ✅ Response logging complete

🧪 Test mode: Simulated data request completed
```

## Example 2: Production Mode Response

When running in production mode with real API:

```
🔥 Raw API Response received from backend

🎯 Onairos API Response
  📡 Endpoint: https://api2.onairos.uk/getAPIurlMobile
  ⏰ Timestamp: 2025-10-26T15:35:22.456Z
  ═══════════════════════════════════════════════════════════════════════
  
  ▼ 📊 Inference Result
    ▼ 🎯 Content Preferences
         📊 Content Preference Scores (0.0 = Not Interested, 1.0 = Highly Interested)
         ─────────────────────────────────────────────────────────────────────
         
         [Similar table as above with real user data]
         
         📈 Summary: Avg 0.623 | Max 0.945 (Technology & Innovation) | Min 0.187 (Sports & Fitness)
    
    ▼ 🧠 Personality Analysis
         ✨ Positive Traits (Strengths) - Scale: 0-100
         ─────────────────────────────────────────────────────────────────────
         
         [Real personality trait data from user's connected accounts]
         
         🎯 Traits to Improve (Growth Areas) - Scale: 0-100
         ─────────────────────────────────────────────────────────────────────
         
         [Real improvement areas based on user behavior]
  
  ▼ 💬 LLM Data
       💬 LLM Conversation Data
       ─────────────────────────────────────────────────────────────────────
       Total Interactions: 127
       Platforms:
          ChatGPT: 45 interactions
          Claude: 32 interactions
          Gemini: 50 interactions
       Recent Interactions: 10 available
  
  ═══════════════════════════════════════════════════════════════════════
  ✅ Response logging complete

🔥 DataRequest: Calling onComplete with result: {...}
```

## Visual Legend

### Score Indicators (Emojis)
- 🔥 **Very High** - Score ≥ 0.8 (or ≥ 80%)
- ⭐ **High** - Score ≥ 0.6 (or ≥ 60%)
- 👍 **Moderate** - Score ≥ 0.4 (or ≥ 40%)
- 📊 **Low** - Score ≥ 0.2 (or ≥ 20%)
- 📉 **Very Low** - Score < 0.2 (or < 20%)

### Progress Bars
- `█` - Filled bar (represents score level)
- `░` - Empty bar (represents remaining to max)
- Total of 10 bars = 100% or 1.0

Examples:
- `██████████` = 1.0 or 100% (perfect score)
- `█████░░░░░` = 0.5 or 50% (half)
- `██░░░░░░░░` = 0.2 or 20% (low)

### Console Groups
- `▼` - Expandable/collapsible section
- Click to expand/collapse in browser DevTools
- Helps organize large amounts of data

## How to Enable Raw JSON View

If you want to see the raw JSON response data, change this in `DataRequest.js`:

```javascript
logOnairosResponse(apiData, apiEndpoint, { 
  detailed: true, 
  showRawData: true  // Change to true
});
```

This will add an additional section at the end:

```
▼ 📦 Raw Response Data
     {
       InferenceResult: {
         output: [...],
         traits: {...}
       },
       ...
     }
```

## Browser DevTools Tips

1. **Expand/Collapse Groups**: Click the `▼` arrows to show/hide sections
2. **Copy Values**: Right-click any value → "Copy value"
3. **Search**: Use Cmd/Ctrl+F to search within console output
4. **Filter**: Use the DevTools filter box to show only "Onairos" logs
5. **Clear**: Click the 🚫 icon to clear console before testing

## Performance Notes

- Logging only happens AFTER API response is received
- No impact on API call speed or performance
- Tables are rendered client-side in browser
- Can be disabled by commenting out `logOnairosResponse()` calls


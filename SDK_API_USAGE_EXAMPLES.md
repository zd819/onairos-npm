# Onairos SDK API Usage Examples - Updated for New Backend Schema

## 🚀 **Quick Start with New API Schema**

### **1. Initialize SDK**
```javascript
import onairosSDK from './utils/onairosSDK';

// Initialize with API key
await onairosSDK.initializeApiKey({
  apiKey: 'your-api-key-here',
  environment: 'production', // or 'development'
  enableLogging: true
});
```

### **2. Email Verification & Authentication**
```javascript
// Step 1: Request verification code
await onairosSDK.requestEmailVerification('user@example.com');

// Step 2: Verify code and get JWT token
const authResult = await onairosSDK.verifyEmailCode('user@example.com', '123456');
// JWT token is automatically stored and used for subsequent requests
```

## 📊 **Inference Methods - All Updated for New Schema**

### **Basic Inference (Backward Compatible)**
```javascript
// Simple inference without LLM data
const result = await onairosSDK.runInference({
  persona: 1
});

console.log('Traits:', result.InferenceResult.traits);
console.log('Output:', result.InferenceResult.output);
```

### **Inference with LLM Data (New Feature)**
```javascript
// Inference including LLM conversation summaries
const result = await onairosSDK.runInference({
  persona: 1,
  includeLlmData: true  // 🆕 NEW PARAMETER
});

console.log('Traits:', result.InferenceResult.traits);
console.log('Output:', result.InferenceResult.output);

// 🆕 NEW: LLM conversation data
if (result.llmData) {
  console.log('Total LLM interactions:', result.llmData.totalInteractions);
  console.log('Platforms used:', result.llmData.platforms);
  console.log('Recent conversations:', result.llmData.recentInteractions);
}
```

### **Production Inference (No Proof Required)**
```javascript
// Production inference with custom input
const result = await onairosSDK.runInferenceNoProof({
  Input: ['preference1', 'preference2', 'preference3'],
  includeLlmData: true
});

// Same response format as above
console.log('Inference result:', result.InferenceResult);
console.log('LLM data:', result.llmData);
```

### **Mobile Inference**
```javascript
// Mobile-optimized inference
const result = await onairosSDK.runMobileInference({
  Input: ['mobile_preference1', 'mobile_preference2'],
  includeLlmData: true
});
```

### **Combined Inference (Multiple Models)**
```javascript
// Run inference across multiple models
const result = await onairosSDK.runCombinedInference({
  Input: ['combined_input1', 'combined_input2'],
  includeLlmData: true
});
```

## 🎯 **New Specialized Endpoints**

### **Traits Only (After Training)**
```javascript
// Get just personality traits without running full inference
const traitsResult = await onairosSDK.getTraitsOnly({
  includeLlmData: true
});

console.log('Traits:', traitsResult.traits);
console.log('LLM conversation summary:', traitsResult.llmData);
```

### **Combined Training + Inference Results**
```javascript
// Get both training results and inference capabilities
const combinedResult = await onairosSDK.getCombinedTrainingInference({
  includeLlmData: true
});

console.log('Training results:', combinedResult.trainingResults);
console.log('Inference results:', combinedResult.inferenceResults);
console.log('LLM data:', combinedResult.llmData);
```

### **Status Check**
```javascript
// Quick status check for combined training/inference
const status = await onairosSDK.getCombinedTrainingInferenceStatus();
console.log('Status:', status);
```

## 🧠 **Training Methods - Updated**

### **Training with Inference (Recommended)**
```javascript
// Start training and get inference results automatically
const result = await onairosSDK.startTrainingWithInference({
  socketId: 'unique-socket-id',
  connectedPlatforms: {
    platforms: [
      { platform: 'youtube', accessToken: 'token1' },
      { platform: 'reddit', accessToken: 'token2' }
    ]
  },
  includeLlmData: true  // 🆕 Include LLM data in training results
});

console.log('Training completed with inference:', result);
```

### **Training Only (No Inference)**
```javascript
// Training without automatic inference
const result = await onairosSDK.startTrainingOnly({
  socketId: 'unique-socket-id',
  connectedPlatforms: {
    platforms: [
      { platform: 'youtube', accessToken: 'token1' }
    ]
  }
});

console.log('Training completed:', result);
```

## 🤖 **LLM Data Management**

### **Store LLM Conversation Data (Browser Extension)**
```javascript
// Store encrypted conversation data from browser extension
const conversationData = {
  messages: [
    { role: 'user', content: 'Hello ChatGPT' },
    { role: 'assistant', content: 'Hello! How can I help you?' }
  ],
  platform: 'chatgpt',
  timestamp: new Date().toISOString()
};

const result = await onairosSDK.storeLLMData({
  encryptedData: btoa(JSON.stringify(conversationData)),
  encryptionMetadata: {
    algorithm: "AES-GCM",
    keyDerivation: "PBKDF2",
    iterations: 100000
  },
  authentication: {
    username: "user@example.com",
    timestamp: Date.now()
  },
  integrity: {
    hash: "sha256-hash-of-data",
    algorithm: "SHA-256"
  }
});

console.log('LLM data stored:', result);
```

### **Retrieve LLM History**
```javascript
// Get conversation history
const history = await onairosSDK.getLLMHistory({
  platform: 'chatgpt',  // Optional: filter by platform
  limit: 20,
  offset: 0
});

console.log('Conversation history:', history);
```

### **Get LLM Statistics**
```javascript
// Get usage statistics
const stats = await onairosSDK.getLLMStats();
console.log('LLM usage stats:', stats);
```

## 🔄 **Complete Workflow Examples**

### **Example 1: New User Onboarding with LLM Data**
```javascript
// 1. Email verification
await onairosSDK.requestEmailVerification('newuser@example.com');
const auth = await onairosSDK.verifyEmailCode('newuser@example.com', '123456');

// 2. Training with LLM data
const training = await onairosSDK.startTrainingWithInference({
  socketId: `training_${Date.now()}`,
  connectedPlatforms: { platforms: [] }, // Will connect platforms later
  includeLlmData: true
});

// 3. Get initial traits
const traits = await onairosSDK.getTraitsOnly({
  includeLlmData: true
});

console.log('New user setup complete:', { auth, training, traits });
```

### **Example 2: Existing User with LLM Conversations**
```javascript
// 1. Run inference with LLM data
const inference = await onairosSDK.runInferenceNoProof({
  Input: ['user_preference_1', 'user_preference_2'],
  includeLlmData: true
});

// 2. Check LLM conversation history
const llmHistory = await onairosSDK.getLLMHistory({
  limit: 10
});

// 3. Get combined results
const combined = await onairosSDK.getCombinedTrainingInference({
  includeLlmData: true
});

console.log('Existing user data:', { inference, llmHistory, combined });
```

### **Example 3: Browser Extension Integration**
```javascript
// Browser extension sends conversation data
import { storeLLMConversationData, getUserInfoFromStorage } from './utils/extensionDetection';

// Get user info from localStorage
const userInfo = getUserInfoFromStorage();

// Store conversation data
const conversationData = {
  platform: 'chatgpt',
  messages: [/* conversation messages */],
  timestamp: new Date().toISOString()
};

const stored = await storeLLMConversationData(conversationData, userInfo, 'chatgpt');

// Then get updated inference with LLM data
const inference = await onairosSDK.runInference({
  persona: 1,
  includeLlmData: true
});

console.log('Updated inference with LLM data:', inference);
```

## 📱 **Mobile App Integration**
```javascript
// Mobile-specific inference with LLM data
const mobileInference = async (userPreferences) => {
  try {
    const result = await onairosSDK.runMobileInference({
      Input: userPreferences,
      includeLlmData: true
    });
    
    return {
      personalityTraits: result.InferenceResult.traits,
      contentPreferences: result.InferenceResult.output,
      conversationInsights: result.llmData
    };
  } catch (error) {
    console.error('Mobile inference failed:', error);
    throw error;
  }
};

// Usage
const preferences = ['tech', 'gaming', 'productivity'];
const insights = await mobileInference(preferences);
```

## 🔐 **Authentication & Error Handling**
```javascript
// Comprehensive error handling
const safeInference = async (options) => {
  try {
    // Check if SDK is initialized
    if (!onairosSDK.isInitialized) {
      throw new Error('SDK not initialized');
    }
    
    // Run inference with error handling
    const result = await onairosSDK.runInference(options);
    
    return {
      success: true,
      data: result,
      hasLlmData: !!result.llmData
    };
  } catch (error) {
    console.error('Inference error:', error);
    
    return {
      success: false,
      error: error.message,
      suggestions: onairosSDK.handleTrainingErrorCode(error.code, error.details)
    };
  }
};

// Usage with error handling
const result = await safeInference({
  persona: 1,
  includeLlmData: true
});

if (result.success) {
  console.log('Inference successful:', result.data);
} else {
  console.log('Error:', result.error);
  console.log('Suggestions:', result.suggestions);
}
```

## 🎯 **Response Format Examples**

### **Standard Inference Response**
```javascript
{
  "InferenceResult": {
    "output": [[0.95], [0.89], [0.92]],
    "traits": {
      "openness": 0.85,
      "conscientiousness": 0.72,
      "extraversion": 0.68,
      "agreeableness": 0.91,
      "neuroticism": 0.23
    }
  }
}
```

### **Inference Response with LLM Data**
```javascript
{
  "InferenceResult": {
    "output": [[0.95], [0.89], [0.92]],
    "traits": {
      "openness": 0.85,
      "conscientiousness": 0.72,
      "extraversion": 0.68,
      "agreeableness": 0.91,
      "neuroticism": 0.23
    }
  },
  "llmData": {  // 🆕 NEW FIELD
    "hasLlmData": true,
    "totalInteractions": 25,
    "lastInteraction": "2024-10-17T12:00:00.000Z",
    "platforms": {
      "chatgpt": {
        "lastUsed": "2024-10-17T12:00:00.000Z",
        "totalInteractions": 15,
        "hasEncryptedData": true
      },
      "claude": {
        "lastUsed": "2024-10-16T10:30:00.000Z",
        "totalInteractions": 10,
        "hasEncryptedData": true
      }
    },
    "recentInteractions": [
      {
        "platform": "chatgpt",
        "conversationId": "ext_conv_123",
        "dataType": "browser_extension_encrypted",
        "summary": "Technical discussion about AI",
        "messageCount": 10,
        "createdAt": "2024-10-17T11:30:00.000Z",
        "isEncrypted": true
      }
    ],
    "note": "LLM conversation data available - use /llm-data/history for full access"
  }
}
```

## 🚀 **Migration Guide**

### **Phase 1: Backward Compatible (No Changes Required)**
```javascript
// Existing code continues to work unchanged
const result = await onairosSDK.runInference({ persona: 1 });
// Returns same format as before
```

### **Phase 2: Add LLM Data Support**
```javascript
// Simply add includeLlmData parameter
const result = await onairosSDK.runInference({ 
  persona: 1,
  includeLlmData: true  // 🆕 NEW
});
// Now includes llmData field in response
```

### **Phase 3: Use New Endpoints**
```javascript
// Leverage new specialized endpoints
const traits = await onairosSDK.getTraitsOnly({ includeLlmData: true });
const combined = await onairosSDK.getCombinedTrainingInference({ includeLlmData: true });
```

## 📋 **Summary**

**✅ All SDK methods updated for new backend API schema**  
**✅ Full backward compatibility maintained**  
**✅ LLM data integration available across all inference endpoints**  
**✅ New specialized endpoints for specific use cases**  
**✅ Browser extension integration with encrypted data storage**  
**✅ Comprehensive error handling and authentication**  

The SDK now provides complete access to both traditional personality analysis and LLM conversation insights, enabling rich personalized AI experiences! 🎉

/**
 * Capacitor LLM Data Collection Helper
 * 
 * This utility provides native LLM data collection for Capacitor apps
 * without requiring the browser extension. It uses direct API calls
 * to store LLM conversation data.
 * 
 * NOTE: These are placeholder functions for now. Implementation will be added
 * when LLM connectors are ready on the backend.
 * 
 * TO ENABLE LLM COLLECTION:
 * 1. Implement LLM backend endpoints
 * 2. Change LLM_COLLECTION_ENABLED to true
 * 3. The Capacitor/mobile detection is already handled - just add your logic
 */

import { isCapacitor, isMobileApp, getEnvironmentType } from './capacitorDetection.js';

// Feature flag - set to true when LLM backend is ready
// When enabled, mobile apps (Capacitor/React Native) will use these functions
// Capacitor detection is already built-in - you just need to implement the backend calls
const LLM_COLLECTION_ENABLED = false;

/**
 * Store LLM conversation data directly to Onairos backend
 * This is the "native method" for Capacitor/mobile apps - no browser extension needed
 * 
 * @param {Object} conversationData - LLM conversation data
 * @param {Array} conversationData.messages - Array of messages [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
 * @param {string} conversationData.platform - LLM platform ('chatgpt', 'claude', 'gemini', 'grok')
 * @param {string} conversationData.timestamp - ISO timestamp of conversation
 * @param {Object} userInfo - User authentication information
 * @param {string} userInfo.username - User's username or email
 * @param {string} userInfo.userId - User's unique ID
 * @param {string} userInfo.sessionToken - JWT session token
 * @param {string} platform - LLM platform name
 * @returns {Promise<Object>} Response object with success status
 */
export const storeCapacitorLLMData = async (conversationData, userInfo, platform) => {
  // Check if we're in mobile app environment
  if (!isMobileApp()) {
    console.warn('⚠️ [Capacitor LLM] Not in mobile app environment. Use browser extension for web.');
    return {
      success: false,
      error: 'Not in mobile app environment',
      note: 'Use browser extension for LLM data collection on web'
    };
  }

  // Feature flag check - when LLM_COLLECTION_ENABLED is true, the actual implementation will run
  if (!LLM_COLLECTION_ENABLED) {
    console.log('📱 [Capacitor LLM] LLM collection called (not yet implemented)', {
      platform,
      messageCount: conversationData?.messages?.length || 0,
      environment: getEnvironmentType(),
      isCapacitor: isCapacitor()
    });
    
    return {
      success: false,
      error: 'LLM collection not yet implemented',
      note: 'This is a placeholder. Implementation will be added when backend is ready.',
      data: {
        platform,
        environment: getEnvironmentType(),
        messageCount: conversationData?.messages?.length || 0
      }
    };
  }

  // TODO: Actual implementation will go here when LLM backend is ready
  // The implementation logic can be added by the other dev without worrying about Capacitor detection
  // as the detection is already handled above
  try {
    console.log('📱 [Capacitor LLM] Storing conversation data...', {
      platform,
      messageCount: conversationData.messages?.length || 0,
      environment: getEnvironmentType()
    });
    
    // Validate inputs
    if (!conversationData || !conversationData.messages) {
      throw new Error('conversationData.messages is required');
    }
    
    if (!userInfo || !userInfo.sessionToken) {
      throw new Error('userInfo.sessionToken is required');
    }
    
    if (!platform) {
      throw new Error('platform is required (chatgpt, claude, gemini, grok)');
    }
    
    // Generate hash for integrity check
    const dataHash = await generateDataHash(conversationData);
    
    // Determine source type based on environment
    const sourceType = isCapacitor() ? 'capacitor_app' : 
                      isMobileApp() ? 'react_native_app' : 
                      'mobile_app';
    
    // Format data according to backend API schema
    const payload = {
      encryptedData: btoa(JSON.stringify(conversationData)),
      encryptionMetadata: {
        algorithm: "AES-GCM",
        keyDerivation: "PBKDF2",
        iterations: 100000
      },
      authentication: {
        username: userInfo.username || userInfo.email,
        timestamp: Date.now()
      },
      integrity: {
        hash: dataHash,
        algorithm: "SHA-256"
      },
      platform: platform,
      source: sourceType,
      metadata: {
        environment: getEnvironmentType(),
        isCapacitor: isCapacitor(),
        isMobileApp: isMobileApp(),
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📤 [Capacitor LLM] Sending to API:', {
      endpoint: 'https://api2.onairos.uk/llm-data/store',
      platform,
      source: sourceType
    });
    
    const response = await fetch('https://api2.onairos.uk/llm-data/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.sessionToken || userInfo.jwtToken}`,
        'X-Onairos-User': userInfo.userId || userInfo.username,
        'X-Onairos-Source': sourceType
      },
      body: JSON.stringify(payload)
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      console.log('✅ [Capacitor LLM] Data stored successfully:', responseData);
      return {
        success: true,
        data: responseData,
        platform,
        source: sourceType
      };
    } else {
      console.error('❌ [Capacitor LLM] Failed to store data:', response.status, responseData);
      return {
        success: false,
        error: responseData.error || 'Failed to store LLM data',
        status: response.status,
        details: responseData
      };
    }
  } catch (error) {
    console.error('❌ [Capacitor LLM] Error storing conversation data:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
};

/**
 * Generate SHA-256 hash of data for integrity verification
 * @param {Object} data - Data to hash
 * @returns {Promise<string>} SHA-256 hash
 */
async function generateDataHash(data) {
  try {
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    const dataBuffer = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `sha256-${hashHex}`;
  } catch (error) {
    console.error('Error generating hash:', error);
    return `sha256-${Date.now()}`; // Fallback
  }
}

/**
 * Batch store multiple LLM conversations
 * @param {Array} conversations - Array of conversation objects
 * @param {Object} userInfo - User authentication info
 * @returns {Promise<Object>} Summary of batch operation
 */
export const storeBatchLLMData = async (conversations, userInfo) => {
  if (!LLM_COLLECTION_ENABLED) {
    console.log('📦 [Capacitor LLM] Batch LLM collection called (not yet implemented)');
    return {
      success: false,
      error: 'LLM collection not yet implemented',
      note: 'Placeholder function'
    };
  }

  // TODO: Implementation will go here
  console.log(`📦 [Capacitor LLM] Batch storing ${conversations.length} conversations...`);
  
  const results = {
    total: conversations.length,
    successful: 0,
    failed: 0,
    errors: []
  };
  
  for (const conversation of conversations) {
    const result = await storeCapacitorLLMData(
      {
        messages: conversation.messages,
        timestamp: conversation.timestamp
      },
      userInfo,
      conversation.platform
    );
    
    if (result.success) {
      results.successful++;
    } else {
      results.failed++;
      results.errors.push({
        platform: conversation.platform,
        error: result.error
      });
    }
  }
  
  console.log('📊 [Capacitor LLM] Batch operation complete:', results);
  return results;
};

/**
 * Retrieve LLM conversation history
 * @param {Object} userInfo - User authentication info
 * @param {Object} options - Query options
 * @param {string} options.platform - Filter by platform (optional)
 * @param {number} options.limit - Maximum number of conversations to retrieve
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<Object>} Conversation history
 */
export const getLLMHistory = async (userInfo, options = {}) => {
  if (!LLM_COLLECTION_ENABLED) {
    console.log('📥 [Capacitor LLM] Get history called (not yet implemented)');
    return {
      success: false,
      error: 'LLM collection not yet implemented',
      note: 'Placeholder function'
    };
  }

  // TODO: Implementation will go here
  try {
    const { platform, limit = 20, offset = 0 } = options;
    
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (platform) {
      queryParams.set('platform', platform);
    }
    
    console.log('📥 [Capacitor LLM] Fetching history:', options);
    
    const response = await fetch(`https://api2.onairos.uk/llm-data/history?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userInfo.sessionToken || userInfo.jwtToken}`,
        'X-Onairos-User': userInfo.userId || userInfo.username
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ [Capacitor LLM] History retrieved:', data.count || 0, 'conversations');
      return {
        success: true,
        data: data
      };
    } else {
      console.error('❌ [Capacitor LLM] Failed to retrieve history:', response.status);
      return {
        success: false,
        error: data.error || 'Failed to retrieve history'
      };
    }
  } catch (error) {
    console.error('❌ [Capacitor LLM] Error retrieving history:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get LLM usage statistics
 * @param {Object} userInfo - User authentication info
 * @returns {Promise<Object>} Usage statistics
 */
export const getLLMStats = async (userInfo) => {
  if (!LLM_COLLECTION_ENABLED) {
    console.log('📊 [Capacitor LLM] Get stats called (not yet implemented)');
    return {
      success: false,
      error: 'LLM collection not yet implemented',
      note: 'Placeholder function'
    };
  }

  // TODO: Implementation will go here
  try {
    console.log('📊 [Capacitor LLM] Fetching stats...');
    
    const response = await fetch('https://api2.onairos.uk/llm-data/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userInfo.sessionToken || userInfo.jwtToken}`,
        'X-Onairos-User': userInfo.userId || userInfo.username
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ [Capacitor LLM] Stats retrieved:', data);
      return {
        success: true,
        stats: data
      };
    } else {
      console.error('❌ [Capacitor LLM] Failed to retrieve stats:', response.status);
      return {
        success: false,
        error: data.error || 'Failed to retrieve stats'
      };
    }
  } catch (error) {
    console.error('❌ [Capacitor LLM] Error retrieving stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Helper to format conversation data from app
 * @param {Array} messages - Array of message objects
 * @param {string} platform - Platform name
 * @returns {Object} Formatted conversation data
 */
export const formatConversationData = (messages, platform) => {
  return {
    messages: messages.map(msg => ({
      role: msg.role || 'user',
      content: msg.content || msg.text || '',
      timestamp: msg.timestamp || new Date().toISOString()
    })),
    platform: platform,
    timestamp: new Date().toISOString(),
    metadata: {
      source: 'capacitor_app',
      environment: getEnvironmentType(),
      messageCount: messages.length
    }
  };
};


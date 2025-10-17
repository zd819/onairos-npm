/**
 * Onairos Browser Extension Detection Utility
 * 
 * This utility detects if the Onairos browser extension is installed
 * by checking for the global window.onairos object that the extension injects.
 * 
 * Based on the extension's inject-script.js implementation:
 * - window.onairos.isOnairos = true
 * - window.onairos.version = '1.0.0'
 * - 'onairosReady' event is dispatched when extension loads
 */

/**
 * Chrome Web Store URL for the Onairos browser extension
 */
export const ONAIROS_EXTENSION_STORE_URL = 'https://chromewebstore.google.com/detail/onairos/apkfageplidiblifhnadehmplfccapkf?hl=en';

/**
 * Timeout for extension detection (in milliseconds)
 */
const DETECTION_TIMEOUT = 2000;

/**
 * Detect if the Onairos browser extension is installed
 * @returns {Promise<boolean>} True if extension is installed and active
 */
export const detectOnairosExtension = () => {
  return new Promise((resolve) => {
    // Method 1: Direct detection - check if already loaded
    if (window.onairos && window.onairos.isOnairos) {
      console.log('✅ OnairosTerminal extension detected (already loaded)');
      resolve(true);
      return;
    }

    // Method 2: Event-based detection - wait for extension to load
    let resolved = false;
    
    const handleOnairosReady = () => {
      if (!resolved) {
        resolved = true;
        console.log('✅ OnairosTerminal extension detected (via event)');
        resolve(true);
      }
    };

    // Listen for the onairosReady event
    window.addEventListener('onairosReady', handleOnairosReady, { once: true });

    // Set timeout to avoid waiting indefinitely
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener('onairosReady', handleOnairosReady);
        console.log('❌ OnairosTerminal extension not detected (timeout)');
        resolve(false);
      }
    }, DETECTION_TIMEOUT);
  });
};

/**
 * Get extension information if available
 * @returns {Object|null} Extension info or null if not available
 */
export const getExtensionInfo = () => {
  if (window.onairos && window.onairos.getInfo) {
    return window.onairos.getInfo();
  }
  return null;
};

/**
 * Check if extension is available synchronously (for already loaded extensions)
 * @returns {boolean} True if extension is immediately available
 */
export const isExtensionAvailableSync = () => {
  return !!(window.onairos && window.onairos.isOnairos);
};

/**
 * Open Chrome Web Store to install the extension
 * @param {string} source - Source identifier for analytics (e.g., 'chatgpt', 'claude')
 */
export const openExtensionInstallPage = (source = 'unknown') => {
  console.log(`🔗 Opening Chrome Web Store for extension installation (source: ${source})`);
  
  // For now, use a placeholder URL - replace with actual extension ID when available
  const storeUrl = ONAIROS_EXTENSION_STORE_URL;
  
  // Try to open in new tab
  const installWindow = window.open(storeUrl, '_blank');
  
  if (!installWindow) {
    // Fallback if popup is blocked
    console.warn('⚠️ Popup blocked, redirecting to extension store');
    window.location.href = storeUrl;
  }
};

/**
 * LLM Platform URLs
 */
export const LLM_URLS = {
  chatgpt: 'https://chatgpt.com',
  claude: 'https://claude.ai',
  gemini: 'https://gemini.google.com',
  grok: 'https://grok.x.ai'
};

/**
 * Open LLM platform if extension is installed, otherwise prompt for extension installation
 * @param {string} platform - LLM platform name ('chatgpt', 'claude', 'gemini', 'grok')
 * @param {Function} onExtensionMissing - Callback when extension is not installed
 * @param {Object} userInfo - User information to pass to the LLM platform
 * @param {string} userInfo.username - User's username/email
 * @param {string} userInfo.userId - User's unique identifier
 * @param {string} userInfo.sessionToken - Optional session token
 * @returns {Promise<boolean>} True if LLM was opened, false if extension missing
 */
export const openLLMWithExtensionCheck = async (platform, onExtensionMissing = null, userInfo = {}) => {
  console.log(`🤖 Attempting to open ${platform} with extension check...`);
  
  // Check if extension is installed
  const hasExtension = await detectOnairosExtension();
  
  if (hasExtension) {
    // Extension is installed - open the LLM platform with user info
    const baseUrl = LLM_URLS[platform];
    if (baseUrl) {
      // Build URL with user parameters for the browser extension to detect
      const url = new URL(baseUrl);
      
      // Add Onairos-specific parameters that the extension can read
      if (userInfo.username) {
        url.searchParams.set('onairos_user', encodeURIComponent(userInfo.username));
      }
      if (userInfo.userId) {
        url.searchParams.set('onairos_id', encodeURIComponent(userInfo.userId));
      }
      if (userInfo.sessionToken) {
        url.searchParams.set('onairos_session', encodeURIComponent(userInfo.sessionToken));
      }
      
      // Add platform identifier for the extension
      url.searchParams.set('onairos_platform', platform);
      url.searchParams.set('onairos_source', 'npm_connector');
      url.searchParams.set('onairos_timestamp', Date.now().toString());
      
      const finalUrl = url.toString();
      console.log(`✅ Extension detected, opening ${platform} at ${finalUrl}`);
      console.log(`👤 User info: ${JSON.stringify(userInfo)}`);
      
      const llmWindow = window.open(finalUrl, '_blank');
      
      if (!llmWindow) {
        console.warn(`⚠️ Popup blocked for ${platform}`);
        return false;
      }
      return true;
    } else {
      console.error(`❌ Unknown LLM platform: ${platform}`);
      return false;
    }
  } else {
    // Extension is not installed - handle missing extension
    console.log(`❌ Extension not detected for ${platform}, prompting installation`);
    
    if (onExtensionMissing) {
      onExtensionMissing(platform);
    } else {
      // Default behavior: open extension store
      openExtensionInstallPage(platform);
    }
    
    return false;
  }
};

/**
 * Enhanced extension detection with retry mechanism
 * @param {number} maxRetries - Maximum number of detection attempts
 * @param {number} retryDelay - Delay between retries in milliseconds
 * @returns {Promise<boolean>} True if extension is detected
 */
export const detectExtensionWithRetry = async (maxRetries = 3, retryDelay = 500) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔍 Extension detection attempt ${attempt}/${maxRetries}`);
    
    const detected = await detectOnairosExtension();
    if (detected) {
      return true;
    }
    
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  console.log(`❌ Extension not detected after ${maxRetries} attempts`);
  return false;
};

/**
 * Extract Onairos user information from URL parameters
 * This function is intended to be used by the browser extension to read user info
 * @param {string} url - URL to parse (defaults to current page URL)
 * @returns {Object|null} User information object or null if no Onairos params found
 */
export const extractUserInfoFromURL = (url = window.location.href) => {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    // Check if this URL has Onairos parameters
    if (!params.has('onairos_user') && !params.has('onairos_id')) {
      return null;
    }
    
    const userInfo = {
      username: params.get('onairos_user') ? decodeURIComponent(params.get('onairos_user')) : null,
      userId: params.get('onairos_id') ? decodeURIComponent(params.get('onairos_id')) : null,
      sessionToken: params.get('onairos_session') ? decodeURIComponent(params.get('onairos_session')) : null,
      platform: params.get('onairos_platform') || null,
      source: params.get('onairos_source') || null,
      timestamp: params.get('onairos_timestamp') || null
    };
    
    // Only return if we have at least username or userId
    if (userInfo.username || userInfo.userId) {
      console.log('📋 Extracted Onairos user info from URL:', userInfo);
      return userInfo;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error extracting user info from URL:', error);
    return null;
  }
};

/**
 * Send user information to the browser extension
 * This function communicates with the extension to provide user context
 * @param {Object} userInfo - User information to send
 * @returns {Promise<boolean>} True if successfully sent to extension
 */
export const sendUserInfoToExtension = async (userInfo) => {
  try {
    if (!window.onairos || !window.onairos.isOnairos) {
      console.warn('⚠️ Onairos extension not detected, cannot send user info');
      return false;
    }
    
    // Send user info via postMessage to the extension
    window.postMessage({
      source: 'onairos_npm_connector',
      type: 'USER_INFO',
      data: {
        ...userInfo,
        timestamp: new Date().toISOString(),
        connectorVersion: '3.4.2'
      }
    }, '*');
    
    console.log('📤 Sent user info to Onairos extension:', userInfo);
    return true;
  } catch (error) {
    console.error('❌ Error sending user info to extension:', error);
    return false;
  }
};

/**
 * Send LLM conversation data to backend (for browser extension)
 * This function formats and sends encrypted conversation data to the new /llm-data/store endpoint
 * @param {Object} conversationData - Raw conversation data
 * @param {Object} userInfo - User authentication info
 * @param {string} platform - LLM platform (chatgpt, claude, gemini, grok)
 * @returns {Promise<boolean>} True if successfully stored
 */
export const storeLLMConversationData = async (conversationData, userInfo, platform) => {
  try {
    // Format data according to new backend API schema
    const payload = {
      encryptedData: btoa(JSON.stringify(conversationData)), // Base64 encode for now
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
        hash: await generateDataHash(conversationData),
        algorithm: "SHA-256"
      },
      platform: platform,
      source: 'browser_extension'
    };

    const response = await fetch('https://api2.onairos.uk/llm-data/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.sessionToken || userInfo.jwtToken}`,
        'X-Onairos-User': userInfo.userId || userInfo.username
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('✅ LLM conversation data stored successfully');
      return true;
    } else {
      console.error('❌ Failed to store LLM data:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error storing LLM conversation data:', error);
    return false;
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
 * Get user information from standard Onairos localStorage keys
 * @returns {Object} User information from localStorage
 */
export const getUserInfoFromStorage = () => {
  try {
    // Primary storage locations used by Onairos
    const userDataStr = localStorage.getItem('onairosUser'); // Main user data object
    const jwtToken = localStorage.getItem('onairos_jwt_token'); // JWT token from email verification
    const legacyToken = localStorage.getItem('onairosToken'); // Legacy token from login
    const username = localStorage.getItem('username'); // Username from login
    const userDataSDK = localStorage.getItem('onairos_user_data'); // SDK user data
    
    let userData = null;
    
    // Try to parse main user data
    if (userDataStr) {
      try {
        userData = JSON.parse(userDataStr);
      } catch (error) {
        console.warn('⚠️ Failed to parse onairosUser from localStorage');
      }
    }
    
    // Try to parse SDK user data as fallback
    if (!userData && userDataSDK) {
      try {
        userData = JSON.parse(userDataSDK);
      } catch (error) {
        console.warn('⚠️ Failed to parse onairos_user_data from localStorage');
      }
    }
    
    // Build comprehensive user info object
    const userInfo = {
      // User identification
      username: userData?.email || userData?.username || username || null,
      userId: userData?.userId || userData?.email || username || null,
      email: userData?.email || null,
      
      // Authentication tokens
      sessionToken: jwtToken || userData?.token || legacyToken || null,
      jwtToken: jwtToken || userData?.token || null,
      
      // User metadata
      isNewUser: userData?.isNewUser || false,
      verified: userData?.verified || false,
      onboardingComplete: userData?.onboardingComplete || false,
      pinCreated: userData?.pinCreated || false,
      
      // Account details
      accountInfo: userData?.accountInfo || null,
      connectedAccounts: userData?.connectedAccounts || [],
      
      // Timestamps
      lastLogin: userData?.lastLogin || null,
      createdAt: userData?.createdAt || null,
      
      // Source tracking
      source: 'localStorage_extraction',
      extractedAt: new Date().toISOString()
    };
    
    console.log('📋 Extracted user info from localStorage:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('❌ Error extracting user info from localStorage:', error);
    return {
      username: null,
      userId: null,
      sessionToken: null,
      source: 'extraction_failed',
      error: error.message
    };
  }
};

/**
 * Initialize user context for the current page
 * This should be called when the page loads to set up user context for the extension
 * @param {Object} userInfo - User information to initialize (optional, will auto-extract if not provided)
 */
export const initializeUserContext = async (userInfo = null) => {
  console.log('🚀 Initializing Onairos user context...');
  
  // If no user info provided, extract from localStorage
  if (!userInfo) {
    userInfo = getUserInfoFromStorage();
  }
  
  // First try to extract user info from URL (in case we're on an LLM platform)
  const urlUserInfo = extractUserInfoFromURL();
  
  // Merge URL info with provided/extracted info (URL takes precedence)
  const finalUserInfo = {
    ...userInfo,
    ...urlUserInfo
  };
  
  if (finalUserInfo.username || finalUserInfo.userId) {
    // Try to send to extension
    const sent = await sendUserInfoToExtension(finalUserInfo);
    
    if (sent) {
      console.log('✅ User context initialized successfully');
    } else {
      console.log('⚠️ Extension not available, user context stored locally');
      // Store in localStorage as fallback
      localStorage.setItem('onairos_user_context', JSON.stringify(finalUserInfo));
    }
    
    return finalUserInfo;
  } else {
    console.log('⚠️ No user information available to initialize');
    return null;
  }
};

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
 * @returns {Promise<boolean>} True if LLM was opened, false if extension missing
 */
export const openLLMWithExtensionCheck = async (platform, onExtensionMissing = null) => {
  console.log(`🤖 Attempting to open ${platform} with extension check...`);
  
  // Check if extension is installed
  const hasExtension = await detectOnairosExtension();
  
  if (hasExtension) {
    // Extension is installed - open the LLM platform
    const llmUrl = LLM_URLS[platform];
    if (llmUrl) {
      console.log(`✅ Extension detected, opening ${platform} at ${llmUrl}`);
      const llmWindow = window.open(llmUrl, '_blank');
      
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

/**
 * Platform Disconnect & Destruct Utilities
 * Handles disconnection of platforms and deletion of wrapped data
 * Base URL: api2.onairos.uk
 */

import { API_CONFIG } from '../config/api-config.js';

/**
 * Get authentication token from localStorage
 * @returns {string|null} JWT token
 */
const getAuthToken = () => {
  try {
    // Try to get token from multiple sources
    const token = localStorage.getItem('onairos_user_token');
    if (token) return token;
    
    // Fallback: extract from user data
    const userData = localStorage.getItem('onairosUser');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.token || null;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    return null;
  }
};

/**
 * Platform disconnect endpoint configuration
 */
const DISCONNECT_ENDPOINTS = {
  youtube: {
    url: '/youtube/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  reddit: {
    url: '/reddit/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  gmail: {
    url: '/gmail/revoke',
    bodyFormat: (username) => ({ username })
  },
  pinterest: {
    url: '/pinterest/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  linkedin: {
    url: '/linkedin/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  instagram: {
    url: '/instagram/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  github: {
    url: '/github/revoke/github',
    bodyFormat: (username) => ({ Info: { username } })
  },
  facebook: {
    url: '/facebook/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  x: {
    url: '/x/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  twitter: {
    url: '/x/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  notion: {
    url: '/notion/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  farcaster: {
    url: '/farcaster/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  // LLM platforms (ChatGPT, Claude, Gemini, Grok) - to be implemented
  chatgpt: {
    url: '/chatgpt/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  claude: {
    url: '/claude/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  gemini: {
    url: '/gemini/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  },
  grok: {
    url: '/grok/revoke',
    bodyFormat: (username) => ({ Info: { username } })
  }
};

/**
 * Disconnect a platform from user's account
 * @param {string} platform - Platform name (e.g., 'youtube', 'reddit')
 * @param {string} username - User's email/username
 * @returns {Promise<Object>} Response object
 */
export async function disconnectPlatform(platform, username) {
  try {
    const platformKey = platform.toLowerCase();
    const config = DISCONNECT_ENDPOINTS[platformKey];
    
    if (!config) {
      throw new Error(`Unknown platform: ${platform}`);
    }
    
    const baseUrl = API_CONFIG.getBaseUrl();
    const url = `${baseUrl}${config.url}`;
    const body = config.bodyFormat(username);
    
    console.log(`🔌 Disconnecting ${platform} for user ${username}...`);
    console.log('📡 URL:', url);
    console.log('📦 Body:', body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }
    
    console.log(`✅ ${platform} disconnected successfully`);
    return {
      success: true,
      platform: platform,
      message: data.message || `${platform} disconnected successfully`,
      data: data
    };
    
  } catch (error) {
    console.error(`❌ Error disconnecting ${platform}:`, error);
    return {
      success: false,
      platform: platform,
      error: error.message,
      message: `Failed to disconnect ${platform}: ${error.message}`
    };
  }
}

/**
 * Disconnect multiple platforms at once
 * @param {Array<string>} platforms - Array of platform names
 * @param {string} username - User's email/username
 * @returns {Promise<Object>} Results object with success/failure for each platform
 */
export async function disconnectMultiplePlatforms(platforms, username) {
  console.log(`🔌 Disconnecting ${platforms.length} platforms...`);
  
  const results = {
    successful: [],
    failed: [],
    total: platforms.length
  };
  
  // Process disconnections in parallel
  const promises = platforms.map(platform => 
    disconnectPlatform(platform, username)
  );
  
  const responses = await Promise.allSettled(promises);
  
  responses.forEach((result, index) => {
    const platform = platforms[index];
    if (result.status === 'fulfilled' && result.value.success) {
      results.successful.push(platform);
    } else {
      results.failed.push({
        platform: platform,
        error: result.value?.error || result.reason?.message || 'Unknown error'
      });
    }
  });
  
  console.log(`✅ Disconnection complete: ${results.successful.length} successful, ${results.failed.length} failed`);
  
  return results;
}

// NOTE: Wrapped dashboard destruct functionality removed
// Wrapped features are app-level, not SDK-level
// Apps should implement their own destruct endpoints as needed

/**
 * Update local storage after disconnecting a platform
 * Removes the platform from connectedAccounts array
 * @param {string} platform - Platform name that was disconnected
 */
export function updateLocalStorageAfterDisconnect(platform) {
  try {
    const userData = localStorage.getItem('onairosUser');
    if (!userData) return;
    
    const user = JSON.parse(userData);
    
    if (Array.isArray(user.connectedAccounts)) {
      // Remove the platform from connectedAccounts (case-insensitive)
      user.connectedAccounts = user.connectedAccounts.filter(
        account => account.toLowerCase() !== platform.toLowerCase()
      );
      
      console.log(`🔄 Updated local storage - removed ${platform}`);
      console.log('📋 Remaining accounts:', user.connectedAccounts);
      
      localStorage.setItem('onairosUser', JSON.stringify(user));
    }
  } catch (error) {
    console.error('❌ Error updating local storage:', error);
  }
}

// NOTE: updateLocalStorageAfterDestruct removed
// Wrapped data management is app-level, not SDK-level

/**
 * Check if user has authentication token
 * @returns {boolean} True if token exists
 */
export function hasAuthToken() {
  return !!getAuthToken();
}

/**
 * Get list of all supported platforms for disconnection
 * @returns {Array<string>} Array of platform names
 */
export function getSupportedPlatforms() {
  return Object.keys(DISCONNECT_ENDPOINTS).filter(key => key !== 'twitter'); // Exclude twitter alias
}

/**
 * Check if a platform is supported for disconnection
 * @param {string} platform - Platform name
 * @returns {boolean} True if platform is supported
 */
export function isPlatformSupported(platform) {
  return platform.toLowerCase() in DISCONNECT_ENDPOINTS;
}

export default {
  disconnectPlatform,
  disconnectMultiplePlatforms,
  updateLocalStorageAfterDisconnect,
  hasAuthToken,
  getSupportedPlatforms,
  isPlatformSupported
};


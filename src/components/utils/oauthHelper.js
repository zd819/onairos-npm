/**
 * OAuth Helper Functions
 * Provides utility functions for OAuth authentication
 * Compatible with both web and React Native environments
 */

/**
 * Detect the runtime environment (React Native or Web)
 * @returns {boolean} True if running in React Native
 */
export const isReactNative = () => {
  return typeof global !== 'undefined' && global.nativeModuleProxy !== undefined || 
         typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
};

/**
 * Create OAuth authorization window
 * @param {string} url - OAuth URL to open
 * @param {Object} options - Options for the OAuth window
 * @returns {Promise} - Promise resolving with the auth result
 */
export const createOAuthWindow = (url, options = {}) => {
  return openAuthWindow(url, options);
};

/**
 * Open OAuth authorization window
 * Handles differences between web and React Native
 * @param {string} url - OAuth URL to open
 * @param {Object} options - Options for the OAuth window
 * @returns {Promise} - Promise resolving with the auth result
 */
export const openAuthWindow = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    if (isReactNative()) {
      // For React Native, we would typically use Linking API
      // This is a placeholder - in real implementation, you would use
      // react-native's Linking or a library like react-native-app-auth
      console.log("OAuth in React Native environment would open:", url);
      
      // Mock successful authentication for testing
      setTimeout(() => {
        resolve({
          success: true,
          token: 'mock-oauth-token-for-react-native'
        });
      }, 1000);
    } else {
      // Web implementation
      const width = options.width || 600;
      const height = options.height || 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        url,
        'Auth Window',
        `width=${width},height=${height},top=${top},left=${left}`
      );
      
      // This would be implemented with message listeners in a real app
      if (!authWindow) {
        reject(new Error('Could not open auth window'));
      }
      
      // Mock auth for testing
      setTimeout(() => {
        resolve({
          success: true,
          token: 'mock-oauth-token-for-web'
        });
      }, 1000);
    }
  });
};

/**
 * Handle OAuth callback
 * @param {string} url - Callback URL with auth parameters
 * @returns {Object} - Parsed auth result
 */
export const handleOAuthCallback = (url) => {
  // Parse URL parameters to extract token, etc.
  const params = new URLSearchParams(url.split('?')[1]);
  return {
    token: params.get('token') || 'mock-token',
    state: params.get('state'),
    error: params.get('error')
  };
};

export default {
  isReactNative,
  openAuthWindow,
  createOAuthWindow,
  handleOAuthCallback
};

/**
 * Capacitor/Mobile Environment Detection Utility
 * 
 * Detects if the app is running in a Capacitor environment
 * and provides mobile-specific functionality
 */

/**
 * Detect if running in Capacitor environment
 * @returns {boolean} True if running in Capacitor
 */
export const isCapacitor = () => {
  // Check for Capacitor global object
  if (typeof window !== 'undefined' && window.Capacitor) {
    return true;
  }
  
  // Check for Capacitor plugins
  if (typeof window !== 'undefined' && window.Capacitor?.Plugins) {
    return true;
  }
  
  // Check for Capacitor native bridge
  if (typeof window !== 'undefined' && window.webkit?.messageHandlers?.bridge) {
    return true;
  }
  
  return false;
};

/**
 * Detect if running in React Native environment
 * @returns {boolean} True if running in React Native
 */
export const isReactNative = () => {
  return typeof navigator !== 'undefined' && navigator.product === 'ReactNative' ||
         typeof global !== 'undefined' && global.nativeModuleProxy !== undefined;
};

/**
 * Detect if running in any mobile app environment (Capacitor or React Native)
 * @returns {boolean} True if running in a mobile app
 */
export const isMobileApp = () => {
  return isCapacitor() || isReactNative();
};

/**
 * Detect if running on iOS
 * @returns {boolean} True if running on iOS
 */
export const isIOS = () => {
  if (typeof window !== 'undefined' && window.Capacitor) {
    return window.Capacitor.getPlatform() === 'ios';
  }
  
  // Fallback to user agent detection
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Detect if running on Android
 * @returns {boolean} True if running on Android
 */
export const isAndroid = () => {
  if (typeof window !== 'undefined' && window.Capacitor) {
    return window.Capacitor.getPlatform() === 'android';
  }
  
  // Fallback to user agent detection
  return /Android/.test(navigator.userAgent);
};

/**
 * Get platform information
 * @returns {Object} Platform details
 */
export const getPlatformInfo = () => {
  return {
    isCapacitor: isCapacitor(),
    isReactNative: isReactNative(),
    isMobileApp: isMobileApp(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    platform: window.Capacitor ? window.Capacitor.getPlatform() : 'web',
    userAgent: navigator.userAgent
  };
};

/**
 * Detect if mobile browser (not Capacitor, just mobile web browser)
 * @returns {boolean} True if mobile browser
 */
export const isMobileBrowser = () => {
  if (isMobileApp()) {
    return false; // Capacitor/RN apps are not browsers
  }
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
};

/**
 * Get environment type
 * @returns {string} Environment type: 'capacitor', 'react-native', 'mobile-browser', 'desktop-browser'
 */
export const getEnvironmentType = () => {
  if (isCapacitor()) return 'capacitor';
  if (isReactNative()) return 'react-native';
  if (isMobileBrowser()) return 'mobile-browser';
  return 'desktop-browser';
};

/**
 * Check if browser extension support is available
 * Browser extensions don't work in Capacitor/React Native
 * @returns {boolean} True if browser extensions are supported
 */
export const supportsBrowserExtensions = () => {
  return !isMobileApp();
};

/**
 * Log platform information for debugging
 */
export const logPlatformInfo = () => {
  const info = getPlatformInfo();
  console.log('🔍 Platform Detection:', info);
  console.log('📱 Environment Type:', getEnvironmentType());
  console.log('🧩 Browser Extensions Supported:', supportsBrowserExtensions());
  return info;
};



/**
 * Onairos SDK Initialization
 * Implements standardized SDK initialization following SDK_API_KEY_VALIDATION.md
 */

import { validateApiKey, detectEnvironment, getErrorInfo } from './apiKeyValidation.js';

// Global SDK state
let globalSDKState = {
  isInitialized: false,
  apiKey: null,
  config: null,
  validationResult: null
};

/**
 * Initialize SDK with API key validation
 * @param {object} config - Initialization configuration
 * @returns {Promise<object>} - Initialization result
 */
export const initializeApiKey = async (config) => {
  const {
    apiKey,
    environment = detectEnvironment(),
    enableLogging = false,
    timeout = 30000,
    retryAttempts = 3,
    platform = 'web',
    sdkVersion = '3.4.0'
  } = config;

  // Validate required parameters
  if (!apiKey) {
    const error = new Error('API key is required for SDK initialization');
    error.code = 'MISSING_API_KEY';
    throw error;
  }

  if (enableLogging) {
    console.log('🔧 [Onairos SDK] Initializing with config:', {
      environment,
      platform,
      sdkVersion,
      timeout,
      retryAttempts,
      apiKeyPrefix: apiKey.substring(0, 8) + '...'
    });
  }

  try {
    // Validate API key with backend
    const validationResult = await validateApiKey(apiKey, {
      environment,
      timeout,
      retryAttempts,
      platform,
      sdkVersion
    });

    if (!validationResult.isValid) {
      const errorInfo = getErrorInfo(validationResult.code, validationResult);
      const error = new Error(validationResult.error || errorInfo.message);
      error.code = validationResult.code;
      error.details = validationResult.message;
      error.suggestions = errorInfo.suggestions;
      error.keyType = validationResult.keyType;
      
      if (enableLogging) {
        console.error('❌ [Onairos SDK] Initialization failed:', {
          error: error.message,
          code: error.code,
          suggestions: error.suggestions
        });
      }
      
      throw error;
    }

    // Store global state
    globalSDKState = {
      isInitialized: true,
      apiKey,
      config: {
        environment,
        enableLogging,
        timeout,
        retryAttempts,
        platform,
        sdkVersion
      },
      validationResult
    };

    if (enableLogging) {
      console.log('✅ [Onairos SDK] Initialized successfully:', {
        keyType: validationResult.keyType,
        permissions: validationResult.permissions?.length || 0,
        rateLimits: validationResult.rateLimits,
        developer: validationResult.developer?.name
      });
    }

    return {
      success: true,
      message: 'SDK initialized successfully',
      keyType: validationResult.keyType,
      permissions: validationResult.permissions,
      rateLimits: validationResult.rateLimits,
      developer: validationResult.developer,
      apiKey: validationResult.apiKey
    };

  } catch (error) {
    // Reset global state on failure
    globalSDKState = {
      isInitialized: false,
      apiKey: null,
      config: null,
      validationResult: null
    };

    if (enableLogging) {
      console.error('❌ [Onairos SDK] Initialization error:', error);
    }

    throw error;
  }
};

/**
 * Check if SDK is initialized
 * @returns {boolean}
 */
export const isSDKInitialized = () => {
  return globalSDKState.isInitialized;
};

/**
 * Get current SDK state
 * @returns {object}
 */
export const getSDKState = () => {
  return { ...globalSDKState };
};

/**
 * Get API key from initialized SDK
 * @returns {string|null}
 */
export const getApiKey = () => {
  return globalSDKState.apiKey;
};

/**
 * Get SDK configuration
 * @returns {object|null}
 */
export const getSDKConfig = () => {
  return globalSDKState.config;
};

/**
 * Get validation result
 * @returns {object|null}
 */
export const getValidationResult = () => {
  return globalSDKState.validationResult;
};

/**
 * Reset SDK state (for testing or re-initialization)
 */
export const resetSDK = () => {
  globalSDKState = {
    isInitialized: false,
    apiKey: null,
    config: null,
    validationResult: null
  };
};

/**
 * Ensure SDK is initialized before operations
 * @param {string} operation - Operation name for error messages
 * @throws {Error} - If SDK is not initialized
 */
export const ensureSDKInitialized = (operation = 'operation') => {
  if (!globalSDKState.isInitialized) {
    const error = new Error(`SDK not initialized. Call initializeApiKey() before ${operation}.`);
    error.code = 'SDK_NOT_INITIALIZED';
    throw error;
  }
};

/**
 * Make authenticated API request using initialized SDK
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {Promise<object>} - Response data
 */
export const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  ensureSDKInitialized('making API requests');

  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = globalSDKState.config.timeout
  } = options;

  const baseUrl = globalSDKState.config.environment === 'development' 
    ? 'https://dev-api.onairos.uk' 
    : 'https://api.onairos.uk';

  const url = `${baseUrl}${endpoint}`;

  const requestHeaders = {
    'Authorization': `Bearer ${globalSDKState.apiKey}`,
    'Content-Type': 'application/json',
    'X-SDK-Platform': globalSDKState.config.platform,
    'User-Agent': `OnairosSDK/${globalSDKState.config.sdkVersion}`,
    ...headers
  };

  const requestOptions = {
    method,
    headers: requestHeaders
  };

  if (body && method !== 'GET') {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  requestOptions.signal = controller.signal;

  try {
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.code = data.code;
      error.details = data.details;
      throw error;
    }

    if (globalSDKState.config.enableLogging) {
      console.log(`📡 [Onairos SDK] ${method} ${endpoint}:`, {
        status: response.status,
        success: data.success !== false
      });
    }

    return data;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`Request timeout after ${timeout}ms`);
      timeoutError.code = 'REQUEST_TIMEOUT';
      throw timeoutError;
    }

    if (globalSDKState.config.enableLogging) {
      console.error(`❌ [Onairos SDK] ${method} ${endpoint} failed:`, error.message);
    }

    throw error;
  }
};

/**
 * Configuration interface for TypeScript/JSDoc
 * @typedef {Object} InitConfig
 * @property {string} apiKey - Required: Developer API key
 * @property {'production'|'development'} [environment='production'] - Environment
 * @property {boolean} [enableLogging=false] - Enable debug logging
 * @property {number} [timeout=30000] - Request timeout in milliseconds
 * @property {number} [retryAttempts=3] - Number of retry attempts
 * @property {string} [platform='web'] - Platform identifier
 * @property {string} [sdkVersion='3.4.0'] - SDK version
 */

/**
 * Validation result interface
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the API key is valid
 * @property {boolean} success - Whether the validation was successful
 * @property {string[]} [permissions] - Array of permissions
 * @property {Object} [rateLimits] - Rate limit information
 * @property {number} rateLimits.remaining - Remaining requests
 * @property {number} rateLimits.resetTime - Reset timestamp
 * @property {'admin'|'developer'|'invalid'} keyType - Type of API key
 * @property {string} [error] - Error message if validation failed
 * @property {string} [code] - Error code if validation failed
 */

export default {
  initializeApiKey,
  isSDKInitialized,
  getSDKState,
  getApiKey,
  getSDKConfig,
  getValidationResult,
  resetSDK,
  ensureSDKInitialized,
  makeAuthenticatedRequest
};

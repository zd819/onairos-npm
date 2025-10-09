/**
 * Onairos API Key Validation Utilities
 * Implements standardized API key validation following SDK_API_KEY_VALIDATION.md
 */

// API Key Types
export const ApiKeyType = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  INVALID: 'invalid'
};

// Error Codes
export const ErrorCodes = {
  MISSING_API_KEY: 'MISSING_API_KEY',
  INVALID_API_KEY_FORMAT: 'INVALID_API_KEY_FORMAT',
  INVALID_API_KEY: 'INVALID_API_KEY',
  API_KEY_EXPIRED: 'API_KEY_EXPIRED',
  DEVELOPER_NOT_FOUND: 'DEVELOPER_NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// API Endpoints
export const API_ENDPOINTS = {
  production: 'https://api.onairos.uk',
  development: 'https://dev-api.onairos.uk'
};

/**
 * Detect environment based on context
 * @returns {'production' | 'development'}
 */
export const detectEnvironment = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    return window.location.hostname.includes('localhost') ? 'development' : 'production';
  } else {
    // Node.js/React Native environment
    return process.env.NODE_ENV === 'development' ? 'development' : 'production';
  }
};

/**
 * Get API key type based on format
 * @param {string} apiKey - API key to validate
 * @returns {string} - API key type
 */
export const getApiKeyType = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    return ApiKeyType.INVALID;
  }

  // Check admin key
  if (apiKey === 'OnairosIsAUnicorn2025') {
    return ApiKeyType.ADMIN;
  }

  // Check developer key format
  if (apiKey.length >= 32 && (
    apiKey.startsWith('ona_') || 
    apiKey.startsWith('dev_') || 
    apiKey.startsWith('pk_')
  )) {
    return ApiKeyType.DEVELOPER;
  }

  return ApiKeyType.INVALID;
};

/**
 * Check if API key is admin key
 * @param {string} apiKey - API key to check
 * @returns {boolean}
 */
export const isAdminKey = (apiKey) => {
  return apiKey === 'OnairosIsAUnicorn2025';
};

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {object} - Validation result
 */
export const validateApiKeyFormat = (apiKey) => {
  if (!apiKey) {
    return {
      isValid: false,
      error: 'API key is required',
      code: ErrorCodes.MISSING_API_KEY,
      keyType: ApiKeyType.INVALID
    };
  }

  const keyType = getApiKeyType(apiKey);
  
  if (keyType === ApiKeyType.INVALID) {
    return {
      isValid: false,
      error: 'Invalid API key format',
      message: 'Developer keys must be at least 32 characters and start with \'dev_\', \'pk_\', or \'ona_\'',
      code: ErrorCodes.INVALID_API_KEY_FORMAT,
      keyType: ApiKeyType.INVALID
    };
  }

  return {
    isValid: true,
    keyType: keyType
  };
};

/**
 * Validate API key with backend
 * @param {string} apiKey - API key to validate
 * @param {object} config - Configuration options
 * @returns {Promise<object>} - Validation result
 */
export const validateApiKey = async (apiKey, config = {}) => {
  const {
    environment = detectEnvironment(),
    timeout = 30000,
    retryAttempts = 3,
    platform = 'web',
    sdkVersion = '3.4.0'
  } = config;

  // First validate format
  const formatValidation = validateApiKeyFormat(apiKey);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  // Handle admin keys locally
  if (isAdminKey(apiKey)) {
    return {
      isValid: true,
      success: true,
      permissions: ['*'],
      rateLimits: { 
        remaining: 999999, 
        resetTime: Date.now() + 24 * 60 * 60 * 1000 
      },
      keyType: ApiKeyType.ADMIN,
      developer: {
        id: 'admin',
        name: 'Admin User',
        plan: 'admin'
      },
      apiKey: {
        id: 'admin_key',
        name: 'Admin Key',
        context: environment,
        totalRequests: 0
      }
    };
  }

  // Validate with backend
  const baseUrl = API_ENDPOINTS[environment] || API_ENDPOINTS.production;
  
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/auth/validate-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-SDK-Platform': platform,
          'User-Agent': `OnairosSDK/${sdkVersion}`
        },
        body: JSON.stringify({
          environment,
          sdk_version: sdkVersion,
          platform,
          keyType: formatValidation.keyType,
          timestamp: new Date().toISOString(),
          attempt
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          isValid: true,
          success: true,
          permissions: data.permissions || [],
          rateLimits: data.rateLimits || { remaining: 100, resetTime: Date.now() + 15 * 60 * 1000 },
          keyType: data.keyType || ApiKeyType.DEVELOPER,
          developer: data.developer,
          apiKey: data.apiKey
        };
      }

      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return {
          isValid: false,
          success: false,
          error: data.error || 'Client error',
          message: data.message,
          code: data.code || ErrorCodes.INVALID_API_KEY,
          keyType: data.keyType || ApiKeyType.INVALID
        };
      }

      // Retry server errors (5xx)
      if (attempt === retryAttempts) {
        return {
          isValid: false,
          success: false,
          error: 'Server error after maximum retries',
          message: `Failed after ${retryAttempts} attempts`,
          code: ErrorCodes.INTERNAL_ERROR,
          keyType: ApiKeyType.INVALID
        };
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        if (attempt === retryAttempts) {
          return {
            isValid: false,
            success: false,
            error: 'Request timeout',
            message: `Request timed out after ${timeout}ms`,
            code: ErrorCodes.INTERNAL_ERROR,
            keyType: ApiKeyType.INVALID
          };
        }
      } else if (attempt === retryAttempts) {
        return {
          isValid: false,
          success: false,
          error: 'Network error',
          message: error.message,
          code: ErrorCodes.INTERNAL_ERROR,
          keyType: ApiKeyType.INVALID
        };
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    isValid: false,
    success: false,
    error: 'Validation failed',
    code: ErrorCodes.INTERNAL_ERROR,
    keyType: ApiKeyType.INVALID
  };
};

/**
 * Get error message for error code
 * @param {string} code - Error code
 * @param {object} details - Additional error details
 * @returns {object} - Error information
 */
export const getErrorInfo = (code, details = {}) => {
  const errorMap = {
    [ErrorCodes.MISSING_API_KEY]: {
      title: 'API Key Required',
      message: 'No API key provided',
      suggestions: [
        'Provide API key in the configuration',
        'Get API key from Onairos Dashboard',
        'Format: ona_your_api_key_here'
      ]
    },
    [ErrorCodes.INVALID_API_KEY_FORMAT]: {
      title: 'Invalid API Key Format',
      message: 'API key format is incorrect',
      suggestions: [
        'Check key format (32+ characters)',
        'Ensure it starts with ona_, dev_, or pk_',
        'Generate new API key if needed'
      ]
    },
    [ErrorCodes.INVALID_API_KEY]: {
      title: 'Invalid API Key',
      message: 'API key not found or inactive',
      suggestions: [
        'Verify API key is correct',
        'Check if key has been revoked',
        'Generate new API key'
      ]
    },
    [ErrorCodes.API_KEY_EXPIRED]: {
      title: 'API Key Expired',
      message: 'API key has expired',
      suggestions: [
        'Renew API key',
        'Generate new API key',
        'Check expiry settings'
      ]
    },
    [ErrorCodes.DEVELOPER_NOT_FOUND]: {
      title: 'Developer Account Inactive',
      message: 'Developer account not found or inactive',
      suggestions: [
        'Contact support',
        'Verify account status',
        'Check developer dashboard'
      ]
    },
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: {
      title: 'Rate Limit Exceeded',
      message: 'Too many requests',
      suggestions: [
        'Wait before retrying',
        'Check rate limits',
        'Upgrade plan if needed'
      ]
    },
    [ErrorCodes.INTERNAL_ERROR]: {
      title: 'Internal Error',
      message: 'Server error occurred',
      suggestions: [
        'Retry with exponential backoff',
        'Check service status',
        'Contact support if persists'
      ]
    }
  };

  return errorMap[code] || {
    title: 'Unknown Error',
    message: 'An unknown error occurred',
    suggestions: ['Contact support']
  };
};

export default {
  ApiKeyType,
  ErrorCodes,
  API_ENDPOINTS,
  detectEnvironment,
  getApiKeyType,
  isAdminKey,
  validateApiKeyFormat,
  validateApiKey,
  getErrorInfo
};

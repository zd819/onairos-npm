/**
 * Authentication and SDK Type Definitions
 * 
 * This file contains type definitions and validation schemas for the Onairos SDK
 * Used for request validation, response formatting, and documentation
 */

/**
 * Authentication Types
 */
export const AuthenticationTypes = {
  API_KEY: 'api_key',
  USER_JWT: 'user_jwt',
  DUAL_AUTH: 'dual_auth',
  ADMIN: 'admin'
};

/**
 * User Types
 */
export const UserTypes = {
  ENOCH: 'enoch',
  ONAIROS: 'onairos'
};

/**
 * Platform Types
 */
export const PlatformTypes = {
  YOUTUBE: 'youtube',
  LINKEDIN: 'linkedin',
  REDDIT: 'reddit',
  PINTEREST: 'pinterest',
  APPLE: 'apple'
};

/**
 * Connection Health Status Types
 */
export const ConnectionHealthStatus = {
  HEALTHY: 'healthy',
  EXPIRED_REFRESHABLE: 'expired_refreshable',
  EXPIRED_NO_REFRESH: 'expired_no_refresh',
  INVALID_TOKEN: 'invalid_token',
  NOT_CONNECTED: 'not_connected',
  ERROR: 'error'
};

/**
 * Rate Limit Tiers
 */
export const RateLimitTiers = {
  STANDARD: 'ona_',
  DEVELOPER: 'dev_',
  PUBLIC: 'pk_',
  ADMIN: 'admin'
};

/**
 * API Response Types
 */
export const ResponseTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Error Codes
 */
export const ErrorCodes = {
  // Authentication Errors
  INVALID_API_KEY: 'INVALID_API_KEY',
  INVALID_JWT: 'INVALID_JWT',
  EXPIRED_JWT: 'EXPIRED_JWT',
  MISSING_API_KEY: 'MISSING_API_KEY',
  MISSING_JWT: 'MISSING_JWT',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // User Errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_USER_TYPE: 'INVALID_USER_TYPE',
  USER_LOOKUP_FAILED: 'USER_LOOKUP_FAILED',
  
  // Platform Errors
  PLATFORM_NOT_SUPPORTED: 'PLATFORM_NOT_SUPPORTED',
  PLATFORM_DISABLED: 'PLATFORM_DISABLED',
  INVALID_PLATFORM_TOKEN: 'INVALID_PLATFORM_TOKEN',
  PLATFORM_API_ERROR: 'PLATFORM_API_ERROR',
  
  // Connection Errors
  CONNECTION_NOT_FOUND: 'CONNECTION_NOT_FOUND',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  CONNECTION_EXPIRED: 'CONNECTION_EXPIRED',
  NO_REFRESH_TOKEN: 'NO_REFRESH_TOKEN',
  REFRESH_FAILED: 'REFRESH_FAILED',
  
  // Rate Limiting Errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  API_KEY_RATE_LIMIT_EXCEEDED: 'API_KEY_RATE_LIMIT_EXCEEDED',
  PLATFORM_RATE_LIMIT_EXCEEDED: 'PLATFORM_RATE_LIMIT_EXCEEDED',
  ENDPOINT_RATE_LIMIT_EXCEEDED: 'ENDPOINT_RATE_LIMIT_EXCEEDED',
  BURST_RATE_LIMIT_EXCEEDED: 'BURST_RATE_LIMIT_EXCEEDED',
  CONCURRENT_REQUESTS_EXCEEDED: 'CONCURRENT_REQUESTS_EXCEEDED',
  
  // Validation Errors
  INVALID_REQUEST_DATA: 'INVALID_REQUEST_DATA',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_TYPE: 'INVALID_FIELD_TYPE',
  INVALID_FIELD_VALUE: 'INVALID_FIELD_VALUE',
  
  // System Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
};

/**
 * Request Validation Schemas
 */
export const ValidationSchemas = {
  // YouTube Native Auth Request
  youtubeNativeAuth: {
    required: ['accessToken', 'userAccountInfo'],
    optional: ['refreshToken', 'idToken', 'session'],
    fields: {
      accessToken: { type: 'string', minLength: 10 },
      refreshToken: { type: 'string', minLength: 10 },
      idToken: { type: 'string', minLength: 10 },
      userAccountInfo: {
        type: 'object',
        required: ['username'],
        fields: {
          username: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          channelName: { type: 'string' },
          channelId: { type: 'string' }
        }
      }
    }
  },
  
  // LinkedIn Native Auth Request
  linkedinNativeAuth: {
    required: ['accessToken', 'userAccountInfo'],
    optional: ['refreshToken', 'idToken', 'session'],
    fields: {
      accessToken: { type: 'string', minLength: 10 },
      refreshToken: { type: 'string', minLength: 10 },
      idToken: { type: 'string', minLength: 10 },
      userAccountInfo: {
        type: 'object',
        required: ['username'],
        fields: {
          username: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' }
        }
      }
    }
  },
  
  // Token Refresh Request
  tokenRefresh: {
    required: ['username'],
    optional: ['platform'],
    fields: {
      username: { type: 'string', minLength: 1 },
      platform: { type: 'string', enum: Object.values(PlatformTypes) }
    }
  },
  
  // Health Check Request
  healthCheck: {
    required: [],
    optional: ['platforms', 'detailed'],
    fields: {
      platforms: { type: 'array', items: { type: 'string', enum: Object.values(PlatformTypes) } },
      detailed: { type: 'boolean' }
    }
  },
  
  // Connection Repair Request
  connectionRepair: {
    required: [],
    optional: ['platforms', 'autoRepair'],
    fields: {
      platforms: { type: 'array', items: { type: 'string', enum: Object.values(PlatformTypes) } },
      autoRepair: { type: 'boolean' }
    }
  }
};

/**
 * Response Schemas
 */
export const ResponseSchemas = {
  // Standard Success Response
  success: {
    success: true,
    message: 'string',
    data: 'object',
    timestamp: 'date',
    requestId: 'string'
  },
  
  // Standard Error Response
  error: {
    success: false,
    error: 'string',
    code: 'string',
    details: 'object',
    guidance: 'string',
    timestamp: 'date',
    requestId: 'string'
  },
  
  // Authentication Response
  authenticationResponse: {
    success: 'boolean',
    message: 'string',
    userType: 'string',
    connectionData: {
      platform: 'string',
      userName: 'string',
      connectedAt: 'date',
      hasRefreshToken: 'boolean',
      tokenExpiry: 'date'
    },
    connectionHealth: {
      status: 'string',
      message: 'string',
      lastChecked: 'date'
    },
    recommendations: 'array',
    requestId: 'string'
  },
  
  // Connection Health Response
  connectionHealthResponse: {
    success: 'boolean',
    username: 'string',
    userType: 'string',
    summary: {
      overallStatus: 'string',
      overallScore: 'number',
      connectedPlatforms: 'number',
      healthyPlatforms: 'number',
      needsAttention: 'number'
    },
    platforms: 'object',
    recommendations: 'array',
    requestId: 'string'
  },
  
  // Token Refresh Response
  tokenRefreshResponse: {
    success: 'boolean',
    message: 'string',
    refreshed: 'boolean',
    newTokenExpiry: 'date',
    requestId: 'string'
  }
};

/**
 * Data Transfer Objects (DTOs)
 */
export class AuthenticationDTO {
  constructor(data) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.idToken = data.idToken;
    this.userAccountInfo = data.userAccountInfo;
    this.session = data.session;
    this.platform = data.platform;
    this.timestamp = new Date();
  }
  
  validate() {
    const errors = [];
    
    if (!this.accessToken) {
      errors.push('accessToken is required');
    }
    
    if (!this.userAccountInfo || !this.userAccountInfo.username) {
      errors.push('userAccountInfo with username is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

export class ConnectionHealthDTO {
  constructor(data) {
    this.status = data.status;
    this.connected = data.connected;
    this.message = data.message;
    this.lastChecked = new Date();
    this.tokenDetails = data.tokenDetails;
    this.recommendations = data.recommendations || [];
    this.needsReauth = data.needsReauth;
    this.canRefresh = data.canRefresh;
  }
  
  isHealthy() {
    return this.status === ConnectionHealthStatus.HEALTHY;
  }
  
  needsAttention() {
    return [
      ConnectionHealthStatus.EXPIRED_REFRESHABLE,
      ConnectionHealthStatus.EXPIRED_NO_REFRESH,
      ConnectionHealthStatus.INVALID_TOKEN,
      ConnectionHealthStatus.ERROR
    ].includes(this.status);
  }
}

export class UserConnectionDTO {
  constructor(data) {
    this.platform = data.platform;
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.tokenExpiry = data.tokenExpiry;
    this.userName = data.userName;
    this.profileId = data.profileId;
    this.connectedAt = data.connectedAt;
    this.lastValidated = data.lastValidated;
    this.hasRefreshToken = !!data.refreshToken;
  }
  
  isExpired() {
    return this.tokenExpiry && new Date() > new Date(this.tokenExpiry);
  }
  
  canRefresh() {
    return this.hasRefreshToken && this.refreshToken;
  }
}

export class ApiResponseDTO {
  constructor(success, data, error = null) {
    this.success = success;
    this.timestamp = new Date();
    this.requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    
    if (success) {
      this.message = data.message || 'Operation completed successfully';
      this.data = data.data || data;
    } else {
      this.error = error || data.error || 'Operation failed';
      this.code = data.code || 'UNKNOWN_ERROR';
      this.details = data.details;
      this.guidance = data.guidance;
    }
  }
  
  static success(data, message = 'Operation completed successfully') {
    return new ApiResponseDTO(true, { message, data });
  }
  
  static error(error, code = 'UNKNOWN_ERROR', details = null, guidance = null) {
    return new ApiResponseDTO(false, { error, code, details, guidance });
  }
}

/**
 * Validation Utilities
 */
export class ValidationUtils {
  static validateSchema(data, schema) {
    const errors = [];
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!data[field]) {
          errors.push(`Required field '${field}' is missing`);
        }
      }
    }
    
    // Validate field types and formats
    if (schema.fields) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
        const value = data[fieldName];
        
        if (value !== undefined && value !== null) {
          const fieldErrors = this.validateField(fieldName, value, fieldSchema);
          errors.push(...fieldErrors);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  static validateField(fieldName, value, fieldSchema) {
    const errors = [];
    
    // Type validation
    if (fieldSchema.type) {
      const expectedType = fieldSchema.type;
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      
      if (actualType !== expectedType) {
        errors.push(`Field '${fieldName}' must be of type ${expectedType}, got ${actualType}`);
        return errors; // Don't continue validation if type is wrong
      }
    }
    
    // String validations
    if (fieldSchema.type === 'string') {
      if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        errors.push(`Field '${fieldName}' must be at least ${fieldSchema.minLength} characters long`);
      }
      
      if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
        errors.push(`Field '${fieldName}' must be at most ${fieldSchema.maxLength} characters long`);
      }
      
      if (fieldSchema.format === 'email' && !this.isValidEmail(value)) {
        errors.push(`Field '${fieldName}' must be a valid email address`);
      }
      
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        errors.push(`Field '${fieldName}' must be one of: ${fieldSchema.enum.join(', ')}`);
      }
    }
    
    // Number validations
    if (fieldSchema.type === 'number') {
      if (fieldSchema.min !== undefined && value < fieldSchema.min) {
        errors.push(`Field '${fieldName}' must be at least ${fieldSchema.min}`);
      }
      
      if (fieldSchema.max !== undefined && value > fieldSchema.max) {
        errors.push(`Field '${fieldName}' must be at most ${fieldSchema.max}`);
      }
    }
    
    // Array validations
    if (fieldSchema.type === 'array') {
      if (fieldSchema.minItems && value.length < fieldSchema.minItems) {
        errors.push(`Field '${fieldName}' must have at least ${fieldSchema.minItems} items`);
      }
      
      if (fieldSchema.maxItems && value.length > fieldSchema.maxItems) {
        errors.push(`Field '${fieldName}' must have at most ${fieldSchema.maxItems} items`);
      }
      
      if (fieldSchema.items) {
        value.forEach((item, index) => {
          const itemErrors = this.validateField(`${fieldName}[${index}]`, item, fieldSchema.items);
          errors.push(...itemErrors);
        });
      }
    }
    
    // Object validations
    if (fieldSchema.type === 'object' && fieldSchema.fields) {
      const subValidation = this.validateSchema(value, fieldSchema);
      errors.push(...subValidation.errors);
    }
    
    return errors;
  }
  
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Type Guards
 */
export class TypeGuards {
  static isValidPlatform(platform) {
    return Object.values(PlatformTypes).includes(platform);
  }
  
  static isValidUserType(userType) {
    return Object.values(UserTypes).includes(userType);
  }
  
  static isValidConnectionStatus(status) {
    return Object.values(ConnectionHealthStatus).includes(status);
  }
  
  static isValidAuthenticationType(authType) {
    return Object.values(AuthenticationTypes).includes(authType);
  }
  
  static isValidErrorCode(code) {
    return Object.values(ErrorCodes).includes(code);
  }
  
  static isValidRateLimitTier(tier) {
    return Object.values(RateLimitTiers).includes(tier);
  }
}

/**
 * Constants
 */
export const SDK_CONSTANTS = {
  // Token expiry times (in milliseconds)
  TOKEN_EXPIRY: {
    YOUTUBE: 3600000, // 1 hour
    LINKEDIN: 5184000000, // 60 days
    REDDIT: 3600000, // 1 hour
    PINTEREST: 3600000, // 1 hour
    APPLE: 86400000 // 24 hours
  },
  
  // Rate limit windows
  RATE_LIMIT_WINDOWS: {
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000
  },
  
  // Health check intervals
  HEALTH_CHECK_INTERVALS: {
    FAST: 30000, // 30 seconds
    NORMAL: 300000, // 5 minutes
    SLOW: 3600000 // 1 hour
  },
  
  // Request timeouts
  REQUEST_TIMEOUTS: {
    FAST: 5000, // 5 seconds
    NORMAL: 30000, // 30 seconds
    SLOW: 60000 // 1 minute
  },
  
  // Pagination defaults
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_OFFSET: 0
  }
};

export default {
  AuthenticationTypes,
  UserTypes,
  PlatformTypes,
  ConnectionHealthStatus,
  RateLimitTiers,
  ResponseTypes,
  ErrorCodes,
  ValidationSchemas,
  ResponseSchemas,
  AuthenticationDTO,
  ConnectionHealthDTO,
  UserConnectionDTO,
  ApiResponseDTO,
  ValidationUtils,
  TypeGuards,
  SDK_CONSTANTS
}; 
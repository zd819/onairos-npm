import dotenv from 'dotenv';

dotenv.config();

export const sdkConfig = {
  // SDK Information
  sdk: {
    name: 'Web Onairos SDK',
    version: '1.0.0',
    description: 'Enhanced web SDK for Onairos platform integration',
    documentation: 'https://docs.onairos.uk/web-sdk',
    support: 'https://support.onairos.uk'
  },

  // Authentication Configuration
  authentication: {
    // JWT Settings
    jwt: {
      secretKey: process.env.ONAIROS_JWT_SECRET_KEY,
      expiresIn: '24h',
      issuer: 'onairos.uk',
      audience: 'web-sdk',
      algorithm: 'HS256'
    },

    // API Key Settings
    apiKey: {
      prefix: 'ona_',
      minLength: 32,
      maxLength: 128,
      adminKey: process.env.ADMIN_API_KEY || 'OnairosIsAUnicorn2025',
      
      // Supported key types
      keyTypes: {
        'ona_': 'Standard API Key',
        'dev_': 'Developer API Key',
        'pk_': 'Public API Key'
      },
      
      // Key permissions
      permissions: {
        'oauth:youtube': 'YouTube OAuth operations',
        'oauth:linkedin': 'LinkedIn OAuth operations',
        'oauth:reddit': 'Reddit OAuth operations',
        'oauth:pinterest': 'Pinterest OAuth operations',
        'oauth:apple': 'Apple OAuth operations',
        'training:read': 'Read training data',
        'training:write': 'Write training data',
        'user:read': 'Read user data',
        'user:write': 'Write user data',
        'analytics:read': 'Read analytics data',
        'admin:*': 'Full admin access'
      }
    },

    // Session Configuration
    session: {
      cookieName: 'onairos_session',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict'
    },

    // Multi-factor Authentication
    mfa: {
      enabled: false,
      methods: ['totp', 'sms', 'email'],
      backupCodes: 10,
      windowSize: 1
    }
  },

  // Rate Limiting Configuration
  rateLimiting: {
    // Default rate limits
    default: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
      message: 'Too many requests from this API key',
      standardHeaders: true,
      legacyHeaders: false
    },

    // Endpoint-specific rate limits
    endpoints: {
      '/oauth/youtube': {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 20
      },
      '/oauth/linkedin': {
        windowMs: 5 * 60 * 1000,
        max: 20
      },
      '/training/submit': {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10
      },
      '/user/profile': {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 60
      }
    },

    // Rate limit tiers based on API key type
    tiers: {
      'ona_': {
        windowMs: 15 * 60 * 1000,
        max: 100
      },
      'dev_': {
        windowMs: 15 * 60 * 1000,
        max: 200
      },
      'pk_': {
        windowMs: 15 * 60 * 1000,
        max: 50
      }
    }
  },

  // Platform Configuration
  platforms: {
    youtube: {
      enabled: true,
      requiredScopes: ['https://www.googleapis.com/auth/youtube.readonly'],
      tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
      maxRetries: 3,
      retryDelay: 1000,
      features: {
        likes: true,
        dislikes: true,
        comments: true,
        subscriptions: true,
        playlists: true
      }
    },

    linkedin: {
      enabled: true,
      requiredScopes: ['r_liteprofile', 'r_emailaddress'],
      tokenRefreshThreshold: 5 * 60 * 1000,
      maxRetries: 3,
      retryDelay: 1000,
      features: {
        profile: true,
        posts: true,
        connections: false, // Limited by LinkedIn API
        messaging: false
      }
    },

    reddit: {
      enabled: true,
      requiredScopes: ['identity', 'read', 'history'],
      tokenRefreshThreshold: 5 * 60 * 1000,
      maxRetries: 3,
      retryDelay: 1000,
      features: {
        posts: true,
        comments: true,
        upvotes: true,
        subscriptions: true
      }
    },

    pinterest: {
      enabled: false, // Disabled by default
      requiredScopes: ['read_public'],
      tokenRefreshThreshold: 5 * 60 * 1000,
      maxRetries: 3,
      retryDelay: 1000,
      features: {
        pins: true,
        boards: true,
        following: true
      }
    },

    apple: {
      enabled: true,
      requiredScopes: ['name', 'email'],
      features: {
        signin: true,
        profile: true
      }
    }
  },

  // Database Configuration
  database: {
    // Primary database (Onairos)
    primary: {
      type: 'mongodb',
      connectionString: process.env.MONGO_URI || 'mongodb://localhost:27017/onairos',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      }
    },

    // Secondary database (Enoch)
    secondary: {
      type: 'mongodb',
      connectionString: process.env.ENOCH_MONGO_URI || 'mongodb://localhost:27017/enoch',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      }
    },

    // Cross-database sync settings
    sync: {
      enabled: true,
      syncInterval: 60 * 1000, // 1 minute
      conflictResolution: 'latest_wins',
      maxRetries: 3
    }
  },

  // Security Configuration
  security: {
    // CORS settings
    cors: {
      origin: [
        'https://onairos.uk',
        'https://www.onairos.uk',
        'https://enoch.onairos.uk',
        'https://admin.onairos.uk'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
    },

    // Request validation
    validation: {
      strictMode: true,
      maxRequestSize: '10mb',
      maxArrayLength: 1000,
      maxStringLength: 10000,
      requireHttps: process.env.NODE_ENV === 'production'
    },

    // Security headers
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    },

    // API key security
    apiKeySecurity: {
      hashAlgorithm: 'sha256',
      saltRounds: 12,
      keyRotationInterval: 90 * 24 * 60 * 60 * 1000, // 90 days
      suspiciousActivityThreshold: 100,
      rateLimitBypass: false
    }
  },

  // Feature Flags
  features: {
    // Core features
    dualAuthentication: true,
    crossDatabaseSync: true,
    connectionHealthMonitoring: true,
    autoTokenRefresh: true,
    
    // Platform-specific features
    youtubeEnhancedAuth: true,
    linkedinDataPortability: false,
    redditAdvancedFiltering: false,
    
    // Advanced features
    realTimeConnectionStatus: true,
    predictiveTokenRefresh: false,
    advancedAnalytics: false,
    bulkOperations: false,
    webhookSupport: false,
    
    // Experimental features
    aiEnhancedMatching: false,
    blockchainIntegration: false,
    quantumSecurity: false
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    maxFileSize: '10mb',
    maxFiles: 5,
    datePattern: 'YYYY-MM-DD',
    
    // Log categories
    categories: {
      authentication: true,
      oauth: true,
      database: true,
      security: true,
      performance: true,
      errors: true,
      debug: process.env.NODE_ENV === 'development'
    },
    
    // Sensitive data filtering
    sensitiveFields: [
      'password',
      'accessToken',
      'refreshToken',
      'apiKey',
      'clientSecret',
      'privateKey'
    ]
  },

  // Monitoring Configuration
  monitoring: {
    enabled: true,
    
    // Health checks
    healthChecks: {
      interval: 30000, // 30 seconds
      timeout: 5000,
      retries: 3,
      endpoints: [
        '/health',
        '/health/database',
        '/health/oauth',
        '/health/connections'
      ]
    },

    // Metrics
    metrics: {
      enabled: true,
      collectInterval: 60000, // 1 minute
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      
      // Metric types
      types: {
        requests: true,
        authentication: true,
        oauth: true,
        errors: true,
        performance: true,
        database: true
      }
    },

    // Alerting
    alerts: {
      enabled: false,
      thresholds: {
        errorRate: 0.05, // 5%
        responseTime: 2000, // 2 seconds
        authFailureRate: 0.1, // 10%
        tokenRefreshFailureRate: 0.2 // 20%
      }
    }
  },

  // Development Configuration
  development: {
    enabled: process.env.NODE_ENV === 'development',
    
    // Debug settings
    debug: {
      verboseLogging: true,
      includeStackTraces: true,
      logSensitiveData: false,
      mockExternalAPIs: false
    },

    // Test settings
    testing: {
      mockUsers: true,
      skipOAuthVerification: false,
      useTestTokens: false,
      bypassRateLimiting: false
    }
  },

  // Production Configuration
  production: {
    enabled: process.env.NODE_ENV === 'production',
    
    // Performance optimizations
    performance: {
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes
      enableCompression: true,
      enableKeepAlive: true,
      maxConnections: 1000
    },

    // Security enhancements
    security: {
      strictValidation: true,
      enhancedLogging: true,
      securityHeaders: true,
      rateLimitStrictMode: true
    }
  }
};

/**
 * Get configuration for a specific platform
 * @param {string} platform - Platform name
 * @returns {object} - Platform configuration
 */
export function getPlatformConfig(platform) {
  return sdkConfig.platforms[platform] || null;
}

/**
 * Check if a feature is enabled
 * @param {string} feature - Feature name
 * @returns {boolean} - Whether feature is enabled
 */
export function isFeatureEnabled(feature) {
  return sdkConfig.features[feature] === true;
}

/**
 * Get rate limit configuration for an endpoint
 * @param {string} endpoint - Endpoint path
 * @param {string} keyType - API key type
 * @returns {object} - Rate limit configuration
 */
export function getRateLimitConfig(endpoint, keyType = 'ona_') {
  // Check for endpoint-specific limits
  const endpointLimit = sdkConfig.rateLimiting.endpoints[endpoint];
  if (endpointLimit) {
    return endpointLimit;
  }

  // Check for tier-specific limits
  const tierLimit = sdkConfig.rateLimiting.tiers[keyType];
  if (tierLimit) {
    return tierLimit;
  }

  // Fall back to default limits
  return sdkConfig.rateLimiting.default;
}

/**
 * Validate SDK configuration
 * @returns {object} - Validation result
 */
export function validateSDKConfig() {
  const errors = [];
  const warnings = [];

  // Check required environment variables
  const requiredEnvVars = [
    'ONAIROS_JWT_SECRET_KEY',
    'MONGO_URI'
  ];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Check JWT configuration
  if (!sdkConfig.authentication.jwt.secretKey) {
    errors.push('JWT secret key is not configured');
  }

  // Check database configuration
  if (!sdkConfig.database.primary.connectionString) {
    errors.push('Primary database connection string is not configured');
  }

  // Check OAuth configurations
  Object.keys(sdkConfig.platforms).forEach(platform => {
    const platformConfig = sdkConfig.platforms[platform];
    if (platformConfig.enabled && !platformConfig.requiredScopes) {
      warnings.push(`Platform ${platform} is enabled but has no required scopes`);
    }
  });

  // Check security configuration
  if (process.env.NODE_ENV === 'production') {
    if (!sdkConfig.security.validation.requireHttps) {
      warnings.push('HTTPS is not required in production configuration');
    }
    
    if (sdkConfig.development.enabled) {
      warnings.push('Development mode is enabled in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    summary: {
      totalChecks: requiredEnvVars.length + Object.keys(sdkConfig.platforms).length + 3,
      passed: requiredEnvVars.length + Object.keys(sdkConfig.platforms).length + 3 - errors.length,
      failed: errors.length,
      warnings: warnings.length
    }
  };
}

/**
 * Get configuration summary
 * @returns {object} - Configuration summary
 */
export function getConfigSummary() {
  const enabledPlatforms = Object.keys(sdkConfig.platforms).filter(
    platform => sdkConfig.platforms[platform].enabled
  );
  
  const enabledFeatures = Object.keys(sdkConfig.features).filter(
    feature => sdkConfig.features[feature] === true
  );

  return {
    sdk: sdkConfig.sdk,
    environment: process.env.NODE_ENV || 'development',
    platforms: {
      total: Object.keys(sdkConfig.platforms).length,
      enabled: enabledPlatforms.length,
      list: enabledPlatforms
    },
    features: {
      total: Object.keys(sdkConfig.features).length,
      enabled: enabledFeatures.length,
      list: enabledFeatures
    },
    authentication: {
      jwtEnabled: !!sdkConfig.authentication.jwt.secretKey,
      apiKeyEnabled: true,
      mfaEnabled: sdkConfig.authentication.mfa.enabled
    },
    database: {
      dualDatabase: !!sdkConfig.database.secondary.connectionString,
      syncEnabled: sdkConfig.database.sync.enabled
    },
    security: {
      corsEnabled: sdkConfig.security.cors.origin.length > 0,
      httpsRequired: sdkConfig.security.validation.requireHttps,
      strictMode: sdkConfig.security.validation.strictMode
    }
  };
}

export default sdkConfig; 
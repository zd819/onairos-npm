import rateLimit from 'express-rate-limit';
import { sdkConfig } from '../config/sdk-config.js';

/**
 * Rate Limiting Middleware for Onairos SDK
 * 
 * Provides intelligent rate limiting based on:
 * - API key tier (different limits for different key types)
 * - User authentication status
 * - Platform-specific limits
 * - Global vs per-user limits
 */

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map();

/**
 * Rate limit tiers based on API key type
 */
const rateLimitTiers = {
  'ona_': {
    name: 'Standard',
    requestsPerMinute: 100,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    concurrentRequests: 10,
    burstMultiplier: 2
  },
  'dev_': {
    name: 'Developer',
    requestsPerMinute: 200,
    requestsPerHour: 2000,
    requestsPerDay: 20000,
    concurrentRequests: 20,
    burstMultiplier: 3
  },
  'pk_': {
    name: 'Public',
    requestsPerMinute: 50,
    requestsPerHour: 500,
    requestsPerDay: 5000,
    concurrentRequests: 5,
    burstMultiplier: 1.5
  },
  'admin': {
    name: 'Admin',
    requestsPerMinute: 1000,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    concurrentRequests: 100,
    burstMultiplier: 5
  }
};

/**
 * Platform-specific rate limits
 */
const platformLimits = {
  youtube: {
    requestsPerMinute: 50,
    requestsPerHour: 500,
    specialLimits: {
      '/youtube/native-auth': { requestsPerMinute: 10 },
      '/youtube/refresh-token': { requestsPerMinute: 20 }
    }
  },
  linkedin: {
    requestsPerMinute: 30,
    requestsPerHour: 300,
    specialLimits: {
      '/linkedin/native-auth': { requestsPerMinute: 10 },
      '/linkedin/refresh-token': { requestsPerMinute: 15 }
    }
  },
  reddit: {
    requestsPerMinute: 60,
    requestsPerHour: 600,
    specialLimits: {
      '/reddit/native-auth': { requestsPerMinute: 10 }
    }
  },
  validation: {
    requestsPerMinute: 30,
    requestsPerHour: 300,
    specialLimits: {
      '/validation/health-check': { requestsPerMinute: 20 },
      '/validation/repair-connections': { requestsPerMinute: 5 }
    }
  }
};

/**
 * Get rate limit key for a request
 */
function getRateLimitKey(req, limitType = 'general') {
  const apiKey = req.headers['x-api-key'];
  const userToken = req.headers['authorization'];
  const platform = req.path.split('/')[1];
  const endpoint = req.path;
  
  // Create composite key based on limit type
  switch (limitType) {
    case 'api_key':
      return `api_key:${apiKey}`;
    case 'user':
      return `user:${userToken}`;
    case 'platform':
      return `platform:${platform}:${apiKey}`;
    case 'endpoint':
      return `endpoint:${endpoint}:${apiKey}`;
    case 'ip':
      return `ip:${req.ip}`;
    default:
      return `general:${apiKey || req.ip}`;
  }
}

/**
 * Get rate limit configuration for request
 */
function getRateLimitConfig(req) {
  const apiKey = req.headers['x-api-key'];
  const platform = req.path.split('/')[1];
  const endpoint = req.path;
  
  // Determine tier based on API key
  let tier = 'pk_'; // Default to public tier
  
  if (apiKey) {
    if (apiKey === sdkConfig.authentication?.apiKey?.adminKey) {
      tier = 'admin';
    } else {
      const keyPrefix = Object.keys(rateLimitTiers).find(prefix => 
        prefix !== 'admin' && apiKey.startsWith(prefix)
      );
      if (keyPrefix) {
        tier = keyPrefix;
      }
    }
  }
  
  const tierConfig = rateLimitTiers[tier];
  
  // Check for platform-specific limits
  const platformConfig = platformLimits[platform];
  
  // Check for endpoint-specific limits
  const endpointConfig = platformConfig?.specialLimits?.[endpoint];
  
  return {
    tier: tierConfig,
    platform: platformConfig,
    endpoint: endpointConfig,
    selectedTier: tier
  };
}

/**
 * Custom rate limit store
 */
class CustomRateLimitStore {
  constructor() {
    this.store = new Map();
    this.windowMs = 60 * 1000; // 1 minute window
    
    // Cleanup old entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (now - value.resetTime > this.windowMs * 2) {
          this.store.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }
  
  get(key) {
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if window has expired
    if (now - entry.resetTime > this.windowMs) {
      this.store.delete(key);
      return undefined;
    }
    
    return entry;
  }
  
  set(key, value) {
    this.store.set(key, {
      ...value,
      resetTime: Date.now()
    });
  }
  
  increment(key, windowMs = this.windowMs) {
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || now - entry.resetTime > windowMs) {
      this.store.set(key, {
        hits: 1,
        resetTime: now
      });
      return 1;
    }
    
    entry.hits++;
    return entry.hits;
  }
  
  decrement(key) {
    const entry = this.store.get(key);
    if (entry && entry.hits > 0) {
      entry.hits--;
    }
  }
}

const rateLimitStoreInstance = new CustomRateLimitStore();

/**
 * General rate limiting middleware
 */
export const generalRateLimit = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000, // 1 minute
    limit: (req) => {
      const config = getRateLimitConfig(req);
      return options.limit || config.tier.requestsPerMinute;
    },
    keyGenerator: (req) => getRateLimitKey(req, 'general'),
    message: (req) => {
      const config = getRateLimitConfig(req);
      return {
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        tier: config.selectedTier,
        limit: config.tier.requestsPerMinute,
        windowMs: 60 * 1000,
        retryAfter: Math.ceil(60 - (Date.now() % 60000) / 1000),
        guidance: 'Please wait before making more requests'
      };
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: rateLimitStoreInstance,
    ...options
  });
};

/**
 * API key-based rate limiting
 */
export const apiKeyRateLimit = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000,
    limit: (req) => {
      const config = getRateLimitConfig(req);
      return options.limit || config.tier.requestsPerMinute;
    },
    keyGenerator: (req) => getRateLimitKey(req, 'api_key'),
    message: (req) => {
      const config = getRateLimitConfig(req);
      return {
        success: false,
        error: 'API key rate limit exceeded',
        code: 'API_KEY_RATE_LIMIT_EXCEEDED',
        tier: config.selectedTier,
        tierName: config.tier.name,
        limit: config.tier.requestsPerMinute,
        windowMs: 60 * 1000,
        retryAfter: Math.ceil(60 - (Date.now() % 60000) / 1000),
        guidance: `API key tier: ${config.tier.name}. Consider upgrading for higher limits.`
      };
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: rateLimitStoreInstance,
    ...options
  });
};

/**
 * Platform-specific rate limiting
 */
export const platformRateLimit = (platform, options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000,
    limit: (req) => {
      const config = getRateLimitConfig(req);
      const platformConfig = config.platform;
      
      if (platformConfig && options.limit) {
        return options.limit;
      }
      
      return platformConfig?.requestsPerMinute || config.tier.requestsPerMinute;
    },
    keyGenerator: (req) => getRateLimitKey(req, 'platform'),
    message: (req) => {
      const config = getRateLimitConfig(req);
      const platformConfig = config.platform;
      
      return {
        success: false,
        error: `${platform} rate limit exceeded`,
        code: 'PLATFORM_RATE_LIMIT_EXCEEDED',
        platform: platform,
        tier: config.selectedTier,
        limit: platformConfig?.requestsPerMinute || config.tier.requestsPerMinute,
        windowMs: 60 * 1000,
        retryAfter: Math.ceil(60 - (Date.now() % 60000) / 1000),
        guidance: `Rate limit for ${platform} platform exceeded. Please wait before making more requests.`
      };
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: rateLimitStoreInstance,
    ...options
  });
};

/**
 * Endpoint-specific rate limiting
 */
export const endpointRateLimit = (endpoint, options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000,
    limit: (req) => {
      const config = getRateLimitConfig(req);
      const endpointConfig = config.endpoint;
      
      if (endpointConfig && endpointConfig.requestsPerMinute) {
        return endpointConfig.requestsPerMinute;
      }
      
      return options.limit || config.tier.requestsPerMinute;
    },
    keyGenerator: (req) => getRateLimitKey(req, 'endpoint'),
    message: (req) => {
      const config = getRateLimitConfig(req);
      const endpointConfig = config.endpoint;
      
      return {
        success: false,
        error: `Endpoint rate limit exceeded`,
        code: 'ENDPOINT_RATE_LIMIT_EXCEEDED',
        endpoint: endpoint,
        tier: config.selectedTier,
        limit: endpointConfig?.requestsPerMinute || config.tier.requestsPerMinute,
        windowMs: 60 * 1000,
        retryAfter: Math.ceil(60 - (Date.now() % 60000) / 1000),
        guidance: `Rate limit for endpoint ${endpoint} exceeded. Please wait before making more requests.`
      };
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: rateLimitStoreInstance,
    ...options
  });
};

/**
 * Burst protection middleware
 */
export const burstProtection = (options = {}) => {
  return (req, res, next) => {
    const config = getRateLimitConfig(req);
    const burstLimit = Math.floor(config.tier.requestsPerMinute * config.tier.burstMultiplier);
    const key = getRateLimitKey(req, 'burst');
    
    // Check burst limit (5-second window)
    const burstHits = rateLimitStoreInstance.increment(key, 5000);
    
    if (burstHits > burstLimit) {
      return res.status(429).json({
        success: false,
        error: 'Burst rate limit exceeded',
        code: 'BURST_RATE_LIMIT_EXCEEDED',
        tier: config.selectedTier,
        burstLimit: burstLimit,
        windowMs: 5000,
        retryAfter: 5,
        guidance: 'Too many requests in a short time. Please slow down your request rate.'
      });
    }
    
    next();
  };
};

/**
 * Concurrent request limiting
 */
export const concurrentRequestLimit = (options = {}) => {
  const activeRequests = new Map();
  
  return (req, res, next) => {
    const config = getRateLimitConfig(req);
    const key = getRateLimitKey(req, 'concurrent');
    const limit = options.limit || config.tier.concurrentRequests;
    
    const current = activeRequests.get(key) || 0;
    
    if (current >= limit) {
      return res.status(429).json({
        success: false,
        error: 'Too many concurrent requests',
        code: 'CONCURRENT_REQUESTS_EXCEEDED',
        tier: config.selectedTier,
        limit: limit,
        current: current,
        guidance: 'Wait for existing requests to complete before making new ones.'
      });
    }
    
    // Increment counter
    activeRequests.set(key, current + 1);
    
    // Decrement counter when request completes
    const originalEnd = res.end;
    res.end = function(...args) {
      const newCount = activeRequests.get(key) - 1;
      if (newCount <= 0) {
        activeRequests.delete(key);
      } else {
        activeRequests.set(key, newCount);
      }
      originalEnd.apply(res, args);
    };
    
    next();
  };
};

/**
 * Adaptive rate limiting based on system load
 */
export const adaptiveRateLimit = (options = {}) => {
  return (req, res, next) => {
    const config = getRateLimitConfig(req);
    const systemLoad = process.loadavg()[0]; // 1-minute load average
    const cpuCount = require('os').cpus().length;
    const loadRatio = systemLoad / cpuCount;
    
    // Reduce limits if system is under high load
    let multiplier = 1;
    
    if (loadRatio > 0.8) {
      multiplier = 0.5; // Reduce limits by 50%
    } else if (loadRatio > 0.6) {
      multiplier = 0.75; // Reduce limits by 25%
    }
    
    if (multiplier < 1) {
      const adjustedLimit = Math.floor(config.tier.requestsPerMinute * multiplier);
      const key = getRateLimitKey(req, 'adaptive');
      const hits = rateLimitStoreInstance.increment(key);
      
      if (hits > adjustedLimit) {
        return res.status(429).json({
          success: false,
          error: 'System under high load - rate limit temporarily reduced',
          code: 'ADAPTIVE_RATE_LIMIT_EXCEEDED',
          tier: config.selectedTier,
          originalLimit: config.tier.requestsPerMinute,
          adjustedLimit: adjustedLimit,
          systemLoad: Math.round(loadRatio * 100),
          retryAfter: Math.ceil(60 - (Date.now() % 60000) / 1000),
          guidance: 'System is under high load. Please reduce request rate temporarily.'
        });
      }
    }
    
    next();
  };
};

/**
 * Rate limit bypass for admin operations
 */
export const adminBypass = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey === sdkConfig.authentication?.apiKey?.adminKey) {
    console.log('🔓 [RATE-LIMIT] Admin bypass activated');
    req.rateLimitBypass = true;
    return next();
  }
  
  next();
};

/**
 * Combined rate limiting middleware
 */
export const combinedRateLimit = (options = {}) => {
  return [
    adminBypass,
    (req, res, next) => {
      if (req.rateLimitBypass) {
        return next();
      }
      
      // Apply multiple rate limiting strategies
      const middleware = [
        burstProtection(options.burst),
        concurrentRequestLimit(options.concurrent),
        apiKeyRateLimit(options.apiKey),
        generalRateLimit(options.general)
      ];
      
      if (options.adaptive) {
        middleware.unshift(adaptiveRateLimit(options.adaptive));
      }
      
      let index = 0;
      
      function runNext() {
        if (index >= middleware.length) {
          return next();
        }
        
        const currentMiddleware = middleware[index++];
        currentMiddleware(req, res, runNext);
      }
      
      runNext();
    }
  ];
};

/**
 * Get rate limit status for a request
 */
export const getRateLimitStatus = (req) => {
  const config = getRateLimitConfig(req);
  const generalKey = getRateLimitKey(req, 'general');
  const apiKeyKey = getRateLimitKey(req, 'api_key');
  const platformKey = getRateLimitKey(req, 'platform');
  
  const generalStatus = rateLimitStoreInstance.get(generalKey);
  const apiKeyStatus = rateLimitStoreInstance.get(apiKeyKey);
  const platformStatus = rateLimitStoreInstance.get(platformKey);
  
  return {
    tier: config.selectedTier,
    tierName: config.tier.name,
    limits: {
      general: {
        limit: config.tier.requestsPerMinute,
        used: generalStatus?.hits || 0,
        remaining: Math.max(0, config.tier.requestsPerMinute - (generalStatus?.hits || 0)),
        resetAt: generalStatus?.resetTime ? new Date(generalStatus.resetTime + 60000) : null
      },
      apiKey: {
        limit: config.tier.requestsPerMinute,
        used: apiKeyStatus?.hits || 0,
        remaining: Math.max(0, config.tier.requestsPerMinute - (apiKeyStatus?.hits || 0)),
        resetAt: apiKeyStatus?.resetTime ? new Date(apiKeyStatus.resetTime + 60000) : null
      },
      platform: {
        limit: config.platform?.requestsPerMinute || config.tier.requestsPerMinute,
        used: platformStatus?.hits || 0,
        remaining: Math.max(0, (config.platform?.requestsPerMinute || config.tier.requestsPerMinute) - (platformStatus?.hits || 0)),
        resetAt: platformStatus?.resetTime ? new Date(platformStatus.resetTime + 60000) : null
      }
    }
  };
};

/**
 * Rate limit status endpoint middleware
 */
export const rateLimitStatusEndpoint = (req, res, next) => {
  if (req.path === '/rate-limit-status') {
    const status = getRateLimitStatus(req);
    return res.json({
      success: true,
      rateLimitStatus: status,
      timestamp: new Date()
    });
  }
  
  next();
};

export default {
  generalRateLimit,
  apiKeyRateLimit,
  platformRateLimit,
  endpointRateLimit,
  burstProtection,
  concurrentRequestLimit,
  adaptiveRateLimit,
  adminBypass,
  combinedRateLimit,
  getRateLimitStatus,
  rateLimitStatusEndpoint
}; 
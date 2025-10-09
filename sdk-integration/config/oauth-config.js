import dotenv from 'dotenv';

dotenv.config();

export const oauthConfig = {
  // YouTube OAuth Configuration
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'https://api2.onairos.uk/youtube/callback',
    scopes: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'openid',
      'profile',
      'email'
    ],
    additionalParams: {
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true
    },
    apiKey: process.env.YOUTUBE_API_KEY,
    endpoints: {
      auth: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://oauth2.googleapis.com/token',
      revoke: 'https://oauth2.googleapis.com/revoke',
      userInfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
      api: 'https://www.googleapis.com/youtube/v3'
    }
  },

  // LinkedIn OAuth Configuration
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'https://api2.onairos.uk/linkedin/callback',
    scopes: [
      'r_liteprofile',
      'r_emailaddress',
      'w_member_social'
    ],
    additionalParams: {
      response_type: 'code',
      state: 'random_state'
    },
    endpoints: {
      auth: 'https://www.linkedin.com/oauth/v2/authorization',
      token: 'https://www.linkedin.com/oauth/v2/accessToken',
      userInfo: 'https://api.linkedin.com/v2/people/~',
      api: 'https://api.linkedin.com/v2'
    }
  },

  // Reddit OAuth Configuration
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    redirectUri: process.env.REDDIT_REDIRECT_URI || 'https://api2.onairos.uk/reddit/callback',
    scopes: [
      'identity',
      'read',
      'history'
    ],
    additionalParams: {
      response_type: 'code',
      duration: 'permanent'
    },
    endpoints: {
      auth: 'https://www.reddit.com/api/v1/authorize',
      token: 'https://www.reddit.com/api/v1/access_token',
      userInfo: 'https://oauth.reddit.com/api/v1/me',
      api: 'https://oauth.reddit.com'
    }
  },

  // Pinterest OAuth Configuration
  pinterest: {
    clientId: process.env.PINTEREST_CLIENT_ID,
    clientSecret: process.env.PINTEREST_CLIENT_SECRET,
    redirectUri: process.env.PINTEREST_REDIRECT_URI || 'https://api2.onairos.uk/pinterest/callback',
    scopes: [
      'read_public',
      'read_secret'
    ],
    additionalParams: {
      response_type: 'code'
    },
    endpoints: {
      auth: 'https://www.pinterest.com/oauth/',
      token: 'https://api.pinterest.com/v5/oauth/token',
      userInfo: 'https://api.pinterest.com/v5/user_account',
      api: 'https://api.pinterest.com/v5'
    }
  },

  // Gmail OAuth Configuration
  gmail: {
    clientId: process.env.GMAIL_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET,
    redirectUri: process.env.GMAIL_REDIRECT_URI || 'https://api2.onairos.uk/gmail/callback',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.metadata',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ],
    additionalParams: {
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true
    },
    endpoints: {
      auth: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://oauth2.googleapis.com/token',
      revoke: 'https://oauth2.googleapis.com/revoke',
      userInfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
      api: 'https://www.googleapis.com/gmail/v1'
    }
  },

  // Apple OAuth Configuration
  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY,
    redirectUri: process.env.APPLE_REDIRECT_URI || 'https://api2.onairos.uk/apple/callback',
    scopes: [
      'name',
      'email'
    ],
    additionalParams: {
      response_type: 'code',
      response_mode: 'form_post'
    },
    endpoints: {
      auth: 'https://appleid.apple.com/auth/authorize',
      token: 'https://appleid.apple.com/auth/token',
      keys: 'https://appleid.apple.com/auth/keys'
    }
  },

  // Common OAuth settings
  common: {
    tokenExpiry: 3600, // 1 hour in seconds
    refreshTokenExpiry: 86400 * 30, // 30 days in seconds
    stateExpiry: 300, // 5 minutes in seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    requestTimeout: 30000, // 30 seconds
    
    // Security settings
    securitySettings: {
      enforceHttps: true,
      requireState: true,
      requirePKCE: false, // Can be enabled per platform
      maxStateLength: 128,
      allowedOrigins: [
        'https://onairos.uk',
        'https://api2.onairos.uk',
        'https://enoch.onairos.uk'
      ]
    }
  }
};

/**
 * Validate OAuth configuration for a platform
 * @param {string} platform - Platform name
 * @returns {object} - Validation result
 */
export function validateOAuthConfig(platform) {
  const config = oauthConfig[platform];
  
  if (!config) {
    return {
      valid: false,
      error: `OAuth configuration not found for platform: ${platform}`,
      missingFields: []
    };
  }
  
  const requiredFields = ['clientId', 'clientSecret', 'redirectUri', 'scopes'];
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!config[field] || (Array.isArray(config[field]) && config[field].length === 0)) {
      missingFields.push(field);
    }
  });
  
  // Platform-specific validations
  if (platform === 'youtube' && !config.apiKey) {
    missingFields.push('apiKey');
  }
  
  if (platform === 'apple') {
    const appleRequiredFields = ['teamId', 'keyId', 'privateKey'];
    appleRequiredFields.forEach(field => {
      if (!config[field]) {
        missingFields.push(field);
      }
    });
  }
  
  const valid = missingFields.length === 0;
  
  return {
    valid: valid,
    error: valid ? null : `Missing required OAuth configuration fields: ${missingFields.join(', ')}`,
    missingFields: missingFields,
    warnings: generateConfigWarnings(platform, config)
  };
}

/**
 * Generate OAuth URL for a platform
 * @param {string} platform - Platform name
 * @param {object} options - Additional options
 * @returns {string} - OAuth URL
 */
export function generateOAuthUrl(platform, options = {}) {
  const config = oauthConfig[platform];
  
  if (!config) {
    throw new Error(`OAuth configuration not found for platform: ${platform}`);
  }
  
  const validation = validateOAuthConfig(platform);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const params = new URLSearchParams();
  
  // Common OAuth parameters
  params.append('client_id', config.clientId);
  params.append('redirect_uri', config.redirectUri);
  params.append('scope', config.scopes.join(' '));
  
  // Platform-specific parameters
  Object.entries(config.additionalParams).forEach(([key, value]) => {
    params.append(key, value);
  });
  
  // Custom parameters from options
  Object.entries(options).forEach(([key, value]) => {
    params.append(key, value);
  });
  
  // Generate state parameter if required
  if (oauthConfig.common.securitySettings.requireState && !options.state) {
    params.append('state', generateSecureState());
  }
  
  return `${config.endpoints.auth}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param {string} platform - Platform name
 * @param {string} code - Authorization code
 * @param {object} options - Additional options
 * @returns {object} - Token response
 */
export async function exchangeCodeForToken(platform, code, options = {}) {
  const config = oauthConfig[platform];
  
  if (!config) {
    throw new Error(`OAuth configuration not found for platform: ${platform}`);
  }
  
  const tokenEndpoint = config.endpoints.token;
  const body = new URLSearchParams();
  
  body.append('grant_type', 'authorization_code');
  body.append('client_id', config.clientId);
  body.append('client_secret', config.clientSecret);
  body.append('code', code);
  body.append('redirect_uri', config.redirectUri);
  
  // Add any additional parameters
  Object.entries(options).forEach(([key, value]) => {
    body.append(key, value);
  });
  
  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString(),
      timeout: oauthConfig.common.requestTimeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const tokenData = await response.json();
    
    return {
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      rawResponse: tokenData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Refresh access token
 * @param {string} platform - Platform name
 * @param {string} refreshToken - Refresh token
 * @returns {object} - Token response
 */
export async function refreshAccessToken(platform, refreshToken) {
  const config = oauthConfig[platform];
  
  if (!config) {
    throw new Error(`OAuth configuration not found for platform: ${platform}`);
  }
  
  const tokenEndpoint = config.endpoints.token;
  const body = new URLSearchParams();
  
  body.append('grant_type', 'refresh_token');
  body.append('client_id', config.clientId);
  body.append('client_secret', config.clientSecret);
  body.append('refresh_token', refreshToken);
  
  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString(),
      timeout: oauthConfig.common.requestTimeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const tokenData = await response.json();
    
    return {
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken, // Some platforms don't return new refresh token
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      rawResponse: tokenData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Revoke access token
 * @param {string} platform - Platform name
 * @param {string} accessToken - Access token
 * @returns {object} - Revocation response
 */
export async function revokeToken(platform, accessToken) {
  const config = oauthConfig[platform];
  
  if (!config || !config.endpoints.revoke) {
    throw new Error(`Token revocation not supported for platform: ${platform}`);
  }
  
  const revokeEndpoint = config.endpoints.revoke;
  
  try {
    const response = await fetch(`${revokeEndpoint}?token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: oauthConfig.common.requestTimeout
    });
    
    return {
      success: response.ok,
      status: response.status,
      error: response.ok ? null : await response.text()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all configured platforms
 * @returns {array} - Array of configured platforms
 */
export function getConfiguredPlatforms() {
  return Object.keys(oauthConfig).filter(key => key !== 'common');
}

/**
 * Get platform configuration
 * @param {string} platform - Platform name
 * @returns {object} - Platform configuration
 */
export function getPlatformConfig(platform) {
  return oauthConfig[platform] || null;
}

/**
 * Check if all required environment variables are set
 * @returns {object} - Environment check result
 */
export function checkEnvironmentVariables() {
  const required = [
    'YOUTUBE_CLIENT_ID',
    'YOUTUBE_CLIENT_SECRET',
    'YOUTUBE_API_KEY',
    'LINKEDIN_CLIENT_ID',
    'LINKEDIN_CLIENT_SECRET',
    'ONAIROS_JWT_SECRET_KEY'
  ];
  
  const missing = required.filter(varName => !process.env[varName]);
  const warnings = [];
  
  // Check for optional but recommended variables
  const recommended = [
    'REDDIT_CLIENT_ID',
    'PINTEREST_CLIENT_ID',
    'APPLE_CLIENT_ID'
  ];
  
  recommended.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`${varName} not set - ${varName.split('_')[0].toLowerCase()} OAuth will not work`);
    }
  });
  
  return {
    valid: missing.length === 0,
    missing: missing,
    warnings: warnings,
    message: missing.length === 0 ? 
      'All required environment variables are set' : 
      `Missing required environment variables: ${missing.join(', ')}`
  };
}

// Helper functions

function generateSecureState() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateConfigWarnings(platform, config) {
  const warnings = [];
  
  // Check for HTTP redirect URIs in production
  if (config.redirectUri && config.redirectUri.startsWith('http:') && 
      process.env.NODE_ENV === 'production') {
    warnings.push('Using HTTP redirect URI in production is not secure');
  }
  
  // Check for missing API keys
  if (platform === 'youtube' && !config.apiKey) {
    warnings.push('YouTube API key not configured - some features may not work');
  }
  
  // Check scope coverage
  if (config.scopes.length === 0) {
    warnings.push('No OAuth scopes configured - functionality will be limited');
  }
  
  return warnings;
}

export default oauthConfig; 
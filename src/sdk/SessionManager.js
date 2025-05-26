import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

/**
 * Session Manager for user authentication and isolation
 * Handles JWT token generation and validation
 */
export class SessionManager {
  constructor({ jwtSecret }) {
    if (!jwtSecret) {
      throw new Error('JWT secret is required for session management');
    }
    this.jwtSecret = jwtSecret;
    this.defaultExpiration = '24h'; // Default session duration
  }

  /**
   * Generate a session token for a user
   * @param {string} userId - User identifier
   * @param {Object} options - Token options
   * @param {string} options.expiresIn - Token expiration time
   * @param {Object} options.additionalClaims - Additional claims to include
   * @returns {string} JWT session token
   */
  generateSessionToken(userId, options = {}) {
    try {
      const {
        expiresIn = this.defaultExpiration,
        additionalClaims = {}
      } = options;

      const sessionId = `session_${uuidv4()}`;
      const issuedAt = Math.floor(Date.now() / 1000);

      const payload = {
        userId,
        sessionId,
        iat: issuedAt,
        type: 'onairos_session',
        ...additionalClaims
      };

      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn,
        issuer: 'onairos-sdk',
        audience: 'onairos-client'
      });

      return token;
    } catch (error) {
      throw new Error(`Failed to generate session token: ${error.message}`);
    }
  }

  /**
   * Validate a session token
   * @param {string} token - JWT token to validate
   * @returns {Promise<Object>} Decoded token payload
   */
  async validateSession(token) {
    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new Error('No token provided'));
        return;
      }

      jwt.verify(token, this.jwtSecret, {
        issuer: 'onairos-sdk',
        audience: 'onairos-client'
      }, (err, decoded) => {
        if (err) {
          if (err.name === 'TokenExpiredError') {
            reject(new Error('Session token has expired'));
          } else if (err.name === 'JsonWebTokenError') {
            reject(new Error('Invalid session token'));
          } else {
            reject(new Error(`Token validation failed: ${err.message}`));
          }
          return;
        }

        // Validate token type
        if (decoded.type !== 'onairos_session') {
          reject(new Error('Invalid token type'));
          return;
        }

        resolve(decoded);
      });
    });
  }

  /**
   * Refresh a session token
   * @param {string} token - Current token to refresh
   * @param {Object} options - Refresh options
   * @returns {Promise<string>} New session token
   */
  async refreshSession(token, options = {}) {
    try {
      const decoded = await this.validateSession(token);
      
      // Generate new token with same user ID but new session ID
      return this.generateSessionToken(decoded.userId, {
        expiresIn: options.expiresIn || this.defaultExpiration,
        additionalClaims: options.additionalClaims || {}
      });
    } catch (error) {
      throw new Error(`Failed to refresh session: ${error.message}`);
    }
  }

  /**
   * Extract user ID from token without full validation
   * @param {string} token - JWT token
   * @returns {string|null} User ID or null if invalid
   */
  extractUserId(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded?.userId || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if expired
   */
  isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date|null} Expiration date or null if invalid
   */
  getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return null;
      }
      
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a guest session token (for anonymous users)
   * @param {Object} options - Token options
   * @returns {string} Guest session token
   */
  generateGuestToken(options = {}) {
    const guestId = `guest_${uuidv4()}`;
    return this.generateSessionToken(guestId, {
      expiresIn: options.expiresIn || '1h',
      additionalClaims: {
        type: 'guest',
        ...options.additionalClaims
      }
    });
  }

  /**
   * Validate session and ensure user access
   * @param {string} token - Session token
   * @param {string} expectedUserId - Expected user ID
   * @returns {Promise<Object>} Validation result
   */
  async validateUserAccess(token, expectedUserId) {
    try {
      const decoded = await this.validateSession(token);
      
      if (decoded.userId !== expectedUserId) {
        throw new Error('User ID mismatch - access denied');
      }

      return {
        valid: true,
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        isGuest: decoded.type === 'guest'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Generate API key for server-to-server communication
   * @param {string} clientId - Client identifier
   * @param {Array} scopes - API scopes
   * @returns {string} API key token
   */
  generateApiKey(clientId, scopes = []) {
    try {
      const payload = {
        clientId,
        scopes,
        type: 'api_key',
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(payload, this.jwtSecret, {
        issuer: 'onairos-sdk',
        audience: 'onairos-api'
      });
    } catch (error) {
      throw new Error(`Failed to generate API key: ${error.message}`);
    }
  }

  /**
   * Validate API key
   * @param {string} apiKey - API key to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateApiKey(apiKey) {
    return new Promise((resolve, reject) => {
      jwt.verify(apiKey, this.jwtSecret, {
        issuer: 'onairos-sdk',
        audience: 'onairos-api'
      }, (err, decoded) => {
        if (err) {
          reject(new Error(`Invalid API key: ${err.message}`));
          return;
        }

        if (decoded.type !== 'api_key') {
          reject(new Error('Invalid key type'));
          return;
        }

        resolve(decoded);
      });
    });
  }
} 
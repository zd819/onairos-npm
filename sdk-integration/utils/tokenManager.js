import jwt from 'jsonwebtoken';
import { User } from '../../Mongoose/models.js';
import { getEnochModels } from '../../utils/enochDb.js';
import { refreshTokenForYoutube } from '../../routes/YoutubePullUserData.js';
import { refreshTokenLinkedIn } from '../../routes/LinkedinPullUserData.js';
import fetch from 'node-fetch';

export class TokenManager {
  constructor() {
    this.supportedPlatforms = ['youtube', 'linkedin', 'reddit', 'pinterest', 'apple'];
  }

  /**
   * Check if a token is expired
   * @param {Date|string} expiryTime - Token expiry time
   * @returns {boolean} - True if expired
   */
  isTokenExpired(expiryTime) {
    if (!expiryTime) return true;
    
    const expiryDate = new Date(expiryTime);
    const now = new Date();
    
    // Add a 5-minute buffer to prevent edge cases
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return now >= (expiryDate.getTime() - bufferTime);
  }

  /**
   * Validate JWT token
   * @param {string} token - JWT token to validate
   * @returns {object} - Decoded token or null if invalid
   */
  async validateJWT(token) {
    if (!token) return null;
    
    try {
      const decoded = jwt.verify(token, process.env.ONAIROS_JWT_SECRET_KEY);
      return {
        id: decoded.id || decoded.userId || decoded.sub,
        email: decoded.email,
        username: decoded.username,
        isEnochUser: decoded.id && !decoded.userId,
        tokenType: decoded.id && !decoded.userId ? 'Enoch' : 'Onairos',
        decoded: decoded
      };
    } catch (error) {
      console.warn('JWT validation failed:', error.message);
      return null;
    }
  }

  /**
   * Get user from either Enoch or Onairos database
   * @param {string} identifier - Username or email
   * @param {string} userId - User ID (optional)
   * @returns {object} - User object with database info
   */
  async getUser(identifier, userId = null) {
    let user = null;
    let userType = 'onairos';
    
    // Try Enoch database first if we have a user ID
    if (userId) {
      try {
        const { EnochUser } = getEnochModels();
        user = await EnochUser.findById(userId);
        if (user) {
          userType = 'enoch';
          console.log(`✅ Found Enoch user: ${user.name || user.email}`);
        }
      } catch (enochError) {
        console.warn('Enoch database query failed:', enochError.message);
      }
    }
    
    // Try Onairos database if not found in Enoch
    if (!user) {
      if (userId) {
        user = await User.findById(userId);
      }
      if (!user && identifier) {
        user = await User.findOne({ 
          $or: [
            { userName: identifier },
            { email: identifier }
          ]
        });
      }
      
      if (user) {
        userType = 'onairos';
        console.log(`✅ Found Onairos user: ${user.userName || user.email}`);
      }
    }
    
    return {
      user,
      userType,
      isEnochUser: userType === 'enoch'
    };
  }

  /**
   * Get platform account data from user
   * @param {object} user - User object
   * @param {string} platform - Platform name (youtube, linkedin, etc.)
   * @param {string} userType - User type (enoch or onairos)
   * @returns {object} - Platform account data
   */
  getPlatformAccount(user, platform, userType) {
    if (!user || !platform) return null;
    
    if (userType === 'enoch') {
      // Enoch users store platform data directly on user object
      switch (platform) {
        case 'youtube':
          return {
            accessToken: user.youtubeAccessToken,
            refreshToken: user.youtubeRefreshToken,
            tokenExpiry: user.youtubeTokenExpiry,
            channelName: user.youtubeChannelName,
            channelId: user.youtubeChannelId,
            connectedAt: user.youtubeConnectedAt
          };
        case 'linkedin':
          return {
            accessToken: user.linkedinAccessToken,
            refreshToken: user.linkedinRefreshToken,
            tokenExpiry: user.linkedinTokenExpiry,
            userName: user.linkedinUserName,
            connectedAt: user.linkedinConnectedAt
          };
        default:
          return null;
      }
    } else {
      // Onairos users store platform data in accounts object
      return user.accounts?.[platform] || null;
    }
  }

  /**
   * Update platform account data
   * @param {object} user - User object
   * @param {string} platform - Platform name
   * @param {object} data - Platform data to update
   * @param {string} userType - User type (enoch or onairos)
   */
  async updatePlatformAccount(user, platform, data, userType) {
    if (!user || !platform || !data) return;
    
    if (userType === 'enoch') {
      // Update Enoch user directly
      const { EnochUser } = getEnochModels();
      const updateData = {};
      
      switch (platform) {
        case 'youtube':
          if (data.accessToken) updateData.youtubeAccessToken = data.accessToken;
          if (data.refreshToken) updateData.youtubeRefreshToken = data.refreshToken;
          if (data.tokenExpiry) updateData.youtubeTokenExpiry = data.tokenExpiry;
          if (data.channelName) updateData.youtubeChannelName = data.channelName;
          if (data.channelId) updateData.youtubeChannelId = data.channelId;
          updateData.youtubeLastValidated = new Date();
          break;
        case 'linkedin':
          if (data.accessToken) updateData.linkedinAccessToken = data.accessToken;
          if (data.refreshToken) updateData.linkedinRefreshToken = data.refreshToken;
          if (data.tokenExpiry) updateData.linkedinTokenExpiry = data.tokenExpiry;
          if (data.userName) updateData.linkedinUserName = data.userName;
          updateData.linkedinLastValidated = new Date();
          break;
      }
      
      await EnochUser.updateOne(
        { _id: user._id },
        { $set: updateData }
      );
      
      console.log(`✅ Updated ${platform} data in Enoch database`);
    } else {
      // Update Onairos user accounts
      if (!user.accounts) user.accounts = {};
      if (!user.accounts[platform]) user.accounts[platform] = {};
      
      Object.assign(user.accounts[platform], data);
      user.accounts[platform].lastValidated = new Date();
      
      await user.save();
      console.log(`✅ Updated ${platform} data in Onairos database`);
    }
  }

  /**
   * Refresh access token for a platform
   * @param {string} platform - Platform name
   * @param {string} identifier - User identifier
   * @returns {string} - New access token
   */
  async refreshAccessToken(platform, identifier) {
    console.log(`🔄 Refreshing ${platform} token for user: ${identifier}`);
    
    switch (platform) {
      case 'youtube':
        return await refreshTokenForYoutube(identifier);
      case 'linkedin':
        return await refreshTokenLinkedIn(identifier);
      default:
        throw new Error(`Token refresh not supported for platform: ${platform}`);
    }
  }

  /**
   * Validate platform token by making API call
   * @param {string} platform - Platform name
   * @param {string} accessToken - Access token to validate
   * @returns {object} - Validation result
   */
  async validatePlatformToken(platform, accessToken) {
    if (!accessToken) {
      return {
        valid: false,
        error: 'No access token provided'
      };
    }
    
    try {
      let testResponse;
      
      switch (platform) {
        case 'youtube':
          testResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          break;
        case 'linkedin':
          testResponse = await fetch('https://api.linkedin.com/v2/people/~', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          break;
        default:
          return {
            valid: false,
            error: `Token validation not supported for platform: ${platform}`
          };
      }
      
      if (testResponse.ok) {
        const data = await testResponse.json();
        return {
          valid: true,
          data: data,
          status: testResponse.status
        };
      } else {
        const errorText = await testResponse.text();
        return {
          valid: false,
          error: `API test failed: ${testResponse.status} - ${errorText}`,
          status: testResponse.status
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: `API test error: ${error.message}`
      };
    }
  }

  /**
   * Get comprehensive token status for a user and platform
   * @param {string} identifier - User identifier
   * @param {string} platform - Platform name
   * @returns {object} - Comprehensive token status
   */
  async getTokenStatus(identifier, platform) {
    try {
      const { user, userType } = await this.getUser(identifier);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          status: 'user_not_found'
        };
      }
      
      const platformAccount = this.getPlatformAccount(user, platform, userType);
      
      if (!platformAccount || !platformAccount.accessToken) {
        return {
          success: false,
          error: 'Platform not connected',
          status: 'not_connected',
          userType: userType
        };
      }
      
      const isExpired = this.isTokenExpired(platformAccount.tokenExpiry);
      const hasRefreshToken = !!platformAccount.refreshToken;
      
      // Test current token
      const validationResult = await this.validatePlatformToken(platform, platformAccount.accessToken);
      
      let status = 'unknown';
      let needsRefresh = false;
      let canRefresh = false;
      
      if (validationResult.valid) {
        status = 'healthy';
        needsRefresh = false;
        canRefresh = hasRefreshToken;
      } else if (isExpired && hasRefreshToken) {
        status = 'expired_refreshable';
        needsRefresh = true;
        canRefresh = true;
      } else if (isExpired && !hasRefreshToken) {
        status = 'expired_no_refresh';
        needsRefresh = true;
        canRefresh = false;
      } else {
        status = 'invalid_token';
        needsRefresh = true;
        canRefresh = hasRefreshToken;
      }
      
      return {
        success: true,
        status: status,
        userType: userType,
        platform: platform,
        tokenDetails: {
          hasAccessToken: !!platformAccount.accessToken,
          hasRefreshToken: hasRefreshToken,
          isExpired: isExpired,
          tokenExpiry: platformAccount.tokenExpiry,
          isValid: validationResult.valid,
          validationError: validationResult.error
        },
        needsRefresh: needsRefresh,
        canRefresh: canRefresh,
        platformData: {
          channelName: platformAccount.channelName,
          channelId: platformAccount.channelId,
          userName: platformAccount.userName,
          connectedAt: platformAccount.connectedAt
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * Attempt to refresh token if needed
   * @param {string} identifier - User identifier
   * @param {string} platform - Platform name
   * @returns {object} - Refresh result
   */
  async refreshTokenIfNeeded(identifier, platform) {
    try {
      const tokenStatus = await this.getTokenStatus(identifier, platform);
      
      if (!tokenStatus.success) {
        return tokenStatus;
      }
      
      if (!tokenStatus.needsRefresh) {
        return {
          success: true,
          message: 'Token is still valid, no refresh needed',
          refreshed: false,
          tokenStatus: tokenStatus
        };
      }
      
      if (!tokenStatus.canRefresh) {
        return {
          success: false,
          error: 'Token needs refresh but no refresh token available',
          needsReconnection: true,
          tokenStatus: tokenStatus
        };
      }
      
      // Attempt to refresh
      const newAccessToken = await this.refreshAccessToken(platform, identifier);
      
      // Update the user's token
      const { user, userType } = await this.getUser(identifier);
      if (user) {
        await this.updatePlatformAccount(user, platform, {
          accessToken: newAccessToken,
          tokenExpiry: new Date(Date.now() + 3600000) // 1 hour from now
        }, userType);
      }
      
      return {
        success: true,
        message: 'Token refreshed successfully',
        refreshed: true,
        newAccessToken: newAccessToken.substring(0, 20) + '...' // Partial token for security
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        refreshed: false
      };
    }
  }

  /**
   * Generate token expiry date
   * @param {number} expiresIn - Seconds until expiry
   * @returns {Date} - Expiry date
   */
  generateExpiryDate(expiresIn = 3600) {
    return new Date(Date.now() + (expiresIn * 1000));
  }

  /**
   * Get time until token expiry
   * @param {Date|string} expiryTime - Token expiry time
   * @returns {object} - Time until expiry
   */
  getTimeUntilExpiry(expiryTime) {
    if (!expiryTime) return { expired: true, seconds: 0 };
    
    const expiryDate = new Date(expiryTime);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { expired: true, seconds: 0 };
    }
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return {
      expired: false,
      seconds: seconds,
      minutes: minutes,
      hours: hours,
      humanReadable: hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m ${seconds % 60}s`
    };
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
export default tokenManager; 
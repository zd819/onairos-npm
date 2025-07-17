import { User } from '../../Mongoose/models.js';
import { getEnochModels, connectEnochDB } from '../../utils/enochDb.js';

export class DatabaseUtils {
  constructor() {
    this.databases = {
      ENOCH: 'enoch',
      ONAIROS: 'onairos'
    };
  }

  /**
   * Find user across both databases
   * @param {string} identifier - Username, email, or user ID
   * @param {string} preferredDb - Preferred database to check first
   * @returns {object} - User object with database info
   */
  async findUser(identifier, preferredDb = null) {
    try {
      console.log(`🔍 [DB-UTILS] Looking for user: ${identifier}`);
      
      let user = null;
      let userType = null;
      let searchResults = {
        enochSearched: false,
        onairosSearched: false,
        enochFound: false,
        onairosFound: false
      };

      // Determine search order
      const searchOrder = preferredDb === this.databases.ENOCH ? 
        ['enoch', 'onairos'] : ['onairos', 'enoch'];

      for (const dbType of searchOrder) {
        if (dbType === 'enoch' && !searchResults.enochSearched) {
          try {
            await connectEnochDB();
            const { EnochUser } = getEnochModels();
            
            // Try multiple search methods for Enoch
            user = await EnochUser.findById(identifier) ||
                   await EnochUser.findOne({ email: identifier }) ||
                   await EnochUser.findOne({ name: identifier }) ||
                   await EnochUser.findOne({ enochEmail: identifier });
            
            searchResults.enochSearched = true;
            
            if (user) {
              userType = this.databases.ENOCH;
              searchResults.enochFound = true;
              console.log(`✅ [DB-UTILS] Found Enoch user: ${user.name || user.email}`);
              break;
            }
          } catch (enochError) {
            console.warn(`⚠️ [DB-UTILS] Enoch database error:`, enochError.message);
            searchResults.enochSearched = true;
          }
        } else if (dbType === 'onairos' && !searchResults.onairosSearched) {
          try {
            // Try multiple search methods for Onairos
            user = await User.findById(identifier) ||
                   await User.findOne({ userName: identifier }) ||
                   await User.findOne({ email: identifier });
            
            searchResults.onairosSearched = true;
            
            if (user) {
              userType = this.databases.ONAIROS;
              searchResults.onairosFound = true;
              console.log(`✅ [DB-UTILS] Found Onairos user: ${user.userName || user.email}`);
              break;
            }
          } catch (onairosError) {
            console.warn(`⚠️ [DB-UTILS] Onairos database error:`, onairosError.message);
            searchResults.onairosSearched = true;
          }
        }
      }

      return {
        user,
        userType,
        isEnochUser: userType === this.databases.ENOCH,
        searchResults,
        foundIn: userType,
        searchedIn: Object.keys(searchResults).filter(key => searchResults[key] && key.endsWith('Searched')).map(key => key.replace('Searched', ''))
      };
    } catch (error) {
      console.error(`❌ [DB-UTILS] Error finding user:`, error);
      return {
        user: null,
        userType: null,
        isEnochUser: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's platform connections from appropriate database
   * @param {object} user - User object
   * @param {string} userType - User type (enoch or onairos)
   * @returns {object} - Platform connections
   */
  getUserConnections(user, userType) {
    if (!user) return {};

    try {
      if (userType === this.databases.ENOCH) {
        // Extract connections from Enoch user format
        const connections = {};
        
        // YouTube
        if (user.youtubeAccessToken) {
          connections.youtube = {
            connected: true,
            accessToken: user.youtubeAccessToken,
            refreshToken: user.youtubeRefreshToken,
            tokenExpiry: user.youtubeTokenExpiry,
            channelName: user.youtubeChannelName,
            channelId: user.youtubeChannelId,
            connectedAt: user.youtubeConnectedAt,
            lastValidated: user.youtubeLastValidated
          };
        }
        
        // LinkedIn
        if (user.linkedinAccessToken) {
          connections.linkedin = {
            connected: true,
            accessToken: user.linkedinAccessToken,
            refreshToken: user.linkedinRefreshToken,
            tokenExpiry: user.linkedinTokenExpiry,
            userName: user.linkedinUserName,
            connectedAt: user.linkedinConnectedAt,
            lastValidated: user.linkedinLastValidated
          };
        }
        
        // Add other platforms as needed
        
        return connections;
      } else {
        // Onairos user format
        const connections = {};
        
        if (user.accounts) {
          Object.keys(user.accounts).forEach(platform => {
            if (user.accounts[platform] && user.accounts[platform].accessToken) {
              connections[platform] = {
                connected: true,
                ...user.accounts[platform]
              };
            }
          });
        }
        
        return connections;
      }
    } catch (error) {
      console.error(`❌ [DB-UTILS] Error getting user connections:`, error);
      return {};
    }
  }

  /**
   * Update user's platform connection in appropriate database
   * @param {object} user - User object
   * @param {string} userType - User type
   * @param {string} platform - Platform name
   * @param {object} connectionData - Connection data to update
   * @returns {boolean} - Success status
   */
  async updateUserConnection(user, userType, platform, connectionData) {
    try {
      console.log(`🔄 [DB-UTILS] Updating ${platform} connection for user: ${user._id}`);
      
      if (userType === this.databases.ENOCH) {
        const { EnochUser } = getEnochModels();
        const updateData = {};
        
        // Map platform data to Enoch format
        switch (platform) {
          case 'youtube':
            if (connectionData.accessToken) updateData.youtubeAccessToken = connectionData.accessToken;
            if (connectionData.refreshToken) updateData.youtubeRefreshToken = connectionData.refreshToken;
            if (connectionData.tokenExpiry) updateData.youtubeTokenExpiry = connectionData.tokenExpiry;
            if (connectionData.channelName) updateData.youtubeChannelName = connectionData.channelName;
            if (connectionData.channelId) updateData.youtubeChannelId = connectionData.channelId;
            if (connectionData.connectedAt) updateData.youtubeConnectedAt = connectionData.connectedAt;
            updateData.youtubeLastValidated = new Date();
            break;
          case 'linkedin':
            if (connectionData.accessToken) updateData.linkedinAccessToken = connectionData.accessToken;
            if (connectionData.refreshToken) updateData.linkedinRefreshToken = connectionData.refreshToken;
            if (connectionData.tokenExpiry) updateData.linkedinTokenExpiry = connectionData.tokenExpiry;
            if (connectionData.userName) updateData.linkedinUserName = connectionData.userName;
            if (connectionData.connectedAt) updateData.linkedinConnectedAt = connectionData.connectedAt;
            updateData.linkedinLastValidated = new Date();
            break;
          default:
            console.warn(`⚠️ [DB-UTILS] Unsupported platform for Enoch: ${platform}`);
            return false;
        }
        
        updateData.updatedAt = new Date();
        
        const result = await EnochUser.updateOne(
          { _id: user._id },
          { $set: updateData }
        );
        
        console.log(`✅ [DB-UTILS] Updated ${platform} in Enoch database:`, result.modifiedCount > 0);
        return result.modifiedCount > 0;
      } else {
        // Onairos user format
        if (!user.accounts) user.accounts = {};
        if (!user.accounts[platform]) user.accounts[platform] = {};
        
        Object.assign(user.accounts[platform], connectionData);
        user.accounts[platform].lastValidated = new Date();
        
        // Update connections field if needed
        if (!user.connections) user.connections = {};
        if (!user.connections[platform.charAt(0).toUpperCase() + platform.slice(1)]) {
          user.connections[platform.charAt(0).toUpperCase() + platform.slice(1)] = '-';
        }
        
        await user.save();
        console.log(`✅ [DB-UTILS] Updated ${platform} in Onairos database`);
        return true;
      }
    } catch (error) {
      console.error(`❌ [DB-UTILS] Error updating user connection:`, error);
      return false;
    }
  }

  /**
   * Remove user's platform connection from appropriate database
   * @param {object} user - User object
   * @param {string} userType - User type
   * @param {string} platform - Platform name
   * @returns {boolean} - Success status
   */
  async removeUserConnection(user, userType, platform) {
    try {
      console.log(`🗑️ [DB-UTILS] Removing ${platform} connection for user: ${user._id}`);
      
      if (userType === this.databases.ENOCH) {
        const { EnochUser } = getEnochModels();
        const unsetData = {};
        
        // Map platform data to Enoch format
        switch (platform) {
          case 'youtube':
            unsetData.youtubeAccessToken = "";
            unsetData.youtubeRefreshToken = "";
            unsetData.youtubeTokenExpiry = "";
            unsetData.youtubeChannelName = "";
            unsetData.youtubeChannelId = "";
            unsetData.youtubeConnectedAt = "";
            unsetData.youtubeLastValidated = "";
            break;
          case 'linkedin':
            unsetData.linkedinAccessToken = "";
            unsetData.linkedinRefreshToken = "";
            unsetData.linkedinTokenExpiry = "";
            unsetData.linkedinUserName = "";
            unsetData.linkedinConnectedAt = "";
            unsetData.linkedinLastValidated = "";
            break;
          default:
            console.warn(`⚠️ [DB-UTILS] Unsupported platform for Enoch: ${platform}`);
            return false;
        }
        
        const result = await EnochUser.updateOne(
          { _id: user._id },
          { 
            $unset: unsetData,
            $set: { updatedAt: new Date() }
          }
        );
        
        console.log(`✅ [DB-UTILS] Removed ${platform} from Enoch database:`, result.modifiedCount > 0);
        return result.modifiedCount > 0;
      } else {
        // Onairos user format
        const result = await User.updateOne(
          { _id: user._id },
          { 
            $unset: { [`accounts.${platform}`]: "" },
            $set: { [`connections.${platform.charAt(0).toUpperCase() + platform.slice(1)}`]: "-" }
          }
        );
        
        console.log(`✅ [DB-UTILS] Removed ${platform} from Onairos database:`, result.modifiedCount > 0);
        return result.modifiedCount > 0;
      }
    } catch (error) {
      console.error(`❌ [DB-UTILS] Error removing user connection:`, error);
      return false;
    }
  }

  /**
   * Get users with specific platform connections
   * @param {string} platform - Platform name
   * @param {object} filters - Additional filters
   * @returns {array} - Array of users with platform connections
   */
  async getUsersWithPlatformConnections(platform, filters = {}) {
    try {
      console.log(`🔍 [DB-UTILS] Finding users with ${platform} connections`);
      
      const users = [];
      
      // Search Enoch database
      try {
        await connectEnochDB();
        const { EnochUser } = getEnochModels();
        
        let enochQuery = {};
        
        switch (platform) {
          case 'youtube':
            enochQuery.youtubeAccessToken = { $exists: true, $ne: null };
            if (filters.hasRefreshToken) {
              enochQuery.youtubeRefreshToken = { $exists: true, $ne: null };
            }
            if (filters.needsRefresh === false) {
              enochQuery.youtubeRefreshToken = { $exists: false };
            }
            break;
          case 'linkedin':
            enochQuery.linkedinAccessToken = { $exists: true, $ne: null };
            if (filters.hasRefreshToken) {
              enochQuery.linkedinRefreshToken = { $exists: true, $ne: null };
            }
            if (filters.needsRefresh === false) {
              enochQuery.linkedinRefreshToken = { $exists: false };
            }
            break;
        }
        
        const enochUsers = await EnochUser.find(enochQuery).select('name email');
        
        enochUsers.forEach(user => {
          users.push({
            _id: user._id,
            identifier: user.name || user.email,
            email: user.email,
            userType: this.databases.ENOCH,
            platform: platform
          });
        });
        
        console.log(`✅ [DB-UTILS] Found ${enochUsers.length} Enoch users with ${platform}`);
      } catch (enochError) {
        console.warn(`⚠️ [DB-UTILS] Enoch search error:`, enochError.message);
      }
      
      // Search Onairos database
      try {
        let onairosQuery = {};
        onairosQuery[`accounts.${platform}.accessToken`] = { $exists: true, $ne: null };
        
        if (filters.hasRefreshToken) {
          onairosQuery[`accounts.${platform}.refreshToken`] = { $exists: true, $ne: null };
        }
        if (filters.needsRefresh === false) {
          onairosQuery[`accounts.${platform}.refreshToken`] = { $exists: false };
        }
        
        const onairosUsers = await User.find(onairosQuery).select('userName email');
        
        onairosUsers.forEach(user => {
          users.push({
            _id: user._id,
            identifier: user.userName || user.email,
            email: user.email,
            userType: this.databases.ONAIROS,
            platform: platform
          });
        });
        
        console.log(`✅ [DB-UTILS] Found ${onairosUsers.length} Onairos users with ${platform}`);
      } catch (onairosError) {
        console.warn(`⚠️ [DB-UTILS] Onairos search error:`, onairosError.message);
      }
      
      console.log(`✅ [DB-UTILS] Total users found: ${users.length}`);
      return users;
    } catch (error) {
      console.error(`❌ [DB-UTILS] Error finding users with platform connections:`, error);
      return [];
    }
  }

  /**
   * Create user account synchronization between databases
   * @param {object} sourceUser - Source user object
   * @param {string} sourceType - Source database type
   * @param {string} targetType - Target database type
   * @returns {object} - Sync result
   */
  async syncUserBetweenDatabases(sourceUser, sourceType, targetType) {
    try {
      console.log(`🔄 [DB-UTILS] Syncing user between databases: ${sourceType} -> ${targetType}`);
      
      if (sourceType === targetType) {
        return {
          success: false,
          error: 'Source and target databases are the same'
        };
      }
      
      const userEmail = sourceUser.email || sourceUser.enochEmail;
      const userName = sourceUser.name || sourceUser.userName;
      
      if (!userEmail && !userName) {
        return {
          success: false,
          error: 'User must have email or username for synchronization'
        };
      }
      
      let targetUser = null;
      let created = false;
      
      if (targetType === this.databases.ENOCH) {
        // Sync to Enoch database
        const { EnochUser } = getEnochModels();
        
        targetUser = await EnochUser.findOne({
          $or: [
            { email: userEmail },
            { name: userName },
            { enochEmail: userEmail }
          ]
        });
        
        if (!targetUser) {
          targetUser = new EnochUser({
            _id: sourceUser._id,
            email: userEmail,
            name: userName,
            enochEmail: userEmail,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await targetUser.save();
          created = true;
        }
      } else {
        // Sync to Onairos database
        targetUser = await User.findOne({
          $or: [
            { email: userEmail },
            { userName: userName },
            { _id: sourceUser._id }
          ]
        });
        
        if (!targetUser) {
          targetUser = new User({
            _id: sourceUser._id,
            email: userEmail,
            userName: userName || userEmail,
            accounts: {},
            connections: {},
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await targetUser.save();
          created = true;
        }
      }
      
      return {
        success: true,
        created: created,
        targetUser: targetUser,
        message: created ? 'User created in target database' : 'User already exists in target database'
      };
    } catch (error) {
      console.error(`❌ [DB-UTILS] Error syncing user between databases:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get database statistics
   * @returns {object} - Database statistics
   */
  async getDatabaseStats() {
    try {
      const stats = {
        enoch: {
          available: false,
          totalUsers: 0,
          usersWithConnections: 0,
          platformBreakdown: {}
        },
        onairos: {
          available: false,
          totalUsers: 0,
          usersWithConnections: 0,
          platformBreakdown: {}
        }
      };
      
      // Enoch database stats
      try {
        await connectEnochDB();
        const { EnochUser } = getEnochModels();
        
        stats.enoch.available = true;
        stats.enoch.totalUsers = await EnochUser.countDocuments();
        
        // Count users with YouTube connections
        const youtubeCount = await EnochUser.countDocuments({
          youtubeAccessToken: { $exists: true, $ne: null }
        });
        stats.enoch.platformBreakdown.youtube = youtubeCount;
        
        // Count users with LinkedIn connections
        const linkedinCount = await EnochUser.countDocuments({
          linkedinAccessToken: { $exists: true, $ne: null }
        });
        stats.enoch.platformBreakdown.linkedin = linkedinCount;
        
        stats.enoch.usersWithConnections = await EnochUser.countDocuments({
          $or: [
            { youtubeAccessToken: { $exists: true, $ne: null } },
            { linkedinAccessToken: { $exists: true, $ne: null } }
          ]
        });
      } catch (enochError) {
        console.warn(`⚠️ [DB-UTILS] Enoch stats error:`, enochError.message);
      }
      
      // Onairos database stats
      try {
        stats.onairos.available = true;
        stats.onairos.totalUsers = await User.countDocuments();
        
        // Count users with platform connections
        const platformCounts = await User.aggregate([
          { $match: { accounts: { $exists: true } } },
          { $project: { 
            accountKeys: { $objectToArray: "$accounts" }
          }},
          { $unwind: "$accountKeys" },
          { $group: { 
            _id: "$accountKeys.k",
            count: { $sum: 1 }
          }}
        ]);
        
        platformCounts.forEach(platform => {
          stats.onairos.platformBreakdown[platform._id] = platform.count;
        });
        
        stats.onairos.usersWithConnections = await User.countDocuments({
          accounts: { $exists: true, $ne: {} }
        });
      } catch (onairosError) {
        console.warn(`⚠️ [DB-UTILS] Onairos stats error:`, onairosError.message);
      }
      
      return {
        success: true,
        stats: stats,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [DB-UTILS] Error getting database stats:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const databaseUtils = new DatabaseUtils();
export default databaseUtils; 
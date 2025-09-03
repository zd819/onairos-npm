import { tokenManager } from './tokenManager.js';
import { User } from '../../Mongoose/models.js';
import { getEnochModels } from '../../utils/enochDb.js';

export class ConnectionHealthMonitor {
  constructor() {
    this.supportedPlatforms = ['youtube', 'linkedin', 'reddit', 'pinterest', 'apple'];
    this.healthStatuses = {
      HEALTHY: 'healthy',
      EXPIRED_REFRESHABLE: 'expired_refreshable',
      EXPIRED_NO_REFRESH: 'expired_no_refresh',
      INVALID_TOKEN: 'invalid_token',
      NOT_CONNECTED: 'not_connected',
      ERROR: 'error'
    };
  }

  /**
   * Check health of a single platform connection
   * @param {string} identifier - User identifier
   * @param {string} platform - Platform name
   * @returns {object} - Health status
   */
  async checkPlatformHealth(identifier, platform) {
    try {
      console.log(`🔍 [HEALTH-CHECK] Checking ${platform} connection for: ${identifier}`);
      
      const tokenStatus = await tokenManager.getTokenStatus(identifier, platform);
      
      if (!tokenStatus.success) {
        return {
          platform: platform,
          status: tokenStatus.status || this.healthStatuses.ERROR,
          healthy: false,
          error: tokenStatus.error,
          recommendations: this.getRecommendations(tokenStatus.status, platform)
        };
      }
      
      const isHealthy = tokenStatus.status === this.healthStatuses.HEALTHY;
      
      return {
        platform: platform,
        status: tokenStatus.status,
        healthy: isHealthy,
        userType: tokenStatus.userType,
        tokenDetails: tokenStatus.tokenDetails,
        platformData: tokenStatus.platformData,
        needsRefresh: tokenStatus.needsRefresh,
        canRefresh: tokenStatus.canRefresh,
        recommendations: this.getRecommendations(tokenStatus.status, platform),
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [HEALTH-CHECK] Error checking ${platform} health:`, error);
      return {
        platform: platform,
        status: this.healthStatuses.ERROR,
        healthy: false,
        error: error.message,
        recommendations: [`Contact support for ${platform} connection issues`]
      };
    }
  }

  /**
   * Check health of all platform connections for a user
   * @param {string} identifier - User identifier
   * @returns {object} - Complete health report
   */
  async checkAllPlatformsHealth(identifier) {
    try {
      console.log(`🔍 [HEALTH-CHECK] Checking all platform connections for: ${identifier}`);
      
      const { user, userType } = await tokenManager.getUser(identifier);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          identifier: identifier,
          checkedAt: new Date().toISOString()
        };
      }
      
      const healthResults = {};
      const healthPromises = this.supportedPlatforms.map(async (platform) => {
        const health = await this.checkPlatformHealth(identifier, platform);
        healthResults[platform] = health;
      });
      
      await Promise.all(healthPromises);
      
      // Calculate overall health score
      const connectedPlatforms = Object.values(healthResults).filter(h => h.status !== this.healthStatuses.NOT_CONNECTED);
      const healthyPlatforms = connectedPlatforms.filter(h => h.healthy);
      const overallScore = connectedPlatforms.length > 0 ? (healthyPlatforms.length / connectedPlatforms.length) * 100 : 0;
      
      // Generate summary
      const summary = {
        totalPlatforms: this.supportedPlatforms.length,
        connectedPlatforms: connectedPlatforms.length,
        healthyPlatforms: healthyPlatforms.length,
        needingAttention: connectedPlatforms.length - healthyPlatforms.length,
        overallScore: Math.round(overallScore),
        overallStatus: this.getOverallStatus(overallScore)
      };
      
      // Generate action items
      const actionItems = this.generateActionItems(healthResults);
      
      return {
        success: true,
        identifier: identifier,
        userType: userType,
        summary: summary,
        platforms: healthResults,
        actionItems: actionItems,
        checkedAt: new Date().toISOString(),
        nextCheckRecommended: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };
    } catch (error) {
      console.error(`❌ [HEALTH-CHECK] Error checking all platforms:`, error);
      return {
        success: false,
        error: error.message,
        identifier: identifier,
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Attempt to repair unhealthy connections
   * @param {string} identifier - User identifier
   * @param {string} platform - Platform name (optional, repairs all if not specified)
   * @returns {object} - Repair results
   */
  async repairConnections(identifier, platform = null) {
    try {
      console.log(`🔧 [REPAIR] Starting connection repair for: ${identifier}`);
      
      const platformsToRepair = platform ? [platform] : this.supportedPlatforms;
      const repairResults = {};
      
      for (const platformName of platformsToRepair) {
        try {
          const health = await this.checkPlatformHealth(identifier, platformName);
          
          if (health.status === this.healthStatuses.NOT_CONNECTED) {
            repairResults[platformName] = {
              attempted: false,
              success: false,
              reason: 'Platform not connected',
              action: 'manual_connection_required'
            };
            continue;
          }
          
          if (health.status === this.healthStatuses.EXPIRED_NO_REFRESH) {
            repairResults[platformName] = {
              attempted: false,
              success: false,
              reason: 'No refresh token available',
              action: 'manual_reconnection_required'
            };
            continue;
          }
          
          if (health.needsRefresh && health.canRefresh) {
            console.log(`🔄 [REPAIR] Attempting to refresh ${platformName} token...`);
            const refreshResult = await tokenManager.refreshTokenIfNeeded(identifier, platformName);
            
            repairResults[platformName] = {
              attempted: true,
              success: refreshResult.success,
              reason: refreshResult.error || 'Token refreshed successfully',
              action: refreshResult.success ? 'token_refreshed' : 'manual_intervention_required',
              details: refreshResult
            };
          } else if (health.healthy) {
            repairResults[platformName] = {
              attempted: false,
              success: true,
              reason: 'Connection is already healthy',
              action: 'no_action_needed'
            };
          } else {
            repairResults[platformName] = {
              attempted: false,
              success: false,
              reason: 'Cannot auto-repair this connection type',
              action: 'manual_intervention_required'
            };
          }
        } catch (platformError) {
          console.error(`❌ [REPAIR] Error repairing ${platformName}:`, platformError);
          repairResults[platformName] = {
            attempted: true,
            success: false,
            reason: platformError.message,
            action: 'error_occurred'
          };
        }
      }
      
      // Calculate repair summary
      const attempted = Object.values(repairResults).filter(r => r.attempted).length;
      const successful = Object.values(repairResults).filter(r => r.success).length;
      const manualRequired = Object.values(repairResults).filter(r => r.action.includes('manual')).length;
      
      return {
        success: true,
        identifier: identifier,
        platform: platform || 'all',
        summary: {
          attempted: attempted,
          successful: successful,
          manualRequired: manualRequired,
          successRate: attempted > 0 ? Math.round((successful / attempted) * 100) : 0
        },
        results: repairResults,
        repairedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [REPAIR] Error during connection repair:`, error);
      return {
        success: false,
        error: error.message,
        identifier: identifier,
        platform: platform || 'all'
      };
    }
  }

  /**
   * Get connection insights and analytics
   * @param {string} identifier - User identifier
   * @returns {object} - Connection insights
   */
  async getConnectionInsights(identifier) {
    try {
      const healthReport = await this.checkAllPlatformsHealth(identifier);
      
      if (!healthReport.success) {
        return healthReport;
      }
      
      const insights = {
        connectionStrength: this.assessConnectionStrength(healthReport.platforms),
        riskAssessment: this.assessRisks(healthReport.platforms),
        optimizationSuggestions: this.generateOptimizationSuggestions(healthReport.platforms),
        trainingReadiness: this.assessTrainingReadiness(healthReport.platforms),
        maintenanceSchedule: this.generateMaintenanceSchedule(healthReport.platforms)
      };
      
      return {
        success: true,
        identifier: identifier,
        healthReport: healthReport,
        insights: insights,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [INSIGHTS] Error generating insights:`, error);
      return {
        success: false,
        error: error.message,
        identifier: identifier
      };
    }
  }

  /**
   * Monitor connection health changes over time
   * @param {string} identifier - User identifier
   * @param {object} previousHealth - Previous health report
   * @returns {object} - Health comparison
   */
  async compareHealthReports(identifier, previousHealth) {
    try {
      const currentHealth = await this.checkAllPlatformsHealth(identifier);
      
      if (!currentHealth.success) {
        return currentHealth;
      }
      
      const changes = {};
      const improvements = [];
      const degradations = [];
      
      for (const platform of this.supportedPlatforms) {
        const prev = previousHealth.platforms?.[platform];
        const curr = currentHealth.platforms[platform];
        
        if (prev && curr) {
          const statusChanged = prev.status !== curr.status;
          const healthChanged = prev.healthy !== curr.healthy;
          
          if (statusChanged || healthChanged) {
            changes[platform] = {
              previous: {
                status: prev.status,
                healthy: prev.healthy
              },
              current: {
                status: curr.status,
                healthy: curr.healthy
              },
              change: curr.healthy > prev.healthy ? 'improved' : 'degraded'
            };
            
            if (curr.healthy && !prev.healthy) {
              improvements.push(platform);
            } else if (!curr.healthy && prev.healthy) {
              degradations.push(platform);
            }
          }
        }
      }
      
      return {
        success: true,
        identifier: identifier,
        comparisonPeriod: {
          from: previousHealth.checkedAt,
          to: currentHealth.checkedAt
        },
        changes: changes,
        summary: {
          totalChanges: Object.keys(changes).length,
          improvements: improvements.length,
          degradations: degradations.length,
          overallTrend: improvements.length > degradations.length ? 'improving' : 
                       degradations.length > improvements.length ? 'degrading' : 'stable'
        },
        currentHealth: currentHealth,
        comparedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [COMPARISON] Error comparing health reports:`, error);
      return {
        success: false,
        error: error.message,
        identifier: identifier
      };
    }
  }

  // Helper methods
  
  getRecommendations(status, platform) {
    const recommendations = {
      [this.healthStatuses.HEALTHY]: [
        'Connection is working properly',
        'No action required'
      ],
      [this.healthStatuses.EXPIRED_REFRESHABLE]: [
        'Token will be automatically refreshed',
        'Monitor for successful refresh'
      ],
      [this.healthStatuses.EXPIRED_NO_REFRESH]: [
        `User needs to reconnect ${platform} account`,
        'Use proper OAuth flow with offline access',
        'Ensure refresh token is properly configured'
      ],
      [this.healthStatuses.INVALID_TOKEN]: [
        `Token may have been revoked by user`,
        `User needs to reconnect ${platform} account`,
        'Check API permissions and scopes'
      ],
      [this.healthStatuses.NOT_CONNECTED]: [
        `User needs to connect ${platform} account`,
        'Guide user through connection process'
      ],
      [this.healthStatuses.ERROR]: [
        `Check ${platform} API configuration`,
        'Review error logs for specific issues',
        'Contact support if problem persists'
      ]
    };
    
    return recommendations[status] || ['Manual intervention required'];
  }
  
  getOverallStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 30) return 'poor';
    return 'critical';
  }
  
  generateActionItems(healthResults) {
    const actionItems = [];
    
    for (const [platform, health] of Object.entries(healthResults)) {
      if (!health.healthy && health.status !== this.healthStatuses.NOT_CONNECTED) {
        actionItems.push({
          platform: platform,
          priority: health.status === this.healthStatuses.EXPIRED_NO_REFRESH ? 'high' : 'medium',
          action: health.canRefresh ? 'refresh_token' : 'reconnect_account',
          description: health.recommendations[0] || 'Manual intervention required',
          automated: health.canRefresh
        });
      }
    }
    
    return actionItems.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  assessConnectionStrength(platforms) {
    const connected = Object.values(platforms).filter(p => p.status !== this.healthStatuses.NOT_CONNECTED);
    const healthy = connected.filter(p => p.healthy);
    const withRefresh = connected.filter(p => p.canRefresh);
    
    return {
      totalConnected: connected.length,
      healthyConnections: healthy.length,
      connectionsWithRefresh: withRefresh.length,
      strengthScore: connected.length > 0 ? Math.round((healthy.length / connected.length) * 100) : 0,
      refreshCapability: connected.length > 0 ? Math.round((withRefresh.length / connected.length) * 100) : 0
    };
  }
  
  assessRisks(platforms) {
    const risks = [];
    
    for (const [platform, health] of Object.entries(platforms)) {
      if (health.status === this.healthStatuses.EXPIRED_NO_REFRESH) {
        risks.push({
          platform: platform,
          risk: 'high',
          issue: 'No refresh token available',
          impact: 'Connection will fail and require manual reconnection'
        });
      } else if (health.status === this.healthStatuses.INVALID_TOKEN) {
        risks.push({
          platform: platform,
          risk: 'medium',
          issue: 'Token validation failed',
          impact: 'Data collection may be interrupted'
        });
      }
    }
    
    return risks;
  }
  
  generateOptimizationSuggestions(platforms) {
    const suggestions = [];
    
    const connectedCount = Object.values(platforms).filter(p => p.status !== this.healthStatuses.NOT_CONNECTED).length;
    const refreshCount = Object.values(platforms).filter(p => p.canRefresh).length;
    
    if (connectedCount < 3) {
      suggestions.push({
        type: 'connection_diversity',
        priority: 'medium',
        suggestion: 'Connect more social media platforms for better AI training',
        platforms: Object.keys(platforms).filter(p => platforms[p].status === this.healthStatuses.NOT_CONNECTED)
      });
    }
    
    if (refreshCount < connectedCount * 0.8) {
      suggestions.push({
        type: 'refresh_token_setup',
        priority: 'high',
        suggestion: 'Improve OAuth configuration to include refresh tokens',
        platforms: Object.keys(platforms).filter(p => platforms[p].status !== this.healthStatuses.NOT_CONNECTED && !platforms[p].canRefresh)
      });
    }
    
    return suggestions;
  }
  
  assessTrainingReadiness(platforms) {
    const connected = Object.values(platforms).filter(p => p.status !== this.healthStatuses.NOT_CONNECTED);
    const healthy = connected.filter(p => p.healthy);
    
    return {
      ready: healthy.length >= 1,
      connectedPlatforms: connected.length,
      healthyPlatforms: healthy.length,
      readinessScore: connected.length > 0 ? Math.round((healthy.length / connected.length) * 100) : 0,
      recommendations: healthy.length === 0 ? [
        'At least one healthy platform connection is required for training',
        'Fix existing connections or add new ones'
      ] : [
        'Training can proceed with current connections',
        'More platforms will improve training quality'
      ]
    };
  }
  
  generateMaintenanceSchedule(platforms) {
    const schedule = [];
    
    for (const [platform, health] of Object.entries(platforms)) {
      if (health.tokenDetails?.tokenExpiry) {
        const expiry = new Date(health.tokenDetails.tokenExpiry);
        const now = new Date();
        const timeUntilExpiry = expiry.getTime() - now.getTime();
        
        if (timeUntilExpiry > 0 && timeUntilExpiry < 7 * 24 * 60 * 60 * 1000) { // Within 7 days
          schedule.push({
            platform: platform,
            action: health.canRefresh ? 'auto_refresh' : 'manual_reconnect',
            scheduledFor: new Date(expiry.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day before expiry
            priority: health.canRefresh ? 'low' : 'high'
          });
        }
      }
    }
    
    return schedule.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  }
}

// Export singleton instance
export const connectionHealthMonitor = new ConnectionHealthMonitor();
export default connectionHealthMonitor; 
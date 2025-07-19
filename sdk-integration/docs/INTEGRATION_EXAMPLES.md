# Onairos SDK Integration Examples

## Overview

This document provides practical integration examples for the Onairos SDK across different frameworks, platforms, and use cases. All examples follow best practices for security, performance, and user experience.

## Table of Contents

1. [Frontend Integrations](#frontend-integrations)
2. [Backend Integrations](#backend-integrations)
3. [Mobile Integrations](#mobile-integrations)
4. [Full-Stack Examples](#full-stack-examples)
5. [Testing Examples](#testing-examples)
6. [Production Deployment](#production-deployment)

## Frontend Integrations

### React Integration

#### Complete React Component with Context

```javascript
// contexts/OnairosContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const OnairosContext = createContext();

export const useOnairos = () => {
  const context = useContext(OnairosContext);
  if (!context) {
    throw new Error('useOnairos must be used within an OnairosProvider');
  }
  return context;
};

export const OnairosProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const apiKey = process.env.REACT_APP_ONAIROS_API_KEY;
  const baseUrl = process.env.REACT_APP_ONAIROS_BASE_URL;

  // Initialize SDK
  const sdk = {
    request: async (endpoint, options = {}) => {
      const url = `${baseUrl}${endpoint}`;
      const headers = {
        'x-api-key': apiKey,
        'authorization': `Bearer ${authToken}`,
        'content-type': 'application/json',
        ...options.headers
      };

      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
      }

      return response.json();
    }
  };

  // YouTube authentication
  const connectYoutube = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Initialize Google Auth
      await new Promise((resolve) => {
        window.gapi.load('auth2', resolve);
      });
      
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        window.gapi.auth2.init({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/youtube.readonly openid profile email',
          access_type: 'offline',
          prompt: 'consent'
        });
      }
      
      const user = await authInstance.signIn();
      const authResponse = user.getAuthResponse();
      
      // Send to Onairos
      const result = await sdk.request('/youtube/native-auth', {
        method: 'POST',
        body: JSON.stringify({
          accessToken: authResponse.access_token,
          refreshToken: authResponse.server_auth_code,
          idToken: authResponse.id_token,
          userAccountInfo: {
            username: localStorage.getItem('username'),
            email: user.getBasicProfile().getEmail(),
            channelName: user.getBasicProfile().getName()
          }
        })
      });
      
      if (result.success) {
        setConnections(prev => ({
          ...prev,
          youtube: result.connectionData
        }));
        
        // Show success message
        alert('YouTube connected successfully!');
      }
    } catch (error) {
      setError(error.message);
      console.error('YouTube connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  // LinkedIn authentication
  const connectLinkedIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // LinkedIn OAuth flow would go here
      // This is a simplified example
      
      const linkedinAuth = await performLinkedInAuth();
      
      const result = await sdk.request('/linkedin/native-auth', {
        method: 'POST',
        body: JSON.stringify({
          accessToken: linkedinAuth.accessToken,
          refreshToken: linkedinAuth.refreshToken,
          userAccountInfo: {
            username: localStorage.getItem('username'),
            email: linkedinAuth.email,
            firstName: linkedinAuth.firstName,
            lastName: linkedinAuth.lastName
          }
        })
      });
      
      if (result.success) {
        setConnections(prev => ({
          ...prev,
          linkedin: result.connectionData
        }));
        
        alert('LinkedIn connected successfully!');
      }
    } catch (error) {
      setError(error.message);
      console.error('LinkedIn connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check connection health
  const checkHealth = async () => {
    try {
      const result = await sdk.request(`/validation/health-check/${localStorage.getItem('username')}`);
      return result;
    } catch (error) {
      console.error('Health check error:', error);
      return null;
    }
  };

  // Repair connections
  const repairConnections = async (platforms = null) => {
    setLoading(true);
    try {
      const result = await sdk.request(`/validation/repair-connections/${localStorage.getItem('username')}`, {
        method: 'POST',
        body: JSON.stringify({
          platforms: platforms
        })
      });
      
      if (result.success) {
        // Update connection statuses
        result.successfulRepairs.forEach(platform => {
          setConnections(prev => ({
            ...prev,
            [platform]: {
              ...prev[platform],
              status: 'healthy'
            }
          }));
        });
      }
      
      return result;
    } catch (error) {
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto-check health on mount
  useEffect(() => {
    if (authToken) {
      checkHealth().then(result => {
        if (result) {
          setConnections(result.platforms);
        }
      });
    }
  }, [authToken]);

  const value = {
    authToken,
    setAuthToken,
    connections,
    loading,
    error,
    connectYoutube,
    connectLinkedIn,
    checkHealth,
    repairConnections
  };

  return (
    <OnairosContext.Provider value={value}>
      {children}
    </OnairosContext.Provider>
  );
};
```

```javascript
// components/ConnectionManager.js
import React, { useState, useEffect } from 'react';
import { useOnairos } from '../contexts/OnairosContext';

const ConnectionManager = () => {
  const { 
    connections, 
    loading, 
    error, 
    connectYoutube, 
    connectLinkedIn, 
    checkHealth, 
    repairConnections 
  } = useOnairos();
  
  const [healthData, setHealthData] = useState(null);
  const [showDetails, setShowDetails] = useState({});

  useEffect(() => {
    // Check health every 5 minutes
    const interval = setInterval(async () => {
      const health = await checkHealth();
      setHealthData(health);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const getConnectionStatus = (platform) => {
    const connection = connections[platform];
    if (!connection) return 'not_connected';
    return connection.status || 'unknown';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'expired_refreshable': return 'yellow';
      case 'expired_no_refresh': return 'red';
      case 'not_connected': return 'gray';
      default: return 'gray';
    }
  };

  const handleRepair = async (platform) => {
    const result = await repairConnections([platform]);
    if (result) {
      alert(`Repair completed: ${result.successfulRepairs.length} platforms fixed`);
    }
  };

  return (
    <div className="connection-manager">
      <h2>Platform Connections</h2>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {loading && (
        <div className="loading">
          Loading...
        </div>
      )}

      <div className="platforms">
        {/* YouTube */}
        <div className="platform-card">
          <div className="platform-header">
            <h3>YouTube</h3>
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor(getConnectionStatus('youtube')) }}
            />
          </div>
          
          <div className="platform-details">
            {connections.youtube ? (
              <div>
                <p>Channel: {connections.youtube.channelName}</p>
                <p>Connected: {new Date(connections.youtube.connectedAt).toLocaleDateString()}</p>
                <p>Status: {getConnectionStatus('youtube')}</p>
                
                {getConnectionStatus('youtube') === 'expired_refreshable' && (
                  <button onClick={() => handleRepair('youtube')}>
                    Refresh Token
                  </button>
                )}
                
                <button onClick={() => setShowDetails(prev => ({ ...prev, youtube: !prev.youtube }))}>
                  {showDetails.youtube ? 'Hide' : 'Show'} Details
                </button>
                
                {showDetails.youtube && (
                  <div className="connection-details">
                    <p>Has Refresh Token: {connections.youtube.hasRefreshToken ? 'Yes' : 'No'}</p>
                    <p>Token Expiry: {new Date(connections.youtube.tokenExpiry).toLocaleString()}</p>
                    <p>Last Validated: {connections.youtube.lastValidated ? new Date(connections.youtube.lastValidated).toLocaleString() : 'Never'}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p>Not connected</p>
                <button onClick={connectYoutube} disabled={loading}>
                  Connect YouTube
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LinkedIn */}
        <div className="platform-card">
          <div className="platform-header">
            <h3>LinkedIn</h3>
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor(getConnectionStatus('linkedin')) }}
            />
          </div>
          
          <div className="platform-details">
            {connections.linkedin ? (
              <div>
                <p>Name: {connections.linkedin.userName}</p>
                <p>Connected: {new Date(connections.linkedin.connectedAt).toLocaleDateString()}</p>
                <p>Status: {getConnectionStatus('linkedin')}</p>
                
                {getConnectionStatus('linkedin') === 'expired_refreshable' && (
                  <button onClick={() => handleRepair('linkedin')}>
                    Refresh Token
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p>Not connected</p>
                <button onClick={connectLinkedIn} disabled={loading}>
                  Connect LinkedIn
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Health Summary */}
      {healthData && (
        <div className="health-summary">
          <h3>Connection Health</h3>
          <div className="health-metrics">
            <div className="metric">
              <span>Overall Score:</span>
              <span>{healthData.summary.overallScore}%</span>
            </div>
            <div className="metric">
              <span>Connected Platforms:</span>
              <span>{healthData.summary.connectedPlatforms}</span>
            </div>
            <div className="metric">
              <span>Healthy Platforms:</span>
              <span>{healthData.summary.healthyPlatforms}</span>
            </div>
          </div>
          
          {healthData.recommendations.length > 0 && (
            <div className="recommendations">
              <h4>Recommendations:</h4>
              <ul>
                {healthData.recommendations.map((rec, index) => (
                  <li key={index} className={`recommendation ${rec.severity}`}>
                    {rec.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionManager;
```

```css
/* styles/ConnectionManager.css */
.connection-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  color: #c33;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.platforms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.platform-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.platform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.platform-header h3 {
  margin: 0;
  color: #333;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #ddd;
}

.platform-details {
  color: #666;
}

.platform-details p {
  margin: 5px 0;
}

.platform-details button {
  margin: 10px 5px 0 0;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.platform-details button:hover {
  background: #f5f5f5;
}

.platform-details button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.connection-details {
  margin-top: 10px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
  font-size: 0.9em;
}

.health-summary {
  margin-top: 30px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.health-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin: 15px 0;
}

.metric {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.recommendations {
  margin-top: 15px;
}

.recommendations ul {
  list-style: none;
  padding: 0;
}

.recommendation {
  padding: 8px 12px;
  margin: 5px 0;
  border-radius: 4px;
  border-left: 4px solid;
}

.recommendation.info {
  background: #e7f3ff;
  border-left-color: #0066cc;
}

.recommendation.warning {
  background: #fff3cd;
  border-left-color: #ff9900;
}

.recommendation.error {
  background: #f8d7da;
  border-left-color: #dc3545;
}
```

### Vue.js Integration

```javascript
// plugins/onairos.js
import { ref, reactive, computed } from 'vue';

export default {
  install(app, options) {
    const state = reactive({
      authToken: localStorage.getItem('authToken'),
      connections: {},
      loading: false,
      error: null
    });

    const sdk = {
      async request(endpoint, options = {}) {
        const url = `${process.env.VUE_APP_ONAIROS_BASE_URL}${endpoint}`;
        const headers = {
          'x-api-key': process.env.VUE_APP_ONAIROS_API_KEY,
          'authorization': `Bearer ${state.authToken}`,
          'content-type': 'application/json',
          ...options.headers
        };

        const response = await fetch(url, {
          ...options,
          headers
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Request failed');
        }

        return response.json();
      },

      async connectYoutube() {
        state.loading = true;
        state.error = null;
        
        try {
          // YouTube OAuth implementation
          const result = await this.request('/youtube/native-auth', {
            method: 'POST',
            body: JSON.stringify({
              accessToken: 'youtube_token',
              userAccountInfo: {
                username: 'user123'
              }
            })
          });
          
          if (result.success) {
            state.connections.youtube = result.connectionData;
          }
        } catch (error) {
          state.error = error.message;
        } finally {
          state.loading = false;
        }
      },

      async checkHealth() {
        try {
          const result = await this.request(`/validation/health-check/user123`);
          return result;
        } catch (error) {
          console.error('Health check error:', error);
          return null;
        }
      }
    };

    app.config.globalProperties.$onairos = sdk;
    app.provide('onairos', sdk);
    app.provide('onairosState', state);
  }
};
```

```vue
<!-- components/PlatformConnections.vue -->
<template>
  <div class="platform-connections">
    <h2>Platform Connections</h2>
    
    <div v-if="state.error" class="error">
      {{ state.error }}
    </div>
    
    <div class="platforms">
      <div class="platform-card" v-for="platform in platforms" :key="platform.name">
        <div class="platform-header">
          <h3>{{ platform.name }}</h3>
          <div 
            class="status-indicator"
            :class="getStatusClass(platform.key)"
          />
        </div>
        
        <div class="platform-content">
          <div v-if="isConnected(platform.key)">
            <p>Status: {{ getConnectionStatus(platform.key) }}</p>
            <p>Connected: {{ formatDate(getConnection(platform.key).connectedAt) }}</p>
            
            <button 
              v-if="needsRefresh(platform.key)"
              @click="refreshConnection(platform.key)"
              :disabled="state.loading"
            >
              Refresh Token
            </button>
          </div>
          
          <div v-else>
            <p>Not connected</p>
            <button 
              @click="connectPlatform(platform.key)"
              :disabled="state.loading"
            >
              Connect {{ platform.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="healthData" class="health-summary">
      <h3>Health Summary</h3>
      <div class="health-metrics">
        <div class="metric">
          <span>Overall Score:</span>
          <span>{{ healthData.summary.overallScore }}%</span>
        </div>
        <div class="metric">
          <span>Connected:</span>
          <span>{{ healthData.summary.connectedPlatforms }}</span>
        </div>
        <div class="metric">
          <span>Healthy:</span>
          <span>{{ healthData.summary.healthyPlatforms }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, ref, onMounted, computed } from 'vue';

export default {
  name: 'PlatformConnections',
  setup() {
    const onairos = inject('onairos');
    const state = inject('onairosState');
    const healthData = ref(null);
    
    const platforms = [
      { name: 'YouTube', key: 'youtube' },
      { name: 'LinkedIn', key: 'linkedin' },
      { name: 'Reddit', key: 'reddit' }
    ];

    const isConnected = (platform) => {
      return state.connections[platform]?.connected || false;
    };

    const getConnection = (platform) => {
      return state.connections[platform] || {};
    };

    const getConnectionStatus = (platform) => {
      return state.connections[platform]?.status || 'unknown';
    };

    const getStatusClass = (platform) => {
      const status = getConnectionStatus(platform);
      return `status-${status.replace('_', '-')}`;
    };

    const needsRefresh = (platform) => {
      return getConnectionStatus(platform) === 'expired_refreshable';
    };

    const formatDate = (dateString) => {
      return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
    };

    const connectPlatform = async (platform) => {
      switch (platform) {
        case 'youtube':
          await onairos.connectYoutube();
          break;
        case 'linkedin':
          await onairos.connectLinkedIn();
          break;
        default:
          console.warn(`Connection for ${platform} not implemented`);
      }
    };

    const refreshConnection = async (platform) => {
      try {
        const result = await onairos.request(`/validation/repair-connections/user123`, {
          method: 'POST',
          body: JSON.stringify({ platforms: [platform] })
        });
        
        if (result.success) {
          // Update connection status
          await loadHealthData();
        }
      } catch (error) {
        state.error = error.message;
      }
    };

    const loadHealthData = async () => {
      const result = await onairos.checkHealth();
      if (result) {
        healthData.value = result;
        state.connections = result.platforms;
      }
    };

    onMounted(() => {
      loadHealthData();
      
      // Auto-refresh health data every 5 minutes
      setInterval(loadHealthData, 5 * 60 * 1000);
    });

    return {
      state,
      platforms,
      healthData,
      isConnected,
      getConnection,
      getConnectionStatus,
      getStatusClass,
      needsRefresh,
      formatDate,
      connectPlatform,
      refreshConnection
    };
  }
};
</script>

<style scoped>
.platform-connections {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.error {
  background-color: #fee;
  border: 1px solid #fcc;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  color: #c33;
}

.platforms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.platform-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.platform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.platform-header h3 {
  margin: 0;
  color: #333;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #ddd;
}

.status-healthy { background-color: #4caf50; }
.status-expired-refreshable { background-color: #ff9800; }
.status-expired-no-refresh { background-color: #f44336; }
.status-not-connected { background-color: #9e9e9e; }

.platform-content {
  color: #666;
}

.platform-content p {
  margin: 5px 0;
}

.platform-content button {
  margin: 10px 5px 0 0;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.platform-content button:hover {
  background: #f5f5f5;
}

.platform-content button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.health-summary {
  margin-top: 30px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.health-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin: 15px 0;
}

.metric {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>
```

## Backend Integrations

### Node.js/Express Complete Implementation

```javascript
// server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { OnairosSDK } from './lib/onairos-sdk.js';
import { authenticateUser } from './middleware/auth.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Onairos SDK
const onairos = new OnairosSDK({
  apiKey: process.env.ONAIROS_API_KEY,
  baseUrl: process.env.ONAIROS_BASE_URL,
  jwtSecret: process.env.ONAIROS_JWT_SECRET
});

// Routes
app.use('/api/auth', authenticateUser);

// YouTube routes
app.post('/api/youtube/connect', authenticateUser, async (req, res, next) => {
  try {
    const { accessToken, refreshToken, userAccountInfo } = req.body;
    
    // Validate required fields
    if (!accessToken || !userAccountInfo?.username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accessToken and userAccountInfo.username'
      });
    }
    
    const result = await onairos.youtube.authenticate({
      accessToken,
      refreshToken,
      userAccountInfo: {
        ...userAccountInfo,
        username: req.user.username // Use authenticated user's username
      }
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get('/api/youtube/status', authenticateUser, async (req, res, next) => {
  try {
    const result = await onairos.youtube.getConnectionStatus(req.user.username);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/youtube/refresh', authenticateUser, async (req, res, next) => {
  try {
    const result = await onairos.youtube.refreshToken(req.user.username);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// LinkedIn routes
app.post('/api/linkedin/connect', authenticateUser, async (req, res, next) => {
  try {
    const { accessToken, refreshToken, userAccountInfo } = req.body;
    
    if (!accessToken || !userAccountInfo?.username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accessToken and userAccountInfo.username'
      });
    }
    
    const result = await onairos.linkedin.authenticate({
      accessToken,
      refreshToken,
      userAccountInfo: {
        ...userAccountInfo,
        username: req.user.username
      }
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get('/api/linkedin/status', authenticateUser, async (req, res, next) => {
  try {
    const result = await onairos.linkedin.getConnectionStatus(req.user.username);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Validation routes
app.get('/api/health', authenticateUser, async (req, res, next) => {
  try {
    const result = await onairos.validation.healthCheck(req.user.username);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/repair', authenticateUser, async (req, res, next) => {
  try {
    const { platforms } = req.body;
    const result = await onairos.validation.repairConnections(req.user.username, platforms);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Admin routes
app.get('/api/admin/system-health', authenticateUser, async (req, res, next) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const result = await onairos.validation.systemHealth();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
```

```javascript
// lib/onairos-sdk.js
import fetch from 'node-fetch';

export class OnairosSDK {
  constructor(options) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.jwtSecret = options.jwtSecret;
    
    if (!this.apiKey) {
      throw new Error('API key is required');
    }
    
    if (!this.baseUrl) {
      throw new Error('Base URL is required');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'x-api-key': this.apiKey,
      'content-type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // YouTube methods
  get youtube() {
    return {
      authenticate: async (data) => {
        return this.request('/youtube/native-auth', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      },
      
      getConnectionStatus: async (username) => {
        return this.request(`/youtube/connection-status/${username}`);
      },
      
      refreshToken: async (username) => {
        return this.request('/youtube/refresh-token', {
          method: 'POST',
          body: JSON.stringify({ username })
        });
      },
      
      validateConnection: async (username) => {
        return this.request(`/youtube/validate-connection/${username}`, {
          method: 'POST'
        });
      }
    };
  }

  // LinkedIn methods
  get linkedin() {
    return {
      authenticate: async (data) => {
        return this.request('/linkedin/native-auth', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      },
      
      getConnectionStatus: async (username) => {
        return this.request(`/linkedin/connection-status/${username}`);
      },
      
      refreshToken: async (username) => {
        return this.request('/linkedin/refresh-token', {
          method: 'POST',
          body: JSON.stringify({ username })
        });
      },
      
      validateConnection: async (username) => {
        return this.request(`/linkedin/validate-connection/${username}`, {
          method: 'POST'
        });
      }
    };
  }

  // Validation methods
  get validation() {
    return {
      healthCheck: async (username) => {
        return this.request(`/validation/health-check/${username}`);
      },
      
      repairConnections: async (username, platforms = null) => {
        return this.request(`/validation/repair-connections/${username}`, {
          method: 'POST',
          body: JSON.stringify({ platforms })
        });
      },
      
      migrationStatus: async (username) => {
        return this.request(`/validation/migration-status/${username}`);
      },
      
      systemHealth: async () => {
        return this.request('/validation/system-health');
      }
    };
  }
}
```

```javascript
// middleware/auth.js
import jwt from 'jsonwebtoken';

export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authorization header required'
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, process.env.ONAIROS_JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.userId || decoded.id,
      username: decoded.username,
      email: decoded.email,
      userType: decoded.userType,
      isAdmin: decoded.permissions?.includes('admin:*') || false
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};
```

```javascript
// middleware/error-handler.js
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.message
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }
  
  // Handle rate limit errors
  if (err.message.includes('Rate limit')) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      guidance: 'Please wait before making more requests'
    });
  }
  
  // Generic error handler
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId: req.id || 'unknown'
  });
};
```

## Testing Examples

### Jest Unit Tests

```javascript
// tests/onairos-sdk.test.js
import { OnairosSDK } from '../lib/onairos-sdk.js';
import fetch from 'node-fetch';

jest.mock('node-fetch');

describe('OnairosSDK', () => {
  let sdk;
  
  beforeEach(() => {
    sdk = new OnairosSDK({
      apiKey: 'ona_test_api_key',
      baseUrl: 'https://api.test.onairos.uk',
      jwtSecret: 'test_jwt_secret'
    });
    
    fetch.mockClear();
  });

  describe('constructor', () => {
    it('should throw error if API key is missing', () => {
      expect(() => {
        new OnairosSDK({
          baseUrl: 'https://api.test.onairos.uk'
        });
      }).toThrow('API key is required');
    });

    it('should throw error if base URL is missing', () => {
      expect(() => {
        new OnairosSDK({
          apiKey: 'test_key'
        });
      }).toThrow('Base URL is required');
    });
  });

  describe('request method', () => {
    it('should make successful request', async () => {
      const mockResponse = {
        success: true,
        data: { test: 'data' }
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sdk.request('/test-endpoint');
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.onairos.uk/test-endpoint',
        {
          headers: {
            'x-api-key': 'ona_test_api_key',
            'content-type': 'application/json'
          }
        }
      );
      
      expect(result).toEqual(mockResponse);
    });

    it('should handle request errors', async () => {
      const mockError = {
        success: false,
        error: 'Test error'
      };
      
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockError
      });

      await expect(sdk.request('/test-endpoint')).rejects.toThrow('Test error');
    });
  });

  describe('YouTube methods', () => {
    it('should authenticate YouTube connection', async () => {
      const mockResponse = {
        success: true,
        connectionData: { platform: 'youtube' }
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sdk.youtube.authenticate({
        accessToken: 'youtube_token',
        userAccountInfo: { username: 'test_user' }
      });
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.onairos.uk/youtube/native-auth',
        {
          method: 'POST',
          body: JSON.stringify({
            accessToken: 'youtube_token',
            userAccountInfo: { username: 'test_user' }
          }),
          headers: {
            'x-api-key': 'ona_test_api_key',
            'content-type': 'application/json'
          }
        }
      );
      
      expect(result).toEqual(mockResponse);
    });

    it('should get connection status', async () => {
      const mockResponse = {
        success: true,
        connectionHealth: { status: 'healthy' }
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sdk.youtube.getConnectionStatus('test_user');
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.onairos.uk/youtube/connection-status/test_user',
        {
          headers: {
            'x-api-key': 'ona_test_api_key',
            'content-type': 'application/json'
          }
        }
      );
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Validation methods', () => {
    it('should perform health check', async () => {
      const mockResponse = {
        success: true,
        summary: { overallScore: 85 }
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sdk.validation.healthCheck('test_user');
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.onairos.uk/validation/health-check/test_user',
        {
          headers: {
            'x-api-key': 'ona_test_api_key',
            'content-type': 'application/json'
          }
        }
      );
      
      expect(result).toEqual(mockResponse);
    });

    it('should repair connections', async () => {
      const mockResponse = {
        success: true,
        successfulRepairs: ['youtube']
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sdk.validation.repairConnections('test_user', ['youtube']);
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.onairos.uk/validation/repair-connections/test_user',
        {
          method: 'POST',
          body: JSON.stringify({ platforms: ['youtube'] }),
          headers: {
            'x-api-key': 'ona_test_api_key',
            'content-type': 'application/json'
          }
        }
      );
      
      expect(result).toEqual(mockResponse);
    });
  });
});
```

### Integration Tests

```javascript
// tests/integration/api.test.js
import request from 'supertest';
import app from '../../server.js';
import jwt from 'jsonwebtoken';

describe('API Integration Tests', () => {
  let authToken;
  
  beforeAll(() => {
    // Create test JWT token
    authToken = jwt.sign(
      {
        userId: 'test_user_id',
        username: 'test_user',
        email: 'test@example.com',
        userType: 'onairos'
      },
      process.env.ONAIROS_JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('YouTube endpoints', () => {
    it('should connect YouTube account', async () => {
      const response = await request(app)
        .post('/api/youtube/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accessToken: 'mock_youtube_token',
          refreshToken: 'mock_refresh_token',
          userAccountInfo: {
            username: 'test_user',
            email: 'test@example.com',
            channelName: 'Test Channel'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connectionData.platform).toBe('youtube');
    });

    it('should get YouTube connection status', async () => {
      const response = await request(app)
        .get('/api/youtube/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.platform).toBe('youtube');
    });

    it('should refresh YouTube token', async () => {
      const response = await request(app)
        .post('/api/youtube/refresh')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Health check endpoints', () => {
    it('should perform health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary).toBeDefined();
      expect(response.body.platforms).toBeDefined();
    });

    it('should repair connections', async () => {
      const response = await request(app)
        .post('/api/repair')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platforms: ['youtube']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.repairResults).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authorization header required');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });
});
```

### E2E Tests with Cypress

```javascript
// cypress/integration/platform-connections.spec.js
describe('Platform Connections', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', 'mock_jwt_token');
    });
    
    // Mock API responses
    cy.intercept('GET', '/api/health', {
      fixture: 'health-check-response.json'
    }).as('healthCheck');
    
    cy.intercept('POST', '/api/youtube/connect', {
      fixture: 'youtube-connect-response.json'
    }).as('youtubeConnect');
    
    cy.visit('/');
  });

  it('should display platform connections', () => {
    cy.get('[data-cy=platform-connections]').should('be.visible');
    cy.get('[data-cy=youtube-card]').should('be.visible');
    cy.get('[data-cy=linkedin-card]').should('be.visible');
  });

  it('should connect YouTube account', () => {
    cy.get('[data-cy=youtube-connect-btn]').click();
    
    // Mock Google OAuth flow
    cy.window().then((win) => {
      win.gapi = {
        auth2: {
          getAuthInstance: () => ({
            signIn: () => Promise.resolve({
              getAuthResponse: () => ({
                access_token: 'mock_access_token',
                server_auth_code: 'mock_refresh_token',
                id_token: 'mock_id_token'
              }),
              getBasicProfile: () => ({
                getEmail: () => 'test@example.com',
                getName: () => 'Test User'
              })
            })
          })
        }
      };
    });
    
    cy.wait('@youtubeConnect');
    cy.get('[data-cy=youtube-status]').should('contain', 'Connected');
  });

  it('should show health metrics', () => {
    cy.wait('@healthCheck');
    cy.get('[data-cy=health-summary]').should('be.visible');
    cy.get('[data-cy=overall-score]').should('contain', '85%');
  });

  it('should repair connections', () => {
    cy.intercept('POST', '/api/repair', {
      success: true,
      successfulRepairs: ['youtube']
    }).as('repairConnections');
    
    cy.get('[data-cy=repair-btn]').click();
    
    cy.wait('@repairConnections');
    cy.get('[data-cy=repair-success]').should('be.visible');
  });
});
```

## Production Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ONAIROS_API_KEY=${ONAIROS_API_KEY}
      - ONAIROS_BASE_URL=${ONAIROS_BASE_URL}
      - ONAIROS_JWT_SECRET=${ONAIROS_JWT_SECRET}
    depends_on:
      - redis
      - mongodb
    restart: unless-stopped
    
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    
  mongodb:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongo_data:
```

### Environment Configuration

```bash
# .env.production
NODE_ENV=production

# Onairos SDK Configuration
ONAIROS_API_KEY=ona_production_api_key_here
ONAIROS_BASE_URL=https://api2.onairos.uk
ONAIROS_JWT_SECRET=your_production_jwt_secret

# Database Configuration
MONGODB_URI=mongodb://mongodb:27017/onairos_production
REDIS_URL=redis://redis:6379

# Security Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SESSION_SECRET=your_session_secret
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: onairos-sdk-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: onairos-sdk-app
  template:
    metadata:
      labels:
        app: onairos-sdk-app
    spec:
      containers:
      - name: app
        image: your-registry/onairos-sdk-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: ONAIROS_API_KEY
          valueFrom:
            secretKeyRef:
              name: onairos-secrets
              key: api-key
        - name: ONAIROS_JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: onairos-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: onairos-sdk-service
spec:
  selector:
    app: onairos-sdk-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Monitoring and Logging

```javascript
// lib/monitoring.js
import winston from 'winston';
import prometheus from 'prom-client';

// Configure logging
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Configure metrics
const register = new prometheus.Registry();

export const metrics = {
  httpRequests: new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
  }),
  
  httpDuration: new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [register]
  }),
  
  onairosApiCalls: new prometheus.Counter({
    name: 'onairos_api_calls_total',
    help: 'Total number of Onairos API calls',
    labelNames: ['endpoint', 'status'],
    registers: [register]
  }),
  
  connectionHealth: new prometheus.Gauge({
    name: 'connection_health_score',
    help: 'Health score for platform connections',
    labelNames: ['platform', 'username'],
    registers: [register]
  })
};

// Middleware for metrics collection
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    metrics.httpRequests.labels(req.method, req.route?.path || req.path, res.statusCode).inc();
    metrics.httpDuration.labels(req.method, req.route?.path || req.path, res.statusCode).observe(duration);
  });
  
  next();
};

// Export metrics endpoint
export const metricsEndpoint = (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
};
```

This comprehensive guide provides practical examples for integrating the Onairos SDK across different platforms and frameworks. Each example includes error handling, security considerations, and production-ready configurations.

---

**Last Updated**: 2024-01-01  
**Version**: 1.0.0 
import React, { useState, useEffect } from 'react';

const platforms = [
  { name: 'YouTube', icon: '📺', color: 'bg-red-500', connector: 'youtube' },
  { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700', connector: 'linkedin' },
  { name: 'Reddit', icon: '🔥', color: 'bg-orange-500', connector: 'reddit' },
  { name: 'Pinterest', icon: '📌', color: 'bg-red-600', connector: 'pinterest' },
  { name: 'Instagram', icon: '📷', color: 'bg-pink-500', connector: 'instagram' },
  { name: 'GitHub', icon: '⚡', color: 'bg-gray-800', connector: 'github' },
  { name: 'Facebook', icon: '👥', color: 'bg-blue-600', connector: 'facebook' },
  { name: 'Gmail', icon: '✉️', color: 'bg-red-400', connector: 'gmail' },
  { name: 'Notion', icon: '📝', color: 'bg-gray-700', connector: 'notion' }
];

// Enhanced SDK configuration
const sdkConfig = {
  apiKey: process.env.REACT_APP_ONAIROS_API_KEY || 'onairos_web_sdk_live_key_2024',
  baseUrl: process.env.REACT_APP_ONAIROS_BASE_URL || 'https://api2.onairos.uk',
  enableHealthMonitoring: true,
  enableAutoRefresh: true,
  enableConnectionValidation: true
};

// Debug SDK config on load
console.log(`🔧 SDK Config loaded:`, {
  apiKey: sdkConfig.apiKey,
  baseUrl: sdkConfig.baseUrl,
  env_api_key: process.env.REACT_APP_ONAIROS_API_KEY,
  env_base_url: process.env.REACT_APP_ONAIROS_BASE_URL
});

/**
 * UniversalOnboarding Component
 * Displays an onboarding screen for applications requesting Onairos data
 */
export default function UniversalOnboarding({ onComplete, appIcon, appName = 'App' }) {
  const [connectedAccounts, setConnectedAccounts] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [connectionHealth, setConnectionHealth] = useState({});
  const [healthScore, setHealthScore] = useState(0);

  // Mobile device detection
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  };

  // Handle mobile OAuth return
  useEffect(() => {
    const handleMobileOAuthReturn = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthPlatform = localStorage.getItem('onairos_oauth_platform');
      const returnUrl = localStorage.getItem('onairos_oauth_return');
      
      if (urlParams.get('oauth_success') && oauthPlatform) {
        console.log(`✅ Mobile OAuth return successful for ${oauthPlatform}`);
        
        // Mark platform as connected
        setConnectedAccounts(prev => ({
          ...prev,
          [oauthPlatform]: true
        }));
        
        // Clean up stored OAuth state
        localStorage.removeItem('onairos_oauth_platform');
        localStorage.removeItem('onairos_oauth_return');
        
        // Clean up URL parameters
        if (window.history.replaceState) {
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
        
        console.log(`🔗 ${oauthPlatform} mobile OAuth completed successfully`);
      }
    };

    handleMobileOAuthReturn();
  }, []);

  // Enhanced SDK functions
  const checkConnectionHealth = async (username) => {
    try {
      const response = await fetch(`${sdkConfig.baseUrl}/validation/health-check/${username}`, {
        headers: {
          'x-api-key': sdkConfig.apiKey,
          'content-type': 'application/json'
        }
      });
      
      if (response.ok) {
        const healthData = await response.json();
        setConnectionHealth(healthData.platforms);
        setHealthScore(healthData.summary.overallScore);
        return healthData;
      }
    } catch (error) {
      console.error('Health check failed:', error);
    }
    return null;
  };

  const connectToPlatform = async (platformName) => {
    console.log(`🚀 connectToPlatform called for: ${platformName}`);
    
    const platform = platforms.find(p => p.name === platformName);
    console.log(`🔍 Platform found:`, platform);
    
    if (!platform?.connector) {
      console.error(`❌ No connector found for platform: ${platformName}`);
      console.error(`Available platforms:`, platforms.map(p => p.name));
      return false;
    }

    try {
      setIsConnecting(true);
      setConnectingPlatform(platformName);
      console.log(`🔗 Starting OAuth connection for ${platformName}...`);
      
      // Get username from localStorage or use default
      const username = localStorage.getItem('username') || localStorage.getItem('onairosUser')?.email || 'user@example.com';
      console.log(`👤 Using username: ${username}`);
      
      // Construct OAuth authorize endpoint
      const authorizeUrl = `${sdkConfig.baseUrl}/${platform.connector}/authorize`;
      console.log(`📡 Making request to: ${authorizeUrl}`);
      console.log(`🔑 Using API key: ${sdkConfig.apiKey}`);
      console.log(`📝 Request body:`, { session: { username: username } });
      
      // Make request to get OAuth URL
      const response = await fetch(authorizeUrl, {
        method: 'POST',
        headers: {
          'x-api-key': sdkConfig.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session: {
            username: username
          }
        })
      });
      
      console.log(`📋 Response status: ${response.status} ${response.statusText}`);
      console.log(`📋 Response headers:`, [...response.headers.entries()]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`📋 ${platformName} OAuth response:`, result);
      
      // Check for platform-specific URL keys based on OAuth overview
      const platformUrlKeys = {
        'youtube': 'youtubeURL',
        'linkedin': 'linkedinURL', 
        'reddit': 'redditURL',
        'pinterest': 'pinterestURL',
        'instagram': 'instagramURL',
        'github': 'githubURL',
        'facebook': 'facebookURL',
        'gmail': 'gmailURL',
        'notion': 'notionURL'
      };
      
      const expectedUrlKey = platformUrlKeys[platform.connector];
      const oauthUrl = result[expectedUrlKey] || 
                      result[`${platform.connector}URL`] || 
                      result.platformURL || 
                      result.authUrl || 
                      result.url;
      
                    if (oauthUrl) {
        console.log(`🔗 Opening OAuth for ${platformName}:`, oauthUrl);
        console.log(`✅ Found OAuth URL using key: ${expectedUrlKey}`);
        console.log(`📱 Mobile device: ${isMobileDevice()}`);
        
        if (isMobileDevice()) {
          // Mobile: Use redirect flow instead of popup
          console.log(`📱 Using mobile redirect OAuth for ${platformName}`);
          
          // Store OAuth state for return handling
          localStorage.setItem('onairos_oauth_platform', platformName);
          localStorage.setItem('onairos_oauth_return', window.location.href);
          
          // Redirect to OAuth URL (mobile-friendly)
          window.location.href = oauthUrl;
          
          // Don't continue with popup logic
          return true;
        } else {
          // Desktop: Use popup flow
          console.log(`🖥️ Using desktop popup OAuth for ${platformName}`);
          
          const popup = window.open(
            oauthUrl,
            `${platform.connector}_oauth`,
            'width=500,height=600,scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no'
          );
          
          if (!popup) {
            throw new Error('Popup blocked by browser. Please allow popups for this site.');
          }

          // Enhanced popup monitoring with timeout
          let timeoutId;
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              clearTimeout(timeoutId);
              
              // Update connection state
              setConnectedAccounts(prev => ({
                ...prev,
                [platformName]: true
              }));
              
              console.log(`✅ ${platformName} OAuth completed successfully`);
              setIsConnecting(false);
              setConnectingPlatform(null);
            }
          }, 1000);

          // Set timeout for OAuth process (5 minutes)
          timeoutId = setTimeout(() => {
            if (!popup.closed) {
              popup.close();
            }
            clearInterval(checkClosed);
            setIsConnecting(false);
            setConnectingPlatform(null);
            console.warn(`⚠️ ${platformName} OAuth timeout after 5 minutes`);
          }, 300000);
          
          return true;
        }
              } else {
          console.error(`❌ No OAuth URL received for ${platformName}:`);
          console.error(`Expected URL key: ${expectedUrlKey}`);
          console.error(`Response keys:`, Object.keys(result));
          console.error(`Full response:`, result);
          throw new Error(`No OAuth URL found. Expected '${expectedUrlKey}' in response. Check API configuration for ${platformName}.`);
        }
      
    } catch (error) {
      console.error(`❌ ${platformName} OAuth connection failed:`, error);
      setIsConnecting(false);
      setConnectingPlatform(null);
      
      // Show user-friendly error
      alert(`Failed to connect to ${platformName}: ${error.message}`);
      return false;
    }
  };

  const handleToggle = async (platformName) => {
    console.log(`🔥 CLICK DETECTED: ${platformName} toggle clicked!`);
    console.log(`🔧 isConnecting: ${isConnecting}`);
    console.log(`🔧 Current connection state:`, connectedAccounts[platformName]);
    
    if (isConnecting) {
      console.log(`⚠️ Already connecting to ${connectingPlatform}, ignoring click on ${platformName}`);
      return;
    }
    
    try {
      if (connectedAccounts[platformName]) {
        // Disconnect platform
        console.log(`🔌 Disconnecting from ${platformName}...`);
        setConnectedAccounts(prev => ({
          ...prev,
          [platformName]: false
        }));
        console.log(`✅ Disconnected from ${platformName}`);
      } else {
        // Connect platform using OAuth
        console.log(`🚀 Starting OAuth connection for ${platformName}...`);
        const success = await connectToPlatform(platformName);
        
        if (!success) {
          console.warn(`⚠️ Failed to connect to ${platformName}`);
        } else {
          console.log(`✅ Successfully initiated OAuth for ${platformName}`);
        }
      }
      
      // Check connection health after any change
      const username = localStorage.getItem('username');
      if (username && sdkConfig.enableHealthMonitoring) {
        await checkConnectionHealth(username);
      }
    } catch (error) {
      console.error(`❌ Connection toggle failed for ${platformName}:`, error);
      alert(`Connection failed: ${error.message}`);
    }
  };

  const handleContinue = () => {
    const connected = Object.entries(connectedAccounts)
      .filter(([platform, isConnected]) => isConnected)
      .map(([platform]) => platform);
    
    onComplete({
      connectedAccounts: connected,
      totalConnections: connected.length,
      healthScore: healthScore,
      connectionHealth: connectionHealth,
      sdkVersion: '1.0.0',
      enhancedFeatures: {
        healthMonitoring: sdkConfig.enableHealthMonitoring,
        autoRefresh: sdkConfig.enableAutoRefresh,
        connectionValidation: sdkConfig.enableConnectionValidation
      }
    });
  };

  const connectedCount = Object.values(connectedAccounts).filter(Boolean).length;

  return (
    <div className="max-w-md mx-auto bg-white p-6 min-h-[500px]">
      {/* Header with App Logo and Arrow to Onairos */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-3">
          <img 
            src={appIcon || "https://onairos.sirv.com/Images/OnairosBlack.png"} 
            alt={appName} 
            className="w-10 h-10 rounded-lg"
          />
          <div className="flex items-center text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <img 
            src="https://onairos.sirv.com/Images/OnairosBlack.png" 
            alt="Onairos" 
            className="w-10 h-10 rounded-lg"
          />
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Connect Your Accounts</h2>
        <p className="text-gray-600 text-sm">
          Choose which accounts to connect for a personalized experience
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          🔒 Your data is never shared with anyone. It's only used to train your personal model and is stored securely.
        </p>
      </div>

      {/* Platform List - Vertical Layout with Toggles */}
      <div className="space-y-3 mb-6">
        {platforms.map((platform) => {
          const isConnected = connectedAccounts[platform.name] || false;
          const isCurrentlyConnecting = connectingPlatform === platform.name;
          const isDisabled = isConnecting && !isCurrentlyConnecting;
          
          return (
            <div 
              key={platform.name}
              className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 ${
                isDisabled ? 'opacity-50' : 'hover:bg-gray-50 cursor-pointer'
              } ${isConnected ? 'border-green-300 bg-green-50' : 'border-gray-200'} ${
                isCurrentlyConnecting ? 'border-blue-300 bg-blue-50' : ''
              }`}
              onClick={() => !isDisabled && handleToggle(platform.name)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white text-lg relative`}>
                  {isCurrentlyConnecting ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                  ) : (
                    platform.icon
                  )}
                  {isConnected && !isCurrentlyConnecting && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{platform.name}</h3>
                  <p className={`text-sm transition-colors ${
                    isCurrentlyConnecting ? 'text-blue-600' : 
                    isConnected ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {isCurrentlyConnecting ? 'Connecting...' : 
                     isConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              
              {/* Enhanced Toggle Switch */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDisabled) handleToggle(platform.name);
                }}
                disabled={isDisabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isConnected ? 'bg-green-500' : 'bg-gray-200'
                } ${isCurrentlyConnecting ? 'bg-blue-500' : ''} ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    isConnected || isCurrentlyConnecting ? 'translate-x-6' : 'translate-x-1'
                  }`}
                >
                  {isCurrentlyConnecting && (
                    <div className="w-full h-full rounded-full bg-blue-500 animate-pulse"></div>
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Connection Status */}
      {connectedCount > 0 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            ✅ {connectedCount} account{connectedCount > 1 ? 's' : ''} connected
          </p>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={connectedCount === 0}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          connectedCount > 0
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Continue {connectedCount > 0 ? `with ${connectedCount} account${connectedCount > 1 ? 's' : ''}` : ''}
      </button>

      {/* Skip Option */}
      <button
        onClick={() => onComplete({ connectedAccounts: [], totalConnections: 0 })}
        className="w-full mt-2 py-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        Skip for now
      </button>
    </div>
  );
}

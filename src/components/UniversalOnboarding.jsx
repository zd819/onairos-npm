import React, { useState, useEffect } from 'react';

const platforms = [
  { name: 'YouTube', icon: '📺', color: 'bg-red-500', connector: 'youtube' },
  { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700', connector: 'linkedin' },
  { name: 'Reddit', icon: '🔥', color: 'bg-orange-500', connector: 'reddit' },
  { name: 'Pinterest', icon: '📌', color: 'bg-red-600', connector: 'pinterest' },
  { name: 'Instagram', icon: '📷', color: 'bg-pink-500', connector: 'instagram' },
  { name: 'GitHub', icon: '⚡', color: 'bg-gray-800', connector: 'github' },
  { name: 'Facebook', icon: '👥', color: 'bg-blue-600', connector: 'facebook' },
  { name: 'Gmail', icon: '✉️', color: 'bg-red-400', connector: 'gmail' }
];

// Enhanced SDK configuration
const sdkConfig = {
  apiKey: process.env.REACT_APP_ONAIROS_API_KEY || 'onairos_web_sdk_live_key_2024',
  baseUrl: process.env.REACT_APP_ONAIROS_BASE_URL || 'https://api2.onairos.uk',
  sdkType: 'web', // web, mobile, desktop
  enableHealthMonitoring: true,
  enableAutoRefresh: true,
  enableConnectionValidation: true
};

/**
 * UniversalOnboarding Component - Compact & Enhanced
 * Displays a streamlined onboarding screen for data connections
 */
export default function UniversalOnboarding({ onComplete, appIcon, appName = 'App' }) {
  const [connectedAccounts, setConnectedAccounts] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [connectionErrors, setConnectionErrors] = useState({});
  const [connectionHealth, setConnectionHealth] = useState({});
  const [healthScore, setHealthScore] = useState(0);

  // Mobile device detection
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  };

  // Handle mobile OAuth return
  useEffect(() => {
    const handleOAuthReturn = () => {
      const platform = localStorage.getItem('onairos_oauth_platform');
      if (platform) {
        console.log(`📱 OAuth return detected for: ${platform}`);
        
        // Clear OAuth state
        localStorage.removeItem('onairos_oauth_platform');
        localStorage.removeItem('onairos_oauth_return');
        
        // Mark as connected
        setConnectedAccounts(prev => ({
          ...prev,
          [platform]: true
        }));
        
        // Clear any errors
        setConnectionErrors(prev => ({
          ...prev,
          [platform]: null
        }));
        
        console.log(`✅ ${platform} marked as connected from OAuth return`);
      }
    };

    handleOAuthReturn();
  }, []);

  const connectToPlatform = async (platformName) => {
    console.log(`🚀 connectToPlatform called for: ${platformName}`);
    
    const platform = platforms.find(p => p.name === platformName);
    if (!platform?.connector) {
      console.error(`❌ No connector found for platform: ${platformName}`);
      return false;
    }

    try {
      setIsConnecting(true);
      setConnectingPlatform(platformName);
      
      // Clear any previous errors
      setConnectionErrors(prev => ({
        ...prev,
        [platformName]: null
      }));
      
      console.log(`🔗 Starting OAuth connection for ${platformName}...`);
      
      const username = localStorage.getItem('username') || localStorage.getItem('onairosUser')?.email || 'user@example.com';
      
      // Enhanced authorize endpoint with SDK type
      const authorizeUrl = `${sdkConfig.baseUrl}/${platform.connector}/authorize`;
      
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

             const responseData = await response.json();
       console.log(`📋 ${platformName} OAuth response:`, responseData);
       
       // Check for platform-specific URL keys with multiple fallbacks
       const platformUrlKeys = {
         'youtube': ['youtubeURL', 'youtubeUrl', 'youtube_url'],
         'linkedin': ['linkedinURL', 'linkedinUrl', 'linkedin_url'], 
         'reddit': ['redditURL', 'redditUrl', 'reddit_url'],
         'pinterest': ['pinterestURL', 'pinterestUrl', 'pinterest_url'],
         'instagram': ['instagramURL', 'instagramUrl', 'instagram_url'],
         'github': ['githubURL', 'githubUrl', 'github_url'],
         'facebook': ['facebookURL', 'facebookUrl', 'facebook_url'],
         'gmail': ['gmailURL', 'gmailUrl', 'gmail_url']
       };
       
       const possibleKeys = platformUrlKeys[platform.connector] || [
         `${platform.connector}URL`,
         `${platform.connector}Url`, 
         `${platform.connector}_url`,
         'platformURL',
         'authUrl', 
         'url'
       ];
       
       let oauthUrl = null;
       let usedKey = null;
       
       // Try each possible key
       for (const key of possibleKeys) {
         if (responseData[key]) {
           oauthUrl = responseData[key];
           usedKey = key;
           break;
         }
       }
       
       if (!oauthUrl) {
         console.error(`❌ No OAuth URL found for ${platformName}:`);
         console.error(`Expected one of:`, possibleKeys);
         console.error(`Response keys:`, Object.keys(responseData));
         console.error(`Full response:`, responseData);
         throw new Error(`No OAuth URL found. Backend should return one of: ${possibleKeys.join(', ')}`);
       }
       
       console.log(`✅ Found OAuth URL for ${platformName} using key: ${usedKey}`);
        
      if (isMobileDevice()) {
        // Mobile: Use redirect flow
        localStorage.setItem('onairos_oauth_platform', platformName);
        localStorage.setItem('onairos_oauth_return', window.location.href);
        window.location.href = oauthUrl;
        return true;
      } else {
        // Desktop: Use popup flow with enhanced monitoring
        const popup = window.open(
          oauthUrl,
          `${platform.connector}_oauth`,
          'width=500,height=600,scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no'
        );
        
        if (!popup) {
          throw new Error('Popup blocked. Please allow popups and try again.');
        }

                 // Enhanced popup monitoring with onairos.uk detection
         let hasNavigatedToOnairos = false;
         const checkInterval = setInterval(() => {
           try {
             // Try to detect if popup has navigated to onairos.uk (indicates success)
             if (popup.location && popup.location.hostname === 'onairos.uk') {
               hasNavigatedToOnairos = true;
               console.log(`🔄 ${platformName} popup navigated to onairos.uk - treating as success`);
               
               // Close the popup since it shows "not found"
               popup.close();
               return; // Let the popup.closed check handle the rest
             }
           } catch (e) {
             // Cross-origin error is expected when popup navigates to onairos.uk
             // This actually indicates the OAuth likely succeeded
             if (!hasNavigatedToOnairos) {
               hasNavigatedToOnairos = true;
               console.log(`🔄 ${platformName} popup navigated (cross-origin) - likely to onairos.uk`);
             }
           }
           
           try {
             // Check if popup is closed
             if (popup.closed) {
               clearInterval(checkInterval);
               
               // Check for success or error signals from callback page
               const successFlag = localStorage.getItem(`onairos_${platformName}_success`);
               const errorFlag = localStorage.getItem(`onairos_${platformName}_error`);
               const timestamp = localStorage.getItem(`onairos_${platformName}_timestamp`);
               
               // Only process recent signals (within 30 seconds)
               const isRecentSignal = timestamp && (Date.now() - parseInt(timestamp) < 30000);
               
               if (successFlag && isRecentSignal) {
                 // Success flow from callback page
                 console.log(`✅ ${platformName} OAuth completed successfully (callback page)`);
                 localStorage.removeItem(`onairos_${platformName}_success`);
                 localStorage.removeItem(`onairos_${platformName}_timestamp`);
                 
                 setConnectedAccounts(prev => ({
                   ...prev,
                   [platformName]: true
                 }));
                 setConnectionErrors(prev => ({
                   ...prev,
                   [platformName]: null
                 }));
                 
               } else if (errorFlag && isRecentSignal) {
                 // Error flow from callback page
                 console.log(`❌ ${platformName} OAuth failed:`, errorFlag);
                 localStorage.removeItem(`onairos_${platformName}_error`);
                 localStorage.removeItem(`onairos_${platformName}_timestamp`);
                 
                 setConnectionErrors(prev => ({
                   ...prev,
                   [platformName]: errorFlag
                 }));
                 
               } else if (hasNavigatedToOnairos) {
                 // Popup navigated to onairos.uk - assume success
                 console.log(`✅ ${platformName} OAuth likely successful (navigated to onairos.uk)`);
                 setConnectedAccounts(prev => ({
                   ...prev,
                   [platformName]: true
                 }));
                 setConnectionErrors(prev => ({
                   ...prev,
                   [platformName]: null
                 }));
                 
               } else {
                 // No signal and no onairos navigation - assume user cancelled
                 console.log(`⚠️ ${platformName} OAuth cancelled or no response`);
                 setConnectionErrors(prev => ({
                   ...prev,
                   [platformName]: 'Connection was cancelled'
                 }));
               }
               
               setIsConnecting(false);
               setConnectingPlatform(null);
             }
           } catch (error) {
             // Cross-origin error when popup navigates away - this is normal
             // console.log(`🔄 Popup navigated away for ${platformName}`);
           }
         }, 1000);

                 // Auto-close popup if it shows onairos.uk "not found" page after 10 seconds
         setTimeout(() => {
           try {
             if (!popup.closed && popup.location && popup.location.hostname === 'onairos.uk') {
               console.log(`🚪 Auto-closing ${platformName} popup showing onairos.uk (not found)`);
               popup.close();
             }
           } catch (e) {
             // Cross-origin error is expected - try to close anyway if it's been 10 seconds
             if (!popup.closed && hasNavigatedToOnairos) {
               console.log(`🚪 Auto-closing ${platformName} popup (cross-origin, likely onairos.uk)`);
               popup.close();
             }
           }
         }, 10000);

         // Final timeout after 5 minutes
         setTimeout(() => {
           if (!popup.closed) {
             popup.close();
             clearInterval(checkInterval);
             setConnectionErrors(prev => ({
               ...prev,
               [platformName]: 'Connection timeout'
             }));
             setIsConnecting(false);
             setConnectingPlatform(null);
           }
         }, 300000);

        return true;
      }
    } catch (error) {
      console.error(`❌ Error connecting to ${platformName}:`, error);
      setConnectionErrors(prev => ({
        ...prev,
        [platformName]: error.message
      }));
      setIsConnecting(false);
      setConnectingPlatform(null);
      return false;
    }
  };

  const handleToggle = async (platformName) => {
    console.log(`🔥 TOGGLE CLICKED: ${platformName}`);
    
    if (isConnecting && connectingPlatform !== platformName) {
      console.log(`⚠️ Already connecting to ${connectingPlatform}, ignoring click on ${platformName}`);
      return;
    }
    
    const isConnected = connectedAccounts[platformName];
    
    if (isConnected) {
      // Disconnect
      console.log(`🔌 Disconnecting from ${platformName}...`);
      setConnectedAccounts(prev => ({
        ...prev,
        [platformName]: false
      }));
      setConnectionErrors(prev => ({
        ...prev,
        [platformName]: null
      }));
    } else {
      // Connect
      await connectToPlatform(platformName);
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
      sdkVersion: '2.1.7',
      enhancedFeatures: {
        healthMonitoring: sdkConfig.enableHealthMonitoring,
        autoRefresh: sdkConfig.enableAutoRefresh,
        connectionValidation: sdkConfig.enableConnectionValidation
      }
    });
  };

  const connectedCount = Object.values(connectedAccounts).filter(Boolean).length;

  return (
    <div className="max-w-sm mx-auto bg-white p-4 rounded-lg shadow-lg">
      {/* Compact Header */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-2">
          <img 
            src={appIcon || "https://onairos.sirv.com/Images/OnairosBlack.png"} 
            alt={appName} 
            className="w-8 h-8 rounded-lg"
          />
          <div className="flex items-center text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <img 
            src="https://onairos.sirv.com/Images/OnairosBlack.png" 
            alt="Onairos" 
            className="w-8 h-8 rounded-lg"
          />
        </div>
      </div>

      {/* Simple Clear Title */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Connect Data</h2>
        <p className="text-gray-600 text-sm">
          Connect data here to enhance your {appName} experience
        </p>
      </div>

      {/* Compact Platform Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {platforms.map((platform) => {
          const isConnected = connectedAccounts[platform.name] || false;
          const isCurrentlyConnecting = connectingPlatform === platform.name;
          const hasError = connectionErrors[platform.name];
          const isDisabled = isConnecting && !isCurrentlyConnecting;
          
          return (
            <div 
              key={platform.name}
              className={`relative p-3 border-2 rounded-lg transition-all duration-200 cursor-pointer ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
              } ${
                isConnected ? 'border-green-400 bg-green-50' : 
                hasError ? 'border-red-400 bg-red-50' :
                isCurrentlyConnecting ? 'border-blue-400 bg-blue-50' : 
                'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => !isDisabled && handleToggle(platform.name)}
            >
              {/* Platform Icon */}
              <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center text-white text-lg mb-2 mx-auto relative`}>
                {isCurrentlyConnecting ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                ) : (
                  platform.icon
                )}
                
                {/* Connection Status Indicator */}
                {isConnected && !isCurrentlyConnecting && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {hasError && !isCurrentlyConnecting && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Platform Name */}
              <div className="text-center">
                <h3 className="font-medium text-gray-900 text-xs">{platform.name}</h3>
                <p className={`text-xs mt-1 ${
                  isCurrentlyConnecting ? 'text-blue-600' : 
                  isConnected ? 'text-green-600' : 
                  hasError ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {isCurrentlyConnecting ? 'Connecting...' : 
                   isConnected ? 'Connected' : 
                   hasError ? 'Failed' :
                   'Tap to connect'}
                </p>
                
                {/* Error Message */}
                {hasError && (
                  <p className="text-xs text-red-600 mt-1 break-words">
                    {hasError}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection Status Summary */}
      {connectedCount > 0 && (
        <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm text-center">
            ✅ {connectedCount} connection{connectedCount > 1 ? 's' : ''} active
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
        {connectedCount > 0 ? `Continue with ${connectedCount} connection${connectedCount > 1 ? 's' : ''}` : 'Connect at least one platform'}
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

import React, { useState, useEffect } from 'react';

// Default persona images - using public folder paths for consumer compatibility
const defaultPersonaImages = {
  1: 'https://anushkasirv.sirv.com/persona1.png',
  2: 'https://anushkasirv.sirv.com/persona2.png', 
  3: 'https://anushkasirv.sirv.com/persona3.png',
  4: 'https://anushkasirv.sirv.com/persona4.png',
  5: 'https://anushkasirv.sirv.com/persona5.png',
};

const platforms = [
  { 
    name: 'Gmail', 
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ), 
    color: 'bg-white', 
    connector: 'gmail',
    description: "We use your emails and search patterns to better understand your interests and communication style."
  },
  { 
    name: 'Google', 
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ), 
    color: 'bg-white', 
    connector: 'google',
    description: "We use your search, YouTube, and location signals to better understand your interests and routines."
  },
  { 
    name: 'Reddit', 
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FF4500">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ), 
    color: 'bg-white', 
    connector: 'reddit',
    description: "We use your posts and interactions to better understand your interests and preferences."
  },
  { 
    name: 'Instagram', 
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <defs>
          <radialGradient id="instagram-gradient" cx="0.5" cy="1" r="1">
            <stop offset="0%" stopColor="#FD5949" />
            <stop offset="50%" stopColor="#D6249F" />
            <stop offset="100%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.073-1.689-.073-4.849 0-3.204.013-3.583.072-4.948.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ), 
    color: 'bg-white', 
    connector: 'instagram',
    description: "We use your photos and interactions to better understand your visual preferences and lifestyle."
  },
  { 
    name: 'LinkedIn', 
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0077B5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ), 
    color: 'bg-white', 
    connector: 'linkedin',
    description: "We use your professional network and content to better understand your career interests."
  },
  { 
    name: 'Pinterest', 
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#E60023">
        <path d="M12 0C5.373 0 0 5.372 0 12s5.373 12 12 12c6.628 0 12-5.372 12-12S18.628 0 12 0zm0 19c-.721 0-1.418-.109-2.073-.312.286-.465.713-1.227.87-1.835l.437-1.664c.229.436.895.8 1.604.8 2.111 0 3.633-1.941 3.633-4.354 0-2.312-1.895-4.049-4.218-4.049-2.972 0-4.684 1.946-4.684 4.338 0 1.083.424 2.42 1.218 2.847.131.07.201.04.232-.107.023-.106.151-.602.2-.784.067-.25.041-.336-.145-.553-.408-.474-.615-1.088-.615-1.72 0-1.658 1.222-3.259 3.297-3.259 1.798 0 3.064 1.244 3.064 3.018 0 2.019-.864 3.423-2.024 3.423-.633 0-1.106-.537-.954-1.196.181-.788.532-1.637.532-2.204 0-.508-.267-.932-.822-.932-.652 0-1.176.685-1.176 1.602 0 .584.197.98.197.98l-.790 3.396C6.595 16.85 6.017 14.47 6.017 12c0-3.313 2.687-6 6-6s6 2.687 6 6-2.687 6-6 6z"/>
      </svg>
    ), 
    color: 'bg-white', 
    connector: 'pinterest',
    description: "We use your pins and boards to better understand your creative interests and style preferences."
  }
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
export default function UniversalOnboarding({ onComplete, onBack, appIcon, appName = 'App', personaImages: personaImagesProp, priorityPlatform = null, testMode = false }) {
  // Use provided persona images or fallback to defaults
  const personaImages = personaImagesProp ?? defaultPersonaImages;
  
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
  const personaNumber = Math.min(connectedCount + 1, 5); // 0 connections = persona 1, 1 connection = persona 2, etc.

  // Sort platforms to prioritize the specified platform
  const getSortedPlatforms = () => {
    if (!priorityPlatform) return platforms;
    
    const priorityPlat = platforms.find(p => 
      p.name.toLowerCase() === priorityPlatform.toLowerCase() || 
      p.connector.toLowerCase() === priorityPlatform.toLowerCase()
    );
    
    if (!priorityPlat) return platforms;
    
    const otherPlatforms = platforms.filter(p => p !== priorityPlat);
    return [priorityPlat, ...otherPlatforms];
  };

  const sortedPlatforms = getSortedPlatforms();
  const isPriorityPlatform = (platform) => {
    if (!priorityPlatform) return false;
    return platform.name.toLowerCase() === priorityPlatform.toLowerCase() || 
           platform.connector.toLowerCase() === priorityPlatform.toLowerCase();
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ height: '100%', minHeight: 0 }}>
      {/* Content - Flexible center area */}
      <div className="px-6 pt-12 flex-shrink-0">
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-balance leading-tight">Connect data, securely</h1>
          <p className="text-gray-600 text-base">More data, means a better Experience on {appName}.</p> 
        </div>

        <div className="mb-4 flex justify-center flex-shrink-0">
          <div className="w-64 h-64 overflow-hidden">
            <img
              src={personaImages[personaNumber]}
              alt={`Persona ${personaNumber}`}
              width="256"
              height="256"
              className="w-full h-full object-cover"
              onLoad={() => console.log('✅ Persona image loaded successfully!')}
              onError={(e) => {
                console.log('❌ Persona image failed to load:', personaImages[personaNumber]);
                console.log('Connected count:', connectedCount);
                console.log('Persona number:', personaNumber);
                console.log('All persona URLs:', personaImages);
                console.log('Current location:', window.location.href);
                console.log('Trying to load from:', personaImages[personaNumber]);
                
                // Fallback to gradient if image fails to load
                e.target.style.display = 'none';
                e.target.parentElement.style.background = 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)';
              }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable platform list - Reduced height */}
      <div className="flex-1 overflow-y-auto px-6" style={{ minHeight: 0, maxHeight: '40vh' }}>
          <div className="space-y-3 pb-4">
            {sortedPlatforms.map((platform) => {
          const isConnected = connectedAccounts[platform.name] || false;
          const isCurrentlyConnecting = connectingPlatform === platform.name;
          const hasError = connectionErrors[platform.name];
          const isDisabled = isConnecting && !isCurrentlyConnecting;
          const isPriority = isPriorityPlatform(platform);
          
          return (
            <div 
              key={platform.name}
                  className={`flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors ${isPriority ? 'ring-2 ring-blue-200 ring-opacity-50 bg-blue-50' : ''}`}
                  style={{
                    backgroundColor: isPriority ? "#EFF6FF" : "#ffffff",
                    border: isPriority ? "1px solid #DBEAFE" : "none",
                    outline: "none",
                  }}
              onClick={() => !isDisabled && handleToggle(platform.name)}
            >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-gray-100">
                  {isCurrentlyConnecting ? (
                      <div className="animate-spin h-5 w-5 border-2 border-gray-400 rounded-full border-t-transparent"></div>
                  ) : (
                    platform.icon
                  )}
                    </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h3
                      className="font-medium mb-1"
                      style={{
                        backgroundColor: "#ffffff !important",
                        color: "#111827 !important",
                        border: "none",
                        outline: "none",
                      }}
                    >
                      {platform.name}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        backgroundColor: "#ffffff !important",
                        color: "#4B5563 !important",
                        border: "none",
                        outline: "none",
                      }}
                    >
                      {platform.description}
                  </p>
                  
                  {/* Priority platform badge */}
                  {isPriority && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ⭐ Enhanced personalization for {appName}
                      </span>
                    </div>
                  )}
                  
                  {/* Error Message */}
                  {hasError && (
                    <p className="text-xs text-red-600 mt-1">
                      {hasError}
                    </p>
                  )}
                </div>
                  <div className="flex-shrink-0">
                    <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDisabled) handleToggle(platform.name);
                  }}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ease-in-out cursor-pointer ${
                        isConnected ? "bg-green-500" : "bg-gray-300"
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-200 ease-in-out shadow-md ${
                          isConnected ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                    </div>
              </div>
            </div>
          );
        })}
          </div>
        </div>

      {/* Buttons - Fixed at bottom */}
      <div className="px-6 pb-6 pt-4 flex-shrink-0 space-y-3" style={{ minHeight: 'auto' }}>
        <div
          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-4 text-base font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
        onClick={handleContinue}
        >
          Update
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        {connectedCount > 0 && <div
        onClick={() => onComplete({ connectedAccounts: [], totalConnections: 0 })}
          className="w-full text-gray-600 text-base font-medium py-3 text-center cursor-pointer hover:text-gray-800 transition-colors"
      >
          Skip
        </div>
        }
      </div>
    </div>
  );
}

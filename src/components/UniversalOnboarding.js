import React, { useState, useEffect } from 'react';
import ChatGPTConnector from './connectors/ChatGPTConnector';
import YoutubeConnector from './connectors/YoutubeConnector';
import LinkedInConnector from './connectors/LinkedInConnector';
import InstagramConnector from './connectors/InstagramConnector';
import PinterestConnector from './connectors/PinterestConnector';
import RedditConnector from './connectors/RedditConnector';
import GmailConnector from './connectors/GmailConnector';
import PrimaryButton from './ui/PrimaryButton.jsx';
import { COLORS } from '../theme/colors.js';

const platforms = [
  { 
    name: 'ChatGPT', 
    icon: (
      <img 
        src="/chatgpt-icon.png" 
        alt="ChatGPT" 
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to emoji if image fails to load
          e.target.outerHTML = '🤖';
        }}
      />
    ), 
    color: 'bg-green-600', 
    connector: 'chatgpt' 
  },
  { name: 'YouTube', icon: '📺', color: 'bg-red-500', connector: 'youtube' },
  { name: 'Reddit', icon: '🔥', color: 'bg-orange-500', connector: 'reddit' },
  { name: 'Instagram', icon: '📷', color: 'bg-pink-500', connector: 'instagram' },
  { name: 'Pinterest', icon: '📌', color: 'bg-red-600', connector: 'pinterest' },
  { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700', connector: 'linkedin' },
  { name: 'Gmail', icon: '📧', color: 'bg-red-500', connector: 'gmail' }
];

export default function UniversalOnboarding({ onComplete, appIcon, appName = 'App', username, testMode = true }) {
  const [connectedAccounts, setConnectedAccounts] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeConnector, setActiveConnector] = useState(null);

  // Debug log on component mount
  useEffect(() => {
    console.log('🎯 UniversalOnboarding.js component mounted');
    console.log('🔧 Props:', { onComplete, appIcon, appName, username });
    console.log('🔧 Platforms loaded:', platforms.length);
  }, []);

  const handleConnectionChange = (platformName, isConnected) => {
    setConnectedAccounts(prev => ({
      ...prev,
      [platformName]: isConnected
    }));
    setActiveConnector(null);
  };

  const handleToggle = async (platformName, connectorType) => {
    console.log(`🔥 TOGGLE CLICKED: ${platformName} (${connectorType})`);
    console.log(`🔧 isConnecting: ${isConnecting}`);
    console.log(`🔧 Current connection state:`, connectedAccounts[platformName]);
    
    if (isConnecting) {
      console.log(`⚠️ Already connecting, ignoring click`);
      return;
    }
    
    const isCurrentlyConnected = connectedAccounts[platformName];
    
    if (isCurrentlyConnected) {
      // Disconnect - call the connector's disconnect method
      console.log(`🔌 Disconnecting from ${platformName}...`);
      setConnectedAccounts(prev => ({
        ...prev,
        [platformName]: false
      }));
      console.log(`✅ Disconnected from ${platformName}`);
    } else {
      // Connect
      // Special behavior for ChatGPT: Always open chatgpt.com in new tab
      if (connectorType === 'chatgpt') {
        console.log(`🤖 ChatGPT toggle: Opening chatgpt.com in new tab...`);
        const chatGPTWindow = window.open('https://chatgpt.com', '_blank');
        
        if (chatGPTWindow) {
          // Simulate connection
          setConnectedAccounts(prev => ({
            ...prev,
            [platformName]: true
          }));
          console.log(`✅ ChatGPT opened in new tab and marked as connected`);
        } else {
          console.error(`❌ Failed to open ChatGPT - popup blocked`);
          alert('Popup blocked. Please allow popups for this site to open ChatGPT.');
        }
        return;
      }
      
      if (testMode) {
        // Test mode: Simulate instant connection without OAuth dialog
        console.log(`🧪 Test mode: Simulating instant connection to ${platformName}...`);
        setIsConnecting(true);
        setTimeout(() => {
          setConnectedAccounts(prev => ({
            ...prev,
            [platformName]: true
          }));
          setIsConnecting(false);
          console.log(`🧪 Test mode: Simulated connection to ${platformName} successful`);
        }, 300); // Quick simulation delay
      } else {
        // Production mode: Open the OAuth dialog
        console.log(`🚀 Opening OAuth for ${platformName}...`);
        setActiveConnector(connectorType);
        console.log(`🔧 Set activeConnector to: ${connectorType}`);
      }
    }
  };

  const handleContinue = () => {
    const connected = Object.entries(connectedAccounts)
      .filter(([platform, isConnected]) => isConnected)
      .map(([platform]) => platform);
    
    onComplete({
      connectedAccounts: connected,
      totalConnections: connected.length
    });
  };

  const connectedCount = Object.values(connectedAccounts).filter(Boolean).length;

  return (
    <div className="w-full space-y-6">
      {/* Test Mode Notice */}
      {testMode && (
        <div 
          className="p-3 rounded-lg border mb-4"
          style={{ 
            backgroundColor: '#FEF3C7', 
            borderColor: '#F59E0B',
            color: '#D97706'
          }}
        >
          <p className="text-sm">
            🧪 <strong>Test Mode:</strong> Connections are simulated for design testing. Toggle any platform to simulate instant connection.
          </p>
        </div>
      )}

      {/* Privacy Notice */}
      <div 
        className="p-3 rounded-lg border"
        style={{ 
          backgroundColor: '#EBF8FF', 
          borderColor: '#BEE3F8',
          color: '#2B6CB0'
        }}
      >
        <p className="text-sm">
          🔒 Your data is never shared with anyone. It's only used to train your personal model and is stored securely.
        </p>
      </div>

        {/* Platform List - Vertical Layout with Toggles */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          {platforms.map((platform) => {
            const isConnected = connectedAccounts[platform.name] || false;
            
            return (
              <div 
                key={platform.name}
                className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${platform.color} flex items-center justify-center text-white text-base sm:text-lg`}>
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">{platform.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {isConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                
                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(platform.name, platform.connector)}
                  disabled={isConnecting}
                  className={`relative inline-flex h-5 sm:h-6 w-9 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isConnected ? 'bg-blue-600' : 'bg-gray-200'
                  } ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-3 sm:h-4 w-3 sm:w-4 transform rounded-full bg-white transition-transform ${
                      isConnected ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Connection Status */}
        {connectedCount > 0 && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-xs sm:text-sm">
              ✅ {connectedCount} account{connectedCount > 1 ? 's' : ''} connected
            </p>
          </div>
        )}

        {/* Continue Button */}
        <div className="mb-4">
          <PrimaryButton
            label={connectedCount > 0 ? `Continue with ${connectedCount} account${connectedCount > 1 ? 's' : ''}` : 'Continue'}
            onClick={handleContinue}
            disabled={connectedCount === 0}
            testId="continue-button"
          />
        </div>

        {/* Skip Option */}
        <button
          onClick={() => onComplete({ connectedAccounts: [], totalConnections: 0 })}
          className="w-full mt-2 py-2 font-medium transition-colors text-sm"
          style={{ color: COLORS.textSecondary }}
        >
          Skip for now
        </button>

      {/* OAuth Connector Dialogs - Only show in production mode */}
      {!testMode && (
        <>
          <ChatGPTConnector 
            open={activeConnector === 'chatgpt'}
            onClose={() => setActiveConnector(null)}
            onConnectionChange={handleConnectionChange}
            username={username}
          />
          <YoutubeConnector 
            open={activeConnector === 'youtube'}
            onClose={() => setActiveConnector(null)}
            onConnectionChange={handleConnectionChange}
            username={username}
          />
          <LinkedInConnector 
            open={activeConnector === 'linkedin'}
            onClose={() => setActiveConnector(null)}
            onConnectionChange={handleConnectionChange}
            username={username}
          />
          <InstagramConnector 
            open={activeConnector === 'instagram'}
            onClose={() => setActiveConnector(null)}
            onConnectionChange={handleConnectionChange}
            username={username}
          />
          <PinterestConnector 
            open={activeConnector === 'pinterest'}
            onClose={() => setActiveConnector(null)}
            onConnectionChange={handleConnectionChange}
            username={username}
          />
          <RedditConnector 
            open={activeConnector === 'reddit'}
            onClose={() => setActiveConnector(null)}
            onConnectionChange={handleConnectionChange}
            username={username}
          />
          <GmailConnector 
            open={activeConnector === 'gmail'}
            onClose={() => setActiveConnector(null)}
            onConnectionChange={handleConnectionChange}
            username={username}
          />
        </>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import YoutubeConnector from './connectors/YoutubeConnector';
import LinkedInConnector from './connectors/LinkedInConnector';
import InstagramConnector from './connectors/InstagramConnector';
import PinterestConnector from './connectors/PinterestConnector';
import RedditConnector from './connectors/RedditConnector';
import GmailConnector from './connectors/GmailConnector';

const platforms = [
  { name: 'YouTube', icon: '📺', color: 'bg-red-500', connector: 'youtube' },
  { name: 'Reddit', icon: '🔥', color: 'bg-orange-500', connector: 'reddit' },
  { name: 'Instagram', icon: '📷', color: 'bg-pink-500', connector: 'instagram' },
  { name: 'Pinterest', icon: '📌', color: 'bg-red-600', connector: 'pinterest' },
  { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700', connector: 'linkedin' },
  { name: 'Gmail', icon: '📧', color: 'bg-red-500', connector: 'gmail' }
];

export default function UniversalOnboarding({ onComplete, appIcon, appName = 'App', username }) {
  const [connectedAccounts, setConnectedAccounts] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeConnector, setActiveConnector] = useState(null);

  const handleConnectionChange = (platformName, isConnected) => {
    setConnectedAccounts(prev => ({
      ...prev,
      [platformName]: isConnected
    }));
    setActiveConnector(null);
  };

  const handleToggle = async (platformName, connectorType) => {
    if (isConnecting) return;
    
    const isCurrentlyConnected = connectedAccounts[platformName];
    
    if (isCurrentlyConnected) {
      // Disconnect - call the connector's disconnect method
      setConnectedAccounts(prev => ({
        ...prev,
        [platformName]: false
      }));
    } else {
      // Connect - open the OAuth dialog
      setActiveConnector(connectorType);
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
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden" style={{ maxHeight: '90vh', height: 'auto' }}>
      <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 4rem)' }}>
        {/* Header with App Logo and Arrow to Onairos */}
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <div className="flex items-center space-x-3">
            <img 
              src={appIcon || "https://onairos.sirv.com/Images/OnairosBlack.png"} 
              alt={appName} 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg"
            />
            <div className="flex items-center text-gray-400">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <img 
              src="https://onairos.sirv.com/Images/OnairosBlack.png" 
              alt="Onairos" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg"
            />
          </div>
        </div>

        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Connect Your Accounts</h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            Choose which accounts to connect for a personalized experience
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-xs sm:text-sm">
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
        <button
          onClick={handleContinue}
          disabled={connectedCount === 0}
          className={`w-full py-2 sm:py-3 px-4 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
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
          className="w-full mt-2 py-2 text-gray-500 hover:text-gray-700 text-xs sm:text-sm"
        >
          Skip for now
        </button>
      </div>

      {/* OAuth Connector Dialogs */}
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
    </div>
  );
}
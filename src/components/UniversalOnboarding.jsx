import React, { useState, useEffect } from 'react';

const platforms = [
  { name: 'YouTube', icon: '📺', color: 'bg-red-500' },
  { name: 'Reddit', icon: '🔥', color: 'bg-orange-500' },
  { name: 'Instagram', icon: '📷', color: 'bg-pink-500' },
  { name: 'Pinterest', icon: '📌', color: 'bg-red-600' },
  { name: 'TikTok', icon: '🎵', color: 'bg-black' },
  { name: 'Twitter', icon: '🐦', color: 'bg-blue-500' },
  { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
  { name: 'Facebook', icon: '👥', color: 'bg-blue-600' }
];

/**
 * UniversalOnboarding Component
 * Displays an onboarding screen for applications requesting Onairos data
 */
export default function UniversalOnboarding({ onComplete, appIcon, appName = 'App' }) {
  const [connectedAccounts, setConnectedAccounts] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);

  const handleToggle = async (platformName) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setConnectedAccounts(prev => ({
      ...prev,
      [platformName]: !prev[platformName]
    }));
    
    setIsConnecting(false);
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
          
          return (
            <div 
              key={platform.name}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white text-lg`}>
                  {platform.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{platform.name}</h3>
                  <p className="text-sm text-gray-500">
                    {isConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle(platform.name)}
                disabled={isConnecting}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isConnected ? 'bg-blue-600' : 'bg-gray-200'
                } ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isConnected ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
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

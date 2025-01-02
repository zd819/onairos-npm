import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const socialPlatforms = [
  {
    name: 'YouTube',
    icon: 'https://onairos.sirv.com/Images/youtube-icon.png',
    connected: false
  },
  {
    name: 'Reddit',
    icon: 'https://onairos.sirv.com/Images/reddit-icon.png',
    connected: false
  },
  {
    name: 'Instagram',
    icon: 'https://onairos.sirv.com/Images/instagram-icon.png',
    connected: false
  },
  {
    name: 'Pinterest',
    icon: 'https://onairos.sirv.com/Images/pinterest-icon.png',
    connected: false
  }
];

export default function UniversalOnboarding({ onComplete }) {
  const [platforms, setPlatforms] = useState(socialPlatforms);
  const [isUnifying, setIsUnifying] = useState(false);
  const [unifyProgress, setUnifyProgress] = useState(0);

  useEffect(() => {
    if (isUnifying) {
      const interval = setInterval(() => {
        setUnifyProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUnifying(false);
            onComplete();
            return 100;
          }
          return prev + 2;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isUnifying, onComplete]);

  const handleConnect = async (platformName) => {
    // Implement OAuth flow for each platform
    try {
      const response = await fetch(`https://api2.onairos.uk/connect/${platformName.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('onairosToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setPlatforms(platforms.map(p => 
          p.name === platformName ? { ...p, connected: true } : p
        ));
      }
    } catch (error) {
      console.error(`Failed to connect to ${platformName}:`, error);
    }
  };

  const handleUnify = async () => {
    if (platforms.some(p => p.connected)) {
      setIsUnifying(true);
      try {
        const response = await fetch('https://api2.onairos.uk/unify', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('onairosToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          onComplete();
        }
      } catch (error) {
        console.error('Failed to unify data:', error);
      }
    }
  };

  if (isUnifying) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center space-y-6 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900">Unifying Your Data</h2>
        <p className="text-gray-600 text-center">
          Please wait while we process your information
        </p>
        
        <div className="w-full max-w-md">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {unifyProgress}%
                </span>
              </div>
            </div>
            <motion.div 
              className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${unifyProgress}%` }}
                transition={{ duration: 0.5 }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              />
            </motion.div>
          </div>
        </div>

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12"
        >
          <svg className="w-full h-full text-blue-500" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"
            />
          </svg>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <h2 className="text-xl font-semibold text-gray-900">Connect Your Accounts</h2>
      <p className="text-gray-600 text-center">
        Connect at least one account to create your personality model
      </p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {platforms.map((platform) => (
          <button
            key={platform.name}
            onClick={() => handleConnect(platform.name)}
            className={`flex items-center justify-center p-4 rounded-lg border ${
              platform.connected ? 'bg-green-50 border-green-500' : 'border-gray-300 hover:border-blue-500'
            }`}
          >
            <img src={platform.icon} alt={platform.name} className="w-8 h-8 mr-2" />
            <span className={platform.connected ? 'text-green-600' : 'text-gray-700'}>
              {platform.connected ? 'Connected' : `Connect ${platform.name}`}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={handleUnify}
        disabled={!platforms.some(p => p.connected)}
        className={`w-full max-w-md py-3 px-4 rounded-lg font-semibold ${
          platforms.some(p => p.connected)
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Unify and Create Model
      </button>
    </div>
  );
} 
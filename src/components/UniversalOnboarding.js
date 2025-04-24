import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Send, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { createOAuthWindow } from './utils/oauthHelper';

const socialPlatforms = [
  {
    name: 'YouTube',
    icon: 'https://onairos.sirv.com/Images/youtube-icon.png',
    connected: false,
    color: '#FF0000'
  },
  {
    name: 'Reddit',
    icon: 'https://onairos.sirv.com/Images/reddit-icon.png',
    connected: false,
    color: '#FF4500'
  },
  {
    name: 'Instagram',
    icon: 'https://onairos.sirv.com/Images/instagram-icon.png',
    connected: false,
    color: '#E1306C'
  },
  {
    name: 'Pinterest',
    icon: 'https://onairos.sirv.com/Images/pinterest-icon.png',
    connected: false,
    color: '#E60023'
  },
  {
    name: 'TikTok',
    icon: 'https://onairos.sirv.com/Images/tiktok-icon.png',
    connected: false,
    color: '#000000'
  }
];

const steps = {
  CONNECT: 'connect',
  PASSPHRASE: 'passphrase',
  CONFIRM: 'confirm',
  UNIFYING: 'unifying'
};

export default function UniversalOnboarding({ onComplete, appIcon }) {
  const [platforms, setPlatforms] = useState(socialPlatforms);
  const [currentStep, setCurrentStep] = useState(steps.CONNECT);
  const [unifyProgress, setUnifyProgress] = useState(0);
  const [passphrase, setPassphrase] = useState('');
  const [passphraseError, setPassphraseError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Listen for OAuth callbacks
  useEffect(() => {
    const handleOAuthCallback = (event) => {
      if (event.data && event.data.platform && event.data.status === 'success') {
        setPlatforms(platforms.map(p => 
          p.name.toLowerCase() === event.data.platform.toLowerCase() 
            ? { ...p, connected: true } 
            : p
        ));
      }
    };

    window.addEventListener('message', handleOAuthCallback);
    return () => window.removeEventListener('message', handleOAuthCallback);
  }, [platforms]);

  // Handle unification progress
  useEffect(() => {
    if (currentStep === steps.UNIFYING) {
      const interval = setInterval(() => {
        setUnifyProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            onComplete();
            return 100;
          }
          return prev + 2;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [currentStep, onComplete]);

  const handleConnect = async (platformName) => {
    try {
      setIsLoading(true);
      // Use OAuth helper to open popup window
      const authWindow = createOAuthWindow(
        `https://api2.onairos.uk/auth/${platformName.toLowerCase()}`,
        platformName
      );
      
      // The actual connection will be handled by the useEffect that listens for the OAuth callback
      setIsLoading(false);
    } catch (error) {
      console.error(`Failed to connect to ${platformName}:`, error);
      setIsLoading(false);
    }
  };

  const handleContinueToPassphrase = () => {
    if (platforms.some(p => p.connected)) {
      setCurrentStep(steps.PASSPHRASE);
    }
  };

  const validatePassphrase = () => {
    if (!passphrase || passphrase.length < 8) {
      setPassphraseError('Passphrase must be at least 8 characters');
      return false;
    }
    setPassphraseError('');
    return true;
  };

  const handleContinueToConfirm = () => {
    if (validatePassphrase()) {
      setCurrentStep(steps.CONFIRM);
    }
  };

  const handleUnify = async () => {
    setCurrentStep(steps.UNIFYING);
    try {
      const response = await fetch('https://api2.onairos.uk/unify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('onairosToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platforms: platforms.filter(p => p.connected).map(p => p.name.toLowerCase()),
          passphrase: passphrase
        })
      });

      if (!response.ok) {
        throw new Error('Failed to unify data');
      }
    } catch (error) {
      console.error('Failed to unify data:', error);
      // Handle error appropriately
    }
  };

  const renderConnectStep = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center space-y-6 w-full"
    >
      <h2 className="text-xl font-semibold text-gray-900">Connect Your Accounts</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md">
        <div className="flex items-start">
          <Shield className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-blue-700">
            Your data is never shared with anyone. It's only used to train your personal model and is stored securely.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {platforms.map((platform) => (
          <motion.button
            key={platform.name}
            onClick={() => handleConnect(platform.name)}
            disabled={isLoading || platform.connected}
            whileHover={{ scale: platform.connected ? 1 : 1.03 }}
            whileTap={{ scale: platform.connected ? 1 : 0.98 }}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
              platform.connected 
                ? 'bg-green-50 border-green-500' 
                : 'border-gray-300 hover:border-blue-500 hover:shadow-sm'
            }`}
          >
            <div className="relative">
              <img src={platform.icon} alt={platform.name} className="w-10 h-10 mb-2" />
              {platform.connected && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </div>
            <span className={`text-sm ${platform.connected ? 'text-green-600' : 'text-gray-700'}`}>
              {platform.connected ? 'Connected' : `Connect`}
            </span>
          </motion.button>
        ))}
      </div>

      <button
        onClick={handleContinueToPassphrase}
        disabled={!platforms.some(p => p.connected)}
        className={`w-full max-w-md py-3 px-4 rounded-lg font-semibold transition-all ${
          platforms.some(p => p.connected)
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Continue
      </button>
      
      <p className="text-xs text-gray-500 max-w-md text-center">
        Connect at least one account to create your personalized AI model
      </p>
    </motion.div>
  );

  const renderPassphraseStep = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center space-y-6 w-full"
    >
      <h2 className="text-xl font-semibold text-gray-900">Create Your Secure Passphrase</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md">
        <div className="flex items-start">
          <Lock className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-blue-700">
            Your passphrase is used to secure your model. We don't store it, so please remember it for future access.
          </p>
        </div>
      </div>

      <div className="w-full max-w-md">
        <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 mb-1">
          8+ Character Passphrase
        </label>
        <input
          type="password"
          id="passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Enter your secure passphrase"
          className={`w-full p-3 border ${passphraseError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
        />
        {passphraseError && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle size={14} className="mr-1" /> {passphraseError}
          </p>
        )}
      </div>

      <div className="flex space-x-3 w-full max-w-md">
        <button
          onClick={() => setCurrentStep(steps.CONNECT)}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleContinueToConfirm}
          className="flex-1 py-3 px-4 bg-blue-500 rounded-lg font-semibold text-white hover:bg-blue-600"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );

  const renderConfirmStep = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center space-y-6 w-full"
    >
      <h2 className="text-xl font-semibold text-gray-900">Confirm Data Transfer</h2>
      
      <div className="flex justify-center items-center w-full max-w-md py-8">
        <div className="relative flex items-center">
          <div className="p-3 bg-gray-100 rounded-full">
            <img 
              src={appIcon || "https://onairos.sirv.com/Images/onairos-icon.png"} 
              alt="App" 
              className="w-16 h-16 rounded-full"
            />
          </div>
          
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="mx-4"
          >
            <Send size={24} className="text-blue-500" />
          </motion.div>
          
          <div className="p-3 bg-blue-100 rounded-full">
            <img 
              src="https://onairos.sirv.com/Images/onairos-icon.png" 
              alt="Onairos" 
              className="w-16 h-16 rounded-full"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md">
        <p className="text-sm text-blue-700">
          You're about to securely send your data to Onairos to train your personal AI model.
          Your data is end-to-end encrypted with your passphrase and never shared with anyone.
        </p>
      </div>
      
      <div className="w-full max-w-md">
        <h3 className="font-medium text-gray-700 mb-2">Connected platforms:</h3>
        <div className="flex flex-wrap gap-2">
          {platforms.filter(p => p.connected).map(platform => (
            <div 
              key={platform.name} 
              className="flex items-center bg-green-50 border border-green-200 rounded-full px-3 py-1"
            >
              <img src={platform.icon} alt={platform.name} className="w-4 h-4 mr-1" />
              <span className="text-sm text-green-700">{platform.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-3 w-full max-w-md">
        <button
          onClick={() => setCurrentStep(steps.PASSPHRASE)}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleUnify}
          className="flex-1 py-3 px-4 bg-blue-500 rounded-lg font-semibold text-white hover:bg-blue-600"
        >
          Confirm & Create Model
        </button>
      </div>
      
      <p className="text-xs text-gray-500 max-w-md text-center">
        By proceeding, you agree to Onairos' <a href="https://onairos.uk/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline flex items-center inline-flex">
          Privacy Policy <ExternalLink size={12} className="ml-0.5" />
        </a>
      </p>
    </motion.div>
  );

  const renderUnifyingStep = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center space-y-6 p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900">Creating Your Personal AI Model</h2>
      <p className="text-gray-600 text-center">
        Please wait while we securely process your information
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
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md">
        <p className="text-sm text-blue-700">
          Your data is being encrypted with your passphrase and securely processed. This may take a few minutes.
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col items-center space-y-6 p-6 w-full">
      <AnimatePresence mode="wait">
        {currentStep === steps.CONNECT && renderConnectStep()}
        {currentStep === steps.PASSPHRASE && renderPassphraseStep()}
        {currentStep === steps.CONFIRM && renderConfirmStep()}
        {currentStep === steps.UNIFYING && renderUnifyingStep()}
      </AnimatePresence>
    </div>
  );
}
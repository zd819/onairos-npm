import React from 'react';

/**
 * UniversalOnboarding Component
 * Displays an onboarding screen for applications requesting Onairos data
 */
const UniversalOnboarding = ({ appIcon, appName }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 space-y-6">
        {appIcon && (
          <div className="flex justify-center">
            <img src={appIcon} alt={`${appName} icon`} className="w-20 h-20" />
          </div>
        )}
        
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-black">Connect with {appName}</h1>
          <p className="text-sm text-gray-600">
            To share your data with {appName}, you need to create an Onairos Personality model first.
          </p>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <a 
            href="https://onairos.uk/connections" 
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-black text-white rounded-md py-2 text-center font-medium hover:bg-black/90 transition-colors"
          >
            Create Personality Model
          </a>
        </div>
        
        <p className="text-xs text-center text-gray-500">
          Your data will be securely shared with {appName} only after your explicit consent.
        </p>
      </div>
    </div>
  );
};

export default UniversalOnboarding;

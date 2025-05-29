import React, { useEffect, useState, useRef } from 'react';
import { rsaEncrypt } from './RSA.jsx';
import EmailAuth from './components/EmailAuth.js';
import UniversalOnboarding from './components/UniversalOnboarding.js';
import PinSetup from './components/PinSetup.js';
import DataRequest from './components/DataRequest.js';

export function OnairosButton({
  requestData, 
  webpageName, 
  inferenceData = null, 
  onComplete = null, 
  autoFetch = true,
  proofMode = false, 
  textLayout = 'below', 
  textColor = 'white',
  login = false,
  buttonType = 'pill',
  loginReturn = null,
  loginType = 'signIn',
  visualType = 'full',
}) {

  const [showOverlay, setShowOverlay] = useState(false);
  const [currentFlow, setCurrentFlow] = useState('email'); // 'email' | 'onboarding' | 'pin' | 'dataRequest'
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check for existing user session
  useEffect(() => {
    const checkExistingSession = () => {
      const savedUser = localStorage.getItem('onairosUser');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setUserData(user);
          // If user has completed onboarding and PIN setup, go directly to data request
          if (user.onboardingComplete && user.pinCreated) {
            setCurrentFlow('dataRequest');
          } else if (user.verified && !user.onboardingComplete) {
            setCurrentFlow('onboarding');
          } else if (user.onboardingComplete && !user.pinCreated) {
            setCurrentFlow('pin');
          }
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          localStorage.removeItem('onairosUser');
        }
      }
    };

    checkExistingSession();
  }, []);

  const openTerminal = async () => {
    try {
      console.log('🔥 openTerminal called - showing overlay');
      setShowOverlay(true);
      console.log('🔥 setShowOverlay(true) called');
    } catch (error) {
      console.error('Error in openTerminal:', error);
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setError(null);
  };

  const handleEmailAuthSuccess = (authData) => {
    console.log('Email auth successful:', authData);
    const newUserData = {
      ...authData,
      verified: true,
      onboardingComplete: false,
      pinCreated: false
    };
    setUserData(newUserData);
    localStorage.setItem('onairosUser', JSON.stringify(newUserData));
    setCurrentFlow('onboarding');
  };

  const handleOnboardingComplete = () => {
    console.log('Onboarding completed');
    const updatedUserData = {
      ...userData,
      onboardingComplete: true
    };
    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));
    setCurrentFlow('pin');
  };

  const handlePinSetupComplete = (pinData) => {
    console.log('PIN setup completed:', pinData);
    const updatedUserData = {
      ...userData,
      ...pinData,
      pinCreated: true
    };
    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));
    setCurrentFlow('dataRequest');
  };

  const handleDataRequestComplete = (requestResult) => {
    console.log('Data request completed:', requestResult);
    
    // Update user data with request result
    const updatedUserData = {
      ...userData,
      lastDataRequest: requestResult
    };
    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));

    // Close overlay
    setShowOverlay(false);

    // Call onComplete callback if provided
    if (onComplete) {
      onComplete(requestResult);
    }
  };

  const renderCurrentFlow = () => {
    switch (currentFlow) {
      case 'email':
        return (
          <EmailAuth 
            onSuccess={handleEmailAuthSuccess}
            testMode={true} // Set to false in production
          />
        );
      
      case 'onboarding':
        return (
          <UniversalOnboarding 
            onComplete={handleOnboardingComplete}
            appIcon="https://onairos.sirv.com/Images/OnairosBlack.png"
          />
        );
      
      case 'pin':
        return (
          <PinSetup 
            onComplete={handlePinSetupComplete}
            userEmail={userData?.email}
          />
        );
      
      case 'dataRequest':
        return (
          <DataRequest 
            onComplete={handleDataRequestComplete}
            userEmail={userData?.email}
            requestData={requestData}
          />
        );
      
      default:
        return (
          <div className="flex flex-col items-center space-y-4 p-6">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        );
    }
  };

  // Styling and button class based on visual type
  const buttonClass = 
    `flex items-center justify-center font-bold rounded cursor-pointer ${
    buttonType === 'pill' ? 'px-4 py-2' : 'w-12 h-12'
    } bg-transparent OnairosConnect`;

  const buttonStyle = {
    flexDirection: textLayout === 'below' ? 'column' : 'row',
    backgroundColor: 'transparent',
    color: textColor,
    border: '1px solid transparent',
  };

  // Icon and text style based on the visualType
  const logoStyle = {
    width: '20px',
    height: '20px',
    marginRight: visualType === 'full' ? '12px' : '0',
  };

  const getText = () => {
    switch (loginType) {
      case 'signUp':
        return 'Sign Up with Onairos';
      case 'signOut':
        return 'Sign Out of Onairos';
      default:
        return 'Sign In with Onairos';
    }
  };

  return (
    <div className="flex items-center justify-center">
      <button
        className={buttonClass}
        onClick={openTerminal}
        style={buttonStyle}
      >
        {(visualType === 'full' || visualType === 'icon') && (
          <img
            src="https://onairos.sirv.com/Images/OnairosBlack.png"
            alt="Onairos Logo"
            style={logoStyle}
            className={`${buttonType === 'pill' ? 'w-6 h-6' : 'w-8 h-8'} object-contain`}
          />
        )}

        {(visualType === 'full' || visualType === 'textOnly') && (
          <span className={`${textColor === 'black' ? 'text-black' : 'text-white'} ${visualType === 'icon' ? 'sr-only' : ''} ${textLayout === 'right' ? 'ml-2' : textLayout === 'left' ? 'mr-2' : ''}`}>
            {getText()}
          </span>
        )}
      </button>

      {showOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {console.log('🔥 Rendering overlay!')}
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">
                {currentFlow === 'email' && 'Connect with Onairos'}
                {currentFlow === 'onboarding' && 'Account Setup'}
                {currentFlow === 'pin' && 'Secure Your Account'}
                {currentFlow === 'dataRequest' && 'Data Access Request'}
              </h2>
              <button 
                onClick={handleCloseOverlay}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              {renderCurrentFlow()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OnairosButton;
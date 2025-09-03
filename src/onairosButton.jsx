import React, { useEffect, useState } from 'react';
import EmailAuth from './components/EmailAuth.js';
import UniversalOnboarding from './components/UniversalOnboarding.jsx';
import PinSetup from './components/PinSetup.js';
import DataRequest from './components/DataRequest.js';
import TrainingComponent from './components/TrainingComponent.jsx';
import { formatOnairosResponse } from './utils/responseFormatter.js';
import { ModalPageLayout } from './components/ui/PageLayout.jsx';

export function OnairosButton({
  requestData, 
  webpageName, 
  inferenceData = null, 
  onComplete = null, 
  autoFetch = false,
  testMode = true, // Auto-enabled for design testing - set to false for production
  proofMode = false, 
  textLayout = 'below', 
  textColor = 'white',
  login = false,
  buttonType = 'pill',
  loginReturn = null,
  loginType = 'signIn',
  visualType = 'full',
  appIcon = null,
  enableTraining = true,
  formatResponse = true,
  responseFormat = { includeDictionary: true, includeArray: true }
}) {

  const [showOverlay, setShowOverlay] = useState(false);
  const [currentFlow, setCurrentFlow] = useState('email'); // 'email' | 'onboarding' | 'pin' | 'dataRequest' (training is within onboarding)
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  // Check for existing user session
  useEffect(() => {
    const checkExistingSession = () => {
      // In test mode, always start fresh to see the full flow
      if (testMode) {
        console.log('🧪 Test mode: Starting fresh flow, clearing any cached user data');
        localStorage.removeItem('onairosUser');
        setCurrentFlow('email');
        return;
      }
      
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
  }, [testMode]);

  const openTerminal = async () => {
    try {
      console.log('🔥 openTerminal called');
        setShowOverlay(true);
    } catch (error) {
      console.error('Error in openTerminal:', error);
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setError(null);
  };

  // Handle clicks on the backdrop to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseOverlay();
    }
  };

  const handleEmailAuthSuccess = (authData) => {
    console.log('🔥 Email auth successful:', authData);
    console.log('🔧 User State:', {
      isNewUser: authData.isNewUser,
      userState: authData.userState,
      flowType: authData.flowType,
      existingUser: authData.existingUser,
      hasAccountInfo: !!authData.accountInfo
    });
    
    // Determine flow based on API response - more explicit checking
    const isNewUser = authData.isNewUser === true || 
                     authData.existingUser === false || 
                     authData.flowType === 'onboarding' || 
                     authData.userState === 'new' ||
                     !authData.accountInfo; // No account info means new user
    
    console.log('🔍 Flow determination:', {
      finalDecision: isNewUser ? 'NEW USER → onboarding (data connectors)' : 'EXISTING USER → dataRequest (data permissions)',
      reasoning: {
        isNewUser: authData.isNewUser,
        existingUserFalse: authData.existingUser === false,
        flowTypeOnboarding: authData.flowType === 'onboarding',
        noAccountInfo: !authData.accountInfo
      }
    });
    
    const newUserData = {
      ...authData,
      verified: true,
      onboardingComplete: !isNewUser, // New users need onboarding, returning users have completed it
      pinCreated: !isNewUser // Assume returning users have PIN, new users need to create it
    };
    
    setUserData(newUserData);
    localStorage.setItem('onairosUser', JSON.stringify(newUserData));
    
    // Flow decision logic - prioritize new user detection
    if (isNewUser) {
      console.log('🚀 NEW USER detected → Starting onboarding flow (data connectors page)');
      setCurrentFlow('onboarding');
    } else {
      console.log('👋 EXISTING USER detected → Going directly to data request (data permissions page)');
      setCurrentFlow('dataRequest');
    }
  };

  const handleOnboardingComplete = (onboardingData) => {
    console.log('Onboarding completed:', onboardingData);
    const updatedUserData = {
      ...userData,
      onboardingComplete: true,
      connectedAccounts: onboardingData.connectedAccounts || []
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
    
    // Move to data request flow within the same overlay
    setCurrentFlow('dataRequest');
  };

  const handleTrainingComplete = (trainingResult) => {
    console.log('🎓 Training completed:', trainingResult);
    const updatedUserData = {
      ...userData,
      trainingCompleted: true,
      ...trainingResult
    };
    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));
    
    // Move to data request after training
    setCurrentFlow('dataRequest');
  };

  const handleDataRequestComplete = (requestResult) => {
    console.log('🔥 OnairosButton: Data request completed:', requestResult);
    
    // Update user data with request result
    const updatedUserData = {
      ...userData,
      lastDataRequest: requestResult
    };
    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));

    // Close overlay
    setShowOverlay(false);

    // Format response if requested and API response is present
    let formattedResult = requestResult;
    if (formatResponse && requestResult?.apiResponse) {
      try {
        formattedResult = {
          ...requestResult,
          apiResponse: formatOnairosResponse(requestResult.apiResponse, responseFormat)
        };
        console.log('🔥 Response formatted with dictionary:', formattedResult.apiResponse?.personalityDict || 'No personality data');
      } catch (error) {
        console.warn('🔥 Error formatting response:', error);
        // Continue with original result if formatting fails
      }
    }

    // Call onComplete callback if provided
    console.log('🔥 Calling onComplete callback with:', formattedResult);
    if (onComplete) {
      try {
        onComplete(formattedResult);
        console.log('🔥 onComplete callback executed successfully');
      } catch (error) {
        console.error('🔥 Error in onComplete callback:', error);
      }
    } else {
      console.log('🔥 No onComplete callback provided');
    }
  };

  const getFlowTitle = () => {
    switch (currentFlow) {
      case 'email':
        return ''; // EmailAuth handles its own titles
      case 'onboarding':
        return 'Connect Your Data';
      case 'pin':
        return 'Secure Your Account';
      case 'training':
        return 'Training Your Model';
      case 'dataRequest':
        return 'Data Request';
      default:
        return '';
    }
  };

  const getFlowSubtitle = () => {
    switch (currentFlow) {
      case 'email':
        return ''; // EmailAuth handles its own subtitles
      case 'onboarding':
        return 'Choose which accounts to connect for a personalized experience';
      case 'pin':
        return 'Create a secure PIN to protect your data';
      case 'training':
        return 'Building your personalized insights';
      case 'dataRequest':
        return `Select the data you want to share with ${webpageName}`;
      default:
        return '';
    }
  };

  const getFlowIcon = () => {
    switch (currentFlow) {
      case 'email':
        return ''; // EmailAuth handles its own layout
      case 'onboarding':
        return '🔗';
      case 'pin':
        return '🔒';
      case 'training':
        return '⚡';
      case 'dataRequest':
        return '📊';
      default:
        return '';
    }
  };

  const renderCurrentFlow = () => {
    switch (currentFlow) {
      case 'email':
        return (
          <EmailAuth 
            onSuccess={handleEmailAuthSuccess}
            testMode={testMode} // Use the testMode prop from initialization
          />
        );
      
      case 'onboarding':
        return (
          <UniversalOnboarding 
            onComplete={handleOnboardingComplete}
            appIcon={appIcon || "https://onairos.sirv.com/Images/OnairosBlack.png"}
            appName={webpageName}
            username={userData?.email || userData?.username}
            testMode={testMode}
          />
        );
      
      case 'pin':
        return (
          <PinSetup 
            onComplete={handlePinSetupComplete}
            userEmail={userData?.email}
          />
        );
      
      case 'training':
        return (
          <TrainingComponent 
            onComplete={handleTrainingComplete}
            userEmail={userData?.email}
            appName={webpageName}
            connectedAccounts={userData?.connectedAccounts || []}
            testMode={testMode}
          />
        );
      
      case 'dataRequest':
        return (
          <DataRequest 
            onComplete={handleDataRequestComplete}
            userEmail={userData?.email}
            requestData={requestData}
            appName={webpageName}
            autoFetch={autoFetch}
            testMode={testMode}
            appIcon={appIcon}
            connectedAccounts={userData?.connectedAccounts || {}}
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
    <>
      <button
        className={buttonClass}
        onClick={openTerminal}
        style={buttonStyle}
      >
        {(visualType === 'full' || visualType === 'icon') && (
          <img
            src={login ? "https://onairos.sirv.com/Images/OnairosWhite.png" : "https://onairos.sirv.com/Images/OnairosBlack.png"}
            alt="Onairos Logo"
            style={logoStyle}
          />
        )}
        {visualType !== 'icon' && (
          <span className={`${textColor === 'black' ? 'text-black' : 'text-white'} ${visualType === 'icon' ? 'sr-only' : ''} ${textLayout === 'right' ? 'ml-2' : textLayout === 'left' ? 'mr-2' : ''}`}>
            {getText()}
          </span>
        )}
      </button>

      {/* Modal with New Design */}
      {showOverlay && (
        <ModalPageLayout
          visible={showOverlay}
          onClose={handleCloseOverlay}
          showBackButton={currentFlow !== 'email' && currentFlow !== 'dataRequest'}
          onBack={() => {
            if (currentFlow === 'onboarding') setCurrentFlow('email');
            if (currentFlow === 'pin') setCurrentFlow('onboarding'); 
            if (currentFlow === 'training') setCurrentFlow('pin');
          }}
          title={getFlowTitle()}
          subtitle={getFlowSubtitle()}
          icon={getFlowIcon()}
          centerContent={true}
        >
          {renderCurrentFlow()}
        </ModalPageLayout>
      )}
    </>
  );
}

export default OnairosButton;
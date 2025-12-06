import React, { useEffect, useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import EmailAuth from './components/EmailAuth.js';
import UniversalOnboarding from './components/UniversalOnboarding.jsx';
import PinSetup from './components/PinSetup.js';
import DataRequest from './components/DataRequest.js';
import TrainingComponent from './components/TrainingComponent.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import WrappedLoadingPage from './components/WrappedLoadingPage.jsx';
import { formatOnairosResponse } from './utils/responseFormatter.js';
import { logFormattedUserData } from './utils/userDataFormatter.js';
import { ModalPageLayout } from './components/ui/PageLayout.jsx';

export function OnairosButton({
  requestData, 
  webpageName, 
  inferenceData = null, 
  onComplete = null, 
  autoFetch = true, // Auto-enabled for seamless testing experience
  testMode = false, // Production mode by default - set to true for testing
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
  responseFormat = { includeDictionary: true, includeArray: true },
  priorityPlatform = null, // Platform to prioritize (e.g., 'gmail', 'pinterest', 'linkedin')
  rawMemoriesOnly = false, // Show only LLM connections when true
  rawMemoriesConfig = null, // Configuration for RAW memories collection
  time = false // Show time frequency slider (default: false)
}) {

  const [showOverlay, setShowOverlay] = useState(false);
  const [currentFlow, setCurrentFlow] = useState('welcome'); // 'welcome' | 'email' | 'onboarding' | 'pin' | 'dataRequest' | 'wrappedLoading' (training is within onboarding)
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  // Check for existing user session
  useEffect(() => {
    const checkExistingSession = () => {
      // In test mode, always start fresh to see the full flow
      if (testMode) {
        console.log('🧪 Test mode: Starting fresh flow, clearing any cached user data');
        localStorage.removeItem('onairosUser');
        setCurrentFlow('welcome');
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
      console.log('🔥 openTerminal called - resetting flow');
      console.log('🔥 testMode prop:', testMode);
      console.log('🔥 window.onairosApiKey:', window.onairosApiKey);
      // ALWAYS reset flow on open to start fresh every time
      setCurrentFlow('welcome');
      setUserData(null);
      try { localStorage.removeItem('onairosUser'); } catch {}
        setShowOverlay(true);
    } catch (error) {
      console.error('Error in openTerminal:', error);
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setError(null);
    // Reset flow and session so next open starts fresh
    setCurrentFlow('welcome');
    try { localStorage.removeItem('onairosUser'); } catch {}
    setUserData(null);
  };

  // Handle clicks on the backdrop to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseOverlay();
    }
  };

  const handleWelcomeContinue = () => {
    console.log('🔥 Welcome screen continue clicked');
    setCurrentFlow('email');
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

    // Save identity-bearing JWT immediately (email/id/userId/sub)
    try {
      const candidate = authData.jwtToken || authData.token || authData.accessToken;
      if (candidate) {
        const base64 = candidate.split('.')[1];
        if (base64) {
          const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')));
          if (payload && (payload.email || payload.id || payload.userId || payload.sub)) {
            try { localStorage.setItem('onairos_user_token', candidate); } catch {}
            console.log('✅ [OnairosButton] Identity JWT saved from email auth');
          } else {
            console.warn('⚠️ [OnairosButton] Email auth returned minimal token (no id/email)');
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ [OnairosButton] Failed to parse/save email auth token');
    }
    
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
    
    // Ensure token is stored in userData and localStorage
    const emailToken = authData.token || authData.jwtToken || authData.accessToken;
    if (emailToken) {
      newUserData.token = emailToken;
      try {
        localStorage.setItem('onairos_user_token', emailToken);
        console.log('✅ Token from email verification saved to localStorage');
      } catch (e) {
        console.warn('⚠️ Could not save token to localStorage:', e);
      }
    }
    
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

  const handlePinSetupComplete = async (pinData) => {
    console.log('PIN setup completed:', pinData);
    const updatedUserData = {
      ...userData,
      ...pinData,
      pinCreated: true
    };
    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));
    
    // 🔥 FIX: Don't trigger training here - wait for user to approve data request
    console.log('✅ PIN created - moving to data request (training will start after approval)');
    
    // Go directly to data request - user must approve before training starts
    setCurrentFlow('dataRequest');
  };

  const handleLoadingComplete = () => {
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

  const handleDataRequestComplete = async (requestResult) => {
    console.log('🔥 OnairosButton: Data request completed:', requestResult);
    
    // Update user data with request result
    const updatedUserData = {
      ...userData,
      lastDataRequest: requestResult
    };
    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));

    // Handle data fetching if autoFetch is enabled
    let finalResult = requestResult;
    
    if (autoFetch && requestResult.approved?.length > 0) {
      console.log('🚀 Auto-fetching data from Onairos API...');
      
      try {
        // 1. Get the API URL from the backend
        const urlResponse = await fetch('https://api2.onairos.uk/getAPIurlMobile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            Info: {
              appId: webpageName,
              account: userData?.email || userData?.username,
              confirmations: requestResult.approved.map(id => ({ data: id === 'personality' ? 'Large' : id === 'basic' ? 'Basic' : id })),
              EncryptedUserPin: userData?.EncryptedUserPin || 'pending_pin_integration',
              storage: 's3',
              proofMode: proofMode
            }
          })
        });

        const urlData = await urlResponse.json();
        console.log('🔗 API URL received:', urlData.apiUrl);

        if (urlData.apiUrl && urlData.token) {
          // Show wrapped loading page when API call starts
          setCurrentFlow('wrappedLoading');
          
          // Emit custom event for host app
          if (typeof window !== 'undefined') {
            const eventDetail = { apiUrl: urlData.apiUrl, approved: requestResult.approved };
            window.dispatchEvent(new CustomEvent('onairos-api-call-start', { detail: eventDetail }));
            console.log('📡 Emitted onairos-api-call-start event');
          }
          
          // 2. Fetch the actual data
          // IMPORTANT: This endpoint can take 1-3 minutes as it runs Python LLM scripts
          // We MUST wait for the actual response before proceeding
          // Always use POST for consistency and to support body data
          // traits-only endpoint requires POST
          const method = 'POST';
          
          console.log(`📡 Fetching data from ${urlData.apiUrl} (${method})...`);
          console.log(`🔑 Using token: ${urlData.token ? urlData.token.substring(0, 20) + '...' : 'NO TOKEN'}`);
          console.log(`⏳ Waiting for backend response - this may take 1-3 minutes for LLM processing...`);
          
          let dataResponse;
          let apiResponse;
          let fetchCompleted = false;
          let fetchError = null;
          
          try {
            // CRITICAL: Wait for the actual fetch response - don't proceed until we get data or a real error
            // The backend Python script needs time to generate the wrapped dashboard
            console.log(`🔄 Starting fetch request - will wait for complete response...`);
            
            // Create abort controller with 5-minute timeout for LLM-heavy endpoints
            // This prevents the BROWSER from timing out, even if the server might
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

            try {
              dataResponse = await fetch(urlData.apiUrl, {
                method: method,
                headers: {
                  'Authorization': `Bearer ${urlData.token}`,
                  'Content-Type': 'application/json'
                },
                // Only send body for POST
                body: method === 'POST' ? JSON.stringify({
                  email: userData?.email,
                  includeLlmData: requestResult.approved.includes('rawMemories')
                }) : undefined,
                signal: controller.signal
              });
            } finally {
              clearTimeout(timeoutId);
            }

            console.log(`📥 Response status: ${dataResponse.status} ${dataResponse.statusText}`);
            console.log(`📥 Response headers:`, Object.fromEntries(dataResponse.headers.entries()));

            // Check for 504 Gateway Timeout - implies backend is still working
            if (dataResponse.status === 504) {
               console.warn('⏱️ 504 Gateway Timeout received - Backend is likely still processing');
               throw new Error('Gateway Timeout (504) - Backend processing continued');
            }

            // CRITICAL: Check if response is ok before parsing JSON
            if (!dataResponse.ok) {
              throw new Error(`HTTP ${dataResponse.status}: ${dataResponse.statusText}`);
            }

            // CRITICAL: Wait for JSON parsing to complete
            apiResponse = await dataResponse.json();
            
            // Mark fetch as completed successfully
            fetchCompleted = true;
            
            console.log('✅✅✅ API RESPONSE FULLY RECEIVED AND PARSED');
            console.log('📦📦📦 FULL API RESPONSE RECEIVED:', JSON.stringify(apiResponse, null, 2));
            console.log('📦 Data received - has slides?', !!apiResponse.slides);
            console.log('📦 Data received - slides keys:', apiResponse.slides ? Object.keys(apiResponse.slides) : 'NO SLIDES');
            
          } catch (fetchErr) {
            // Mark that we encountered an error during fetch
            fetchError = fetchErr;
            fetchCompleted = false;
            
            console.error('🚨 FETCH ERROR:', fetchErr);
            console.error('🚨 Error name:', fetchErr.name);
            console.error('🚨 Error message:', fetchErr.message);
            
            // Check if it's a timeout error (504 Gateway Timeout)
            if (fetchErr.message?.includes('504') || fetchErr.message?.includes('Gateway Timeout')) {
              console.error('⏱️⏱️⏱️ GATEWAY TIMEOUT (504) - Backend is still processing');
              console.error('⏱️ This means the backend Python LLM script is still running');
              console.error('⏱️ DO NOT fall back to mocks yet - backend is generating data');
              // Don't set apiResponse to null yet - we want to retry or wait
              apiResponse = null;
              
              // Flag this as a timeout specifically so the app knows to wait/retry
              requestResult.isTimeout = true;
            }
            // If it's a CORS error, the backend is returning data but browser blocks it
            else if (fetchErr.message?.includes('CORS') || fetchErr.message?.includes('Failed to fetch')) {
              console.error('🚨🚨🚨 CORS BLOCKING RESPONSE - Backend generated data but browser cannot read it');
              console.error('🚨 This usually means a 504/502 timeout from load balancer stripping headers');
              console.error('🚨 Backend successfully generated dashboard (see server logs)');
              
              // Even though fetch failed, we still have the token and URL
              // Set apiResponse to null but keep token and apiUrl for retry
              apiResponse = null;
              
              // Treat CORS errors on this endpoint as timeouts/processing
              // The backend likely finished but the LB cut the connection
              requestResult.isTimeout = true;
            } else {
              // For other errors, still set to null but log the error
              console.error('❌ Fetch failed with error:', fetchErr);
              apiResponse = null;
            }
          }
          
          // CRITICAL: Log fetch completion status
          if (fetchCompleted) {
            console.log('✅✅✅ FETCH COMPLETED SUCCESSFULLY - Response data is ready');
          } else if (requestResult.isTimeout) {
             console.log('⏱️⏱️⏱️ REQUEST TIMED OUT - Passing timeout flag to app');
          } else if (fetchError) {
            console.error('❌❌❌ FETCH FAILED - Response data is NOT ready');
            console.error('❌ Error details:', fetchError);
          } else {
            console.warn('⚠️⚠️⚠️ FETCH STATUS UNKNOWN - This should not happen');
          }

          // Merge into result - include token and apiUrl even if fetch failed
          finalResult = {
            ...requestResult,
            apiResponse: apiResponse, // Raw response (null if CORS blocked)
            token: urlData.token,     // Token used - ALWAYS include this
            apiUrl: urlData.apiUrl    // URL used - ALWAYS include this
          };
          
          console.log('🔗🔗🔗 FINAL RESULT WITH API RESPONSE:', JSON.stringify(finalResult, null, 2));
          console.log('🔗 Final result - apiResponse present?', !!finalResult.apiResponse);
          console.log('🔗 Final result - apiResponse.slides?', !!finalResult.apiResponse?.slides);
          
          // Add to updated user data - include token even if apiResponse is null
          updatedUserData.apiResponse = apiResponse;
          if (urlData.token) {
            updatedUserData.token = urlData.token;
            // Also store in localStorage for persistence
            try {
              localStorage.setItem('onairos_user_token', urlData.token);
            } catch (e) {
              console.warn('⚠️ Could not store token in localStorage:', e);
            }
          }
          setUserData(updatedUserData);
          
          console.log('💾 Updated userData with apiResponse:', !!updatedUserData.apiResponse);
          console.log('💾 Updated userData with token:', !!updatedUserData.token);
        } else {
          console.warn('⚠️ Failed to get API URL:', urlData);
        }
      } catch (fetchError) {
        console.error('❌ Error auto-fetching data:', fetchError);
        
        // Check if it's a timeout/abort error
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
          console.error('⏱️ Request timed out - backend took longer than 2 minutes');
        }
        // Check if it's a CORS error
        else if (fetchError.message?.includes('CORS') || 
                 fetchError.message?.includes('Failed to fetch') ||
                 fetchError.name === 'TypeError') {
          console.error('🚨 CORS ERROR DETECTED');
          console.error('🚨 Backend needs to allow CORS for:', window.location.origin);
        }
        
        // Continue with what we have - don't block the flow
        // The app can still proceed without apiResponse
      }
    }

    console.log('🔥 OnairosButton: Data request completed:', requestResult);
    console.log('🔥 OnairosButton: Final result before callback:', finalResult);

    // Decide whether to keep the overlay open (wrappedLoading) or close it
    const shouldKeepOverlayOpen = autoFetch && requestResult.approved?.length > 0 && (
      requestResult.isTimeout === true || !finalResult?.apiResponse?.slides
    );

    if (shouldKeepOverlayOpen) {
      console.log('⏱️ Keeping overlay open on wrappedLoading page while backend finishes');
    } else {
    console.log('🔥 Closing overlay after data request completion');
    // Use centralized close to also reset flow and session
    handleCloseOverlay();
    }

    // Format response if requested and API response is present
    let formattedResult = finalResult;
    if (formatResponse && finalResult?.apiResponse) {
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

    // Ensure token is included from userData if not already in finalResult
    if (!finalResult.token && updatedUserData.token) {
      finalResult.token = updatedUserData.token;
      console.log('🔑 Added token from userData to finalResult');
    }
    
    // Also check localStorage as fallback
    if (!finalResult.token) {
      try {
        const storedToken = localStorage.getItem('onairos_user_token');
        if (storedToken) {
          finalResult.token = storedToken;
          console.log('🔑 Added token from localStorage to finalResult');
        }
      } catch (e) {
        console.warn('⚠️ Could not read token from localStorage:', e);
      }
    }
    
    // Add user data to the result for comprehensive formatting
    const completeResult = {
      ...formattedResult,
      token: finalResult.token || formattedResult.token || updatedUserData.token, // Ensure token is at root level
      userData: updatedUserData
    };

    // Enhanced user data formatting for better display
    let enhancedResult = completeResult;
    try {
    // Log formatted user data for better readability
        enhancedResult = logFormattedUserData(completeResult);
    } catch (formatError) {
        console.warn('⚠️ Error formatting user data for display:', formatError);
        // Continue with unformatted result to ensure app doesn't break
    }
    
    // Ensure token is still present after formatting
    if (!enhancedResult.token && completeResult.token) {
      enhancedResult.token = completeResult.token;
    }
    if (!enhancedResult.token && updatedUserData.token) {
      enhancedResult.token = updatedUserData.token;
    }

    // Call onComplete callback if provided
    console.log('🔥 Calling onComplete callback');
    console.log('🔥 onComplete data structure:', {
      token: enhancedResult.token ? '✅ Present (JWT string)' : '❌ Missing',
      apiUrl: enhancedResult.apiUrl ? '✅ Present (URL string)' : '❌ Missing',
      apiResponse: enhancedResult.apiResponse ? '✅ Present (object)' : '❌ Missing',
      userData: enhancedResult.userData ? '✅ Present (object)' : '❌ Missing',
      userDataToken: enhancedResult.userData?.token ? '✅ Present in userData' : '❌ Missing',
      success: enhancedResult.success,
      testMode: enhancedResult.testMode,
      allKeys: Object.keys(enhancedResult)
    });
    
    if (onComplete) {
      try {
        onComplete(enhancedResult);
        console.log('🔥 onComplete callback executed successfully with enhanced formatting');
      } catch (error) {
        console.error('🔥 Error in onComplete callback:', error);
      }
    } else {
      console.log('🔥 No onComplete callback provided');
    }
  };

  const getFlowTitle = () => {
    switch (currentFlow) {
      case 'welcome':
        return ''; // WelcomeScreen handles its own titles
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
      case 'welcome':
        return ''; // WelcomeScreen handles its own subtitles
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
      case 'welcome':
        return ''; // WelcomeScreen handles its own layout
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
      case 'welcome':
        return (
          <WelcomeScreen 
            onContinue={handleWelcomeContinue}
            onClose={handleCloseOverlay}
            webpageName={webpageName}
            appIcon={appIcon}
            testMode={testMode}
          />
        );
      case 'email':
        return (
          <div className="h-[min(85vh,700px)]">
          <EmailAuth 
            onSuccess={handleEmailAuthSuccess}
            testMode={testMode} // Use the testMode prop from initialization
          />
          </div>
        );
      
      case 'onboarding':
        return (
          <UniversalOnboarding 
            onComplete={handleOnboardingComplete}
            onBack={() => setCurrentFlow('email')}
            appIcon={appIcon || "https://onairos.sirv.com/Images/OnairosBlack.png"}
            appName={webpageName}
            username={userData?.email || userData?.username}
            testMode={testMode}
            priorityPlatform={priorityPlatform}
            rawMemoriesOnly={rawMemoriesOnly}
            rawMemoriesConfig={rawMemoriesConfig}
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
        console.log('🔍 [DEBUG] Rendering DataRequest with userData:', {
          email: userData?.email,
          userName: userData?.userName,
          hasUserData: !!userData,
          userDataKeys: userData ? Object.keys(userData) : []
        });
        return (
          <DataRequest 
            onComplete={handleDataRequestComplete}
            userEmail={userData?.email || userData?.userName}
            requestData={requestData}
            appName={webpageName}
            autoFetch={autoFetch}
            testMode={testMode}
            appIcon={appIcon}
            connectedPlatforms={userData?.connectedAccounts || {}}
            rawMemoriesOnly={rawMemoriesOnly}
            rawMemoriesConfig={rawMemoriesConfig}
            showTime={time}
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
        <>
          {currentFlow === 'email' ? (
            // Special case for email - render directly without PageLayout wrapper
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center p-6" style={{ zIndex: 2147483647 }}>
              <div className="bg-white rounded-3xl w-full max-w-lg mx-auto shadow-2xl overflow-hidden flex flex-col" style={{ maxWidth: '500px', height: '90vh' }}>
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4 flex-shrink-0">
                  <button
                    onClick={handleCloseOverlay}
                    className="absolute left-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Email Content */}
                <div className="h-[min(85vh,700px)]">
                  <EmailAuth 
                    onSuccess={handleEmailAuthSuccess}
                    testMode={testMode}
                  />
                </div>
              </div>
            </div>
          ) : currentFlow === 'onboarding' ? (
            // Special case for onboarding - render directly without PageLayout wrapper
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center p-6" style={{ zIndex: 2147483647 }}>
              <div className="bg-white rounded-3xl w-full max-w-lg mx-auto shadow-2xl overflow-hidden flex flex-col" style={{ maxWidth: '500px', height: '90vh' }}>
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4 flex-shrink-0">
                  <button
                    onClick={() => setCurrentFlow('email')}
                    className="absolute left-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                {/* Onboarding Content */}
                <UniversalOnboarding 
                  onComplete={handleOnboardingComplete}
                  onBack={() => setCurrentFlow('email')}
                  appIcon={appIcon || "https://onairos.sirv.com/Images/OnairosBlack.png"}
                  appName={webpageName}
                  username={userData?.email || userData?.username}
                  testMode={testMode}
                  priorityPlatform={priorityPlatform}
                  rawMemoriesOnly={rawMemoriesOnly}
                  rawMemoriesConfig={rawMemoriesConfig}
                />
              </div>
            </div>
          ) : currentFlow === 'dataRequest' ? (
            // Special case for dataRequest - render directly without PageLayout wrapper
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center p-6" style={{ zIndex: 2147483647 }}>
              <div className="bg-white rounded-3xl w-full max-w-lg mx-auto shadow-2xl overflow-hidden flex flex-col" style={{ maxWidth: '500px', height: '90vh' }}>
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4 flex-shrink-0">
                  <button
                    onClick={() => setCurrentFlow('onboarding')}
                    className="absolute left-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                {/* DataRequest Content */}
                <DataRequest 
                  onComplete={handleDataRequestComplete}
                  userEmail={userData?.email || userData?.userName}
                  requestData={requestData}
                  appName={webpageName}
                  autoFetch={autoFetch}
                  testMode={testMode}
                  appIcon={appIcon}
                  connectedPlatforms={userData?.connectedAccounts || {}}
                  rawMemoriesOnly={rawMemoriesOnly}
                  rawMemoriesConfig={rawMemoriesConfig}
                  showTime={time}
                />
              </div>
            </div>
          ) : currentFlow === 'wrappedLoading' ? (
            // Special case for wrapped loading - render directly without PageLayout wrapper
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center p-6" style={{ zIndex: 2147483647 }}>
              <div className="bg-white rounded-3xl w-full max-w-lg mx-auto shadow-2xl overflow-hidden flex flex-col" style={{ maxWidth: '500px', height: '90vh' }}>
                {/* WrappedLoading Content */}
                <div className="flex-1 min-h-0">
                  <WrappedLoadingPage />
                </div>
              </div>
            </div>
          ) : currentFlow === 'pin' ? (
            // Special case for pin - render directly without PageLayout wrapper
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center p-6" style={{ zIndex: 2147483647 }}>
              <div className="bg-white rounded-3xl w-full max-w-lg mx-auto shadow-2xl overflow-hidden flex flex-col" style={{ maxWidth: '500px', height: '90vh' }}>
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4 flex-shrink-0">
                  <button
                    onClick={() => setCurrentFlow('onboarding')}
                    className="absolute left-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                {/* PinSetup Content - Must take remaining height */}
                <div className="flex-1 min-h-0">
                  <PinSetup 
                    onComplete={handlePinSetupComplete}
                    onBack={() => setCurrentFlow('onboarding')}
                    userEmail={userData?.email}
                  />
                </div>
            </div>
          </div>
          ) : currentFlow === 'loading' ? (
            // Loading screen
            <LoadingScreen onComplete={handleLoadingComplete} />
        ) : (
            // All other flows use PageLayout wrapper
          <ModalPageLayout
            visible={showOverlay}
            onClose={handleCloseOverlay}
              showBackButton={currentFlow === 'training'}
            onBack={() => {
                if (currentFlow === 'email') setCurrentFlow('welcome');
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
      )}
    </>
  );
}

export default OnairosButton;
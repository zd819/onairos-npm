import React, { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
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
import { isMobileApp, isMobileBrowser } from './utils/capacitorDetection.js';

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
  const [oauthReturnDetected, setOauthReturnDetected] = useState(false);
  
  // Detect mobile for conditional styling (MOBILE ONLY changes)
  // Use a safer check that doesn't rely on window/navigator being immediately available
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  useEffect(() => {
    // Determine mobile vs desktop based on viewport width + native runtime,
    // and keep it updated on resize.
    const computeMobile = () => {
      try {
        const hasWindow = typeof window !== 'undefined';
        if (!hasWindow) {
          setIsMobileDevice(false);
          return;
        }

        // Base width from current window
        let width = window.innerWidth || document.documentElement?.clientWidth || document.body?.clientWidth || 0;

        // If running inside an iframe, try to use the parent window width as well
        // so desktop pages embedding the SDK don't get misclassified as mobile.
        try {
          if (window.parent && window.parent !== window && window.parent.innerWidth) {
            width = Math.max(width, window.parent.innerWidth);
          }
        } catch (_) {
          // Cross-origin access can fail; ignore and fall back to local width.
        }

        const isCapNative = !!window.Capacitor?.isNativePlatform?.();

        // ✅ Final, explicit rule:
        // - Capacitor native: ALWAYS mobile
        // - Otherwise: viewport < 1024px (taking parent if available) → mobile; >= 1024px → desktop
        const detectedMobile = isCapNative || width < 1024;

        console.log('[Onairos SDK][Layout][MobileDetection simple]', {
          width,
          isCapNative,
          detectedMobile,
        });

        setIsMobileDevice(detectedMobile);
      } catch (e) {
        setIsMobileDevice(false);
      }
    };

    computeMobile();

    // Desktop resize listener to keep classification accurate when user resizes window.
    // This runs in all environments, but the rule above ensures iPhone/Capacitor
    // keep their correct classification.
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', computeMobile);
      return () => window.removeEventListener('resize', computeMobile);
    }
  }, []);

  // Lock background scroll on DESKTOP while modal is open (do not touch mobile/Capacitor)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const body = document.body;
    if (!body) return;

    if (showOverlay && !isMobileDevice) {
      // Remember previous overflow so we can restore it precisely
      if (!body.dataset.onairosPrevOverflow) {
        body.dataset.onairosPrevOverflow = body.style.overflow || '';
      }
      body.style.overflow = 'hidden';
    } else {
      // Restore previous overflow when modal closes or when switching back to mobile
      if (body.dataset.onairosPrevOverflow !== undefined) {
        body.style.overflow = body.dataset.onairosPrevOverflow;
        delete body.dataset.onairosPrevOverflow;
      }
    }
  }, [showOverlay, isMobileDevice]);

  // 🔍 High-level layout debug for desktop vs mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    const isDesktop = width >= 1024 && !isMobileDevice;
    console.log('[Onairos SDK][Layout][OnairosButton state]', {
      width,
      isDesktop,
      isMobileDevice,
      currentFlow,
      showOverlay,
    });
  }, [isMobileDevice, currentFlow, showOverlay]);

  // 🔍 DOM-level layout debug (only on desktop web)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    const isDesktopWeb = width >= 1024 && !isMobileDevice && !window.Capacitor?.isNativePlatform?.();
    if (!isDesktopWeb || !showOverlay) return;

    // Defer to allow React layout to flush
    const id = window.setTimeout(() => {
      try {
        const modal = document.querySelector('.onairos-modal');
        const pageContent = document.querySelector('.onairos-page-content');
        const shell = document.querySelector('.onairos-modal-shell');

        const getMetrics = (el) => {
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          return {
            width: rect.width,
            height: rect.height,
            maxWidth: styles.maxWidth,
            paddingInline: styles.paddingLeft + ' / ' + styles.paddingRight,
            classList: Array.from(el.classList || []),
          };
        };

        console.log('[Onairos SDK][Layout][DOM snapshot]', {
          currentFlow,
          viewportWidth: width,
          modal: getMetrics(modal),
          pageContent: getMetrics(pageContent),
          shell: getMetrics(shell),
        });
      } catch (e) {
        console.log('[Onairos SDK][Layout][DOM snapshot] failed', e?.message);
      }
    }, 0);

    return () => window.clearTimeout(id);
  }, [currentFlow, showOverlay, isMobileDevice]);
  
  // Logic to process return URLs (Login & Connectors)
  const handleDeepLink = (url) => {
      try {
        console.log('🔍 Checking URL for OAuth return:', url);
        
        // Normalize URL to check for params
        // For native apps, url might be 'mobiletest://oauth-callback?success=true...'
        // Also check specifically for Reddit's return format or other providers
        const hasSuccess = url.includes('success=true') || 
                          url.includes('onairos_oauth_success=true') ||
                          (url.includes('state=') && url.includes('code='));
        
        const hasError = url.includes('error=') || url.includes('onairos_oauth_error=');
        const isPopup = url.includes('is_popup=true'); // Check for our custom flag
        
        // Safety Check: If we are running inside a popup or iframe (desktop), we should close ourselves
        // and notify the parent. This happens if the callback redirected instead of closing.
        // We check for window.opener, parent!=window, OR our explicit is_popup flag
        if ((hasSuccess || hasError) && typeof window !== 'undefined' && 
            (window.opener || window.parent !== window || isPopup)) {
             console.log('🚨 App loaded inside OAuth popup/iframe (detected via opener/parent/flag) - closing');
             
             // Extract params for storage/message
             let params;
             try {
                const qIdx = url.indexOf('?');
                if (qIdx !== -1) params = new URLSearchParams(url.substring(qIdx + 1));
                else params = new URL(url).searchParams;
             } catch(e) { params = new URLSearchParams(''); }
             
             const platform = params.get('platform') || params.get('onairos_oauth_platform');
             const email = params.get('email') || params.get('onairos_oauth_email');
             
             // 1. Write to LocalStorage (Same Origin as Parent) - Primary mechanism for cross-origin flow fallback
             if (hasSuccess && platform) {
                 localStorage.setItem(`onairos_${platform}_success`, 'true');
                 localStorage.setItem(`onairos_${platform}_timestamp`, Date.now().toString());
                 if (email) localStorage.setItem(`onairos_${platform}_email`, email);
             }
             
             // 2. Try postMessage (only works if opener exists)
             try {
                const target = window.opener || window.parent;
                if (target) {
                    target.postMessage({
                        type: hasSuccess ? 'oauth-success' : 'oauth-error',
                        platform: platform,
                        email: email,
                        error: params.get('error'),
                        success: !!hasSuccess
                    }, '*');
                }
             } catch (e) {}

             // 3. Close window
             window.close();
             // If window.close() is blocked (scripts can't close windows they didn't open),
             // show a message asking user to close.
             setTimeout(() => {
                 document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:sans-serif;"><h1>Success!</h1><p>You can close this window now.</p><button onclick="window.close()" style="padding:10px 20px;margin-top:20px;cursor:pointer;">Close Window</button></div>';
             }, 500);
             
             return; // Stop execution here
        }
        
        if (hasSuccess) {
           console.log('✅ Deep link/OAuth return detected:', url);
           
           // Close browser if open (Capacitor) - Important for Native
           Browser.close().catch(() => {});

           // Extract params from URL
           let params;
           try {
             // Handle custom schemes that URL() constructor might reject if not fully standard
             const questionMarkIndex = url.indexOf('?');
             if (questionMarkIndex !== -1) {
                params = new URLSearchParams(url.substring(questionMarkIndex + 1));
             } else {
                params = new URL(url).searchParams;
             }
           } catch (e) {
             console.warn('URL parsing failed, trying fallback split:', e);
             params = new URLSearchParams(url.split('?')[1] || '');
           }

           let platform = params.get('platform') || params.get('onairos_oauth_platform') || 'google';
           let email = params.get('email') || params.get('onairos_oauth_email');
           
           // Fallback for Reddit/others that might rely on state
           if (!platform || platform === 'null') {
              const state = params.get('state');
              if (state) {
                 try {
                    // Try to decode state if it's base64
                    const decoded = JSON.parse(atob(state));
                    if (decoded.connectionType) platform = decoded.connectionType;
                    if (decoded.username) email = decoded.username; // Sometimes username is email
                 } catch (e) {
                    console.log('State decoding failed (not base64 JSON or invalid)');
                 }
              }
           }

           if (email) email = decodeURIComponent(email);
           
           console.log(`✅ Detected return from ${platform} for ${email || 'unknown user'}`);
           
           // Set state to restore flow
           setOauthReturnDetected(true);
           
           // 1. SUPPORT UNIVERSAL ONBOARDING (YouTube, LinkedIn, Reddit, etc.)
           sessionStorage.setItem('onairos_oauth_return_success', 'true');
           sessionStorage.setItem('onairos_oauth_return_platform', platform);

           // Dispatch event to update UI immediately if component is mounted
           if (typeof window !== 'undefined') {
             window.dispatchEvent(new CustomEvent('onairos-oauth-success', { 
               detail: { platform: platform, email: email } 
             }));
           }
           
           if (platform) {
             localStorage.setItem(`onairos_${platform}_success`, 'true');
             localStorage.setItem(`onairos_${platform}_timestamp`, Date.now().toString());
           }

           // 2. SUPPORT EMAIL AUTH (Gmail)
           if (platform === 'google' || platform === 'gmail') {
             localStorage.setItem('onairos_gmail_success', 'true');
             localStorage.setItem('onairos_gmail_timestamp', Date.now().toString());
             if (email) localStorage.setItem('onairos_gmail_email', email);
           }
           
           // Restore session if possible (only for Login flow really, but safe to update)
           if (email) {
             // MERGE with existing userData to preserve connectedAccounts
             const existingUserData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
             const userData = {
                ...existingUserData, // Preserve existing data (like connectedAccounts)
                email: email,
                verified: true,
                onboardingComplete: false,
                provider: platform
             };
             console.log('📦 Merging OAuth return with existing userData:', { existing: existingUserData.connectedAccounts, merged: userData.connectedAccounts });
             localStorage.setItem('onairosUser', JSON.stringify(userData));
             setUserData(userData);
           }
           
           // Open modal and go to onboarding immediately
           setShowOverlay(true);
           setCurrentFlow('onboarding');
           
           // Clean up URL if possible (on web)
           if (window.history && window.history.replaceState && url.startsWith('http')) {
             const cleanUrl = window.location.pathname;
             window.history.replaceState({}, '', cleanUrl);
           }
        }
      } catch (e) {
        console.error('Error handling deep link:', e);
      }
  };

  // Native Deep Link Listener (Runs once, stays active)
  useEffect(() => {
    let appListener = null;
    const setupListener = async () => {
      // Only run on native platforms (iOS/Android)
      const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
      if (!isNative) return;

      let AppPlugin = App;
      if (!AppPlugin || !AppPlugin.addListener) {
        if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.App) {
          AppPlugin = window.Capacitor.Plugins.App;
        }
      }

      if (!AppPlugin || !AppPlugin.addListener) {
         console.warn('⚠️ App plugin not found for deep linking listener');
         return;
      }

      try {
        appListener = await AppPlugin.addListener('appUrlOpen', (data) => {
          console.log('📱 Native deep link received:', data.url);
          handleDeepLink(data.url);
        });
        console.log('✅ App deep link listener registered successfully');
      } catch (e) {
        console.warn('⚠️ Failed to setup App listener:', e);
      }
    };
    setupListener();
    
    return () => {
      if (appListener) appListener.remove();
    };
  }, []);

  // Web/Initial Check (Respects oauthReturnDetected)
  useEffect(() => {
    if (oauthReturnDetected) return;
    
    handleDeepLink(window.location.href);
    
    const checkWindowUrl = () => handleDeepLink(window.location.href);
    window.addEventListener('popstate', checkWindowUrl);
    
    return () => window.removeEventListener('popstate', checkWindowUrl);
  }, [oauthReturnDetected]);

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

  // Check for OAuth return (Google login redirect back)
  useEffect(() => {
    if (oauthReturnDetected) return; // Prevent double-processing
    
    const checkOAuthReturn = () => {
      // Check URL params for OAuth completion
      const urlParams = new URLSearchParams(window.location.search);
      const oauthSuccess = urlParams.get('onairos_oauth_success');
      const oauthPlatform = urlParams.get('onairos_oauth_platform');
      const oauthEmail = urlParams.get('onairos_oauth_email');

      // Check for generic OAuth return (any platform)
      if (oauthSuccess === 'true' && oauthPlatform) {
        setOauthReturnDetected(true);
        
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
        if (oauthPlatform === 'gmail' && oauthEmail) {
          console.log('✅ Gmail OAuth return detected in URL params');
          
          // Create user data from OAuth
          const authData = {
            email: oauthEmail,
            verified: true,
            isNewUser: true, // Assume new user for now, backend will correct this
            provider: 'google'
          };
          
          // Save to localStorage - MERGE with existing to preserve connectedAccounts
          const existingUserData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
          const userData = {
            ...existingUserData, // Preserve existing data (like connectedAccounts)
            email: oauthEmail,
            verified: true,
            onboardingComplete: false,
            provider: 'google'
          };
          console.log('📦 Merging Google OAuth with existing userData:', { existing: existingUserData.connectedAccounts, merged: userData.connectedAccounts });
          localStorage.setItem('onairosUser', JSON.stringify(userData));
          setUserData(userData);
          
          // Open modal and go to onboarding
          setShowOverlay(true);
          setCurrentFlow('onboarding');
          
          // Clean up OAuth localStorage
          localStorage.removeItem('onairos_gmail_success');
          localStorage.removeItem('onairos_gmail_timestamp');
          localStorage.removeItem('onairos_oauth_email');
          localStorage.removeItem('onairos_return_url');
          localStorage.removeItem('onairos_oauth_context');
          
        } else {
          // Other platforms (Universal Onboarding connectors)
          console.log(`✅ ${oauthPlatform} OAuth return detected - restoring onboarding flow`);
          
          // Ensure we have user session to show the modal correctly
          // (User should already be logged in if they were connecting apps)
          const savedUser = localStorage.getItem('onairosUser');
          if (savedUser) {
            setUserData(JSON.parse(savedUser));
          }
          
          // Open modal and restore flow
          setShowOverlay(true);
          setCurrentFlow('onboarding');
          
          // Pass the success signal to UniversalOnboarding via a temporary storage flag
          // that works even if cross-domain cleared the original context
          sessionStorage.setItem('onairos_oauth_return_success', 'true');
          sessionStorage.setItem('onairos_oauth_return_platform', oauthPlatform);
        }
        
        return;
      }

      // Also check localStorage for OAuth completion (fallback)
      const gmailSuccess = localStorage.getItem('onairos_gmail_success');
      const gmailTimestamp = localStorage.getItem('onairos_gmail_timestamp');
      const gmailEmail = localStorage.getItem('onairos_gmail_email') || localStorage.getItem('onairos_oauth_email');

      if (gmailSuccess === 'true' && gmailTimestamp && gmailEmail) {
        const now = Date.now();
        const timestamp = parseInt(gmailTimestamp, 10);
        
        // Only process if timestamp is recent (within last 60 seconds)
        if (now - timestamp < 60000) {
          console.log('✅ Gmail OAuth return detected in localStorage');
          setOauthReturnDetected(true);
          
          // Create user data from OAuth - MERGE with existing to preserve connectedAccounts
          const existingUserData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
          const userData = {
            ...existingUserData, // Preserve existing data (like connectedAccounts)
            email: gmailEmail,
            verified: true,
            onboardingComplete: false,
            provider: 'google'
          };
          console.log('📦 Merging Gmail OAuth with existing userData:', { existing: existingUserData.connectedAccounts, merged: userData.connectedAccounts });
          localStorage.setItem('onairosUser', JSON.stringify(userData));
          setUserData(userData);
          
          // Open modal and go to onboarding
          setShowOverlay(true);
          setCurrentFlow('onboarding');
          
          // Clean up OAuth localStorage
          localStorage.removeItem('onairos_gmail_success');
          localStorage.removeItem('onairos_gmail_timestamp');
          localStorage.removeItem('onairos_gmail_email');
          localStorage.removeItem('onairos_oauth_email');
          localStorage.removeItem('onairos_return_url');
          localStorage.removeItem('onairos_oauth_context');
        }
      }
    };

    checkOAuthReturn();
  }, [oauthReturnDetected]);

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
      hasAccountInfo: !!authData.accountInfo,
      accountStatus: authData.accountStatus // NEW: Log accountStatus
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
    
    // NEW: Use accountStatus if available (more reliable than legacy fields)
    const accountStatus = authData.accountStatus;
    let isNewUser;
    
    if (accountStatus) {
      // Use the new accountStatus.exists field as the source of truth
      isNewUser = !accountStatus.exists;
      console.log('✅ Using accountStatus.exists for flow determination:', {
        accountExists: accountStatus.exists,
        hasTrainedModel: accountStatus.hasTrainedModel,
        hasPersonalityTraits: accountStatus.hasPersonalityTraits,
        connectedPlatforms: accountStatus.connectedPlatforms,
        needsDataConnection: accountStatus.needsDataConnection,
        needsTraining: accountStatus.needsTraining,
        canUseInference: accountStatus.canUseInference
      });
    } else {
      // Fallback to legacy field checking if accountStatus not available
      isNewUser = authData.isNewUser === true || 
                  authData.existingUser === false || 
                  authData.flowType === 'onboarding' || 
                  authData.userState === 'new' ||
                  !authData.accountInfo;
      console.log('⚠️ Using legacy fields for flow determination (accountStatus not available)');
    }
    
    console.log('🔍 Flow determination:', {
      finalDecision: isNewUser ? 'NEW USER → onboarding (data connectors)' : 'EXISTING USER → dataRequest (data permissions)',
      reasoning: {
        usingAccountStatus: !!accountStatus,
        accountExists: accountStatus?.exists,
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
    
    // Flow decision logic - always go to onboarding (UniversalOnboarding) after auth
    console.log('🚀 Auth successful → Starting onboarding flow (data connectors page)');
    setCurrentFlow('onboarding');
  };

  const handleOnboardingComplete = (onboardingData) => {
    console.log('🎯 Onboarding completed:', onboardingData);
    console.log('🔍 Connected accounts from onboarding:', onboardingData.connectedAccounts);
    const updatedUserData = {
      ...userData,
      onboardingComplete: true,
      connectedAccounts: onboardingData.connectedAccounts || []
    };
    console.log('💾 Saving userData with connectedAccounts:', updatedUserData.connectedAccounts);
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
          // Only show wrapped loading page if app name contains "wrapped"
          const isWrappedApp = webpageName && webpageName.toLowerCase().includes('wrapped');
          if (isWrappedApp) {
          setCurrentFlow('wrappedLoading');
            console.log('📊 Showing wrapped loading screen for wrapped app');
          } else {
            console.log('📊 Skipping loading screen - not a wrapped app');
          }
          
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
          
          let fetchUrl = urlData.apiUrl;
          let fetchBody = {
             email: userData?.email,
             includeLlmData: requestResult.approved.includes('rawMemories')
          };

          // Override for non-wrapped apps (Regular SDK training) to use Training API
          if (!isWrappedApp) {
             fetchUrl = 'https://api2.onairos.uk/mobile-training/clean';
             
             // Construct training body
             const connected = [];
             if (userData?.connectedAccounts) {
               if (Array.isArray(userData.connectedAccounts)) {
                 connected.push(...userData.connectedAccounts);
               } else if (typeof userData.connectedAccounts === 'object') {
                 connected.push(...Object.keys(userData.connectedAccounts).filter(k => userData.connectedAccounts[k]));
               }
             }
             
             fetchBody = {
               Info: {
                 username: userData?.email || userData?.username,
                 connectedPlatforms: connected
               }
             };
             
             console.log('🚀 Switching to Training API for non-wrapped app:', fetchUrl);
          }
          
          console.log(`📡 Fetching/Training data from ${fetchUrl} (${method})...`);
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
              dataResponse = await fetch(fetchUrl, {
                method: method,
                headers: {
                  'Authorization': `Bearer ${urlData.token}`,
                  'Content-Type': 'application/json'
                },
                // Only send body for POST
                body: method === 'POST' ? JSON.stringify(fetchBody) : undefined,
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

    // Only keep overlay open for wrapped apps, otherwise always close
    const isWrappedApp = webpageName && webpageName.toLowerCase().includes('wrapped');
    const shouldKeepOverlayOpen = isWrappedApp && autoFetch && requestResult.approved?.length > 0 && (
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

  const renderContent = () => {
    const commonProps = {
      isMobile: isMobileDevice,
      testMode: testMode
    };

    switch (currentFlow) {
      case 'welcome':
        return (
          <WelcomeScreen 
            {...commonProps}
            onContinue={handleWelcomeContinue}
            onClose={handleCloseOverlay}
            webpageName={webpageName}
            appIcon={appIcon}
          />
        );
      case 'email':
        return (
          <div className={isMobileDevice ? "flex-1 min-h-0 flex flex-col" : "flex-1 min-h-0 flex flex-col"}>
            <EmailAuth 
              {...commonProps}
              onSuccess={handleEmailAuthSuccess}
            />
          </div>
        );
      case 'onboarding':
        return (
          <UniversalOnboarding 
            {...commonProps}
            onComplete={handleOnboardingComplete}
            onBack={() => setCurrentFlow('email')}
            appIcon={appIcon || "https://onairos.sirv.com/Images/OnairosBlack.png"}
            appName={webpageName}
            username={userData?.email || userData?.username}
            priorityPlatform={priorityPlatform}
            rawMemoriesOnly={rawMemoriesOnly}
            rawMemoriesConfig={rawMemoriesConfig}
          />
        );
      case 'pin':
        return (
          <div className={isMobileDevice ? "flex-1 min-h-0" : ""}>
            <PinSetup 
              onComplete={handlePinSetupComplete}
              onBack={() => setCurrentFlow('onboarding')}
              userEmail={userData?.email}
            />
          </div>
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
        console.log('🎯 Rendering DataRequest:', {
          connectedAccounts: userData?.connectedAccounts,
          isArray: Array.isArray(userData?.connectedAccounts),
          userData: userData
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
            connectedPlatforms={userData?.connectedAccounts || []}
            rawMemoriesOnly={rawMemoriesOnly}
            rawMemoriesConfig={rawMemoriesConfig}
            showTime={time}
          />
        );
      case 'wrappedLoading':
        return (
          <div className="flex-1 min-h-0">
            <WrappedLoadingPage appName={webpageName} />
          </div>
        );
      case 'loading':
        return <LoadingScreen onComplete={handleLoadingComplete} />;
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
          {isMobileDevice ? (
            // Mobile Browser: Use ModalPageLayout with mobile-optimized props
            <ModalPageLayout
              visible={showOverlay}
              onClose={handleCloseOverlay}
              showBackButton={currentFlow !== 'welcome' && currentFlow !== 'email' && currentFlow !== 'loading' && currentFlow !== 'wrappedLoading'}
              onBack={() => {
                if (currentFlow === 'onboarding') setCurrentFlow('email');
                else if (currentFlow === 'pin') setCurrentFlow('onboarding');
                else if (currentFlow === 'dataRequest') setCurrentFlow('onboarding');
                else if (currentFlow === 'training') setCurrentFlow('pin');
              }}
              showCloseButton={currentFlow === 'welcome' || currentFlow === 'email'}
              title=""
              subtitle=""
              icon={null}
              centerContent={true}
              contentClassName="!p-0"
              modalClassName="onairos-modal onairos-modal-mobile"
            >
              <div className="onairos-modal-shell flex-1 min-h-0 flex flex-col">
                {renderContent()}
              </div>
            </ModalPageLayout>
          ) : (
            // Desktop Layout
            <ModalPageLayout
              visible={showOverlay}
              onClose={handleCloseOverlay}
              showBackButton={currentFlow === 'training' || currentFlow === 'onboarding' || currentFlow === 'pin' || currentFlow === 'dataRequest'}
              onBack={() => {
                if (currentFlow === 'email') setCurrentFlow('welcome');
                if (currentFlow === 'onboarding') setCurrentFlow('email');
                if (currentFlow === 'pin') setCurrentFlow('onboarding'); 
                if (currentFlow === 'training') setCurrentFlow('pin');
                if (currentFlow === 'dataRequest') setCurrentFlow('onboarding');
              }}
              title=""
              subtitle=""
              icon={null}
              centerContent={true}
              contentClassName={currentFlow !== 'welcome' ? "!p-0" : ""}
              modalClassName="onairos-modal"
            >
              <div className="onairos-modal-shell">
                {renderContent()}
              </div>
            </ModalPageLayout>
          )}
        </>
      )}
    </>
  );
}

export default OnairosButton;
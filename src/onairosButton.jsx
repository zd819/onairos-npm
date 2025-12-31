import React, { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import EmailAuth from './components/EmailAuth.js';
import UniversalOnboarding from './components/UniversalOnboarding.jsx';
import PinSetup from './components/PinSetup.js';
import DataRequest from './components/DataRequest.js';
import TrainingComponent from './components/TrainingComponent.jsx';
import TrainingScreen from './components/TrainingScreen.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import WrappedLoadingPage from './components/WrappedLoadingPage.jsx';
import { formatOnairosResponse } from './utils/responseFormatter.js';
import { logOnairosResponse } from './utils/apiResponseLogger.js';
import { logFormattedUserData } from './utils/userDataFormatter.js';
import { ModalPageLayout } from './components/ui/PageLayout.jsx';
import { isMobileApp, isMobileBrowser } from './utils/capacitorDetection.js';
import { checkValidSession, createSession, isSessionValid, extendSession, destroySession } from './utils/sessionManager.js';

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
  const [currentFlow, setCurrentFlow] = useState('welcome'); // 'welcome' | 'email' | 'onboarding' | 'pin' | 'trainingScreen' | 'dataRequest' | 'wrappedLoading'
  const [trainingHasStarted, setTrainingHasStarted] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [oauthReturnDetected, setOauthReturnDetected] = useState(false);
  const [returnToDataRequestAfterOnboarding, setReturnToDataRequestAfterOnboarding] = useState(false);
  const [wrappedDataReady, setWrappedDataReady] = useState(false); // Track when wrapped data is ready to show
  
  // Debug: Log flow changes
  useEffect(() => {
    console.log('🔄 FLOW CHANGED TO:', currentFlow);
  }, [currentFlow]);
  
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
        
        if (hasError) {
           console.log('❌ Deep link/OAuth error detected:', url);

           // Close browser if open (Capacitor)
           Browser.close().catch(() => {});

           // Extract params from URL
           let params;
           try {
             const qIdx = url.indexOf('?');
             if (qIdx !== -1) params = new URLSearchParams(url.substring(qIdx + 1));
             else params = new URL(url).searchParams;
           } catch (e) {
             params = new URLSearchParams(url.split('?')[1] || '');
           }

           const platform = params.get('platform') || params.get('onairos_oauth_platform') || 'unknown';
           const errMsg = params.get('error') || params.get('onairos_oauth_error') || 'Unknown error';

           // Persist error signal for components that poll localStorage (desktop popup flows)
           try {
             localStorage.setItem(`onairos_${platform}_error`, errMsg);
             localStorage.setItem(`onairos_${platform}_timestamp`, Date.now().toString());
           } catch (_) {}

           // Session signal so UniversalOnboarding can react after a mobile redirect
           try {
             sessionStorage.setItem('onairos_oauth_return_success', 'false');
             sessionStorage.setItem('onairos_oauth_return_platform', platform);
             sessionStorage.setItem('onairos_oauth_return_error', errMsg);
           } catch (_) {}

           // Re-open the SDK modal on Universal Onboarding immediately
           setOauthReturnDetected(true);
           setShowOverlay(true);
           setCurrentFlow('onboarding');

           // Clean up URL if possible (on web)
           if (window.history && window.history.replaceState && url.startsWith('http')) {
             const cleanUrl = window.location.pathname;
             window.history.replaceState({}, '', cleanUrl);
           }

           return;
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
           
           // Restore session
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
           } else {
             // CRITICAL: If no email in URL, attempt to restore from existing session
             // This prevents losing the user identity during OAuth flows that don't return email
             try {
                const existingUser = JSON.parse(localStorage.getItem('onairosUser') || '{}');
                if (existingUser && (existingUser.email || existingUser.username)) {
                    console.log('✅ Restored existing user session during OAuth return (no email in URL)');
                    setUserData(existingUser);
                } else {
                    console.warn('⚠️ OAuth return without email and no existing session found');
                }
             } catch (e) {
                 console.error('❌ Failed to restore session during OAuth return:', e);
             }
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

  // Check for existing user session with token validation
  useEffect(() => {
    const checkExistingSession = () => {
      // If we are in an OAuth return flow (URL params present), DO NOT restore session yet.
      // Let checkOAuthReturn handle the state setup and flow direction (to 'onboarding').
      // This prevents a race condition where checkExistingSession forces 'dataRequest' (due to onboardingComplete=true)
      // before we've had a chance to show the "Connected!" state in UniversalOnboarding.
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('onairos_oauth_success') === 'true') {
        console.log('🛑 checkExistingSession aborted - OAuth return detected in URL');
        return;
      }

      // Also check for localStorage OAuth markers (for same-domain redirects that cleared URL)
      // BUT exclude gmail auth flow (which should proceed normally)
      if (localStorage.getItem('onairos_oauth_context') === 'platform-connector') {
         // Check if we have a recent success signal
         const platform = localStorage.getItem('onairos_oauth_platform');
         if (platform) {
            const success = localStorage.getItem(`onairos_${platform}_success`);
            if (success === 'true') {
               console.log('🛑 checkExistingSession aborted - Platform OAuth success marker found');
               return;
            }
         }
      }

      // In test mode, always start fresh to see the full flow
      if (testMode) {
        console.log('🧪 Test mode: Starting fresh flow, clearing any cached user data');
        localStorage.removeItem('onairosUser');
        setCurrentFlow('welcome');
        return;
      }
      
      // If we just kicked off an OAuth connector flow, force return into onboarding
      // so users can connect multiple apps without getting bounced to DataRequest.
      const postOAuthFlow = (() => {
        try { return localStorage.getItem('onairos_post_oauth_flow'); } catch { return null; }
      })();
      if (postOAuthFlow === 'onboarding') {
        try { localStorage.removeItem('onairos_post_oauth_flow'); } catch {}
        const savedUser = localStorage.getItem('onairosUser');
        if (savedUser) {
          try { setUserData(JSON.parse(savedUser)); } catch {}
        }
        setShowOverlay(true);
        setCurrentFlow('onboarding');
        return;
      }
      
      // ============================================
      // NEW: Enhanced session validation with token checking
      // ============================================
      console.log('🔍 Checking for valid session (with token validation)...');
      const sessionCheck = checkValidSession();
      
      if (sessionCheck.shouldSkipLogin) {
        // Valid session found - skip login and go straight to data request!
        console.log('✨ Valid session found - skipping login!');
        console.log(`   User: ${sessionCheck.userData.email || sessionCheck.userData.username}`);
        
        // Clean wrapped data if needed
        const user = sessionCheck.userData;
        if (webpageName && webpageName.toLowerCase().includes('wrapped')) {
          if (user.apiResponse || user.lastDataRequest) {
            console.log('🧼 Cleaning old wrapped data from session to force fresh state');
            delete user.apiResponse;
          }
        }
        
        // Extend session on activity (bump expiry forward)
        extendSession();
        
        setUserData(user);
        setCurrentFlow('dataRequest');
        return;
      }
      
      // Session exists but incomplete or expired
      if (sessionCheck.hasSession && !sessionCheck.shouldSkipLogin) {
        console.log('⚠️ Session exists but incomplete or expired');
        const user = sessionCheck.userData;
        
        // Check if session is expired
        if (!isSessionValid()) {
          console.log('❌ Session expired - user must re-authenticate');
          localStorage.removeItem('onairosUser');
          localStorage.removeItem('onairos_user_token');
          localStorage.removeItem('onairos_session_expiry');
          setCurrentFlow('welcome');
          return;
        }
        
        // Session valid but onboarding incomplete
        setUserData(user);
        if (user.verified && !user.onboardingComplete) {
          setCurrentFlow('onboarding');
        } else if (user.onboardingComplete && !user.pinCreated) {
          setCurrentFlow('pin');
        } else {
          setCurrentFlow('welcome');
        }
      }
    };

    checkExistingSession();
  }, [testMode, webpageName]);

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

  const handleLogout = () => {
    console.log('🚪 User logout initiated');
    
    // ============================================
    // NEW: Use session manager to destroy session
    // ============================================
    destroySession();
    
    // Clear additional OAuth-specific storage
    try {
      localStorage.removeItem('onairos_gmail_success');
      localStorage.removeItem('onairos_gmail_timestamp');
      localStorage.removeItem('onairos_gmail_email');
      localStorage.removeItem('onairos_oauth_email');
      localStorage.removeItem('onairos_return_url');
      localStorage.removeItem('onairos_oauth_context');
      localStorage.removeItem('onairos_post_oauth_flow');
    } catch (e) {
      console.warn('⚠️ Error clearing additional storage during logout:', e);
    }
    
    // Reset component state
    setUserData(null);
    setError(null);
    setCurrentFlow('welcome');
    setOauthReturnDetected(false);
    setReturnToDataRequestAfterOnboarding(false);
    setTrainingHasStarted(false);
    
    // Close the overlay
    setShowOverlay(false);
    
    console.log('✅ Logout complete - user session cleared');
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
    
    // SDK-ONLY USER DETECTION: Determine new vs existing based purely on SDK-side logic
    const accountStatus = authData.accountStatus;
    let isNewUser;
    
    // Primary indicator: Backend explicit flags
    const backendSaysNewUser =
      authData.isNewUser === true ||
      authData.userCreated === true ||
      authData.existingUser === false ||
      authData.flowType === 'onboarding' ||
      authData.userState === 'new';
    
    // Secondary indicator: Connected platforms (most reliable for "returning user")
    const connectedPlatforms = accountStatus?.connectedPlatforms || [];
    const hasConnectedPlatforms = Array.isArray(connectedPlatforms) && connectedPlatforms.length > 0;
    
    // Tertiary indicator: Has trained model or personality data
    const hasTrainedModel = accountStatus?.hasTrainedModel === true;
    const hasPersonalityTraits = accountStatus?.hasPersonalityTraits === true;
    const hasExistingData = hasTrainedModel || hasPersonalityTraits;
    
    // SDK-side decision logic:
    // 1. If backend explicitly says new user → new user (go to onboarding)
    // 2. If user has connected platforms → existing user (skip to dataRequest)
    // 3. If user has trained model/traits → existing user (skip to dataRequest)
    // 4. DEFAULT: No platforms + no trained data → new user (go to onboarding first)
    //    This ensures brand new signups always connect platforms before requesting permissions
    if (backendSaysNewUser) {
      isNewUser = true;
      console.log('✅ SDK: New user (backend explicit flag)');
    } else if (hasConnectedPlatforms) {
      isNewUser = false;
      console.log('✅ SDK: Existing user (has connected platforms):', connectedPlatforms);
    } else if (hasExistingData) {
      isNewUser = false;
      console.log('✅ SDK: Existing user (has trained model/traits)');
    } else {
      // Default: no platforms + no trained data → new user needs onboarding
      isNewUser = true;
      console.log('✅ SDK: New user (no platforms, no trained data → onboarding first)');
    }
    
    console.log('🔍 SDK Flow determination:', {
      decision: isNewUser ? 'NEW USER → onboarding (connect platforms)' : 'EXISTING USER → dataRequest (permissions)',
      backendSaysNewUser,
      hasConnectedPlatforms,
      connectedPlatforms,
      hasExistingData,
      hasTrainedModel,
      hasPersonalityTraits,
      accountStatusExists: accountStatus?.exists,
      authDataExistingUser: authData.existingUser
    });
    
    const newUserData = {
      ...authData,
      verified: true,
      onboardingComplete: !isNewUser, // New users need onboarding, returning users have completed it
      pinCreated: !isNewUser // Assume returning users have PIN, new users need to create it
    };

    // If backend provides connected platforms for existing users, carry them into connectedAccounts
    // so DataRequest/Onboarding can reflect what is already connected.
    const normalizePlatformName = (p) => {
      const key = String(p || '').trim().toLowerCase();
      const map = {
        instagram: 'Instagram',
        youtube: 'YouTube',
        linkedin: 'LinkedIn',
        reddit: 'Reddit',
        pinterest: 'Pinterest',
        github: 'GitHub',
        gmail: 'Gmail',
        twitter: 'Twitter',
        x: 'Twitter',
        chatgpt: 'ChatGPT',
        claude: 'Claude',
        gemini: 'Gemini',
        grok: 'Grok',
      };
      return map[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : '');
    };
    if (!isNewUser) {
      const fromAccountStatus = Array.isArray(accountStatus?.connectedPlatforms)
        ? accountStatus.connectedPlatforms
        : [];
      const normalized = fromAccountStatus.map(normalizePlatformName).filter(Boolean);
      if (normalized.length > 0) {
        newUserData.connectedAccounts = normalized;
      }
    } else {
      // New user: never pre-populate connected apps.
      // This prevents stale local state from previous sessions from auto-toggling connectors.
      newUserData.connectedAccounts = [];
    }
    
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
    
    // ============================================
    // NEW: Create persistent session (30-day default)
    // ============================================
    const sessionData = createSession(newUserData, emailToken);
    setUserData(sessionData || newUserData);
    
    // Fallback if createSession fails
    if (!sessionData) {
      localStorage.setItem('onairosUser', JSON.stringify(newUserData));
    }
    
    console.log('✅ Persistent session created - user can skip login for 30 days');
    
    // Flow decision logic:
    // - New users: go to UniversalOnboarding (connectors)
    // - Existing users: go straight to DataRequest (data permissions)
    if (isNewUser) {
      console.log('🚀 Auth successful (new user) → Starting onboarding flow (data connectors page)');
    setCurrentFlow('onboarding');
    } else {
      console.log('🚀 Auth successful (existing user) → Going straight to DataRequest (data permissions)');
      setCurrentFlow('dataRequest');
    }
  };

  const handleOnboardingComplete = (onboardingData) => {
    console.log('🎯 Onboarding completed:', onboardingData);
    console.log('🔍 Connected accounts from onboarding:', onboardingData.connectedAccounts);
    console.log('🆕 Newly connected platforms:', onboardingData.newlyConnected, 'hasNewPlatforms:', onboardingData.hasNewPlatforms);
    
    // DEFENSIVE: Ensure we don't overwrite session with null if state was lost
    const currentData = userData || JSON.parse(localStorage.getItem('onairosUser') || '{}');
    
    const updatedUserData = {
      ...currentData,
      onboardingComplete: true,
      connectedAccounts: onboardingData.connectedAccounts || [],
      // Store info about newly connected platforms for cache invalidation
      hasNewPlatforms: onboardingData.hasNewPlatforms || false,
      newlyConnected: onboardingData.newlyConnected || []
    };
    
    // Recover email if missing from currentData but present in onboardingData (unlikely but safe)
    if (!updatedUserData.email && onboardingData.email) {
        updatedUserData.email = onboardingData.email;
    }
    
    console.log('💾 Saving userData with connectedAccounts:', updatedUserData.connectedAccounts);
    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));
    if (returnToDataRequestAfterOnboarding) {
      setReturnToDataRequestAfterOnboarding(false);
      // Determine flow: if user added NEW connections and wants to re-train (implicit in wrapped/non-wrapped flow?),
      // or just wants to go back to data request.
      // User requested: "so i cna redo training" -> send to trainingScreen.
      // But if wrapped, training is skipped.
      const isWrappedApp = webpageName && webpageName.toLowerCase().includes('wrapped');
      if (isWrappedApp) {
        // Wrapped: back to DataRequest (training skipped anyway)
        setCurrentFlow('dataRequest');
      } else {
        // Non-wrapped: User likely wants to re-train with new data
        setCurrentFlow('trainingScreen');
        // Reset training state so it runs again
        setTrainingHasStarted(false);
      }
    } else {
      // Check if user already has a PIN. If so, skip PIN setup.
      if (updatedUserData.pinCreated) {
        console.log('🔐 User already has a PIN, skipping setup.');
        
        // Decide next step based on wrapped/non-wrapped logic
        const isWrappedApp = webpageName && webpageName.toLowerCase().includes('wrapped');
        if (isWrappedApp) {
          console.log('🎁 Wrapped app - skipping training screen, going to data request');
          setCurrentFlow('dataRequest');
        } else {
          console.log('🎓 Non-wrapped app - showing training screen');
          setTrainingHasStarted(false);
          setCurrentFlow('trainingScreen');
        }
      } else {
        setCurrentFlow('pin');
      }
    }
  };

  const handlePinSetupComplete = async (pinData) => {
    console.log('PIN setup completed:', pinData);
    
    // DEFENSIVE: Ensure we don't overwrite session with null if state was lost
    const currentData = userData || JSON.parse(localStorage.getItem('onairosUser') || '{}');
    
    const updatedUserData = {
      ...currentData,
      ...pinData,
      pinCreated: true
    };
    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));
    
    // Check if this is a wrapped app
    const isWrappedApp = webpageName && webpageName.toLowerCase().includes('wrapped');
    
    if (isWrappedApp) {
      // Wrapped apps skip training screen - go directly to data request
      console.log('🎁 Wrapped app - skipping training screen, going to data request');
      setCurrentFlow('dataRequest');
    } else {
      // Non-wrapped apps show training screen BEFORE data request
      console.log('🎓 Non-wrapped app - showing training screen');
      // Reset training start watchdog state
      setTrainingHasStarted(false);
      setCurrentFlow('trainingScreen');
    }
  };

  // Non-wrapped ONLY: if training does not START within 30s, move forward to DataRequest anyway.
  // Wrapped apps must NOT do this.
  useEffect(() => {
    const isWrappedApp = webpageName && webpageName.toLowerCase().includes('wrapped');
    if (isWrappedApp) return;

    if (currentFlow !== 'trainingScreen') return;
    if (trainingHasStarted) return;

    const timeoutId = setTimeout(() => {
      // Re-check conditions at fire time (effect cleanup should handle most cases).
      const stillWrapped = webpageName && webpageName.toLowerCase().includes('wrapped');
      if (stillWrapped) return;
      if (currentFlow === 'trainingScreen' && !trainingHasStarted) {
        console.warn('⏱️ Training did not start within 30s (non-wrapped). Continuing to DataRequest.');
        setCurrentFlow('dataRequest');
      }
    }, 30000);

    return () => clearTimeout(timeoutId);
  }, [currentFlow, trainingHasStarted, webpageName]);

  const handleLoadingComplete = () => {
    setCurrentFlow('dataRequest');
  };

  const handleTrainingComplete = (trainingResult) => {
    console.log('🎓 Training completed:', trainingResult);
    
    // DEFENSIVE: Ensure we don't overwrite session with null if state was lost
    const currentData = userData || JSON.parse(localStorage.getItem('onairosUser') || '{}');
    
    const updatedUserData = {
      ...currentData,
      // Persist a stable flag name used across SDK helpers/formatters
      trainingComplete: !(trainingResult?.fallback || trainingResult?.error),
      trainingCompleted: true,
      ...trainingResult
    };
    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));
    
    // Move to data request after training
    setCurrentFlow('dataRequest');
  };

  const handleTrainingScreenComplete = (trainingResult) => {
    console.log('🎓 Training screen completed:', trainingResult);
    
    // DEFENSIVE: Ensure we don't overwrite session with null if state was lost
    const currentData = userData || JSON.parse(localStorage.getItem('onairosUser') || '{}');
    
    const updatedUserData = {
      ...currentData,
      trainingComplete: !(trainingResult?.fallback || trainingResult?.error),
      trainingCompleted: true,
      ...trainingResult
    };
    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));
    
    // Move to data request after training screen
    setCurrentFlow('dataRequest');
  };

  const handleDataRequestComplete = async (requestResult) => {
    console.log('🔥 OnairosButton: Data request completed:', requestResult);
    console.log('📋 Request result details:', {
      approved: requestResult.approved,
      approvedLength: requestResult.approved?.length,
      autoFetch,
      webpageName
    });
    
    // Check if this is a wrapped app
    const isWrappedApp = webpageName && webpageName.toLowerCase().includes('wrapped');
    console.log('🎁 Is wrapped app?', isWrappedApp);
    
    // For non-wrapped apps, training and inference already happened in TrainingScreen
    // No need to run it again here
    if (!isWrappedApp && requestResult.approved?.length > 0) {
      console.log('✅ Non-wrapped app: Training and inference already completed in TrainingScreen');
      console.log('📋 Data approval recorded:', requestResult.approved);
    }
    
    // Resolve user identifier robustly
    let accountIdentifier = userData?.email || userData?.username;
    
    // Fallback: check localStorage if state is missing email
    if (!accountIdentifier) {
        try {
            const savedUser = JSON.parse(localStorage.getItem('onairosUser') || '{}');
            accountIdentifier = savedUser.email || savedUser.username;
            if (accountIdentifier) {
                 console.log('✅ Recovered user identifier from localStorage:', accountIdentifier);
            }
        } catch (e) {
            console.warn('⚠️ Failed to recover user identifier from localStorage:', e);
        }
    }

    // DEFENSIVE: Ensure we don't overwrite session with null if state was lost
    const currentData = userData || JSON.parse(localStorage.getItem('onairosUser') || '{}');
    
    // Update user data with request result
    const updatedUserData = {
      ...currentData,
      lastDataRequest: requestResult
    };
    
    // Ensure email is set in updatedUserData if we recovered it
    if (accountIdentifier && !updatedUserData.email) {
        updatedUserData.email = accountIdentifier;
        console.log('🔧 Backfilled email into updatedUserData');
    }

    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));

    // For wrapped apps: Don't immediately show loading - wait to see if data is cached
    // The loading screen will be shown only if fetch takes >1s (indicating fresh generation)

    // Handle data fetching if autoFetch is enabled
    // Non-wrapped apps still need this call to produce InferenceResult (output + traits) for host apps.
    let finalResult = requestResult;
    
    if (autoFetch && requestResult.approved?.length > 0) {
      console.log(`🚀 Auto-fetching data from Onairos API (${isWrappedApp ? 'wrapped' : 'non-wrapped'})...`);
      
      try {
        if (!accountIdentifier) {
            throw new Error('User identifier (email) is missing - cannot fetch data');
        }

        // 1. Get the API URL from the backend
        const urlResponse = await fetch('https://api2.onairos.uk/getAPIurlMobile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            Info: {
              appId: webpageName,
              account: accountIdentifier,
              confirmations: requestResult.approved.map(id => ({ data: id === 'personality' ? 'Large' : id === 'basic' ? 'Basic' : id })),
              EncryptedUserPin: userData?.EncryptedUserPin || 'pending_pin_integration',
              storage: 's3',
              proofMode: proofMode
            }
          })
        });

        const urlData = await urlResponse.json();
        console.log('🔗 API URL received:', urlData.apiUrl);
        console.log('🎯 webpageName sent as appId:', webpageName);

        if (urlData.apiUrl && urlData.token) {
          // Treat as "wrapped" when either:
          // - appId/name indicates wrapped, OR
          // - backend returns the special wrapped dashboard endpoint (traits-only)
          // This prevents host apps (e.g. remind.*) from being misclassified as non-wrapped and
          // receiving only traits-only fallback data instead of a full wrapped dashboard.
          const apiUrlLooksWrapped =
            typeof urlData.apiUrl === 'string' &&
            (urlData.apiUrl.includes('/traits-only') || urlData.apiUrl.includes('traits-only'));
          const nameLooksWrapped =
            typeof webpageName === 'string' &&
            webpageName.toLowerCase().includes('wrapped');
          const isWrappedApp = !!(nameLooksWrapped || apiUrlLooksWrapped);
          console.log('🎁 Is wrapped app?', isWrappedApp, '(checking:', webpageName, ')', {
            nameLooksWrapped,
            apiUrlLooksWrapped,
            apiUrl: urlData.apiUrl
          });
          
          // Track fetch start time to detect cached responses
          const fetchStartTime = Date.now();
          let shouldShowWrappedLoading = isWrappedApp;
          
          if (isWrappedApp) {
            // Don't show loading screen yet - we'll check if response is fast (cached)
            console.log('📊 Wrapped app detected - checking if data is cached...');
          } else {
            // Non-wrapped app: DO NOT show loading screen here. 
            // The user already accepted permissions, and for non-wrapped apps, 
            // we should just fetch in background and close the modal when done.
            // setCurrentFlow('loading'); // <-- REMOVED
            console.log('📊 Non-wrapped app: fetching data in background, keeping current view until complete');
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
             email: accountIdentifier,
             includeLlmData: requestResult.approved.includes('rawMemories')
          };

          // Wrapped: use backend policy (cached vs fresh) — DO NOT forceFresh by default.
          // Backend will return:
          // - cached dashboard instantly when available and connections unchanged
          // - processing + poll until a freshly-generated dashboard is ready otherwise
          // EXCEPTION: If new platforms were just connected, force a fresh generation
          if (isWrappedApp) {
             console.log('🎁 WRAPPED APP DETECTED - Using traits-only endpoint from backend:', fetchUrl);
             console.log('🎁 Wrapped policy: backend decides cached vs fresh (no fallback dashboards)');
             
             // Check if new platforms were just connected (requires fresh dashboard)
             const hasNewPlatforms = updatedUserData?.hasNewPlatforms || false;
             const newlyConnected = updatedUserData?.newlyConnected || [];
             
             console.log('🔍 Checking for newly connected platforms:', {
               hasNewPlatforms,
               newlyConnected,
               willForceFresh: hasNewPlatforms
             });
             
             fetchBody = {
               ...fetchBody,
               // Keep cacheBust only as a cache-buster hint for proxies; backend should not treat this as "force fresh"
               cacheBust: Date.now(),
               // Force fresh generation if new platforms were just connected
               forceFresh: hasNewPlatforms
             };
             
             // Append cachebuster to URL to prevent any edge/proxy caching
             if (fetchUrl.includes('?')) {
               fetchUrl += `&cb=${Date.now()}`;
             } else {
               fetchUrl += `?cb=${Date.now()}`;
             }

             try {
               if (accountIdentifier) localStorage.setItem('onairos_last_wrapped_email', accountIdentifier);
             } catch {}
             console.log('🎁 Wrapped request (backend decides cached vs fresh):', { 
               email: accountIdentifier,
               url: fetchUrl,
               body: fetchBody,
               isRetry: fetchBody.retry,
               forceFresh: fetchBody.forceFresh,
               note: hasNewPlatforms ? `🆕 Forcing fresh generation due to new platforms: ${newlyConnected.join(', ')}` : 'Backend will compare connection signatures to decide'
             });
             
             // Clear the hasNewPlatforms flag after using it (so subsequent calls don't force fresh)
             if (hasNewPlatforms) {
               console.log('🧹 Clearing hasNewPlatforms flag after forcing fresh generation');
               updatedUserData.hasNewPlatforms = false;
               updatedUserData.newlyConnected = [];
               setUserData(updatedUserData);
               localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));
             }
          } else {
            // Non-wrapped: do NOT re-run training here. Use apiUrl from getAPIurlMobile for traits/inference.
            fetchBody = {
              email: accountIdentifier,
              includeLlmData: requestResult.approved.includes('rawMemories')
            };
            console.log('✅ Non-wrapped: Using apiUrl from getAPIurlMobile for traits/inference:', fetchUrl);
          }
          
          console.log(`📡 Fetching/Training data from ${fetchUrl} (${method})...`);
          console.log(`🔑 Using token: ${urlData.token ? urlData.token.substring(0, 20) + '...' : 'NO TOKEN'}`);
          try {
            console.log('📦 Wrapped fetch request body:', fetchBody);
          } catch {}
          console.log(`⏳ Waiting for backend response - this may take 1-3 minutes for LLM processing...`);
          
          let dataResponse;
          let apiResponse;
          let fetchCompleted = false;
          let fetchError = null;
          
          try {
            // CRITICAL: Wait for the actual fetch response - don't proceed until we get data or a real error
            // The backend Python script needs time to generate the wrapped dashboard
            console.log(`🔄 Starting fetch request - will wait for complete response...`);
            
            // Create abort controller with 10-minute timeout for LLM-heavy endpoints
            // This prevents the BROWSER from timing out, even if the server might
            // Note: Gateway/load balancer may timeout earlier (typically 60s), which is expected
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

            try {
              dataResponse = await fetch(fetchUrl, {
                method: method,
                headers: {
                  'Authorization': `Bearer ${urlData.token}`,
                  'Content-Type': 'application/json'
                },
                // Prevent browser/proxy caching for wrapped dashboards
                cache: 'no-store',
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
            
            // Check if this was a fast response (cached data)
            const fetchDuration = Date.now() - fetchStartTime;
            const hasActualDashboard = !!(apiResponse?.slides || apiResponse?.dashboard || apiResponse?.data?.dashboard);
            const isProcessing = apiResponse?.status === 'processing';
            
            console.log('🔍 Parsed API response:', {
              isWrappedApp,
              hasStatus: !!apiResponse.status,
              status: apiResponse.status,
              hasSlides: !!apiResponse.slides,
              hasDashboard: hasActualDashboard,
              fetchDuration: `${fetchDuration}ms`,
              isProcessing,
              responseKeys: Object.keys(apiResponse)
            });
            
            // For wrapped apps: ALWAYS show loading screen and animate to 100% before showing results
            // This ensures a consistent UX whether data is cached or freshly generated
            if (isWrappedApp) {
              console.log('📊 Setting flow to wrappedLoading for wrapped app...', {
                hasActualDashboard,
                isProcessing,
                currentFlow: currentFlow
              });
              setWrappedDataReady(false); // Reset wrapped data ready state
              setCurrentFlow('wrappedLoading');
              console.log('✅ Flow set to wrappedLoading - loading screen should now be visible');
            }

            // ─────────────────────────────────────────────────────────────
            // Normalize + log API response in the exact SDK format expected
            // (see SDK_API_USAGE_EXAMPLES.md) using apiResponseLogger.
            // ─────────────────────────────────────────────────────────────
            try {
              const normalizedForLogging = (() => {
                // Wrapped dashboard responses are logged elsewhere; skip here.
                if (apiResponse?.slides || apiResponse?.dashboard || apiResponse?.data?.dashboard) return null;

                // Standard inference shape already
                if (apiResponse?.InferenceResult) return apiResponse;

                // traits-only: { success, traits, userTraits, llmData? }
                if (apiResponse?.traits && typeof apiResponse.traits === 'object') {
                  return {
                    InferenceResult: {
                      // Output may be absent for traits-only; logger will still print traits nicely.
                      output: apiResponse.output || apiResponse.InferenceResult?.output || [],
                      traits: { personality_traits: apiResponse.traits }
                    },
                    llmData: apiResponse.llmData,
                    inference_metadata: {
                      source: 'traits-only',
                      retrievedAt: apiResponse?.metadata?.retrievedAt,
                      note: 'Normalized traits-only response into InferenceResult for logging'
                    }
                  };
                }

                // Generic fallback normalization for unknown shapes that might contain personality data
                if (apiResponse?.personalityDict || apiResponse?.personality_traits) {
                    return {
                        InferenceResult: {
                            output: apiResponse.output || [],
                            traits: { 
                                personality_traits: apiResponse.personality_traits || apiResponse.personalityDict
                            }
                        },
                        llmData: apiResponse.llmData
                    };
                }

                return apiResponse;
              })();

              if (normalizedForLogging) {
                logOnairosResponse(normalizedForLogging, fetchUrl, { detailed: true, showRawData: false });
              }
            } catch (logErr) {
              console.warn('⚠️ Failed to log Onairos response:', logErr);
            }
            
            // Check if dashboard is still being generated (wrapped app only)
            if (isWrappedApp && apiResponse.status === 'processing') {
              console.log('⏳ Dashboard is being generated - starting polling...');
              const basePollInterval = (apiResponse.poll_interval_seconds || 3) * 1000;
              // Wrapped generation can take longer (LLM + queue). Be patient.
              const maxPolls = 300; // ~15 minutes at 3s interval
              let pollCount = 0;
              
              while (pollCount < maxPolls) {
                pollCount++;
                console.log(`🔄 Polling attempt ${pollCount}/${maxPolls}...`);
                
                // Wait before next poll
                // mild backoff to reduce load on long-running generations
                const pollInterval = Math.min(15000, Math.round(basePollInterval * (pollCount < 30 ? 1 : pollCount < 120 ? 1.5 : 2)));
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                
                try {
                  // Ensure polling request is unique to bypass proxy caches
                  const pollUrl = new URL(fetchUrl);
                  pollUrl.searchParams.set('poll_cb', Date.now());

                  // CRITICAL: Do NOT send forceFresh during polling (backend uses cached-vs-fresh policy).
                  const pollBody = { ...fetchBody };
                  delete pollBody.retry; // Don't signal retry on polls
                  delete pollBody.force_refresh;
                  delete pollBody.refresh;
                  
                  // CRITICAL FIX: Pass the nonce back so backend checks THIS specific job
                  // Otherwise it might return old cached data while the new job runs
                  if (apiResponse.nonce) {
                    pollBody.nonce = apiResponse.nonce;
                    pollUrl.searchParams.set('nonce', apiResponse.nonce);
                  }

                  const pollResponse = await fetch(pollUrl.toString(), {
                    method: method,
                    headers: {
                      'Authorization': `Bearer ${urlData.token}`,
                      'Content-Type': 'application/json'
                    },
                    cache: 'no-store',
                    body: method === 'POST' ? JSON.stringify(pollBody) : undefined
                  });
                  
                  if (pollResponse.ok) {
                    const pollData = await pollResponse.json();
                    
                    // Check if we have the actual dashboard now
                    if (pollData.slides) {
                      console.log('✅ Dashboard ready! Received slides.');
                      
                      // DETAILED DASHBOARD INSPECTION
                      console.log('🔍 Dashboard metadata:', {
                        version: pollData.version,
                        user_id: pollData.user_id,
                        generated_at: pollData.generated_at,
                        has_meta: !!pollData.meta,
                        is_fallback: pollData.meta?.is_fallback,
                        fallback_reason: pollData.meta?.fallback_reason,
                        cache: pollData.meta?.cache,
                        signature: pollData.meta?.signature
                      });
                      
                      // Check red_pill_forensic roasts to detect generic content (for logging only)
                      const roasts = pollData.slides?.red_pill_forensic?.roasts || [];
                      const knownGenericRoasts = [
                        "You have 47 tabs open and you're emotionally attached to all of them.",
                        "Your 'quick 5-minute task' has never taken 5 minutes. Ever.",
                        "You've started more projects than you've finished."
                      ];
                      const hasGenericRoasts = roasts.some(roast => knownGenericRoasts.includes(roast));
                      
                      if (hasGenericRoasts) {
                        console.log('⚠️ Note: Some generic roasts detected - may indicate limited data available');
                        console.log('   Roasts:', roasts);
                      }
                      
                      // Check if this is a fallback dashboard (backend explicitly marks these)
                      if (pollData.meta?.is_fallback) {
                        console.log('═'.repeat(80));
                        console.log('🚨 FALLBACK DASHBOARD DETECTED (SDK)');
                        console.log('═'.repeat(80));
                        console.log('⚠️ REASON:', pollData.meta.fallback_reason || 'Unknown reason');
                        console.log('⚠️ WARNING:', pollData.meta.warning || 'This dashboard contains generic content');
                        console.log('⚠️ This is NOT personalized data based on your connected accounts');
                        console.log('═'.repeat(80));
                      }
                      
                      apiResponse = pollData;
                      break;
                    } else if (pollData.status !== 'processing') {
                      console.warn('⚠️ Unexpected response during polling:', pollData);
                      apiResponse = pollData;
                      break;
                    }
                    
                    console.log('⏳ Still processing...');
                  } else {
                    console.warn(`⚠️ Poll failed with status ${pollResponse.status}`);
                  }
                } catch (pollErr) {
                  console.warn('⚠️ Poll request failed:', pollErr.message);
                }
              }
              
              if (!apiResponse?.slides && pollCount >= maxPolls) {
                console.warn('⏳ Wrapped polling reached max attempts; treating as still-processing (do not fail the flow)');
                requestResult.isTimeout = true;
                // Preserve processing state so UI continues loading and we avoid firing onComplete prematurely.
                apiResponse = apiResponse || { status: 'processing' };
              }
            }
            
            // Mark fetch as completed successfully
            fetchCompleted = true;
            
            console.log('✅ API Response received and parsed successfully');
            console.log('📦 Has slides?', !!apiResponse.slides);
            if (apiResponse.slides) {
              console.log('📊 Slides keys:', Object.keys(apiResponse.slides));
            }
            
            // For wrapped apps: If dashboard data is ready (not processing), signal completion
            // so the loading bar animates to 100% before showing results
            if (isWrappedApp && apiResponse?.slides && apiResponse.status !== 'processing') {
              console.log('✅ Wrapped dashboard data is ready (cached or fresh) - will signal completion after processing');
              // Note: We set wrappedDataReady to true later in handleDataRequestComplete
              // after all processing is done, so it happens in the right sequence
            }
            
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
            console.log('✅ Fetch completed - data ready');
          } else if (requestResult.isTimeout) {
             console.log('⏱️ Request timed out - passing timeout flag to app');
          } else if (fetchError) {
            console.error('❌ Fetch failed:', fetchError.message);
          }

          // Merge into result - include token and apiUrl even if fetch failed
          finalResult = {
            ...requestResult,
            apiResponse: apiResponse, // Raw response (null if CORS blocked)
            token: urlData.token,     // Token used - ALWAYS include this
            apiUrl: urlData.apiUrl    // URL used - ALWAYS include this
          };
          
          console.log('🔗 Final result ready:', {
            hasApiResponse: !!finalResult.apiResponse,
            hasSlides: !!finalResult.apiResponse?.slides,
            hasToken: !!finalResult.token
          });
          
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

    // Format response if requested and API response is present.
    // IMPORTANT: Do NOT format wrapped dashboard payloads (slides/dashboard),
    // because the formatter is designed for traits/personality shapes and can
    // strip/reshape the response, causing host apps to incorrectly fall back to mocks.
    let formattedResult = finalResult;
    const hasWrappedDashboardPayload =
      !!finalResult?.apiResponse?.slides ||
      !!finalResult?.apiResponse?.dashboard ||
      !!finalResult?.apiResponse?.data?.dashboard;

    if (formatResponse && finalResult?.apiResponse && !hasWrappedDashboardPayload) {
      try {
        formattedResult = {
          ...finalResult,
          apiResponse: formatOnairosResponse(finalResult.apiResponse, responseFormat)
        };
        console.log('🔥 Response formatted with dictionary:', formattedResult.apiResponse?.personalityDict || 'No personality data');
      } catch (error) {
        console.warn('🔥 Error formatting response:', error);
        // Continue with original result if formatting fails
      }
    } else if (formatResponse && hasWrappedDashboardPayload) {
      console.log('🎁 Wrapped dashboard detected - skipping response formatting to preserve slides');
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
      userData: updatedUserData,
      // Add appName and userHash for proper logging/formatting
      appName: webpageName || formattedResult.appName || 'Unknown App',
      userHash: updatedUserData?.email || updatedUserData?.username || accountIdentifier || formattedResult.userHash || 'Unknown User'
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
    // For non-wrapped apps, onComplete was already called from TrainingScreen
    // So we only call it here for wrapped apps OR if training screen was skipped
    // webpageName is already in scope from the component props
    const isWrappedAppForCallback = webpageName && webpageName.toLowerCase().includes('wrapped');
    
    if (onComplete && isWrappedAppForCallback) {
      try {
        const hasWrappedDashboard =
          !!enhancedResult?.apiResponse?.slides ||
          !!enhancedResult?.apiResponse?.dashboard ||
          !!enhancedResult?.apiResponse?.data?.dashboard;
        const stillProcessing =
          enhancedResult?.isTimeout === true ||
          enhancedResult?.apiResponse?.status === 'processing' ||
          !hasWrappedDashboard;

        if (stillProcessing) {
          // IMPORTANT: Do not call onComplete yet; many consuming apps will navigate away/unmount
          // the SDK, which looks like the loading modal "closed prematurely".
          console.log('🎁 Wrapped dashboard still processing - keeping loading screen open and NOT calling onComplete yet');
        } else {
          console.log('✅ Calling onComplete for wrapped app with final dashboard data');
        onComplete(enhancedResult);
        }
      } catch (error) {
        console.error('❌ Error in onComplete callback:', error);
      }
    } else if (onComplete && !isWrappedAppForCallback) {
      console.log('⏭️ Skipping onComplete for non-wrapped app (already called from TrainingScreen)');
    } else {
      console.log('🔥 No onComplete callback provided');
    }

    // WRAPPED APPS:
    // If the dashboard data is READY (slides/dashboard present), signal the loading page to complete.
    // Only wait for an explicit ready signal when the backend is still processing.
    if (isWrappedApp) {
      const hasWrappedDashboardNow =
        !!enhancedResult?.apiResponse?.slides ||
        !!enhancedResult?.apiResponse?.dashboard ||
        !!enhancedResult?.apiResponse?.data?.dashboard;
      const stillProcessingNow =
        enhancedResult?.isTimeout === true ||
        enhancedResult?.apiResponse?.status === 'processing' ||
        !hasWrappedDashboardNow;

      if (!stillProcessingNow) {
        console.log('🎁 Wrapped dashboard ready (slides present) - signaling loading complete');
        setWrappedDataReady(true);
        // Note: handleCloseOverlay will be called after WrappedLoadingPage animates to 100%
        return;
      }

      console.log('🎁 Wrapped app - still processing, waiting for dashboard ready signal');
      console.log('🔊 Setting up onairos-dashboard-ready event listener');

      // Listen for custom event from the wrapped app indicating dashboard is ready
      const handleDashboardReady = (event) => {
        console.log('✅✅✅ Dashboard ready signal received - signaling loading complete');
        console.log('📊 Event details:', event);
        setWrappedDataReady(true);
        // Note: handleCloseOverlay will be called after WrappedLoadingPage animates to 100%
        window.removeEventListener('onairos-dashboard-ready', handleDashboardReady);
      };

      window.addEventListener('onairos-dashboard-ready', handleDashboardReady);
      console.log('👂 Event listener attached, waiting for signal...');
    } else {
      // For non-wrapped apps, just close the modal - training already happened in TrainingScreen
      console.log('✅ Non-wrapped app: Training complete, closing overlay');
      handleCloseOverlay();
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
      case 'trainingScreen':
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
      case 'trainingScreen':
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
      case 'trainingScreen':
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

    console.log('🎨 renderContent called with currentFlow:', currentFlow);

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
            initialConnectedAccounts={userData?.connectedAccounts}
            onComplete={handleOnboardingComplete}
            onBack={() => {
              if (returnToDataRequestAfterOnboarding) {
                setReturnToDataRequestAfterOnboarding(false);
                // Sync connected apps from storage so DataRequest reflects newly connected platforms
                try {
                  const saved = JSON.parse(localStorage.getItem('onairosUser') || '{}');
                  if (saved && Array.isArray(saved.connectedAccounts)) {
                    setUserData((prev) => {
                      const merged = { ...(prev || {}), ...saved, connectedAccounts: saved.connectedAccounts };
                      try { localStorage.setItem('onairosUser', JSON.stringify(merged)); } catch {}
                      return merged;
                    });
                  }
                } catch {}
                setCurrentFlow('dataRequest');
              } else {
                setCurrentFlow('email');
              }
            }}
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
      case 'trainingScreen':
        console.log('🎓 Rendering TrainingScreen with userData:', {
          hasUserData: !!userData,
          hasToken: !!userData?.token,
          tokenPreview: userData?.token ? userData.token.substring(0, 20) + '...' : 'NO TOKEN',
          email: userData?.email,
          connectedAccounts: userData?.connectedAccounts
        });
        return (
          <TrainingScreen 
            onComplete={handleTrainingScreenComplete}
            onTrainingStart={() => setTrainingHasStarted(true)}
            userEmail={userData?.email}
            connectedAccounts={userData?.connectedAccounts || []}
            userToken={userData?.token}
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
            onConnectMoreApps={() => {
              // Go back to UniversalOnboarding but return here afterwards.
              // Connected apps are persisted in localStorage by UniversalOnboarding.
              // IMPORTANT: Refresh userData from localStorage to ensure connected accounts are current
              try {
                const savedUser = JSON.parse(localStorage.getItem('onairosUser') || '{}');
                if (savedUser && savedUser.connectedAccounts) {
                  setUserData((prev) => ({
                    ...(prev || {}),
                    ...savedUser,
                    connectedAccounts: savedUser.connectedAccounts
                  }));
                  console.log('🔄 Refreshed userData with connected accounts from localStorage:', savedUser.connectedAccounts);
                }
              } catch (e) {
                console.warn('⚠️ Failed to refresh userData from localStorage:', e);
              }
              setReturnToDataRequestAfterOnboarding(true);
              setCurrentFlow('onboarding');
            }}
            userEmail={userData?.email || userData?.username}
            requestData={requestData}
            appName={webpageName}
            autoFetch={autoFetch}
            testMode={testMode}
            appIcon={appIcon}
            connectedPlatforms={userData?.connectedAccounts || []}
            rawMemoriesOnly={rawMemoriesOnly}
            rawMemoriesConfig={rawMemoriesConfig}
            showTime={time}
            onLogout={handleLogout}
          />
        );
      case 'wrappedLoading':
        // CRITICAL: Only render WrappedLoadingPage for wrapped apps
        console.log('🎨 Rendering wrappedLoading with wrappedDataReady:', wrappedDataReady);
        const isWrappedAppCheck = webpageName && webpageName.toLowerCase().includes('wrapped');
        if (!isWrappedAppCheck) {
          console.warn('⚠️ wrappedLoading case should not be reached for non-wrapped app');
          return null;
        }
        return (
          <div className="flex-1 min-h-0">
            <WrappedLoadingPage 
              appName={webpageName} 
              isComplete={wrappedDataReady}
              onTransitionComplete={() => {
                console.log('✅ WrappedLoadingPage transition complete - closing overlay');
                handleCloseOverlay();
              }}
            />
          </div>
        );
      case 'loading':
        return <LoadingScreen onComplete={handleLoadingComplete} appName={webpageName} />;
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
          {/** Wrapped-only typography hook */}
          {/** Adds CSS variables --fontHeading/--fontBody via .onairos-wrapped-fonts */}
          {isMobileDevice ? (
            // Mobile Browser: Use ModalPageLayout with mobile-optimized props
            <ModalPageLayout
              visible={showOverlay}
              onClose={handleCloseOverlay}
              showBackButton={currentFlow !== 'welcome' && currentFlow !== 'email' && currentFlow !== 'loading' && currentFlow !== 'wrappedLoading'}
              onBack={() => {
                        if (currentFlow === 'onboarding') {
                          if (returnToDataRequestAfterOnboarding) {
                            setReturnToDataRequestAfterOnboarding(false);
                            // Sync connected apps from storage so DataRequest reflects newly connected platforms
                            try {
                              const saved = JSON.parse(localStorage.getItem('onairosUser') || '{}');
                              if (saved && Array.isArray(saved.connectedAccounts)) {
                                setUserData((prev) => {
                                  const merged = { ...(prev || {}), ...saved, connectedAccounts: saved.connectedAccounts };
                                  try { localStorage.setItem('onairosUser', JSON.stringify(merged)); } catch {}
                                  return merged;
                                });
                              }
                            } catch {}
                            setCurrentFlow('dataRequest');
                          } else {
                            setCurrentFlow('email');
                          }
                        }
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
              modalClassName={`onairos-modal onairos-modal-mobile ${(webpageName || '').toLowerCase().includes('wrapped') ? 'onairos-wrapped-fonts' : ''}`}
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
              modalStyle={currentFlow === 'onboarding' ? { height: '90vh', maxHeight: '90vh' } : {}}
              onBack={() => {
                if (currentFlow === 'email') setCurrentFlow('welcome');
                if (currentFlow === 'onboarding') {
                  if (returnToDataRequestAfterOnboarding) {
                    setReturnToDataRequestAfterOnboarding(false);
                    // Sync connected apps from storage so DataRequest reflects newly connected platforms
                    try {
                      const saved = JSON.parse(localStorage.getItem('onairosUser') || '{}');
                      if (saved && Array.isArray(saved.connectedAccounts)) {
                        setUserData((prev) => {
                          const merged = { ...(prev || {}), ...saved, connectedAccounts: saved.connectedAccounts };
                          try { localStorage.setItem('onairosUser', JSON.stringify(merged)); } catch {}
                          return merged;
                        });
                      }
                    } catch {}
                    setCurrentFlow('dataRequest');
                  } else {
                    setCurrentFlow('email');
                  }
                }
                if (currentFlow === 'pin') setCurrentFlow('onboarding'); 
                if (currentFlow === 'training') setCurrentFlow('pin');
                if (currentFlow === 'dataRequest') setCurrentFlow('onboarding');
              }}
              title=""
              subtitle=""
              icon={null}
              centerContent={true}
              contentClassName={currentFlow !== 'welcome' ? "!p-0" : ""}
              modalClassName={`onairos-modal ${(webpageName || '').toLowerCase().includes('wrapped') ? 'onairos-wrapped-fonts' : ''}`}
            >
              {/* 
                Desktop: Make the shell a flex column (onboarding only) so UniversalOnboarding can flex to fill
                the modal height. Without this, the CTA can't be pinned to the bottom and appears to "float"
                with empty space below (since flex: 1 doesn't apply unless the parent is a flex container).
              */}
              <div className={currentFlow === 'onboarding' ? "onairos-modal-shell flex-1 min-h-0 flex flex-col" : "onairos-modal-shell"}>
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
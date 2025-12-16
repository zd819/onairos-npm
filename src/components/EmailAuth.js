import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import PrimaryButton from './ui/PrimaryButton.jsx';
import { COLORS } from '../theme/colors.js';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { isMobileBrowser } from '../utils/capacitorDetection';

// Custom Google Button for consistent dimensions
const GoogleButton = ({ onPress, disabled }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onPress}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`w-full h-14 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5] flex items-center justify-center px-4 transition-all ${isPressed ? 'bg-[#F0F0F0] border-[#D0D0D0] scale-[0.98]' : 'shadow-sm'}`}
      style={{ 
        outline: 'none',
        // Match dimensions of the email input (h-14 = 3.5rem = 56px)
        height: '56px'
      }}
      type="button"
    >
      <img 
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
        alt="Google" 
        className="w-5 h-5 mr-3" 
      />
      <span 
        className="text-base font-medium text-[#1F242F]"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        Continue with Google
      </span>
    </button>
  );
};

export default function EmailAuth({ onSuccess, testMode = false }) {
  const [email, setEmail] = useState('');
  // Store verification code as per-digit state
  const [codeDigits, setCodeDigits] = useState(() => Array(6).fill(''));
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'success'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(true);
  const [emailServiceMessage, setEmailServiceMessage] = useState('');
  
  const isCodeComplete = codeDigits.every((d) => typeof d === 'string' && d.length === 1);
  const resetCodeDigits = () => setCodeDigits(Array(6).fill(''));
  const isMobileWeb = isMobileBrowser();

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const postJson = async (url, apiKey, body) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    return response;
  };

  const requestEmailVerification = async ({ baseUrl, apiKey, email: rawEmail }) => {
    const normalizedEmail = (rawEmail || '').trim().toLowerCase();

    // New endpoint
    try {
      const res = await postJson(`${baseUrl}/email/verification`, apiKey, {
        email: normalizedEmail,
        action: 'request',
      });
      if (res.ok) return await res.json();
    } catch {
      // ignore and fall back
    }

    // Legacy endpoint
    const legacyRes = await postJson(`${baseUrl}/email/verify`, apiKey, { email: normalizedEmail });
    if (!legacyRes.ok) {
      let msg = 'Failed to send verification code';
      try {
        const err = await legacyRes.json();
        if (err?.error) msg = err.error;
      } catch {}
      throw new Error(msg);
    }
    return await legacyRes.json();
  };

  const verifyEmailCode = async ({ baseUrl, apiKey, email: rawEmail, code: rawCode }) => {
    const normalizedEmail = (rawEmail || '').trim().toLowerCase();
    const normalizedCode = String(rawCode || '').trim();

    // New endpoint
    try {
      const res = await postJson(`${baseUrl}/email/verification`, apiKey, {
        email: normalizedEmail,
        action: 'verify',
        code: normalizedCode,
      });
      if (res.ok) return await res.json();
      try {
        const err = await res.json();
        throw new Error(err?.error || err?.message || 'Verification failed');
      } catch (e) {
        if (e instanceof Error) throw e;
      }
    } catch (e) {
      const msg = e?.message || '';
      if (msg && !msg.toLowerCase().includes('not found') && !msg.toLowerCase().includes('cannot')) {
        // Keep going to legacy
      }
    }

    // Legacy endpoint with retry
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const res = await postJson(`${baseUrl}/email/verify/confirm`, apiKey, {
        email: normalizedEmail,
        code: normalizedCode,
      });

      if (res.ok) return await res.json();

      let errMsg = 'Invalid verification code';
      try {
        const err = await res.json();
        if (err?.error) errMsg = err.error;
        if (typeof err?.attemptsRemaining === 'number') {
          errMsg = `${errMsg} (attempts remaining: ${err.attemptsRemaining})`;
        }
      } catch {}

      if (errMsg.toLowerCase().includes('no verification code found') && attempt < maxAttempts) {
        await sleep(150 * attempt);
        continue;
      }

      throw new Error(errMsg);
    }

    throw new Error('Verification failed');
  };

  const handleOAuthSuccess = async (gmailEmail) => {
    try {
      setIsLoading(true);
      console.log('✅ Google OAuth completed successfully, email:', gmailEmail);

      const normalizedEmail = (gmailEmail || '').trim().toLowerCase();
      setEmail(normalizedEmail);

      // Check if this email already has an account in the backend
      const baseUrl = (typeof window !== 'undefined' && window.onairosBaseUrl) || 'https://api2.onairos.uk';
      const apiKey = (typeof window !== 'undefined' && window.onairosApiKey) || 'ona_VvoHNg1fdCCUa9eBy4Iz3IfvXdgLfMFI7TNcyHLDKEadPogkbjAeE2iDOs6M7Aey';

      let accountInfo = null;
      let accountStatus = null;
      let existingUser = false;

      try {
        console.log('🔍 Checking if account exists for:', normalizedEmail);
        const accountCheckResponse = await fetch(`${baseUrl}/getAccountInfo/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            Info: {
              identifier: normalizedEmail
            }
          })
        });

        if (accountCheckResponse.ok) {
          const accountData = await accountCheckResponse.json();
          
          if (accountData.AccountInfo) {
            accountInfo = accountData.AccountInfo;
            accountStatus = accountData.accountStatus;
            existingUser = accountStatus?.exists || false;
            
            console.log('✅ Account check complete:', {
              exists: existingUser,
              hasTrainedModel: accountStatus?.hasTrainedModel,
              connectedPlatforms: accountStatus?.connectedPlatforms
            });
          } else {
            console.log('ℹ️ No existing account found - new user');
          }
        } else {
          console.log('ℹ️ Account check returned non-OK status - treating as new user');
        }
      } catch (accountCheckError) {
        console.warn('⚠️ Could not check account status, treating as new user:', accountCheckError);
      }

      setStep('success');
      setIsLoading(false);

      setTimeout(() => {
        onSuccess({
          email: normalizedEmail,
          verified: true,
          token: null,
          userName: normalizedEmail.split('@')[0],
          existingUser: existingUser,
          accountInfo: accountInfo,
          accountStatus: accountStatus,
          isNewUser: !existingUser,
          flowType: existingUser ? 'dataRequest' : 'onboarding',
          adminMode: false,
          userCreated: !existingUser,
          accountDetails: existingUser ? accountInfo : {
            email: normalizedEmail,
            createdAt: new Date().toISOString(),
            ssoProvider: 'gmail'
          }
        });
      }, 400);
    
    } catch (error) {
      console.error('❌ Error handling OAuth success:', error);
      setError('Failed to continue with Google authentication. Please try again.');
      setIsLoading(false);
    }
  };

  // Check for Gmail OAuth return (URL params or localStorage)
  useEffect(() => {
    const checkGmailOAuthSuccess = () => {
      console.log('🔍 Checking for Gmail OAuth return...');
      
      // First check URL params (oauth-callback.html redirects with these)
      const urlParams = new URLSearchParams(window.location.search);
      const oauthSuccess = urlParams.get('onairos_oauth_success');
      const oauthPlatform = urlParams.get('onairos_oauth_platform');
      const oauthEmail = urlParams.get('onairos_oauth_email');
      
      if (oauthSuccess === 'true' && oauthPlatform === 'gmail' && oauthEmail) {
        console.log('✅ Gmail OAuth success detected in URL params');
        
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
        // Clean up localStorage
        localStorage.removeItem('onairos_gmail_success');
        localStorage.removeItem('onairos_gmail_timestamp');
        localStorage.removeItem('onairos_oauth_context');
        localStorage.removeItem('onairos_oauth_platform');
        localStorage.removeItem('onairos_gmail_email');
        localStorage.removeItem('onairos_oauth_email');
        
        // Handle OAuth success
        handleOAuthSuccess(oauthEmail);
        return;
      }
      
      // Fallback: Check localStorage (for older flows or edge cases)
      const gmailSuccess = localStorage.getItem('onairos_gmail_success');
      const gmailTimestamp = localStorage.getItem('onairos_gmail_timestamp');
      const oauthContext = localStorage.getItem('onairos_oauth_context');
      
      if (gmailSuccess === 'true' && gmailTimestamp && oauthContext === 'gmail-auth') {
        const timestampNum = parseInt(gmailTimestamp, 10);
        if (Date.now() - timestampNum < 60000) { // 60 second window
          const gmailEmail = localStorage.getItem('onairos_gmail_email') || 
                           localStorage.getItem('onairos_oauth_email');
          
          console.log('✅ Gmail OAuth success detected in localStorage');
          
          localStorage.removeItem('onairos_gmail_success');
          localStorage.removeItem('onairos_gmail_timestamp');
          localStorage.removeItem('onairos_oauth_context');
          localStorage.removeItem('onairos_oauth_platform');
          localStorage.removeItem('onairos_gmail_email');
          localStorage.removeItem('onairos_oauth_email');
          
          if (gmailEmail) {
            handleOAuthSuccess(gmailEmail);
          }
        }
      }
    };

    // Check immediately on mount
    checkGmailOAuthSuccess();
    
    // For Capacitor native: listen for app resume (when Browser closes)
    const handleAppResume = () => {
      console.log('📱 App resumed, checking for OAuth completion...');
      setTimeout(checkGmailOAuthSuccess, 500);
    };
    
    // Listen for storage events (when user clicks "Return to App" from oauth-callback)
    const handleStorageChange = (e) => {
      if (e.key === 'onairos_should_check_oauth' && e.newValue === 'true') {
        console.log('🔄 Storage event detected, checking for OAuth completion...');
        localStorage.removeItem('onairos_should_check_oauth');
        setTimeout(checkGmailOAuthSuccess, 300);
      }
    };
    
    // Listen for window focus (when user returns from OAuth page)
    const handleFocus = () => {
      console.log('👁️ Window focused, checking for OAuth completion...');
      setTimeout(checkGmailOAuthSuccess, 300);
    };
    
    // Listen for postMessage from OAuth popup window
    const handleMessage = (event) => {
      // Validate message structure and type
      if (event.data && event.data.type === 'oauth-success') {
        console.log('📨 Received postMessage from OAuth popup:', event.data);
        
        if (event.data.platform === 'gmail' && event.data.email) {
          console.log('✅ Gmail OAuth success via postMessage');
          
          // Clean up localStorage
          localStorage.removeItem('onairos_gmail_success');
          localStorage.removeItem('onairos_gmail_timestamp');
          localStorage.removeItem('onairos_oauth_context');
          localStorage.removeItem('onairos_oauth_platform');
          localStorage.removeItem('onairos_gmail_email');
          localStorage.removeItem('onairos_oauth_email');
          localStorage.removeItem('onairos_return_url');
          
          // Handle OAuth success
          handleOAuthSuccess(event.data.email);
        }
      }
    };
    
    // Listen for Capacitor app state changes
    if (typeof window !== 'undefined') {
      if (window.Capacitor) {
        document.addEventListener('resume', handleAppResume);
      }
      window.addEventListener('focus', handleFocus);
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('message', handleMessage);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        if (window.Capacitor) {
          document.removeEventListener('resume', handleAppResume);
        }
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Store context and return URL before redirect
      localStorage.setItem('onairos_oauth_context', 'gmail-auth');
      localStorage.setItem('onairos_oauth_platform', 'gmail');
      
      // Store current URL as return URL so OAuth callback can redirect back
      const returnUrl = window.location.href;
      localStorage.setItem('onairos_return_url', returnUrl);
      console.log('📍 Stored return URL:', returnUrl);
      
      console.log('🔐 Requesting Gmail OAuth authorization...');
      
      // Get the OAuth URL from backend
      const baseUrl = (typeof window !== 'undefined' && window.onairosBaseUrl) || 'https://api2.onairos.uk';
      const apiKey = (typeof window !== 'undefined' && window.onairosApiKey) || 'ona_VvoHNg1fdCCUa9eBy4Iz3IfvXdgLfMFI7TNcyHLDKEadPogkbjAeE2iDOs6M7Aey';
      
      const response = await fetch(`${baseUrl}/gmail/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          session: {
            username: localStorage.getItem('username') || email || 'user'
          },
          returnUrl: returnUrl  // Pass return URL to backend so it can include it in callback
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get OAuth URL from server');
      }
      
      const result = await response.json();
      console.log('✅ Gmail OAuth URL received:', result);
      
      if (!result.gmailURL) {
        throw new Error('No OAuth URL received from server');
      }
      
      // Redirect to Google OAuth
      const isNative = Capacitor.isNativePlatform();
      const isMobile = isMobileBrowser();
      console.log('📱 Platform:', isNative ? 'Native' : isMobile ? 'Mobile Web' : 'Desktop Web');
      
      if (isNative) {
        console.log('🚀 Opening Gmail OAuth in Capacitor Browser');
        await Browser.open({ 
          url: result.gmailURL,
          windowName: '_blank',
          presentationStyle: 'fullscreen'
        });
        // Don't reset loading state - we want to show loading until OAuth completes
      } else if (isMobile) {
        console.log('🌐 Redirecting to Gmail OAuth in mobile browser (same window)');
        // For mobile web, redirect in the same window
        window.location.href = result.gmailURL;
      } else {
        console.log('🪟 Opening Gmail OAuth in desktop popup window');
        // For desktop web, open in a popup window
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        const popup = window.open(
          result.gmailURL,
          'GoogleOAuth',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no`
        );
        
        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }
        
        // Poll for popup closure and check localStorage for OAuth completion
        const pollInterval = setInterval(() => {
          if (popup.closed) {
            console.log('🚪 Popup closed by user');
            clearInterval(pollInterval);
            setIsLoading(false);
          }
        }, 500);
        
        // Don't reset loading state - the OAuth completion listener will handle it
      }
      
    } catch (e) {
      console.error('❌ Google Sign In failed:', e);
      setError('Failed to initialize Google Sign In. Please try again.');
      setIsLoading(false);
    }
  };

  // Auto-focus code input
  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => {
        const firstInput = document.querySelector('input.onairos-verification-digit');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }, [step]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailSent(true);
    setEmailServiceMessage('');
    resetCodeDigits();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      if (testMode) {
        setTimeout(() => {
          setStep('code');
          setIsLoading(false);
        }, 800);
      } else {
        const baseUrl = (typeof window !== 'undefined' && window.onairosBaseUrl) || 'https://api2.onairos.uk';
        const apiKey = (typeof window !== 'undefined' && window.onairosApiKey) || 'ona_VvoHNg1fdCCUa9eBy4Iz3IfvXdgLfMFI7TNcyHLDKEadPogkbjAeE2iDOs6M7Aey';
        const data = await requestEmailVerification({ baseUrl, apiKey, email });

        setEmailSent(data.emailSent !== false);
        setEmailServiceMessage(data.message || '');

        setStep('code');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Email request error:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (testMode) {
        const code = codeDigits.join('');
        if (code === '123456' || isCodeComplete) {
          setStep('success');
          setTimeout(() => {
            onSuccess({ 
              email, 
              verified: true, 
              token: 'test-token',
              userName: email.split('@')[0],
              existingUser: false,
              isNewUser: true,
              flowType: 'onboarding',
              accountDetails: {
                email: email,
                createdAt: new Date().toISOString(),
                testAccount: true
              }
            });
          }, 600);
        } else {
          setError('Invalid code.');
          setIsLoading(false);
        }
      } else {
        const baseUrl = (typeof window !== 'undefined' && window.onairosBaseUrl) || 'https://api2.onairos.uk';
        const apiKey = (typeof window !== 'undefined' && window.onairosApiKey) || 'ona_VvoHNg1fdCCUa9eBy4Iz3IfvXdgLfMFI7TNcyHLDKEadPogkbjAeE2iDOs6M7Aey';
        const codeToSubmit = codeDigits.join('');

        if (!isCodeComplete) {
          throw new Error('Please enter the full 6-digit code.');
        }

        const data = await verifyEmailCode({ baseUrl, apiKey, email, code: codeToSubmit.trim() });
        
        if (!data.success) {
          throw new Error(data.error || 'Verification failed');
        }

        // Use isNewUser flag from verification response (DO NOT check getAccountInfo after verification!)
        // The verification endpoint creates the account, so checking after will always find them as existing
        const isNewUser = data.isNewUser !== undefined ? data.isNewUser : true;
        const existingUser = !isNewUser;
        const accountInfo = data.user || null;
        
        console.log('✅ Email verification complete:', {
          isNewUser,
          existingUser,
          flowType: data.flowType,
          userState: data.userState,
          email: email
        });

        setStep('success');
        setTimeout(() => {
          onSuccess({ 
            email, 
            verified: true, 
            token: data.token || data.jwtToken,
            userName: data.userName || accountInfo?.userName || email.split('@')[0],
            existingUser: existingUser,
            accountInfo: accountInfo,
            accountStatus: data.existingUserData || null, // Use existingUserData from verification response
            isNewUser: isNewUser,
            flowType: data.flowType || (isNewUser ? 'onboarding' : 'dataRequest'),
            adminMode: false,
            userCreated: isNewUser,
            accountDetails: accountInfo || {
              email: email,
              createdAt: data.createdAt || new Date().toISOString(),
              provider: 'email'
            }
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setError(error.message || 'Invalid code. Please try again.');
      setIsLoading(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderEmailStep = () => {
    // Mobile Web Layout (OnairosEvents Style)
    if (isMobileWeb) {
      return (
        <div className="w-full flex flex-col h-full px-6 pt-8">
          <div className="flex-1 flex flex-col">
            <div className="mb-8 w-full text-left">
              <h1 className="text-2xl font-bold mb-2 leading-tight" style={{ fontFamily: 'IBM Plex Sans, system-ui, sans-serif', color: '#000000' }}>
                Build your Onairos persona to own your digital identity
          </h1>
              <p className="text-base" style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#62646C' }}>
                Sign in or create an account
              </p>
        </div>

            {/* Email Input */}
            <div className="mb-4 w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
                className="w-full outline-none transition-all placeholder-gray-500 bg-[#F5F5F5] rounded-lg border border-[#E5E5E5] text-[#1F242F]"
            style={{ 
                  height: '56px', 
                  paddingLeft: 16, 
                  paddingRight: 16, 
                  fontSize: 16, 
              fontFamily: 'Inter, system-ui, sans-serif',
                  color: '#000000',
              WebkitTextFillColor: '#000000'
            }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEmailSubmit(e); }}
                disabled={isLoading}
                autoFocus
          />
        </div>

            {/* Continue Button (Below Email Input) */}
            <div className="mb-6 w-full">
              <PrimaryButton
                label={isLoading ? 'Loading...' : 'Continue'}
                onClick={handleEmailSubmit}
                disabled={isLoading || !email.trim()}
                loading={isLoading}
                className="!text-white w-full h-14 rounded-full"
                textStyle={{ color: '#FFFFFF' }}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] bg-[#E5E5E5] flex-1" />
              <span className="text-sm text-[#86888E]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Or</span>
              <div className="h-[1px] bg-[#E5E5E5] flex-1" />
            </div>

            {/* Google Button */}
            <div className="mb-8 w-full">
              <GoogleButton onPress={handleGoogleSignIn} disabled={isLoading} />
        </div>

        {error && (
          <div className="mb-6">
            <p className="text-sm text-center" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}
      </div>
        </div>
      );
    }

    // Desktop Layout (Centered Card)
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-gray-900" style={{ fontFamily: 'IBM Plex Sans, system-ui, sans-serif' }}>Sign in to Onairos</h1>
        <p className="text-gray-600 mb-8" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Access your digital persona</p>

        <div className="w-full space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            style={{ color: '#000000', WebkitTextFillColor: '#000000', fontFamily: 'Inter, system-ui, sans-serif' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleEmailSubmit(e); }}
            disabled={isLoading}
            autoFocus
          />
        <button
          onClick={handleEmailSubmit}
          disabled={isLoading || !email.trim()}
            className="w-full bg-black text-white font-medium py-2 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
            {isLoading ? 'Sending...' : 'Continue with Email'}
        </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <GoogleButton onPress={handleGoogleSignIn} disabled={isLoading} />
          
          {error && <p className="mt-2 text-sm text-red-500" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{error}</p>}
      </div>
    </div>
  );
  };

  const renderCodeStep = () => (
    <div className="w-full flex flex-col h-full px-6 pt-16 text-center">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'IBM Plex Sans, system-ui, sans-serif', color: COLORS.textPrimary }}>
          Enter verification code
        </h1>
      <p className="mb-6" style={{ fontFamily: 'Inter, system-ui, sans-serif', color: COLORS.textSecondary }}>
        {emailSent ? `We've sent a 6-digit code to ${email}` : `Code generated for ${email}`}
        </p>

      <div className="flex justify-center space-x-3 mb-8">
          {Array.from({ length: 6 }, (_, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength="1"
            value={codeDigits[index] || ''}
              onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              const next = [...codeDigits];
              next[index] = val;
              setCodeDigits(next);
              if (val && index < 5) e.target.parentElement.children[index + 1].focus();
              }}
              onKeyDown={(e) => {
              if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
                e.target.parentElement.children[index - 1].focus();
                }
              }}
            className="onairos-verification-digit w-12 h-12 border rounded-lg text-center text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            style={{ borderColor: COLORS.border, backgroundColor: '#F5F5F5', color: '#000000', WebkitTextFillColor: '#000000', caretColor: '#000000' }}
            />
          ))}
      </div>

      {error && <p className="mb-6 text-sm text-red-500" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{error}</p>}

      <div className="max-w-sm mx-auto w-full">
          <PrimaryButton
            label="Continue"
            onClick={handleCodeSubmit}
            loading={isLoading}
          disabled={isLoading || !isCodeComplete}
            className="!text-white"
            textStyle={{ color: '#FFFFFF' }}
          />
        </div>

          <button
        onClick={() => { resetCodeDigits(); setStep('email'); }}
        className="mt-6 text-sm text-gray-500 font-medium"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Use a different email
          </button>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="w-full flex flex-col items-center pt-16 px-12 space-y-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'IBM Plex Sans, system-ui, sans-serif' }}>Email verified!</h2>
        <p className="text-gray-500" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Setting up your account...</p>
      </div>
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
    </div>
  );

  return (
    <div className="w-full h-full">
      {step === 'email' && renderEmailStep()}
      {step === 'code' && renderCodeStep()}
      {step === 'success' && renderSuccessStep()}
    </div>
  );
} 

import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import PrimaryButton from './ui/PrimaryButton.jsx';
import { COLORS } from '../theme/colors.js';

export default function EmailAuth({ onSuccess, testMode = true }) {
  const [email, setEmail] = useState('');
  // Store verification code as per-digit state to avoid losing position when users click/paste/autofill.
  const [codeDigits, setCodeDigits] = useState(() => Array(6).fill(''));
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'success'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(true); // Track if email was actually sent
  const [emailServiceMessage, setEmailServiceMessage] = useState(''); // Store service message
  const code = codeDigits.join('');
  const isCodeComplete = codeDigits.every((d) => typeof d === 'string' && d.length === 1);
  const resetCodeDigits = () => setCodeDigits(Array(6).fill(''));

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

  // Prefer the newer single-endpoint API: POST /email/verification { action: 'request'|'verify' }
  // Fall back to legacy /email/verify and /email/verify/confirm if needed.
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
      // If it's a hard failure, surface its message
      try {
        const err = await res.json();
        throw new Error(err?.error || err?.message || 'Verification failed');
      } catch (e) {
        // If parsing fails, fall through to legacy retry below
        if (e instanceof Error) throw e;
      }
    } catch (e) {
      // If server doesn't support /email/verification or network hiccup, try legacy below.
      // If it's a real "invalid code" error, we rethrow and don't spam retries.
      const msg = e?.message || '';
      if (msg && !msg.toLowerCase().includes('not found') && !msg.toLowerCase().includes('cannot')) {
        // Keep going to legacy; it might be the only supported path.
      }
    }

    // Legacy endpoint with light retry for multi-instance deployments:
    // "No verification code found" often means request+confirm hit different servers.
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

      // Retry only for the "code missing" case
      if (errMsg.toLowerCase().includes('no verification code found') && attempt < maxAttempts) {
        await sleep(150 * attempt);
        continue;
      }

      throw new Error(errMsg);
    }

    throw new Error('Verification failed');
  };

  // Helper function to handle OAuth success (Gmail) - defined early for useEffect
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
            
            console.log('✅ Existing account found:', {
              exists: existingUser,
              hasTrainedModel: accountStatus?.hasTrainedModel,
              hasPersonalityTraits: accountStatus?.hasPersonalityTraits,
              connectedPlatforms: accountStatus?.connectedPlatforms,
              needsDataConnection: accountStatus?.needsDataConnection,
              needsTraining: accountStatus?.needsTraining,
              canUseInference: accountStatus?.canUseInference
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
          accountStatus: accountStatus, // NEW: Pass the accountStatus object
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

  // Check for Gmail OAuth success on mount (after redirect back)
  useEffect(() => {
    const checkGmailOAuthSuccess = () => {
      const gmailSuccess = localStorage.getItem('onairos_gmail_success');
      const gmailTimestamp = localStorage.getItem('onairos_gmail_timestamp');
      const oauthContext = localStorage.getItem('onairos_oauth_context');
      
      // Only process if we're coming back from Gmail auth flow
      if (gmailSuccess === 'true' && gmailTimestamp && oauthContext === 'gmail-auth') {
        const timestampNum = parseInt(gmailTimestamp, 10);
        const now = Date.now();
        
        // Only process if timestamp is recent (within last 30 seconds)
        if (now - timestampNum < 30000) {
          console.log('✅ Gmail OAuth completed - processing redirect back');
          
          // Get email from localStorage
          const gmailEmail = localStorage.getItem('onairos_gmail_email') || 
                           localStorage.getItem('onairos_oauth_email');
          
          // Clean up localStorage
          localStorage.removeItem('onairos_gmail_success');
          localStorage.removeItem('onairos_gmail_timestamp');
          localStorage.removeItem('onairos_oauth_context');
          localStorage.removeItem('onairos_return_url');
          
          if (gmailEmail) {
            // Process OAuth success
            handleOAuthSuccess(gmailEmail);
          }
        }
      }
    };

    checkGmailOAuthSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Check for OAuth completion on mount (for same-page redirect flow)
  useEffect(() => {
    const checkOAuthCompletion = () => {
      // Check URL params for OAuth completion
      const urlParams = new URLSearchParams(window.location.search);
      const oauthSuccess = urlParams.get('onairos_oauth_success');
      const oauthPlatform = urlParams.get('onairos_oauth_platform');
      const oauthEmail = urlParams.get('onairos_oauth_email');

      if (oauthSuccess === 'true' && oauthPlatform === 'gmail' && oauthEmail) {
        console.log('✅ Gmail OAuth completion detected on page load');
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        // Handle OAuth success
        handleOAuthSuccess(oauthEmail);
      } else {
        // Check localStorage for OAuth completion (fallback)
        const success = localStorage.getItem('onairos_gmail_success');
        const timestamp = localStorage.getItem('onairos_gmail_timestamp');
        const gmailEmail = localStorage.getItem('onairos_gmail_email');

        if (success === 'true' && timestamp && gmailEmail) {
          const timestampNum = parseInt(timestamp, 10);
          const now = Date.now();
          
          // Only process if timestamp is recent (within last 60 seconds)
          if (now - timestampNum < 60000) {
            console.log('✅ Gmail OAuth completion detected via localStorage');
            // Clean up localStorage
            localStorage.removeItem('onairos_gmail_success');
            localStorage.removeItem('onairos_gmail_timestamp');
            // Handle OAuth success
            handleOAuthSuccess(gmailEmail);
          }
        }
      }
    };

    checkOAuthCompletion();
  }, []); // Run once on mount

  // Auto-focus first PIN input when code step loads
  useEffect(() => {
    if (step === 'code') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const firstInput = document.querySelector('input.onairos-verification-digit');
        if (firstInput) {
          firstInput.focus();
        }
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
    setEmailSent(true); // Reset email status
    setEmailServiceMessage(''); // Reset service message
    resetCodeDigits();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      if (testMode) {
        // Test mode: Skip API call completely, simulate instant success
        console.log('🧪 Test mode: Simulating email verification request for:', email);
        setTimeout(() => {
          setStep('code');
          setIsLoading(false);
          console.log('🧪 Test mode: Email verification simulated successfully');
        }, 800); // Shorter delay for faster testing
      } else {
        // Production mode: Use proper email verification API from schema
        const baseUrl = (typeof window !== 'undefined' && window.onairosBaseUrl) || 'https://api2.onairos.uk';
        const apiKey = (typeof window !== 'undefined' && window.onairosApiKey) || 'ona_VvoHNg1fdCCUa9eBy4Iz3IfvXdgLfMFI7TNcyHLDKEadPogkbjAeE2iDOs6M7Aey';
        const data = await requestEmailVerification({ baseUrl, apiKey, email });

        console.log('📧 Email request response:', data);

        // Store email service status
        // /email/verify returns emailSent, /email/verification typically does not.
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

  // Handle Google Sign-In success (using official GoogleLogin component)
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setError('');
      console.log('✅ Google Sign-In successful, received credential');

      // Decode the JWT credential to get user info
      const credential = credentialResponse.credential;
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const userInfo = JSON.parse(jsonPayload);
      const gmailEmail = userInfo.email;
      
      console.log('✅ Decoded user email from Google:', gmailEmail);
      console.log('✅ User info:', { 
        email: userInfo.email, 
        name: userInfo.name,
        picture: userInfo.picture,
        email_verified: userInfo.email_verified
      });

      // Optional: Send to backend for verification/storage
      try {
        const sdkConfig = {
          baseUrl: 'https://api2.onairos.uk',
          apiKey: window.onairosApiKey || 'test-key',
        };

        await fetch(`${sdkConfig.baseUrl}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': sdkConfig.apiKey,
          },
          body: JSON.stringify({
            credential: credential,
            email: gmailEmail,
            userInfo: userInfo,
          }),
        });
      } catch (backendError) {
        console.warn('⚠️ Backend verification failed, continuing anyway:', backendError);
      }

      // Continue with the OAuth success flow
      handleOAuthSuccess(gmailEmail);

    } catch (error) {
      console.error('❌ Google Sign-In processing failed:', error);
      setError('Google authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('❌ Google Sign-In failed');
    setError('Google authentication failed. Please try again.');
    setIsLoading(false);
  };

  // handleOAuthSuccess is defined at the top of the component for use in useEffect

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (testMode) {
        // Test mode: Skip API call completely, simulate verification
        console.log('🧪 Test mode: Simulating code verification for:', email, 'with code:', code);
        
        if (code === '123456' || isCodeComplete) {
          setStep('success');
          setTimeout(() => {
            // Simulate new user for design testing
            const simulatedResponse = { 
              email, 
              verified: true, 
              token: 'test-token-' + Date.now(),
              userName: email.split('@')[0],
              existingUser: false, // Always simulate new user for full flow testing
              accountInfo: null,
              isNewUser: true,
              flowType: 'onboarding',
              adminMode: false,
              userCreated: true,
              accountDetails: {
                email: email,
                createdAt: new Date().toISOString(),
                testAccount: true
              }
            };
            console.log('🧪 Test mode: Simulated verification successful, user data:', simulatedResponse);
            onSuccess(simulatedResponse);
          }, 600); // Faster for design testing
        } else {
          setError('Invalid code. Use any 6-digit code (e.g., 123456) for testing.');
          setIsLoading(false);
        }
      } else {
        // Production mode: Use real email verification API from schema
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

        console.log('📧 Email verification response:', data);

        // NEW: Check account status explicitly, same as Google sign-in flow
        // This ensures consistent behavior between Google and email auth
        let accountInfo = data.accountInfo || null;
        let accountStatus = data.accountStatus || null;
        let existingUser = data.existingUser || false;

        try {
          console.log('🔍 Checking account status for:', email);
          const accountCheckResponse = await fetch(`${baseUrl}/getAccountInfo/email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
            body: JSON.stringify({
              Info: {
                identifier: email.trim().toLowerCase()
              }
            })
          });

          if (accountCheckResponse.ok) {
            const accountData = await accountCheckResponse.json();
            
            if (accountData.AccountInfo) {
              accountInfo = accountData.AccountInfo;
              accountStatus = accountData.accountStatus;
              existingUser = accountStatus?.exists || false;
              
              console.log('✅ Account status from explicit check:', {
                exists: existingUser,
                hasTrainedModel: accountStatus?.hasTrainedModel,
                hasPersonalityTraits: accountStatus?.hasPersonalityTraits,
                connectedPlatforms: accountStatus?.connectedPlatforms,
                needsDataConnection: accountStatus?.needsDataConnection,
                needsTraining: accountStatus?.needsTraining,
                canUseInference: accountStatus?.canUseInference
              });
            } else {
              console.log('ℹ️ No existing account found - new user');
            }
          } else {
            console.log('ℹ️ Account check returned non-OK status - using verification response data');
          }
        } catch (accountCheckError) {
          console.warn('⚠️ Could not check account status, using verification response data:', accountCheckError);
        }

        setStep('success');
        setTimeout(() => {
          // Pass complete API response with explicit account check data
          onSuccess({ 
            email, 
            verified: true, 
            token: data.token || data.jwtToken,
            userName: data.userName,
            existingUser: existingUser,
            accountInfo: accountInfo,
            accountStatus: accountStatus, // Now includes explicit account check
            isNewUser: !existingUser, // Based on explicit account check
            flowType: existingUser ? 'dataRequest' : 'onboarding',
            adminMode: data.adminMode,
            userCreated: data.userCreated,
            accountDetails: accountInfo || data.accountDetails || {
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

  const renderEmailStep = () => (
    <div className="w-full flex flex-col" style={{ height: '100%' }}>
      {/* Content - Flexible center area */}
      <div className="px-12 pt-16 pb-8 text-center flex-1 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-balance leading-tight">
            Use pre-existing Persona or create a new one in seconds
          </h1>
          <p className="text-gray-600 text-base">Sign in or create an account</p>
        </div>

        <div className="mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full max-w-sm mx-auto px-4 py-4 text-base bg-gray-50 border-0 rounded-xl !text-black placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200 outline-none transition-all duration-200"
            style={{ 
              fontFamily: 'Inter, system-ui, sans-serif',
              WebkitTextFillColor: '#000000'
            }}
            required
          />
        </div>

        <div className="mb-6 text-center">
          <span className="text-gray-500 text-sm">Or</span>
        </div>

        <div className="mb-8 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="continue_with"
            size="large"
            shape="rectangular"
            width="384"
            logo_alignment="left"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <p className="text-sm text-center" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}
      </div>

      {/* Continue Button - Fixed at bottom */}
      <div className="px-12 pb-8 flex-shrink-0">
        <button
          className="w-full max-w-sm mx-auto bg-gray-900 hover:bg-gray-800 text-white rounded-full py-4 text-base font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          onClick={handleEmailSubmit}
          disabled={isLoading || !email.trim()}
          style={{ 
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {isLoading ? 'Loading...' : 'Continue'}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  const renderCodeStep = () => (
    <div className="w-full flex flex-col" style={{ height: '100%' }}>
      {/* Ensure verification code inputs always render black text (host apps may inject global input styles) */}
      <style>{`
        /* High-specificity + !important so consuming apps can't easily override text color */
        input.onairos-verification-digit {
          color: #000000 !important;
          caret-color: #000000 !important;
          -webkit-text-fill-color: #000000 !important; /* Safari/iOS */
        }
      `}</style>
      {/* Heading - matching VerificationStep.tsx */}
      <div className="w-full pt-16 px-12 mb-10 text-center">
        <h1 
          className="font-bold mb-2"
          style={{ 
            fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
            fontWeight: '700',
            fontSize: '24px',
            lineHeight: '32px',
            color: COLORS.textPrimary
          }}
        >
          Enter verification code
        </h1>
        <p 
          className="mb-2"
          style={{ 
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: '400',
            fontSize: '16px',
            lineHeight: '24px',
            color: COLORS.textSecondary
          }}
        >
          {emailSent ? `We've sent a 6-digit code to ${email}` : `A verification code has been generated for ${email}`}
        </p>
        {!emailSent && (
          <div 
            className="mb-4 mx-auto max-w-sm px-4 py-3 rounded-lg border"
            style={{ 
              backgroundColor: '#FEF3C7',
              borderColor: '#FCD34D',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '14px',
              lineHeight: '20px',
              color: '#92400E'
            }}
          >
            <p className="font-medium mb-1">⚠️ Email service unavailable</p>
            <p className="text-sm">
              {emailServiceMessage.includes('testing mode') || emailServiceMessage.includes('server logs') 
                ? 'Any 6-digit code will be accepted. Check server logs for the actual code.'
                : 'The verification code was generated but could not be sent. Please check server logs or contact support.'}
            </p>
          </div>
        )}
      </div>


      {/* Code Input - matching VerificationStep design with individual digit boxes */}
      <div className="px-12 mb-6">
        <div className="flex justify-center space-x-3">
          {Array.from({ length: 6 }, (_, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="1"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              value={codeDigits[index] || ''}
              onPaste={(e) => {
                const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
                if (!pasted) return;
                e.preventDefault();

                const nextDigits = [...codeDigits];
                for (let i = 0; i < pasted.length && index + i < 6; i++) {
                  nextDigits[index + i] = pasted[i];
                }
                setCodeDigits(nextDigits);

                const focusIndex = Math.min(index + pasted.length, 5);
                const nextInput = e.currentTarget.parentElement?.children?.[focusIndex];
                if (nextInput && typeof nextInput.focus === 'function') nextInput.focus();
              }}
              onChange={(e) => {
                const raw = e.target.value || '';
                const digitsOnly = raw.replace(/\D/g, '');

                // Clear
                if (!digitsOnly) {
                  const nextDigits = [...codeDigits];
                  nextDigits[index] = '';
                  setCodeDigits(nextDigits);
                  return;
                }

                // Some browsers/OTP autofill can inject multiple digits at once
                const nextDigits = [...codeDigits];
                for (let i = 0; i < digitsOnly.length && index + i < 6; i++) {
                  nextDigits[index + i] = digitsOnly[i];
                }
                setCodeDigits(nextDigits);

                const focusIndex = Math.min(index + digitsOnly.length, 5);
                if (focusIndex !== index) {
                  const nextInput = e.target.parentElement?.children?.[focusIndex];
                  if (nextInput && typeof nextInput.focus === 'function') nextInput.focus();
                } else if (index < 5) {
                  const nextInput = e.target.parentElement?.children?.[index + 1];
                  if (nextInput && typeof nextInput.focus === 'function') nextInput.focus();
                }
              }}
              onKeyDown={(e) => {
                // Handle backspace to focus previous input
                if (e.key === 'Backspace') {
                  // If current has a digit, clear it first (common OTP UX)
                  if (codeDigits[index]) {
                    const nextDigits = [...codeDigits];
                    nextDigits[index] = '';
                    setCodeDigits(nextDigits);
                    e.preventDefault();
                    return;
                  }
                  // Otherwise move focus left
                  if (index > 0) {
                    const prevInput = e.currentTarget.parentElement?.children?.[index - 1];
                    if (prevInput && typeof prevInput.focus === 'function') prevInput.focus();
                  }
                }
              }}
              className="onairos-verification-digit w-12 h-12 border rounded-lg text-center text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none !text-black"
              style={{ 
                borderColor: COLORS.border,
                backgroundColor: COLORS.background,
                fontFamily: 'Inter, system-ui, sans-serif',
                color: '#000000',
                caretColor: '#000000',
                WebkitTextFillColor: '#000000',
              }}
            />
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-12 mb-6">
          <p className="text-sm text-center" style={{ color: COLORS.error }}>{error}</p>
        </div>
      )}

      {/* Continue Button - positioned right below code inputs */}
      <div className="px-12 mb-6">
        <div className="max-w-sm mx-auto">
          <PrimaryButton
            label="Continue"
            onClick={handleCodeSubmit}
            loading={isLoading}
            disabled={isLoading || !isCodeComplete}
            testId="verify-code-button"
            className="!text-white"
            textStyle={{ color: '#FFFFFF' }}
          />
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1, minHeight: '20px' }} />

      {/* Back to email option */}
      <div className="px-12 w-full">
        <div className="max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => {
              resetCodeDigits();
              setStep('email');
            }}
            className="w-full py-2 px-4 font-medium transition-colors text-sm"
            style={{ color: COLORS.textSecondary }}
          >
            Use a different email
          </button>
        </div>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="w-full flex flex-col items-center space-y-6 pt-16 px-12">
      <div 
        className="flex items-center justify-center w-16 h-16 rounded-full"
        style={{ backgroundColor: '#D1FAE5' }}
      >
        <Check className="w-8 h-8" style={{ color: COLORS.success }} />
      </div>
      
      <div className="text-center space-y-2">
        <h2 
          className="text-xl font-semibold"
          style={{ color: COLORS.textPrimary }}
        >
          Email verified!
        </h2>
        <p style={{ color: COLORS.textSecondary }}>Setting up your account...</p>
      </div>

      <div className="w-8 h-8">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {step === 'email' && renderEmailStep()}
      {step === 'code' && renderCodeStep()}
      {step === 'success' && renderSuccessStep()}
    </div>
  );
} 

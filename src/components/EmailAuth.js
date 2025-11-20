import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import PrimaryButton from './ui/PrimaryButton.jsx';
import { COLORS } from '../theme/colors.js';

export default function EmailAuth({ onSuccess, testMode = true }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'success'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-focus first PIN input when code step loads
  useEffect(() => {
    if (step === 'code') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const firstInput = document.querySelector('input[maxLength="1"]');
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
        
        const response = await fetch(`${baseUrl}/email/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            email: (email || '').trim().toLowerCase()
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send verification code');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to send verification code');
        }

        console.log('📧 Email request response:', data);

        setStep('code');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Email request error:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Handle Google OAuth using popup flow (works without origin registration)
  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError('');

      const baseUrl = (typeof window !== 'undefined' && window.onairosBaseUrl) || 'https://api2.onairos.uk';
      const apiKey = (typeof window !== 'undefined' && window.onairosApiKey) || 'ona_VvoHNg1fdCCUa9eBy4Iz3IfvXdgLfMFI7TNcyHLDKEadPogkbjAeE2iDOs6M7Aey';
      
      // Generate a temporary email and username for account creation
      const tempId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const tempEmail = `google_${tempId}@onairos.temp`;
      const tempUsername = `google_${tempId}`;
      
      // Create account directly using registerAccount/enoch endpoint (no email verification needed)
      try {
        const registerResponse = await fetch(`${baseUrl}/registerAccount/enoch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            email: tempEmail,
            username: tempUsername
          }),
        });
        
        if (!registerResponse.ok) {
          const errorData = await registerResponse.json().catch(() => ({}));
          console.warn('Account registration warning:', errorData);
          // Continue anyway - user might already exist
        } else {
          console.log('✅ Temporary account created successfully');
        }
        
        // Wait for account to be fully created
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn('Account registration error:', e);
        // Continue anyway - might work if account already exists
      }

      // Get OAuth URL using temp username (matches what backend created from email)
      console.log('🔗 Requesting Gmail OAuth URL for username:', tempUsername);
      let response;
      try {
        response = await fetch(`${baseUrl}/gmail/authorize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            session: { username: tempUsername }
          }),
        });
        console.log('📡 Gmail authorize response status:', response.status, response.ok);
      } catch (fetchError) {
        console.error('❌ Fetch error getting OAuth URL:', fetchError);
        throw new Error('Failed to connect to server. Please check your internet connection.');
      }

      // If still not found, wait and retry
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('⚠️ Gmail authorize failed:', errorData);
        if (errorData.message?.includes('User not found') || errorData.message?.includes('create an account')) {
          console.log('⏳ User not found, waiting 2 seconds and retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            response = await fetch(`${baseUrl}/gmail/authorize`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
              },
              body: JSON.stringify({
                session: { username: tempUsername }
              }),
            });
            console.log('📡 Retry response status:', response.status, response.ok);
          } catch (retryError) {
            console.error('❌ Retry fetch error:', retryError);
            throw new Error('Failed to get Google authorization URL after retry.');
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Gmail authorize final error:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to get Google authorization URL');
      }

      console.log('✅ Gmail authorize successful, parsing response...');
      let data;
      try {
        data = await response.json();
        console.log('📦 Response data keys:', Object.keys(data));
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      const oauthUrl = data.gmailURL || data.gmailUrl || data.gmail_url || data.url;
      console.log('🔗 OAuth URL extracted:', oauthUrl ? 'Present' : 'Missing');
      if (!oauthUrl) {
        console.error('❌ No OAuth URL in response:', data);
        throw new Error('No authorization URL received from server');
      }

      console.log('🚀 Opening OAuth popup...');
      // Open OAuth popup - after OAuth, we'll get real email and update account
      openOAuthPopup(oauthUrl, tempUsername);
    } catch (error) {
      console.error('❌ Google OAuth failed:', error);
      setError(error.message || 'Google authentication failed.');
      setIsLoading(false);
    }
  };


  // Helper to open OAuth popup
  const openOAuthPopup = async (oauthUrl, tempUsername) => {
    console.log('🎯 openOAuthPopup called with URL:', oauthUrl ? 'Present' : 'Missing', 'username:', tempUsername);
    const baseUrl = (typeof window !== 'undefined' && window.onairosBaseUrl) || 'https://api2.onairos.uk';
    const apiKey = (typeof window !== 'undefined' && window.onairosApiKey) || 'ona_VvoHNg1fdCCUa9eBy4Iz3IfvXdgLfMFI7TNcyHLDKEadPogkbjAeE2iDOs6M7Aey';
    
    // Clear any previous OAuth success signals (check both lowercase and uppercase)
    localStorage.removeItem('onairos_gmail_success');
    localStorage.removeItem('onairos_gmail_timestamp');
    localStorage.removeItem('onairos_gmail_error');
    localStorage.removeItem('onairos_Gmail_success');
    localStorage.removeItem('onairos_Gmail_timestamp');
    localStorage.removeItem('onairos_Gmail_error');
    
    console.log('🪟 Attempting to open popup with URL:', oauthUrl.substring(0, 100) + '...');
    const popup = window.open(oauthUrl, 'google_oauth', 'width=500,height=600,scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no');
    if (!popup) {
      console.error('❌ Popup blocked!');
      setError('Popup blocked. Please allow popups for this site.');
      setIsLoading(false);
      return;
    }
    console.log('✅ Popup opened successfully');

    let touched = false;
    let successDetected = false;
    let checkCount = 0;
    let crossOriginDetected = false;
    let crossOriginDetectedAt = null;
    let crossOriginTimeout = null;
    
    const checkInterval = setInterval(async () => {
      checkCount++;
      if (checkCount % 10 === 0) {
        try {
          console.log(`🔄 OAuth check #${checkCount}, popup closed: ${popup.closed}`);
        } catch (e) {
          console.log(`🔄 OAuth check #${checkCount} (COOP blocked popup.closed check)`);
        }
      }
      
      let popupOnSuccessPage = false;
      
      try {
        // Try to access popup location - if it throws, popup is on different domain (success page)
        if (popup.location) {
          if (popup.location.hostname === 'onairos.uk') {
            touched = true;
            popupOnSuccessPage = true;
            console.log('📍 Popup navigated to onairos.uk:', popup.location.pathname);
            
            // If on success page, close popup and proceed
            if (popup.location.pathname.includes('/Home/Connections') || 
                popup.location.pathname.includes('/callback') ||
                popup.location.search.includes('success')) {
              console.log('✅ Detected success page, closing popup and proceeding...');
              successDetected = true;
              clearInterval(checkInterval);
              
              // Close the popup
              try {
                popup.close();
              } catch (e) {
                console.warn('Could not close popup:', e);
              }
              
              // Wait for backend to fully process
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              setIsLoading(false);
              
              // Call onSuccess to proceed to next step
              console.log('🎉 Calling onSuccess...');
              onSuccess({ 
                email: tempUsername, 
                method: 'google',
                connectedAccounts: { Gmail: true, Google: true },
                verified: true,
                existingUser: false,
                isNewUser: true,
                flowType: 'onboarding',
                googleAuth: true,
                userName: tempUsername
              });
              
              return;
            }
          }
        }
      } catch (e) {
        // Cross-origin error means popup navigated to onairos.uk (different domain)
        if (!crossOriginDetected) {
          crossOriginDetected = true;
          crossOriginDetectedAt = Date.now();
          touched = true;
          console.log('🌐 Cross-origin detected - popup navigated to onairos.uk');
          
          // Set a timeout to close popup and proceed after 3 seconds
          if (!crossOriginTimeout) {
            crossOriginTimeout = setTimeout(async () => {
              if (!successDetected) {
                console.log('✅ Cross-origin timeout reached, closing popup and proceeding...');
                successDetected = true;
                clearInterval(checkInterval);
                
                // Try to close the popup
                try {
                  if (popup && !popup.closed) {
                    popup.close();
                  }
                } catch (closeError) {
                  console.warn('Could not close popup (COOP may block it):', closeError);
                }
                
                // Wait for backend to process
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                setIsLoading(false);
                
                console.log('🎉 Calling onSuccess after cross-origin timeout...');
                onSuccess({ 
                  email: tempUsername, 
                  method: 'google',
                  connectedAccounts: { Gmail: true, Google: true },
                  verified: true,
                  existingUser: false,
                  isNewUser: true,
                  flowType: 'onboarding',
                  googleAuth: true,
                  userName: tempUsername
                });
              }
            }, 3000); // Wait 3 seconds after cross-origin detected
          }
        }
      }
      
      // Check localStorage for success signal from OAuth callback page (check both cases)
      const oauthSuccess = localStorage.getItem('onairos_gmail_success') || localStorage.getItem('onairos_Gmail_success');
      const oauthTimestamp = localStorage.getItem('onairos_gmail_timestamp') || localStorage.getItem('onairos_Gmail_timestamp');
      const oauthError = localStorage.getItem('onairos_gmail_error') || localStorage.getItem('onairos_Gmail_error');
      
      if (checkCount % 10 === 0) {
        try {
          console.log('🔍 Checking localStorage:', { oauthSuccess, oauthTimestamp, oauthError, popupClosed: popup.closed, popupOnSuccessPage, crossOriginDetected });
        } catch (e) {
          console.log('🔍 Checking localStorage:', { oauthSuccess, oauthTimestamp, oauthError, popupOnSuccessPage, crossOriginDetected, note: 'COOP blocked popup.closed' });
        }
      }
      
      if (oauthSuccess === 'true' && oauthTimestamp) {
        // OAuth completed successfully
        console.log('✅ OAuth success detected in localStorage!');
        successDetected = true;
        clearInterval(checkInterval);
        
        // Wait a moment for backend to fully process
        console.log('⏳ Waiting 2 seconds for backend to process...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the real email from backend - the Gmail callback stored it in accounts.gmail.email
        // We'll use the temp username to identify the user, but the real email is in the backend
        let userEmail = tempUsername.replace('google_', '').split('_')[0];
        
        // Try to get user info from backend to get real email
        // For now, we'll proceed with temp email - backend has the real one
        console.log('🎉 Calling onSuccess with user data...');
        setIsLoading(false);
        
        // Clear the success signal (both cases)
        localStorage.removeItem('onairos_gmail_success');
        localStorage.removeItem('onairos_gmail_timestamp');
        localStorage.removeItem('onairos_Gmail_success');
        localStorage.removeItem('onairos_Gmail_timestamp');
        
        // Call onSuccess to proceed to next step
        onSuccess({ 
          email: userEmail || tempUsername, 
          method: 'google',
          connectedAccounts: { Gmail: true, Google: true },
          verified: true,
          existingUser: false,
          isNewUser: true,
          flowType: 'onboarding',
          googleAuth: true,
          userName: tempUsername
        });
        
        return;
      }
      
      if (oauthError) {
        // OAuth failed
        clearInterval(checkInterval);
        setIsLoading(false);
        setError(oauthError || 'Google authentication failed.');
        localStorage.removeItem('onairos_gmail_error');
        return;
      }
      
      // Check if popup was closed (if COOP allows it)
      try {
        if (popup.closed && !successDetected) {
          console.log('🚪 Popup closed, crossOriginDetected:', crossOriginDetected);
          clearInterval(checkInterval);
          if (crossOriginTimeout) clearTimeout(crossOriginTimeout);
          
          if (crossOriginDetected) {
            // Popup navigated to onairos.uk and then closed - OAuth completed successfully
            console.log('✅ OAuth completed (cross-origin detected + popup closed)');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setIsLoading(false);
            
            console.log('🎉 Calling onSuccess after OAuth completion...');
            onSuccess({ 
              email: tempUsername, 
              method: 'google',
              connectedAccounts: { Gmail: true, Google: true },
              verified: true,
              existingUser: false,
              isNewUser: true,
              flowType: 'onboarding',
              googleAuth: true,
              userName: tempUsername
            });
          } else {
            // Popup closed but we never detected cross-origin - user might have cancelled
            console.warn('⚠️ Popup closed without cross-origin detection - user may have cancelled');
            setIsLoading(false);
            setError('Google authentication was cancelled. Please try again.');
          }
        }
      } catch (e) {
        // COOP blocks popup.closed check - that's okay, we'll use the timeout instead
      }
    }, 500); // Check more frequently

    // Timeout after 5 minutes
    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
      }
      if (!successDetected) {
        clearInterval(checkInterval);
        setIsLoading(false);
        setError('Google authentication timed out. Please try again.');
      }
    }, 300000);
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (testMode) {
        // Test mode: Skip API call completely, simulate verification
        console.log('🧪 Test mode: Simulating code verification for:', email, 'with code:', code);
        
        if (code === '123456' || code.length === 6) {
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
        
        const response = await fetch(`${baseUrl}/email/verify/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            email: (email || '').trim().toLowerCase(),
            code: code.trim()
          }),
        });

        if (!response.ok) {
          throw new Error('Invalid verification code');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Verification failed');
        }

        console.log('📧 Email verification response:', data);

        setStep('success');
        setTimeout(() => {
          // Pass complete API response for flow determination
          onSuccess({ 
            email, 
            verified: true, 
            token: data.token || data.jwtToken,
            userName: data.userName,
            existingUser: data.existingUser,
            accountInfo: data.accountInfo,
            isNewUser: !data.existingUser, // Set based on API response
            flowType: data.existingUser ? 'dataRequest' : 'onboarding',
            adminMode: data.adminMode,
            userCreated: data.userCreated,
            accountDetails: data.accountDetails
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
            className="w-full max-w-sm mx-auto px-4 py-4 text-base bg-gray-50 border-0 rounded-xl placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200 outline-none transition-all duration-200"
            style={{ 
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
            required
          />
        </div>

        <div className="mb-6 text-center">
          <span className="text-gray-500 text-sm">Or</span>
        </div>

        <div className="mb-8">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full max-w-sm mx-auto py-4 text-base font-medium rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-3 bg-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? 'Connecting...' : 'Continue with Google'}
          </button>
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
          We've sent a 6-digit code to {email}
        </p>
      </div>


      {/* Code Input - matching VerificationStep design with individual digit boxes */}
      <div className="px-12 mb-6">
        <div className="flex justify-center space-x-3">
          {Array.from({ length: 6 }, (_, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              value={code[index] || ''}
              onChange={(e) => {
                const newCode = code.split('');
                newCode[index] = e.target.value;
                setCode(newCode.join(''));
                
                // Auto-focus next input
                if (e.target.value && index < 5) {
                  const nextInput = e.target.parentElement?.children[index + 1];
                  if (nextInput) nextInput.focus();
                }
              }}
              onKeyDown={(e) => {
                // Handle backspace to focus previous input
                if (e.key === 'Backspace' && !code[index] && index > 0) {
                  const prevInput = e.target.parentElement?.children[index - 1];
                  if (prevInput) prevInput.focus();
                }
              }}
              className="w-12 h-12 border rounded-lg text-center text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              style={{ 
                borderColor: COLORS.border,
                backgroundColor: COLORS.background,
                fontFamily: 'Inter, system-ui, sans-serif'
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
            disabled={isLoading || code.length !== 6}
            testId="verify-code-button"
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
            onClick={() => setStep('email')}
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

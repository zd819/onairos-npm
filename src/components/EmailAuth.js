import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import PrimaryButton from './ui/PrimaryButton.jsx';
import { COLORS } from '../theme/colors.js';

export default function EmailAuth({ onSuccess, testMode = true }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'success'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(true); // Track if email was actually sent
  const [emailServiceMessage, setEmailServiceMessage] = useState(''); // Store service message

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
    setEmailSent(true); // Reset email status
    setEmailServiceMessage(''); // Reset service message

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

        // Store email service status
        setEmailSent(data.emailSent !== false); // Default to true if not specified
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

  // NEW: Frontend SDK-based Google Sign-In (replaces backend redirect flow)
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError('');
        console.log('✅ Google Sign-In successful, received access token');

        const sdkConfig = {
          baseUrl: 'https://api2.onairos.uk',
          apiKey: window.onairosApiKey || 'test-key',
        };

        // Get user info from Google using the access token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to get user info from Google');
        }

        const userInfo = await userInfoResponse.json();
        const gmailEmail = userInfo.email;
        console.log('✅ Retrieved user email from Google:', gmailEmail);

        // Optional: Send to backend for verification/storage
        try {
          await fetch(`${sdkConfig.baseUrl}/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': sdkConfig.apiKey,
            },
            body: JSON.stringify({
              accessToken: tokenResponse.access_token,
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
    },
    onError: (error) => {
      console.error('❌ Google Sign-In failed:', error);
      setError('Google authentication failed. Please try again.');
      setIsLoading(false);
    },
    scope: 'openid email profile',
  });

  const handleGoogleAuth = () => {
    try {
      setIsLoading(true);
      console.log('🔗 Initiating Google Sign-In with frontend SDK...');
      googleLogin();
    } catch (error) {
      console.error('❌ Failed to initiate Google Sign-In:', error);
      setError('Failed to start Google authentication');
      setIsLoading(false);
    }
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

        // Log accountStatus if available
        if (data.accountStatus) {
          console.log('✅ Account status:', {
            exists: data.accountStatus.exists,
            hasTrainedModel: data.accountStatus.hasTrainedModel,
            hasPersonalityTraits: data.accountStatus.hasPersonalityTraits,
            connectedPlatforms: data.accountStatus.connectedPlatforms,
            needsDataConnection: data.accountStatus.needsDataConnection,
            needsTraining: data.accountStatus.needsTraining,
            canUseInference: data.accountStatus.canUseInference
          });
        }

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
            accountStatus: data.accountStatus, // NEW: Include accountStatus from backend
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

        <div className="mb-8">
          <style>{`
            .google-button-text {
              color: #000000 !important;
            }
          `}</style>
          <button
            type="button"
            className="w-full max-w-sm mx-auto py-4 text-base font-medium rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-3 bg-transparent transition-colors google-button-text"
            style={{ 
              fontFamily: 'Inter, system-ui, sans-serif',
              color: '#000000'
            }}
            onClick={handleGoogleAuth}
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
            <span className="google-button-text" style={{ color: '#000000' }}>Continue with Google</span>
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

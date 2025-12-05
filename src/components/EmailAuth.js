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
  const [emailSent, setEmailSent] = useState(true); // Track if email was actually sent
  const [emailServiceMessage, setEmailServiceMessage] = useState(''); // Store service message

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

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Create temporary account identifier for OAuth flow
      const tempId = `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('onairos_temp_google_id', tempId);
      console.log('✅ Temporary account created for Google OAuth');

      const sdkConfig = {
        baseUrl: 'https://api2.onairos.uk',
        apiKey: window.onairosApiKey || 'test-key',
      };

      const username = localStorage.getItem('username') || 
                      (JSON.parse(localStorage.getItem('onairosUser') || '{}')?.email) || 
                      tempId;
      
      console.log('🔗 Requesting Gmail OAuth URL for Google authentication...');
      
      // Request OAuth URL from backend
      const res = await fetch(`${sdkConfig.baseUrl}/gmail/authorize`, {
        method: 'POST',
        headers: {
          'x-api-key': sdkConfig.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session: { username }
        })
      });

      if (!res.ok) {
        throw new Error('Failed to get OAuth URL');
      }

      const data = await res.json();
      const oauthUrl = data.gmailURL || data.gmailUrl || data.gmail_url || data.url;
      
      if (!oauthUrl) {
        throw new Error('No OAuth URL received from backend');
      }

      console.log('🚀 Opening Google OAuth popup...');

      // Open popup for OAuth
      const popup = window.open(
        oauthUrl,
        'google_oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Set up postMessage listener for cross-origin communication
      const messageHandler = (event) => {
        // Only accept messages from onairos.uk origin
        if (event.origin !== 'https://api2.onairos.uk' && 
            event.origin !== 'https://onairos.uk' &&
            !event.origin.includes('onairos.uk')) {
          return;
        }

        if (event.data && event.data.type === 'oauth-success' && event.data.platform === 'gmail') {
          console.log('✅ OAuth success received via postMessage:', event.data);
          window.removeEventListener('message', messageHandler);
          handleOAuthSuccess(event.data.email || event.data.gmailEmail);
        }
      };

      window.addEventListener('message', messageHandler);
      console.log('👂 [POSTMESSAGE] Listener registered, waiting for messages...');

      // Poll localStorage for OAuth completion (oauth-callback.html sets this)
      let pollCount = 0;
      const maxPolls = 300; // 5 minutes max (300 * 1 second)
      const localStorageKey = 'onairos_gmail_success';
      const timestampKey = 'onairos_gmail_timestamp';

      const pollInterval = setInterval(() => {
        pollCount++;
        
        try {
          // Check if popup is closed (user might have closed it manually)
          // If closed after OAuth redirect (pollCount > 10 = ~10 seconds), try fallback
          if (popup.closed && pollCount > 10) {
            clearInterval(pollInterval);
            window.removeEventListener('message', messageHandler);
            console.log('⚠️ OAuth popup was closed, trying fallback to get email from backend...');
            retrieveAndContinueWithGoogleEmail(username, tempId);
            return;
          }

          // Check localStorage for success signal
          const success = localStorage.getItem(localStorageKey);
          const timestamp = localStorage.getItem(timestampKey);
          
          if (success === 'true' && timestamp) {
            const timestampNum = parseInt(timestamp, 10);
            const now = Date.now();
            
            // Only process if timestamp is recent (within last 30 seconds)
            if (now - timestampNum < 30000) {
              console.log('✅ Cross-origin detected - OAuth popup navigated to onairos.uk');
              clearInterval(pollInterval);
              window.removeEventListener('message', messageHandler);
              
              // Try to get email from URL params (stored by oauth-callback.html)
              // The callback URL includes: ?success=true&platform=gmail&email=...
              // We need to retrieve email from backend since we can't access popup.location
              retrieveAndContinueWithGoogleEmail(username, tempId);
            }
          }

          // Check for cross-origin navigation (don't access popup.location - causes COOP error)
          // Instead, rely on localStorage and postMessage signals
          if (pollCount === 1) {
            console.log('✅ Cross-origin detected - waiting for postMessage/localStorage...');
          }

          // Timeout after max polls
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            window.removeEventListener('message', messageHandler);
            setIsLoading(false);
            console.log('⏳ [TIMEOUT] PostMessage not received after 5 minutes, closing popup and trying fallback...');
            
            // Try fallback: retrieve email from backend
            if (popup.closed) {
              retrieveAndContinueWithGoogleEmail(username, tempId);
            } else {
              try {
                popup.close();
              } catch (e) {}
              setError('OAuth timeout. Please try again.');
            }
          }
        } catch (error) {
          console.error('Error in OAuth polling:', error);
        }
      }, 1000);

      // Cleanup function
      const cleanup = () => {
        clearInterval(pollInterval);
        window.removeEventListener('message', messageHandler);
        try {
          localStorage.removeItem(localStorageKey);
          localStorage.removeItem(timestampKey);
        } catch (e) {}
      };

      // Store cleanup function for component unmount
      if (typeof window !== 'undefined') {
        window._onairosOAuthCleanup = cleanup;
      }

    } catch (error) {
      console.error('❌ Google OAuth failed:', error);
      setError('Google authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Helper function to retrieve Gmail email from backend and continue flow
  const retrieveAndContinueWithGoogleEmail = async (username, tempId) => {
    try {
      console.log('📧 Retrieving Gmail email from backend for user:', username || tempId);
      
      // First, try to get email from localStorage (set by oauth-callback.html)
      let gmailEmail = localStorage.getItem('onairos_gmail_email');
      if (gmailEmail) {
        console.log('✅ Gmail email retrieved from localStorage:', gmailEmail);
        handleOAuthSuccess(gmailEmail);
        return;
      }

      const sdkConfig = {
        baseUrl: 'https://api2.onairos.uk',
        apiKey: window.onairosApiKey || 'test-key',
      };

      // Try to get email from backend
      const emailRes = await fetch(`${sdkConfig.baseUrl}/gmail/get-email`, {
        method: 'POST',
        headers: {
          'x-api-key': sdkConfig.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username || tempId
        })
      });

      if (emailRes.ok) {
        const emailData = await emailRes.json();
        gmailEmail = emailData.email;
        console.log('✅ Gmail email retrieved from backend:', gmailEmail);
      } else {
        console.warn('⚠️ Could not retrieve Gmail email from backend');
        // Last resort: use temp username or prompt user
        gmailEmail = username && username.includes('@') ? username : `${tempId}@gmail.com`;
        console.log('⚠️ Using fallback email:', gmailEmail);
      }

      // Continue with email verification flow using Gmail email
      handleOAuthSuccess(gmailEmail);

    } catch (error) {
      console.error('❌ Error retrieving Gmail email:', error);
      // Continue anyway with fallback
      handleOAuthSuccess(`${tempId}@gmail.com`);
    }
  };

  // Helper function to handle OAuth success (Gmail)
  const handleOAuthSuccess = async (gmailEmail) => {
    try {
      setIsLoading(true);
      console.log('✅ Google OAuth completed successfully, email:', gmailEmail);

      // For Gmail SSO we trust Google's email verification and skip the 6‑digit code.
      // We still record the email locally and immediately continue into onboarding.
      const normalizedEmail = (gmailEmail || '').trim().toLowerCase();
      setEmail(normalizedEmail);

      // Simulate a successful verification response and jump straight to success → UniversalOnboarding
      setStep('success');
      setIsLoading(false);

      setTimeout(() => {
        onSuccess({
          email: normalizedEmail,
          verified: true,
          token: null,
          userName: normalizedEmail.split('@')[0],
          existingUser: false,
          accountInfo: null,
          isNewUser: true,
          flowType: 'onboarding',
          adminMode: false,
          userCreated: true,
          accountDetails: {
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

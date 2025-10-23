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

    // In production mode, validate email format
    if (!testMode && !validateEmail(email)) {
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
<<<<<<< Updated upstream
        const apiKey = window.onairosApiKey || 'test-key';
        
        const response = await fetch('https://api2.onairos.uk/email/verification', {
=======
        const baseUrl = (typeof window !== 'undefined' && window.onairosBaseUrl) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ONAIROS_BASE_URL) || 'https://api2.onairos.uk';
        const apiKey = (typeof window !== 'undefined' && window.onairosApiKey) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ONAIROS_API_KEY) || 'ona_VvoHNg1fdCCUa9eBy4Iz3IfvXdgLfMFI7TNcyHLDKEadPogkbjAeE2iDOs6M7Aey';
        console.log('🔑 [EmailAuth] Env Check:', { baseUrl, hasWindowKey: !!(typeof window !== 'undefined' && window.onairosApiKey), viteKey: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ONAIROS_API_KEY) ? 'present' : 'absent' });

        const headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          // Keep Authorization for backwards compatibility
          'Authorization': `Bearer ${apiKey}`
        };
        console.log('🔑 [EmailAuth] Using headers (keys redacted):', { ...headers, 'x-api-key': '***', Authorization: '***' });

        const response = await doFetchWithRetry(`${baseUrl}/email/verify`, {
>>>>>>> Stashed changes
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ 
<<<<<<< Updated upstream
            email, 
            action: 'request' 
=======
            email: (email || '').trim().toLowerCase()
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      setError(error.message);
      setIsLoading(false);
=======
      if (testMode) {
        // In test mode, proceed anyway
        setStep('code');
        setIsLoading(false);
      } else {
        // In production mode, show error
        setError('Could not send code. Please try again.');
        setIsLoading(false);
      }
>>>>>>> Stashed changes
    }
  };

  const handleGoogleAuth = async () => {
    try {
      // Use the same Google OAuth logic as UniversalOnboarding
      const sdkConfig = {
        baseUrl: (typeof window !== 'undefined' && window.onairosBaseUrl) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ONAIROS_BASE_URL) || 'https://api2.onairos.uk',
        apiKey: (typeof window !== 'undefined' && window.onairosApiKey) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ONAIROS_API_KEY) || 'ona_VvoHNg1fdCCUa9eBy4Iz3IfvXdgLfMFI7TNcyHLDKEadPogkbjAeE2iDOs6M7Aey',
        enableHealthMonitoring: true,
        enableAutoRefresh: true,
        enableConnectionValidation: true
      };

      const username = localStorage.getItem('username') || localStorage.getItem('onairosUser')?.email || 'user@example.com';
      
      const authorizeUrl = `${sdkConfig.baseUrl}/gmail/authorize`;
      const params = new URLSearchParams({
        username: username,
        sdk_type: 'web',
        return_url: window.location.origin + '/oauth-callback.html'
      });

      const fullUrl = `${authorizeUrl}?${params.toString()}`;
      console.log('🔗 Starting Google OAuth from email flow...');
      console.log('📋 Google OAuth URL:', fullUrl);

      const popup = window.open(fullUrl, 'gmail_oauth', 'width=500,height=600,scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no');
      
      if (!popup) {
        console.error('❌ Popup blocked');
        setError('Please allow popups to continue with Google sign-in');
        return;
      }

      // Monitor popup for OAuth completion
      const checkPopup = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkPopup);
            console.log('🔄 OAuth popup closed');
            // Check if we got a successful OAuth response
            // For now, just proceed to next step
            // In a real implementation, you'd check for OAuth success
          }
        } catch (err) {
          // Cross-origin error is expected
        }
      }, 500);

    } catch (error) {
      console.error('Google auth error:', error);
      setError('Failed to start Google authentication');
    }
  };

  const handleCodeSubmit = async (e, codeOverride = null) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Use provided code or fall back to state
    const verificationCode = codeOverride || code;

    try {
      if (testMode) {
        // Test mode: Accept any code for testing
        console.log('🧪 Test mode: Simulating code verification for:', email, 'with code:', verificationCode);
        
        if (verificationCode.length === 6) {
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
          setError('Please enter a 6-digit code');
          setIsLoading(false);
        }
      } else {
        // Production mode: Use real email verification API from schema
<<<<<<< Updated upstream
        const apiKey = window.onairosApiKey || 'test-key';
        
        const response = await fetch('https://api2.onairos.uk/email/verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ 
            email, 
            action: 'verify',
            code 
          }),
=======
        const baseUrl = (typeof window !== 'undefined' && window.onairosBaseUrl) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ONAIROS_BASE_URL) || 'https://api2.onairos.uk';
        const apiKey = (typeof window !== 'undefined' && window.onairosApiKey) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ONAIROS_API_KEY) || 'ona_VvoHNg1fdCCUa9eBy4Iz3IfvXdgLfMFI7TNcyHLDKEadPogkbjAeE2iDOs6M7Aey';
        console.log('🔑 [EmailAuth - Code Verify] Env Check:', { baseUrl, hasWindowKey: !!(typeof window !== 'undefined' && window.onairosApiKey), viteKey: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ONAIROS_API_KEY) ? 'present' : 'absent' });

        const headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${apiKey}`
        };
        console.log('🔑 [EmailAuth - Code Verify] Using headers (keys redacted):', { ...headers, 'x-api-key': '***', Authorization: '***' });

        const requestBody = { 
          email: (email || '').trim().toLowerCase(), 
          code: verificationCode.trim()
        };
        console.log('🔑 [EmailAuth - Code Verify] Sending request:', { email: requestBody.email, code: requestBody.code, codeLength: requestBody.code.length });
        
        const response = await doFetchWithRetry(`${baseUrl}/email/verify/confirm`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
>>>>>>> Stashed changes
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Verification failed:', errorData);
          throw new Error(errorData.error || 'Invalid verification code');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Verification failed');
        }

        console.log('📧 Email verification response:', data);

        setStep('success');
        setTimeout(() => {
          // Pass complete API response for flow determination
          const userData = { 
            email, 
            verified: true, 
            token: data.token || data.jwtToken,
            userName: data.userName || data.user?.userName,
            existingUser: !data.isNewUser, // Backend returns isNewUser, we need existingUser
            accountInfo: data.user || data.accountInfo,
            isNewUser: data.isNewUser, // Use backend's isNewUser directly
            flowType: data.isNewUser ? 'onboarding' : 'dataRequest',
            adminMode: data.adminMode,
            userCreated: data.userCreated || data.isNewUser,
            accountDetails: data.user || data.accountDetails
          };
          console.log('📧 Calling onSuccess with userData:', userData);
          onSuccess(userData);
        }, 1000);
      }
    } catch (error) {
      console.error('Email verification error:', error);
<<<<<<< Updated upstream
      setError(error.message || 'Invalid code. Please try again.');
      setIsLoading(false);
=======
      if (testMode) {
        // In test mode, proceed anyway
        setStep('success');
        setTimeout(() => {
          const fallbackResponse = { 
            email, 
            verified: true, 
            token: 'fallback-token-' + Date.now(),
            userName: email.split('@')[0],
            existingUser: false,
            accountInfo: null,
            isNewUser: true,
            flowType: 'onboarding',
            adminMode: false,
            userCreated: true,
            accountDetails: {
              email: email,
              createdAt: new Date().toISOString()
            }
          };
          onSuccess(fallbackResponse);
        }, 600);
      } else {
        // In production mode, show error
        setError('Invalid code. Please try again.');
        setIsLoading(false);
      }
>>>>>>> Stashed changes
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
              fontFamily: 'Inter, system-ui, sans-serif',
              color: '#000000'
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
            className="w-full max-w-sm mx-auto py-4 text-base font-medium rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-3 bg-transparent transition-colors"
            style={{ 
              fontFamily: 'Inter, system-ui, sans-serif',
              color: '#000000',
              WebkitTextFillColor: '#000000'
            }}
            onClick={handleGoogleAuth}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
              <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
              <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
              <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
            </svg>
            <span style={{ color: '#000000', WebkitTextFillColor: '#000000' }}>Continue with Google</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="px-12 pb-8 flex-shrink-0">
        <button
          type="button"
          className="w-full max-w-sm mx-auto bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                const fullCode = newCode.join('');
                setCode(fullCode);
                
                // Auto-focus next input
                if (e.target.value && index < 5) {
                  const nextInput = e.target.parentElement?.children[index + 1];
                  if (nextInput) nextInput.focus();
                }
                
                // Auto-submit when all 6 digits are entered
                // Use setTimeout to ensure state is updated before submission
                if (fullCode.length === 6 && !isLoading) {
                  setTimeout(() => {
                    // Pass the fullCode directly instead of relying on state
                    handleCodeSubmit({ preventDefault: () => {} }, fullCode);
                  }, 50);
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
                fontFamily: 'Inter, system-ui, sans-serif',
                color: '#000000'
              }}
            />
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-12 mb-4">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Spacer to push content to center */}
      <div className="flex-1" />

      {/* Loading indicator (shown during verification) */}
      {isLoading && (
        <div className="px-12 pb-8 text-center">
          <p className="text-gray-600 text-sm">Verifying...</p>
        </div>
      )}
    </div>
  );

  const renderSuccessStep = () => (
    <div className="w-full h-full flex flex-col items-center justify-center px-12">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h2>
      <p className="text-gray-600 text-center">Setting up your account...</p>
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

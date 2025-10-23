import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import PrimaryButton from './ui/PrimaryButton.jsx';
import { COLORS } from '../theme/colors.js';
import { API_CONFIG } from '../config/api-config.js';

export default function EmailAuth({ onSuccess, testMode = false }) {
  // Component identification
  console.log('📧 EmailAuth (onairos/src/components) initialized');
  console.log('🔧 API Config:', API_CONFIG.getDebugInfo());
  console.log('🧪 Test Mode:', testMode);
  
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
      const doFetchWithRetry = async (url, options, attempts = 3) => {
        let lastErr;
        for (let i = 0; i < attempts; i++) {
          try {
            const res = await fetch(url, options);
            if (!res.ok) {
              // Capture response body for better diagnostics
              try {
                const body = await res.json();
                lastErr = new Error(body?.error || `HTTP ${res.status}`);
              } catch {
                lastErr = new Error(`HTTP ${res.status}`);
              }
            } else {
              return res;
            }
          } catch (err) {
            lastErr = err;
          }
          // backoff: 400ms, 800ms
          await new Promise(r => setTimeout(r, 400 * (i + 1)));
        }
        throw lastErr || new Error('Network error');
      };

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
        const apiKey = window.onairosApiKey || 'test-key';
        const apiUrl = API_CONFIG.getEmailVerifyUrl();
        
        console.log('🚀 LIVE API CALL - Email Request');
        console.log('📋 API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');
        console.log('🌐 URL:', apiUrl);
        console.log('📧 Email:', email);
        
        const headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          // Keep Authorization for backwards compatibility
          'Authorization': `Bearer ${apiKey}`
        };

        
        const response = await doFetchWithRetry(apiUrl, {
          method: 'POST',
          headers,
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
      setError('Couldn’t send code. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      // Use the same Google OAuth logic as UniversalOnboarding
      const sdkConfig = {
        baseUrl: 'https://api2.onairos.uk',
        apiKey: window.onairosApiKey || 'test-key',
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

      // Open popup for OAuth
      const popup = window.open(
        fullUrl,
        'google_oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Monitor popup for completion
      const checkInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkInterval);
          console.log('✅ Google OAuth popup closed');
          // Simulate successful OAuth for now
          onSuccess({ 
            email: 'user@gmail.com', 
            method: 'google',
            connectedAccounts: { Google: true }
          });
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Google OAuth failed:', error);
      setError('Google authentication failed. Please try again.');
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const doFetchWithRetry = async (url, options, attempts = 3) => {
        let lastErr;
        for (let i = 0; i < attempts; i++) {
          try {
            const res = await fetch(url, options);
            if (!res.ok) {
              try {
                const body = await res.json();
                lastErr = new Error(body?.error || `HTTP ${res.status}`);
              } catch {
                lastErr = new Error(`HTTP ${res.status}`);
              }
            } else {
              return res;
            }
          } catch (err) {
            lastErr = err;
          }
          await new Promise(r => setTimeout(r, 400 * (i + 1)));
        }
        throw lastErr || new Error('Network error');
      };

      if (testMode) {
        // Test mode: Skip API call completely, simulate verification
        console.log('🧪 Test mode: Simulating code verification for:', email, 'with code:', code);
        
        if (code === '123456' || code.length === 6) {
          setStep('success');
          setTimeout(() => {
            // Simulate new user for design testing using new response format
            const simulatedResponse = { 
              email, 
              verified: true, 
              token: 'test-token-' + Date.now(),
              userName: email.split('@')[0],
              // New response format
              isNewUser: true,
              userState: 'new',
              flowType: 'onboarding',
              user: {
                userName: email.split('@')[0],
                email: email,
                verified: true,
                creationDate: new Date().toISOString(),
                lastLogin: new Date().toISOString()
              },
              enochInstructions: {
                recommendedFlow: 'onboarding',
                nextActionTitle: 'Get Started'
              },
              // Legacy fields for backward compatibility
              existingUser: false,
              accountInfo: null,
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
        const apiKey = window.onairosApiKey || 'test-key';
        const apiUrl = API_CONFIG.getEmailVerifyConfirmUrl();
        
        console.log('🚀 LIVE API CALL - Code Verification');
        console.log('📋 API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');
        console.log('🌐 URL:', apiUrl);
        console.log('📧 Email:', email);
        console.log('🔢 Code:', code);
        
        const headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${apiKey}`
        };
        
        const response = await doFetchWithRetry(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            email: (email || '').trim().toLowerCase(), 
            code 
          }),
        });

        if (!response.ok) {
          throw new Error('Invalid verification code');
        }

        const data = await response.json();
        
        if (!data.success) {
          // Handle error with attempts remaining if available
          const errorMessage = data.error || 'Verification failed';
          if (data.attemptsRemaining !== undefined) {
            throw new Error(`${errorMessage} (${data.attemptsRemaining} attempts remaining)`);
          } else {
            throw new Error(errorMessage);
          }
        }

        console.log('📧 Email verification response:', data);

        setStep('success');
        setTimeout(() => {
          // Pass complete API response using new format
          onSuccess({ 
            email, 
            verified: true, 
            token: data.token,
            userName: data.userName || data.user?.userName,
            // New response format fields
            isNewUser: data.isNewUser,
            userState: data.userState,
            flowType: data.flowType,
            user: data.user,
            existingUserData: data.existingUserData,
            enochInstructions: data.enochInstructions,
            // Legacy fields for backward compatibility
            existingUser: !data.isNewUser,
            accountInfo: data.existingUserData,
            adminMode: data.adminMode,
            userCreated: data.userCreated,
            accountDetails: data.accountDetails || data.user
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setError('Invalid code. Please try again.');
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
            className="w-full max-w-sm mx-auto py-4 text-base font-medium rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-3 bg-transparent transition-colors"
            style={{ 
              fontFamily: 'Inter, system-ui, sans-serif'
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
            Continue with Google
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

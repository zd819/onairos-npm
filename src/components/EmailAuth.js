import React, { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import PrimaryButton from './ui/PrimaryButton.jsx';
import { COLORS } from '../theme/colors.js';

export default function EmailAuth({ onSuccess, testMode = true }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'success'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        // In test mode, still call API but use admin key for instant verification
        setTimeout(() => {
          setStep('code');
          setIsLoading(false);
        }, 1000);
      } else {
        // Use proper email verification API from schema
        const apiKey = testMode ? 'OnairosIsAUnicorn2025' : (window.onairosApiKey || 'test-key');
        
        const response = await fetch('https://api2.onairos.uk/email/verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ 
            email, 
            action: 'request' 
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

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use real email verification API from schema
      const apiKey = testMode ? 'OnairosIsAUnicorn2025' : (window.onairosApiKey || 'test-key');
      
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
    } catch (error) {
      console.error('Email verification error:', error);
      
      // Fallback for test mode
      if (testMode && code === '123456') {
        setStep('success');
        setTimeout(() => {
          onSuccess({ 
            email, 
            verified: true, 
            token: 'test-token',
            userName: email.split('@')[0],
            existingUser: false,
            accountInfo: null,
            isNewUser: true,
            flowType: 'onboarding'
          });
        }, 1000);
      } else {
        setError(error.message || 'Invalid code. Use 123456 for testing.');
        setIsLoading(false);
      }
    }
  };

  const renderEmailStep = () => (
    <div className="w-full flex flex-col" style={{ height: '100%' }}>
      {/* Heading - matching SignInStep.tsx */}
      <div className="w-full mb-6">
        <h1 
          className="font-bold text-left mb-2"
          style={{ 
            fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
            fontWeight: '700',
            fontSize: '24px',
            lineHeight: '32px',
            color: COLORS.textPrimary
          }}
        >
          Your AI persona is getting closer
        </h1>
        <p 
          className="text-left"
          style={{ 
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: '400',
            fontSize: '16px',
            lineHeight: '24px',
            color: COLORS.textSecondary
          }}
        >
          Sign in or create an account
        </p>
      </div>

      {/* Test mode notice */}
      {testMode && (
        <div 
          className="p-3 rounded-lg border text-center mb-6"
          style={{ 
            backgroundColor: '#EBF8FF', 
            borderColor: '#BEE3F8',
            color: '#2B6CB0'
          }}
        >
          <p className="text-sm">Test mode: Any valid email will work</p>
        </div>
      )}

      {/* Email Input - matching SignInStep design */}
      <div className="mb-8">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          style={{ 
            borderColor: COLORS.border,
            backgroundColor: COLORS.background,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '16px'
          }}
          required
        />
      </div>

      {/* Divider - matching SignInStep.tsx */}
      <div className="flex items-center mb-8">
        <div 
          className="flex-1 h-px"
          style={{ backgroundColor: '#E5E5E5' }}
        />
        <span 
          className="px-4 text-sm"
          style={{ 
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: '400',
            color: COLORS.textMuted
          }}
        >
          Or
        </span>
        <div 
          className="flex-1 h-px"
          style={{ backgroundColor: '#E5E5E5' }}
        />
      </div>

      {/* Google Button - matching design */}
      <div className="mb-8">
        <button
          type="button"
          className="w-full flex items-center justify-center px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
          style={{ 
            borderColor: COLORS.border,
            backgroundColor: COLORS.background,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: '500',
            color: COLORS.textPrimary
          }}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6">
          <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1, minHeight: '20px' }} />

      {/* Continue Button - positioned at bottom */}
      <div className="w-full">
        <PrimaryButton
          label="Continue"
          onClick={handleEmailSubmit}
          loading={isLoading}
          disabled={isLoading || !email.trim()}
          testId="email-continue-button"
        />
      </div>
    </div>
  );

  const renderCodeStep = () => (
    <div className="w-full flex flex-col" style={{ height: '100%' }}>
      {/* Heading - matching VerificationStep.tsx */}
      <div className="w-full mb-10">
        <h1 
          className="font-bold text-left mb-2"
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
          className="text-left mb-2"
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

      {/* Test mode notice */}
      {testMode && (
        <div 
          className="p-3 rounded-lg border text-center mb-6"
          style={{ 
            backgroundColor: '#EBF8FF', 
            borderColor: '#BEE3F8',
            color: '#2B6CB0'
          }}
        >
          <p className="text-sm">Test mode: Use code 123456</p>
        </div>
      )}

      {/* Code Input - matching VerificationStep design with individual digit boxes */}
      <div className="px-4 mb-6">
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
        <div className="mb-6">
          <p className="text-sm text-center" style={{ color: COLORS.error }}>{error}</p>
        </div>
      )}

      {/* Continue Button - positioned right below code inputs */}
      <div className="w-full mb-6">
        <PrimaryButton
          label="Continue"
          onClick={handleCodeSubmit}
          loading={isLoading}
          disabled={isLoading || code.length !== 6}
          testId="verify-code-button"
        />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1, minHeight: '20px' }} />

      {/* Back to email option */}
      <div className="w-full">
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
  );

  const renderSuccessStep = () => (
    <div className="w-full flex flex-col items-center space-y-6">
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
import React, { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';

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
        // In test mode, skip email sending and go directly to code step
        setTimeout(() => {
          setStep('code');
          setIsLoading(false);
        }, 1000);
      } else {
        // In production, send actual email
        const response = await fetch('https://api2.onairos.uk/email/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          throw new Error('Failed to send verification code');
        }

        setStep('code');
        setIsLoading(false);
      }
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (testMode && code === '123456') {
      // Test mode - accept 123456 as valid code
      setStep('success');
      setTimeout(() => {
        onSuccess({ email, verified: true });
      }, 1000);
      return;
    }

    if (!testMode) {
      setIsLoading(true);

      try {
        const response = await fetch('https://api2.onairos.uk/email/verify/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, code }),
        });

        if (!response.ok) {
          throw new Error('Invalid verification code');
        }

        const data = await response.json();
        setStep('success');
        setTimeout(() => {
          onSuccess({ email, verified: true, token: data.token });
        }, 1000);
      } catch (error) {
        setError(error.message);
        setIsLoading(false);
      }
    } else {
      setError('Invalid code. Use 123456 for testing.');
    }
  };

  const renderEmailStep = () => (
    <div className="flex flex-col items-center space-y-6 w-full">
      <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
        <Mail className="w-8 h-8 text-blue-600" />
      </div>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to Onairos</h2>
        <p className="text-gray-600">Enter your email address to continue</p>
        {testMode && (
          <p className="text-sm text-blue-600 mt-2">Test mode: Any valid email will work</p>
        )}
      </div>

      <form onSubmit={handleEmailSubmit} className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );

  const renderCodeStep = () => (
    <div className="flex flex-col items-center space-y-6 w-full">
      <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
        <Mail className="w-8 h-8 text-green-600" />
      </div>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-600">We sent a verification code to</p>
        <p className="text-gray-900 font-medium">{email}</p>
        {testMode && (
          <p className="text-sm text-blue-600 mt-2">Test mode: Use code 123456</p>
        )}
      </div>

      <form onSubmit={handleCodeSubmit} className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Verification code
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-lg tracking-widest"
            maxLength="6"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
          ) : (
            'Verify Code'
          )}
        </button>

        <button
          type="button"
          onClick={() => setStep('email')}
          className="w-full py-2 px-4 text-gray-600 hover:text-gray-800"
        >
          Use a different email
        </button>
      </form>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="flex flex-col items-center space-y-6 w-full">
      <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Email verified!</h2>
        <p className="text-gray-600">Setting up your account...</p>
      </div>

      <div className="w-8 h-8">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center space-y-6 p-6 w-full">
      {step === 'email' && renderEmailStep()}
      {step === 'code' && renderCodeStep()}
      {step === 'success' && renderSuccessStep()}
    </div>
  );
} 
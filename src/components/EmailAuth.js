import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import PrimaryButton from './ui/PrimaryButton.jsx';
import { COLORS } from '../theme/colors.js';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { isMobileBrowser } from '../utils/capacitorDetection';
import { GoogleLogin } from '@react-oauth/google';

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

  const handleOAuthSuccess = async (gmailEmail, credential) => {
    try {
      setIsLoading(true);
      console.log('✅ Google OAuth completed successfully, email:', gmailEmail);

      const normalizedEmail = (gmailEmail || '').trim().toLowerCase();
      setEmail(normalizedEmail);

      const baseUrl = (typeof window !== 'undefined' && window.onairosBaseUrl) || 'https://api2.onairos.uk';
      const apiKey = (typeof window !== 'undefined' && window.onairosApiKey) || 'ona_VvoHNg1fdCCUa9eBy4Iz3IfvXdgLfMFI7TNcyHLDKEadPogkbjAeE2iDOs6M7Aey';

      // STEP 1: Call backend to create/login account
      console.log('🔐 Authenticating with backend via /google/google...');
      console.log('🔑 Sending ID token (JWT format) to backend for verification');
      
      try {
        const authResponse = await fetch(`${baseUrl}/google/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            credential: credential  // Google ID token (JWT) - NOT access token!
          })
        });

        if (!authResponse.ok) {
          const errorData = await authResponse.json();
          throw new Error(errorData.body?.message || 'Failed to authenticate with backend');
        }

        const authData = await authResponse.json();
        console.log('✅ Backend authentication successful:', {
          username: authData.body?.username,
          isNewUser: authData.body?.isNewUser
        });

        // Extract data from backend response
        const jwtToken = authData.body?.token;
        const username = authData.body?.username || normalizedEmail;
        const isNewUser = authData.body?.isNewUser !== false; // Default to true if not specified

        // STEP 2: Check account status for additional info
        let accountInfo = null;
        let accountStatus = null;

        try {
          console.log('🔍 Fetching account status...');
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
              console.log('✅ Account status retrieved:', {
                exists: accountStatus?.exists,
                connectedPlatforms: accountStatus?.connectedPlatforms
              });
            }
          }
        } catch (accountCheckError) {
          console.warn('⚠️ Could not fetch account status (non-critical):', accountCheckError);
        }

        setStep('success');
        setIsLoading(false);

        // STEP 3: Return success with token and user data
        setTimeout(() => {
          onSuccess({
            email: normalizedEmail,
            verified: true,
            token: jwtToken,  // ✅ NOW we have a JWT token from backend!
            jwtToken: jwtToken,
            userName: username,
            username: username,
            existingUser: !isNewUser,
            accountInfo: accountInfo,
            accountStatus: accountStatus,
            isNewUser: isNewUser,
            flowType: isNewUser ? 'onboarding' : 'dataRequest',
            adminMode: false,
            userCreated: isNewUser,
            provider: 'google',
            accountDetails: accountInfo || {
              email: normalizedEmail,
              createdAt: new Date().toISOString(),
              ssoProvider: 'google'
            }
          });
        }, 400);

      } catch (authError) {
        console.error('❌ Backend authentication failed:', authError);
        setError(authError.message || 'Failed to authenticate with backend. Please try again.');
        setIsLoading(false);
        return;
      }
    
    } catch (error) {
      console.error('❌ Error handling OAuth success:', error);
      setError('Failed to continue with Google authentication. Please try again.');
      setIsLoading(false);
    }
  };

  // Note: No OAuth callback checking needed - frontend SDK handles everything automatically

  // Google Sign-In success handler
  // Receives ID token (JWT) from Google - this is the CORRECT token type for authentication
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setError('');
      console.log('✅ Google OAuth successful - ID token received');
      
      // credentialResponse.credential is the ID token (JWT format: eyJhbGciOiJ...)
      const idToken = credentialResponse.credential;
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }
      
      console.log('🔑 ID token format:', idToken.substring(0, 20) + '...');
      
      // Decode the JWT to get user email (without verifying - backend will verify)
      try {
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        const userEmail = payload.email;
        
        console.log('✅ Decoded email from ID token:', userEmail);
        
        // Handle OAuth success with email and ID token (not access token!)
        await handleOAuthSuccess(userEmail, idToken);
        
      } catch (decodeError) {
        console.error('❌ Failed to decode ID token:', decodeError);
        setError('Failed to process Google authentication. Please try again.');
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('❌ Error handling Google success:', error);
      setError('Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('❌ Google Sign In failed:', error);
    setError('Failed to sign in with Google. Please try again.');
    setIsLoading(false);
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

        // Email-code verification responses are not always consistent about returning accountStatus,
        // especially for existing users. To keep DataRequest connected apps accurate, we perform the
        // same accountStatus lookup that Google OAuth uses.
        let accountInfo = data.user || data.accountInfo || null;
        let accountStatus = data.accountStatus || null;
        let existingUser = false;
        let isNewUser = data.isNewUser !== undefined ? data.isNewUser : true;

        try {
          const normalizedEmail = String(email || '').trim().toLowerCase();
          if (normalizedEmail) {
            console.log('🔍 (Email) Checking account status via /getAccountInfo/email for:', normalizedEmail);
            const accountCheckResponse = await fetch(`${baseUrl}/getAccountInfo/email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
              },
              body: JSON.stringify({
                Info: {
                  identifier: normalizedEmail,
                },
              }),
            });

            if (accountCheckResponse.ok) {
              const accountData = await accountCheckResponse.json();
              // Explicit "no account" response -> force onboarding for truly new users
              const noAccount =
                !accountData?.AccountInfo ||
                accountData?.AccountInfo === 'No Account Found' ||
                (typeof accountData?.accountStatus?.exists === 'boolean' && accountData.accountStatus.exists === false);

              if (noAccount) {
                accountInfo = null;
                accountStatus = accountData?.accountStatus || { exists: false, connectedPlatforms: [] };
                existingUser = false;
                isNewUser = true;
              } else if (accountData?.AccountInfo) {
                accountInfo = accountInfo || accountData.AccountInfo;
              }
              if (accountData?.accountStatus) {
                accountStatus = accountData.accountStatus;
              }
              if (typeof accountStatus?.exists === 'boolean') {
                existingUser = accountStatus.exists;
                isNewUser = !accountStatus.exists;
              }
            } else {
              console.log('ℹ️ (Email) /getAccountInfo/email returned non-OK; continuing with verification response');
            }
          }
        } catch (accountCheckError) {
          console.warn('⚠️ (Email) Could not check account status; continuing with verification response:', accountCheckError);
        }

        // Fall back if accountStatus didn't provide an exists boolean
        if (typeof accountStatus?.exists !== 'boolean') {
          existingUser = !isNewUser;
        }

        setStep('success');
        setTimeout(() => {
          onSuccess({ 
            email, 
            verified: true, 
            token: data.token || data.jwtToken,
            userName: data.userName || accountInfo?.userName,
            existingUser: existingUser,
            isNewUser: isNewUser,
            flowType: isNewUser ? 'onboarding' : 'dataRequest',
            accountInfo: accountInfo,
            accountStatus: accountStatus,
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
            <div className="mb-8 w-full google-button-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="continue_with"
                size="large"
                width="100%"
                disabled={isLoading}
              />
              <style>{`
                .google-button-container {
                  height: 56px;
                }
                .google-button-container > div {
                  height: 56px !important;
                  width: 100% !important;
                }
                .google-button-container iframe {
                  height: 56px !important;
                  width: 100% !important;
                }
              `}</style>
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
            className="w-full bg-black text-white font-medium rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
            style={{ fontFamily: 'Inter, system-ui, sans-serif', height: '44px', minHeight: '44px' }}
        >
            {isLoading ? 'Sending...' : 'Continue with Email'}
        </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="google-button-container-desktop">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="continue_with"
              size="large"
              width="100%"
              disabled={isLoading}
            />
            <style>{`
              .google-button-container-desktop {
                height: 44px;
              }
              .google-button-container-desktop > div {
                height: 44px !important;
                width: 100% !important;
              }
              .google-button-container-desktop iframe {
                height: 44px !important;
                width: 100% !important;
              }
            `}</style>
          </div>
          
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

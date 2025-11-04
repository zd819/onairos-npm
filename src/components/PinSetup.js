import React, { useState, useEffect } from 'react';

export default function PinSetup({ onComplete, onBack, userEmail }) {
  const [pin, setPin] = useState('');
  const [pinRequirements, setPinRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPinRequirements({
      length: pin.length >= 6,
      uppercase: /[A-Z]/.test(pin),
      number: /\d/.test(pin),
    });
  }, [pin]);

  const allRequirementsMet = pinRequirements.length && pinRequirements.uppercase && pinRequirements.number;

  const pollTrainingStatus = async (baseUrl, jobId, token) => {
    const apiKey = (typeof window !== 'undefined' && window.onairosApiKey) || null;
    const headers = { 'Content-Type': 'application/json' };
    
    // Only use JWT token in Authorization header (not API key)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Always include API key in x-api-key header if available
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(baseUrl + '/training-queue/status/' + jobId, {
          headers
        });
        const data = await res.json();
        const status = (data && data.job && data.job.status) ? data.job.status : 'processing';
        setTrainingStatus(status);
        if (status === 'processing') setTrainingProgress(function(p){ return Math.max(p, 50); });
        if (status === 'completed') {
          clearInterval(interval);
          setTrainingProgress(100);
          onComplete({
            pin: pin,
            pinCreated: true,
            trainingCompleted: true,
            timestamp: new Date().toISOString()
          });
        } else if (status === 'failed') {
          clearInterval(interval);
          setError((data && data.job && data.job.error) ? data.job.error : 'Training failed');
          setIsSaving(false);
        }
      } catch (e) {
        console.warn('Training polling error:', e && e.message);
      }
    }, 5000);
  };

  const handleSubmit = async () => {
    if (!allRequirementsMet || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      // Resolve base URL and auth context
      const baseUrl = (typeof window !== 'undefined' && window.onairosBaseUrl) || 'https://api2.onairos.uk';
      let user = {};
      try { user = JSON.parse(localStorage.getItem('onairosUser') || '{}'); } catch (e) {}
      
      // Debug: Log what's actually in localStorage
      console.log('🔍 DEBUG: localStorage contents:', {
        onairosUserKeys: user ? Object.keys(user) : [],
        hasTokenInUser: !!user?.token,
        hasJwtTokenInUser: !!user?.jwtToken,
        onairos_jwt_token: typeof window !== 'undefined' ? localStorage.getItem('onairos_jwt_token')?.substring(0, 20) + '...' : 'N/A',
        onairosToken: typeof window !== 'undefined' ? localStorage.getItem('onairosToken')?.substring(0, 20) + '...' : 'N/A'
      });
      
      // Check multiple token storage locations
      const tokenFromUser = user?.token || user?.jwtToken;                        // JWT from login/email flow in user object
      const tokenFromLocalStorage = typeof window !== 'undefined' ? localStorage.getItem('onairos_jwt_token') : null; // Direct JWT storage
      const legacyToken = typeof window !== 'undefined' ? localStorage.getItem('onairosToken') : null; // Legacy token
      
      // Use token in priority order: user object > direct storage > legacy
      // IMPORTANT: Only use JWT tokens in Authorization header, NOT API keys
      const token = tokenFromUser || tokenFromLocalStorage || legacyToken;
      const apiKey = (typeof window !== 'undefined' && window.onairosApiKey) || null;
      
      console.log('🔐 Token resolution:', {
        tokenFromUser: !!tokenFromUser,
        tokenFromUserValue: tokenFromUser || 'undefined',
        tokenFromLocalStorage: !!tokenFromLocalStorage,
        tokenFromLocalStorageValue: tokenFromLocalStorage || 'undefined',
        legacyToken: !!legacyToken,
        apiKey: !!apiKey,
        usingToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
        tokenIsJWT: token ? token.includes('.') && token.split('.').length === 3 : false,
        userObject: JSON.stringify(user).substring(0, 300) // First 300 chars for debugging
      });
      
      // If no token, try to generate one using verified user info
      if (!token) {
        console.warn('⚠️ No JWT token found. Attempting to generate token using verified user info...');
        
        const username = userEmail || user?.userName || user?.email || '';
        const userId = user?.userId || user?.id;
        
        if (username && userId) {
          try {
            // Try to get token from backend using verified user info
            const tokenResponse = await fetch(`${baseUrl}/auth/generate-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey || '',
                'Authorization': apiKey ? `Bearer ${apiKey}` : ''
              },
              body: JSON.stringify({
                email: username.includes('@') ? username : user?.email,
                userId: userId,
                userName: username,
                verified: true
              })
            });
            
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              const generatedToken = tokenData.token || tokenData.jwtToken || tokenData.accessToken;
              
              if (generatedToken) {
                console.log('✅ Successfully generated token:', generatedToken.substring(0, 20) + '...');
                token = generatedToken;
                // Store it for future use
                if (typeof window !== 'undefined') {
                  localStorage.setItem('onairos_jwt_token', generatedToken);
                  // Update user object
                  try {
                    const updatedUser = { ...user, token: generatedToken, jwtToken: generatedToken };
                    localStorage.setItem('onairosUser', JSON.stringify(updatedUser));
                  } catch (e) {}
                }
              }
            }
          } catch (tokenError) {
            console.warn('⚠️ Failed to generate token:', tokenError.message);
          }
        }
        
        // If still no token after trying to generate, try calling the API without token
        // The backend might accept userId/email in the body
        if (!token) {
          console.error('❌ No JWT token found and could not generate one');
          console.error('❌ Full localStorage debug:', {
            onairosUser: typeof window !== 'undefined' ? localStorage.getItem('onairosUser') : 'N/A',
            onairos_jwt_token: typeof window !== 'undefined' ? localStorage.getItem('onairos_jwt_token') : 'N/A',
            onairosToken: typeof window !== 'undefined' ? localStorage.getItem('onairosToken') : 'N/A'
          });
          // Continue anyway - backend might handle auth differently
          console.warn('⚠️ Proceeding without token - backend may authenticate using userId/email in request body');
        }
      }
      
      const username = userEmail || user?.userName || user?.email || '';
      if (!username) throw new Error('Missing username/email');
      
      // Build headers: JWT token in Authorization, API key in x-api-key
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;  // Use JWT token if available
      }
      if (apiKey) headers['x-api-key'] = apiKey;      // API key in separate header
      
      // Build request body - include userId/email if no token (backend might authenticate using these)
      const requestBody = { username, pin };
      if (!token && (user?.userId || user?.id)) {
        requestBody.userId = user?.userId || user?.id;
        requestBody.email = user?.email || username;
        console.log('⚠️ No token available - including userId/email in request body for backend authentication');
      }
      
      console.log('🔐 Request headers:', {
        hasAuthorization: !!headers['Authorization'],
        hasApiKey: !!headers['x-api-key'],
        username,
        hasToken: !!token,
        requestBodyKeys: Object.keys(requestBody)
      });
      
      // Store PIN and auto-queue training
      const res = await fetch(`${baseUrl}/store-pin/web`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      const result = await res.json();
      
      console.log('🔐 Store PIN response:', {
        status: res.status,
        ok: res.ok,
        success: result?.success,
        error: result?.error,
        message: result?.message
      });
      
      if (!res.ok || !(result && result.success)) {
        const errorMessage = result?.error || result?.message || 'Failed to store PIN';
        console.error('❌ Store PIN failed:', {
          status: res.status,
          error: errorMessage,
          fullResponse: result
        });
        
        // Check if it's a token expiration issue
        if (res.status === 401 || errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('unauthorized')) {
          throw new Error(`Authentication failed: ${errorMessage}. Please try logging in again.`);
        }
        
        throw new Error(errorMessage);
      }

      if (result && result.training && result.training.queued && result.training.jobId) {
        setTrainingStatus('queued');
        setTrainingProgress(10);
        pollTrainingStatus(baseUrl, result.training.jobId, token);
      } else {
        onComplete({
          pin: pin,
          pinCreated: true,
          trainingCompleted: false,
          reason: (result && result.training && result.training.reason) || 'No connected platforms',
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      setError((e && e.message) || 'Failed to store PIN');
      setIsSaving(false);
    }
  };

  return (
    React.createElement('div', { className: 'w-full h-full flex flex-col', style: { height: '100%', minHeight: 0 } },
      React.createElement('div', { className: 'px-6 pt-16 flex-1 flex flex-col', style: { minHeight: 0, overflow: 'hidden' } },
        React.createElement('div', { className: 'mb-6 flex-shrink-0' },
          React.createElement('h1', { className: 'text-2xl font-bold text-gray-900 mb-2' }, 'Create a PIN'),
          React.createElement('p', { className: 'text-gray-600 text-base' }, 'A PIN so only you have the access to your data')
        ),
        React.createElement('div', { className: 'mb-6 flex-shrink-0' },
          React.createElement('input', {
            type: 'password',
            value: pin,
            onChange: function(e){ setPin(e.target.value); },
            className: 'w-full px-4 py-4 border-2 border-gray-300 rounded-xl text-center text-lg font-medium focus:border-gray-900 focus:outline-none bg-white',
            placeholder: 'Enter your PIN',
            maxLength: 20,
            style: { color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#FFFFFF' }
          })
        ),
        React.createElement('div', { className: 'flex-1 overflow-y-auto', style: { minHeight: 0 } },
          React.createElement('div', { className: 'space-y-3 pb-4' },
            React.createElement('p', { className: 'text-gray-900 font-medium mb-4' }, 'Your PIN must:'),
            React.createElement('div', { className: 'space-y-3' },
              React.createElement('div', { className: 'flex items-center gap-3' },
                React.createElement('div', { className: 'w-5 h-5 rounded-full border-2 ' + (pinRequirements.length ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white') },
                  pinRequirements.length ? React.createElement('svg', { className: 'w-3 h-3 text-white m-0.5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                    React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M5 13l4 4L19 7' })
                  ) : null
                ),
                React.createElement('span', { className: 'text-gray-700' }, 'Be at least 6 characters in length.')
              ),
              React.createElement('div', { className: 'flex items-center gap-3' },
                React.createElement('div', { className: 'w-5 h-5 rounded-full border-2 ' + (pinRequirements.uppercase ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white') },
                  pinRequirements.uppercase ? React.createElement('svg', { className: 'w-3 h-3 text-white m-0.5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                    React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M5 13l4 4L19 7' })
                  ) : null
                ),
                React.createElement('span', { className: 'text-gray-700' }, 'Contain an uppercase letter.')
              ),
              React.createElement('div', { className: 'flex items-center gap-3' },
                React.createElement('div', { className: 'w-5 h-5 rounded-full border-2 ' + (pinRequirements.number ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white') },
                  pinRequirements.number ? React.createElement('svg', { className: 'w-3 h-3 text-white m-0.5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                    React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M5 13l4 4L19 7' })
                  ) : null
                ),
                React.createElement('span', { className: 'text-gray-700' }, 'Contain a number.')
              )
            )
          )
        )
      ),
      React.createElement('div', { className: 'px-6 pb-6 pt-4 flex-shrink-0 space-y-3', style: { minHeight: 'auto' } },
        trainingStatus ? React.createElement('div', { className: 'w-full' },
          React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-3 overflow-hidden' },
            React.createElement('div', { className: 'bg-gray-900 h-3 rounded-full transition-all duration-500', style: { width: String(trainingProgress) + '%' } })
          ),
          React.createElement('p', { className: 'text-sm text-gray-600 mt-2 text-center' },
            trainingStatus === 'queued' ? 'Training queued...' : (trainingStatus === 'processing' ? 'Training in progress...' : (trainingStatus === 'completed' ? '✓ Training completed!' : (trainingStatus === 'failed' ? '✗ Training failed' : '')))
          )
        ) : null,
        error ? React.createElement('div', { className: 'w-full text-center text-red-600 text-sm' }, error) : null,
        React.createElement('div', {
          className: 'w-full rounded-full py-4 text-base font-medium flex items-center justify-center gap-2 transition-colors ' + (
            allRequirementsMet && !isSaving && !trainingStatus ? 'bg-gray-900 hover:bg-gray-800 text-white cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ),
          onClick: allRequirementsMet && !isSaving && !trainingStatus ? handleSubmit : undefined
        },
          isSaving || trainingStatus ? React.createElement(React.Fragment, null,
            React.createElement('svg', { className: 'animate-spin h-5 w-5 text-white', xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24' },
              React.createElement('circle', { className: 'opacity-25', cx: '12', cy: '12', r: '10', stroke: 'currentColor', strokeWidth: '4' }),
              React.createElement('path', { className: 'opacity-75', fill: 'currentColor', d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' })
            ),
            trainingStatus === 'processing' ? 'Training...' : 'Processing...'
          ) : React.createElement(React.Fragment, null,
            'Continue',
            React.createElement('svg', { className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
              React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9 5l7 7-7 7' })
            )
          )
        )
      )
    )
  );
}

import React, { useState } from 'react';

export default function SecuritySetup({ onComplete }) {
  const [securityMethod, setSecurityMethod] = useState('pin');

  const handlePinSetup = () => {
    onComplete({ method: 'pin' });
  };

  const handleEmailSetup = () => {
    onComplete({ method: 'email' });
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Choose Security Method</h2>
      
      <div className="space-y-4">
        {/* PIN Security Option */}
        <div 
          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            securityMethod === 'pin' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSecurityMethod('pin')}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 mr-3 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">🔒</span>
            </div>
            <span className="text-gray-700">Secure with PIN</span>
          </div>
          <p className="text-sm text-gray-500 mt-2 ml-11">
            Create a secure PIN for quick access
          </p>
        </div>

        {/* Email Security Option */}
        <div 
          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            securityMethod === 'email' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSecurityMethod('email')}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 mr-3 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">📧</span>
            </div>
            <span className="text-gray-700">Secure with Email</span>
          </div>
          <p className="text-sm text-gray-500 mt-2 ml-11">
            Use email verification for security
          </p>
        </div>
      </div>

      <div className="mt-6">
        {securityMethod === 'pin' && (
          <button
            onClick={handlePinSetup}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue with PIN
          </button>
        )}
        
        {securityMethod === 'email' && (
          <button
            onClick={handleEmailSetup}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue with Email
          </button>
        )}
      </div>
    </div>
  );
} 
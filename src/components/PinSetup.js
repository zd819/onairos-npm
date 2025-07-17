import React, { useState, useEffect } from 'react';

export default function PinSetup({ onComplete, userEmail }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Check PIN requirements
  useEffect(() => {
    setRequirements({
      length: pin.length >= 6,
      uppercase: /[A-Z]/.test(pin),
      lowercase: /[a-z]/.test(pin),
      number: /[0-9]/.test(pin),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pin)
    });
  }, [pin]);

  const allRequirementsMet = Object.values(requirements).every(req => req);
  const pinsMatch = pin === confirmPin && pin.length > 0;
  const canSubmit = allRequirementsMet && pinsMatch;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) {
      // In a real app, you would hash the PIN before storing
      onComplete({
        pin: pin, // This should be hashed in production
        pinCreated: true,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2zM12 7V3m0 4l3-3m-3 3L9 4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Secure PIN</h2>
        <p className="text-gray-600">Your PIN will be used to securely access your data</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* PIN Input */}
        <div>
          <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
            Enter PIN
          </label>
          <input
            type="password"
            id="pin"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your secure PIN"
          />
        </div>

        {/* Confirm PIN Input */}
        <div>
          <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm PIN
          </label>
          <input
            type="password"
            id="confirmPin"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Confirm your PIN"
          />
          {confirmPin && !pinsMatch && (
            <p className="text-red-500 text-sm mt-1">PINs do not match</p>
          )}
          {confirmPin && pinsMatch && (
            <p className="text-green-500 text-sm mt-1">✅ PINs match</p>
          )}
        </div>

        {/* Requirements */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">PIN Requirements:</h4>
          <div className="space-y-2">
            {Object.entries({
              length: 'At least 6 characters',
              uppercase: 'One uppercase letter (A-Z)',
              lowercase: 'One lowercase letter (a-z)',
              number: 'One number (0-9)',
              special: 'One special character (!@#$%^&*)'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                  requirements[key] ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {requirements[key] && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${requirements[key] ? 'text-green-600' : 'text-gray-600'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            canSubmit
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Create PIN
        </button>
      </form>

      {userEmail && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Securing account for: <span className="font-medium">{userEmail}</span>
        </p>
      )}
    </div>
  );
} 
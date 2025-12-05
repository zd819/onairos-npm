import React, { useState, useEffect } from 'react';

export default function PinSetup({ onComplete, onBack, userEmail }) {
  const [pin, setPin] = useState('');
  const [pinRequirements, setPinRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
  });

  // Check PIN requirements
  useEffect(() => {
    setPinRequirements({
      length: pin.length >= 6,
      uppercase: /[A-Z]/.test(pin),
      number: /\d/.test(pin),
    });
  }, [pin]);

  const allRequirementsMet = pinRequirements.length && pinRequirements.uppercase && pinRequirements.number;

  const handleSubmit = () => {
    if (allRequirementsMet) {
      onComplete({
        pin: pin, // This should be hashed in production
        pinCreated: true,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ height: '100%', minHeight: 0 }}>
      {/* Content - Flexible center area */}
      <div className="px-6 pt-16 flex-1 flex flex-col" style={{ minHeight: 0, overflow: 'hidden' }}>
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create a PIN</h1>
          <p className="text-gray-600 text-base">A PIN so only you have the access to your data</p>
        </div>

        <div className="mb-6 flex-shrink-0">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl text-center text-lg font-medium focus:border-gray-900 focus:outline-none bg-white !text-black"
            placeholder="Enter your PIN"
            maxLength={20}
            style={{
              WebkitTextFillColor: '#000000',
              backgroundColor: '#FFFFFF'
            }}
          />
        </div>

        {/* Scrollable requirements list */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          <div className="space-y-3 pb-4">
            <p className="text-gray-900 font-medium mb-4">Your PIN must:</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 ${pinRequirements.length ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"}`}
                >
                  {pinRequirements.length && (
                    <svg className="w-3 h-3 text-white m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-700">Be at least 6 characters in length.</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 ${pinRequirements.uppercase ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"}`}
                >
                  {pinRequirements.uppercase && (
                    <svg className="w-3 h-3 text-white m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-700">Contain an uppercase letter.</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 ${pinRequirements.number ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"}`}
                >
                  {pinRequirements.number && (
                    <svg className="w-3 h-3 text-white m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-700">Contain a number.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons - Fixed at bottom */}
      <div className="px-6 pb-6 pt-4 flex-shrink-0 space-y-3" style={{ minHeight: 'auto' }}>
        <div
          className={`w-full rounded-full py-4 text-base font-medium flex items-center justify-center gap-2 transition-colors ${
            allRequirementsMet 
              ? "bg-gray-900 hover:bg-gray-800 !text-white cursor-pointer" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={allRequirementsMet ? handleSubmit : undefined}
        >
          Continue
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
} 
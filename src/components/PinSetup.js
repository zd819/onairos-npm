import React, { useState, useEffect } from 'react';
import PrimaryButton from './ui/PrimaryButton.jsx';
import { COLORS } from '../theme/colors.js';

export default function PinSetup({ onComplete, userEmail }) {
  const [pin, setPin] = useState('');
  const [requirements, setRequirements] = useState({
    length: false,
    number: false,
    special: false
  });

  // Check PIN requirements (simplified)
  useEffect(() => {
    setRequirements({
      length: pin.length >= 8,
      number: /[0-9]/.test(pin),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pin)
    });
  }, [pin]);

  const allRequirementsMet = Object.values(requirements).every(req => req);
  const canSubmit = allRequirementsMet && pin.length > 0;

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
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* PIN Input */}
        <div>
          <label 
            htmlFor="pin" 
            className="block text-sm font-medium mb-2"
            style={{ color: COLORS.textPrimary }}
          >
            Create PIN
          </label>
          <input
            type="password"
            id="pin"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ 
              borderColor: COLORS.border,
              backgroundColor: COLORS.background
            }}
            placeholder="Enter your secure PIN"
          />
        </div>

        {/* Requirements */}
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: COLORS.backgroundSecondary }}
        >
          <h4 
            className="text-sm font-medium mb-3"
            style={{ color: COLORS.textPrimary }}
          >
            PIN Requirements:
          </h4>
          <div className="space-y-2">
            {Object.entries({
              length: 'At least 8 characters',
              number: 'One number (0-9)',
              special: 'One special character (!@#$%^&*)'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2 flex items-center justify-center"
                  style={{ 
                    backgroundColor: requirements[key] ? COLORS.success : COLORS.border 
                  }}
                >
                  {requirements[key] && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span 
                  className="text-sm"
                  style={{ 
                    color: requirements[key] ? COLORS.success : COLORS.textSecondary 
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <PrimaryButton
          label="Create PIN"
          onClick={handleSubmit}
          disabled={!canSubmit}
          testId="create-pin-button"
        />
      </form>

      {userEmail && (
        <p 
          className="text-center text-sm"
          style={{ color: COLORS.textSecondary }}
        >
          Securing account for: <span className="font-medium">{userEmail}</span>
        </p>
      )}
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SecuritySetup({ onComplete }) {
  const [pin, setPin] = useState('');
  const [securityMethod, setSecurityMethod] = useState(null);
  const [pinRequirements, setPinRequirements] = useState({
    length: false,
    capital: false,
    number: false,
    symbol: false
  });

  useEffect(() => {
    // Check PIN requirements
    setPinRequirements({
      length: pin.length >= 8,
      capital: /[A-Z]/.test(pin),
      number: /[0-9]/.test(pin),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(pin)
    });
  }, [pin]);

  const allRequirementsMet = Object.values(pinRequirements).every(req => req);

  const handlePinSubmit = async () => {
    if (allRequirementsMet) {
      // Here you would typically hash the PIN and store it
      onComplete({ method: 'pin', value: pin });
    }
  };

  const handleOthentSetup = () => {
    onComplete({ method: 'othent' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center space-y-6 p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900">Secure Your Account</h2>
      <p className="text-gray-600 text-center">
        Choose how you want to secure your data
      </p>

      {!securityMethod ? (
        <div className="grid grid-cols-1 gap-4 w-full max-w-md">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSecurityMethod('othent')}
            className="flex items-center justify-center p-6 rounded-lg border border-gray-300 hover:border-blue-500 bg-white"
          >
            <img src="https://onairos.sirv.com/Images/othent-icon.png" alt="Othent" className="w-8 h-8 mr-3" />
            <span className="text-gray-700">Secure with Google (Othent)</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSecurityMethod('pin')}
            className="flex items-center justify-center p-6 rounded-lg border border-gray-300 hover:border-blue-500 bg-white"
          >
            <span className="material-icons mr-3">lock</span>
            <span className="text-gray-700">Set up PIN</span>
          </motion.button>
        </div>
      ) : securityMethod === 'pin' ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md space-y-4"
        >
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter your PIN"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="space-y-2">
            {Object.entries(pinRequirements).map(([req, met]) => (
              <div key={req} className="flex items-center">
                <span className={`material-icons text-sm ${met ? 'text-green-500' : 'text-gray-400'}`}>
                  {met ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span className={`ml-2 text-sm ${met ? 'text-green-600' : 'text-gray-600'}`}>
                  {req === 'length' ? 'At least 8 characters' :
                   req === 'capital' ? 'One capital letter' :
                   req === 'number' ? 'One number' : 'One special character'}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handlePinSubmit}
            disabled={!allRequirementsMet}
            className={`w-full py-3 px-4 rounded-lg font-semibold ${
              allRequirementsMet
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Set PIN
          </button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md"
        >
          <button
            onClick={handleOthentSetup}
            className="w-full py-3 px-4 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600"
          >
            Continue with Othent
          </button>
        </motion.div>
      )}
    </motion.div>
  );
} 
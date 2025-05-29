import React, { useState, useEffect } from 'react';
import { Lock, Check, AlertCircle } from 'lucide-react';

export default function PinSetup({ onComplete, userEmail }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('create'); // 'create' | 'confirm' | 'success'
  const [error, setError] = useState('');
  const [pinRequirements, setPinRequirements] = useState({
    length: false,
    number: false,
    uppercase: false,
    lowercase: false
  });

  useEffect(() => {
    // Check PIN requirements
    setPinRequirements({
      length: pin.length >= 6,
      number: /[0-9]/.test(pin),
      uppercase: /[A-Z]/.test(pin),
      lowercase: /[a-z]/.test(pin)
    });
  }, [pin]);

  const allRequirementsMet = Object.values(pinRequirements).every(req => req);

  const handleCreatePin = (e) => {
    e.preventDefault();
    setError('');

    if (!allRequirementsMet) {
      setError('Please meet all PIN requirements');
      return;
    }

    setStep('confirm');
  };

  const handleConfirmPin = (e) => {
    e.preventDefault();
    setError('');

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setStep('success');
    
    // Simulate PIN storage
    setTimeout(() => {
      onComplete({ 
        pin: pin, 
        email: userEmail,
        pinCreated: true 
      });
    }, 1500);
  };

  const renderCreateStep = () => (
    <div className="flex flex-col items-center space-y-6 w-full">
      <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
        <Lock className="w-8 h-8 text-blue-600" />
      </div>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Your PIN</h2>
        <p className="text-gray-600">Your PIN secures your Onairos account</p>
      </div>

      <form onSubmit={handleCreatePin} className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
            Create PIN
          </label>
          <input
            type="password"
            id="pin"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter your PIN"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">PIN Requirements:</p>
          {Object.entries(pinRequirements).map(([req, met]) => (
            <div key={req} className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                met ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {met && <Check size={12} className="text-white" />}
              </div>
              <span className={`text-sm ${met ? 'text-green-600' : 'text-gray-600'}`}>
                {req === 'length' ? 'At least 6 characters' :
                 req === 'number' ? 'One number' :
                 req === 'uppercase' ? 'One uppercase letter' : 
                 'One lowercase letter'}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center text-red-600 text-sm">
            <AlertCircle size={16} className="mr-1" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!allRequirementsMet}
          className={`w-full py-3 px-4 rounded-lg font-semibold ${
            allRequirementsMet
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </form>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="flex flex-col items-center space-y-6 w-full">
      <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full">
        <Lock className="w-8 h-8 text-orange-600" />
      </div>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirm Your PIN</h2>
        <p className="text-gray-600">Enter your PIN again to confirm</p>
      </div>

      <form onSubmit={handleConfirmPin} className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm PIN
          </label>
          <input
            type="password"
            id="confirmPin"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            placeholder="Re-enter your PIN"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>

        {error && (
          <div className="flex items-center text-red-600 text-sm">
            <AlertCircle size={16} className="mr-1" />
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => {
              setStep('create');
              setConfirmPin('');
              setError('');
            }}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Create PIN
          </button>
        </div>
      </form>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="flex flex-col items-center space-y-6 w-full">
      <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">PIN Created!</h2>
        <p className="text-gray-600">Your account is now secure</p>
      </div>

      <div className="w-8 h-8">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center space-y-6 p-6 w-full">
      {step === 'create' && renderCreateStep()}
      {step === 'confirm' && renderConfirmStep()}
      {step === 'success' && renderSuccessStep()}
    </div>
  );
} 
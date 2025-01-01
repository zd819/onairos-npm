import { useState } from 'react';
import { Othent, AppInfo } from "@othent/kms";
import getPin from '../getPin';
// Dynamic import for crypto-js's sha256
const loadSha256 = async () => {
    const module = await import(/* webpackChunkName: "sha256" */ 'crypto-js/sha256');
    return module.default;
  };

export default function OthentButton({ onSuccess, onLoginSuccess}) {
  const [loading, setLoading] = useState(false);

  const handleOthentLogin = async () => {
    setLoading(true);
    try {
      const appInfo = {
        name: "Onairos",
        version: "1.0.0",
        env: "production",
      };
      
      const othent = new Othent({ appInfo, throwErrors: false });
      const userDetails = await othent.connect();

      if (!userDetails) {
        throw new Error('Othent connection failed');
      }

      // Get hashed sub and pin
      const sha256 = await loadSha256();
      const hashedOthentSub = sha256(userDetails.sub).toString();
      const encryptedPin = (await getPin(hashedOthentSub)).pin;
      onLoginSuccess(await getPin(hashedOthentSub)).username;
      


      // Call onSuccess with Othent details
      await onSuccess({
        type: 'othent',
        encryptedPin: encryptedPin,
        hashedOthentSub:hashedOthentSub,
        userDetails
      });

    } catch (error) {
      console.error('Othent login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleOthentLogin}
        disabled={loading}
        className="w-12 h-12 rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-center bg-white"
      >
        <img
          src="https://imagepng.org/google-icone-icon/google-icon/" // Replace with actual Othent icon
          alt="Othent"
          className="w-6 h-6"
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-full">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </button>
      <span className="text-xs mt-2 text-gray-600">Google</span>
    </div>
  );
} 
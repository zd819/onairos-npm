import { useState, useEffect } from 'react';
import OnairosAppButton from './OnairosAppButton.jsx';
 // import GoogleButton from './GoogleButton';
import TestTelegramButton from './TestTelegramButton.js';

export default function AuthButtons({ 
  onLoginSuccess, 
  setOthent,
  setHashedOthentSub,
  setEncryptedPin
}) {
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

  useEffect(() => {
    checkSavedCredentials();
  }, []);

  const checkSavedCredentials = async () => {
    const credentials = localStorage.getItem('onairosCredentials');
    setHasSavedCredentials(!!credentials);
  };

  const handleOthentSuccess = async (othentData) => {
    // Set Othent-specific state
    setOthent(true);
    setHashedOthentSub(othentData.hashedOthentSub);
    setEncryptedPin(othentData.encryptedPin);
    
    // Call general login success handler
    await onLoginSuccess(othentData.userDetails);
  };

  const othentLogin = async (data) =>{
    onLoginSuccess(data,true);
  }

  return (
    <div className="flex flex-row justify-center items-center space-x-4">
      {/* <OthentButton onSuccess={handleOthentSuccess} onLoginSuccess={othentLogin}/> */}
      {/* <GoogleButton onLoginSuccess={othentLogin}/> */}
      <TestTelegramButton />
      <OnairosAppButton 
        hasSavedCredentials={hasSavedCredentials}
        onSuccess={onLoginSuccess}
      />
    </div>
  );
} 
export const authenticateWithBiometrics = async () => {
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn not supported');
  }

  try {
    const supported = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!supported) {
      throw new Error('Biometric authentication not available');
    }

    // Trigger FaceID/TouchID
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        rpId: window.location.hostname,
        userVerification: 'required',
      }
    });

    return !!credential;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
}; 
import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import OnairosButton from './onairosButton.jsx';

// Get Google Client ID from environment or props
const getGoogleClientId = (props) => {
  return props.googleClientId || 
         (typeof window !== 'undefined' && window.onairosGoogleClientId) ||
         (typeof window !== 'undefined' && window.REACT_APP_GOOGLE_CLIENT_ID) ||
         process.env.REACT_APP_GOOGLE_CLIENT_ID ||
         '1030678346906-4npem7vckp0e56p17c81sv2pee2hhule.apps.googleusercontent.com'; // Default fallback
};

// Main Onairos component
export function Onairos(props) {
  const googleClientId = getGoogleClientId(props);

  // Helpful warning: origin_mismatch is almost always due to missing origins for the chosen clientId.
  // We warn when the SDK is using the baked-in fallback clientId so integrators know to override it.
  if (typeof window !== 'undefined') {
    const isDefault = googleClientId === '1030678346906-4npem7vckp0e56p17c81sv2pee2hhule.apps.googleusercontent.com';
    if (isDefault) {
      const origin = window.location?.origin;
      // eslint-disable-next-line no-console
      console.warn(
        `[onairos] Using default Google OAuth clientId. If you see Google error "origin_mismatch", ` +
        `you must either (a) pass googleClientId to <Onairos />, or (b) set window.onairosGoogleClientId, ` +
        `and add this origin in Google Cloud Console: ${origin}`
      );
    }
  }
  
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <OnairosButton {...props} />
    </GoogleOAuthProvider>
  );
}

// Export both the main component and individual components
export { OnairosButton };
export default Onairos;

// Export overlay handler functions for programmatic access
export { 
  openOnairosOverlay, 
  useOnairosOverlay, 
  getOnairosData 
} from './utils/overlayHandler.js';

// Export response formatting utilities
export { 
  formatOnairosResponse, 
  formatPersonalityScores,
  getPersonalityTypes,
  getTraitCategories,
  PERSONALITY_TYPES,
  TRAIT_CATEGORIES
} from './utils/responseFormatter.js';

// Initialize SDK functionality with standardized API key validation
export { 
  initializeApiKey,
  isSDKInitialized,
  getSDKState,
  getApiKey,
  getSDKConfig,
  resetSDK
} from './utils/sdkInitialization.js';

// Export API key validation utilities
export {
  validateApiKey,
  ApiKeyType,
  ErrorCodes
} from './utils/apiKeyValidation.js';

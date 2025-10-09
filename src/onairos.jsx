import React from 'react';
import OnairosButton from './onairosButton.jsx';

// Main Onairos component
export function Onairos(props) {
  return (
    <>
      <OnairosButton {...props} />
    </>
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

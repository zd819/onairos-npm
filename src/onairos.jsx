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

// Initialize SDK functionality (if needed)
export const initializeApiKey = async (config) => {
  // SDK initialization logic would go here
  console.log('🔧 SDK initialized with config:', config);
  return Promise.resolve();
};

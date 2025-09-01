/**
 * Response formatter utility for Onairos SDK
 * Converts array-based responses to dictionary format for better developer experience
 */

// Standard 16 personality types in order that the API returns them
export const PERSONALITY_TYPES = [
  'Analyst',
  'Diplomat', 
  'Sentinel',
  'Explorer',
  'Architect',
  'Logician',
  'Commander',
  'Debater',
  'Advocate',
  'Mediator',
  'Protagonist',
  'Campaigner',
  'Logistician',
  'Defender',
  'Executive',
  'Consul'
];

// Standard trait categories that might be returned
export const TRAIT_CATEGORIES = [
  'Openness',
  'Conscientiousness',
  'Extraversion',
  'Agreeableness',
  'Neuroticism'
];

/**
 * Formats API response to include both array and dictionary formats
 * @param {Object} apiResponse - Raw API response from Onairos
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeDictionary - Whether to include dictionary format (default: true)
 * @param {boolean} options.includeArray - Whether to include original array format (default: true)
 * @returns {Object} Formatted response with both formats
 */
export function formatOnairosResponse(apiResponse, options = {}) {
  const { includeDictionary = true, includeArray = true } = options;
  
  if (!apiResponse) {
    return apiResponse;
  }

  const formatted = { ...apiResponse };

  // Handle personality scores if present
  if (apiResponse.InferenceResult?.traits || apiResponse.traits || apiResponse.scores) {
    const scores = apiResponse.InferenceResult?.traits || apiResponse.traits || apiResponse.scores;
    
    if (Array.isArray(scores) && scores.length >= 16) {
      if (includeDictionary) {
        // Create personality dictionary
        const personalityDict = {};
        PERSONALITY_TYPES.forEach((type, index) => {
          personalityDict[type] = scores[index];
        });
        
        // Add to formatted response
        if (formatted.InferenceResult) {
          formatted.InferenceResult.personalityDict = personalityDict;
        } else {
          formatted.personalityDict = personalityDict;
        }
      }
      
      if (!includeArray) {
        // Remove array format if not requested
        if (formatted.InferenceResult?.traits) {
          delete formatted.InferenceResult.traits;
        }
        if (formatted.traits) {
          delete formatted.traits;
        }
        if (formatted.scores) {
          delete formatted.scores;
        }
      }
    }
  }

  // Handle trait data if present (for preferences/traits)
  if (apiResponse.traitResult || apiResponse.traits) {
    const traits = apiResponse.traitResult || apiResponse.traits;
    
    if (Array.isArray(traits) && includeDictionary) {
      const traitDict = {};
      TRAIT_CATEGORIES.forEach((category, index) => {
        if (traits[index] !== undefined) {
          traitDict[category] = traits[index];
        }
      });
      
      formatted.traitDict = traitDict;
    }
  }

  return formatted;
}

/**
 * Legacy formatter for backward compatibility
 * Converts scores array to personality dictionary only
 * @param {Array} scores - Array of personality scores
 * @returns {Object} Dictionary with personality type names as keys
 */
export function formatPersonalityScores(scores) {
  if (!Array.isArray(scores) || scores.length < 16) {
    console.warn('Invalid scores array provided to formatPersonalityScores');
    return {};
  }

  const personalityDict = {};
  PERSONALITY_TYPES.forEach((type, index) => {
    personalityDict[type] = scores[index];
  });
  
  return personalityDict;
}

/**
 * Get personality type names in order
 * @returns {Array} Array of personality type names
 */
export function getPersonalityTypes() {
  return [...PERSONALITY_TYPES];
}

/**
 * Get trait category names in order  
 * @returns {Array} Array of trait category names
 */
export function getTraitCategories() {
  return [...TRAIT_CATEGORIES];
} 
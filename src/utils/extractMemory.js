/**
 * Extract meaningful memory data from user interactions
 * This function determines what information should be stored in the vector database
 * for future RAG retrieval, focusing on preferences, insights, and key information
 * rather than raw conversation data.
 */

/**
 * Extract memory data from a query-response interaction
 * @param {Object} params - Extraction parameters
 * @param {string} params.query - User query
 * @param {string} params.response - Assistant response
 * @returns {string|null} Extracted memory data or null if nothing meaningful
 */
export function extractMemory({ query, response }) {
  if (!query || !response) {
    return null;
  }

  const queryLower = query.toLowerCase();
  const responseLower = response.toLowerCase();

  // Extract user preferences
  const preferenceMemory = extractPreferences(queryLower, response);
  if (preferenceMemory) {
    return preferenceMemory;
  }

  // Extract personal information and interests
  const personalMemory = extractPersonalInfo(queryLower, response);
  if (personalMemory) {
    return personalMemory;
  }

  // Extract goals and objectives
  const goalMemory = extractGoals(queryLower, response);
  if (goalMemory) {
    return goalMemory;
  }

  // Extract skills and expertise
  const skillMemory = extractSkills(queryLower, response);
  if (skillMemory) {
    return skillMemory;
  }

  // Extract context and background
  const contextMemory = extractContext(queryLower, response);
  if (contextMemory) {
    return contextMemory;
  }

  // Extract decisions and choices
  const decisionMemory = extractDecisions(queryLower, response);
  if (decisionMemory) {
    return decisionMemory;
  }

  return null; // No meaningful memory to extract
}

/**
 * Extract user preferences from interactions
 */
function extractPreferences(query, response) {
  const preferenceKeywords = [
    'favorite', 'prefer', 'like', 'love', 'enjoy', 'hate', 'dislike',
    'best', 'worst', 'choose', 'pick', 'select', 'want', 'need'
  ];

  const hasPreferenceKeyword = preferenceKeywords.some(keyword => 
    query.includes(keyword)
  );

  if (hasPreferenceKeyword) {
    // Extract specific preferences mentioned in the response
    if (query.includes('favorite') && response.length > 10) {
      return `User's favorite: ${response.substring(0, 200)}`;
    }
    
    if (query.includes('prefer') && response.length > 10) {
      return `User prefers: ${response.substring(0, 200)}`;
    }
    
    if ((query.includes('like') || query.includes('love')) && response.length > 10) {
      return `User likes: ${response.substring(0, 200)}`;
    }
    
    if ((query.includes('dislike') || query.includes('hate')) && response.length > 10) {
      return `User dislikes: ${response.substring(0, 200)}`;
    }
  }

  return null;
}

/**
 * Extract personal information and interests
 */
function extractPersonalInfo(query, response) {
  const personalKeywords = [
    'i am', 'i work', 'i study', 'my job', 'my role', 'my background',
    'i live', 'my experience', 'my hobby', 'my interest', 'i enjoy',
    'my name', 'my age', 'my family', 'my education'
  ];

  const hasPersonalKeyword = personalKeywords.some(keyword => 
    query.includes(keyword)
  );

  if (hasPersonalKeyword && response.length > 20) {
    if (query.includes('i am') || query.includes('i work') || query.includes('my job')) {
      return `User's profession/role: ${response.substring(0, 150)}`;
    }
    
    if (query.includes('i live') || query.includes('my location')) {
      return `User's location: ${response.substring(0, 100)}`;
    }
    
    if (query.includes('my hobby') || query.includes('my interest') || query.includes('i enjoy')) {
      return `User's interests: ${response.substring(0, 150)}`;
    }
    
    if (query.includes('my background') || query.includes('my experience')) {
      return `User's background: ${response.substring(0, 200)}`;
    }
  }

  return null;
}

/**
 * Extract goals and objectives
 */
function extractGoals(query, response) {
  const goalKeywords = [
    'my goal', 'i want to', 'i plan to', 'i hope to', 'i aim to',
    'my objective', 'my target', 'i intend to', 'looking to', 'trying to'
  ];

  const hasGoalKeyword = goalKeywords.some(keyword => 
    query.includes(keyword)
  );

  if (hasGoalKeyword && response.length > 20) {
    return `User's goal: ${response.substring(0, 200)}`;
  }

  return null;
}

/**
 * Extract skills and expertise
 */
function extractSkills(query, response) {
  const skillKeywords = [
    'i know', 'i can', 'my skill', 'i am good at', 'i am expert',
    'my expertise', 'i specialize', 'my strength', 'i am proficient'
  ];

  const hasSkillKeyword = skillKeywords.some(keyword => 
    query.includes(keyword)
  );

  if (hasSkillKeyword && response.length > 20) {
    return `User's skills: ${response.substring(0, 150)}`;
  }

  return null;
}

/**
 * Extract context and background information
 */
function extractContext(query, response) {
  const contextKeywords = [
    'currently', 'right now', 'at the moment', 'these days',
    'recently', 'lately', 'this week', 'this month', 'this year'
  ];

  const hasContextKeyword = contextKeywords.some(keyword => 
    query.includes(keyword)
  );

  if (hasContextKeyword && response.length > 30) {
    return `Current context: ${response.substring(0, 180)}`;
  }

  return null;
}

/**
 * Extract important decisions and choices
 */
function extractDecisions(query, response) {
  const decisionKeywords = [
    'i decided', 'i chose', 'i selected', 'i picked', 'my decision',
    'i will', 'i am going to', 'i have decided', 'my choice'
  ];

  const hasDecisionKeyword = decisionKeywords.some(keyword => 
    query.includes(keyword)
  );

  if (hasDecisionKeyword && response.length > 20) {
    return `User's decision: ${response.substring(0, 180)}`;
  }

  return null;
}

/**
 * Extract memory based on response patterns
 * @param {string} query - User query
 * @param {string} response - Assistant response
 * @returns {string|null} Extracted memory or null
 */
export function extractMemoryFromResponse(query, response) {
  // Look for factual information in responses
  if (response.includes('you mentioned') || response.includes('you said')) {
    return `Context reference: ${response.substring(0, 200)}`;
  }

  // Extract recommendations given to the user
  if (response.includes('I recommend') || response.includes('I suggest')) {
    return `Recommendation given: ${response.substring(0, 200)}`;
  }

  // Extract explanations of user's situation
  if (response.includes('based on your') || response.includes('given your')) {
    return `User situation: ${response.substring(0, 200)}`;
  }

  return null;
}

/**
 * Determine if an interaction contains meaningful memory
 * @param {string} query - User query
 * @param {string} response - Assistant response
 * @returns {boolean} True if interaction contains meaningful memory
 */
export function hasMeaningfulMemory(query, response) {
  if (!query || !response || query.length < 10 || response.length < 20) {
    return false;
  }

  // Skip generic greetings and simple questions
  const genericPatterns = [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'how are you', 'what is', 'what are', 'how do', 'can you', 'please help'
  ];

  const queryLower = query.toLowerCase();
  const isGeneric = genericPatterns.some(pattern => 
    queryLower.includes(pattern) && queryLower.length < 50
  );

  return !isGeneric;
}

/**
 * Clean and format memory data
 * @param {string} memoryData - Raw memory data
 * @returns {string} Cleaned memory data
 */
export function cleanMemoryData(memoryData) {
  if (!memoryData) {
    return '';
  }

  return memoryData
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
    .substring(0, 500); // Limit length
} 
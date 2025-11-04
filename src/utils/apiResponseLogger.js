/**
 * API Response Logger for Onairos SDK
 * Provides detailed console logging with explanatory labels for API responses
 * 
 * Response Format from Backend:
 * {
 *   InferenceResult: {
 *     output: [[0.95], [0.89], ...],  // Content preference scores (0-1 scale)
 *     traits: {
 *       personality_traits: {
 *         positive_traits: {...},      // Strengths (0-100 scale)
 *         traits_to_improve: {...}     // Growth areas (0-100 scale)
 *       }
 *     }
 *   },
 *   persona: {...},                    // Optional: test persona info
 *   inference_metadata: {...},         // Optional: context about inference
 *   llmData: {...},                    // Optional: LLM conversation data
 *   available_personas: [...]          // Optional: persona list
 * }
 */

/**
 * Format a score as a visual bar
 * @param {number} score - Score between 0 and 1
 * @param {number} maxBars - Maximum number of bars to display
 * @returns {string} Visual bar representation
 */
function formatScoreBar(score, maxBars = 10) {
  const filledBars = Math.round(score * maxBars);
  const emptyBars = maxBars - filledBars;
  return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
}

/**
 * Format a percentage score as a visual bar
 * @param {number} score - Score between 0 and 100
 * @param {number} maxBars - Maximum number of bars to display
 * @returns {string} Visual bar representation
 */
function formatPercentageBar(score, maxBars = 10) {
  const filledBars = Math.round((score / 100) * maxBars);
  const emptyBars = maxBars - filledBars;
  return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
}

/**
 * Get emoji indicator for score level
 * @param {number} score - Score between 0 and 1
 * @returns {string} Emoji indicator
 */
function getScoreEmoji(score) {
  if (score >= 0.8) return '🔥';
  if (score >= 0.6) return '⭐';
  if (score >= 0.4) return '👍';
  if (score >= 0.2) return '📊';
  return '📉';
}

/**
 * Get emoji indicator for percentage score
 * @param {number} score - Score between 0 and 100
 * @returns {string} Emoji indicator
 */
function getPercentageEmoji(score) {
  if (score >= 80) return '🔥';
  if (score >= 60) return '⭐';
  if (score >= 40) return '👍';
  if (score >= 20) return '📊';
  return '📉';
}

/**
 * Log content preference scores with detailed explanations
 * @param {Array} output - Array of content preference scores
 */
function logContentPreferences(output) {
  if (!output || !Array.isArray(output)) {
    console.log('   No content preference data available');
    return;
  }

  console.log('   📊 Content Preference Scores (0.0 = Not Interested, 1.0 = Highly Interested)');
  console.log('   ─────────────────────────────────────────────────────────────────────');
  
  // Category names for the 16 content types
  const categories = [
    'Technology & Innovation',
    'Entertainment & Media', 
    'Health & Wellness',
    'Business & Finance',
    'Education & Learning',
    'Travel & Adventure',
    'Food & Cooking',
    'Sports & Fitness',
    'Art & Creativity',
    'Science & Research',
    'Fashion & Style',
    'Gaming & Esports',
    'Music & Audio',
    'News & Politics',
    'Home & Garden',
    'Automotive & Transport'
  ];

  const formattedScores = output.map((scoreArray, index) => {
    const score = Array.isArray(scoreArray) ? scoreArray[0] : scoreArray;
    const categoryName = categories[index] || `Category ${index + 1}`;
    return {
      Category: categoryName,
      Score: score.toFixed(3),
      'Visual': `${formatScoreBar(score)} ${getScoreEmoji(score)}`,
      'Interest Level': score >= 0.8 ? 'Very High' : 
                       score >= 0.6 ? 'High' : 
                       score >= 0.4 ? 'Moderate' : 
                       score >= 0.2 ? 'Low' : 'Very Low'
    };
  });

  console.table(formattedScores);
  
  // Summary statistics
  const scores = output.map(s => Array.isArray(s) ? s[0] : s);
  
  if (scores.length > 0) {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const topCategoryIndex = scores.indexOf(maxScore);
    const topCategory = topCategoryIndex >= 0 && topCategoryIndex < categories.length 
      ? categories[topCategoryIndex] 
      : 'Unknown';
    
    console.log(`   📈 Summary: Avg ${avgScore.toFixed(3)} | Max ${maxScore.toFixed(3)} (${topCategory}) | Min ${minScore.toFixed(3)}`);
  }
}

/**
 * Log personality traits with detailed explanations
 * @param {Object} traits - Personality traits object
 */
function logPersonalityTraits(traits) {
  if (!traits || !traits.personality_traits) {
    console.log('   No personality trait data available');
    return;
  }

  const { positive_traits, traits_to_improve } = traits.personality_traits;

  // Log positive traits (strengths)
  if (positive_traits && Object.keys(positive_traits).length > 0) {
    console.log('   ✨ Positive Traits (Strengths) - Scale: 0-100');
    console.log('   ─────────────────────────────────────────────────────────────────────');
    
    const positiveData = Object.entries(positive_traits).map(([trait, score]) => ({
      Trait: trait.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      Score: score.toFixed(1),
      'Visual': `${formatPercentageBar(score)} ${getPercentageEmoji(score)}`,
      'Level': score >= 80 ? 'Exceptional' : 
               score >= 60 ? 'Strong' : 
               score >= 40 ? 'Moderate' : 
               score >= 20 ? 'Developing' : 'Emerging'
    }));
    
    console.table(positiveData);
  }

  // Log traits to improve (growth areas)
  if (traits_to_improve && Object.keys(traits_to_improve).length > 0) {
    console.log('   🎯 Traits to Improve (Growth Areas) - Scale: 0-100');
    console.log('   ─────────────────────────────────────────────────────────────────────');
    
    const improvementData = Object.entries(traits_to_improve).map(([trait, score]) => ({
      Trait: trait.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      Score: score.toFixed(1),
      'Visual': `${formatPercentageBar(score)} ${getPercentageEmoji(score)}`,
      'Priority': score >= 80 ? 'High Priority' : 
                  score >= 60 ? 'Medium Priority' : 
                  score >= 40 ? 'Low Priority' : 
                  score >= 20 ? 'Optional' : 'Minimal'
    }));
    
    console.table(improvementData);
  }
}

/**
 * Log persona information
 * @param {Object} persona - Persona object
 */
function logPersonaInfo(persona) {
  if (!persona) return;

  console.log('   👤 Applied Persona');
  console.log('   ─────────────────────────────────────────────────────────────────────');
  console.log(`   Name: ${persona.name || 'Unknown'}`);
  console.log(`   ID: ${persona.id || 'N/A'}`);
  if (persona.description) {
    console.log(`   Description: ${persona.description}`);
  }
}

/**
 * Log inference metadata
 * @param {Object} metadata - Inference metadata object
 */
function logInferenceMetadata(metadata) {
  if (!metadata) return;

  console.log('   ℹ️  Inference Metadata');
  console.log('   ─────────────────────────────────────────────────────────────────────');
  if (metadata.size_used) console.log(`   Model Size: ${metadata.size_used}`);
  if (metadata.total_outputs) console.log(`   Total Outputs: ${metadata.total_outputs}`);
  if (metadata.persona_applied) console.log(`   Persona Applied: ${metadata.persona_applied}`);
  if (metadata.inference_categories) {
    console.log(`   Categories: ${metadata.inference_categories.join(', ')}`);
  }
}

/**
 * Log LLM conversation data
 * @param {Object} llmData - LLM data object
 */
function logLLMData(llmData) {
  if (!llmData || !llmData.hasLlmData) {
    console.log('   No LLM conversation data included');
    return;
  }

  console.log('   💬 LLM Conversation Data');
  console.log('   ─────────────────────────────────────────────────────────────────────');
  console.log(`   Total Interactions: ${llmData.totalInteractions || 0}`);
  
  if (llmData.platforms) {
    console.log('   Platforms:');
    Object.entries(llmData.platforms).forEach(([platform, count]) => {
      console.log(`      ${platform}: ${count} interactions`);
    });
  }
  
  if (llmData.recentInteractions && llmData.recentInteractions.length > 0) {
    console.log(`   Recent Interactions: ${llmData.recentInteractions.length} available`);
  }
}

/**
 * Main logging function for Onairos API responses
 * Logs the complete API response with detailed explanations
 * 
 * @param {Object} response - The complete API response object
 * @param {string} endpoint - The endpoint that was called (for context)
 * @param {Object} options - Logging options
 * @param {boolean} options.detailed - Whether to show detailed logs (default: true)
 * @param {boolean} options.showRawData - Whether to show raw response data (default: false)
 */
export function logOnairosResponse(response, endpoint = 'unknown', options = {}) {
  const { detailed = true, showRawData = false } = options;

  console.group('🎯 Onairos API Response');
  console.log(`📡 Endpoint: ${endpoint}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════════════════');

  if (!response) {
    console.error('❌ No response data received');
    console.groupEnd();
    return;
  }

  // Log InferenceResult data
  if (response.InferenceResult) {
    console.group('📊 Inference Result');
    
    // Log content preferences (output scores)
    if (response.InferenceResult.output) {
      console.group('🎯 Content Preferences');
      logContentPreferences(response.InferenceResult.output);
      console.groupEnd();
    }
    
    // Log personality traits
    if (response.InferenceResult.traits) {
      console.group('🧠 Personality Analysis');
      logPersonalityTraits(response.InferenceResult.traits);
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  // Log persona information (test mode)
  if (response.persona) {
    console.group('👤 Persona Information');
    logPersonaInfo(response.persona);
    console.groupEnd();
  }

  // Log inference metadata
  if (response.inference_metadata) {
    console.group('ℹ️  Metadata');
    logInferenceMetadata(response.inference_metadata);
    console.groupEnd();
  }

  // Log LLM data if included
  if (response.llmData) {
    console.group('💬 LLM Data');
    logLLMData(response.llmData);
    console.groupEnd();
  }

  // Log available personas if present
  if (response.available_personas && Array.isArray(response.available_personas)) {
    console.group('👥 Available Personas');
    console.log(`   Total: ${response.available_personas.length} personas available`);
    console.table(response.available_personas.map(p => ({
      ID: p.id,
      Name: p.name,
      Description: p.description?.substring(0, 50) + '...'
    })));
    console.groupEnd();
  }

  // Show raw data if requested
  if (showRawData) {
    console.group('📦 Raw Response Data');
    console.log(response);
    console.groupEnd();
  }

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('✅ Response logging complete');
  console.groupEnd();
}

/**
 * Log a simplified version of the response (for production)
 * @param {Object} response - The API response
 * @param {string} endpoint - The endpoint called
 */
export function logOnairosResponseSimple(response, endpoint = 'unknown') {
  console.log('🎯 Onairos API Response:', {
    endpoint,
    timestamp: new Date().toISOString(),
    hasInferenceResult: !!response?.InferenceResult,
    hasContentPreferences: !!response?.InferenceResult?.output,
    hasPersonalityTraits: !!response?.InferenceResult?.traits,
    hasLLMData: !!response?.llmData?.hasLlmData,
    contentCategoriesCount: response?.InferenceResult?.output?.length || 0,
    personalityTraitsCount: response?.InferenceResult?.traits?.personality_traits ? 
      Object.keys(response.InferenceResult.traits.personality_traits.positive_traits || {}).length +
      Object.keys(response.InferenceResult.traits.personality_traits.traits_to_improve || {}).length : 0
  });
}

export default {
  logOnairosResponse,
  logOnairosResponseSimple
};



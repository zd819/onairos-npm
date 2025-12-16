/**
 * Onairos API Response Logger
 * 
 * Provides detailed, formatted logging for Onairos API responses
 * with visual indicators, explanatory labels, and formatted tables.
 * 
 * Usage:
 *   import { logOnairosResponse } from '../utils/apiResponseLogger';
 *   logOnairosResponse(apiData, endpointUrl, { detailed: true, showRawData: false });
 */

// Content category names for the 16 output scores
const CONTENT_CATEGORIES = [
  'Technology & Innovation',
  'Entertainment & Media',
  'Health & Wellness',
  'Education & Learning',
  'Finance & Business',
  'Travel & Adventure',
  'Food & Cooking',
  'Sports & Fitness',
  'Arts & Culture',
  'Science & Nature',
  'Fashion & Style',
  'Gaming & Esports',
  'Social & Relationships',
  'Politics & News',
  'DIY & Crafts',
  'Music & Audio'
];

/**
 * Get emoji and level label based on score
 * @param {number} score - Score value (0-1 for content prefs, 0-100 for traits)
 * @param {boolean} isPercentage - Whether score is 0-100 scale
 * @returns {{emoji: string, level: string}}
 */
function getScoreIndicator(score, isPercentage = false) {
  const normalizedScore = isPercentage ? score / 100 : score;
  
  if (normalizedScore >= 0.8) return { emoji: '🔥', level: isPercentage ? 'Exceptional' : 'Very High' };
  if (normalizedScore >= 0.6) return { emoji: '⭐', level: isPercentage ? 'Strong' : 'High' };
  if (normalizedScore >= 0.4) return { emoji: '👍', level: isPercentage ? 'Moderate' : 'Moderate' };
  if (normalizedScore >= 0.2) return { emoji: '📊', level: isPercentage ? 'Developing' : 'Low' };
  return { emoji: '📉', level: isPercentage ? 'Low Priority' : 'Very Low' };
}

/**
 * Create visual progress bar
 * @param {number} score - Score value (0-1 for content prefs, 0-100 for traits)
 * @param {boolean} isPercentage - Whether score is 0-100 scale
 * @returns {string} Visual bar representation
 */
function createProgressBar(score, isPercentage = false) {
  const normalizedScore = isPercentage ? score / 100 : score;
  // Clamp score between 0 and 1 safely
  const clampedScore = Math.max(0, Math.min(1, normalizedScore));
  const filledBlocks = Math.round(clampedScore * 10);
  const emptyBlocks = 10 - filledBlocks;
  return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
}

/**
 * Log content preference scores with visual formatting
 * @param {Array<Array<number>>} output - 2D array of scores [[0.95], [0.89], ...]
 */
function logContentPreferences(output) {
  if (!output || !Array.isArray(output) || output.length === 0) {
    console.log('   ⚠️ No content preferences found');
    return;
  }

  console.log('   🎯 Content Preferences');
  console.log('      📊 Content Preference Scores (0.0 = Not Interested, 1.0 = Highly Interested)');
  console.log('      ─────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log('      Category                    Score    Visual              Interest Level');
  console.log('      ──────────────────────────────────────────────────────────────────────');

  const scores = output.map((item, index) => {
    const score = Array.isArray(item) ? item[0] : item;
    const category = CONTENT_CATEGORIES[index] || `Category ${index + 1}`;
    const indicator = getScoreIndicator(score);
    const bar = createProgressBar(score);

    console.log(`      ${category.padEnd(28)} ${score.toFixed(3)}    ${bar} ${indicator.emoji}       ${indicator.level}`);

    return { category, score };
  });

  // Summary statistics
  const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  const max = Math.max(...scores.map(s => s.score));
  const min = Math.min(...scores.map(s => s.score));
  const maxCategory = scores.find(s => s.score === max)?.category;

  console.log('');
  console.log(`      📈 Summary: Avg ${avg.toFixed(3)} | Max ${max.toFixed(3)} (${maxCategory}) | Min ${min.toFixed(3)}`);
}

/**
 * Log personality traits with visual formatting
 * @param {Object} personalityTraits - Personality traits object with positive_traits and traits_to_improve
 */
function logPersonalityTraits(personalityTraits) {
  if (!personalityTraits || typeof personalityTraits !== 'object') {
    console.log('   ⚠️ No personality traits found');
    return;
  }

  console.log('   🧠 Personality Analysis');

  // Positive traits (strengths)
  if (personalityTraits.positive_traits) {
    console.log('      ✨ Positive Traits (Strengths) - Scale: 0-100');
    console.log('      ─────────────────────────────────────────────────────────────────────');
    console.log('');
    console.log('      Trait                  Score    Visual              Level');
    console.log('      ──────────────────────────────────────────────────────────────────────');

    Object.entries(personalityTraits.positive_traits).forEach(([trait, score]) => {
      const indicator = getScoreIndicator(score, true);
      const bar = createProgressBar(score, true);
      const traitName = trait.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      console.log(`      ${traitName.padEnd(22)} ${score.toFixed(1).padStart(5)}    ${bar} ${indicator.emoji}       ${indicator.level}`);
    });

    console.log('');
  }

  // Traits to improve (growth areas)
  if (personalityTraits.traits_to_improve) {
    console.log('      🎯 Traits to Improve (Growth Areas) - Scale: 0-100');
    console.log('      ─────────────────────────────────────────────────────────────────────');
    console.log('');
    console.log('      Trait                  Score    Visual              Priority');
    console.log('      ──────────────────────────────────────────────────────────────────────');

    Object.entries(personalityTraits.traits_to_improve).forEach(([trait, score]) => {
      const indicator = getScoreIndicator(score, true);
      const bar = createProgressBar(score, true);
      const traitName = trait.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const priority = score < 40 ? 'Low Priority' : score < 60 ? 'Medium Priority' : 'High Priority';

      console.log(`      ${traitName.padEnd(22)} ${score.toFixed(1).padStart(5)}    ${bar} ${indicator.emoji}       ${priority}`);
    });

    console.log('');
  }
}

/**
 * Log Onairos API response with detailed formatting
 * @param {Object} response - API response object
 * @param {string} endpoint - API endpoint URL
 * @param {Object} options - Logging options { detailed: boolean, showRawData: boolean }
 */
export function logOnairosResponse(response, endpoint = 'Unknown', options = {}) {
  const { detailed = true, showRawData = false } = options;

  console.log('\n🎯 Onairos API Response');
  console.log(`  📡 Endpoint: ${endpoint}`);
  console.log(`  ⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('  ═══════════════════════════════════════════════════════════════════════');
  console.log('');

  if (!response) {
    console.log('  ⚠️ Empty response');
    return;
  }

  // Log inference results in a proper table format using console.table for better readability
  if (response.InferenceResult) {
    console.group('  📊 Inference Result');

    // Content preferences
    if (response.InferenceResult.output && Array.isArray(response.InferenceResult.output) && response.InferenceResult.output.length > 0) {
      console.log('    🎯 Content Preferences (Scale: 0.0 - 1.0)');
      
      const contentTableData = response.InferenceResult.output.map((item, index) => {
        const score = Array.isArray(item) ? item[0] : item;
        const indicator = getScoreIndicator(score);
        return {
          Category: CONTENT_CATEGORIES[index] || `Category ${index + 1}`,
          Score: score.toFixed(3),
          Level: `${indicator.emoji} ${indicator.level}`
        };
      });
      
      console.table(contentTableData);
      
      // Summary statistics
      const scores = response.InferenceResult.output.map(item => Array.isArray(item) ? item[0] : item);
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const max = Math.max(...scores);
      const min = Math.min(...scores);
      const maxIndex = scores.indexOf(max);
      const maxCategory = CONTENT_CATEGORIES[maxIndex] || `Category ${maxIndex + 1}`;
      
      console.log(`    📈 Summary: Avg ${avg.toFixed(3)} | Max ${max.toFixed(3)} (${maxCategory}) | Min ${min.toFixed(3)}`);
      console.log('');
    } else {
        console.log('    ⚠️ No content preferences output found');
    }

    // Personality traits
    if (response.InferenceResult.traits?.personality_traits) {
      console.log('    🧠 Personality Analysis (Scale: 0 - 100)');
      
      const traits = response.InferenceResult.traits.personality_traits;
      const traitsTableData = [];

      // Add Positive Traits
      if (traits.positive_traits) {
        Object.entries(traits.positive_traits).forEach(([trait, score]) => {
          const indicator = getScoreIndicator(score, true);
          const traitName = trait.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          traitsTableData.push({
            Type: 'Strength ✨',
            Trait: traitName,
            Score: score.toFixed(1),
            Level: `${indicator.emoji} ${indicator.level}`
          });
        });
      }

      // Add Traits to Improve
      if (traits.traits_to_improve) {
        Object.entries(traits.traits_to_improve).forEach(([trait, score]) => {
          const indicator = getScoreIndicator(score, true);
          const traitName = trait.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          // For improvement areas, lower score often means higher priority to fix, but here we just show level
          // Adjust logic if "Level" column needs to say "Priority"
          const priority = score < 40 ? 'High Priority' : score < 60 ? 'Medium Priority' : 'Low Priority';
          
          traitsTableData.push({
            Type: 'Growth Area 🎯',
            Trait: traitName,
            Score: score.toFixed(1),
            Level: `${indicator.emoji} ${priority}`
          });
        });
      }

      if (traitsTableData.length > 0) {
        console.table(traitsTableData);
      } else {
        console.log('    ⚠️ No personality traits data found');
      }
      console.log('');
    }
    
    console.groupEnd();
    console.log('');
  }

  // Log persona information (if present)
  if (response.persona) {
    console.log('  🎭 Persona Information');
    console.log(`     ID: ${response.persona.id}`);
    console.log(`     Name: ${response.persona.name}`);
    if (response.persona.description) {
      console.log(`     Description: ${response.persona.description}`);
    }
    console.log('');
  }

  // Log inference metadata (if present)
  if (response.inference_metadata) {
    console.log('  ℹ️ Inference Metadata');
    console.log(`     Model Size: ${response.inference_metadata.size_used || 'N/A'}`);
    console.log(`     Total Outputs: ${response.inference_metadata.total_outputs || 'N/A'}`);
    if (response.inference_metadata.persona_applied) {
      console.log(`     Persona Applied: ${response.inference_metadata.persona_applied}`);
    }
    console.log('');
  }

  // Log LLM data summary (if present)
  if (response.llmData) {
    console.log('  💬 LLM Data');
    console.log(`     Has LLM Data: ${response.llmData.hasLlmData || false}`);
    console.log(`     Total Interactions: ${response.llmData.totalInteractions || 0}`);
    if (response.llmData.platforms) {
      const platforms = Object.keys(response.llmData.platforms).filter(k => response.llmData.platforms[k]);
      console.log(`     Platforms: ${platforms.join(', ') || 'None'}`);
    }
    console.log('');
  }

  // Show raw data if requested
  if (showRawData) {
    console.log('  📄 Raw Response Data:');
    console.log(JSON.stringify(response, null, 2));
    console.log('');
  }

  console.log('  ✅ Response logging complete');
  console.log('  ═══════════════════════════════════════════════════════════════════════\n');
}

/**
 * Simple one-line logging for API responses
 * @param {Object} response - API response object
 * @param {string} endpoint - API endpoint URL
 */
export function logOnairosResponseSimple(response, endpoint = 'Unknown') {
  const contentCount = response?.InferenceResult?.output?.length || 0;
  const hasTraits = !!(response?.InferenceResult?.traits?.personality_traits);
  const hasLlm = !!(response?.llmData?.hasLlmData);

  console.log(`🎯 Onairos Response [${endpoint}]: ${contentCount} content scores, Traits: ${hasTraits}, LLM: ${hasLlm}`);
}

export default { logOnairosResponse, logOnairosResponseSimple };

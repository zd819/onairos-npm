/**
 * Updated Onairos SDK Usage Examples
 * Demonstrates both the traditional button component and new programmatic overlay function
 * Also shows the new dictionary response format for personality data
 */

import { 
  Onairos, 
  OnairosButton, 
  openOnairosOverlay, 
  useOnairosOverlay,
  formatPersonalityScores,
  getPersonalityTypes,
  PERSONALITY_TYPES 
} from 'onairos';

// =============================================================================
// EXAMPLE 1: Traditional Button Component (with automatic dictionary formatting)
// =============================================================================

function MyAppWithButton() {
  const handleComplete = (result) => {
    console.log('Data request completed:', result);
    
    // The response now automatically includes personality data as both array and dictionary
    if (result.apiResponse?.InferenceResult) {
      const { traits, personalityDict } = result.apiResponse.InferenceResult;
      
      // Old way: accessing by index (still works)
      const analystScore = traits[0];
      const diplomatScore = traits[1];
      
      // New way: accessing by name (much easier!)
      const { Analyst, Diplomat, Sentinel, Explorer } = personalityDict;
      
      console.log('Personality scores:', {
        'Old way - Analyst': analystScore,
        'New way - Analyst': Analyst,
        'All personalities': personalityDict
      });
      
      // Use the scores in your app
      updateUserProfile(personalityDict);
    }
  };

  return (
    <OnairosButton
      webpageName="My Awesome App"
      requestData={['basic', 'personality', 'preferences']}
      onComplete={handleComplete}
      autoFetch={true}
      testMode={false}
      formatResponse={true} // Enable automatic dictionary formatting (default: true)
    />
  );
}

// =============================================================================
// EXAMPLE 2: Programmatic Overlay (NEW FEATURE!)
// =============================================================================

function MyAppWithProgrammaticOverlay() {
  const handleCustomButton = async () => {
    try {
      // Open Onairos overlay programmatically - no button component needed!
      const cleanup = await openOnairosOverlay({
        webpageName: "My Custom App",
        requestData: ['basic', 'personality'],
        autoFetch: true,
        testMode: false,
        formatResponse: true, // Get dictionary format automatically
        onComplete: (result) => {
          console.log('Overlay completed:', result);
          
          // Access personality data easily with dictionary format
          const personalityDict = result.apiResponse?.InferenceResult?.personalityDict;
          if (personalityDict) {
            // No need to remember array indices!
            const insights = {
              leadership: personalityDict.Commander + personalityDict.Executive,
              creativity: personalityDict.Campaigner + personalityDict.Mediator,
              analytical: personalityDict.Analyst + personalityDict.Logician,
              social: personalityDict.Protagonist + personalityDict.Consul
            };
            
            console.log('User insights:', insights);
            showPersonalityInsights(insights);
          }
        }
      });
      
      // Optional: cleanup can be called to close overlay programmatically
      // cleanup();
      
    } catch (error) {
      console.error('Failed to open Onairos overlay:', error);
    }
  };

  return (
    <div>
      <button onClick={handleCustomButton} className="my-custom-button">
        Get My Personality Insights
      </button>
    </div>
  );
}

// =============================================================================
// EXAMPLE 3: React Hook for Overlay Management
// =============================================================================

function MyAppWithHook() {
  const overlay = useOnairosOverlay({
    webpageName: "Hook-based App",
    requestData: ['personality'],
    autoFetch: true,
    onComplete: (result) => {
      const personalities = result.apiResponse?.InferenceResult?.personalityDict;
      if (personalities) {
        // Find dominant personality type
        const dominantType = Object.entries(personalities)
          .reduce((a, b) => personalities[a[0]] > personalities[b[0]] ? a : b)[0];
        
        console.log(`Your dominant personality type is: ${dominantType}`);
        showPersonalityType(dominantType, personalities[dominantType]);
      }
    }
  });

  return (
    <div>
      <button 
        onClick={() => overlay.open()}
        disabled={overlay.isLoading || overlay.isOpen}
        className="personality-button"
      >
        {overlay.isLoading ? 'Loading...' : 'Discover Your Personality'}
      </button>
      
      {overlay.isOpen && <div>Overlay is open...</div>}
    </div>
  );
}

// =============================================================================
// EXAMPLE 4: Custom Response Formatting
// =============================================================================

function MyAppWithCustomFormatting() {
  const handleComplete = (result) => {
    // You can also manually format responses if needed
    if (result.apiResponse?.InferenceResult?.traits) {
      const personalityDict = formatPersonalityScores(result.apiResponse.InferenceResult.traits);
      
      // Create custom groupings
      const analystTypes = ['Architect', 'Logician', 'Commander', 'Debater'];
      const diplomatTypes = ['Advocate', 'Mediator', 'Protagonist', 'Campaigner'];
      const sentinelTypes = ['Logistician', 'Defender', 'Executive', 'Consul'];
      const explorerTypes = ['Virtuoso', 'Adventurer', 'Entrepreneur', 'Entertainer'];
      
      const grouped = {
        analyst: analystTypes.reduce((sum, type) => sum + (personalityDict[type] || 0), 0),
        diplomat: diplomatTypes.reduce((sum, type) => sum + (personalityDict[type] || 0), 0),
        sentinel: sentinelTypes.reduce((sum, type) => sum + (personalityDict[type] || 0), 0),
        explorer: explorerTypes.reduce((sum, type) => sum + (personalityDict[type] || 0), 0)
      };
      
      console.log('Personality groups:', grouped);
    }
  };

  return (
    <OnairosButton
      webpageName="Custom Formatting App"
      requestData={['personality']}
      onComplete={handleComplete}
      autoFetch={true}
      formatResponse={false} // Disable automatic formatting to do it manually
    />
  );
}

// =============================================================================
// EXAMPLE 5: Non-React Integration (Vanilla JS)
// =============================================================================

// For vanilla JavaScript or other frameworks
window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('get-personality-btn');
  
  button?.addEventListener('click', async () => {
    try {
      const cleanup = await window.Onairos.openOnairosOverlay({
        webpageName: "Vanilla JS App",
        requestData: ['basic', 'personality'],
        autoFetch: true,
        onComplete: (result) => {
          const personalities = result.apiResponse?.InferenceResult?.personalityDict;
          
          if (personalities) {
            // Display results in DOM
            const resultsDiv = document.getElementById('personality-results');
            resultsDiv.innerHTML = `
              <h3>Your Personality Profile:</h3>
              <ul>
                ${Object.entries(personalities)
                  .sort(([,a], [,b]) => b - a) // Sort by score
                  .slice(0, 5) // Top 5
                  .map(([type, score]) => `<li>${type}: ${(score * 100).toFixed(1)}%</li>`)
                  .join('')}
              </ul>
            `;
          }
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  });
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function updateUserProfile(personalityDict) {
  // Example: Use personality data to customize user experience
  const topTraits = Object.entries(personalityDict)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([trait, score]) => ({ trait, score }));
  
  console.log('Top 3 personality traits:', topTraits);
  
  // Customize UI based on personality
  if (personalityDict.Analyst > 0.7) {
    enableAdvancedAnalyticsMode();
  }
  
  if (personalityDict.Explorer > 0.6) {
    suggestNewFeatures();
  }
}

function showPersonalityInsights(insights) {
  // Display personality insights to user
  console.log('Showing insights dashboard:', insights);
}

function showPersonalityType(dominantType, score) {
  console.log(`Primary personality type: ${dominantType} (${(score * 100).toFixed(1)}%)`);
}

function enableAdvancedAnalyticsMode() {
  console.log('Enabling advanced analytics for analytical personality');
}

function suggestNewFeatures() {
  console.log('Suggesting experimental features for explorer personality');
}

// =============================================================================
// EXPORT FOR MODULE USAGE
// =============================================================================

export {
  MyAppWithButton,
  MyAppWithProgrammaticOverlay,
  MyAppWithHook,
  MyAppWithCustomFormatting
}; 
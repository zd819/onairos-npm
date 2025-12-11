/**
 * Enhanced User Data Formatter for onComplete Callback
 * Provides structured, readable formatting of Onairos user data
 */

/**
 * Formats user data for better readability in onComplete callback
 * @param {Object} result - The complete result object from data request
 * @returns {Object} Enhanced result with formatted user data display
 */
export function formatUserDataForDisplay(result) {
  if (!result) return result;

  const formatted = { ...result };
  
  // Create a structured summary of the user data
  const userDataSummary = {
    // Basic request information
    requestInfo: {
      timestamp: result.timestamp || new Date().toISOString(),
      appName: result.appName || 'Unknown App',
      userHash: result.userHash || 'Unknown User',
      testMode: result.testMode || false,
      dataTypesRequested: Array.isArray(result.approvedData) ? result.approvedData : (result.approved || [])
    },
    
    // User authentication and profile data
    userProfile: {
      email: result.userData?.email || 'Not provided',
      userType: result.userData?.userType || 'Unknown',
      onboardingComplete: result.userData?.onboardingComplete || false,
      pinCreated: result.userData?.pinCreated || false,
      trainingComplete: result.userData?.trainingComplete || false,
      modelReady: result.userData?.modelReady || false
    },
    
    // Connected platforms/accounts
    connectedAccounts: formatConnectedAccounts(result.userData?.connectedAccounts || []),
    
    // API response data (personality, preferences, etc.)
    aiData: formatAIResponseData(result.apiResponse),
    
    // Success status and any errors
    status: {
      success: result.success || false,
      hasApiResponse: !!result.apiResponse,
      hasErrors: !!result.error || !!result.apiError
    }
  };

  // Add the formatted summary to the result
  formatted.userDataSummary = userDataSummary;
  
  // Create a pretty-printed version for console logging
  formatted.prettyPrint = createPrettyPrintVersion(userDataSummary);
  
  return formatted;
}

/**
 * Formats connected accounts data
 * @param {Array} accounts - Array of connected account objects
 * @returns {Object} Formatted accounts summary
 */
function formatConnectedAccounts(accounts) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return {
      count: 0,
      platforms: [],
      summary: 'No connected accounts'
    };
  }

  return {
    count: accounts.length,
    platforms: accounts.map(account => ({
      name: account.platform || account.name || 'Unknown Platform',
      status: account.status || 'Unknown',
      connectedAt: account.connectedAt || 'Unknown date',
      hasData: account.hasData || false
    })),
    summary: `${accounts.length} platform(s) connected: ${accounts.map(a => a.platform || a.name).join(', ')}`
  };
}

/**
 * Formats AI response data (personality scores, traits, etc.)
 * @param {Object} apiResponse - The API response containing AI data
 * @returns {Object} Formatted AI data summary
 */
function formatAIResponseData(apiResponse) {
  if (!apiResponse) {
    return {
      available: false,
      summary: 'No AI data available'
    };
  }

  const aiData = {
    available: true,
    dataTypes: []
  };

  // Check for Onairos Wrapped Dashboard
  if (apiResponse.data?.dashboard || apiResponse.dashboard || apiResponse.slides) {
    aiData.dataTypes.push({
      type: 'wrapped_dashboard',
      available: true,
      data: apiResponse.data?.dashboard || apiResponse.dashboard || apiResponse,
      summary: 'Onairos Wrapped / Neural Recall Dashboard'
    });
    
    // Add apps if available
    if (apiResponse.data?.apps || apiResponse.apps) {
      aiData.dataTypes.push({
        type: 'connected_apps',
        available: true,
        data: apiResponse.data?.apps || apiResponse.apps,
        summary: `Connected apps list (${(apiResponse.data?.apps || apiResponse.apps).length})`
      });
    }
  }

  // Check for personality data
  if (apiResponse.InferenceResult?.traits || apiResponse.personalityDict || apiResponse.traits) {
    const personalityData = {
      type: 'personality',
      available: true
    };

    // If we have dictionary format, use it for better readability
    if (apiResponse.personalityDict) {
      personalityData.data = apiResponse.personalityDict;
      personalityData.summary = `Personality analysis with ${Object.keys(apiResponse.personalityDict).length} traits`;
    } else if (apiResponse.InferenceResult?.traits) {
      personalityData.data = apiResponse.InferenceResult.traits;
      personalityData.summary = `Personality scores array with ${apiResponse.InferenceResult.traits.length} values`;
    } else if (apiResponse.traits) {
      personalityData.data = apiResponse.traits;
      personalityData.summary = `Personality traits with ${Array.isArray(apiResponse.traits) ? apiResponse.traits.length : Object.keys(apiResponse.traits).length} items`;
    }

    aiData.dataTypes.push(personalityData);
  }

  // Check for preferences/traits data
  if (apiResponse.traitResult || apiResponse.traitDict) {
    const preferencesData = {
      type: 'preferences',
      available: true
    };

    if (apiResponse.traitDict) {
      preferencesData.data = apiResponse.traitDict;
      preferencesData.summary = `Preferences analysis with ${Object.keys(apiResponse.traitDict).length} categories`;
    } else if (apiResponse.traitResult) {
      preferencesData.data = apiResponse.traitResult;
      preferencesData.summary = `Trait results with ${Array.isArray(apiResponse.traitResult) ? apiResponse.traitResult.length : Object.keys(apiResponse.traitResult).length} items`;
    }

    aiData.dataTypes.push(preferencesData);
  }

  // Check for basic info/output
  if (apiResponse.InferenceResult?.output || apiResponse.output) {
    aiData.dataTypes.push({
      type: 'basic_info',
      available: true,
      data: apiResponse.InferenceResult?.output || apiResponse.output,
      summary: 'Basic user information and insights'
    });
  }

  // Create overall summary
  aiData.summary = aiData.dataTypes.length > 0 
    ? `AI analysis complete with ${aiData.dataTypes.length} data type(s): ${aiData.dataTypes.map(d => d.type).join(', ')}`
    : 'AI data structure present but no recognized data types found';

  return aiData;
}

/**
 * Creates a pretty-printed version for console logging
 * @param {Object} userDataSummary - The formatted user data summary
 * @returns {string} Pretty-printed string for console output
 */
function createPrettyPrintVersion(userDataSummary) {
  const lines = [];
  
  lines.push('🎉 ONAIROS USER DATA SUMMARY');
  lines.push('=' .repeat(50));
  
  // Request Info
  lines.push('\n📋 REQUEST INFORMATION:');
  lines.push(`   App: ${userDataSummary.requestInfo.appName}`);
  lines.push(`   User: ${userDataSummary.requestInfo.userHash}`);
  lines.push(`   Mode: ${userDataSummary.requestInfo.testMode ? 'Test' : 'Production'}`);
  lines.push(`   Data Types: ${Array.isArray(userDataSummary.requestInfo.dataTypesRequested) && userDataSummary.requestInfo.dataTypesRequested.length > 0 ? userDataSummary.requestInfo.dataTypesRequested.join(', ') : 'None'}`);
  lines.push(`   Timestamp: ${new Date(userDataSummary.requestInfo.timestamp).toLocaleString()}`);
  
  // User Profile
  lines.push('\n👤 USER PROFILE:');
  lines.push(`   Email: ${userDataSummary.userProfile.email}`);
  lines.push(`   Type: ${userDataSummary.userProfile.userType}`);
  lines.push(`   Onboarding: ${userDataSummary.userProfile.onboardingComplete ? '✅' : '❌'}`);
  lines.push(`   PIN Setup: ${userDataSummary.userProfile.pinCreated ? '✅' : '❌'}`);
  lines.push(`   Training: ${userDataSummary.userProfile.trainingComplete ? '✅' : '❌'}`);
  lines.push(`   Model Ready: ${userDataSummary.userProfile.modelReady ? '✅' : '❌'}`);
  
  // Connected Accounts
  lines.push('\n🔗 CONNECTED ACCOUNTS:');
  lines.push(`   ${userDataSummary.connectedAccounts.summary}`);
  if (userDataSummary.connectedAccounts.platforms.length > 0) {
    userDataSummary.connectedAccounts.platforms.forEach(platform => {
      lines.push(`   • ${platform.name}: ${platform.status} ${platform.hasData ? '(has data)' : '(no data)'}`);
    });
  }
  
  // AI Data
  lines.push('\n🤖 AI ANALYSIS DATA:');
  lines.push(`   ${userDataSummary.aiData.summary}`);
  if (userDataSummary.aiData.dataTypes.length > 0) {
    userDataSummary.aiData.dataTypes.forEach(dataType => {
      lines.push(`   • ${dataType.type.toUpperCase()}: ${dataType.summary}`);
    });
  }
  
  // Status
  lines.push('\n✅ STATUS:');
  lines.push(`   Success: ${userDataSummary.status.success ? '✅' : '❌'}`);
  lines.push(`   API Response: ${userDataSummary.status.hasApiResponse ? '✅' : '❌'}`);
  lines.push(`   Errors: ${userDataSummary.status.hasErrors ? '❌ Yes' : '✅ None'}`);
  
  lines.push('\n' + '=' .repeat(50));
  
  return lines.join('\n');
}

/**
 * Console logging helper that prints formatted user data
 * @param {Object} result - The result object from onComplete
 */
export function logFormattedUserData(result) {
  const formatted = formatUserDataForDisplay(result);
  
  console.log('\n' + formatted.prettyPrint + '\n');
  
  // Also log the structured data for programmatic access
  console.log('📊 Structured User Data Summary:', formatted.userDataSummary);
  
  return formatted;
}

export default {
  formatUserDataForDisplay,
  logFormattedUserData
};

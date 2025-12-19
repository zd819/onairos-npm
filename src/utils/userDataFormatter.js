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
    
    // Connected platforms/accounts
    connectedAccounts: formatConnectedAccounts(result.userData?.connectedAccounts || []),
    
    // API response data (personality, preferences, etc.)
    aiData: formatAIResponseData(result.apiResponse)
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

  // SDK stores connectedAccounts as an array of strings (e.g. ["YouTube","Reddit"])
  // in several flows. Support that format as well as object arrays.
  if (typeof accounts[0] === 'string') {
    const names = accounts.map(a => String(a || '').trim()).filter(Boolean);
    return {
      count: names.length,
      platforms: names.map(name => ({
        name,
        status: 'Connected',
        connectedAt: 'Unknown date',
        hasData: false
      })),
      summary: `${names.length} platform(s) connected: ${names.join(', ')}`
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
      dataTypes: [],
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
      summary: 'Onairos Wrapped / Neural Recall Dashboard available'
    });
    
    // Add apps if available
    if (apiResponse.data?.apps || apiResponse.apps) {
      const appsCount = (apiResponse.data?.apps || apiResponse.apps).length;
      aiData.dataTypes.push({
        type: 'connected_apps',
        available: true,
        summary: `Connected apps list available (${appsCount} apps)`
      });
    }
  }

  // Check for personality data - simplified to avoid confusion
  if (apiResponse.InferenceResult?.traits || apiResponse.personalityDict || apiResponse.traits) {
    const personalityData = {
      type: 'personality',
      available: true
    };

    // Determine summary without including full data (reduces log clutter)
    if (apiResponse.personalityDict) {
      personalityData.summary = `Personality analysis available (${Object.keys(apiResponse.personalityDict).length} traits)`;
    } else if (apiResponse.InferenceResult?.traits) {
      personalityData.summary = `Personality scores available (${Array.isArray(apiResponse.InferenceResult.traits) ? apiResponse.InferenceResult.traits.length : 'unknown count'} values)`;
    } else if (apiResponse.traits) {
      const count = Array.isArray(apiResponse.traits) ? apiResponse.traits.length : Object.keys(apiResponse.traits).length;
      personalityData.summary = `Personality traits available (${count} items)`;
    }

    aiData.dataTypes.push(personalityData);
  }

  // Check for basic info/output
  if (apiResponse.InferenceResult?.output || apiResponse.output) {
    aiData.dataTypes.push({
      type: 'basic_info',
      available: true,
      summary: 'Basic user information and insights available'
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
  
  // Removed for distribution: detailed structured data logging
  // This was causing confusing nested aiData/traits output in console
  // Uncomment for debugging if needed:
  // console.log('📊 Structured User Data Summary:', formatted.userDataSummary);
  
  return formatted;
}

export default {
  formatUserDataForDisplay,
  logFormattedUserData
};

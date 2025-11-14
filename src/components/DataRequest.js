import React, { useState, useEffect } from 'react';
import PrimaryButton from './ui/PrimaryButton.jsx';
import { COLORS } from '../theme/colors.js';

const dataTypes = [
  { 
    id: 'basic', 
    name: 'Basic Profile', 
    description: 'Essential profile information, account details, and basic demographics', 
    icon: 'User',
    required: true,
    tooltip: 'Includes name, email, basic profile information. This data is essential for personalization and is always included.',
    privacyLink: 'https://onairos.uk/privacy#basic-info'
  },
  { 
    id: 'rawMemories', 
    name: 'Raw Memory Data', 
    description: 'LLM conversation history from ChatGPT, Claude, Gemini, and other AI platforms', 
    icon: 'Memory',
    required: false,
    tooltip: 'Your conversation history with AI assistants. Provides rich contextual data about your preferences and communication patterns.',
    privacyLink: 'https://onairos.uk/privacy#raw-memories-data'
  },
  { 
    id: 'preferences', 
    name: 'User Preferences', 
    description: 'User preferences, interests, settings and personal choices', 
    icon: 'Grid3X3',
    required: false,
    tooltip: 'Your stated preferences and interests from connected platforms. Helps customize your experience.',
    privacyLink: 'https://onairos.uk/privacy#preferences-data'
  },
  { 
    id: 'personality', 
    name: 'Personality Traits', 
    description: 'Personality traits, behavioral patterns and psychological insights', 
    icon: 'Brain',
    required: false,
    tooltip: 'AI-analyzed personality traits based on your social media activity and interactions. Used to improve content recommendations.',
    privacyLink: 'https://onairos.uk/privacy#personality-data'
  }
];

// Data Type Toggle Component with compact checkbox design
const DataTypeToggle = ({ dataType, isEnabled, onToggle, isLast }) => {
  const handleToggle = () => {
    if (dataType.required) return; // Don't allow toggling required items
    onToggle(dataType.id, !isEnabled);
  };

  const getIconComponent = (iconName) => {
    const iconProps = { className: "w-4 h-4 text-gray-700" };
    
    switch (iconName) {
      case 'User':
        return (
          <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        );
      case 'Memory':
        return (
          <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        );
      case 'Grid3X3':
        return (
          <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
        );
      case 'Brain':
        return (
          <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        );
      default:
        return <span className="text-lg">{iconName}</span>;
    }
  };

            return (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            {getIconComponent(dataType.icon)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="font-medium text-gray-900 text-xs">{dataType.name}</span>
                        </div>
                    </div>
      <div
        onClick={handleToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${
          isEnabled ? "bg-gray-900 border-gray-900" : "bg-white border-gray-300"
        }`}
      >
        {isEnabled && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </div>
  );
};

const DataRequest = ({ 
  userEmail = 'user@example.com', 
  testMode = false, 
  onComplete, 
  autoFetch = true,
  appName = 'Test App',
  formatResponse = false,
  responseFormat = 'simple',
  rawMemoriesOnly = false,
  rawMemoriesConfig = null,
  requestData = null,
  connectedAccounts = {}
}) => {
  // Initialize selectedData based on requestData and rawMemoriesOnly mode
  const getInitialSelectedData = () => {
    const initial = { basic: true }; // Basic is always included
    
    if (requestData && Array.isArray(requestData)) {
      // Set based on requestData array
      requestData.forEach(dataType => {
        if (dataType !== 'basic') { // basic is always true
          initial[dataType] = true;
        }
      });
    } else if (rawMemoriesOnly) {
      // RAW memories only mode
      initial.rawMemories = true;
    } else {
      // Default mode
      initial.personality = false;
      initial.preferences = false;
      initial.rawMemories = false;
    }
    
    return initial;
  };

  const [selectedData, setSelectedData] = useState(getInitialSelectedData());
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleDataToggle = (dataId, enabled) => {
    const dataType = dataTypes.find(dt => dt.id === dataId);
    if (dataType?.required) return; // Don't allow toggling required items

    setSelectedData(prev => ({
      ...prev,
      [dataId]: enabled
    }));
  };

  const generateUserHash = (email) => {
    let hash = 0;
    const str = email + Date.now().toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `user_${Math.abs(hash).toString(36)}`;
  };

  const fetchUserData = async () => {
    console.log('🔥 DataRequest: fetchUserData called');
    console.log('🔥 DataRequest: onComplete function:', typeof onComplete);
    console.log('🔥 DataRequest: selectedData:', selectedData);
    console.log('🔥 DataRequest: selectedCount:', selectedCount);
    
    setIsLoadingApi(true);
    setApiError(null);
    
    try {
      const userHash = generateUserHash(userEmail);
      
      // Get selected data types
      const approvedData = Object.entries(selectedData)
        .filter(([key, value]) => value)
        .map(([key]) => key);

      const mapDataTypesToConfirmations = (approvedData) => {
        const confirmations = [];
        const currentDate = new Date().toISOString();
        
        const dataTypeMapping = {
          'basic': 'Medium',
          'personality': 'Large',
          'preferences': 'Traits',
          'rawMemories': 'LLMData'
        };
        
        Object.keys(selectedData).forEach(key => {
          if (selectedData[key]) {
            confirmations.push({
              data: dataTypeMapping[key] || key,
              date: currentDate
            });
          }
        });
        
        return confirmations;
      };

      const apiEndpoint = testMode 
        ? 'https://api2.onairos.uk/inferenceTest'
        : 'https://api2.onairos.uk/getAPIurlMobile';
      
      const baseResult = {
        userHash,
        appName,
        approvedData,
        apiUrl: apiEndpoint,
        testMode,
        timestamp: new Date().toISOString()
      };

      if (autoFetch) {
        if (testMode) {
          // Test mode: Skip API call completely, simulate response
          console.log('🧪 Test mode: Simulating data request API call for:', approvedData);
          
          setTimeout(() => {
            const simulatedApiData = {
              InferenceResult: {
                output: Array.from({ length: 16 }, () => [Math.random()]),
                traits: {
                  personality_traits: {
                    positive_traits: {
                      creativity: 85.5,
                      empathy: 78.2,
                      leadership: 72.8,
                      analytical_thinking: 88.9,
                      communication: 81.3
                    },
                    traits_to_improve: {
                      patience: 45.2,
                      time_management: 52.7,
                      delegation: 38.9
                    }
                  }
                }
              },
              persona: {
                id: 1,
                name: "Test Persona",
                description: "Simulated persona for testing"
              },
              inference_metadata: {
                size_used: "Large",
                total_outputs: 16,
                persona_applied: "Test Persona"
              }
            };

            // Log detailed test mode response with explanations
            const { logOnairosResponse } = require('../utils/apiResponseLogger');
            console.log('🧪 Test Mode: Simulated API Response');
            logOnairosResponse(simulatedApiData, 'TEST_MODE', { 
              detailed: true, 
              showRawData: false 
            });

            const result = {
              ...baseResult,
              token: 'test_token_' + Date.now(), // Mock JWT token for test mode
              apiResponse: simulatedApiData,
              success: true,
              simulated: true
            };

            setIsLoadingApi(false);
            console.log('🧪 Test mode: Simulated data request completed');
            console.log('🔥 DataRequest: Result structure (TEST MODE):', {
              token: result.token ? `✅ ${result.token.substring(0, 20)}...` : '❌ Missing',
              apiUrl: result.apiUrl ? `✅ ${result.apiUrl}` : '❌ Missing',
              hasApiResponse: !!result.apiResponse,
              success: result.success,
              testMode: result.testMode,
              simulated: result.simulated
            });
            
            if (onComplete && typeof onComplete === 'function') {
              onComplete(result);
              console.log('🔥 DataRequest: onComplete called successfully (test mode)');
            } else {
              console.error('🔥 DataRequest: onComplete is not a function or is undefined (test mode)');
            }
          }, 1200); // Simulate realistic processing time
        } else {
          // Production mode: Make real API call
          try {
            const confirmations = mapDataTypesToConfirmations(approvedData);
            
            const requestBody = {
              Info: {
                storage: "local",
                appId: appName,
                account: userEmail,
                confirmations: confirmations,
                EncryptedUserPin: "pending_pin_integration",
                proofMode: false,
                Domain: window.location.hostname,
                web3Type: "standard"
              }
            };

            console.log('🔥 DataRequest: Making API call to:', apiEndpoint);
            console.log('🔥 Request body:', requestBody);

            const apiResponse = await fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody)
            });

            if (!apiResponse.ok) {
              throw new Error(`API request failed with status ${apiResponse.status}`);
            }

            const apiData = await apiResponse.json();
            
            // Log detailed API response with explanations
            const { logOnairosResponse } = require('../utils/apiResponseLogger');
            console.log('🔥 Raw API Response received from backend');
            logOnairosResponse(apiData, apiEndpoint, { 
              detailed: true, 
              showRawData: false // Set to true to see raw JSON
            });

            const result = {
              ...baseResult,
              // Use backend-chosen endpoint so host apps don't call /getAPIurlMobile
              apiUrl: apiData.apiUrl || baseResult.apiUrl,
              token: apiData.token, // expose JWT for authenticated calls
              authorizedData: apiData.authorizedData,
              usage: apiData.usage,
              apiResponse: apiData,
              success: true
            };

            setIsLoadingApi(false);
            console.log('🔥 DataRequest: Calling onComplete with result');
            console.log('🔥 DataRequest: Result structure:', {
              token: result.token ? `✅ ${result.token.substring(0, 20)}...` : '❌ Missing',
              apiUrl: result.apiUrl ? `✅ ${result.apiUrl}` : '❌ Missing',
              hasApiResponse: !!result.apiResponse,
              success: result.success,
              testMode: result.testMode || false
            });
            
            if (onComplete && typeof onComplete === 'function') {
              onComplete(result);
              console.log('🔥 DataRequest: onComplete called successfully');
            } else {
              console.error('🔥 DataRequest: onComplete is not a function or is undefined');
            }

          } catch (apiError) {
            console.error('🔥 API Error:', apiError);
            setApiError(apiError.message);
            setIsLoadingApi(false);
            
            const errorResult = {
              ...baseResult,
              apiResponse: null,
              error: apiError.message,
              success: false
            };
            
            onComplete(errorResult);
          }
        }
      } else {
        setIsLoadingApi(false);
        console.log('🔥 DataRequest: Auto-fetch disabled, calling onComplete with base result');
        console.log('🔥 DataRequest: onComplete function type:', typeof onComplete);
        if (onComplete && typeof onComplete === 'function') {
          onComplete(baseResult);
          console.log('🔥 DataRequest: onComplete called successfully (auto-fetch disabled)');
        } else {
          console.error('🔥 DataRequest: onComplete is not a function or is undefined (auto-fetch disabled)');
        }
      }
    } catch (error) {
      console.error('🔥 DataRequest Error:', error);
      setApiError(error.message);
      setIsLoadingApi(false);
      
      if (onComplete) {
        onComplete({
          error: error.message,
          success: false,
          userEmail,
          appName,
          testMode
        });
      }
    }
  };

  // Count selected data types
  const selectedCount = Object.values(selectedData).filter(Boolean).length;

  // Connected platforms - handle both object and array formats
  const getConnectedPlatforms = () => {
    if (!connectedAccounts) {
      console.log('🔍 No connectedAccounts prop');
      return [];
    }
    
    console.log('🔍 DataRequest connectedAccounts:', connectedAccounts);
    console.log('🔍 Type:', typeof connectedAccounts, 'Is Array:', Array.isArray(connectedAccounts));
    
    // If it's already an array, use it directly
    if (Array.isArray(connectedAccounts)) {
      console.log('🔍 Returning array as-is:', connectedAccounts);
      return connectedAccounts;
    }
    
    // If it's an object, extract the keys (platform names)
    const platforms = Object.entries(connectedAccounts)
      .filter(([_, v]) => Boolean(v)) // Handle truthy values
      .map(([k]) => k);
    console.log('🔍 Extracted platforms from object:', platforms);
    return platforms;
  };
  
  const connectedPlatforms = getConnectedPlatforms();
  console.log('🔍 Final connectedPlatforms:', connectedPlatforms, 'Length:', connectedPlatforms.length);
  
  const getPlatformEmoji = (name) => {
    const emojiMap = {
      Instagram: '📷', YouTube: '▶️', LinkedIn: '💼', Reddit: '🤖',
      Pinterest: '📌', GitHub: '💻', Facebook: '👥', Gmail: '📧',
      Twitter: '🐦', ChatGPT: '🤖', Claude: '🧠', Gemini: '✨', Grok: '⚡'
    };
    return emojiMap[name] || '🔗';
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh] overflow-hidden">
      {/* Scrollable main content */}
      <div className="flex-1 overflow-y-auto px-6 pt-16 pb-4">
        {/* Icon Flow */}
        <div className="mb-4 flex justify-center items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-100">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"
                fill="black"
              />
              <path
                d="M21 9V7L15 6.5V9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9V6.5L3 7V9C3 12.87 6.13 16 10 16V22H14V16C17.87 16 21 12.87 21 9Z"
                fill="black"
              />
            </svg>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-100">
            <span className="text-xl font-serif font-bold text-black">B</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-4 flex-shrink-0 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2 text-balance leading-tight">
            {appName} wants to personalize your experience
          </h1>
          <p className="text-gray-600 text-sm">Choose what to share:</p>
        </div>

        {/* Consent Options */}
        <div className="space-y-4">
          {dataTypes
            .filter(dataType => {
              if (rawMemoriesOnly) {
                // In RAW memories only mode, show only basic and rawMemories
                return dataType.id === 'basic' || dataType.id === 'rawMemories';
              }
              // In normal mode, show all data types
              return true;
            })
            .map((dataType, index) => (
              <DataTypeToggle
                key={dataType.id}
                dataType={dataType}
                isEnabled={selectedData[dataType.id]}
                onToggle={handleDataToggle}
                isLast={index === dataTypes.length - 1}
              />
            ))}
        </div>
      </div>

      {/* Connected platforms line - Fixed above buttons */}
      {connectedPlatforms.length > 0 ? (
        <div className="px-6 py-3 text-center bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="text-xs text-gray-500 mb-1">Connected Platforms</div>
          <div className="flex justify-center items-center gap-2 flex-wrap">
            {connectedPlatforms.map((platform, index) => {
              const logoMap = {
                Instagram: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
                YouTube: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
                LinkedIn: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
                Reddit: 'https://www.redditinc.com/assets/images/site/reddit-logo.png',
                Pinterest: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png',
                GitHub: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                Facebook: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
                Gmail: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
                Twitter: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg',
                ChatGPT: 'https://anushkasirv.sirv.com/openai.png',
                Claude: 'https://anushkasirv.sirv.com/claude-color.png',
                Gemini: 'https://anushkasirv.sirv.com/gemini-color.png',
                Grok: 'https://anushkasirv.sirv.com/grok.png'
              };
              const imageSrc = logoMap[platform] || '';
              console.log(`🔍 Rendering platform ${index}: ${platform}, src: ${imageSrc}`);
              return (
                <img 
                  key={`${platform}-${index}`} 
                  src={imageSrc} 
                  alt={platform}
                  title={platform}
                  className="w-6 h-6 object-contain"
                  onError={(e) => { 
                    console.warn(`Failed to load image for ${platform} from ${imageSrc}`);
                    e.target.style.display = 'none'; 
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Fixed footer with buttons */}
      <div className="px-6 py-4 bg-white border-t border-gray-200 flex flex-col gap-2 shrink-0">
        <button
          onClick={fetchUserData}
          disabled={isLoadingApi || selectedCount === 0}
          className="w-full rounded-full py-3 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoadingApi ? "Processing..." : "Accept & Continue"}
          {!isLoadingApi && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        <button
          onClick={() => onComplete({ cancelled: true })}
          className="w-full rounded-full py-3 bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition"
        >
          Decline
        </button>

        {/* Error display */}
        {apiError && (
          <div className="mt-2 p-3 rounded-lg text-center bg-red-50 border border-red-200 text-red-600">
            <p className="text-xs">{apiError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataRequest; 
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
    const iconProps = { className: "w-4 h-4 text-gray-600" };
    
    switch (iconName) {
      case 'User':
        return (
          <svg {...iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'Grid3X3':
        return (
          <svg {...iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case 'Brain':
        return (
          <svg {...iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      default:
        return <span className="text-lg">{iconName}</span>;
    }
  };

            return (
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            {getIconComponent(dataType.icon)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="font-medium text-gray-900 text-sm">{dataType.name}</span>
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
  testMode = true, 
  onComplete, 
  autoFetch = true,
  appName = 'Test App',
  formatResponse = false,
  responseFormat = 'simple'
}) => {
  const [selectedData, setSelectedData] = useState({
    basic: true, // Always true for required data
    personality: false,
    preferences: false
  });
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
          'preferences': 'Traits'
        };
        
        approvedData.forEach(dataType => {
          if (dataTypeMapping[dataType]) {
            confirmations.push({
              data: dataTypeMapping[dataType],
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
              success: true,
              message: "Data request simulated successfully",
              data: {
                personalityScores: {
                  openness: 0.75,
                  conscientiousness: 0.68,
                  extraversion: 0.82,
                  agreeableness: 0.71,
                  neuroticism: 0.43
                },
                insights: [
                  "You show high creativity and openness to new experiences",
                  "Strong social tendencies with good interpersonal skills",
                  "Well-organized approach to tasks and goals"
                ],
                dataProcessed: approvedData,
                timestamp: new Date().toISOString(),
                testMode: true
              }
            };

            const result = {
              ...baseResult,
              apiResponse: simulatedApiData,
              success: true,
              simulated: true
            };

            setIsLoadingApi(false);
            console.log('🧪 Test mode: Simulated data request completed:', result);
            console.log('🔥 DataRequest: onComplete function type:', typeof onComplete);
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
              approvedData,
              userEmail,
              appName,
              confirmations
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
            console.log('🔥 API Response:', apiData);

            const result = {
              ...baseResult,
              apiResponse: apiData,
              success: true
            };

            setIsLoadingApi(false);
            console.log('🔥 DataRequest: Calling onComplete with result:', result);
            console.log('🔥 DataRequest: onComplete function type:', typeof onComplete);
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

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Content - Flexible center area with proper constraints */}
      <div className="px-6 pt-16 flex-1 flex flex-col min-h-0" style={{ minHeight: 'calc(100vh - 200px)' }}>
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
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900 mb-2 text-balance leading-tight">
            {appName} wants to personalize your experience
          </h1>
          <p className="text-gray-600 text-sm">Choose what to share:</p>
        </div>

        {/* Consent Options - Scrollable area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-4 pb-4">
            {dataTypes.map((dataType, index) => (
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
      </div>

      {/* Buttons - Fixed at bottom with guaranteed visibility */}
      <div className="px-6 pb-6 pt-3 flex-shrink-0 space-y-2 bg-white border-t border-gray-100">
        <div
          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={fetchUserData}
          disabled={isLoadingApi || selectedCount === 0}
        >
          {isLoadingApi ? "Processing..." : "Accept & Continue"}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div
          onClick={() => onComplete({ cancelled: true })}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full py-3 text-sm font-medium text-center cursor-pointer transition-colors"
        >
          Decline
        </div>

        {/* Error display */}
        {apiError && (
          <div className="mt-3 p-3 rounded-lg text-center bg-red-50 border border-red-200 text-red-600">
            <p className="text-xs">{apiError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataRequest; 
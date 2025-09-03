import React, { useState, useEffect } from 'react';
import PrimaryButton from './ui/PrimaryButton.jsx';
import { COLORS } from '../theme/colors.js';

const dataTypes = [
  { 
    id: 'basic', 
    name: 'Basic Info', 
    description: 'Essential profile information, account details, and basic demographics', 
    icon: '👤',
    required: true,
    tooltip: 'Includes name, email, basic profile information. This data is essential for personalization and is always included.',
    privacyLink: 'https://onairos.uk/privacy#basic-info'
  },
  { 
    id: 'personality', 
    name: 'Personality', 
    description: 'Personality traits, behavioral patterns and psychological insights', 
    icon: '💝',
    required: false,
    tooltip: 'AI-analyzed personality traits based on your social media activity and interactions. Used to improve content recommendations.',
    privacyLink: 'https://onairos.uk/privacy#personality-data'
  },
  { 
    id: 'preferences', 
    name: 'Preferences', 
    description: 'User preferences, interests, settings and personal choices', 
    icon: '⚙️',
    required: false,
    tooltip: 'Your stated preferences and interests from connected platforms. Helps customize your experience.',
    privacyLink: 'https://onairos.uk/privacy#preferences-data'
  }
];

// Data Type Toggle Component (similar to PlatformToggle)
const DataTypeToggle = ({ dataType, isEnabled, onToggle, isLast }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    if (dataType.required) return; // Don't allow toggling required items
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    onToggle(dataType.id, !isEnabled);
  };

  return (
    <div 
      className={`w-full p-4 border rounded-xl cursor-pointer transition-all duration-200 ${!isLast ? 'mb-3' : ''}`}
      style={{
        backgroundColor: isPressed ? COLORS.grey50 : COLORS.surface,
        borderColor: isEnabled ? COLORS.primary : COLORS.grey200,
        borderWidth: '1px',
        transform: isPressed ? 'scale(0.99)' : 'scale(1)',
        opacity: dataType.required ? 0.6 : 1,
        cursor: dataType.required ? 'default' : 'pointer'
      }}
      onClick={handlePress}
    >
      <div className="flex items-start justify-between">
        {/* Left side - Icon and content */}
        <div className="flex items-start space-x-3 flex-1">
          {/* Icon circle */}
          <div 
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: COLORS.grey100
            }}
          >
            <span className="text-xl">{dataType.icon}</span>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 
                className="font-semibold text-left"
                style={{ 
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: '600',
                  fontSize: '16px',
                  lineHeight: '20px',
                  color: COLORS.grey800
                }}
              >
                {dataType.name}
              </h3>
              {dataType.required && (
                <span 
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: COLORS.primary,
                    color: COLORS.surface,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: '500'
                  }}
                >
                  Required
                </span>
              )}
            </div>
            <p 
              className="text-left"
              style={{ 
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: '400',
                fontSize: '14px',
                lineHeight: '20px',
                color: COLORS.grey600
              }}
            >
              {dataType.description}
            </p>
          </div>
        </div>
        
        {/* Right side - Toggle */}
        <div className="flex-shrink-0 ml-3">
          <div 
            className="w-12 h-6 rounded-full transition-all duration-200 relative"
            style={{
              backgroundColor: isEnabled ? COLORS.primary : COLORS.grey300
            }}
          >
            <div 
              className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-200"
              style={{
                left: isEnabled ? '26px' : '2px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>
        </div>
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
        try {
          const confirmations = mapDataTypesToConfirmations(approvedData);
          
          const requestBody = testMode ? {
            approvedData,
            userEmail,
            appName,
            confirmations
          } : {
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
          onComplete(result);

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
      } else {
        setIsLoadingApi(false);
        console.log('🔥 DataRequest: Auto-fetch disabled, calling onComplete with base result');
        onComplete(baseResult);
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
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: COLORS.surface }}>
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        {/* Security Notice */}
        <div 
          className="w-full p-4 rounded-xl mb-6 flex items-start space-x-3"
          style={{ 
            backgroundColor: '#EBF8FF',
            border: `1px solid #BEE3F8`
          }}
        >
          <div 
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
            style={{ backgroundColor: '#3182CE' }}
          >
            <span className="text-white text-sm">🔒</span>
          </div>
          <p 
            className="text-left"
            style={{ 
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: '400',
              fontSize: '14px',
              lineHeight: '20px',
              color: '#2B6CB0'
            }}
          >
            Your selected data will be securely processed and used only for the intended purpose.
          </p>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 
            className="font-bold text-left mb-2"
            style={{ 
              fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
              fontWeight: '700',
              fontSize: '24px',
              lineHeight: '32px',
              color: COLORS.grey800
            }}
          >
            Data Types
          </h1>
        </div>
      </div>

      {/* Scrollable Data Types Section */}
      <div className="flex-1 px-6 overflow-y-auto">
        <div className="pb-32">
          {dataTypes.map((dataType, index) => (
            <DataTypeToggle
              key={dataType.id}
              dataType={dataType}
              isEnabled={selectedData[dataType.id]}
              onToggle={handleDataToggle}
              isLast={index === dataTypes.length - 1}
            />
          ))}

          {/* Selection Summary */}
          <div 
            className="mt-6 p-4 rounded-xl flex items-center space-x-2"
            style={{ backgroundColor: COLORS.grey50 }}
          >
            <span 
              className="text-sm"
              style={{ 
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: '500',
                color: COLORS.grey600
              }}
            >
              ✅ {selectedCount} data type{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div 
        className="flex-shrink-0 px-6 pb-6"
        style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: COLORS.surface,
          paddingTop: '24px'
        }}
      >
        <div className="mb-4">
          <PrimaryButton
            label={isLoadingApi ? "Processing..." : "Share Selected Data"}
            onPress={fetchUserData}
            disabled={isLoadingApi || selectedCount === 0}
            loading={isLoadingApi}
          />
        </div>
        
        <div className="text-center">
          <button 
            className="text-center"
            style={{ 
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: '500',
              fontSize: '16px',
              color: COLORS.grey600,
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={() => onComplete({ cancelled: true })}
          >
            Cancel
          </button>
        </div>

        {/* Error display */}
        {apiError && (
          <div 
            className="mt-4 p-3 rounded-lg text-center"
            style={{ 
              backgroundColor: '#FEF2F2',
              borderColor: '#FECACA',
              color: '#DC2626'
            }}
          >
            <p className="text-sm">{apiError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataRequest; 
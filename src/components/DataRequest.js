import React, { useState, useEffect } from 'react';

// Remove the platform connectors - these should be handled in onboarding
// const platformConnectors = [
//   { name: 'YouTube', icon: '📺', color: 'bg-red-500', connector: 'youtube' },
//   { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700', connector: 'linkedin' },
//   { name: 'Reddit', icon: '🔥', color: 'bg-orange-500', connector: 'reddit' },
//   { name: 'Pinterest', icon: '📌', color: 'bg-red-600', connector: 'pinterest' },
//   { name: 'Instagram', icon: '📷', color: 'bg-pink-500', connector: 'instagram' },
//   { name: 'GitHub', icon: '⚡', color: 'bg-gray-800', connector: 'github' },
//   { name: 'Facebook', icon: '👥', color: 'bg-blue-600', connector: 'facebook' },
//   { name: 'Gmail', icon: '✉️', color: 'bg-red-400', connector: 'gmail' }
// ];

const dataTypes = [
  { 
    id: 'basic', 
    name: 'Basic Info', 
    description: 'Essential profile information, account details, and basic demographics', 
    icon: '👤',
    required: true, // Auto-selected and non-deselectable
    tooltip: 'Includes name, email, basic profile information. This data is essential for personalization and is always included.',
    privacyLink: 'https://onairos.uk/privacy#basic-info'
  },
  { 
    id: 'personality', 
    name: 'Personality', 
    description: 'Personality traits, behavioral patterns and psychological insights', 
    icon: '🧠',
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

// Tooltip component
const Tooltip = ({ children, content, privacyLink }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="border-b border-dotted border-gray-400 cursor-help"
      >
        {children}
      </span>
      {showTooltip && (
        <div className="absolute z-50 w-64 p-3 mt-2 text-sm bg-white border border-gray-200 rounded-lg shadow-lg left-0">
          <p className="mb-2 text-gray-700">{content}</p>
          <a 
            href={privacyLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
          >
            Learn more about privacy →
          </a>
        </div>
      )}
    </div>
  );
};

export default function DataRequest({ 
  onComplete, 
  userEmail, 
  appName = 'App', 
  autoFetch = false,
  testMode = false,
  connectedAccounts = {} // Connected platforms from onboarding
}) {
  const [selectedData, setSelectedData] = useState({
    basic: true, // Auto-selected and required
    personality: false,
    preferences: false
  });
  
  // Remove connector states - not needed for data request
  // const [connectorStates, setConnectorStates] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Remove connector initialization - not needed
  // useEffect(() => {
  //   const initialStates = {};
  //   platformConnectors.forEach(platform => {
  //     initialStates[platform.name] = {
  //       connected: connectedAccounts[platform.name] || false,
  //       selected: false
  //     };
  //   });
  //   setConnectorStates(initialStates);
  // }, [connectedAccounts]);

  const handleDataToggle = (dataId) => {
    // Don't allow toggling required items
    const dataType = dataTypes.find(dt => dt.id === dataId);
    if (dataType?.required) return;
    
    setSelectedData(prev => ({
      ...prev,
      [dataId]: !prev[dataId]
    }));
  };

  // handleConnectorToggle removed - connectors are handled in onboarding

  const handleRowClick = (dataId) => {
    const dataType = dataTypes.find(dt => dt.id === dataId);
    if (dataType?.required) return; // Don't allow clicking required items
    handleDataToggle(dataId);
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

      // Get selected connectors
      // const selectedConnectors = Object.entries(connectorStates)
      //   .filter(([platform, state]) => state.selected && state.connected)
      //   .map(([platform]) => platform);

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
        // selectedConnectors, // Removed as connectors are handled in onboarding
        apiUrl: apiEndpoint,
        testMode,
        timestamp: new Date().toISOString()
      };

      if (autoFetch) {
        try {
          const confirmations = mapDataTypesToConfirmations(approvedData);
          
          const requestBody = testMode ? {
            approvedData,
            // selectedConnectors, // Removed as connectors are handled in onboarding
            userEmail,
            appName,
            testMode,
            timestamp: new Date().toISOString()
          } : {
            Info: {
              storage: "local",
              appId: appName,
              confirmations: confirmations,
              // connectors: selectedConnectors, // Removed as connectors are handled in onboarding
              EncryptedUserPin: "pending_pin_integration",
              account: userEmail,
              proofMode: false,
              Domain: window.location.hostname,
              web3Type: "standard",
              OthentSub: null
            }
          };

          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': 'onairos_web_sdk_live_key_2024'
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }

          const data = await response.json();
          setApiResponse(data);

          const result = {
            ...baseResult,
            apiResponse: data,
            success: true
          };

          setTimeout(() => {
            onComplete(result);
          }, 1500);

          return result;

        } catch (error) {
          console.error('API request failed:', error);
          setApiError(`API request failed: ${error.message}`);
          
          const result = {
            ...baseResult,
            error: error.message,
            success: false
          };
          
          setTimeout(() => {
            onComplete(result);
          }, 2000);
          
          return result;
        }
      } else {
        onComplete(baseResult);
        return baseResult;
      }
      
    } catch (error) {
      console.error('Data processing failed:', error);
      setApiError(`Processing failed: ${error.message}`);
      throw error;
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await fetchUserData();
      
      if (result) {
        onComplete(result);
      }
    } catch (error) {
      setApiError(`Submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = Object.values(selectedData).filter(Boolean).length;
  // const selectedConnectorCount = Object.values(connectorStates).filter(state => state.selected).length; // Removed as connectors are handled in onboarding
  // const connectedCount = Object.values(connectorStates).filter(state => state.connected).length; // Removed as connectors are handled in onboarding

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden" style={{ maxHeight: '90vh', height: 'auto' }}>
      <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 4rem)' }}>
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Data Request</h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            Select the data types and connections to share with <span className="font-medium">{appName}</span>
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-xs sm:text-sm">
            🔒 Your selected data will be securely processed and used only for the intended purpose.
          </p>
        </div>

        {/* Data Types Selection */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Data Types</h3>
          <div className="space-y-2 sm:space-y-3">
            {dataTypes.map((dataType) => {
              const isSelected = selectedData[dataType.id] || false;
              const isRequired = dataType.required;
              
              return (
                <div 
                  key={dataType.id}
                  className={`flex items-center justify-between p-3 sm:p-4 border rounded-lg transition-colors ${
                    isRequired 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                      : 'hover:bg-gray-50 cursor-pointer border-gray-200'
                  }`}
                  onClick={() => handleRowClick(dataType.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-xl sm:text-2xl">
                      {dataType.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                        <Tooltip content={dataType.tooltip} privacyLink={dataType.privacyLink}>
                          {dataType.name}
                        </Tooltip>
                        {isRequired && <span className="text-gray-500 ml-1 text-xs">(Required)</span>}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500">{dataType.description}</p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch or Required Badge */}
                  {isRequired ? (
                    <div className="px-2 py-1 bg-gray-400 text-white text-xs rounded-full">
                      Required
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDataToggle(dataType.id);
                      }}
                      className={`relative inline-flex h-5 sm:h-6 w-9 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isSelected ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 sm:h-4 w-3 sm:w-4 transform rounded-full bg-white transition-transform ${
                          isSelected ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selection Summary */}
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-xs sm:text-sm">
            ✅ {selectedCount} data type{selectedCount > 1 ? 's' : ''} selected
          </p>
        </div>

        {/* API Status */}
        {isLoadingApi && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-xs sm:text-sm">🔄 Processing your data request...</p>
          </div>
        )}

        {apiError && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-xs sm:text-sm">❌ {apiError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <button
            type="submit"
            disabled={isSubmitting || selectedCount === 0}
            className={`w-full py-2 sm:py-3 px-4 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
              selectedCount > 0 && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Processing...' : `Share Selected Data`}
          </button>
          
          <button
            type="button"
            onClick={() => onComplete({ selectedData: {}, selectedConnectors: [], cancelled: true })}
            className="w-full py-2 text-gray-500 hover:text-gray-700 text-xs sm:text-sm"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
} 
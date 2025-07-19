import React, { useState } from 'react';

const dataTypes = [
  { 
    id: 'basic', 
    name: 'Basic Info', 
    description: 'Essential profile information and account details', 
    icon: '👤',
    required: false
  },
  { 
    id: 'personality', 
    name: 'Personality', 
    description: 'Personality traits, behavioral patterns and insights', 
    icon: '🧠',
    required: false
  },
  { 
    id: 'preferences', 
    name: 'Preferences', 
    description: 'User preferences, settings and choices', 
    icon: '⚙️',
    required: false
  }
];

export default function DataRequest({ 
  onComplete, 
  userEmail, 
  appName = 'App', 
  autoFetch = false,
  testMode = false 
}) {
  const [selectedData, setSelectedData] = useState({
    basic: false, // User can choose
    personality: false,
    preferences: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);

  const handleDataToggle = (dataId) => {
    setSelectedData(prev => ({
      ...prev,
      [dataId]: !prev[dataId]
    }));
  };

  const handleRowClick = (dataId) => {
    // Make the entire row clickable for better UX
    handleDataToggle(dataId);
  };

  const generateUserHash = (email) => {
    // Simple hash function for user identification
    let hash = 0;
    const str = email + Date.now().toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash).toString(36)}`;
  };

  const fetchUserData = async () => {
    setIsLoadingApi(true);
    setApiError(null);
    
    try {
      // Create a unique user hash for this request
      const userHash = generateUserHash(userEmail);
      
      // Get selected data types
      const approvedData = Object.entries(selectedData)
        .filter(([key, value]) => value)
        .map(([key]) => key);

      // Map frontend data types to backend confirmation types
      const mapDataTypesToConfirmations = (approvedData) => {
        const confirmations = [];
        const currentDate = new Date().toISOString();
        
        // Map frontend types to backend types according to API expectations
        const dataTypeMapping = {
          'basic': 'Medium',        // Basic info -> Medium data
          'personality': 'Large',   // Personality -> Large analysis
          'preferences': 'Traits'   // Preferences -> Traits data
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

      // Determine API endpoint based on test mode
      const apiEndpoint = testMode 
        ? 'https://api2.onairos.uk/inferenceTest'
        : 'https://api2.onairos.uk/getAPIurlMobile';
      
      // Prepare the base result
      const baseResult = {
        userHash,
        appName,
        approvedData,
        apiUrl: apiEndpoint,
        testMode,
        timestamp: new Date().toISOString()
      };

      if (autoFetch) {
        // Auto mode true: make API request and return results
        try {
          const confirmations = mapDataTypesToConfirmations(approvedData);
          
          // Format request according to backend expectations
          const requestBody = testMode ? {
            // Test mode: simple format for testing
            approvedData,
            userEmail,
            appName,
            testMode,
            timestamp: new Date().toISOString()
          } : {
            // Live mode: proper Info format for backend
            Info: {
              storage: "local",
              appId: appName,
              confirmations: confirmations,
              EncryptedUserPin: "pending_pin_integration", // TODO: Get from user PIN setup
              account: userEmail,
              proofMode: false,
              Domain: window.location.hostname,
              web3Type: "standard", // or "Othent" if using Othent
              OthentSub: null // Only if using Othent authentication
            }
          };

          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
          }

          const apiData = await response.json();
          
          // Format response according to test mode requirements
          let formattedData = apiData;
          if (testMode && apiData) {
            formattedData = {
              InferenceResult: {
                output: apiData.croppedInference || apiData.output || apiData.inference,
                traits: apiData.traitResult || apiData.traits || apiData.personalityData
              }
            };
          }
          
          setApiResponse(formattedData);
          return {
            ...baseResult,
            apiResponse: formattedData,
            success: true
          };
        } catch (error) {
          setApiError(error.message);
          return {
            ...baseResult,
            apiError: error.message,
            success: false
          };
        }
      } else {
        // Auto mode false (default): return API endpoint URL for manual calling
        return {
          ...baseResult,
          success: true,
          message: 'Data request approved. Use the provided API URL to fetch user data.'
        };
      }
    } catch (error) {
      setApiError(`Failed to process request: ${error.message}`);
      return null;
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

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden" style={{ maxHeight: '90vh', height: 'auto' }}>
      <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 4rem)' }}>
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Data Request</h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            Select the data types you'd like to share with <span className="font-medium">{appName}</span>
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-xs sm:text-sm">
            🔒 Your selected data will be securely processed and used only for the intended purpose.
          </p>
        </div>

        {/* Data Types Selection */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          {dataTypes.map((dataType) => {
            const isSelected = selectedData[dataType.id] || false;
            const isRequired = dataType.required;
            
            return (
              <div 
                key={dataType.id}
                className={`flex items-center justify-between p-3 sm:p-4 border rounded-lg transition-colors ${
                  isRequired 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
                onClick={() => handleRowClick(dataType.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xl sm:text-2xl">
                    {dataType.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                      {dataType.name}
                      {isRequired && <span className="text-blue-600 ml-1">*</span>}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">{dataType.description}</p>
                  </div>
                </div>
                
                {/* Toggle Switch or Required Badge */}
                {isRequired ? (
                  <div className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
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

        {/* Selection Summary */}
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-xs sm:text-sm">
            ✅ {selectedCount} data type{selectedCount > 1 ? 's' : ''} selected for sharing
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
            {isSubmitting ? 'Processing...' : `Share ${selectedCount} data type${selectedCount > 1 ? 's' : ''}`}
          </button>
          
          <button
            type="button"
            onClick={() => onComplete({ selectedData: {}, cancelled: true })}
            className="w-full py-2 text-gray-500 hover:text-gray-700 text-xs sm:text-sm"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
} 
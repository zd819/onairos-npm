import React, { useState } from 'react';

const dataTypes = [
  { 
    id: 'basic', 
    name: 'Basic Information', 
    description: 'Name, email, and essential account details', 
    icon: '👤',
    required: true // Cannot be deselected
  },
  { 
    id: 'memories', 
    name: 'Memories', 
    description: 'Preferences and interests', 
    icon: '🧠',
    required: false
  }
];

export default function DataRequest({ 
  onComplete, 
  userEmail, 
  appName = 'App', 
  autoFetch = true 
}) {
  const [selectedData, setSelectedData] = useState({
    basic: true, // Always selected by default
    memories: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);

  const handleDataToggle = (dataId) => {
    // Don't allow toggling basic information (it's required)
    if (dataId === 'basic') return;
    
    setSelectedData(prev => ({
      ...prev,
      [dataId]: !prev[dataId]
    }));
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

  const makeApiCall = async (approvedData) => {
    try {
      setIsLoadingApi(true);
      setApiError(null);
      
      const userHash = generateUserHash(userEmail);
      
      const response = await fetch('https://api2.onairos.uk/inferenceTest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvedData,
          userEmail,
          userHash, // Add user hash for backend LLM SDK
          appName,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Ensure user hash is included in response
      const responseWithHash = {
        ...data,
        userHash
      };
      
      setApiResponse(responseWithHash);
      return responseWithHash;
    } catch (error) {
      console.error('API call error:', error);
      setApiError(error.message);
      throw error;
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleApprove = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const approved = Object.entries(selectedData)
        .filter(([_, isSelected]) => isSelected)
        .map(([dataId]) => dataId);

      const userHash = generateUserHash(userEmail);

      const baseResult = {
        approved: true,
        dataTypes: approved,
        timestamp: new Date().toISOString(),
        userEmail: userEmail,
        userHash: userHash, // Include user hash in response
        appName: appName
      };

      let finalResult = baseResult;

      // If autoFetch is enabled, make API call automatically
      if (autoFetch) {
        try {
          const apiData = await makeApiCall(approved);
          finalResult = {
            ...baseResult,
            apiResponse: apiData,
            apiUrl: 'https://api2.onairos.uk/inferenceTest'
          };
        } catch (apiError) {
          finalResult = {
            ...baseResult,
            apiError: apiError.message,
            apiUrl: 'https://api2.onairos.uk/inferenceTest'
          };
        }
      }

      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      onComplete(finalResult);
    } catch (error) {
      console.error('Error in handleApprove:', error);
      setApiError('Failed to process request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    onComplete({
      approved: false,
      dataTypes: [],
      timestamp: new Date().toISOString(),
      userEmail: userEmail,
      userHash: generateUserHash(userEmail),
      appName: appName
    });
  };

  const selectedCount = Object.values(selectedData).filter(Boolean).length;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden" style={{ maxHeight: '90vh', height: 'auto' }}>
      <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 4rem)' }}>
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Data Access Request</h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            <span className="font-medium">{appName}</span> would like to access some of your data.
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
                  isRequired ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
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
                    onClick={() => handleDataToggle(dataType.id)}
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
        <div className="flex space-x-3">
          <button
            onClick={handleReject}
            disabled={isSubmitting}
            className="flex-1 py-2 sm:py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            Deny
          </button>
          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1 py-2 sm:py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            {isSubmitting ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
} 
import React, { useState } from 'react';
import { Shield, Check, X, Database } from 'lucide-react';

export default function DataRequest({ onComplete, userEmail, requestData }) {
  const [selectedData, setSelectedData] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Default data types if none provided
  const defaultDataTypes = [
    {
      id: 'basic',
      name: 'Basic Profile',
      description: 'Name, email, and basic preferences',
      required: true
    },
    {
      id: 'preferences',
      name: 'User Preferences',
      description: 'App settings and customization preferences',
      required: false
    },
    {
      id: 'usage',
      name: 'Usage Analytics',
      description: 'How you interact with the application',
      required: false
    }
  ];

  const dataTypes = requestData?.dataTypes || defaultDataTypes;

  const handleDataToggle = (dataId) => {
    const dataType = dataTypes.find(d => d.id === dataId);
    if (dataType?.required) return; // Can't toggle required data

    setSelectedData(prev => ({
      ...prev,
      [dataId]: !prev[dataId]
    }));
  };

  const handleApprove = async () => {
    setIsProcessing(true);

    // Include all required data and selected optional data
    const approvedData = dataTypes
      .filter(dataType => dataType.required || selectedData[dataType.id])
      .map(dataType => dataType.id);

    // Simulate API call
    setTimeout(() => {
      onComplete({
        approved: true,
        dataTypes: approvedData,
        email: userEmail,
        timestamp: new Date().toISOString()
      });
    }, 2000);
  };

  const handleReject = () => {
    onComplete({
      approved: false,
      email: userEmail,
      timestamp: new Date().toISOString()
    });
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center space-y-6 p-6 w-full">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
          <Database className="w-8 h-8 text-blue-600" />
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Request</h2>
          <p className="text-gray-600">Setting up your data permissions...</p>
        </div>

        <div className="w-8 h-8">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-6 w-full">
      <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
        <Shield className="w-8 h-8 text-green-600" />
      </div>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Access Request</h2>
        <p className="text-gray-600">Choose what data you'd like to share</p>
        <p className="text-sm text-gray-500 mt-1">Signed in as: {userEmail}</p>
      </div>

      <div className="w-full max-w-md space-y-3">
        {dataTypes.map((dataType) => (
          <div
            key={dataType.id}
            className={`border rounded-lg p-4 ${
              dataType.required 
                ? 'border-blue-200 bg-blue-50' 
                : selectedData[dataType.id] 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-medium text-gray-900">{dataType.name}</h3>
                  {dataType.required && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{dataType.description}</p>
              </div>
              
              <button
                onClick={() => handleDataToggle(dataType.id)}
                disabled={dataType.required}
                className={`ml-3 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  dataType.required || selectedData[dataType.id]
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 bg-white hover:border-green-500'
                } ${dataType.required ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {(dataType.required || selectedData[dataType.id]) && (
                  <Check size={14} className="text-white" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md">
        <div className="flex items-start">
          <Shield className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm text-blue-700 font-medium">Your data is secure</p>
            <p className="text-xs text-blue-600 mt-1">
              We use industry-standard encryption and never share your data with third parties.
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 w-full max-w-md">
        <button
          onClick={handleReject}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center"
        >
          <X size={16} className="mr-1" />
          Deny
        </button>
        <button
          onClick={handleApprove}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
        >
          <Check size={16} className="mr-1" />
          Approve
        </button>
      </div>

      <p className="text-xs text-gray-500 max-w-md text-center">
        You can change these permissions anytime in your account settings.
      </p>
    </div>
  );
} 
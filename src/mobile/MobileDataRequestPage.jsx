import React, { useState, useEffect, useRef } from 'react';
import MobileIndividualConnection from './components/MobileIndividualConnection';

/**
 * MobileDataRequestPage Component
 * Mobile-optimized version of DataRequestPage for React Native environment
 */
const MobileDataRequestPage = ({ 
  requestData = {}, 
  dataRequester = 'App', 
  proofMode = false, 
  domain = '',
  onComplete,
  onCancel
}) => {
  const [loading, setLoading] = useState(true);
  const [activeModels, setActiveModels] = useState([]);
  const [granted, setGranted] = useState(0);
  const [allowSubmit, setAllowSubmit] = useState(false);
  const selectedConnections = useRef([]);
  
  // Update allowSubmit when granted changes
  useEffect(() => {
    setAllowSubmit(granted > 0);
  }, [granted]);

  // Simulate loading data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set sample data for mobile
        setActiveModels(requestData?.activeModels || ['Personality', 'Demographics']);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, [requestData]);

  /**
   * Reject all data requests
   */
  function rejectDataRequest() {
    if (onCancel && typeof onCancel === 'function') {
      onCancel();
    }
  }

  /**
   * Send the selected data requests to the parent window
   */
  function sendDataRequest() {
    if (granted === 0) {
      rejectDataRequest();
      return;
    }
    
    // Create API response with the updated URL
    const apiResponse = {
      success: true,
      apiUrl: "https://api2.onairos.uk/inferenceTest",
      approvedRequests: selectedConnections.current
    };
    
    // Call onComplete with API response
    if (onComplete && typeof onComplete === 'function') {
      onComplete(apiResponse);
    }
  }

  /**
   * Update the granted count
   */
  function changeGranted(plusMinus) {
    setGranted(prev => prev + plusMinus);
  }

  /**
   * Handle selection of a connection/data request
   */
  function handleConnectionSelection(dataRequester, modelType, index, title, reward, isSelected) {
    const newDate = new Date();
    const newConnection = {
      requester: dataRequester,
      date: newDate.toISOString(),
      name: title,
      reward: reward,
      data: modelType
    };

    if (isSelected) {
      // Add to selected connections if not already present
      if (!selectedConnections.current.find(connection => 
        connection.requester === dataRequester && connection.data === modelType)) {
        selectedConnections.current = [...selectedConnections.current, newConnection];
      }
    } else {
      // Remove from selected connections
      selectedConnections.current = selectedConnections.current.filter(
        connection => !(connection.requester === dataRequester && connection.data === modelType)
      );
    }
  }

  // Main render
  if (loading) {
    return (
      <div className="mobile-loading-container">
        <div className="mobile-loading-spinner"></div>
        <p className="mobile-loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mobile-data-request-container" style={{ height: '60vh' }}>
      <div className="mobile-data-request-header">
        <h2 className="mobile-data-request-title">Data Requests from {dataRequester}</h2>
        
        <div className="mobile-data-request-button-row">
          <button
            className="mobile-reject-button"
            onClick={rejectDataRequest}
          >
            Reject All
          </button>
          
          <button
            className="mobile-confirm-button"
            disabled={!allowSubmit}
            onClick={sendDataRequest}
          >
            Confirm ({granted})
          </button>
        </div>
      </div>

      <div className="mobile-data-request-content">
        {activeModels.length === 0 ? (
          <div className="mobile-no-models-message">
            <p>
              Please connect Onairos Personality to send {dataRequester} your data
            </p>
          </div>
        ) : (
          <div className="mobile-connections-list">
            {Object.keys(requestData)
              .filter(key => requestData[key])
              .map((key, index) => {
                const product = requestData[key];
                const active = activeModels.includes(product.type);
                
                return (
                  <MobileIndividualConnection
                    key={key}
                    active={active}
                    title={product.type}
                    id={product}
                    number={index}
                    descriptions={product.descriptions}
                    rewards={product.reward}
                    size={key}
                    changeGranted={changeGranted}
                    onSelectionChange={(isSelected) =>
                      handleConnectionSelection(dataRequester, key, index, product.type, product.reward, isSelected)
                    }
                  />
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileDataRequestPage;

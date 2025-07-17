import React, { useState, useEffect, useRef } from 'react';
import UniversalOnboarding from '../components/UniversalOnboarding.js';
import IndividualConnection from './components/IndividualConnection';
import onairosLogo from './icons/onairos_logo.png';

/**
 * DataRequestPage Component
 * Displays different data requests and handles user interactions
 */
const DataRequestPage = ({ requestData = {}, dataRequester = 'App', proofMode = false, domain = '', appIcon = '' }) => {
  const [loading, setLoading] = useState(true);
  const [activeModels, setActiveModels] = useState([]);
  const [granted, setGranted] = useState(0);
  const [allowSubmit, setAllowSubmit] = useState(false);
  const [userConnections, setUserConnections] = useState(['instagram', 'youtube', 'email']);
  const [selectedRequests, setSelectedRequests] = useState({});
  const selectedConnections = useRef([]);
  const userSub = useRef(null);
  const encryptedUserPin = useRef(null);

  // Update allowSubmit when granted changes
  useEffect(() => {
    if (granted > 0) {
      setAllowSubmit(true);
    } else {
      setAllowSubmit(false);
    }
  }, [granted]);

  // Simulate loading data
  useEffect(() => {
    // In a real implementation, this would fetch active models from a service
    const loadData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sample active models - this would come from your backend
        setActiveModels(['Profile', 'User Memories']);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();

    // Message handler to receive data from parent window
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'dataRequest') {
        // Process received data
        if (event.data.requestData) {
          // Update request data state
        }
        if (event.data.activeModels) {
          setActiveModels(event.data.activeModels);
        }
        if (event.data.userSub) {
          userSub.current = event.data.userSub;
        }
        if (event.data.encryptedUserPin) {
          encryptedUserPin.current = event.data.encryptedUserPin;
        }
      }
    };

    // Add message listener
    window.addEventListener('message', handleMessage);
    
    // Clean up listener
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  /**
   * Reject all data requests
   */
  async function rejectDataRequest() {
    window.top.postMessage({type: 'closeIframe'}, '*');
    window.postMessage({type: 'closeIframe'}, '*');
  }

  /**
   * Send the selected data requests to the parent window
   */
  async function sendDataRequest() {
    if (granted === 0) {
      window.close();
      return;
    } else {
      const SignMessage = {
        message: 'Confirm ' + dataRequester + ' Data Access',
        confirmations: selectedConnections.current
      };
      
      // Send simplified response
      try {
        window.top.postMessage({
          type: 'dataRequestComplete',
          approved: selectedConnections.current,
          message: SignMessage
        }, '*');
        
        window.postMessage({
          type: 'dataRequestComplete',
          approved: selectedConnections.current,
          message: SignMessage
        }, '*');
      } catch (error) {
        console.error("Error sending data request:", error);
        window.close();
      }
    }
  }

  /**
   * Update the granted count
   */
  function changeGranted(plusMinus) {
    setGranted(granted + plusMinus);
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
      console.log(`Adding connection: ${JSON.stringify(newConnection)}`);
      if (!selectedConnections.current.find(connection => connection.requester === dataRequester && connection.data === modelType)) {
        selectedConnections.current.push(newConnection);
      }
    } else {
      console.log(`Removing connection for: ${modelType}`);
      selectedConnections.current = selectedConnections.current.filter(
        connection => !(connection.requester === dataRequester && connection.data === modelType)
      );
    }

    console.log('Current selected connections:', selectedConnections.current);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
        </div>
      ) : activeModels.length === 0 ? (
        <UniversalOnboarding 
          appIcon="https://onairos.sirv.com/Images/OnairosBlack.png" 
          appName={dataRequester}
          username={localStorage.getItem("username")}
        />
      ) : (
        <div className="max-w-md mx-auto p-6 space-y-4">
          <header className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <img src={onairosLogo} alt="Onairos Logo" className="w-8 h-8" />
                <div className="text-gray-400 mx-2">→</div>
                {appIcon ? (
                  <img src={appIcon} alt={`${dataRequester} Logo`} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs font-bold">{dataRequester.charAt(0)}</span>
                  </div>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-800">{dataRequester}</h2>
            </div>
            
            <h1 className="text-xl font-bold text-gray-800 mb-4">Data Access Request</h1>
            <p className="text-gray-600 mb-6">Select the data you want to share with {dataRequester}</p>
            
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={rejectDataRequest}
                className="border w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Decline
              </button>
              <button
                disabled={!allowSubmit}
                onClick={sendDataRequest}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Approve {granted > 0 && `(${granted})`}
              </button>
            </div>
          </header>

          <div className="space-y-3">
            {/* Only show Profile and User Memories */}
            {['Profile', 'User Memories'].map((dataType, index) => {
              const key = dataType.toLowerCase().replace(' ', '_');
              const product = {
                type: dataType,
                descriptions: dataType === 'Profile' ? 
                  'Basic profile information and preferences' : 
                  'Your personal context and memory data',
                reward: dataType === 'Profile' ? 
                  'Personalized experience' : 
                  'Contextual understanding of your preferences'
              };
              
              return (
                <IndividualConnection
                  key={key}
                  active={true}
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
            
            {/* User Connections Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Connected Services</h3>
              <div className="flex items-center space-x-3">
                {userConnections.map((connection, index) => {
                  const getConnectionIcon = (type) => {
                    switch(type) {
                      case 'instagram':
                        return (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 flex items-center justify-center">
                            <span className="text-white text-xs">IG</span>
                          </div>
                        );
                      case 'youtube':
                        return (
                          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                            <span className="text-white text-xs">YT</span>
                          </div>
                        );
                      case 'email':
                        return (
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white text-xs">@</span>
                          </div>
                        );
                      default:
                        return (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 text-xs">{type.charAt(0).toUpperCase()}</span>
                          </div>
                        );
                    }
                  };
                  
                  return (
                    <div key={index} className="flex flex-col items-center">
                      {getConnectionIcon(connection)}
                      <span className="text-xs text-gray-600 mt-1">{connection}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRequestPage;

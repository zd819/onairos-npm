import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button'; // Adjust import path as needed
import LoadingPage from '@/components/LoadingPage'; // Adjust import path as needed
import UniversalOnboarding from '@/components/UniversalOnboarding'; // Adjust import path as needed
import IndividualConnection from './components/IndividualConnection'; // Updated import path
import OnairosWhite from '@/icons/OnairosWhite'; // Adjust import path as needed
import { getAPIAccess } from '../utils/api'; // Adjust import path as needed

/**
 * DataRequestPage Component
 * Displays different data requests and handles user interactions
 */
const DataRequestPage = ({ requestData = {}, dataRequester = 'App', proofMode = false, domain = '' }) => {
  const [loading, setLoading] = useState(true);
  const [activeModels, setActiveModels] = useState([]);
  const [granted, setGranted] = useState(0);
  const [allowSubmit, setAllowSubmit] = useState(false);
  const [avatar, setAvatar] = useState(false);
  const [traits, setTraits] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState({});
  const selectedConnections = useRef([]);
  const hashedOthentSub = useRef(null);
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
        setActiveModels(['Personality']);
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
        if (event.data.hashedOthentSub) {
          hashedOthentSub.current = event.data.hashedOthentSub;
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
    // await RejectDataRequest();
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
      // console.log("User Granted Data Access : ", selectedConnections.current);
      
      // Potentially Sign With Othent
      // chrome.runtime.sendMessage({
      //   source: 'dataRequestPage',
      //   type: 'sign_acccess',
      //   SignMessage: SignMessage,
      //   confirmations: selectedConnections.current
      // }); 
      
      // Reply with API URL and User Authorized Data
      try {
        getAPIAccess({
          proofMode: proofMode, 
          Web3Type: "Othent", 
          Confirmations: selectedConnections.current, 
          EncryptedUserPin: encryptedUserPin.current, 
          Domain: domain, 
          OthentSub: hashedOthentSub.current
        })
        .then((response) => {
          chrome.runtime.sendMessage({
            source: 'dataRequestPage',
            type: 'returnedAPIurl',
            APIurl: response.body.apiUrl,
            accessToken: response.body.token,
            approved: selectedConnections.current,
          }).then(
            (data) => {
              // window.top.postMessage({type: 'closeIframe'}, '*');
              // window.postMessage({type: 'closeIframe'}, '*'); 
            }
          );
        }).finally(() => {
          // window.top.postMessage({type: 'closeIframe'}, '*');
          // window.postMessage({type: 'closeIframe'}, '*');            
        });
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
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <LoadingPage theme="black" />
      ) : (activeModels.length === 0 ? (
        // <NoModelPage />
        <UniversalOnboarding appIcon={OnairosWhite} appName={dataRequester}/>
      ) : (
        <div className="max-w-md mx-auto p-4 space-y-2">
          <header className="border space-y-4 bg-white p-4 rounded-lg outline-2 outline-black/10 shadow-sm">
            <h1 className="text-lg font-bold text-black">Data Requests from {dataRequester}</h1>
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={rejectDataRequest}
                className="border w-full border-2 border-black/10 hover:bg-gray-50 text-black font-medium"
              >
                Reject All
              </Button>
              <Button
                disabled={!allowSubmit}
                onClick={sendDataRequest}
                className="w-full bg-black hover:bg-black/90 text-white font-medium"
              >
                Confirm ({granted})
              </Button>
            </div>
          </header>

          <div className="space-y-2">
            {activeModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 rounded-lg bg-white border-2 border-black/10">
                <img src={OnairosWhite || "/placeholder.svg"} alt="Logo" className="w-20 h-20" />
                <p className="text-center text-sm text-black/70">
                  Please connect{" "}
                  <a href="https://onairos.uk/connections" className="text-black font-medium hover:underline">
                    Onairos
                  </a>{" "}
                  Personality to send {dataRequester} your data
                </p>
              </div>
            ) : (
              Object.keys(requestData)
                .sort((a, b) => {
                  const aIsActive = activeModels.includes(requestData[a].type)
                  const bIsActive = activeModels.includes(requestData[b].type)

                  if (requestData[a].type === "Avatar") return 1
                  if (requestData[b].type === "Avatar") return -1
                  if (requestData[b].type === "Traits") return 1
                  if (requestData[a].type === "Traits") return -1
                  if (aIsActive && !bIsActive) return -1
                  if (bIsActive && !aIsActive) return 1
                  return 0
                })
                .map((key, index) => {
                  const product = requestData[key]
                  const active =
                    product.type === "Personality"
                      ? activeModels.includes(product.type)
                      : product.type === "Avatar"
                        ? avatar
                        : product.type === "Traits"
                          ? traits
                          : false
                  return (
                    <IndividualConnection
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
                  )
                })
            )}
          </div>
        </div>)
      )}
    </div>
  );
};

export default DataRequestPage;

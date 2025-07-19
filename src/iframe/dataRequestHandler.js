/**
 * Data Request Popup Handler
 * This module manages the creation and display of the data request popup window
 * that properly displays without being cut off.
 */

/**
 * Gets the URL for the popup HTML file
 * Works in both extension and web contexts
 */
function getPopupUrl() {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime.getURL('data_request_popup.html');
  }
  
  // For web context, try multiple possible paths
  const baseUrl = window.location.origin;
  const isNextJs = typeof window !== 'undefined' && window.__NEXT_DATA__;
  
  if (isNextJs) {
    // In Next.js, use the _next/static path
    return `${baseUrl}/_next/static/data_request_popup.html`;
  }
  
  // For npm package usage, try to find the popup file in common locations
  const possiblePaths = [
    `${baseUrl}/node_modules/onairos/dist/data_request_popup.html`,
    `${baseUrl}/static/data_request_popup.html`,
    `${baseUrl}/public/data_request_popup.html`,
    `${baseUrl}/data_request_popup.html`
  ];
  
  // Return the first path (most likely for npm package usage)
  return possiblePaths[0];
}

/**
 * Creates popup content dynamically as fallback
 */
function createDynamicPopupContent(data) {
  const { requestData = [], webpageName = 'App', userData = {}, autoFetch = false, testMode = false, appIcon = null } = data;
  
  const defaultDataTypes = [
    { id: 'basic', name: 'Basic Info', description: 'Essential profile information and account details', icon: '👤' },
    { id: 'personality', name: 'Personality', description: 'Personality traits, behavioral patterns and insights', icon: '🧠' },
    { id: 'preferences', name: 'Preferences', description: 'User preferences, settings and choices', icon: '⚙️' }
  ];

  const dataTypes = Array.isArray(requestData) && requestData.length > 0
    ? requestData.map(id => defaultDataTypes.find(dt => dt.id === id) || { id, name: id, description: `${id} data`, icon: '📋' })
    : defaultDataTypes;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onairos Data Request</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #f9fafb;
        }
    </style>
</head>
<body>
    <div class="min-h-screen bg-gray-50 py-8 px-4">
        <div class="max-w-md mx-auto bg-white rounded-lg shadow-lg">
            <div class="p-6">
                <div class="text-center mb-6">
                    <div class="flex items-center justify-center space-x-2 mb-4">
                        <img src="https://onairos.sirv.com/Images/OnairosBlack.png" alt="Onairos Logo" class="w-8 h-8">
                        <div class="text-gray-400 mx-2">→</div>
                        ${appIcon ? `<img src="${appIcon}" alt="${webpageName} Logo" class="w-8 h-8 rounded-full">` : 
                          `<div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"><span class="text-gray-600 text-xs font-bold">${webpageName.charAt(0)}</span></div>`}
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Data Request</h2>
                    <p class="text-gray-600">${webpageName} is requesting access to your data</p>
                </div>
                
                <div class="space-y-4 mb-6" id="dataTypes">
                    ${dataTypes.map(type => `
                        <label class="group relative flex items-start p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md data-option">
                            <div class="flex items-center h-5">
                                <input type="checkbox" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" data-id="${type.id}">
                            </div>
                            <div class="ml-4 flex-1">
                                <div class="flex items-center mb-2">
                                    <span class="text-2xl mr-3 group-hover:scale-110 transition-transform duration-200">${type.icon}</span>
                                    <span class="font-semibold text-gray-900 text-lg">${type.name}</span>
                                </div>
                                <p class="text-sm text-gray-600 leading-relaxed">${type.description}</p>
                            </div>
                            <div class="absolute top-4 right-4 w-6 h-6 border-2 rounded-md transition-all duration-200 bg-white checkbox-visual" data-for="${type.id}">
                                <svg class="w-4 h-4 text-white checkmark-icon" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                        </label>
                    `).join('')}
                </div>
                
                <div class="flex space-x-4">
                    <button id="rejectBtn" class="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:ring-2 focus:ring-gray-300">
                        <span class="flex items-center justify-center">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            Decline
                        </span>
                    </button>
                    <button id="approveBtn" class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl focus:ring-2 focus:ring-blue-500">
                        <span class="flex items-center justify-center">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Allow Access
                        </span>
                    </button>
                </div>
                
                <div id="status" class="mt-4 text-center text-sm text-gray-600"></div>
            </div>
        </div>
    </div>

    <style>
        /* Enhanced checkbox styling */
        .checkbox-visual {
            border-color: #d1d5db;
        }
        .checkbox-visual.checked {
            background-color: #2563eb;
            border-color: #2563eb;
        }
        .checkbox-visual.checked .checkmark-icon {
            opacity: 1;
        }
        .checkbox-visual:not(.checked) .checkmark-icon {
            opacity: 0;
        }
        .data-option {
            transition: all 0.2s ease;
        }
        .data-option.selected {
            border-color: #3b82f6;
            background-color: #eff6ff;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
    </style>

    <script>
        const approveBtn = document.getElementById('approveBtn');
        const rejectBtn = document.getElementById('rejectBtn');
        const status = document.getElementById('status');
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        
        // Update visual feedback for checkboxes
        function updateCheckboxVisual(checkbox) {
            const checkboxId = checkbox.dataset.id;
            const visualCheckbox = document.querySelector(\`[data-for="\${checkboxId}"]\`);
            const parentLabel = checkbox.closest('label');
            
            if (checkbox.checked) {
                visualCheckbox?.classList.add('checked');
                parentLabel?.classList.add('selected');
            } else {
                visualCheckbox?.classList.remove('checked');
                parentLabel?.classList.remove('selected');
            }
        }
        
        // Add event listeners to checkboxes
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => updateCheckboxVisual(checkbox));
            // Initialize visual state
            updateCheckboxVisual(checkbox);
        });
        
        const autoFetch = ${autoFetch};
        const testMode = ${testMode};
        const userEmail = '${userData.email || ''}';
        const appName = '${webpageName}';
        
        // Map frontend data types to backend confirmation types
        function mapDataTypesToConfirmations(approvedData) {
            const confirmations = [];
            const currentDate = new Date().toISOString();
            
            // Map frontend types to backend types
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
        }
        
        // Determine API endpoint based on test mode
        const apiEndpoint = testMode 
            ? 'https://api2.onairos.uk/inferenceTest'
            : 'https://api2.onairos.uk/getAPIurlMobile';
        
        async function makeApiCall(approvedData) {
            const confirmations = mapDataTypesToConfirmations(approvedData);
            
            // Format request according to backend expectations
            const requestBody = testMode ? {
                // Test mode: simple format for testing
                approvedData,
                userEmail,
                appName,
                timestamp: new Date().toISOString(),
                testMode: testMode
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(\`API call failed with status: \${response.status}\`);
            }
            
            const data = await response.json();
            
            // Format response according to test mode requirements
            if (testMode && data) {
                return {
                    InferenceResult: {
                        output: data.croppedInference || data.output || data.inference,
                        traits: data.traitResult || data.traits || data.personalityData
                    }
                };
            }
            
            return data;
        }
        
        approveBtn.addEventListener('click', async () => {
            const approved = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.dataset.id);
                
            if (approved.length === 0) {
                alert('Please select at least one data type to continue.');
                return;
            }
            
            approveBtn.disabled = true;
            status.textContent = 'Processing...';
            
            const baseResult = {
                type: 'dataRequestComplete',
                source: 'onairosPopup',
                approved: approved,
                timestamp: new Date().toISOString(),
                userEmail: userEmail,
                appName: appName,
                testMode: testMode
            };
            
            let finalResult = baseResult;
            
            if (autoFetch) {
                // Auto mode true: make API request and return results
                try {
                    status.textContent = 'Making API call...';
                    const apiData = await makeApiCall(approved);
                    finalResult = {
                        ...baseResult,
                        apiResponse: apiData,
                        apiUrl: apiEndpoint,
                        success: true
                    };
                } catch (error) {
                    finalResult = {
                        ...baseResult,
                        apiError: error.message,
                        apiUrl: apiEndpoint,
                        success: false
                    };
                }
            } else {
                // Auto mode false (default): return API endpoint URL for manual calling
                finalResult = {
                    ...baseResult,
                    apiUrl: apiEndpoint,
                    success: true,
                    message: 'Data request approved. Use the provided API URL to fetch user data.'
                };
            }
            
            window.opener.postMessage(finalResult, '*');
            setTimeout(() => window.close(), 1000);
        });
        
        rejectBtn.addEventListener('click', () => {
            window.opener.postMessage({
                type: 'dataRequestComplete',
                source: 'onairosPopup',
                approved: false,
                dataTypes: [],
                timestamp: new Date().toISOString(),
                userEmail: userEmail,
                appName: appName
            }, '*');
            window.close();
        });
    </script>
</body>
</html>`;
}

/**
 * Opens a data request popup window positioned optimally on screen
 * @param {Object} data - Initial data to send to the popup
 * @returns {Window|null} The opened window or null if failed
 */
export function openDataRequestPopup(data = {}) {
  try {
    const popupUrl = getPopupUrl();
    console.log('🔥 Opening popup with URL:', popupUrl);
    
    // Calculate optimal position - center but avoid being cut off
    const width = 450;
    const height = 700;
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    
    // Ensure popup fits within screen bounds
    const left = Math.max(0, (screenWidth - width) / 2);
    const top = Math.max(0, (screenHeight - height) / 2);

    // Try to open popup with HTML file first
    let popupWindow = window.open(
      popupUrl,
      'OnairosDataRequest',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no,location=no,toolbar=no,menubar=no`
    );

    if (!popupWindow) {
      throw new Error('Failed to open popup - popup blocked');
    }

    // Check if popup loaded successfully, if not use fallback
    const checkPopupLoaded = () => {
      try {
        // Try to access popup document
        if (popupWindow.document && popupWindow.document.readyState === 'complete') {
          // Popup loaded successfully, send data
          if (data && Object.keys(data).length > 0) {
            console.log('🔥 Sending data to popup:', data);
            sendDataToPopup(popupWindow, data);
          }
        } else {
          setTimeout(checkPopupLoaded, 100);
        }
      } catch (error) {
        // Cross-origin or loading error, use fallback
        console.log('🔥 Popup loading failed, using dynamic content fallback');
        useDynamicPopupFallback(popupWindow, data);
      }
    };

    // Start checking if popup loaded
    setTimeout(checkPopupLoaded, 500);

    // Ensure popup is brought to focus
    popupWindow.focus();

    return popupWindow;
  } catch (error) {
    console.error('Error opening popup:', error);
    // Show user-friendly error message
    alert('Unable to open Onairos popup. Please ensure popups are allowed for this site.');
    return null;
  }
}

/**
 * Fallback method to create popup content dynamically
 */
function useDynamicPopupFallback(popupWindow, data) {
  try {
    const dynamicContent = createDynamicPopupContent(data);
    popupWindow.document.open();
    popupWindow.document.write(dynamicContent);
    popupWindow.document.close();
    console.log('🔥 Dynamic popup content created successfully');
  } catch (error) {
    console.error('🔥 Failed to create dynamic popup content:', error);
  }
}

/**
 * Closes the data request popup window if it's open
 * @param {Window} windowRef - Reference to the window object returned by openDataRequestPopup
 */
export function closeDataRequestPopup(windowRef) {
  if (windowRef && !windowRef.closed) {
    try {
      windowRef.close();
      window.postMessage({ action: 'popupClosed' }, '*');
    } catch (error) {
      console.error('Error closing popup:', error);
    }
  }
}

/**
 * Send data to the popup window with timeout and retry logic
 * @param {Window} windowRef - Reference to the window object
 * @param {Object} data - Data to send to the popup
 * @returns {Promise} Promise that resolves when data is sent or rejects on timeout
 */
export function sendDataToPopup(windowRef, data) {
  return new Promise((resolve, reject) => {
    if (!windowRef || windowRef.closed) {
      reject(new Error('Popup window is not available'));
      return;
    }

    let retries = 0;
    const maxRetries = 3;
    
    const sendWithRetry = () => {
      try {
        console.log('🔥 Sending message to popup:', { type: 'dataRequest', ...data });
        windowRef.postMessage({ 
          type: 'dataRequest',
          ...data,
          timestamp: Date.now()
        }, '*');
        
        // Set timeout for response
        const timeout = setTimeout(() => {
          if (retries < maxRetries) {
            retries++;
            console.log(`🔥 Retrying send (attempt ${retries})`);
            sendWithRetry();
          } else {
            console.log('🔥 Timeout waiting for popup response');
            reject(new Error('Timeout waiting for popup response'));
          }
        }, 2000);

        // Listen for acknowledgment
        const messageHandler = (event) => {
          if (event.data && event.data.action === 'dataReceived') {
            console.log('🔥 Received acknowledgment from popup');
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            resolve();
          }
        };

        window.addEventListener('message', messageHandler);
      } catch (error) {
        reject(error);
      }
    };
    
    sendWithRetry();
  });
}

/**
 * Set up a listener for messages from the popup with autoFetch support
 * @param {Function} callback - Function to handle messages from the popup
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Whether to automatically make API calls
 * @param {Function} options.onApiResponse - Callback for API responses
 * @returns {Function} Cleanup function to remove the listener
 */
export function listenForPopupMessages(callback, options = {}) {
  const { autoFetch = true, onApiResponse } = options;
  
  const messageHandler = async (event) => {
    console.log('🔥 Received message from popup:', event.data);
    
    if (event.data && event.data.source === 'onairosPopup') {
      // Handle data request completion
      if (event.data.type === 'dataRequestComplete') {
        console.log('🔥 Data request completed:', event.data);
        
        // Note: API call is already made in the popup when autoFetch is true
        // The popup sends the result with apiResponse or apiError already included
        callback(event.data);
      } else {
        callback(event.data);
      }
    }
  };

  console.log('🔥 Setting up popup message listener');
  window.addEventListener('message', messageHandler);
  
  // Return cleanup function
  return () => {
    console.log('🔥 Cleaning up popup message listener');
    window.removeEventListener('message', messageHandler);
  };
}

/**
 * Make API call with user's approved data
 * @param {Array} approvedData - Array of approved data types
 * @param {Object} options - API call options
 * @param {string} options.apiUrl - API endpoint URL
 * @param {boolean} options.testMode - Whether to use test mode
 * @param {string} options.userEmail - User email
 * @param {string} options.appName - App name
 * @returns {Promise} Promise resolving to API response
 */
async function makeApiCall(approvedData, options = {}) {
  const { 
    apiUrl = 'https://api2.onairos.uk/getAPIurlMobile', 
    testMode = false, 
    userEmail = '', 
    appName = 'App' 
  } = options;

  try {
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

    const endpoint = testMode 
      ? 'https://api2.onairos.uk/inferenceTest'
      : apiUrl;

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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Format response according to test mode requirements
    if (testMode && data) {
      return {
        InferenceResult: {
          output: data.croppedInference || data.output || data.inference,
          traits: data.traitResult || data.traits || data.personalityData
        }
      };
    }
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

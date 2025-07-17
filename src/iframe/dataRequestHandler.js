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
  const { requestData = [], webpageName = 'App', userData = {}, autoFetch = true, appIcon = null } = data;
  
  const defaultDataTypes = [
    { id: 'email', name: 'Email Address', description: 'Your email for account identification', icon: '📧' },
    { id: 'profile', name: 'Profile Information', description: 'Basic profile data and preferences', icon: '👤' },
    { id: 'social', name: 'Social Connections', description: 'Connected social media accounts', icon: '🌐' },
    { id: 'activity', name: 'Activity Data', description: 'Usage patterns and interactions', icon: '📊' },
    { id: 'preferences', name: 'User Preferences', description: 'Settings and customization choices', icon: '⚙️' }
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
                
                <div class="space-y-3 mb-6" id="dataTypes">
                    ${dataTypes.map(type => `
                        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" class="mr-3" data-id="${type.id}">
                            <div class="flex-1">
                                <div class="flex items-center">
                                    <span class="text-xl mr-2">${type.icon}</span>
                                    <span class="font-medium">${type.name}</span>
                                </div>
                                <p class="text-sm text-gray-600 mt-1">${type.description}</p>
                            </div>
                        </label>
                    `).join('')}
                </div>
                
                <div class="flex space-x-3">
                    <button id="rejectBtn" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                        Reject
                    </button>
                    <button id="approveBtn" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Approve
                    </button>
                </div>
                
                <div id="status" class="mt-4 text-center text-sm text-gray-600"></div>
            </div>
        </div>
    </div>

    <script>
        const approveBtn = document.getElementById('approveBtn');
        const rejectBtn = document.getElementById('rejectBtn');
        const status = document.getElementById('status');
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        
        const autoFetch = ${autoFetch};
        const userEmail = '${userData.email || ''}';
        const appName = '${webpageName}';
        
        async function makeApiCall(approvedData) {
            const response = await fetch('https://api2.onairos.uk/inferenceTest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approvedData,
                    userEmail,
                    appName,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(\`API call failed with status: \${response.status}\`);
            }
            
            return await response.json();
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
                appName: appName
            };
            
            let finalResult = baseResult;
            
            if (autoFetch) {
                try {
                    status.textContent = 'Making API call...';
                    const apiData = await makeApiCall(approved);
                    finalResult = {
                        ...baseResult,
                        apiResponse: apiData,
                        apiUrl: 'https://api2.onairos.uk/inferenceTest'
                    };
                } catch (error) {
                    finalResult = {
                        ...baseResult,
                        apiError: error.message,
                        apiUrl: 'https://api2.onairos.uk/inferenceTest'
                    };
                }
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
 * @param {string} apiUrl - API endpoint URL
 * @returns {Promise} Promise resolving to API response
 */
async function makeApiCall(approvedData, apiUrl = 'https://api2.onairos.uk/inferenceTest') {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approvedData,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

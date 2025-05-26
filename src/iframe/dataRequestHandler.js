/**
 * Data Request Iframe Handler
 * This module manages the creation and display of the data request iframe
 * in the center of the screen.
 */

/**
 * Gets the URL for the iframe HTML file
 * Works in both extension and web contexts
 */
function getIframeUrl() {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime.getURL('data_request_iframe.html');
  }
  
  // For web context, use dynamic path resolution
  const baseUrl = window.location.origin;
  const isNextJs = typeof window !== 'undefined' && window.__NEXT_DATA__;
  
  if (isNextJs) {
    // In Next.js, use the _next/static path
    return `${baseUrl}/_next/static/data_request_iframe.html`;
  }
  
  // For regular web context, use relative path
  return `${baseUrl}/data_request_iframe.html`;
}

/**
 * Opens a data request iframe in a new window positioned in the center of the screen
 * @returns {Window|null} The opened window or null if failed
 */
export function openDataRequestIframe() {
  try {
    const iframeUrl = getIframeUrl();
    
    // Calculate center position
    const width = 400;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    // Open a new window
    const newWindow = window.open(
      iframeUrl,
      'Onairos Terminal',
      `width=${width},height=${height},top=${top},left=${left},resizable=no,scrollbars=no,status=no,location=no,toolbar=no`
    );

    if (!newWindow) {
      throw new Error('Failed to open window - popup blocked');
    }

    // Set some basic styles for the popup window
    newWindow.document.body.style.margin = '0';
    newWindow.document.body.style.padding = '0';
    newWindow.document.body.style.overflow = 'hidden';

    // Add event listener for window close
    newWindow.addEventListener('beforeunload', () => {
      window.postMessage({ action: 'terminalClosed' }, '*');
    });

    return newWindow;
  } catch (error) {
    console.error('Error opening iframe:', error);
    // Show user-friendly error message
    alert('Unable to open Onairos Terminal. Please ensure popups are allowed for this site.');
    return null;
  }
}

/**
 * Closes the data request iframe window if it's open
 * @param {Window} windowRef - Reference to the window object returned by openDataRequestIframe
 */
export function closeDataRequestIframe(windowRef) {
  if (windowRef && !windowRef.closed) {
    try {
      windowRef.close();
      window.postMessage({ action: 'terminalClosed' }, '*');
    } catch (error) {
      console.error('Error closing iframe:', error);
    }
  }
}

/**
 * Send data to the iframe window with timeout
 * @param {Window} windowRef - Reference to the window object returned by openDataRequestIframe
 * @param {Object} data - Data to send to the iframe
 * @returns {Promise} Promise that resolves when data is sent or rejects on timeout
 */
export function sendDataToIframe(windowRef, data) {
  return new Promise((resolve, reject) => {
    if (!windowRef || windowRef.closed) {
      reject(new Error('Iframe window is not available'));
      return;
    }

    try {
      windowRef.postMessage(data, '*');
      
      // Set timeout for response
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for iframe response'));
      }, 5000);

      // Listen for acknowledgment
      const messageHandler = (event) => {
        if (event.data && event.data.action === 'dataReceived') {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          resolve();
        }
      };

      window.addEventListener('message', messageHandler);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Set up a listener for messages from the iframe
 * @param {Function} callback - Function to handle messages from the iframe
 * @returns {Function} Cleanup function to remove the listener
 */
export function listenForIframeMessages(callback) {
  const messageHandler = (event) => {
    if (event.data && event.data.source === 'onairosIframe') {
      callback(event.data);
    }
  };

  window.addEventListener('message', messageHandler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('message', messageHandler);
  };
}

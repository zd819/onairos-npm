"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.closeDataRequestIframe = closeDataRequestIframe;
exports.listenForIframeMessages = listenForIframeMessages;
exports.openDataRequestIframe = openDataRequestIframe;
exports.sendDataToIframe = sendDataToIframe;
/**
 * Data Request Iframe Handler
 * This module manages the creation and display of the data request iframe
 * in the top right corner of the screen.
 */

/**
 * Gets the URL for the iframe HTML file
 * Works in both extension and web contexts
 */
function getIframeUrl() {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime.getURL('data_request_iframe.html');
  }
  // For web context, use relative path
  return '/data_request_iframe.html';
}

/**
 * Opens a data request iframe in a new window positioned in the top right corner of the screen
 * @returns {Window|null} The opened window or null if failed
 */
function openDataRequestIframe() {
  try {
    // Create iframe element
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', getIframeUrl());
    iframe.setAttribute('title', 'Onairos Terminal');
    iframe.classList.add('iframe-class');

    // Style the iframe
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.style.backgroundColor = 'transparent';

    // Calculate position (top right corner)
    const width = 400;
    const height = 600;
    const top = 10;
    const left = window.innerWidth - width - 10;

    // Open a new window and append the iframe to it
    const newWindow = window.open(getIframeUrl(), 'Onairos Terminal', `width=${width},height=${height},top=${top},left=${left},resizable=no`);
    if (!newWindow) {
      throw new Error('Failed to open window - popup blocked');
    }

    // Set some basic styles for the popup window
    newWindow.document.body.style.margin = '0';
    newWindow.document.body.style.padding = '0';
    newWindow.document.body.style.overflow = 'hidden';

    // Add event listener for window close
    newWindow.addEventListener('beforeunload', () => {
      window.postMessage({
        action: 'terminalClosed'
      }, '*');
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
function closeDataRequestIframe(windowRef) {
  if (windowRef && !windowRef.closed) {
    try {
      windowRef.close();
      window.postMessage({
        action: 'terminalClosed'
      }, '*');
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
function sendDataToIframe(windowRef, data) {
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
      const messageHandler = event => {
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
function listenForIframeMessages(callback) {
  const messageHandler = event => {
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
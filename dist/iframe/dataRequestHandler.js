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
 * Opens a data request iframe in a new window positioned in the top right corner of the screen
 * This will replace the current window.message approach for data requests
 */
function openDataRequestIframe() {
  // Notify that the terminal has been opened (will be used for internal tracking)
  window.postMessage({
    action: 'terminalOpened'
  }, '*');

  // Create iframe element
  const iframe = document.createElement('iframe');
  iframe.setAttribute('src', chrome.runtime.getURL('data_request_iframe.html'));
  iframe.setAttribute('title', 'Onairos Terminal');
  iframe.classList.add('iframe-class');

  // Style the iframe
  iframe.style.width = '100%';
  iframe.style.height = '600px';
  iframe.style.border = 'none';
  iframe.style.backgroundColor = 'transparent'; // Changed from red to transparent for production

  // Calculate position (top right corner)
  const width = 400;
  const height = 600;
  const top = 10;
  const left = window.innerWidth - width - 10;

  // Open a new window and append the iframe to it
  const newWindow = window.open(chrome.runtime.getURL('data_request_iframe.html'), 'Onairos Terminal', `width=${width},height=${height},top=${top},left=${left},resizable=no`);

  // If window opened successfully, append the iframe
  if (newWindow) {
    // Set some basic styles for the popup window
    newWindow.document.body.style.margin = '0';
    newWindow.document.body.style.padding = '0';
    newWindow.document.body.style.overflow = 'hidden';

    // Add event listener for window close to notify the main application
    newWindow.addEventListener('beforeunload', () => {
      window.postMessage({
        action: 'terminalClosed'
      }, '*');
    });
  } else {
    console.error('Failed to open Onairos Terminal window. Popup might be blocked by the browser.');
    // Fallback: Try to show a notification to the user about enabling popups
    alert('Please allow popups for this site to use the Onairos Terminal.');
  }
  return newWindow;
}

/**
 * Closes the data request iframe window if it's open
 * @param {Window} windowRef - Reference to the window object returned by openDataRequestIframe
 */
function closeDataRequestIframe(windowRef) {
  if (windowRef && !windowRef.closed) {
    windowRef.close();
    window.postMessage({
      action: 'terminalClosed'
    }, '*');
  }
}

/**
 * Send data to the iframe window
 * @param {Window} windowRef - Reference to the window object returned by openDataRequestIframe
 * @param {Object} data - Data to send to the iframe
 */
function sendDataToIframe(windowRef, data) {
  if (windowRef && !windowRef.closed) {
    windowRef.postMessage(data, '*');
  }
}

/**
 * Set up a listener for messages from the iframe
 * @param {Function} callback - Function to handle messages from the iframe
 */
function listenForIframeMessages(callback) {
  window.addEventListener('message', event => {
    // Make sure the message is from our iframe
    if (event.data && event.data.source === 'onairosIframe') {
      callback(event.data);
    }
  });
}
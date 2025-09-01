/**
 * Standalone Onairos Overlay Handler
 * Allows developers to trigger the Onairos flow programmatically without the button component
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { OnairosButton } from '../onairosButton.jsx';
import { formatOnairosResponse } from './responseFormatter.js';

/**
 * Opens the Onairos overlay flow programmatically
 * @param {Object} config - Configuration options
 * @param {Array} config.requestData - Data types to request ['basic', 'personality', 'preferences']
 * @param {string} config.webpageName - Name of your application
 * @param {Function} config.onComplete - Callback function when flow completes
 * @param {boolean} config.autoFetch - Whether to auto-fetch data (default: false)
 * @param {boolean} config.testMode - Whether to use test mode (default: false)
 * @param {string} config.appIcon - URL to your app icon (optional)
 * @param {boolean} config.formatResponse - Whether to format response with dictionary (default: true)
 * @param {Object} config.responseFormat - Response formatting options
 * @returns {Promise<Function>} Promise that resolves to a cleanup function
 */
export async function openOnairosOverlay(config = {}) {
  const {
    requestData = ['basic', 'personality'],
    webpageName = 'My App',
    onComplete = null,
    autoFetch = false,
    testMode = false,
    appIcon = null,
    formatResponse = true,
    responseFormat = { includeDictionary: true, includeArray: true },
    ...otherProps
  } = config;

  return new Promise((resolve, reject) => {
    try {
      // Create a container for the overlay
      const containerId = `onairos-overlay-${Math.random().toString(36).substr(2, 9)}`;
      const container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.zIndex = '9999';
      container.style.pointerEvents = 'none'; // Allow clicks to pass through to the button
      
      document.body.appendChild(container);

      // Cleanup function
      const cleanup = () => {
        if (container && container.parentNode) {
          try {
            ReactDOM.unmountComponentAtNode(container);
          } catch (error) {
            console.warn('Error unmounting React component:', error);
          }
          container.parentNode.removeChild(container);
        }
      };

      // Enhanced onComplete handler
      const handleComplete = (result) => {
        let formattedResult = result;
        
        // Format response if requested
        if (formatResponse && result?.apiResponse) {
          try {
            formattedResult = {
              ...result,
              apiResponse: formatOnairosResponse(result.apiResponse, responseFormat)
            };
          } catch (error) {
            console.warn('Error formatting response:', error);
            // Continue with original result if formatting fails
          }
        }

        // Call the original onComplete callback
        if (onComplete && typeof onComplete === 'function') {
          try {
            onComplete(formattedResult);
          } catch (error) {
            console.error('Error in onComplete callback:', error);
          }
        }

        // Cleanup after a short delay to allow animations
        setTimeout(cleanup, 100);
      };

      // Create the Onairos button component with auto-open
      const OnairosElement = React.createElement(OnairosButton, {
        requestData,
        webpageName,
        onComplete: handleComplete,
        autoFetch,
        testMode,
        appIcon,
        visualType: 'icon', // Use icon-only to minimize visual footprint
        buttonType: 'pill',
        textColor: 'white',
        style: { opacity: 0, position: 'absolute', top: '-9999px' }, // Hide the button
        ...otherProps
      });

      // Render the component
      ReactDOM.render(OnairosElement, container);

      // Auto-click the button to open overlay after render
      setTimeout(() => {
        const button = container.querySelector('button');
        if (button) {
          button.click();
          resolve(cleanup); // Resolve with cleanup function
        } else {
          cleanup();
          reject(new Error('Failed to render Onairos button'));
        }
      }, 100);

    } catch (error) {
      console.error('Error opening Onairos overlay:', error);
      reject(error);
    }
  });
}

/**
 * Alternative method using React hooks for React applications
 * @param {Object} config - Same configuration as openOnairosOverlay
 * @returns {Object} Hook object with open function and state
 */
export function useOnairosOverlay(config = {}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const cleanupRef = React.useRef(null);

  const open = React.useCallback(async (overrideConfig = {}) => {
    if (isOpen || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const finalConfig = {
        ...config,
        ...overrideConfig,
        onComplete: (result) => {
          setIsOpen(false);
          setIsLoading(false);
          
          // Call original onComplete if provided
          if (config.onComplete) {
            config.onComplete(result);
          }
          if (overrideConfig.onComplete) {
            overrideConfig.onComplete(result);
          }
        }
      };

      const cleanup = await openOnairosOverlay(finalConfig);
      cleanupRef.current = cleanup;
      setIsOpen(true);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error opening overlay:', error);
    }
  }, [config, isOpen, isLoading]);

  const close = React.useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setIsOpen(false);
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    open,
    close,
    isOpen,
    isLoading
  };
}

/**
 * Simple function to get user data without UI (for existing authenticated users)
 * @param {Object} config - Configuration options
 * @param {Array} config.requestData - Data types to request
 * @param {string} config.userEmail - User email (if known)
 * @param {string} config.appName - App name
 * @param {boolean} config.testMode - Whether to use test mode
 * @param {boolean} config.formatResponse - Whether to format response
 * @returns {Promise<Object>} Promise that resolves to user data
 */
export async function getOnairosData(config = {}) {
  const {
    requestData = ['basic', 'personality'],
    userEmail = '',
    appName = 'My App',
    testMode = false,
    formatResponse = true,
    responseFormat = { includeDictionary: true, includeArray: true }
  } = config;

  // This would need to be implemented based on your existing API logic
  // For now, it's a placeholder that developers can use as a reference
  throw new Error('getOnairosData requires authenticated user session. Use openOnairosOverlay for the full authentication flow.');
} 
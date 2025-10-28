import React, { useState, useCallback } from 'react';
import { openLLMWithExtensionCheck, detectOnairosExtension, getUserInfoFromStorage } from '../utils/extensionDetection';
import ExtensionInstallPrompt from './ExtensionInstallPrompt';

/**
 * LLM Connector Manager Component
 * 
 * Manages the connection flow for LLM platforms (ChatGPT, Claude, Gemini, Grok).
 * Handles extension detection and shows appropriate prompts.
 */
const LLMConnectorManager = ({ 
  children,
  onConnectionChange = null,
  username = null 
}) => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  /**
   * Handle LLM connection attempt
   * @param {string} platform - LLM platform name
   * @param {Function} onSuccess - Callback for successful connection
   * @param {Function} onError - Callback for connection error
   */
  const handleLLMConnect = useCallback(async (platform, onSuccess = null, onError = null) => {
    if (isConnecting) {
      console.log('⚠️ Already connecting, ignoring request');
      return;
    }

    setIsConnecting(true);
    setCurrentPlatform(platform);

    try {
      console.log(`🤖 Attempting to connect to ${platform}...`);

      // Prepare user information for the browser extension
      // First try to get comprehensive user info from localStorage
      const storedUserInfo = getUserInfoFromStorage();
      
      const userInfo = {
        // Use stored info as primary source, fallback to props
        username: storedUserInfo.username || username,
        userId: storedUserInfo.userId || storedUserInfo.username || username,
        email: storedUserInfo.email,
        sessionToken: storedUserInfo.sessionToken,
        jwtToken: storedUserInfo.jwtToken,
        
        // User metadata
        isNewUser: storedUserInfo.isNewUser,
        verified: storedUserInfo.verified,
        onboardingComplete: storedUserInfo.onboardingComplete,
        pinCreated: storedUserInfo.pinCreated,
        
        // Account details
        accountInfo: storedUserInfo.accountInfo,
        connectedAccounts: storedUserInfo.connectedAccounts,
        
        // Add additional context
        source: 'onairos_npm_connector',
        connectorVersion: '3.4.2', // Updated version from package.json
        timestamp: new Date().toISOString(),
        platform: platform
      };

      // Use the extension detection utility with user info
      const success = await openLLMWithExtensionCheck(
        platform,
        (missingPlatform) => {
          // Extension is missing - show install prompt
          console.log(`❌ Extension missing for ${missingPlatform}, showing install prompt`);
          setCurrentPlatform(missingPlatform);
          setShowInstallPrompt(true);
        },
        userInfo
      );

      if (success) {
        // LLM was opened successfully
        console.log(`✅ ${platform} opened successfully`);
        
        // Simulate connection after a short delay (like the original ChatGPT connector)
        setTimeout(() => {
          if (onConnectionChange) {
            onConnectionChange(platform, true);
          }
          if (onSuccess) {
            onSuccess(platform);
          }
          setIsConnecting(false);
        }, 1000);
      } else {
        // Failed to open (popup blocked or other error)
        console.log(`❌ Failed to open ${platform}`);
        setIsConnecting(false);
        
        if (onError) {
          onError(platform, 'Failed to open LLM platform');
        }
      }
    } catch (error) {
      console.error(`❌ Error connecting to ${platform}:`, error);
      setIsConnecting(false);
      
      if (onError) {
        onError(platform, error.message);
      }
    }
  }, [isConnecting, onConnectionChange]);

  /**
   * Handle disconnection from LLM platform
   * @param {string} platform - LLM platform name
   */
  const handleLLMDisconnect = useCallback((platform) => {
    console.log(`🔌 Disconnecting from ${platform}`);
    
    if (onConnectionChange) {
      onConnectionChange(platform, false);
    }
  }, [onConnectionChange]);

  /**
   * Close the extension install prompt
   */
  const handleCloseInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
    setCurrentPlatform(null);
    setIsConnecting(false);
  }, []);

  /**
   * Handle extension installation click
   */
  const handleExtensionInstall = useCallback((platform) => {
    console.log(`🔗 User clicked to install extension for ${platform}`);
    // The ExtensionInstallPrompt component will handle opening the store
    // We'll close the prompt after a delay to let the user install
    setTimeout(() => {
      setShowInstallPrompt(false);
      setCurrentPlatform(null);
      setIsConnecting(false);
    }, 1000);
  }, []);

  /**
   * Check extension status
   * @returns {Promise<boolean>} True if extension is available
   */
  const checkExtensionStatus = useCallback(async () => {
    return await detectOnairosExtension();
  }, []);

  // Provide context to children components
  const contextValue = {
    // Connection methods
    connectToLLM: handleLLMConnect,
    disconnectFromLLM: handleLLMDisconnect,
    
    // State
    isConnecting,
    currentPlatform,
    
    // Utilities
    checkExtensionStatus,
    
    // User info
    username
  };

  return (
    <div data-llm-manager="true">
      {/* Render children with context */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            llmConnectorManager: contextValue
          });
        }
        return child;
      })}

      {/* Extension Install Prompt */}
      <ExtensionInstallPrompt
        open={showInstallPrompt}
        platform={currentPlatform}
        onClose={handleCloseInstallPrompt}
        onInstallClick={handleExtensionInstall}
      />
    </div>
  );
};

/**
 * Hook for using LLM Connector Manager context
 * @param {Object} props - Component props that might contain llmConnectorManager
 * @returns {Object} LLM connector manager context
 */
export const useLLMConnectorManager = (props) => {
  return props.llmConnectorManager || {
    connectToLLM: () => console.warn('LLM Connector Manager not available'),
    disconnectFromLLM: () => console.warn('LLM Connector Manager not available'),
    isConnecting: false,
    currentPlatform: null,
    checkExtensionStatus: () => Promise.resolve(false),
    username: null
  };
};

export default LLMConnectorManager;

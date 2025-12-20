import React, { useEffect, useState } from 'react';
import UniversalOnboarding from './components/UniversalOnboarding.jsx';
import { ModalPageLayout } from './components/ui/PageLayout.jsx';
import { isMobileApp, isMobileBrowser } from './utils/capacitorDetection.js';

/**
 * OnairosReconnectButton - A button that allows users to reconnect or change their data sources
 * 
 * This button checks if user Onairos data is stored and opens the data connection page
 * to allow users to modify their connected accounts/data sources.
 * 
 * @param {Object} props - Component props
 * @param {string} props.buttonText - Text to display on the button (default: "Reconnect Data Sources")
 * @param {string} props.buttonClass - Custom CSS classes for the button
 * @param {Object} props.buttonStyle - Custom inline styles for the button
 * @param {string} props.appIcon - Icon URL for the app (optional)
 * @param {string} props.appName - Name of the app (optional)
 * @param {Function} props.onComplete - Callback when connection changes are complete
 * @param {Function} props.onNoUserData - Callback when no user data is found
 * @param {string} props.priorityPlatform - Platform to prioritize (e.g., 'gmail', 'pinterest', 'linkedin')
 * @param {boolean} props.rawMemoriesOnly - Show only LLM connections when true
 * @param {Object} props.rawMemoriesConfig - Configuration for RAW memories collection
 */
export function OnairosReconnectButton({
  buttonText = "Reconnect Data Sources",
  buttonClass = "",
  buttonStyle = {},
  appIcon = null,
  appName = "Your App",
  onComplete = null,
  onNoUserData = null,
  priorityPlatform = null,
  rawMemoriesOnly = false,
  rawMemoriesConfig = null
}) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Detect mobile for conditional styling
  useEffect(() => {
    const computeMobile = () => {
      try {
        const hasWindow = typeof window !== 'undefined';
        if (!hasWindow) {
          setIsMobileDevice(false);
          return;
        }

        let width = window.innerWidth || document.documentElement?.clientWidth || document.body?.clientWidth || 0;

        try {
          if (window.parent && window.parent !== window && window.parent.innerWidth) {
            width = Math.max(width, window.parent.innerWidth);
          }
        } catch (_) {
          // Cross-origin access can fail; ignore
        }

        const isCapNative = !!window.Capacitor?.isNativePlatform?.();
        const detectedMobile = isCapNative || width < 1024;

        setIsMobileDevice(detectedMobile);
      } catch (e) {
        setIsMobileDevice(false);
      }
    };

    computeMobile();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', computeMobile);
      return () => window.removeEventListener('resize', computeMobile);
    }
  }, []);

  // Lock background scroll on DESKTOP while modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const body = document.body;
    if (!body) return;

    if (showOverlay && !isMobileDevice) {
      if (!body.dataset.onairosPrevOverflow) {
        body.dataset.onairosPrevOverflow = body.style.overflow || '';
      }
      body.style.overflow = 'hidden';
    } else {
      if (body.dataset.onairosPrevOverflow !== undefined) {
        body.style.overflow = body.dataset.onairosPrevOverflow;
        delete body.dataset.onairosPrevOverflow;
      }
    }
  }, [showOverlay, isMobileDevice]);

  const handleButtonClick = () => {
    // Check if user data exists in localStorage
    try {
      const savedUser = localStorage.getItem('onairosUser');
      
      if (!savedUser) {
        console.warn('⚠️ No Onairos user data found. User needs to sign in first.');
        if (onNoUserData) {
          onNoUserData();
        } else {
          alert('No Onairos account found. Please sign in first using the main Onairos button.');
        }
        return;
      }

      const user = JSON.parse(savedUser);
      
      // Validate that we have essential user data
      if (!user.email && !user.username) {
        console.warn('⚠️ Invalid user data - missing email/username');
        if (onNoUserData) {
          onNoUserData();
        } else {
          alert('Invalid session data. Please sign in again.');
        }
        return;
      }

      console.log('✅ User data found, opening reconnect modal:', {
        email: user.email,
        connectedAccounts: user.connectedAccounts?.length || 0
      });

      setUserData(user);
      setShowOverlay(true);
    } catch (error) {
      console.error('❌ Error checking user data:', error);
      if (onNoUserData) {
        onNoUserData();
      } else {
        alert('Error accessing user data. Please try again.');
      }
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    
    // Refresh userData from localStorage in case it was updated
    try {
      const savedUser = localStorage.getItem('onairosUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setUserData(user);
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  };

  const handleOnboardingComplete = (onboardingData) => {
    console.log('🎯 Reconnection completed:', onboardingData);
    console.log('🔍 Updated connected accounts:', onboardingData.connectedAccounts);
    
    // Update user data with new connections
    const updatedUserData = {
      ...userData,
      connectedAccounts: onboardingData.connectedAccounts || []
    };
    
    console.log('💾 Saving updated userData with connectedAccounts:', updatedUserData.connectedAccounts);
    setUserData(updatedUserData);
    localStorage.setItem('onairosUser', JSON.stringify(updatedUserData));
    
    // Close the overlay
    setShowOverlay(false);
    
    // Call onComplete callback if provided
    if (onComplete) {
      onComplete({
        connectedAccounts: updatedUserData.connectedAccounts,
        userData: updatedUserData,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Default button styling
  const defaultButtonClass = "flex items-center justify-center font-bold rounded cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors";
  const finalButtonClass = buttonClass || defaultButtonClass;

  return (
    <>
      <button
        className={finalButtonClass}
        onClick={handleButtonClick}
        style={buttonStyle}
      >
        {buttonText}
      </button>

      {/* Modal for reconnecting data sources */}
      {showOverlay && userData && (
        <>
          {isMobileDevice ? (
            // Mobile Layout
            <ModalPageLayout
              visible={showOverlay}
              onClose={handleCloseOverlay}
              showBackButton={false}
              showCloseButton={true}
              title=""
              subtitle=""
              icon={null}
              centerContent={true}
              contentClassName="!p-0"
              modalClassName="onairos-modal onairos-modal-mobile"
            >
              <div className="onairos-modal-shell flex-1 min-h-0 flex flex-col">
                <UniversalOnboarding 
                  isMobile={true}
                  initialConnectedAccounts={userData?.connectedAccounts}
                  onComplete={handleOnboardingComplete}
                  onBack={handleCloseOverlay}
                  appIcon={appIcon || "https://onairos.sirv.com/Images/OnairosBlack.png"}
                  appName={appName}
                  username={userData?.email || userData?.username}
                  priorityPlatform={priorityPlatform}
                  rawMemoriesOnly={rawMemoriesOnly}
                  rawMemoriesConfig={rawMemoriesConfig}
                />
              </div>
            </ModalPageLayout>
          ) : (
            // Desktop Layout
            <ModalPageLayout
              visible={showOverlay}
              onClose={handleCloseOverlay}
              showBackButton={false}
              showCloseButton={true}
              modalStyle={{ height: '90vh', maxHeight: '90vh' }}
              title=""
              subtitle=""
              icon={null}
              centerContent={true}
              contentClassName="!p-0"
              modalClassName="onairos-modal"
            >
              <div className="onairos-modal-shell flex-1 min-h-0 flex flex-col">
                <UniversalOnboarding 
                  isMobile={false}
                  initialConnectedAccounts={userData?.connectedAccounts}
                  onComplete={handleOnboardingComplete}
                  onBack={handleCloseOverlay}
                  appIcon={appIcon || "https://onairos.sirv.com/Images/OnairosBlack.png"}
                  appName={appName}
                  username={userData?.email || userData?.username}
                  priorityPlatform={priorityPlatform}
                  rawMemoriesOnly={rawMemoriesOnly}
                  rawMemoriesConfig={rawMemoriesConfig}
                />
              </div>
            </ModalPageLayout>
          )}
        </>
      )}
    </>
  );
}

export default OnairosReconnectButton;


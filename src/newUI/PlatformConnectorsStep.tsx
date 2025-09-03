import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SPACING } from '../theme';
import { triggerHaptic, HapticType } from '../../utils/haptics';
import PlatformToggle from './PlatformToggle';
import PersonaImage from './PersonaImage';
import PrimaryButton from './PrimaryButton';
import PersonalizationConsentScreen from './PersonalizationConsentScreen';
import PinCreationScreen from './PinCreationScreen';
import PersonaLoadingScreen from './PersonaLoadingScreen';
import { useConnections } from '../hooks/useConnections';
import { getPlatformIcon } from '../services/connectedAccountsService';
import { initiateOAuth, initiateNativeAuth, hasNativeSDK } from '../services/platformAuthService';
import { OAuthWebView } from './onairos/onboarding/OAuthWebView';
import { useAuth } from '../context/AuthContext';

interface PlatformConnectorsStepProps {
  onUpdate: (connectedPlatforms: string[]) => void;
  onSkip: () => void;
  loading?: boolean;
  onPinComplete?: (pin: string) => void;
}

const PlatformConnectorsStep: React.FC<PlatformConnectorsStepProps> = ({
  onUpdate,
  onSkip,
  loading = false,
  onPinComplete,
}) => {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());
  const [showConsentScreen, setShowConsentScreen] = useState(false);
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [createdPin, setCreatedPin] = useState<string>('');
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});
  const [showOAuthWebView, setShowOAuthWebView] = useState(false);
  const [oauthUrl, setOauthUrl] = useState<string>('');
  const [currentPlatform, setCurrentPlatform] = useState<string>('');

  // Use the real platform connection hook
  const { connectPlatform, disconnectPlatform, isConnecting } = useConnections();
  
  // Get the authenticated user from auth context
  const { user } = useAuth();
  const username = user?.email || user?.name || `user_${Math.floor(Math.random() * 10000)}`;

  // Real platforms that can be connected (from UniversalOnboarding)
  const platforms = [
    {
      id: 'pinterest',
      name: 'Pinterest',
      icon: getPlatformIcon('pinterest'),
      description: 'We analyze your pins, boards, and interests to understand your style and preferences.',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: getPlatformIcon('youtube'),
      description: 'We analyze your watch history, likes, and subscriptions to understand your interests.',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: getPlatformIcon('linkedin'),
      description: 'We analyze your professional network and career interests.',
    },
    {
      id: 'reddit',
      name: 'Reddit', 
      icon: getPlatformIcon('reddit'),
      description: 'We analyze your posts and comments to understand your interests.',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: getPlatformIcon('gmail'),
      description: 'We analyze your email patterns to understand your communication style.',
    },
  ];

  const handlePlatformToggle = async (platformId: string, enabled: boolean) => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    
    try {
      if (enabled) {
        // Check if the platform has a native SDK
        if (hasNativeSDK(platformId)) {
          // Use native SDK authentication (YouTube)
          setCurrentPlatform(platformId);
          setConnectionStatuses(prev => ({ ...prev, [platformId]: 'connecting' }));
          const success = await initiateNativeAuth(platformId, username);
          
          if (success) {
            const newConnected = new Set(connectedPlatforms);
            newConnected.add(platformId);
            setConnectedPlatforms(newConnected);
            setConnectionStatuses(prev => ({ ...prev, [platformId]: 'connected' }));
            triggerHaptic(HapticType.SUCCESS);
          } else {
            setConnectionStatuses(prev => ({ ...prev, [platformId]: 'error' }));
            triggerHaptic(HapticType.ERROR);
          }
        } else {
          // For platforms like Pinterest, use OAuth WebView
          setCurrentPlatform(platformId);
          setConnectionStatuses(prev => ({ ...prev, [platformId]: 'connecting' }));
          
          const oauthUrl = await initiateOAuth(platformId, username);
          
          if (oauthUrl) {
            setOauthUrl(oauthUrl);
            setShowOAuthWebView(true);
          } else {
            setConnectionStatuses(prev => ({ ...prev, [platformId]: 'error' }));
            triggerHaptic(HapticType.ERROR);
          }
        }
      } else {
        // Disconnect the platform
        await disconnectPlatform(platformId);
        const newConnected = new Set(connectedPlatforms);
        newConnected.delete(platformId);
        setConnectedPlatforms(newConnected);
        setConnectionStatuses(prev => ({ ...prev, [platformId]: 'disconnected' }));
        triggerHaptic(HapticType.BUTTON_PRESS);
      }
    } catch (error) {
      console.error(`Error toggling platform ${platformId}:`, error);
      setConnectionStatuses(prev => ({ ...prev, [platformId]: 'error' }));
      triggerHaptic(HapticType.ERROR);
    }
  };

  const handleUpdate = () => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    setShowPinScreen(true);
  };

  const handleConsentAccept = () => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    if (onPinComplete) {
      onPinComplete(createdPin);
    } else {
      onUpdate(Array.from(connectedPlatforms));
    }
  };

  const handleConsentDecline = () => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    setShowConsentScreen(false);
  };

  const handleSkip = () => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    onSkip();
  };

  const handlePinComplete = (pin: string) => {
    setCreatedPin(pin);
    setShowPinScreen(false);
    setShowLoadingScreen(true);
  };

  const handleLoadingComplete = () => {
    setShowLoadingScreen(false);
    setShowConsentScreen(true);
  };

  const handleOAuthSuccess = (code: string) => {
    console.log(`OAuth success for ${currentPlatform} with code:`, code);
    
    if (currentPlatform) {
      // Update connected platforms
      const newConnected = new Set(connectedPlatforms);
      newConnected.add(currentPlatform);
      setConnectedPlatforms(newConnected);
      setConnectionStatuses(prev => ({ ...prev, [currentPlatform]: 'connected' }));
      triggerHaptic(HapticType.SUCCESS);
    }
    
    // Close the OAuth window
    setShowOAuthWebView(false);
    setOauthUrl('');
    setCurrentPlatform('');
  };

  const handleOAuthClose = () => {
    setShowOAuthWebView(false);
    setOauthUrl('');
    if (currentPlatform) {
      setConnectionStatuses(prev => ({ ...prev, [currentPlatform]: 'disconnected' }));
    }
    setCurrentPlatform('');
  };

  const handlePinBack = () => {
    setShowPinScreen(false);
  };

  // Calculate persona level based on connected platforms (1-5)
  const personaLevel = Math.min(5, Math.max(1, connectedPlatforms.size + 1));

  // Show PIN screen if triggered
  if (showPinScreen) {
    return (
      <PinCreationScreen
        visible={showPinScreen}
        onComplete={handlePinComplete}
        onBack={handlePinBack}
      />
    );
  }

  // Show loading screen if triggered
  if (showLoadingScreen) {
    return (
      <PersonaLoadingScreen
        visible={showLoadingScreen}
        onComplete={handleLoadingComplete}
      />
    );
  }

  // Show OAuth WebView if triggered
  if (showOAuthWebView && oauthUrl) {
    return (
      <OAuthWebView
        url={oauthUrl}
        platform={currentPlatform}
        onClose={handleOAuthClose}
        onSuccess={handleOAuthSuccess}
        onComplete={handleOAuthClose}
      />
    );
  }

  // Show consent screen if triggered
  if (showConsentScreen) {
    return (
      <PersonalizationConsentScreen
        visible={showConsentScreen}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header and Persona Section */}
      <View style={styles.fixedHeaderSection}>
        {/* Heading */}
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Connect platforms</Text>
          <Text style={styles.subtitle}>More connections, smarter personalization.</Text>
        </View>

        {/* Persona Image */}
        <View style={styles.personaContainer}>
          <PersonaImage level={personaLevel} style={styles.largePersona} />
        </View>
      </View>

      {/* Scrollable Platform Section */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.scrollableSection}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.platformsContainer}>
            {platforms.map((platform, index) => (
              <PlatformToggle
                key={platform.id}
                platform={platform}
                isEnabled={connectedPlatforms.has(platform.id)}
                onToggle={handlePlatformToggle}
                fullWidth={true}
                isLast={index === platforms.length - 1}
                customIconSize={platform.id === 'youtube' ? 36 : undefined}
              />
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonContainer}>
          <PrimaryButton
            label="Update"
            onPress={handleUpdate}
            disabled={loading || connectedPlatforms.size === 0 || isConnecting}
            loading={loading || isConnecting}
          />
        </View>
        
        <View style={styles.skipContainer}>
          <Text style={styles.skipButton} onPress={handleSkip}>
            Skip
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  
  fixedHeaderSection: {
    paddingTop: 8,
    paddingHorizontal: 0,
    backgroundColor: COLORS.surface,
    maxHeight: '50%',  // Limit fixed section to 50% of screen
    overflow: 'hidden', // Hide any overflow
  },
  
  scrollableSection: {
    flex: 1,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingTop: 0, // Ensure scroll starts at the top
  },
  
  headingContainer: {
    width: '100%',
    marginBottom: 0,  // Remove margin to make persona very close
    paddingHorizontal: 0,
  },
  
  title: {
    fontFamily: 'IBM Plex Sans',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: COLORS.grey800,
    textAlign: 'left',
    marginBottom: 2,
  },
  
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.grey600,
    textAlign: 'left',
    marginBottom: 0,  // Remove bottom margin to bring persona closer
  },
  
  personaContainer: {
    alignItems: 'center',
    marginTop: -110,    // Negative margin to pull persona up into header space
    marginBottom: 0,   // Remove bottom margin
  },
  
  largePersona: {
    width: 650,  // Make it bigger than default 200x200
    height: 650,
    marginTop: -20,    // Additional negative margin to override internal spacing
    marginBottom: -20, // Pull content below up as well
  },
  
  platformsContainer: {
    paddingHorizontal: 0,
    paddingTop: 8,   // Reduced from 20 to minimize space at top of scroll area
    paddingBottom: 120, // More space to account for fixed buttons at bottom
  },
  
  bottomContainer: {
    position: 'absolute',
    bottom: -40,  // Position 40px from bottom of screen
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
  },
  
  buttonContainer: {
    marginBottom: 16,
  },
  
  skipContainer: {
    alignItems: 'center',
  },
  
  skipButton: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.grey600,
    textAlign: 'center',
  },
});

export default PlatformConnectorsStep;

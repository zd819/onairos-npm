import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { triggerHaptic, HapticType } from '../../utils/haptics';

// Import our new components
import ModalSheet from '../components/ModalSheet';
import ModalHeader from '../components/ModalHeader';
import BrandMark from '../components/BrandMark';
import HeadingGroup from '../components/HeadingGroup';
import BodyText from '../components/BodyText';
import PrimaryButton from '../components/PrimaryButton';
import SignInStep from '../components/SignInStep';
import VerificationStep from '../components/VerificationStep';
import PlatformConnectorsStep from '../components/PlatformConnectorsStep';


// Type definitions for navigation
type RootStackParamList = {
  SignIn: { photo?: string };
  Welcome: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface WelcomeScreenProps {
  visible: boolean;
  onClose: () => void;
}

type ModalStep = 'welcome' | 'signin' | 'verification' | 'platforms';

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  visible,
  onClose,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const [currentStep, setCurrentStep] = useState<ModalStep>('welcome');
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(1)).current; // Start from bottom
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animate in when visible (matching existing modal style)
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(1);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    
    // Reset to welcome step
    setCurrentStep('welcome');
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleGetStarted = () => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    // Move to sign-in step instead of closing modal
    setCurrentStep('signin');
  };

  const handleEmailSubmit = (email: string) => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    // Store the email and move to verification
    setUserEmail(email);
    setCurrentStep('verification');
  };

  const handleGoogleSignIn = () => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    // TODO: Integrate with existing Google sign-in logic
    console.log('Google sign-in pressed');
  };

  const handleContinue = () => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    // Move to verification step
    setCurrentStep('verification');
  };

  const handleCodeSubmit = (code: string) => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    // TODO: Handle verification code submission
    console.log('Verification code submitted:', code);
    // Move to platform connectors step
    setCurrentStep('platforms');
  };

  const handleBackToSignIn = () => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    setCurrentStep('signin');
  };

  const handleBackToVerification = () => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    setCurrentStep('verification');
  };

  const handlePlatformUpdate = (connectedPlatforms: string[]) => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    // TODO: Handle platform connections
    console.log('Connected platforms:', connectedPlatforms);
    // For now, close the modal (could proceed to next step)
    onClose();
  };

  const handlePlatformSkip = () => {
    triggerHaptic(HapticType.BUTTON_PRESS);
    // Skip platform connections and close modal
    onClose();
  };

  const handleBackdropPress = () => {
    // Optional: allow closing by tapping backdrop
    handleClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide" // Use built-in slide animation like existing modal
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Modal Content */}
      <Animated.View 
        style={[
          styles.modalContainer,
          {
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 600], // Slide from bottom
              })
            }]
          }
        ]}
      >
        <ModalSheet topPadding={0}>
          <ModalHeader 
            onClose={handleClose}
            onBack={currentStep === 'verification' ? handleBackToSignIn : handleBackToVerification}
            showBackButton={currentStep === 'verification' || currentStep === 'platforms'}
          />
          
          {currentStep === 'welcome' && (
            <View style={styles.content}>
              {/* Brand Mark */}
              <View style={styles.brandMarkContainer}>
                <BrandMark />
              </View>

              {/* Heading Group */}
              <View style={styles.headingContainer}>
                <HeadingGroup />
              </View>

              {/* Body Text */}
              <View style={styles.bodyContainer}>
                <BodyText />
              </View>

              {/* Flexible Spacer */}
              <View style={styles.spacer} />

              {/* Primary Button */}
              <View style={styles.buttonContainer}>
                <PrimaryButton
                  label="Get Started"
                  onPress={handleGetStarted}
                  testID="welcome-get-started-button"
                />
              </View>
            </View>
          )}

          {currentStep === 'signin' && (
            <SignInStep
              onEmailSubmit={handleEmailSubmit}
              onGoogleSignIn={handleGoogleSignIn}
              onContinue={handleContinue}
            />
          )}

          {currentStep === 'verification' && (
            <VerificationStep
              email={userEmail}
              onCodeSubmit={handleCodeSubmit}
              onBack={handleBackToSignIn}
            />
          )}

          {currentStep === 'platforms' && (
            <PlatformConnectorsStep
              onUpdate={handlePlatformUpdate}
              onSkip={handlePlatformSkip}
            />
          )}
        </ModalSheet>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent', // Remove grey overlay
  },
  
  backdropTouchable: {
    flex: 1,
  },
  
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '85%', // Take most of the screen
  },
  
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  
  brandMarkContainer: {
    marginBottom: 32,
  },
  
  headingContainer: {
    marginBottom: 24,
  },
  
  bodyContainer: {
    marginBottom: 32,
    width: '100%',
  },
  
  spacer: {
    flex: 1,
    minHeight: 20, // Ensure some minimum space
  },
  
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
});

export default WelcomeScreen;

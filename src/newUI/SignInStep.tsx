import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { COLORS, SPACING, TEXT_STYLES } from '../theme';
import EmailInput from './EmailInput';
import GoogleButton from './GoogleButton';
import PrimaryButton from './PrimaryButton';

interface SignInStepProps {
  onEmailSubmit: (email: string) => void;
  onGoogleSignIn: () => void;
  onContinue: () => void;
  loading?: boolean;
}

const SignInStep: React.FC<SignInStepProps> = ({
  onEmailSubmit,
  onGoogleSignIn,
  onContinue,
  loading = false,
}) => {
  const [email, setEmail] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const handleEmailSubmit = () => {
    if (email.trim()) {
      onEmailSubmit(email.trim());
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Heading */}
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Your AI persona is getting closer</Text>
          <Text style={styles.subtitle}>Sign in or create an account</Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <EmailInput
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={handleEmailSubmit}
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Button */}
        <View style={styles.googleContainer}>
          <GoogleButton
            onPress={onGoogleSignIn}
            disabled={loading}
          />
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Continue Button */}
        <View style={styles.continueContainer}>
          <PrimaryButton
            label="Continue"
            onPress={() => {
              if (email.trim()) {
                onContinue();
              }
            }}
            disabled={loading || !email.trim()}
            loading={loading}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  content: {
    flex: 1,
    paddingTop: 8, // Much smaller top padding to move headline higher
    paddingHorizontal: 0, // No horizontal padding - let children control their own spacing
  },
  
  headingContainer: {
    width: '100%', // Fill sheet width
    marginBottom: 22, // Further reduced spacing to bring subtitle closer to email input
    paddingHorizontal: 0, // No padding at all - text goes to absolute edges
    // Removed alignItems: 'center' - no centering
  },
  
  title: {
    fontFamily: 'IBM Plex Sans',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: COLORS.grey800,
    textAlign: 'left', // Left-aligned as specified
    marginBottom: SPACING.sm,
    // No fixed width - let parent's 24px insets define available width (327px on 375pt device)
    // Removed height constraint to allow natural wrapping
  },
  
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.grey600,
    textAlign: 'left', // Also left-align subtitle for consistency
  },
  
  inputContainer: {
    marginBottom: 32, // Consistent spacing
    paddingHorizontal: 0, // Match headline - no padding, full width
  },
  
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32, // Consistent spacing
    paddingHorizontal: 0, // Match headline - no padding, full width
  },
  
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  
  dividerText: {
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: COLORS.grey500,
  },
  
  googleContainer: {
    marginBottom: SPACING.xl,
    paddingHorizontal: 0, // Match headline - no padding, full width
  },

  spacer: {
    flex: 1,
    minHeight: 20,
  },

  continueContainer: {
    paddingBottom: SPACING.xl,
    paddingHorizontal: 0, // Match headline - no padding, full width
  },
});

export default SignInStep;

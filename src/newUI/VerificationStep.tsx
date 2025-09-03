import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SPACING } from '../theme';
import CodeInput from './CodeInput';
import PrimaryButton from './PrimaryButton';

interface VerificationStepProps {
  email: string;
  onCodeSubmit: (code: string) => void;
  onBack: () => void;
  loading?: boolean;
}

const VerificationStep: React.FC<VerificationStepProps> = ({
  email,
  onCodeSubmit,
  onBack,
  loading = false,
}) => {
  const [code, setCode] = useState('');

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleContinue = () => {
    if (code.length === 6) {
      onCodeSubmit(code);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Heading */}
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to {email}
          </Text>
        </View>

        {/* Code Input */}
        <View style={styles.codeContainer}>
          <CodeInput
            length={6}
            onCodeChange={handleCodeChange}
          />
        </View>

        {/* Continue Button - positioned right below code inputs */}
        <View style={styles.continueContainer}>
          <PrimaryButton
            label="Continue"
            onPress={handleContinue}
            disabled={loading || code.length !== 6}
            loading={loading}
          />
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
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
    paddingTop: 8,
    paddingHorizontal: 0,
  },
  

  
  headingContainer: {
    width: '100%',
    marginBottom: 40,
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
    marginBottom: 8,
  },
  
  codeContainer: {
    paddingHorizontal: 16,
    marginBottom: 24, // Reduced spacing to bring Continue button closer
  },
  
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  
  continueContainer: {
    paddingHorizontal: 0,
    marginBottom: 24, // Add spacing below Continue button
  },
});

export default VerificationStep;

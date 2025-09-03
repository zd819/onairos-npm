import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Svg, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../theme';

interface IconCircleProps {
  size?: number;
  children?: React.ReactNode;
}

const IconCircle: React.FC<IconCircleProps> = ({ 
  size = 40, 
  children 
}) => {
  return (
    <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      {/* IconCircle has its own background - the only child that should */}
      <LinearGradient
        colors={[COLORS.iconCircleGradientStart, COLORS.iconCircleGradientEnd]}
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Content */}
      <View style={styles.iconContent}>
        {children || (
          <Text style={styles.arrowText}>→</Text>
        )}
      </View>
    </View>
  );
};

interface PrimaryButtonProps {
  label?: string;
  onPress: () => void;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label = "Get Started",
  onPress,
  iconRight,
  loading = false,
  disabled = false,
  testID,
  style,
  textStyle,
}) => {
  const [pressed, setPressed] = useState(false);

  const handlePressIn = () => setPressed(true);
  const handlePressOut = () => setPressed(false);

  return (
    <TouchableOpacity
      style={[
        styles.outerPill,
        !disabled && styles.outerShadow,
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      testID={testID}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {/* ONLY ONE gradient - no overlays */}
      <LinearGradient
        colors={[COLORS.btnGradStart, COLORS.btnGradEnd]}
        style={styles.baseGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Simple pressed state */}
      {pressed && (
        <View style={styles.pressedOverlay} />
      )}

      {/* Centered text on top */}
      <View style={styles.textContainer}>
        {loading ? (
          <ActivityIndicator color={COLORS.btnLabel} size="small" />
        ) : (
          <Text style={[styles.label, textStyle]}>{label}</Text>
        )}
      </View>

      {/* Icon in fixed position on right */}
      <View style={styles.iconPosition}>
        {!loading && (iconRight || <IconCircle />)}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Outer pill container - owns all backgrounds, border, shadow
  outerPill: {
    height: 48,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.btnBorder, // ≈20% black
    overflow: 'hidden',
    width: '100%',
    position: 'relative',
  },
  
  outerShadow: {
    // Outer shadow: 20px 30px 40px rgba(0,0,0,0.10)
    shadowColor: '#000000',
    shadowOffset: { width: 20, height: 30 },
    shadowOpacity: 0.10,
    shadowRadius: 40,
    elevation: 8,
  },
  
  disabled: {
    opacity: 0.65,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Single base gradient - fills entire button
  baseGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 100,
  },
  
  pressedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 100,
  },
  
  // Absolutely centered text container
  textContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  
  // Fixed icon position on right
  iconPosition: {
    position: 'absolute',
    right: 4,
    top: 4,
    bottom: 4,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  
  label: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: COLORS.btnLabel,
    textAlign: 'center',
    backgroundColor: 'transparent', // Must be transparent
  },
  
  // IconCircle styles - ONLY child with background
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  
  iconContent: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  
  arrowText: {
    fontSize: 20,
    color: COLORS.btnLabel,
    fontWeight: '600',
    opacity: 0.95,
    backgroundColor: 'transparent',
  },
});

export { IconCircle };
export default PrimaryButton;
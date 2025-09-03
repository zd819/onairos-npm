import React, { useState } from 'react';
import { COLORS } from '../../theme/colors.js';

// Icon Circle component matching the React Native version
const IconCircle = ({ 
  size = 40, 
  children,
  className = ''
}) => {
  return (
    <div 
      className={`relative flex items-center justify-center border border-black border-opacity-25 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: `linear-gradient(to bottom, ${COLORS.iconCircleGradientStart}, ${COLORS.iconCircleGradientEnd})`
      }}
    >
      {children || (
        <span 
          className="font-semibold opacity-95"
          style={{
            fontSize: '20px',
            color: COLORS.btnLabel,
            backgroundColor: 'transparent'
          }}
        >
          →
        </span>
      )}
    </div>
  );
};

// Primary Button component matching the React Native design
const PrimaryButton = ({
  label = "Get Started",
  onClick,
  iconRight,
  loading = false,
  disabled = false,
  testId,
  className = '',
  style = {},
  textStyle = {},
  ...props
}) => {
  const [pressed, setPressed] = useState(false);

  const handleMouseDown = () => setPressed(true);
  const handleMouseUp = () => setPressed(false);
  const handleMouseLeave = () => setPressed(false);

  const buttonStyle = {
    height: '48px',
    borderRadius: '100px',
    border: `1px solid ${COLORS.btnBorder}`,
    background: `linear-gradient(to bottom, ${COLORS.btnGradStart}, ${COLORS.btnGradEnd})`,
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    boxShadow: disabled ? 'none' : '20px 30px 40px rgba(0,0,0,0.10)',
    transition: 'all 0.2s ease',
    ...style
  };

  const pressedOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: '100px',
    opacity: pressed ? 1 : 0,
    transition: 'opacity 0.1s ease'
  };

  const textContainerStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  };

  const iconPositionStyle = {
    position: 'absolute',
    right: '4px',
    top: '4px',
    bottom: '4px',
    width: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  };

  const labelStyle = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '600',
    fontSize: '16px',
    color: COLORS.btnLabel,
    textAlign: 'center',
    backgroundColor: 'transparent',
    ...textStyle
  };

  return (
    <button
      className={`relative ${className}`}
      style={buttonStyle}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      data-testid={testId}
      aria-label={label}
      {...props}
    >
      {/* Pressed state overlay */}
      <div style={pressedOverlayStyle} />

      {/* Centered text container */}
      <div style={textContainerStyle}>
        {loading ? (
          <div 
            className="animate-spin rounded-full border-2 border-white border-t-transparent"
            style={{ width: '20px', height: '20px' }}
          />
        ) : (
          <span style={labelStyle}>{label}</span>
        )}
      </div>

      {/* Icon in fixed position on right */}
      <div style={iconPositionStyle}>
        {!loading && (iconRight || <IconCircle />)}
      </div>
    </button>
  );
};

export { IconCircle };
export default PrimaryButton; 
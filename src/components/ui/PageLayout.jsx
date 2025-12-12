import React from 'react';
import { COLORS } from '../../theme/colors.js';

// Standardized page layout component with white background
const PageLayout = ({
  children,
  title,
  subtitle,
  icon,
  showHeader = true,
  showCloseButton = false,
  onClose,
  onBack,
  showBackButton = false,
  className = '',
  contentClassName = '',
  centerContent = true,
  style = {},
  ...props
}) => {
  const layoutStyle = {
    backgroundColor: COLORS.background,
    minHeight: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    ...style
  };

  const headerStyle = {
    position: 'sticky',
    top: 0,
    backgroundColor: COLORS.background,
    zIndex: 10,
    padding: 'clamp(8px, 2vw, 16px) clamp(16px, 4vw, 32px) clamp(6px, 1.5vw, 12px)'
  };

  const contentStyle = {
    flex: 1,
    padding: 'clamp(16px, 4vw, 32px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    minHeight: 0, // Allow flex item to shrink below content size
    ...(centerContent && {
      alignItems: 'center',
      justifyContent: 'flex-start'
    })
  };

  const titleStyle = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 'clamp(20px, 5vw, 28px)',
    fontWeight: '700',
    color: COLORS.textPrimary,
    margin: '0 0 clamp(6px, 1.5vw, 12px) 0',
    textAlign: centerContent ? 'center' : 'left',
    lineHeight: '1.2'
  };

  const subtitleStyle = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 'clamp(14px, 3.5vw, 18px)',
    fontWeight: '400',
    color: COLORS.textSecondary,
    margin: '0 0 clamp(20px, 5vw, 40px) 0',
    textAlign: centerContent ? 'center' : 'left',
    lineHeight: '1.5'
  };

  const iconStyle = {
    width: 'clamp(40px, 8vw, 56px)',
    height: 'clamp(40px, 8vw, 56px)',
    margin: '0 auto clamp(16px, 4vw, 32px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(20px, 5vw, 28px)'
  };

  return (
    <div 
      className={`onairos-page-layout ${className}`}
      style={layoutStyle}
      {...props}
    >
      {/* Header with navigation */}
      {showHeader && (
        <div style={headerStyle}>
          <div className="flex items-center justify-between">
            {/* Back button */}
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Go back"
              >
                <span style={{ fontSize: '16px', color: COLORS.textPrimary }}>←</span>
              </button>
            )}


            {/* Close button */}
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <span style={{ fontSize: '16px', color: COLORS.textPrimary }}>×</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div 
        className={`onairos-page-content ${contentClassName}`}
        style={contentStyle}
      >
        {/* Icon */}
        {icon && (
          <div style={iconStyle}>
            {typeof icon === 'string' ? <span>{icon}</span> : icon}
          </div>
        )}

        {/* Title */}
        {title && (
          <h1 style={titleStyle}>
            {title}
          </h1>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p style={subtitleStyle}>
            {subtitle}
          </p>
        )}

        {/* Page content */}
        {children}
      </div>
    </div>
  );
};

// Modal wrapper component for overlay-style pages
const ModalPageLayout = ({
  children,
  visible = true,
  onClose,
  onBackdropClick,
  backdropStyle = {},
  modalStyle = {},
  modalClassName = '',
  ...pageLayoutProps
}) => {
  if (!visible) return null;

  // Detect Capacitor native platform
  // Must be defined BEFORE usage to avoid Temporal Dead Zone (TDZ) error
  const isCapacitorNative = typeof window !== 'undefined' && 
    window.Capacitor && 
    typeof window.Capacitor.isNativePlatform === 'function' && 
    window.Capacitor.isNativePlatform();
    
  // Debug log to ensure this runs
  // console.log('ModalPageLayout rendered, isCapacitorNative:', isCapacitorNative);

  const backdropStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2147483647,
    display: 'flex',
    alignItems: isCapacitorNative ? 'flex-end' : 'center',
    justifyContent: 'center',
    transition: 'opacity 200ms ease',
    willChange: 'opacity',
    ...backdropStyle
  };
  
  const modalStyles = {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    borderBottomLeftRadius: isCapacitorNative ? '0px' : '24px',
    borderBottomRightRadius: isCapacitorNative ? '0px' : '24px',
    height: isCapacitorNative ? '100vh' : 'auto', // Auto height for desktop
    maxHeight: isCapacitorNative ? '100vh' : '90vh', // Max height for desktop
    minHeight: isCapacitorNative ? '100vh' : '600px', // Min height for desktop
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transform: 'translateY(0)',
    transition: 'transform 220ms ease, opacity 220ms ease',
    willChange: 'transform, opacity',
    // Ensure full height on mobile
    ...(isCapacitorNative && {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
      borderRadius: 0
    }),
    ...modalStyle
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (onBackdropClick) {
        onBackdropClick();
      } else if (onClose) {
        onClose();
      }
    }
  };

  return (
    <div style={backdropStyles} onClick={handleBackdropClick}>
      <div style={modalStyles} className={modalClassName}>
        <PageLayout
          showHeader={true}
          showCloseButton={true}
          onClose={onClose}
          {...pageLayoutProps}
        >
          {children}
        </PageLayout>
      </div>
    </div>
  );
};

export { ModalPageLayout };
export default PageLayout; 
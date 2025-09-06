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
    padding: '12px 24px 8px',
    borderBottom: `1px solid ${COLORS.borderLight}`
  };

  const contentStyle = {
    flex: 1,
    padding: '24px',
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
    fontSize: '24px',
    fontWeight: '700',
    color: COLORS.textPrimary,
    margin: '0 0 8px 0',
    textAlign: centerContent ? 'center' : 'left'
  };

  const subtitleStyle = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '16px',
    fontWeight: '400',
    color: COLORS.textSecondary,
    margin: '0 0 32px 0',
    textAlign: centerContent ? 'center' : 'left',
    lineHeight: '1.5'
  };

  const iconStyle = {
    width: '48px',
    height: '48px',
    margin: '0 auto 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
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
  ...pageLayoutProps
}) => {
  if (!visible) return null;

  const backdropStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...backdropStyle
  };

  const modalStyles = {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    borderBottomLeftRadius: '24px',
    borderBottomRightRadius: '24px',
    height: '100vh',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
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
      <div style={modalStyles}>
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
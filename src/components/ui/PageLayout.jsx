import React, { useEffect, useMemo, useState } from 'react';
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
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 768;

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
    padding: isSmallScreen
      ? '10px 16px 8px'
      : 'clamp(8px, 2vw, 16px) clamp(16px, 4vw, 32px) clamp(6px, 1.5vw, 12px)'
  };

  const contentStyle = {
    flex: 1,
    padding: isSmallScreen ? '16px 16px 18px' : 'clamp(16px, 4vw, 32px)',
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
    fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
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
    margin: isSmallScreen ? '0 0 18px 0' : '0 0 clamp(20px, 5vw, 40px) 0',
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
    
  // Detect mobile browser (not Capacitor native)
  const isMobileBrowser = typeof window !== 'undefined' && 
    window.innerWidth <= 768 && 
    !isCapacitorNative;

  // Use visualViewport to avoid iOS "vh" causing phantom scroll and clipped content.
  const [mobileModalHeightPx, setMobileModalHeightPx] = useState(() => {
    if (typeof window === 'undefined') return null;
    if (!isMobileBrowser) return null;
    const h = window.visualViewport?.height || window.innerHeight;
    return Math.round(h * 0.85);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isMobileBrowser) return;
    const compute = () => {
      const h = window.visualViewport?.height || window.innerHeight;
      setMobileModalHeightPx(Math.round(h * 0.85));
    };
    compute();
    window.addEventListener('resize', compute);
    window.visualViewport?.addEventListener?.('resize', compute);
    window.visualViewport?.addEventListener?.('scroll', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.visualViewport?.removeEventListener?.('resize', compute);
      window.visualViewport?.removeEventListener?.('scroll', compute);
    };
  }, [isMobileBrowser]);
    
  // ENHANCED DEBUG LOGGING for mobile browser height issues
  if (typeof window !== 'undefined') {
    console.log('[Onairos SDK][ModalPageLayout] Mobile Detection', {
      width: window.innerWidth,
      height: window.innerHeight,
      isCapacitorNative,
      isMobileBrowser,
      modalHeight: isMobileBrowser ? '80vh' : (isCapacitorNative ? '100vh' : 'auto'),
      modalMaxHeight: isMobileBrowser ? '80vh' : (isCapacitorNative ? '100vh' : '90vh'),
      modalMaxWidth: isMobileBrowser ? '100%' : '500px',
      backdropAlign: (isCapacitorNative || isMobileBrowser) ? 'flex-end' : 'center',
      backdropPadding: isMobileBrowser ? '0' : '16px'
    });
  }

  const backdropStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2147483647,
    display: 'flex',
    alignItems: (isCapacitorNative || isMobileBrowser) ? 'flex-end' : 'center',
    justifyContent: 'center',
    padding: isMobileBrowser ? '0' : '16px',
    transition: 'opacity 200ms ease',
    willChange: 'opacity',
    ...backdropStyle
  };
  
  console.log('[Onairos SDK][ModalPageLayout] 🎯 Backdrop Styles COMPUTED:', {
    alignItems: backdropStyles.alignItems,
    padding: backdropStyles.padding,
    display: backdropStyles.display,
    hasBackdropStyleOverride: Object.keys(backdropStyle).length > 0,
    backdropStyleOverride: backdropStyle
  });
  
  const modalStyles = {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    borderBottomLeftRadius: (isCapacitorNative || isMobileBrowser) ? '0px' : '24px',
    borderBottomRightRadius: (isCapacitorNative || isMobileBrowser) ? '0px' : '24px',
    // Force height on mobile browser with !important via inline style
    height: isMobileBrowser ? (mobileModalHeightPx ? `${mobileModalHeightPx}px` : '85vh') : (isCapacitorNative ? '100vh' : 'auto'),
    maxHeight: isMobileBrowser ? (mobileModalHeightPx ? `${mobileModalHeightPx}px` : '85vh') : (isCapacitorNative ? '100vh' : '90vh'),
    minHeight: (isCapacitorNative || isMobileBrowser) ? 'auto' : '600px',
    width: '100%',
    maxWidth: isMobileBrowser ? '100%' : '500px',
    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    // iOS safe-area: extend the white modal background into the home-indicator inset
    ...(isMobileBrowser ? { paddingBottom: 'env(safe-area-inset-bottom)' } : {}),
    transform: 'translateY(0)',
    transition: 'transform 220ms ease, opacity 220ms ease',
    willChange: 'transform, opacity',
    marginLeft: (isCapacitorNative || isMobileBrowser) ? '0' : 'auto',
    marginRight: (isCapacitorNative || isMobileBrowser) ? '0' : 'auto',
    marginBottom: isMobileBrowser ? '0' : 'auto',
    marginTop: isMobileBrowser ? 'auto' : 'auto',
    // Ensure full height on Capacitor native
    ...(isCapacitorNative && {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
      borderRadius: 0
    }),
    // Position mobile browser modal at bottom
    ...(isMobileBrowser && {
      flexShrink: 0
    }),
    // CRITICAL: Do NOT spread modalStyle on mobile browser - it breaks height
    ...(isMobileBrowser ? {} : modalStyle)
  };
  
  console.log('[Onairos SDK][ModalPageLayout] 🎨 Modal Styles COMPUTED:', {
    height: modalStyles.height,
    maxHeight: modalStyles.maxHeight,
    minHeight: modalStyles.minHeight,
    width: modalStyles.width,
    maxWidth: modalStyles.maxWidth,
    borderRadius: `${modalStyles.borderTopLeftRadius} / ${modalStyles.borderBottomLeftRadius}`,
    hasModalStyleOverride: Object.keys(modalStyle).length > 0,
    modalStyleWasApplied: isMobileBrowser ? 'NO (blocked for mobile)' : 'YES',
    modalStyleOverride: modalStyle
  });
  
  // Warn if modalStyle is trying to override on mobile browser
  if (isMobileBrowser && modalStyle && Object.keys(modalStyle).length > 0) {
    console.warn('[Onairos SDK][ModalPageLayout] ⚠️ BLOCKED modalStyle override on mobile browser. Ignoring:', modalStyle);
  }

  // 🔍 Layout debug logging (desktop vs native)
  try {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const isDesktop = width >= 1024 && !isCapacitorNative;
      // Only spam logs in desktop where sizing issues occur
      if (isDesktop) {
        // Keep this fairly compact but detailed
        console.log('[Onairos SDK][Layout][ModalPageLayout]', {
          width,
          isCapacitorNative,
          modalClassName,
          modalStyleKeys: Object.keys(modalStyle || {}),
          backdropStyleKeys: Object.keys(backdropStyle || {}),
          modalMaxWidth: modalStyles.maxWidth,
          modalMinHeight: modalStyles.minHeight,
          modalHeight: modalStyles.height,
        });
      }
    }
  } catch (e) {
    // Never let logging break rendering
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      console.log('🔘 Backdrop clicked outside modal');
      if (onBackdropClick) {
        console.log('📞 Calling onBackdropClick handler');
        onBackdropClick();
      } else if (onClose) {
        console.log('❌ Calling onClose handler');
        onClose();
      }
    }
  };

  return (
    <div 
      style={backdropStyles} 
      onClick={handleBackdropClick}
      data-onairos-backdrop="true"
      data-mobile-browser={isMobileBrowser ? 'true' : 'false'}
      data-capacitor-native={isCapacitorNative ? 'true' : 'false'}
    >
      <div 
        style={modalStyles} 
        className={modalClassName}
        onClick={(e) => e.stopPropagation()}
        data-onairos-modal="true"
        data-mobile-browser={isMobileBrowser ? 'true' : 'false'}
        data-modal-height={modalStyles.height}
      >
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
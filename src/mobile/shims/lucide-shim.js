/**
 * Lucide React Shim for React Native
 * 
 * This file provides mock implementations of lucide-react icons for React Native compatibility.
 * In a real implementation, you would replace these with appropriate React Native icon components.
 */

import React from 'react';

// Create a base icon component for React Native
const BaseIcon = ({ size = 24, color = 'currentColor', children, ...props }) => {
  // For React Native we'll just provide a simple implementation
  // This would be replaced with a proper RN svg or icon component
  return React.createElement('div', {
    style: { 
      width: size, 
      height: size, 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
      ...props.style 
    },
    ...props
  }, children || '□');
};

// Create mock implementations of commonly used Lucide icons
const ChevronRight = (props) => React.createElement(BaseIcon, props, '▶');
const ChevronLeft = (props) => React.createElement(BaseIcon, props, '◀');
const ChevronDown = (props) => React.createElement(BaseIcon, props, '▼');
const ChevronUp = (props) => React.createElement(BaseIcon, props, '▲');
const X = (props) => React.createElement(BaseIcon, props, '✕');
const Check = (props) => React.createElement(BaseIcon, props, '✓');
const Menu = (props) => React.createElement(BaseIcon, props, '☰');
const Settings = (props) => React.createElement(BaseIcon, props, '⚙');
const User = (props) => React.createElement(BaseIcon, props, '👤');
const Lock = (props) => React.createElement(BaseIcon, props, '🔒');
const Unlock = (props) => React.createElement(BaseIcon, props, '🔓');

// Adding the missing icons reported in build warnings
const Shield = (props) => React.createElement(BaseIcon, props, '🛡️');
const AlertCircle = (props) => React.createElement(BaseIcon, props, '⚠️');
const Send = (props) => React.createElement(BaseIcon, props, '📤');
const ExternalLink = (props) => React.createElement(BaseIcon, props, '🔗');

// Export all mock icons
export {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Menu,
  Settings,
  User,
  Lock,
  Unlock,
  // New exports for the missing icons
  Shield,
  AlertCircle,
  Send,
  ExternalLink
};

// Export a default object with all icons to mimic lucide-react's structure
export default {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Menu,
  Settings,
  User,
  Lock,
  Unlock,
  // Add the new icons to the default export
  Shield,
  AlertCircle,
  Send,
  ExternalLink
};

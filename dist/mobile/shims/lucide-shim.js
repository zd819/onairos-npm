"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.X = exports.User = exports.Unlock = exports.Shield = exports.Settings = exports.Send = exports.Menu = exports.Lock = exports.ExternalLink = exports.ChevronUp = exports.ChevronRight = exports.ChevronLeft = exports.ChevronDown = exports.Check = exports.AlertCircle = void 0;
var _react = _interopRequireDefault(require("react"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Lucide React Shim for React Native
 * 
 * This file provides mock implementations of lucide-react icons for React Native compatibility.
 * In a real implementation, you would replace these with appropriate React Native icon components.
 */

// Create a base icon component for React Native
const BaseIcon = _ref => {
  let {
    size = 24,
    color = 'currentColor',
    children,
    ...props
  } = _ref;
  // For React Native we'll just provide a simple implementation
  // This would be replaced with a proper RN svg or icon component
  return /*#__PURE__*/_react.default.createElement('div', {
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
const ChevronRight = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '▶');
exports.ChevronRight = ChevronRight;
const ChevronLeft = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '◀');
exports.ChevronLeft = ChevronLeft;
const ChevronDown = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '▼');
exports.ChevronDown = ChevronDown;
const ChevronUp = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '▲');
exports.ChevronUp = ChevronUp;
const X = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '✕');
exports.X = X;
const Check = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '✓');
exports.Check = Check;
const Menu = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '☰');
exports.Menu = Menu;
const Settings = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '⚙');
exports.Settings = Settings;
const User = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '👤');
exports.User = User;
const Lock = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '🔒');
exports.Lock = Lock;
const Unlock = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '🔓');

// Adding the missing icons reported in build warnings
exports.Unlock = Unlock;
const Shield = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '🛡️');
exports.Shield = Shield;
const AlertCircle = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '⚠️');
exports.AlertCircle = AlertCircle;
const Send = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '📤');
exports.Send = Send;
const ExternalLink = props => /*#__PURE__*/_react.default.createElement(BaseIcon, props, '🔗');

// Export all mock icons
exports.ExternalLink = ExternalLink;
// Export a default object with all icons to mimic lucide-react's structure
var _default = exports.default = {
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
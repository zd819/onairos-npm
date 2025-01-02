"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SecuritySetup;
var _react = _interopRequireWildcard(require("react"));
var _framerMotion = require("framer-motion");
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function SecuritySetup(_ref) {
  let {
    onComplete
  } = _ref;
  const [pin, setPin] = (0, _react.useState)('');
  const [securityMethod, setSecurityMethod] = (0, _react.useState)(null);
  const [pinRequirements, setPinRequirements] = (0, _react.useState)({
    length: false,
    capital: false,
    number: false,
    symbol: false
  });
  (0, _react.useEffect)(() => {
    // Check PIN requirements
    setPinRequirements({
      length: pin.length >= 8,
      capital: /[A-Z]/.test(pin),
      number: /[0-9]/.test(pin),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(pin)
    });
  }, [pin]);
  const allRequirementsMet = Object.values(pinRequirements).every(req => req);
  const handlePinSubmit = async () => {
    if (allRequirementsMet) {
      // Here you would typically hash the PIN and store it
      onComplete({
        method: 'pin',
        value: pin
      });
    }
  };
  const handleOthentSetup = () => {
    onComplete({
      method: 'othent'
    });
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_framerMotion.motion.div, {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0
    },
    className: "flex flex-col items-center space-y-6 p-6",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
      className: "text-xl font-semibold text-gray-900",
      children: "Secure Your Account"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
      className: "text-gray-600 text-center",
      children: "Choose how you want to secure your data"
    }), !securityMethod ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "grid grid-cols-1 gap-4 w-full max-w-md",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)(_framerMotion.motion.button, {
        whileHover: {
          scale: 1.02
        },
        whileTap: {
          scale: 0.98
        },
        onClick: () => setSecurityMethod('othent'),
        className: "flex items-center justify-center p-6 rounded-lg border border-gray-300 hover:border-blue-500 bg-white",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: "https://onairos.sirv.com/Images/othent-icon.png",
          alt: "Othent",
          className: "w-8 h-8 mr-3"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-gray-700",
          children: "Secure with Google (Othent)"
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_framerMotion.motion.button, {
        whileHover: {
          scale: 1.02
        },
        whileTap: {
          scale: 0.98
        },
        onClick: () => setSecurityMethod('pin'),
        className: "flex items-center justify-center p-6 rounded-lg border border-gray-300 hover:border-blue-500 bg-white",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "material-icons mr-3",
          children: "lock"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-gray-700",
          children: "Set up PIN"
        })]
      })]
    }) : securityMethod === 'pin' ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_framerMotion.motion.div, {
      initial: {
        opacity: 0
      },
      animate: {
        opacity: 1
      },
      className: "w-full max-w-md space-y-4",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        type: "password",
        value: pin,
        onChange: e => setPin(e.target.value),
        placeholder: "Enter your PIN",
        className: "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "space-y-2",
        children: Object.entries(pinRequirements).map(_ref2 => {
          let [req, met] = _ref2;
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: `material-icons text-sm ${met ? 'text-green-500' : 'text-gray-400'}`,
              children: met ? 'check_circle' : 'radio_button_unchecked'
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: `ml-2 text-sm ${met ? 'text-green-600' : 'text-gray-600'}`,
              children: req === 'length' ? 'At least 8 characters' : req === 'capital' ? 'One capital letter' : req === 'number' ? 'One number' : 'One special character'
            })]
          }, req);
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        onClick: handlePinSubmit,
        disabled: !allRequirementsMet,
        className: `w-full py-3 px-4 rounded-lg font-semibold ${allRequirementsMet ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`,
        children: "Set PIN"
      })]
    }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_framerMotion.motion.div, {
      initial: {
        opacity: 0
      },
      animate: {
        opacity: 1
      },
      className: "w-full max-w-md",
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        onClick: handleOthentSetup,
        className: "w-full py-3 px-4 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600",
        children: "Continue with Othent"
      })
    })]
  });
}
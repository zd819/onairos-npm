"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = OthentButton;
var _react = require("react");
var _kms = require("@othent/kms");
var _getPin = _interopRequireDefault(require("../getPin"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; } // Dynamic import for crypto-js's sha256
const loadSha256 = async () => {
  const module = await Promise.resolve().then(() => _interopRequireWildcard(require( /* webpackChunkName: "sha256" */'crypto-js/sha256')));
  return module.default;
};
function OthentButton(_ref) {
  let {
    onSuccess,
    onLoginSuccess
  } = _ref;
  const [loading, setLoading] = (0, _react.useState)(false);
  const handleOthentLogin = async () => {
    setLoading(true);
    try {
      const appInfo = {
        name: "Onairos",
        version: "1.0.0",
        env: "production"
      };
      const getCallbackURL = () => {
        // Dynamically determine the base URL
        const baseUrl = window.location.origin; // e.g., https://internship.onairos.uk
        return `${baseUrl}/onairos-callback`;
      };
      const othent = new _kms.Othent({
        appInfo,
        throwErrors: false,
        auth0LogInMethod: "redirect",
        auth0RedirectURI: window.location.href,
        // The current page URL for redirection after login
        auth0ReturnToURI: window.location.href // Same for logout
      });
      const userDetails = await othent.connect();
      if (!userDetails) {
        throw new Error('Othent connection failed');
      }

      // Get hashed sub and pin
      const sha256 = await loadSha256();
      const hashedOthentSub = sha256(userDetails.sub).toString();
      const encryptedPin = (await (0, _getPin.default)(hashedOthentSub)).pin;
      onLoginSuccess(await (0, _getPin.default)(hashedOthentSub)).username;

      // Call onSuccess with Othent details
      await onSuccess({
        type: 'othent',
        encryptedPin: encryptedPin,
        hashedOthentSub: hashedOthentSub,
        userDetails
      });
    } catch (error) {
      console.error('Othent login failed:', error);
    } finally {
      setLoading(false);
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex flex-col items-center",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
      onClick: handleOthentLogin,
      disabled: loading,
      className: "w-12 h-12 rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-center bg-white",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: "https://imagepng.org/google-icone-icon/google-icon/" // Replace with actual Othent icon
        ,
        alt: "Othent",
        className: "w-6 h-6"
      }), loading && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-full",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"
        })
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
      className: "text-xs mt-2 text-gray-600",
      children: "Google"
    })]
  });
}
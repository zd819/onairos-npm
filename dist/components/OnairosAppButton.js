"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = OnairosAppButton;
var _react = require("react");
var _biometrics = require("../utils/biometrics");
var _jsxRuntime = require("react/jsx-runtime");
function OnairosAppButton(_ref) {
  let {
    onLoginSuccess
  } = _ref;
  const [loading, setLoading] = (0, _react.useState)(false);
  const verifySavedCredentials = async () => {
    const savedCredentials = localStorage.getItem('onairosCredentials');
    if (!savedCredentials) return null;
    try {
      const credentials = JSON.parse(savedCredentials);
      const response = await fetch('https://api2.onairos.uk/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: credentials.username,
          token: credentials.token
        })
      });
      if (!response.ok) {
        localStorage.removeItem('onairosCredentials');
        return null;
      }
      return credentials;
    } catch (error) {
      console.error('Verification failed:', error);
      return null;
    }
  };
  const handleAppLogin = async () => {
    setLoading(true);
    try {
      const credentials = await verifySavedCredentials();
      if (credentials) {
        const isAuthenticated = await (0, _biometrics.authenticateWithBiometrics)();
        if (isAuthenticated) {
          await onLoginSuccess(credentials.username);
          return;
        }
      }

      // If no credentials or biometrics failed, launch app
      const nonce = Date.now();
      const returnLink = encodeURIComponent(window.location.origin + '/auth/callback');
      const onairosUrl = `onairos://authenticate?nonce=${nonce}&callback=${returnLink}&appName=google`;
      window.location.href = onairosUrl;

      // Fallback to app store after timeout
      setTimeout(() => {
        window.location.href = 'https://apps.apple.com/app/onairos/id123456789';
      }, 2500);
    } catch (error) {
      console.error('App login failed:', error);
    } finally {
      setLoading(false);
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex flex-col items-center",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      onClick: handleAppLogin,
      disabled: loading,
      className: "w-12 h-12 rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-center bg-white",
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: "https://onairos.sirv.com/Images/OnairosBlack.png",
        alt: "Onairos",
        className: "w-6 h-6"
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
      className: "text-xs mt-2 text-gray-600",
      children: "Login with App"
    })]
  });
}
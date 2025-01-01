"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = GoogleButton;
var _google = require("@react-oauth/google");
var _jwtDecode = require("jwt-decode");
var _jsxRuntime = require("react/jsx-runtime");
function GoogleButton(_ref) {
  let {
    onLoginSuccess
  } = _ref;
  const handleGoogleSuccess = async credentialResponse => {
    try {
      const decoded = (0, _jwtDecode.jwtDecode)(credentialResponse.credential);
      const response = await fetch('https://api2.onairos.uk/login/google-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
          email: decoded.email
        })
      });
      if (!response.ok) {
        throw new Error('Google authentication failed');
      }
      const data = await response.json();
      localStorage.setItem('onairosToken', data.token);
      await onLoginSuccess(decoded.email);
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex flex-col items-center",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_google.GoogleLogin, {
      onSuccess: handleGoogleSuccess,
      onError: () => console.error('Google Login Failed'),
      shape: "circle",
      theme: "outline"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
      className: "text-xs mt-2 text-gray-600",
      children: "Google"
    })]
  });
}
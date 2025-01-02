"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SignUp;
var _react = _interopRequireWildcard(require("react"));
var _google = require("@react-oauth/google");
var _AuthButtons = _interopRequireDefault(require("./AuthButtons"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function SignUp(_ref) {
  let {
    onSignUpSuccess,
    setOthent,
    setHashedOthentSub,
    setEncryptedPin
  } = _ref;
  const [formData, setFormData] = (0, _react.useState)({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = (0, _react.useState)(null);
  const handleInputChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    try {
      const response = await fetch('https://api2.onairos.uk/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password
        })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('onairosToken', data.token);
        localStorage.setItem('username', formData.username);
        onSignUpSuccess(formData.username);
      } else {
        setError(data.message || 'Sign up failed');
      }
    } catch (error) {
      setError('Sign up failed. Please try again.');
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex flex-col items-center justify-start max-w-sm mx-auto space-y-6 pt-4",
    children: [error && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg",
      children: error
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_AuthButtons.default, {
      onLoginSuccess: onSignUpSuccess,
      setOthent: setOthent,
      setHashedOthentSub: setHashedOthentSub,
      setEncryptedPin: setEncryptedPin
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "w-full flex items-center justify-center space-x-4",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("hr", {
        className: "flex-grow border-gray-300"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-gray-500",
        children: "or"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("hr", {
        className: "flex-grow border-gray-300"
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("form", {
      onSubmit: handleSubmit,
      className: "w-full space-y-4",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        type: "email",
        name: "email",
        value: formData.email,
        onChange: handleInputChange,
        placeholder: "Email",
        className: "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        type: "text",
        name: "username",
        value: formData.username,
        onChange: handleInputChange,
        placeholder: "Username",
        className: "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        type: "password",
        name: "password",
        value: formData.password,
        onChange: handleInputChange,
        placeholder: "Password",
        className: "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        type: "password",
        name: "confirmPassword",
        value: formData.confirmPassword,
        onChange: handleInputChange,
        placeholder: "Confirm Password",
        className: "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        type: "submit",
        className: "w-full bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors",
        children: "Sign Up"
      })]
    })]
  });
}
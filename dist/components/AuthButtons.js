"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AuthButtons;
var _react = require("react");
var _GoogleButton = _interopRequireDefault(require("./GoogleButton"));
var _OnairosAppButton = _interopRequireDefault(require("./OnairosAppButton"));
var _OthentButton = _interopRequireDefault(require("./OthentButton"));
var _jsxRuntime = require("react/jsx-runtime");
function AuthButtons(_ref) {
  let {
    onLoginSuccess,
    setOthent,
    setHashedOthentSub,
    setEncryptedPin
  } = _ref;
  const [hasSavedCredentials, setHasSavedCredentials] = (0, _react.useState)(false);
  (0, _react.useEffect)(() => {
    checkSavedCredentials();
  }, []);
  const checkSavedCredentials = async () => {
    const credentials = localStorage.getItem('onairosCredentials');
    setHasSavedCredentials(!!credentials);
  };
  const handleOthentSuccess = async othentData => {
    // Set Othent-specific state
    setOthent(true);
    setHashedOthentSub(othentData.hashedOthentSub);
    setEncryptedPin(othentData.encryptedPin);

    // Call general login success handler
    await onLoginSuccess(othentData.userDetails);
  };
  const othentLogin = async data => {
    onLoginSuccess(data, true);
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex flex-row justify-center items-center space-x-4",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_OthentButton.default, {
      onSuccess: handleOthentSuccess,
      onLoginSuccess: othentLogin
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_OnairosAppButton.default, {
      hasSavedCredentials: hasSavedCredentials,
      onSuccess: onLoginSuccess
    })]
  });
}
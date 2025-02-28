"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AuthButtons;
var _react = require("react");
var _OnairosAppButton = _interopRequireDefault(require("./OnairosAppButton.jsx"));
var _TestTelegramButton = _interopRequireDefault(require("./TestTelegramButton.js"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// import GoogleButton from './GoogleButton';

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
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_TestTelegramButton.default, {}), /*#__PURE__*/(0, _jsxRuntime.jsx)(_OnairosAppButton.default, {
      hasSavedCredentials: hasSavedCredentials,
      onSuccess: onLoginSuccess
    })]
  });
}
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BackButton = BackButton;
var _react = require("react");
var _sdkReact = require("@telegram-apps/sdk-react");
/**
 * Component which controls the Back Button visibility.
 */
function BackButton() {
  const isVisible = (0, _sdkReact.useSignal)(_sdkReact.backButton.isVisible);
  (0, _react.useEffect)(() => {
    console.log('The button is', isVisible ? 'visible' : 'invisible');
  }, [isVisible]);
  (0, _react.useEffect)(() => {
    _sdkReact.backButton.show();
    return () => {
      _sdkReact.backButton.hide();
    };
  }, []);
  return null;
}